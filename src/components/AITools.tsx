import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Video, 
  MessageSquare, 
  TrendingUp, 
  Image as ImageIcon, 
  FileText, 
  Mail, 
  User, 
  Hash, 
  BookOpen, 
  Calendar,
  Share2,
  Copy,
  Download,
  AlertCircle,
  HelpCircle,
  Check,
  Search,
  Upload,
  ArrowRight
} from "lucide-react";
import { UserProfile, HistoryEntry, AIToolInfo, AIToolId } from "../types";
import { apiFetch } from "../utils/api";
import Markdown from "react-markdown";

interface AIToolsProps {
  user: UserProfile;
  onRefreshUser: (updatedUser: any) => void;
  onAddHistoryEntry: (entry: HistoryEntry) => void;
  initialToolId?: AIToolId;
  initialInputs?: Record<string, string>;
  onClearPrefilled?: () => void;
}

export default function AITools({ 
  user, 
  onRefreshUser, 
  onAddHistoryEntry,
  initialToolId,
  initialInputs,
  onClearPrefilled
}: AIToolsProps) {
  const [activeToolId, setActiveToolId] = useState<AIToolId>(initialToolId || "profile-audit");
  const [inputsState, setInputsState] = useState<Record<string, string>>(initialInputs || {});

  useEffect(() => {
    if (initialToolId) {
      setActiveToolId(initialToolId);
    }
    if (initialInputs) {
      setInputsState(initialInputs);
    }
  }, [initialToolId, initialInputs]);

  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List of all 15 AI Creator tools
  const toolsList: AIToolInfo[] = [
    {
      id: "profile-audit",
      name: "AI Profile Audit",
      description: "Comprehensive bio optimization & visual conversion rate assessment.",
      category: "social",
      creditsCost: 15,
      icon: "User",
      inputs: [
        { name: "handle", label: "Creator Handle", type: "text", placeholder: "@tech_insights", required: true },
        { name: "niche", label: "My Channel Niche", type: "text", placeholder: "Tech hardware, desk setups, coding workflow", required: true },
        { name: "bio", label: "Current Biography Text", type: "textarea", placeholder: "Daily setup reviews & coding hacks. Let's build together!", required: true }
      ]
    },
    {
      id: "caption-gen",
      name: "Caption Generator",
      description: "Engagement-optimized captions formatted with hooks, emojis and clean CTAs.",
      category: "social",
      creditsCost: 5,
      icon: "FileText",
      inputs: [
        { name: "topic", label: "Post Topic / Goal", type: "textarea", placeholder: "How I automated 90% of my video rendering tasks", required: true },
        { name: "platform", label: "Social Platform Target", type: "select", options: ["Instagram", "TikTok", "LinkedIn", "YouTube Shorts"], required: true },
        { name: "tone", label: "Caption Voice/Tone", type: "select", options: ["casual", "professional", "hype", "vulnerable", "minimalist"], required: true }
      ]
    },
    {
      id: "hook-gen",
      name: "Hook Generator",
      description: "10 high-retention scroll-stopping short-form video hooks.",
      category: "social",
      creditsCost: 5,
      icon: "Video",
      inputs: [
        { name: "niche", label: "Video Niche / Concept", type: "text", placeholder: "Home office organization hacks", required: true },
        { name: "platform", label: "Social Platform Target", type: "select", options: ["TikTok", "YouTube Shorts", "Instagram Reels"], required: true }
      ]
    },
    {
      id: "hashtag-gen",
      name: "Hashtag Generator",
      description: "30 hashtags tiered by reach capabilities to maximize search discovery.",
      category: "social",
      creditsCost: 3,
      icon: "Hash",
      inputs: [
        { name: "topic", label: "Core Post Subject", type: "text", placeholder: "Vim terminal customization productivity", required: true },
        { name: "niche", label: "Target Audience Niche", type: "text", placeholder: "Software Engineering & Linux Users", required: true }
      ]
    },
    {
      id: "bio-gen",
      name: "Bio Generator",
      description: "Generates 3 short conversion-oriented bullet social bios.",
      category: "social",
      creditsCost: 4,
      icon: "User",
      inputs: [
        { name: "niche", label: "Creator Niche Description", type: "text", placeholder: "Budget lifestyle travels for students", required: true },
        { name: "cta", label: "Primary Offer / Link CTA", type: "text", placeholder: "Free Student Packing Checklist", required: true },
        { name: "platform", label: "Target Platform Layout", type: "select", options: ["Instagram", "Twitter/X", "TikTok", "Threads"], required: true }
      ]
    },
    {
      id: "content-calendar",
      name: "Content Calendar",
      description: "Creates a structured weekly campaign containing posts outlines and formats.",
      category: "creative",
      creditsCost: 20,
      icon: "Calendar",
      inputs: [
        { name: "niche", label: "Creator Channel Niche", type: "text", placeholder: "No-Code SaaS development tutorials", required: true },
        { name: "theme", label: "Focus Theme for this week", type: "text", placeholder: "Launching an MVP in 48 hours without code", required: true }
      ]
    },
    {
      id: "script-gen",
      name: "Script Generator",
      description: "Retention short-form script complete with visual overlays and directions.",
      category: "creative",
      creditsCost: 15,
      icon: "Video",
      inputs: [
        { name: "topic", label: "Script Focus / Narrative", type: "textarea", placeholder: "Exposing why most people fail at scaling their side hustle", required: true },
        { name: "tone", label: "Visual Presentation Tone", type: "select", options: ["hype", "educational", "vulnerable", "storyteller", "analytical"], required: true }
      ]
    },
    {
      id: "comment-reply",
      name: "Comment Reply Generator",
      description: "Generates 3 connection and conversion optimized audience replies.",
      category: "social",
      creditsCost: 3,
      icon: "MessageSquare",
      inputs: [
        { name: "comment", label: "Incoming User Comment", type: "textarea", placeholder: "Which editor software did you use to generate that typing effect at 0:12? Looks great!", required: true }
      ]
    },
    {
      id: "brand-email",
      name: "Brand Deal Email Generator",
      description: "Pitch templates for secure cold email outreach to brand partners.",
      category: "business",
      creditsCost: 8,
      icon: "Mail",
      inputs: [
        { name: "brandName", label: "Target Brand/Sponsor Name", type: "text", placeholder: "Logitech", required: true },
        { name: "niche", label: "My Channel Niche", type: "text", placeholder: "Custom mechanical keyboards & desk setups", required: true },
        { name: "audienceStats", label: "Key Audience Demographics", type: "text", placeholder: "25k active developers on YouTube, 8% standard CTR", required: true }
      ]
    },
    {
      id: "competitor-analyzer",
      name: "Competitor Analyzer",
      description: "Uncovers competitive gaps and content structures of top creators.",
      category: "growth",
      creditsCost: 12,
      icon: "TrendingUp",
      inputs: [
        { name: "niche", label: "Target Niche Sector", type: "text", placeholder: "Crypto trading for beginners", required: true }
      ]
    },
    {
      id: "screenshot-analyzer",
      name: "Analytics Screenshot Auditor",
      description: "Uploads a visual dashboard screenshot to diagnose early retention curves drop-offs.",
      category: "growth",
      creditsCost: 25,
      icon: "TrendingUp",
      inputs: [
        { name: "screenshot", label: "Analytics Dashboard Screenshot (Visual)", type: "image", required: false },
        { name: "views", label: "Alternative: Total View Count", type: "text", placeholder: "10,000", required: false },
        { name: "engagement", label: "Alternative: Engagement Rate (%)", type: "text", placeholder: "4.8%", required: false },
        { name: "retention", label: "Alternative: Average Retention (%)", type: "text", placeholder: "32%", required: false }
      ]
    },
    {
      id: "image-prompt",
      name: "Image Prompt Generator",
      description: "Transforms plain concept summaries into high-fidelity Midjourney/Stable Diffusion prompts.",
      category: "creative",
      creditsCost: 6,
      icon: "ImageIcon",
      inputs: [
        { name: "concept", label: "Visual Subject Concept", type: "textarea", placeholder: "Minimal desk workstation on a dark concrete background with violet backlight", required: true }
      ]
    },
    {
      id: "video-prompt",
      name: "Video Prompt Generator",
      description: "Produces descriptive scene triggers for Runway Gen-2, Sora, and Luma.",
      category: "creative",
      creditsCost: 8,
      icon: "Video",
      inputs: [
        { name: "scene", label: "Scene Plot Summary", type: "textarea", placeholder: "Sunset drone shot rotating over a futuristic glass skyscraper in a neon cyberpunk metropolis", required: true }
      ]
    },
    {
      id: "thumbnail-text",
      name: "Thumbnail Text Generator",
      description: "5 click-maximizing short text overlays paired with visual composition instructions.",
      category: "growth",
      creditsCost: 5,
      icon: "FileText",
      inputs: [
        { name: "title", label: "Planned Video Title", type: "text", placeholder: "How to stop procrastinating using the Pomodoro technique", required: true },
        { name: "niche", label: "My Channel Niche", type: "text", placeholder: "Productivity & Self Improvement", required: true }
      ]
    },
    {
      id: "trend-analyzer",
      name: "Trend Analyzer",
      description: "Maps out emerging viral hashtags, ASMR topics, or challenges in your industry.",
      category: "growth",
      creditsCost: 15,
      icon: "TrendingUp",
      inputs: [
        { name: "niche", label: "Industry Sector to Scan", type: "text", placeholder: "Gourmet coffee roasting setups", required: true }
      ]
    }
  ];

  // Map icon strings to Lucide components
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "User": return <User className="w-4.5 h-4.5" />;
      case "Video": return <Video className="w-4.5 h-4.5" />;
      case "MessageSquare": return <MessageSquare className="w-4.5 h-4.5" />;
      case "TrendingUp": return <TrendingUp className="w-4.5 h-4.5" />;
      case "ImageIcon": return <ImageIcon className="w-4.5 h-4.5" />;
      case "FileText": return <FileText className="w-4.5 h-4.5" />;
      case "Mail": return <Mail className="w-4.5 h-4.5" />;
      case "Hash": return <Hash className="w-4.5 h-4.5" />;
      case "Calendar": return <Calendar className="w-4.5 h-4.5" />;
      default: return <Sparkles className="w-4.5 h-4.5" />;
    }
  };

  const selectedTool = toolsList.find(t => t.id === activeToolId) || toolsList[0];

  // Handle inputs changes
  const handleInputChange = (name: string, value: string) => {
    setInputsState(prev => ({ ...prev, [name]: value }));
  };

  // Drag and drop or manual selection for image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readImageFile(file);
    }
  };

  const readImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only visual image files (PNG, JPEG, WEBP) are supported.");
      return;
    }
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readImageFile(file);
    }
  };

  // Trigger submission to full-stack API
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult("");
    setIsGenerating(true);

    const postPayload: Record<string, any> = { ...inputsState };
    if (screenshotBase64) {
      postPayload.screenshot = screenshotBase64;
    }

    try {
      const response = await apiFetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          toolId: selectedTool.id,
          inputs: postPayload
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation endpoint failed");
      }

      // Success
      setResult(data.result);
      onRefreshUser({ ...user, credits: data.creditsLeft });
      onAddHistoryEntry(data.historyEntry);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during pipeline run.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Utilities: Copy output
  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Utilities: Export as Markdown file
  const handleExportMarkdown = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `creatorpilot_${selectedTool.id}_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Filter tools list based on search query
  const filteredTools = toolsList.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-80px)] divide-y lg:divide-y-0 lg:divide-x divide-gray-850">
      
      {/* LEFT COLUMN: Tool Select Panel */}
      <div className="lg:col-span-4 p-6 bg-[#0c0e11] overflow-y-auto max-h-[calc(100vh-80px)]">
        <div className="mb-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none pl-11 pr-4 py-2.5 rounded-xl text-xs text-white"
            placeholder="Search 15 creator tools..."
          />
        </div>

        <div className="space-y-6">
          {/* Social Category */}
          <div>
            <div className="text-3xs font-bold uppercase tracking-widest text-gray-500 mb-2.5 px-3">Audience & Socials</div>
            <div className="space-y-1">
              {filteredTools.filter(t => t.category === "social").map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActiveToolId(t.id); setError(""); setResult(""); setInputsState({}); setScreenshotBase64(null); }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between text-xs transition ${
                    activeToolId === t.id 
                      ? "bg-cyan-950/20 border border-cyan-800/30 text-cyan-300 font-semibold" 
                      : "text-gray-400 hover:text-white hover:bg-gray-900/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3.5 truncate">
                    <span className={activeToolId === t.id ? "text-cyan-400" : "text-gray-500"}>{getIcon(t.icon)}</span>
                    <span className="truncate">{t.name}</span>
                  </div>
                  <span className="font-mono text-3xs font-bold text-gray-500 shrink-0">{t.creditsCost}c</span>
                </button>
              ))}
            </div>
          </div>

          {/* Creative Category */}
          <div>
            <div className="text-3xs font-bold uppercase tracking-widest text-gray-500 mb-2.5 px-3">Creative Assisting</div>
            <div className="space-y-1">
              {filteredTools.filter(t => t.category === "creative").map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActiveToolId(t.id); setError(""); setResult(""); setInputsState({}); setScreenshotBase64(null); }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between text-xs transition ${
                    activeToolId === t.id 
                      ? "bg-cyan-950/20 border border-cyan-800/30 text-cyan-300 font-semibold" 
                      : "text-gray-400 hover:text-white hover:bg-gray-900/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3.5 truncate">
                    <span className={activeToolId === t.id ? "text-cyan-400" : "text-gray-500"}>{getIcon(t.icon)}</span>
                    <span className="truncate">{t.name}</span>
                  </div>
                  <span className="font-mono text-3xs font-bold text-gray-500 shrink-0">{t.creditsCost}c</span>
                </button>
              ))}
            </div>
          </div>

          {/* Growth Category */}
          <div>
            <div className="text-3xs font-bold uppercase tracking-widest text-gray-500 mb-2.5 px-3">Algorithms & Strategy</div>
            <div className="space-y-1">
              {filteredTools.filter(t => t.category === "growth").map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActiveToolId(t.id); setError(""); setResult(""); setInputsState({}); setScreenshotBase64(null); }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between text-xs transition ${
                    activeToolId === t.id 
                      ? "bg-cyan-950/20 border border-cyan-800/30 text-cyan-300 font-semibold" 
                      : "text-gray-400 hover:text-white hover:bg-gray-900/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3.5 truncate">
                    <span className={activeToolId === t.id ? "text-cyan-400" : "text-gray-500"}>{getIcon(t.icon)}</span>
                    <span className="truncate">{t.name}</span>
                  </div>
                  <span className="font-mono text-3xs font-bold text-gray-500 shrink-0">{t.creditsCost}c</span>
                </button>
              ))}
            </div>
          </div>

          {/* Business Category */}
          <div>
            <div className="text-3xs font-bold uppercase tracking-widest text-gray-500 mb-2.5 px-3">Business Strategy</div>
            <div className="space-y-1">
              {filteredTools.filter(t => t.category === "business").map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActiveToolId(t.id); setError(""); setResult(""); setInputsState({}); setScreenshotBase64(null); }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between text-xs transition ${
                    activeToolId === t.id 
                      ? "bg-cyan-950/20 border border-cyan-800/30 text-cyan-300 font-semibold" 
                      : "text-gray-400 hover:text-white hover:bg-gray-900/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3.5 truncate">
                    <span className={activeToolId === t.id ? "text-cyan-400" : "text-gray-500"}>{getIcon(t.icon)}</span>
                    <span className="truncate">{t.name}</span>
                  </div>
                  <span className="font-mono text-3xs font-bold text-gray-500 shrink-0">{t.creditsCost}c</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Execution Workdesk */}
      <div className="lg:col-span-8 p-8 flex flex-col justify-between max-h-[calc(100vh-80px)] overflow-y-auto">
        <div className="space-y-8">
          
          {/* Header Description */}
          <div className="flex justify-between items-start border-b border-gray-850 pb-5">
            <div>
              <h2 className="font-display font-bold text-xl text-white flex items-center space-x-2.5">
                <span>{selectedTool.name}</span>
                <span className="bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 font-mono text-3xs font-bold px-2 py-0.5 rounded uppercase">
                  {selectedTool.creditsCost} credits
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-1.5">{selectedTool.description}</p>
            </div>
          </div>

          {/* Form and Output splitting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Input Form Column */}
            <div>
              <form onSubmit={handleGenerate} className="space-y-5">
                {selectedTool.inputs.map((input) => (
                  <div key={input.name} className="space-y-1.5">
                    <label className="text-3xs font-bold uppercase tracking-wider text-gray-400">
                      {input.label} {input.required && <span className="text-red-500">*</span>}
                    </label>

                    {input.type === "textarea" ? (
                      <textarea
                        required={input.required}
                        rows={4}
                        value={inputsState[input.name] || ""}
                        onChange={(e) => handleInputChange(input.name, e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none px-4 py-3 rounded-xl text-xs text-white"
                        placeholder={input.placeholder}
                      />
                    ) : input.type === "select" ? (
                      <select
                        required={input.required}
                        value={inputsState[input.name] || ""}
                        onChange={(e) => handleInputChange(input.name, e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none px-4 py-3 rounded-xl text-xs text-white"
                      >
                        <option value="">Choose option...</option>
                        {input.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : input.type === "image" ? (
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-gray-800 rounded-xl p-6 text-center hover:border-cyan-500/50 transition cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <span className="text-xs text-gray-400 block font-medium">
                          {screenshotName ? `Selected: ${screenshotName}` : "Drag and drop dashboard screenshot or click to browse"}
                        </span>
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        required={input.required}
                        value={inputsState[input.name] || ""}
                        onChange={(e) => handleInputChange(input.name, e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none px-4 py-3 rounded-xl text-xs text-white"
                        placeholder={input.placeholder}
                      />
                    )}
                  </div>
                ))}

                {error && (
                  <div className="bg-red-950/40 border border-red-800/60 p-4 rounded-xl flex items-start space-x-2.5 text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-cyan-500/10 disabled:opacity-50"
                >
                  {isGenerating ? "Executing AI Engine..." : `Run Generator (${selectedTool.creditsCost} Credits)`}
                </button>
              </form>
            </div>

            {/* AI Output Generation Column */}
            <div className="flex flex-col h-full justify-between">
              <div className="border border-gray-850 rounded-2xl bg-gray-950/30 p-6 min-h-[350px] relative flex flex-col justify-between h-full">
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gray-950/80 rounded-2xl space-y-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
                      <Sparkles className="w-5 h-5 text-purple-400 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-semibold text-white">Triggering Server Gemini Pipeline</div>
                      <p className="text-3xs text-gray-500 mt-1 max-w-[200px]">Optimizing system prompts & routing parameters...</p>
                    </div>
                  </div>
                ) : null}

                {result ? (
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4 border-b border-gray-850 pb-3">
                        <span className="text-3xs font-bold uppercase tracking-widest text-cyan-400">Content Generated</span>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={handleCopy}
                            className="bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-300 hover:text-white p-2 rounded-lg transition"
                            title="Copy result"
                          >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={handleExportMarkdown}
                            className="bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-300 hover:text-white p-2 rounded-lg transition"
                            title="Export Markdown"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="markdown-body prose prose-cyan prose-invert max-w-none text-sm text-gray-200 leading-relaxed font-sans max-h-[420px] overflow-y-auto pr-1">
                        <Markdown>{result}</Markdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <Sparkles className="w-8 h-8 text-gray-700 mb-3" />
                    <div className="text-xs font-semibold text-gray-500">Awaiting Input Parameters</div>
                    <p className="text-3xs text-gray-600 mt-1.5 max-w-[200px]">Configure the form and press Run to invoke the AI.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
