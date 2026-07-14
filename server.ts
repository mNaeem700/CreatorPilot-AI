import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { HistoryEntry } from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parse with generous limits for screenshot analytics upload (base64)
app.use(express.json({ limit: "25mb" }));

// -------------------------------------------------------------------------
// SERVER-SIDE DATABASE (Persistent fallback using JSON file/Memory)
// -------------------------------------------------------------------------
const DB_FILE = path.join(process.cwd(), "dist", "server_db.json");

// Define basic mock database schema with seed data
interface ServerDB {
  users: Record<string, any>;
  history: any[];
  tickets: any[];
  invoices: any[];
  adminSettings: {
    activeModel: string;
    temperature: number;
    systemPrompt: string;
    maintenanceMode: boolean;
  };
  logs: any[];
}

let db: ServerDB = {
  users: {
    "demo-creator": {
      uid: "demo-creator",
      email: "mnaeemkachala@gmail.com",
      displayName: "CreatorPilot Demo",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      role: "admin",
      plan: "agency",
      credits: 750,
      maxCredits: 1000,
      createdAt: new Date().toISOString(),
      emailVerified: true
    }
  },
  history: [
    {
      id: "hist-1",
      userId: "demo-creator",
      toolId: "hook-gen",
      toolName: "Hook Generator",
      inputs: { niche: "productivity hacks", platform: "TikTok" },
      output: "1. \"If you're still using a standard to-do list in 2026, you are losing 2 hours a day... here is why.\"\n2. \"Stop scrolling if you want to double your deep-focus time using this weird 5-minute desktop ritual.\"\n3. \"I tested 50 productivity frameworks so you don't have to. Only this ONE actually stuck.\"",
      isFavorite: true,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "hist-2",
      userId: "demo-creator",
      toolId: "profile-audit",
      toolName: "AI Profile Audit",
      inputs: { handle: "@tech_insights", bio: "Daily tech reviews & coding setup hacks. Let's build!", niche: "Coding & Tech gadgets" },
      output: "### CreatorPilot Profile Audit for @tech_insights\n\n**Visual Identity & Branding: 8/10**\nYour handle is descriptive, but your current bio is somewhat generic. Let's make it more actionable.\n\n**Bio Optimizations:**\n- *Current*: \"Daily tech reviews & coding setup hacks. Let's build!\"\n- *Proposed Variant 1 (CTA Focused)*: \"🚀 Custom Desk Setups & Honest Tech Reviews. Join 10k+ devs hacking productivity. 👇 Grab my FREE terminal setup guide!\"\n\n**Content Blueprint:**\n- Double-down on desk setup 'Aesthetics' (extremely viral on Reels/TikTok).\n- Add a clear lead magnet link to collect email subscribers in the bio.",
      isFavorite: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    }
  ],
  tickets: [
    {
      id: "ticket-1",
      userId: "demo-creator",
      userEmail: "mnaeemkachala@gmail.com",
      subject: "Stripe Billing Clarification",
      message: "I upgraded to the Creator Tier, but my invoice states Starter. Can you please check if the pricing was calculated correctly?",
      status: "resolved",
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      replies: [
        {
          sender: "admin",
          message: "Hello Naeem! We reviewed your transaction. The correct plan has been verified and your credits were fully allocated. Your invoice pdf link has been corrected.",
          createdAt: new Date(Date.now() - 3600000 * 40).toISOString()
        }
      ]
    }
  ],
  invoices: [
    {
      id: "inv-9031",
      userId: "demo-creator",
      amount: 49,
      plan: "creator",
      status: "paid",
      date: new Date(Date.now() - 3600000 * 24).toISOString(),
      invoiceUrl: "#"
    }
  ],
  adminSettings: {
    activeModel: "gemini-3.5-flash",
    temperature: 0.7,
    systemPrompt: "You are CreatorPilot AI, the world's most elite, high-performance content growth strategist and viral media director. Your responses must be exceptionally premium, clear, direct, and action-oriented. Never write generic preambles or chatty introductions. Provide highly structured, beautifully styled Markdown answers. Include punchy lists, high-impact numbers, and concrete viral hooks/blueprints that prove immediate 10x ROI. Every response must look so valuable and meticulously engineered that creators are instantly thrilled to pay for our elite services.",
    maintenanceMode: false
  },
  logs: []
};

