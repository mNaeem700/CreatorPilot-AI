import React from "react";
import { 
  LayoutDashboard, 
  Sparkles, 
  History, 
  BookOpen, 
  CreditCard, 
  Settings, 
  ShieldAlert, 
  LogOut,
  FolderLock,
  Trash2
} from "lucide-react";
import { UserProfile } from "../types";

interface SidebarProps {
  user: UserProfile;
  activeView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export default function Sidebar({ user, activeView, onChangeView, onLogout, onDeleteAccount }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "tools", label: "AI Creator Tools", icon: <Sparkles className="w-5 h-5" /> },
    { id: "history", label: "My History", icon: <History className="w-5 h-5" /> },
    { id: "templates", label: "Prompt Library", icon: <BookOpen className="w-5 h-5" /> },
    { id: "blog", label: "Blog / CMS", icon: <Settings className="w-5 h-5" /> },
    { id: "billing", label: "Billing / Plans", icon: <CreditCard className="w-5 h-5" /> }
  ];

  const handleDeleteTrigger = () => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete your CreatorPilot AI account? This action is IRREVERSIBLE. All credits, billing invoices, and past generations history will be completely purged from the system.")) {
      onDeleteAccount();
    }
  };

  return (
    <aside className="w-64 border-r border-white/5 h-screen flex flex-col justify-between sticky top-0 bg-[#050608] z-30 shrink-0 p-6">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">
            CreatorPilot <span className="text-indigo-400">AI</span>
          </span>
        </div>

        {/* User Info Capsule */}
        <div className="p-4 mb-6 bg-slate-800/20 border border-white/5 rounded-xl flex items-center space-x-3">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
            alt={user.displayName}
            className="w-10 h-10 rounded-lg border border-white/10 object-cover bg-slate-900"
          />
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate leading-none">{user.displayName}</div>
            <div className="text-3xs text-slate-500 truncate leading-none mt-1.5">{user.email}</div>
          </div>
        </div>

        {/* Menu Navigation */}
        <div className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Main Deck</div>
        <nav className="space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === item.id 
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className={`shrink-0 transition-transform ${activeView === item.id ? "scale-105 text-indigo-400" : "text-slate-400"}`}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          ))}

          {/* Admin Panel Link */}
          {user.role === "admin" && (
            <button
              onClick={() => onChangeView("admin")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all mt-4 ${
                activeView === "admin"
                  ? "bg-purple-600/10 text-purple-400 border border-purple-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <FolderLock className={`w-5 h-5 text-purple-400 shrink-0 ${activeView === "admin" ? "animate-pulse" : ""}`} />
              <span className="font-semibold">SaaS Admin Control</span>
            </button>
          )}
        </nav>
      </div>

      {/* Footer controls */}
      <div className="space-y-2 pt-6 border-t border-white/5">
        <button 
          onClick={handleDeleteTrigger}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs text-red-400/85 hover:text-red-400 hover:bg-red-950/20 transition-all font-medium"
        >
          <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
          <span>Purge My Account</span>
        </button>

        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium"
        >
          <LogOut className="w-5 h-5 text-slate-500 shrink-0" />
          <span>Console Logout</span>
        </button>
      </div>
    </aside>
  );
}
