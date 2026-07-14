import React, { useState } from "react";
import { Copy, Check, Play, BookOpen, Search, Sparkles } from "lucide-react";

interface PromptTemplatesProps {
  onApplyTemplate: (toolId: string, initialInputs: Record<string, string>) => void;
}

export default function PromptTemplates({ onApplyTemplate }: PromptTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const templates = [
    {
      id: 1,
      title: "Psychological TikTok Hook Model",
      desc: "An aggressive pattern-interrupting opening hook engineered to force early visual locks.",
      prompt: "Act as an elite short-form algorithmic strategist. Write 5 high-impact, psychologically disruptive hooks for a video in the [Niche] space. Each hook must use a pattern-interrupt overlay and explicitly target user cognitive biases. Focus on resolving common industry mistakes.",
      toolId: "hook-gen",
      inputs: { niche: "Personal financial growth hacks", platform: "TikTok" }
    },
    {
      id: 2,
      title: "Double-CTR Bio Transformation",
      desc: "Formats clean line-breaks and custom offer calls specifically matching TikTok constraints.",
      prompt: "Act as a direct-response conversion copywriter. Revise my social media bio to double click-through rates. Niche: [Niche]. My primary lead magnet is: [CTA]. Generate 3 modular variations adhering strictly to 80-character maximums.",
      toolId: "bio-gen",
      inputs: { niche: "No-code micro SaaS development", cta: "Free 48h Checklist Guide", platform: "TikTok" }
    },
    {
      id: 3,
      title: "No-Blindness YouTube Overlay Text",
      desc: "Generates high-contrast, short click-magnet phrases designed to sit nicely inside 1280x720 thumbnails.",
      prompt: "Act as a YouTube thumbnail design supervisor. Provide 5 ultra-short, high-contrast visual title overlays that break standard scrolling blindness. Video title: [Title]. Audience Niche: [Niche]. Avoid copying the title text directly. Keep it under 3-4 simple, high-arousal words.",
      toolId: "thumbnail-text",
      inputs: { title: "How I automated my entire email client setup", niche: "Developer productivity & scripting" }
    },
    {
      id: 4,
      title: "High-Ticket Cold Brand Pitch",
      desc: "Elegant, data-backed pitch template highlighting organic reach statistics.",
      prompt: "Act as a talent agency director. Write a highly persuasive, non-templated cold pitch email to [BrandName] requesting a premium sponsored alignment. Channel Niche: [Niche]. Core Audience Stats: [AudienceStats]. Focus on direct visual integration and post longevity.",
      toolId: "brand-email",
      inputs: { brandName: "NordVPN", niche: "Privacy tech & cybersecurity", audienceStats: "12k active tech subscribers, 6.2% CTR" }
    },
    {
      id: 5,
      title: "Midjourney Workspace Illustration",
      desc: "Converts simple room outlines into ultra-high-definition workspace renders.",
      prompt: "Photorealistic desk workstation setup, dark brutalist concrete background, soft neon violet backlight glowing, premium mechanical keyboard with artisan keys, warm glowing desktop screen showcasing code lines, 8k resolution, photorealistic cinematic studio lighting, shot on 35mm lens --ar 16:9",
      toolId: "image-prompt",
      inputs: { concept: "Minimalist desk workstation setups on cement floor with warm plants" }
    }
  ];

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>SaaS Expert Prompt Library</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Pre-built, system-optimized system prompts curated by top 1% social creators.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none pl-11 pr-4 py-2 rounded-lg text-xs text-white placeholder-slate-600"
            placeholder="Search prompt templates..."
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-20 border border-dashed border-white/5 rounded-2xl">
            <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-3 animate-pulse" />
            <p className="text-xs text-slate-500">No prompt templates match your search criteria.</p>
          </div>
        ) : (
          filteredTemplates.map((item) => (
            <div key={item.id} className="bg-[#0E1015] border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <span className="bg-slate-800/20 border border-white/5 text-slate-400 text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase">
                    {item.toolId.replace("-gen", "")}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{item.desc}</p>
                
                {/* Visual prompt display */}
                <div className="bg-white/5 border border-white/5 p-4 rounded-lg text-[10px] text-slate-300 font-mono leading-relaxed mb-6 whitespace-pre-wrap select-all">
                  {item.prompt}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5 mt-auto">
                <button
                  onClick={() => handleCopy(item.prompt, item.id)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold uppercase tracking-wider text-[10px] rounded-md transition flex items-center justify-center space-x-2"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === item.id ? "Copied" : "Copy Prompt"}</span>
                </button>

                <button
                  onClick={() => onApplyTemplate(item.toolId, item.inputs)}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider text-[10px] rounded-md transition flex items-center space-x-2"
                >
                  <Play className="w-3.5 h-3.5 text-white" />
                  <span>Execute</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