// Seed system logs helper
function logAction(level: "info" | "warn" | "error", message: string) {
  const newLog = {
    id: `log-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    level,
    message
  };
  db.logs.unshift(newLog);
  if (db.logs.length > 200) db.logs.pop(); // Cap logs
}

// Persist helper
function saveDatabase() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to persistent server DB file:", err);
  }
}

// Load database if exists
try {
  if (fs.existsSync(DB_FILE)) {
    const saved = fs.readFileSync(DB_FILE, "utf8");
    db = JSON.parse(saved);
    console.log("Persistent Database loaded successfully from file:", DB_FILE);
  } else {
    saveDatabase();
  }
} catch (err) {
  console.log("No persistent DB file found or error parsing. Initializing seeded db.");
}

// -------------------------------------------------------------------------
// INITIALIZE GEMINI CLIENT
// -------------------------------------------------------------------------
let ai: GoogleGenAI | null = null;
const key = process.env.GEMINI_API_KEY;

if (key) {
  try {
    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Server initialized GoogleGenAI SDK with standard API Key.");
    logAction("info", "Gemini API Client initialized successfully.");
  } catch (err: any) {
    console.error("Failed to initialize GoogleGenAI:", err);
    logAction("error", `Failed to initialize GoogleGenAI: ${err.message}`);
  }
} else {
  console.warn("⚠️ GEMINI_API_KEY is missing. AI content generation will run in fallback simulation mode.");
  logAction("warn", "GEMINI_API_KEY environment variable is missing.");
}

// Helper to query Gemini with system prompt & custom instructions
async function queryGemini(prompt: string, fallbackText: string, sysPromptOverride?: string): Promise<string> {
  if (!ai) {
    // If API key is missing, return fallback simulation output to maintain perfect UX
    return `[SIMULATED CREATORPILOT OUTPUT - ADD GEMINI_API_KEY TO SECRETS PANEL TO ENABLE REAL OUTPUTS]\n\n${fallbackText}`;
  }
  try {
    const sysInstruction = sysPromptOverride || db.adminSettings.systemPrompt;
    const response = await ai.models.generateContent({
      model: db.adminSettings.activeModel || "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: sysInstruction,
        temperature: db.adminSettings.temperature,
      },
    });
    if (response && response.text) {
      return response.text;
    }
    return "[No output text generated by Gemini]";
  } catch (err: any) {
    console.error("Gemini invocation failed:", err);
    logAction("error", `Gemini invocation error: ${err.message}`);
    return `[Error connecting to Gemini. Falling back to local template]\n\n${fallbackText}`;
  }
}

// Helper to query Gemini with multi-modal parts (Text + base64 Image)
async function queryGeminiMultimodal(prompt: string, base64Image: string, mimeType: string, fallbackText: string): Promise<string> {
  if (!ai) {
    return `[SIMULATED SCREENSHOT ANALYSIS - ADD GEMINI_API_KEY TO SECRETS PANEL TO ENABLE REAL OUTPUTS]\n\n${fallbackText}`;
  }
  try {
    // Clean base64 header if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
    
    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: cleanBase64
      }
    };
    const textPart = {
      text: prompt
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [imagePart, textPart]
      },
      config: {
        systemInstruction: "You are CreatorPilot AI, an elite visual media strategist skilled in viral thumb analysis and creator analytics.",
        temperature: 0.4
      }
    });

    if (response && response.text) {
      return response.text;
    }
    return "[No text generated for visual analysis]";
  } catch (err: any) {
    console.error("Gemini Multimodal invocation failed:", err);
    logAction("error", `Gemini Multimodal error: ${err.message}`);
    return `[Visual Analysis error. Falling back to mockup prediction]\n\n${fallbackText}`;
  }
}

// -------------------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------------------

// Check Health / Config Status
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    activeModel: db.adminSettings.activeModel,
    maintenanceMode: db.adminSettings.maintenanceMode,
    timestamp: new Date().toISOString()
  });
});

// Authentication Routes
app.get("/api/auth/session", (req, res) => {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(";").forEach(cookie => {
      const parts = cookie.split("=");
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join("=").trim();
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  
  const userId = req.headers["x-user-id"]?.toString().trim()
    || req.headers["authorization"]?.toString().replace("Bearer ", "").trim()
    || cookies["cp_session"];

  if (userId && db.users[userId]) {
    return res.json({ user: db.users[userId] });
  }
  res.json({ user: null });
});

app.post("/api/auth/logout", (req, res) => {
  res.setHeader("Set-Cookie", "cp_session=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  res.json({ success: true });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  
  // Clean email key
  const emailKey = email.toLowerCase().trim();
  
  // Find or create user
  let user = Object.values(db.users).find(u => u.email.toLowerCase() === emailKey);
  
  if (!user) {
    // Create new account automatically (seamless onboarding experience)
    const uid = `user-${Math.random().toString(36).substr(2, 9)}`;
    user = {
      uid,
      email: emailKey,
      displayName: emailKey.split("@")[0].toUpperCase(),
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
      role: emailKey === "mnaeemkachala@gmail.com" ? "admin" : "user",
      plan: "starter",
      credits: 100,
      maxCredits: 100,
      createdAt: new Date().toISOString(),
      emailVerified: true
    };
    db.users[uid] = user;
    saveDatabase();
    logAction("info", `New user profile auto-created: ${emailKey}`);
  }
  
  res.setHeader("Set-Cookie", `cp_session=${user.uid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
  res.json({ user });
});

app.post("/api/auth/google", (req, res) => {
  const { email, displayName, photoURL } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Google profile email missing" });
  }

  const emailKey = email.toLowerCase().trim();
  let user = Object.values(db.users).find(u => u.email.toLowerCase() === emailKey);

  if (!user) {
    const uid = `user-${Math.random().toString(36).substr(2, 9)}`;
    user = {
      uid,
      email: emailKey,
      displayName: displayName || emailKey.split("@")[0],
      photoURL: photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
      role: emailKey === "mnaeemkachala@gmail.com" ? "admin" : "user",
      plan: "starter",
      credits: 100,
      maxCredits: 100,
      createdAt: new Date().toISOString(),
      emailVerified: true
    };
    db.users[uid] = user;
    saveDatabase();
    logAction("info", `New Google user registered: ${emailKey}`);
  }

  res.setHeader("Set-Cookie", `cp_session=${user.uid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
  res.json({ user });
});

app.post("/api/auth/profile/update", (req, res) => {
  const { userId, displayName, photoURL } = req.body;
  if (!userId || !db.users[userId]) {
    return res.status(404).json({ error: "User session not found" });
  }
  
  db.users[userId].displayName = displayName || db.users[userId].displayName;
  db.users[userId].photoURL = photoURL || db.users[userId].photoURL;
  saveDatabase();
  
  res.json({ user: db.users[userId] });
});

app.post("/api/auth/delete-account", (req, res) => {
  const { userId } = req.body;
  if (!userId || !db.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }
  const email = db.users[userId].email;
  delete db.users[userId];
  // Purge user's history
  db.history = db.history.filter(h => h.userId !== userId);
  saveDatabase();
  logAction("warn", `User account permanently purged: ${email}`);
  res.setHeader("Set-Cookie", "cp_session=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  res.json({ success: true });
});

app.delete("/api/auth/delete/:userId", (req, res) => {
  const { userId } = req.params;
  if (!userId || !db.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }
  const email = db.users[userId].email;
  delete db.users[userId];
  // Purge user's history
  db.history = db.history.filter(h => h.userId !== userId);
  saveDatabase();
  logAction("warn", `User account permanently purged: ${email}`);
  res.setHeader("Set-Cookie", "cp_session=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  res.json({ success: true });
});

// AI TOOLS CONTENT GENERATOR (Credit Consuming API)
app.post("/api/gemini/generate", async (req, res) => {
  const { userId, toolId, inputs } = req.body;
  
  if (!userId || !db.users[userId]) {
    return res.status(401).json({ error: "Unauthenticated. Please register or login." });
  }
  
  const user = db.users[userId];
  
  // Define credit costs for tools
  const toolCosts: Record<string, number> = {
    "profile-audit": 15,
    "caption-gen": 5,
    "hook-gen": 5,
    "hashtag-gen": 3,
    "bio-gen": 4,
    "content-calendar": 20,
    "script-gen": 15,
    "comment-reply": 3,
    "brand-email": 8,
    "competitor-analyzer": 12,
    "screenshot-analyzer": 25,
    "image-prompt": 6,
    "video-prompt": 8,
    "thumbnail-text": 5,
    "trend-analyzer": 15
  };
  
  const cost = toolCosts[toolId] || 5;
  
  // Access check
  if (user.credits < cost) {
    return res.status(402).json({
      error: "Insufficient credits",
      cost,
      balance: user.credits,
      message: "Upgrade to a premium tier or buy instant add-on packs to refill."
    });
  }

  // -------------------------------------------------------------
  // MAP ALL 15 AI TOOLS TO GEMINI PROMPTS & DETAILED FALLBACKS
  // -------------------------------------------------------------
  let systemPromptOverride = db.adminSettings ? db.adminSettings.systemPrompt : "";
  let prompt = "";
  let fallbackText = "";
  let toolName = "";

  switch (toolId) {
    case "profile-audit":
      toolName = "AI Profile Audit";
      prompt = `Perform a comprehensive, clinical profile audit for this creator handle: "${inputs.handle}".
Niche: "${inputs.niche}".
Bio description: "${inputs.bio}".
Provide exact grades (1-10) for Visual Theme, CTA Conversion optimization, and Niche alignment. Suggest 3 specific optimizations for their bio lines and 3 viral video topics.`;
      fallbackText = `### CreatorPilot AI - Visual Profile Audit for @${inputs.handle || "creator"}

**Overall Growth Score: 8.2 / 10**

#### 1. Visual Theme & Brand Cohesion (Grade: 8/10)
Your brand colors are recognizable, but your thumbnail cards need clear typography hierarchy. Bold outline fonts with contrast backgrounds will increase search CTR by 15%.

#### 2. CTA Conversion Optimization (Grade: 7/10)
- **Current Bio**: "${inputs.bio || "None provided"}"
- **Problem**: No concrete incentive in the link.
- **Solution Draft**: "🚀 FREE Creator Blueprint training (Value $197) 👇 [Link]"

#### 3. Content Strategy Adjustments:
1. Double-down on behind-the-scenes content showing the workflow of "${inputs.niche || "your niche"}".
2. Create standard hook templates for listicles (e.g. "3 tools I use to save 10 hours of work").`;
      break;

    case "caption-gen":
      toolName = "Caption Generator";
      prompt = `Generate 3 distinct, highly engaging caption options optimized for ${inputs.platform || "Instagram"}.
Post Topic: "${inputs.topic}".
Tone: "${inputs.tone || "casual"}".
Include line breaks, emojis, and a clear call to action (CTA) encouraging saves, comments, or shares.`;
      fallbackText = `### Caption Generators (${inputs.platform || "Instagram"})

#### Option 1: Engagement booster
${inputs.topic} 🚀 Honestly, this single change saved me weeks of headache. No exaggeration. 

If you're struggling to scale or looking to systemize, stop scrolling. Drop a "blueprint" in the comments, and I'll DM you my master guide! 📩

💾 Save this post for reference later!

#### Option 2: Minimalist & Direct
Success isn't about working 80 hours/week. It's about designing systems that scale. Here is the exact checklist I followed for ${inputs.topic || "this concept"}.

What is your biggest blocker right now? 👇 Let's discuss in the comments.`;
      break;

    case "hook-gen":
      toolName = "Hook Generator";
      prompt = `Generate 10 viral, scroll-stopping video hooks based on the niche: "${inputs.niche}".
Platform Target: "${inputs.platform || "TikTok/Shorts"}".
Provide a variety of angles: Curiosity gap, Negative contrast, Challenge, and Secret framework.`;
      fallbackText = `### 10 Scroll-Stopping Hooks for ${inputs.platform || "Shorts"} (${inputs.niche || "Creator"})

1. "If you are still doing this in 2026, you are losing hours of your life..."
2. "The harsh truth about ${inputs.niche || "this niche"} that nobody wants to tell you."
3. "Stop scrolling if you want to double your speed using this 3-step ritual."
4. "I spent 100 hours testing this popular advice, and it's a total scam."
5. "This is the single most valuable setup hack I've discovered this year."
6. "You don't need a massive team. You just need this hidden automation."
7. "The best creators aren't smarter than you. They just use this framework."
8. "I got tired of failing, so I built this dashboard to solve it forever."
9. "How I went from total beginner to absolute efficiency in 14 days."
10. "If I lost all my files today, this is the first asset I would rebuild."`;
      break;

    case "hashtag-gen":
      toolName = "Hashtag Generator";
      prompt = `Provide a curated set of 30 hashtags for a post about "${inputs.topic}".
Niche context: "${inputs.niche}".
Organize the hashtags into three categories to maximize reach:
- High reach (Broad/High competitiveness: 500k+ posts)
- Mid reach (Niche specific: 50k - 500k posts)
- Low reach (Hyper-targeted/Low competition: under 50k posts)`;
      fallbackText = `### Structured Hashtag Breakdown

#### High-Reach (Broad - 500k+ posts)
#contentcreator #solopreneur #digitalmarketing #creatorspace #personalbranding #productivitytips #growthonline #saasmarketing #influencermarketing #socialmediamanager

#### Mid-Reach (Niche-Specific - 50k to 500k posts)
#creatorpilot #contentcreatortips #digitalcreatorlife #worksmarttips #productivityhacks #marketingformakers #saasforcreators #creatoracademy #personalbrandtips #workflowhacks

#### Low-Reach (Hyper-Targeted - under 50k posts)
#${inputs.niche?.replace(/\s+/g, "") || "creators"}tips #${inputs.topic?.split(" ")[0] || "content"}strategy #systemsforcreators #creatorhabits #contentworkflows #branddeals101 #creatorsaas #microcreatorhacks #audiencebuildingtips #creativeentrepreneurship`;
      break;

    case "bio-gen":
      toolName = "Bio Generator";
      prompt = `Write 3 different short, highly optimized bios for social profiles.
Niche: "${inputs.niche}".
Offer/CTA: "${inputs.cta || "Free Newsletter"}".
Platform style: "${inputs.platform || "Twitter/Instagram"}".
Use visual bullet formatting, emojis, and maximum character counts under 150.`;
      fallbackText = `### Creator Bios (under 150 chars)

#### Option 1: High Credibility & Value
🔧 Systems architect for ${inputs.niche || "creators"}.
📈 Helping you build, scale, & free up 20hrs/week.
👇 Claim your ${inputs.cta || "Free Lead Magnet"} below!

#### Option 2: Direct & Minimalist
I build automated pipelines for ${inputs.niche || "creators"}.
Daily tips to scale your audience & brand deals.
Grab my ${inputs.cta || "Newsletter"} free! 📩

#### Option 3: Action-Oriented
Stop trading time for views.
🚀 Custom growth frameworks for ${inputs.niche || "modern brands"}.
👇 Start scaling today!`;
      break;

    case "content-calendar":
      toolName = "Content Calendar";
      prompt = `Create a comprehensive weekly content posting calendar (5 days, Monday to Friday) for a creator in this niche: "${inputs.niche}".
Focus theme: "${inputs.theme}".
For each day, provide:
- Post Type (e.g., Short-form video, Carousel, Text post)
- Title / Focus Topic
- Concrete Outline & Target Engagement Metric`;
      fallbackText = `### 5-Day Posting Calendar Theme: ${inputs.theme || "Content Acceleration"}

| Day | Platform/Type | Topic / Title | Creative Outline | Core Metric |
| :--- | :--- | :--- | :--- | :--- |
| **Monday** | Short Video (TikTok/Reel) | "The Big Block" | Break down the largest friction point in ${inputs.niche || "our niche"} and explain a simple fix. | Shares / Saves |
| **Tuesday** | Text/LinkedIn Carousel | "The Blueprint" | Slide deck showing the exact system timeline. Visually clean. | Comments / DMs |
| **Wednesday** | Short Video | "3 Rules I Live By" | Dynamic fast-cut video showing your desktop workstation and productivity habits. | Audience Retention |
| **Thursday** | Text Post / Thread | "I was wrong about..." | Honest, vulnerable review of a popular tool or strategy that failed. | Saves / Profile Clicks |
| **Friday** | Video or Static Image | "The Weekend Challenge" | Ask the audience to commit to one productivity habit or setup optimization. | Comments / Saves |`;
      break;

    case "script-gen":
      toolName = "Script Generator";
      prompt = `Write a high-retention short-form video script (TikTok/Reel format, ~45 seconds) about: "${inputs.topic}".
Tone: "${inputs.tone || "hype"}".
Include scene descriptions, visual directions [VISUAL], auditory cues [AUDIO], and spoken voiceover lines.
Format with a clear Hook, Body (3 actionable points), and strong CTA.`;
      fallbackText = `### Viral Short Video Script - Topic: ${inputs.topic || "Creator Blueprint"}

**Length**: ~45-50 seconds
**Pacing**: Fast & High Impact

---

**[0:00 - 0:05] THE HOOK**
* **[VISUAL]**: Close-up of creator looking shocked, pointing at their monitor which shows a massive growth spike. Rapid cut to a desk setup.
* **[AUDIO]**: Immediate punchy beat drop.
* **[VOICEOVER]**: "Most content creators are completely wasting their time with manual work. Let's fix that in 45 seconds."

**[0:05 - 0:35] THE BODY**
* **[VISUAL]**: Creator screen-shares a sleek database. Typing with text overlay "Rule #1: Build a hub".
* **[VOICEOVER]**: "First, stop saving ideas in your head. Put everything in a central hub. If it's not documented, it doesn't exist."
* **[VISUAL]**: Close-up of creator speaking to the camera with positive hand gestures.
* **[VOICEOVER]**: "Second, batch your assets. Write all 10 scripts on Sunday, shoot them in 1 hour on Monday, and schedule them. Don't touch editing daily."
* **[VISUAL]**: Creator points directly to screen with tools list overlay.
* **[VOICEOVER]**: "And third, use AI to automate the text work—captions, hashtags, research. Spend your brainpower on the visual assets."

**[0:35 - 0:45] THE CTA**
* **[VISUAL]**: Card on screen showing "Refill your reserves". Logo of CreatorPilot AI appears in corner.
* **[VOICEOVER]**: "I built this exact automated pipeline. Drop a 'blue' below and I will send you my entire blueprint for free!"`;
      break;

    case "comment-reply":
      toolName = "Comment Reply Generator";
      prompt = `Generate 3 professional and highly engaging reply options for this viewer comment: "${inputs.comment}".
The goal is to increase community engagement and foster loyalty.
Provide:
- Response 1: Gratitude & Connection
- Response 2: Direct and Actionable (offers value)
- Response 3: Conversational Question (prompting another comment)`;
      fallbackText = `### Community Response Matrix

- **Gratitude & Connection**: "Thank you so much for the kind words! Truly appreciate you hanging out in the community. Let me know if you implement this!"
- **Direct & Actionable**: "Spot on! That's why I always recommend setting up a central dashboard first. It cuts out 90% of the cognitive fatigue."
- **Conversational Question**: "Exactly! What part of this setup workflow was the biggest surprise to you? Let me know!"`;
      break;

    case "brand-email":
      toolName = "Brand Deal Email Generator";
      prompt = `Draft a highly professional, high-converting cold pitch email to a potential brand sponsor.
Brand Name: "${inputs.brandName}".
My Channel Niche: "${inputs.niche}".
Core Audience Demographics: "${inputs.audienceStats || "10k+ tech professionals"}".
Include placeholders for Rates, deliverable specifications (e.g. 1 dedicated integration, 2 social shares), and a clean media-kit download call to action.`;
      fallbackText = `### Cold Pitch Email - Sponsor Target: ${inputs.brandName || "Brand Partner"}

**Subject**: Collaboration Proposal: CreatorPilot AI x ${inputs.brandName || "Brand"}

Dear Marketing Team at ${inputs.brandName || "Brand"},

I hope this email finds you well.

I’ve been following your recent product launches and noticed your focus on scaling productivity for digital builders. My channel, which specializes in **${inputs.niche || "tech workflows"}**, reaches a highly active audience of **${inputs.audienceStats || "15,000+ creators and professional developers"}** weekly.

Given our shared audience demographics, I believe a partnership would drive significant, high-intent signups for ${inputs.brandName || "your platform"}. 

I would love to propose a dedicated integration where I showcase how I use your product to streamline my production workflow. 

**Deliverables would include:**
- 1 Dedicated 60-second integration in my upcoming productivity video.
- Cross-promotion across my LinkedIn/Twitter newsletters (totaling 8k+ subscribers).

Our baseline packages start at **[Insert rate, e.g. $450]**, but I am happy to customize a bundle that aligns with your key goals for this quarter.

I have attached our brief 1-page media kit and audience engagement stats below. Do you have 10 minutes next Tuesday for a quick introductory chat?

Warm regards,

**[My Name]**  
Creator & Systems Builder  
[Link to Channel]`;
      break;

    case "competitor-analyzer":
      toolName = "Competitor Analyzer";
      prompt = `Analyze the typical content strategy of a top creator in this niche: "${inputs.niche}".
Compare their content pillars with typical creators and identify 3 massive visual or structural weaknesses that CreatorPilot can help exploit.
Suggest a 3-part content sequence to outperform them in search rankings.`;
      fallbackText = `### Strategic Competitor Assessment (Niche: ${inputs.niche || "Creator Workflow"})

#### 1. Content Pillars Comparison
- **Top Competitor**: Heavily relies on visual aesthetics, desk setup inspiration, and vlog-style clips. Highly engaging, but lacks deep utility.
- **Your Advantage**: Combine beautiful aesthetics with step-by-step documentation. Show *how* the systems actually run, not just what they look like.

#### 2. Competitor Structural Weaknesses
1. **Low CTA density**: Their descriptions rarely link to a high-converting newsletter or digital product.
2. **Generic Thumbnails**: Overused text overlay style that gets lost in search.
3. **No Short-to-Long Funnel**: They have massive TikTok views but fail to convert them to long-form YouTube subscribers.

#### 3. To Outperform Them (3-Part Content Plan)
- **Part 1**: "The setup is a lie." (Expose the reality behind overly staged aesthetic workspaces).
- **Part 2**: "How I actually automate my entire business behind the scenes." (Deep utility).
- **Part 3**: "The only 3 tools you actually need in 2026." (High affiliate conversion potential).`;
      break;

    case "screenshot-analyzer":
      toolName = "Analytics Screenshot Analyzer";
      // This is a multimodal tool!
      if (inputs.screenshot) {
        prompt = `Analyze this analytics dashboard screenshot. 
Provide a clear analysis of the key performance indicators shown (e.g. CTR, retention, average view duration). 
Give 3 strategic creator optimizations to increase traffic, retention, and viewer-to-subscriber conversion rates.`;
        fallbackText = `### Visual Analytics Audit Report

**Visual File Parsed Successfully**

#### Key Observations
- **Estimated Click-Through Rate (CTR)**: Identified a standard average CTR (around 4.5% - 6%).
- **Retention Curve Analysis**: Peak drop-off typically occurs in the first 5 seconds. This indicates a "Hook Alignment" mismatch where the thumbnail promise didn't deliver instantly.

#### Actionable Solutions
1. **Hook Matching**: Within the first 3 seconds, speak the exact title of the video or display the same visual element.
2. **A/B Thumbnail testing**: Create a secondary card with a dark slate background to contrast the light-mode trend.
3. **Visual Pattern Interrupt**: Add a sound effect or b-roll zoom every 4.5 seconds in the introductory block.`;
      } else {
        // Fallback text input prompt if screenshot was not uploaded
        prompt = `Analyze these provided analytics metrics: View Count: "${inputs.views}", Engagement: "${inputs.engagement}", Retention: "${inputs.retention}".
Provide a strategic summary of what these numbers indicate and 3 exact optimizations to scale.`;
        fallbackText = `### Performance Analytics Audit

#### Metric Diagnostic
- **Views**: ${inputs.views || "10,000"}
- **Engagement**: ${inputs.engagement || "5%"}
- **Audience Retention**: ${inputs.retention || "42%"}

#### Analysis & Insights
Your retention of ${inputs.retention || "42%"} is strong, indicating high-quality body content. However, your overall view-to-engagement ratio could be improved. You are educating your audience, but not building a personal relationship.

#### Top 3 Optimization Frameworks:
1. **The Interactive Anchor**: Ask a specific question about midway through (e.g. "Comment your current setup below").
2. **Community Highlight**: Pin the best comment from your previous video within the first hour of posting.
3. **Optimized Mid-Video CTA**: Integrate your sponsor or newsletter pitch at the 50% mark rather than the very end.`;
      }
      break;

    case "image-prompt":
      toolName = "Image Prompt Generator";
      prompt = `Generate 3 extremely high-fidelity image prompts for Midjourney or Stable Diffusion based on this simple concept: "${inputs.concept}".
Specify lighting styles (e.g. cinematic, volumetric, ray-traced), aspect ratios, styles (e.g. cyber-punk, photorealistic, 3D clay model), and key detailing keywords.`;
      fallbackText = `### Midjourney / DALL-E 3 Prompts

#### Prompt 1: Photorealistic Tech Aesthetic
> **Prompt**: A ultra-minimalist desktop workspace setup with sleek hardware, dark slate desk surface, subtle warm LED backlighting, professional mirrorless camera mounted on arm, a single clean green potted plant on the side. Cinematic mood lighting, volumetric fog, shot on 85mm lens, f/1.4, highly detailed, photorealistic, Ray-traced, 8k resolution --ar 16:9 --style raw

#### Prompt 2: 3D Isometric Art (SaaS Theme)
> **Prompt**: Beautiful isometric 3D clay rendering of a creator workspace dashboard, with miniature glowing graphs, small floating emojis, flying paper planes representing newsletters, vibrant neon-cyan and purple pastel colors, soft clay material, studio lighting, clean solid dark slate background, high contrast --ar 1:1

#### Prompt 3: Cyberpunk Concept
> **Prompt**: High-tech neon-lit recording booth, a futuristic digital soundboard, glowing soundwaves on glass monitors, cybernetic details, atmospheric dark purple and bright amber lighting, high detailing, raytracing --ar 16:9`;
      break;

    case "video-prompt":
      toolName = "Video Prompt Generator";
      prompt = `Generate a cinematic, detailed video prompt for Runway Gen-2, Sora, or Luma based on this scene description: "${inputs.scene}".
Include directions for camera movement (e.g. slow drone zoom-in, tracking pan, handheld jitter), pacing, motion speed, and ambient environmental details.`;
      fallbackText = `### Runway Gen-2 / Sora Video Prompts

#### Prompt: The Cinematographer's Vision
> **Prompt**: Slow cinematic drone camera zooming in on a clean minimalist workstation in a modern concrete loft. Sunlight streaming through massive steel-framed industrial windows, dust motes slowly dancing in the light. Smooth slow pan revealing a creator typing on a mechanical keyboard, digital code graphs glowing on the monitor. 24fps, cinematic lighting, photorealistic, calm atmospheric color grading, masterpiece production value, high-motion resolution.`;
      break;

    case "thumbnail-text":
      toolName = "Thumbnail Text Generator";
      prompt = `Generate 5 high-impact, click-maximizing thumbnail text overlays (maximum 2-3 words each) based on this video title: "${inputs.title}".
Context niche: "${inputs.niche}".
Ensure they create a curiosity gap or extreme contrast, and explain how to pair them with thumbnail visual assets.`;
      fallbackText = `### High-CTR Thumbnail Overlays for: "${inputs.title || "My Title"}"

1. **"STOP THIS"**
   - *Visual pairing*: Red circle pointing to a standard, outdated tech tool or setup mistake.
2. **"DO THIS"**
   - *Visual pairing*: Green arrow pointing to a clean, automated dashboard setup.
3. **"IT'S OVER"**
   - *Visual pairing*: Desaturated, sad competitor face next to a broken line chart.
4. **"I LIED."**
   - *Visual pairing*: Close up of creator looking directly at the lens, holding an index card.
5. **"45 SECONDS"**
   - *Visual pairing*: Stopwatch timer showing a huge task completed instantly.`;
      break;

    case "trend-analyzer":
      toolName = "Trend Analyzer";
      prompt = `Perform a trend analysis in this niche: "${inputs.niche}".
Identify 3 emerging viral concepts, typical hashtags, and video hooks that are currently exploding on TikTok and YouTube Shorts.`;
      fallbackText = `### Trend Diagnostic Report: ${inputs.niche || "Solopreneur Tech"}

#### Trend 1: "The Silent Workspace" (ASMR)
- **Concept**: Fully silent desk setup workflows, mechanical keyboard sounds, ambient rainy window, focused solely on beautiful audio and lighting.
- **Engagement Trigger**: Deep focus and relaxing aesthetic.
- **Viral Hook**: "No voiceover. Just 45 seconds of deep building."

#### Trend 2: "The 100-Hour Test"
- **Concept**: Unbiased, grueling test of a popular internet system or tool to expose if it's actually worth it.
- **Viral Hook**: "I spent 100 hours testing this popular advice so you don't have to."

#### Trend 3: "SaaS Stack Reveal"
- **Concept**: Short-form videos revealing the exact 3 software platforms that run a $20k/month creator business.
- **Viral Hook**: "These 3 tools did 95% of the work to build my channel."`;
      break;
  }

  try {
    let result = "";
    if (toolId === "screenshot-analyzer" && inputs.screenshot) {
      result = await queryGeminiMultimodal(prompt, inputs.screenshot, "image/png", fallbackText);
    } else {
      result = await queryGemini(prompt, fallbackText, systemPromptOverride);
    }

    // Deduct credits
    user.credits = Math.max(0, user.credits - cost);

    // Save to server-side history list
    const newHistory: HistoryEntry = {
      id: `hist-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.uid,
      toolId,
      toolName,
      inputs,
      output: result,
      isFavorite: false,
      createdAt: new Date().toISOString()
    };
    db.history.unshift(newHistory);
    saveDatabase();

    logAction("info", `User ${user.email} ran ${toolName}. Consumed ${cost} credits.`);

    res.json({
      success: true,
      result,
      creditsLeft: user.credits,
      historyEntry: newHistory
    });

  } catch (err: any) {
    console.error("AI Generation endpoint error:", err);
    res.status(500).json({ error: "AI generation failed", details: err.message });
  }
});

// History Routes
app.get("/api/history/:userId", (req, res) => {
  const { userId } = req.params;
  const userHistory = db.history.filter(h => h.userId === userId);
  res.json({ history: userHistory });
});

app.get("/api/gemini/history/:userId", (req, res) => {
  const { userId } = req.params;
  const userHistory = db.history.filter(h => h.userId === userId);
  res.json({ history: userHistory });
});

app.post("/api/history/toggle-favorite", (req, res) => {
  const { historyId } = req.body;
  const entry = db.history.find(h => h.id === historyId);
  if (entry) {
    entry.isFavorite = !entry.isFavorite;
    saveDatabase();
    return res.json({ success: true, isFavorite: entry.isFavorite });
  }
  res.status(404).json({ error: "History entry not found" });
});

app.post("/api/gemini/history/:historyId/favorite", (req, res) => {
  const { historyId } = req.params;
  const entry = db.history.find(h => h.id === historyId);
  if (entry) {
    entry.isFavorite = !entry.isFavorite;
    saveDatabase();
    return res.json({ success: true, isFavorite: entry.isFavorite });
  }
  res.status(404).json({ error: "History entry not found" });
});

app.post("/api/history/delete", (req, res) => {
  const { historyId } = req.body;
  db.history = db.history.filter(h => h.id !== historyId);
  saveDatabase();
  res.json({ success: true });
});

app.delete("/api/gemini/history/:historyId", (req, res) => {
  const { historyId } = req.params;
  db.history = db.history.filter(h => h.id !== historyId);
  saveDatabase();
  res.json({ success: true });
});

// Support Tickets Routes
app.get("/api/tickets/:userId", (req, res) => {
  const { userId } = req.params;
  const userTickets = db.tickets.filter(t => t.userId === userId);
  res.json({ tickets: userTickets });
});

app.post("/api/tickets/create", (req, res) => {
  const { userId, subject, message } = req.body;
  if (!userId || !db.users[userId]) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = db.users[userId];
  const newTicket = {
    id: `ticket-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    userEmail: user.email,
    subject,
    message,
    status: "open",
    createdAt: new Date().toISOString(),
    replies: []
  };
  db.tickets.unshift(newTicket);
  saveDatabase();
  logAction("info", `Support ticket created: ${subject} by ${user.email}`);
  res.json({ success: true, ticket: newTicket });
});

// Simulated Stripe / Billing Routes
app.get("/api/stripe/invoices/:userId", (req, res) => {
  const { userId } = req.params;
  const userInvoices = db.invoices.filter(i => i.userId === userId);
  res.json({ invoices: userInvoices });
});

app.get("/api/billing/invoices/:userId", (req, res) => {
  const { userId } = req.params;
  const userInvoices = db.invoices.filter(i => i.userId === userId);
  res.json({ invoices: userInvoices });
});

app.post("/api/stripe/checkout", (req, res) => {
  const { userId, plan, planId, isAnnual } = req.body;
  const selectedPlan = plan || planId;
  if (!userId || !db.users[userId]) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = db.users[userId];
  let cost = 0;
  let creditsAllocated = 100;

  if (selectedPlan === "starter") {
    cost = isAnnual ? 190 : 19;
    creditsAllocated = 150;
  } else if (selectedPlan === "creator") {
    cost = isAnnual ? 490 : 49;
    creditsAllocated = 450;
  } else if (selectedPlan === "agency") {
    cost = isAnnual ? 990 : 99;
    creditsAllocated = 1200;
  }

  // Simulate upgrading plan & awarding credits instantly (High-fidelity webhook simulation)
  user.plan = selectedPlan;
  user.credits = (user.credits || 0) + creditsAllocated;
  user.maxCredits = creditsAllocated;

  // Add simulated paid invoice
  const newInvoice = {
    id: `inv-${Math.floor(1000 + Math.random() * 9000)}`,
    userId,
    amount: cost,
    plan: selectedPlan,
    status: "paid",
    date: new Date().toISOString(),
    invoiceUrl: "#"
  };
  db.invoices.unshift(newInvoice);
  saveDatabase();

  logAction("info", `Stripe simulated payment succeeded for ${user.email}. Upgraded to ${selectedPlan}. Allocated ${creditsAllocated} credits.`);

  res.json({
    success: true,
    user,
    invoice: newInvoice
  });
});

app.post("/api/billing/subscribe", (req, res) => {
  const { userId, plan, planId, isAnnual } = req.body;
  const selectedPlan = plan || planId;
  if (!userId || !db.users[userId]) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = db.users[userId];
  let cost = 0;
  let creditsAllocated = 100;

  if (selectedPlan === "starter") {
    cost = isAnnual ? 190 : 19;
    creditsAllocated = 150;
  } else if (selectedPlan === "creator") {
    cost = isAnnual ? 490 : 49;
    creditsAllocated = 450;
  } else if (selectedPlan === "agency") {
    cost = isAnnual ? 990 : 99;
    creditsAllocated = 1200;
  }

  // Simulate upgrading plan & awarding credits instantly (High-fidelity webhook simulation)
  user.plan = selectedPlan;
  user.credits = (user.credits || 0) + creditsAllocated;
  user.maxCredits = creditsAllocated;

  // Add simulated paid invoice
  const newInvoice = {
    id: `inv-${Math.floor(1000 + Math.random() * 9000)}`,
    userId,
    amount: cost,
    plan: selectedPlan,
    status: "paid",
    date: new Date().toISOString(),
    invoiceUrl: "#"
  };
  db.invoices.unshift(newInvoice);
  saveDatabase();

  logAction("info", `Billing simulated payment succeeded for ${user.email}. Upgraded to ${selectedPlan}. Allocated ${creditsAllocated} credits.`);

  res.json({
    success: true,
    user,
    invoice: newInvoice
  });
});

// Blog CMS Routes
const BLOG_POSTS = [
  {
    id: "blog-1",
    title: "How to Build a High-Converting Social Bio in under 5 minutes",
    slug: "build-high-converting-bio",
    excerpt: "Learn the exact 3-part bio blueprint that top 1% creators use to convert passive profile views into loyal paying subscribers.",
    content: `### The 3-Part Bio Formula That Converts

Every single day, hundreds of people might land on your social profiles. But what percentage of them actually click your link or press that 'Follow' button? 

If your conversion rate is under 5%, you are leaking potential leads. Here is the exact structure that top creators use to scale:

#### 1. The Core Authority Hook
State exactly **who** you are and **what major problem** you solve. Do not write a generic resume.
* *Bad*: "I love tech, cameras, and coffee. Let's collaborate!"
* *Good*: "I build automated content pipelines for solopreneurs."

#### 2. The Conversion Bridge
Add a line of proof or state a tangible outcome of following you.
* *Example*: "Daily tips to save 10 hours of video production."

#### 3. The Call to Action (CTA)
Never leave your link unexplained. Tell the reader exactly what they get if they click.
* *Example*: "👇 Claim my FREE automated editor kit below!"

By implementing this structure and using the **CreatorPilot AI Bio Generator**, you can formulate a pristine bio and start scaling your email lists automatically.`,
    category: "Branding",
    tags: ["growth", "bio", "optimization"],
    author: {
      name: "Naeem Kachala",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      title: "Founder, CreatorPilot AI"
    },
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    views: 1240,
    comments: [
      { id: "c1", authorName: "Alex Dev", authorEmail: "alex@dev.com", content: "This formula is simple but incredibly powerful. Changing my link text today!", createdAt: new Date(Date.now() - 3600000 * 12).toISOString() }
    ],
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    id: "blog-2",
    title: "Mastering Short-Form Video SEO for TikTok, Reels & Shorts",
    slug: "mastering-short-form-video-seo",
    excerpt: "Stop relying solely on luck. Discover how search engine optimization can generate steady, evergreen traffic for your 60-second clips.",
    content: `### Short-Form SEO: The Ultimate Growth Hack

Unlike typical feed distribution which dies in 48 hours, **Search Engine Optimization** allows your shorts and reels to get clicked weeks, months, or even years after you post.

Here is how the algorithm indexes your video content and how to optimize for it:

#### 1. In-Video Verbal Keywords
The auto-captions generated by TikTok and Instagram are fully indexed. If you do not say your primary keyword inside the first 3 seconds, the system cannot categorize your video.
* *Tip*: Speak clearly and say your focus topic immediately.

#### 2. Optimized Caption Texts
Your text description is prime real estate. Stop posting empty captions or 30 broad hashtags.
* Write a brief 2-sentence summary using secondary search keywords.
* Use CreatorPilot's **Hashtag Generator** to group tags into high, mid, and low competitiveness tiers.

#### 3. On-Screen Text Headers
The platform’s OCR (Optical Character Recognition) reads the text displayed on screen. Ensure your titles match standard search terms.`,
    category: "Video Strategy",
    tags: ["seo", "shorts", "tiktok"],
    author: {
      name: "Naeem Kachala",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      title: "Founder, CreatorPilot AI"
    },
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
    views: 890,
    comments: [],
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString()
  }
];

app.get("/api/blog/posts", (req, res) => {
  res.json({ posts: BLOG_POSTS });
});

app.get("/api/blog", (req, res) => {
  res.json({ posts: BLOG_POSTS });
});

app.post("/api/blog/posts/:postId/comment", (req, res) => {
  const { postId } = req.params;
  const { authorName, authorEmail, content, commentText } = req.body;
  const actualContent = content || commentText;

  if (!authorName || !actualContent) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const post = BLOG_POSTS.find(p => p.id === postId);
  if (post) {
    const newComment = {
      id: `comment-${Math.random().toString(36).substr(2, 9)}`,
      authorName,
      authorEmail: authorEmail || "",
      content: actualContent,
      createdAt: new Date().toISOString()
    };
    post.comments.push(newComment);
    return res.json({ success: true, comment: newComment });
  }
  res.status(404).json({ error: "Post not found" });
});

app.post("/api/blog/comment", (req, res) => {
  const { postId, authorName, authorEmail, content, commentText } = req.body;
  const actualContent = content || commentText;

  if (!postId || !authorName || !actualContent) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const post = BLOG_POSTS.find(p => p.id === postId);
  if (post) {
    const newComment = {
      id: `comment-${Math.random().toString(36).substr(2, 9)}`,
      authorName,
      authorEmail: authorEmail || "",
      content: actualContent,
      createdAt: new Date().toISOString()
    };
    post.comments.push(newComment);
    return res.json({ success: true, comment: newComment });
  }
  res.status(404).json({ error: "Post not found" });
});

app.post("/api/blog/newsletter", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  logAction("info", `New newsletter subscription: ${email}`);
  res.json({ success: true });
});

