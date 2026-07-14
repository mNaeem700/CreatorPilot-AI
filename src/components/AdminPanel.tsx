import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Settings, 
  HelpCircle, 
  Terminal, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  Cpu,
  RefreshCw
} from "lucide-react";
import { SupportTicket, AdminSettings, AuditLog } from "../types";
import { apiFetch } from "../utils/api";

export default function AdminPanel() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);

  // Form states: Grant credits
  const [grantUid, setGrantUid] = useState("");
  const [grantAmount, setGrantAmount] = useState(100);
  const [grantSuccess, setGrantSuccess] = useState("");
  const [grantError, setGrantError] = useState("");
  const [isGranting, setIsGranting] = useState(false);

  // Form states: Settings edit
  const [defaultModel, setDefaultModel] = useState("gemini-2.5-flash");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // 1. Fetch tickets
      const ticketsRes = await apiFetch("/api/admin/tickets");
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data.tickets || []);
      }

      // 2. Fetch logs
      const logsRes = await apiFetch("/api/admin/logs");
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }

      // 3. Fetch Settings
      const settingsRes = await apiFetch("/api/admin/settings");
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setAdminSettings(data.settings);
        setDefaultModel(data.settings.defaultModel);
        setSystemPrompt(data.settings.systemPrompt);
      }
    } catch (err) {
      console.error("Error reading admin panels data:", err);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/api/admin/tickets/${ticketId}/resolve`, {
        method: "POST"
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error("Error resolving support ticket:", err);
    }
  };

  const handleGrantCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUid) return;
    setGrantSuccess("");
    setGrantError("");
    setIsGranting(true);

    try {
      const res = await apiFetch("/api/admin/grant-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: grantUid, credits: Number(grantAmount) })
      });

      const data = await res.json();
      if (res.ok) {
        setGrantSuccess(`Successfully granted +${grantAmount} credits to user account.`);
        setGrantUid("");
        setGrantAmount(100);
        fetchAdminData();
      } else {
        setGrantError(data.error || "Failed to grant credits.");
      }
    } catch (err) {
      setGrantError("A server communications error occurred.");
    } finally {
      setIsGranting(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess("");

    try {
      const res = await apiFetch("/api/admin/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultModel, systemPrompt })
      });

      if (res.ok) {
        setSettingsSuccess("Administrative guidelines and core models updated successfully.");
        fetchAdminData();
      }
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Admin metrics strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-panel p-6 rounded-2xl">
          <span className="text-3xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Total Users Register</span>
          <span className="text-2xl font-bold text-white font-mono block">312</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <span className="text-3xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Pending Support Tickets</span>
          <span className="text-2xl font-bold text-amber-400 font-mono block">
            {tickets.filter(t => t.status === "open").length}
          </span>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <span className="text-3xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Total Platform Runs</span>
          <span className="text-2xl font-bold text-cyan-400 font-mono block">1,482</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-3xs font-bold text-gray-500 uppercase tracking-widest block mb-1">API Node Status</span>
            <span className="text-xs font-bold text-emerald-400 block uppercase">Operational</span>
          </div>
          <button 
            onClick={fetchAdminData}
            className="p-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 rounded-xl transition text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Support Routing Desk & Manual Balance Granting (Left) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Support Ticket desk list */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="font-display font-semibold text-white mb-2 flex items-center space-x-2">
              <HelpCircle className="w-4.5 h-4.5 text-purple-400" />
              <span>Operations Support Routing Desk</span>
            </h3>
            <p className="text-xs text-gray-500 mb-6 font-sans">Reply and close active creator platform inquiries</p>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {tickets.length === 0 ? (
                <p className="text-xs text-gray-500 font-sans italic text-center py-6">All customer lines clear. No pending inquiries.</p>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 bg-gray-900/40 border border-gray-850 rounded-xl flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-3xs text-gray-500 font-mono font-bold block uppercase mb-1">UID: {ticket.userId}</span>
                        <h4 className="text-xs font-bold text-white">{ticket.subject}</h4>
                      </div>
                      <span className={`text-3xs font-bold uppercase px-2.5 py-0.5 rounded ${
                        ticket.status === "open" ? "bg-amber-950/40 border border-amber-800/40 text-amber-400" : "bg-emerald-950/40 border border-emerald-800/40 text-emerald-400"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed font-sans mb-4">
                      {ticket.message}
                    </p>

                    {ticket.status === "open" && (
                      <div className="flex justify-end pt-3 border-t border-gray-850/60">
                        <button
                          onClick={() => handleResolveTicket(ticket.id)}
                          className="bg-emerald-950/30 border border-emerald-800/60 hover:bg-emerald-900/40 text-emerald-300 text-3xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          Resolve & close ticket
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Credits Granting Utility Box */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="font-display font-semibold text-white mb-2 flex items-center space-x-2">
              <PlusCircle className="w-4.5 h-4.5 text-cyan-400" />
              <span>SaaS Credits Allocator Console</span>
            </h3>
            <p className="text-xs text-gray-500 mb-6 font-sans">Grant promotional refill credits directly to target creator profiles</p>

            <form onSubmit={handleGrantCredits} className="space-y-4">
              {grantSuccess && (
                <div className="bg-emerald-950/40 border border-emerald-800/60 p-3.5 rounded-xl flex items-start space-x-2.5 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <span>{grantSuccess}</span>
                </div>
              )}
              {grantError && (
                <div className="bg-red-950/40 border border-red-800/60 p-3.5 rounded-xl flex items-start space-x-2.5 text-red-300 text-xs">
                  <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0" />
                  <span>{grantError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-3xs font-bold uppercase tracking-wider text-gray-400">Target User UID (e.g. pilot_admin)</label>
                  <input 
                    type="text" 
                    required
                    value={grantUid}
                    onChange={(e) => setGrantUid(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none px-4 py-2.5 rounded-xl text-xs text-white"
                    placeholder="pilot_admin"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs font-bold uppercase tracking-wider text-gray-400">Credits Refill Amount</label>
                  <input 
                    type="number" 
                    required
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none px-4 py-2.5 rounded-xl text-xs text-white font-mono"
                    placeholder="100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isGranting}
                className="w-full py-3 bg-gray-900 border border-gray-800 hover:bg-gray-850 text-white text-xs font-semibold rounded-xl transition"
              >
                {isGranting ? "Refilling..." : "Refill Balance"}
              </button>
            </form>
          </div>

        </div>

        {/* Global Settings & Terminal Logs Timeline (Right) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Settings Config Editor */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="font-display font-semibold text-white mb-2 flex items-center space-x-2">
              <Settings className="w-4.5 h-4.5 text-cyan-400" />
              <span>Core Model Core configurations</span>
            </h3>
            <p className="text-xs text-gray-500 mb-6 font-sans">Modify model routing guidelines globally</p>

            <form onSubmit={handleUpdateSettings} className="space-y-4">
              {settingsSuccess && (
                <div className="bg-emerald-950/40 border border-emerald-800/60 p-3.5 rounded-xl text-emerald-300 text-xs">
                  {settingsSuccess}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-3xs font-bold uppercase tracking-wider text-gray-400">System AI Model Engine</label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none px-4 py-2.5 rounded-xl text-xs text-white"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Standard)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Precision)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-3xs font-bold uppercase tracking-wider text-gray-400">Base System Prompt Directives</label>
                <textarea
                  rows={4}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none px-4 py-2.5 rounded-xl text-xs text-white resize-none font-mono text-3xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-cyan-500/10"
              >
                Apply Core Configurations
              </button>
            </form>
          </div>

          {/* Audit Logs Terminal Feed */}
          <div className="glass-panel p-6 rounded-2xl bg-black/40">
            <h3 className="font-display font-semibold text-white mb-2 flex items-center space-x-2">
              <Terminal className="w-4.5 h-4.5 text-gray-500" />
              <span>System Operations Audit Timeline</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4 font-sans font-medium">Real-time audit records stored inside server database</p>

            <div className="bg-gray-950 p-4 border border-gray-850 rounded-xl max-h-[180px] overflow-y-auto space-y-2 font-mono text-3xs text-gray-400">
              {logs.length === 0 ? (
                <p className="text-gray-600 italic">No logs parsed from database yet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 border-b border-gray-900/40 pb-1">
                    <span className="text-cyan-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-purple-400 shrink-0">[{log.action.toUpperCase()}]</span>
                    <span className="text-gray-300 break-all">{log.details}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
