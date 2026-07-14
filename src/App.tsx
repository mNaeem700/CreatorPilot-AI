import React, { useState, useEffect } from "react";
import { UserProfile, HistoryEntry, AIToolId } from "./types";
import { apiFetch } from "./utils/api";
import LandingPage from "./components/LandingPage";
import Auth from "./components/Auth";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import AITools from "./components/AITools";
import HistoryFavorites from "./components/HistoryFavorites";
import PromptTemplates from "./components/PromptTemplates";
import Blog from "./components/Blog";
import Billing from "./components/Billing";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem("creatorpilot_user");
    return cached ? JSON.parse(cached) : null;
  });

  const [activeView, setActiveView] = useState<string>(() => {
    const cachedUser = localStorage.getItem("creatorpilot_user");
    return cachedUser ? "dashboard" : "landing";
  });

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Prefill states for templates execution
  const [initialToolId, setInitialToolId] = useState<AIToolId | undefined>(undefined);
  const [initialInputs, setInitialInputs] = useState<Record<string, string> | undefined>(undefined);

  // Listen for unauthorized 401/403 API responses to redirect to landing
  useEffect(() => {
    const handleUnauthorized = () => {
      console.log("[App.tsx] Unauthorized or session expired. Logging out and redirecting to landing...");
      setUser(null);
      localStorage.removeItem("creatorpilot_user");
      setActiveView("landing");
    };

    window.addEventListener("unauthorized-api-call", handleUnauthorized);
    return () => {
      window.removeEventListener("unauthorized-api-call", handleUnauthorized);
    };
  }, []);

  // Sync user session state on launch and poll to keep session verified and synchronize credit updates
  useEffect(() => {
    checkActiveSession();
    
    // Poll the backend every 30 seconds to sync session and credits
    const interval = setInterval(() => {
      checkActiveSession();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activeView, user?.uid]);

  // Fetch past generations history whenever user is logged in
  useEffect(() => {
    if (user) {
      fetchUserHistory();
    } else {
      setHistory([]);
    }
  }, [user?.uid]);

  const checkActiveSession = async () => {
    try {
      // apiFetch automatically handles extracting user and injecting headers.
      // We skipAuthRedirect on session check to avoid double-triggers or premature local state resets.
      const res = await apiFetch("/api/auth/session", { skipAuthRedirect: true });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("creatorpilot_user", JSON.stringify(data.user));
          if (activeView === "landing" || activeView === "login") {
            setActiveView("dashboard");
          }
        } else {
          // If the server says there is no active session, sign out locally
          const storedUserString = localStorage.getItem("creatorpilot_user");
          if (user || storedUserString) {
            setUser(null);
            localStorage.removeItem("creatorpilot_user");
            setActiveView("landing");
          }
        }
      }
    } catch (err) {
      console.warn("Session validation failed on start. Operating in cached mode.");
    }
  };

  const fetchUserHistory = async () => {
    // Attempt local storage cache first
    const cachedHist = localStorage.getItem(`creatorpilot_history_${user?.uid}`);
    if (cachedHist) {
      setHistory(JSON.parse(cachedHist));
    }

    try {
      const res = await apiFetch(`/api/gemini/history/${user?.uid}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        localStorage.setItem(`creatorpilot_history_${user?.uid}`, JSON.stringify(data.history || []));
      }
    } catch (err) {
      console.warn("Failed to fetch online history. Utilizing offline-cached metrics.");
    }
  };

  const handleAuthSuccess = (authUser: UserProfile) => {
    setUser(authUser);
    localStorage.setItem("creatorpilot_user", JSON.stringify(authUser));
    setActiveView("dashboard");
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Server logout request failed. Purging locally.");
    }
    setUser(null);
    localStorage.removeItem("creatorpilot_user");
    setActiveView("landing");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const res = await apiFetch(`/api/auth/delete/${user.uid}`, { method: "DELETE" });
      if (res.ok) {
        handleLogout();
      }
    } catch (err) {
      console.error("Account purge failed:", err);
    }
  };

  const handleAddHistoryEntry = (newEntry: HistoryEntry) => {
    setHistory(prev => {
      const updated = [newEntry, ...prev];
      localStorage.setItem(`creatorpilot_history_${user?.uid}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleFavorite = async (id: string) => {
    const updated = history.map(h => h.id === id ? { ...h, isFavorite: !h.isFavorite } : h);
    setHistory(updated);
    localStorage.setItem(`creatorpilot_history_${user?.uid}`, JSON.stringify(updated));

    try {
      await apiFetch(`/api/gemini/history/${id}/favorite`, { method: "POST" });
    } catch (err) {
      console.warn("Could not sync star state with server.");
    }
  };

  const handleDeleteHistoryEntry = async (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem(`creatorpilot_history_${user?.uid}`, JSON.stringify(updated));

    try {
      await apiFetch(`/api/gemini/history/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Could not sync deletion with server.");
    }
  };

  // Callback from template catalog to prompt generator form
  const handleApplyTemplate = (toolId: string, initialFields: Record<string, string>) => {
    setInitialToolId(toolId as AIToolId);
    setInitialInputs(initialFields);
    setActiveView("tools");
  };

  const handleClearPrefilled = () => {
    setInitialToolId(undefined);
    setInitialInputs(undefined);
  };

  // 1. Landing View
  if (activeView === "landing") {
    return (
      <LandingPage 
        onGetStarted={() => setActiveView("login")} 
        onNavigateToBlog={() => setActiveView("blog")} 
      />
    );
  }

  // 2. Login / SignUp Onboarding View
  if (activeView === "login") {
    return (
      <Auth 
        onAuthSuccess={handleAuthSuccess} 
        onBackToLanding={() => setActiveView("landing")} 
      />
    );
  }

  // Fallback if no user is authenticated but view is private
  if (!user) {
    return (
      <Auth 
        onAuthSuccess={handleAuthSuccess} 
        onBackToLanding={() => setActiveView("landing")} 
      />
    );
  }

  // 3. PRIVATE SAAS DESKTOP VIEW SHELL
  return (
    <div className="flex bg-[#050608] text-slate-300 min-h-screen">
      {/* Sidebar navigation */}
      <Sidebar 
        user={user} 
        activeView={activeView} 
        onChangeView={(view) => {
          if (view === "admin" && user.role !== "admin") {
            setActiveView("dashboard");
          } else {
            setActiveView(view);
          }
          handleClearPrefilled();
        }} 
        onLogout={handleLogout} 
        onDeleteAccount={handleDeleteAccount} 
      />

      {/* Main dashboard viewport */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Dynamic header navbar */}
        <Navbar user={user} activeView={activeView} />

        {/* Scrollable workspace panel */}
        <main className="flex-1 overflow-y-auto">
          {activeView === "dashboard" && (
            <Dashboard 
              user={user} 
              history={history} 
              onChangeView={(view) => {
                setActiveView(view);
                handleClearPrefilled();
              }} 
              onRefreshUser={setUser} 
            />
          )}

          {activeView === "tools" && (
            <AITools 
              user={user} 
              onRefreshUser={setUser} 
              onAddHistoryEntry={handleAddHistoryEntry}
              initialToolId={initialToolId}
              initialInputs={initialInputs}
              onClearPrefilled={handleClearPrefilled}
            />
          )}

          {activeView === "history" && (
            <HistoryFavorites 
              history={history} 
              onToggleFavorite={handleToggleFavorite} 
              onDeleteHistoryEntry={handleDeleteHistoryEntry} 
            />
          )}

          {activeView === "templates" && (
            <PromptTemplates onApplyTemplate={handleApplyTemplate} />
          )}

          {activeView === "blog" && (
            <Blog />
          )}

          {activeView === "billing" && (
            <Billing user={user} onRefreshUser={setUser} />
          )}

          {activeView === "admin" && user.role === "admin" && (
            <AdminPanel />
          )}
        </main>
      </div>
    </div>
  );
}