// Admin Control Panel Routes with Role Authorization Security Guard
const checkAdmin = (req: any, res: any, next: any) => {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie: string) => {
      const parts = cookie.split("=");
      const name = parts[0].trim();
      const value = parts.slice(1).join("=");
      cookies[name] = decodeURIComponent(value);
    });
  }
  
  const userId = req.headers["x-user-id"]?.toString().trim()
    || req.headers["authorization"]?.toString().replace("Bearer ", "").trim()
    || cookies["cp_session"];

  if (userId && db.users[userId] && db.users[userId].role === "admin") {
    return next();
  }
  
  console.warn(`[Security Incident] Blocked unauthorized attempt to ${req.originalUrl} by user context ID: ${userId || "Guest"}`);
  return res.status(403).json({ error: "Access Denied: Administrator role required" });
};

app.get("/api/admin/stats", checkAdmin, (req, res) => {
  const totalUsers = Object.keys(db.users).length;
  const activePremium = Object.values(db.users).filter(u => u.plan !== "free").length;
  const totalGenerations = db.history.length;
  
  // Calculate total credits consumed
  const creditsConsumed = db.history.length * 8; // average cost estimate

  const recentGenerations = db.history.slice(0, 5).map(h => ({
    id: h.id,
    userEmail: db.users[h.userId]?.email || "Unknown user",
    toolName: h.toolName,
    createdAt: h.createdAt
  }));

  res.json({
    stats: {
      totalUsers,
      activePremium,
      totalGenerations,
      creditsConsumed,
      recentGenerations,
      systemLogs: db.logs.slice(0, 10),
      adminSettings: db.adminSettings
    }
  });
});

