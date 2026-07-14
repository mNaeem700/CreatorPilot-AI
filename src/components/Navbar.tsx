import React from "react";
import { Sparkles, Bell, Wifi, Cpu, ShieldAlert } from "lucide-react";
import { UserProfile } from "../types";

interface NavbarProps {
  user: UserProfile;
  activeView: string;
}

export default function Navbar({ user, activeView }: NavbarProps) {
  // Format view name
  const getViewTitle = () => {
    switch (activeView) {
      case "dashboard": return "Strategy Command Center";
      case "tools": return "AI Creator Toolset";
      case "history": return "SaaS Generations Archive";
      case "templates": return "Expert Creator Prompts";
      case "blog": return "Blogging CMS Hub";
      case "billing": return "Billing & Invoices";
      case "admin": return "SaaS Administrative Panel";
      default: return "Dashboard";
    }
  };

  const getPlanBadgeClass = (plan: string) => {
    switch (plan) {
      case "agency": return "bg-purple-900/40 border border-purple-500/50 text-purple-300";
      case "creator": return "bg-cyan-900/40 border border-cyan-500/50 text-cyan-300";
      case "starter": return "bg-teal-900/40 border border-teal-500/50 text-teal-300";
      default: return "bg-gray-800 border border-gray-700 text-gray-400";
    }
  };

  return (
    <header className="h-16 border-b border-white/5 px-8 flex justify-between items-center bg-[#0A0B0E]/80 backdrop-blur-xl sticky top-0 z-40 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-white tracking-tight leading-none mb-1">{getViewTitle()}</h1>
        <div className="flex items-center space-x-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Systems Live (Port 3000)</span>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* API key status */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-800/40 border border-white/5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Core: Gemini 3.5</span>
        </div>

        {/* Credit count stats */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-medium uppercase">Credits</p>
            <p className="text-sm font-mono text-indigo-300">
              {user.credits} / {user.maxCredits}
            </p>
          </div>
        </div>

        {/* Plan status */}
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
          {user.plan} Plan
        </span>

        {/* User image profile */}
        <div className="relative group shrink-0">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
            alt={user.displayName}
            className="w-10 h-10 rounded-full border border-white/10 object-cover bg-slate-900"
          />
          <div className="absolute right-0 top-11 bg-slate-950 border border-white/5 rounded-xl p-3 shadow-xl hidden group-hover:block w-48 text-left">
            <div className="text-xs font-semibold text-white truncate">{user.displayName}</div>
            <div className="text-2xs text-slate-500 truncate mb-2">{user.email}</div>
            <div className="border-t border-white/5 pt-2 text-2xs text-slate-400 uppercase tracking-widest font-bold">
              Role: <span className="text-indigo-400">{user.role}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
