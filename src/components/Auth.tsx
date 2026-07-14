import React, { useState } from "react";
import { Sparkles, Mail, Lock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { UserProfile } from "../types";
import { apiFetch } from "../utils/api";

interface AuthProps {
  onAuthSuccess: (user: UserProfile) => void;
  onBackToLanding: () => void;
}

export default function Auth({ onAuthSuccess, onBackToLanding }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Success
      onAuthSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuthSimulate = async () => {
    setError("");
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "mnaeemkachala@gmail.com",
          displayName: "Naeem Kachala",
          photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=demo"
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Google login failed");
      }

      onAuthSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Failed to trigger OAuth session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please input your email address first.");
      return;
    }
    setError("");
    setSuccessMsg("Reset link dispatched successfully. Please check your inbox or spam filter.");
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white flex flex-col justify-center items-center px-4 py-12 grid-bg">
      <button 
        onClick={onBackToLanding}
        className="absolute top-6 left-6 text-sm text-gray-400 hover:text-white transition"
      >
        ← Back to landing page
      </button>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-cyan-500 to-purple-600 p-3 rounded-2xl shadow-xl shadow-cyan-500/10 mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-display font-bold text-2xl tracking-tight">
            CreatorPilot<span className="text-cyan-400">.AI</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">Enterprise Content Intelligence Console</p>
        </div>

        {/* Card */}
        <div id="auth-card" className="glass-panel p-8 rounded-2xl">
          {error && (
            <div className="bg-red-950/40 border border-red-800/60 p-4 rounded-xl mb-6 flex items-start space-x-3 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl mb-6 flex items-start space-x-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
              <div>
                <h3 className="font-display font-semibold text-lg mb-1">Recover Credentials</h3>
                <p className="text-xs text-gray-400">Input your account email to receive a password reset link.</p>
              </div>

              <div className="space-y-2">
                <label className="text-2xs font-bold uppercase tracking-wider text-gray-400">Account Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900/60 border border-gray-800 focus:border-cyan-500 focus:outline-none pl-11 pr-4 py-3 rounded-xl text-sm text-white"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition"
              >
                Send Recovery Instructions
              </button>

              <button 
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full text-center text-xs text-gray-400 hover:text-white transition mt-2"
              >
                Return to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-5">
              <div className="flex border-b border-gray-800/80 pb-3 mb-4">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(""); }}
                  className={`flex-1 text-center font-display font-semibold text-sm pb-2 border-b-2 transition ${
                    !isSignUp ? "border-cyan-500 text-white" : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(""); }}
                  className={`flex-1 text-center font-display font-semibold text-sm pb-2 border-b-2 transition ${
                    isSignUp ? "border-cyan-500 text-white" : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-2xs font-bold uppercase tracking-wider text-gray-400">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-gray-900/60 border border-gray-800 focus:border-cyan-500 focus:outline-none pl-11 pr-4 py-3 rounded-xl text-sm text-white"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-2xs font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900/60 border border-gray-800 focus:border-cyan-500 focus:outline-none pl-11 pr-4 py-3 rounded-xl text-sm text-white"
                    placeholder="yourname@gmail.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-2xs font-bold uppercase tracking-wider text-gray-400">Password</label>
                  {!isSignUp && (
                    <button 
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-2xs text-cyan-400 hover:text-cyan-300"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900/60 border border-gray-800 focus:border-cyan-500 focus:outline-none pl-11 pr-4 py-3 rounded-xl text-sm text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50"
              >
                {isLoading ? "Authenticating..." : isSignUp ? "Build Creator Profile" : "Secure Console Login"}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-800/80"></div>
                <span className="flex-shrink mx-4 text-2xs text-gray-500 uppercase tracking-widest font-bold">Or Continue with</span>
                <div className="flex-grow border-t border-gray-800/80"></div>
              </div>

              {/* Developer Google Simulation Button */}
              <button
                type="button"
                onClick={handleGoogleAuthSimulate}
                disabled={isLoading}
                className="w-full py-3 bg-gray-900 border border-gray-800 hover:bg-gray-850 text-white rounded-xl text-sm font-medium transition flex items-center justify-center space-x-3 shadow-sm"
              >
                {/* Custom Google SVG */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in as Admin (Naeem Kachala)</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