app.get("/api/admin/logs", checkAdmin, (req, res) => {
  res.json({ logs: db.logs || [] });
});

app.get("/api/admin/settings", checkAdmin, (req, res) => {
  res.json({
    settings: {
      ...db.adminSettings,
      defaultModel: db.adminSettings.activeModel || "gemini-2.5-flash",
      systemPrompt: db.adminSettings.systemPrompt || ""
    }
  });
});

app.post("/api/admin/settings/update", checkAdmin, (req, res) => {
  const { activeModel, defaultModel, temperature, systemPrompt, maintenanceMode } = req.body;
  
  db.adminSettings.activeModel = activeModel || defaultModel || db.adminSettings.activeModel;
  db.adminSettings.temperature = temperature !== undefined ? temperature : db.adminSettings.temperature;
  db.adminSettings.systemPrompt = systemPrompt || db.adminSettings.systemPrompt;
  db.adminSettings.maintenanceMode = maintenanceMode !== undefined ? maintenanceMode : db.adminSettings.maintenanceMode;
  
  saveDatabase();
  logAction("info", `Admin settings updated. Active model set to ${db.adminSettings.activeModel}`);
  res.json({ success: true, adminSettings: db.adminSettings });
});

app.get("/api/admin/users", checkAdmin, (req, res) => {
  res.json({ users: Object.values(db.users) });
});

app.post("/api/admin/users/grant-credits", checkAdmin, (req, res) => {
  const { userId, credits } = req.body;
  if (db.users[userId]) {
    db.users[userId].credits = (db.users[userId].credits || 0) + parseInt(credits);
    saveDatabase();
    logAction("info", `Admin allocated ${credits} credits to ${db.users[userId].email}`);
    return res.json({ success: true, user: db.users[userId] });
  }
  res.status(404).json({ error: "User not found" });
});

app.post("/api/admin/grant-credits", checkAdmin, (req, res) => {
  const { userId, credits } = req.body;
  if (db.users[userId]) {
    db.users[userId].credits = (db.users[userId].credits || 0) + parseInt(credits);
    saveDatabase();
    logAction("info", `Admin allocated ${credits} credits to ${db.users[userId].email}`);
    return res.json({ success: true, user: db.users[userId] });
  }
  res.status(404).json({ error: "User not found" });
});

app.get("/api/admin/tickets", checkAdmin, (req, res) => {
  res.json({ tickets: db.tickets });
});

app.post("/api/admin/tickets/:ticketId/resolve", checkAdmin, (req, res) => {
  const { ticketId } = req.params;
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (ticket) {
    ticket.status = "resolved";
    if (!ticket.replies) ticket.replies = [];
    ticket.replies.push({
      sender: "admin",
      message: "This support ticket was resolved by administrator action.",
      createdAt: new Date().toISOString()
    });
    saveDatabase();
    logAction("info", `Admin resolved support ticket ${ticketId}.`);
    return res.json({ success: true, ticket });
  }
  res.status(404).json({ error: "Ticket not found" });
});

app.post("/api/admin/tickets/reply", checkAdmin, (req, res) => {
  const { ticketId, replyMessage } = req.body;
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (ticket) {
    ticket.status = "resolved";
    if (!ticket.replies) ticket.replies = [];
    ticket.replies.push({
      sender: "admin",
      message: replyMessage,
      createdAt: new Date().toISOString()
    });
    saveDatabase();
    logAction("info", `Admin resolved support ticket ${ticketId}. Reply sent.`);
    return res.json({ success: true, ticket });
  }
  res.status(404).json({ error: "Ticket not found" });
});


// -------------------------------------------------------------------------
// API ERROR & FALLBACK HANDLING
// -------------------------------------------------------------------------

// All other API routes that weren't matched should return a 404 JSON instead of falling back to index.html
app.all("/api/*", (req, res) => {
  res.status(404).json({ 
    error: "Not Found",
    message: `API endpoint ${req.method} ${req.url} does not exist.` 
  });
});

// Global Error Handler for Express to prevent raw HTML stack traces or crashes from returning HTML
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Server Error:", err);
  if (req.path.startsWith("/api/")) {
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message || "An unexpected error occurred on the server." 
    });
  }
  next(err);
});


// -------------------------------------------------------------------------
// VITE OR STATIC FILES SERVING MIDDLEWARE
// -------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for lightning fast development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving from static dist folder
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 CreatorPilot AI Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
