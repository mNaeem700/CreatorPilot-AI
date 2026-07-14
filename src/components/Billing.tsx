import React, { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, ShieldCheck, Sparkles, Download, Receipt, AlertCircle } from "lucide-react";
import { UserProfile, Invoice } from "../types";
import { apiFetch } from "../utils/api";

interface BillingProps {
  user: UserProfile;
  onRefreshUser: (updatedUser: any) => void;
}

export default function Billing({ user, onRefreshUser }: BillingProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState("");
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Card input mock states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, [user.uid]);

  const fetchInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const res = await apiFetch(`/api/billing/invoices/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error("Error loading invoices:", err);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const pricingPlans = [
    {
      id: "starter",
      name: "Starter Package",
      price: 19,
      credits: 150,
      description: "Accelerate your initial growth with elite viral content generators.",
      features: ["150 Premium High-Velocity Credits", "Viral Video Hooks & Multi-Platform Copy", "Advanced Intelligent Hashtag Clustering", "Standard Cloud Processing Queue"]
    },
    {
      id: "creator",
      name: "Creator Package",
      price: 49,
      credits: 450,
      description: "The complete system designed for high-impact content directors.",
      features: ["450 Premium High-Velocity Credits", "Full Suite of 15+ Advanced AI Tools", "Deep Automated Video Screenshot Analytics", "Priority Dedicated Server Routing"]
    },
    {
      id: "agency",
      name: "Agency Studio",
      price: 99,
      credits: 1200,
      description: "Scale multiple profiles with enterprise production-grade AI.",
      features: ["1,200 Premium High-Velocity Credits", "Enterprise Custom Strategic System Directives", "Seamless Team Seat Allocation & Sharing", "24/7 VIP Engineering Support Support Desk"]
    }
  ];

  const handleOpenCheckout = (planId: string) => {
    setSelectedPlan(planId);
    setCheckoutError("");
    setCheckoutSuccess("");
    setIsCheckoutOpen(true);
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setCheckoutError("");
    setCheckoutSuccess("");
    setIsProcessingCheckout(true);

    if (cardNumber.length < 16 || cardExpiry.length < 4 || cardCvc.length < 3) {
      setCheckoutError("Valid card details required. Code format invalid.");
      setIsProcessingCheckout(false);
      return;
    }

    try {
      const res = await apiFetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          planId: selectedPlan
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Simulated payment failed");
      }

      setCheckoutSuccess(`SaaS Subscription upgraded successfully! Credits balance refilled.`);
      onRefreshUser(data.user);
      fetchInvoices();
      setTimeout(() => {
        setIsCheckoutOpen(false);
        setSelectedPlan(null);
        setCardNumber("");
        setCardExpiry("");
        setCardCvc("");
      }, 2500);
    } catch (err: any) {
      setCheckoutError(err.message || "Stripe authorization simulation timed out.");
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-fade-in">
      
      {/* Current plan status banner */}
      <div className="glass-panel p-8 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <span className="text-3xs font-bold uppercase tracking-widest text-cyan-400 block mb-1">Billing Overview</span>
          <h3 className="font-display font-bold text-white text-lg">My Subscribed Plan: <span className="text-cyan-400 uppercase font-mono">{user.plan}</span></h3>
          <p className="text-xs text-gray-500 mt-1 font-sans">Next billing refilling date is auto-configured to next month.</p>
        </div>

        <div className="bg-gray-900/60 border border-gray-850 px-5 py-4 rounded-xl flex items-center space-x-3.5 shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs font-semibold text-white">Stripe Shield Verified</div>
            <span className="text-3xs text-gray-500 font-mono">End-to-end 256-bit encryption active</span>
          </div>
        </div>
      </div>

      {/* Subscription cards list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricingPlans.map((plan) => (
          <div 
            key={plan.id}
            className={`glass-panel p-6 rounded-2xl relative flex flex-col justify-between ${
              user.plan === plan.id ? "border-cyan-500 bg-[#12161f] shadow-lg shadow-cyan-500/5" : ""
            }`}
          >
            {user.plan === plan.id && (
              <span className="absolute top-4 right-4 bg-cyan-500 text-cyan-950 font-bold text-3xs px-2.5 py-1 rounded-full uppercase tracking-wider">
                My Plan
              </span>
            )}
            <div>
              <span className="text-3xs font-bold uppercase tracking-widest text-cyan-400 block mb-1">{plan.name}</span>
              <div className="flex items-baseline mb-3">
                <span className="font-display font-bold text-3xl text-white">${plan.price}</span>
                <span className="text-gray-400 text-xs ml-1">/ month</span>
              </div>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">{plan.description}</p>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start space-x-2.5 text-xs text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleOpenCheckout(plan.id)}
              disabled={user.plan === plan.id}
              className={`w-full py-3 rounded-xl font-semibold text-xs transition duration-250 ${
                user.plan === plan.id 
                  ? "bg-gray-900 border border-gray-800 text-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-md"
              }`}
            >
              {user.plan === plan.id ? "Already Enrolled" : `Select Package ($${plan.price})`}
            </button>
          </div>
        ))}
      </div>

      {/* Historical billing invoices */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="font-display font-semibold text-white mb-2 flex items-center space-x-2">
          <Receipt className="w-4.5 h-4.5 text-cyan-400" />
          <span>Billing Receipts & Invoices</span>
        </h3>
        <p className="text-xs text-gray-400 mb-6 font-sans font-medium">Historical receipts processed securely via certified checkout partners</p>

        <div className="space-y-3.5">
          {isLoadingInvoices ? (
            <p className="text-xs text-gray-500">Querying transactions list...</p>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-850 rounded-xl">
              <Receipt className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No invoices logged for your creator profile yet.</p>
            </div>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="p-4 bg-gray-900/40 border border-gray-850 rounded-xl flex flex-wrap gap-4 justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-white uppercase font-mono">{inv.id}</div>
                  <div className="text-3xs text-gray-500 mt-0.5">{new Date(inv.date).toLocaleString()}</div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-3xs text-gray-500 font-bold uppercase tracking-wider block">Plan Upgrade</span>
                    <span className="font-semibold text-cyan-300 uppercase font-mono">{inv.plan}</span>
                  </div>
                  <div>
                    <span className="text-3xs text-gray-500 font-bold uppercase tracking-wider block">Price Paid</span>
                    <span className="font-bold text-white font-mono">${inv.amount} USD</span>
                  </div>
                  <div>
                    <span className="text-3xs text-gray-500 font-bold uppercase tracking-wider block">Status</span>
                    <span className="bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-3xs font-bold px-2 py-0.5 rounded font-mono uppercase">
                      {inv.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* STRIPE CHECKOUT SIMULATION POPUP MODAL */}
      {isCheckoutOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="glass-panel bg-[#0d0f12] w-full max-w-md rounded-2xl p-6 sm:p-8 space-y-6 relative">
            <button
              onClick={() => { setIsCheckoutOpen(false); setSelectedPlan(null); }}
              className="absolute top-4 right-4 bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-400 hover:text-white px-2.5 py-1 rounded text-xs"
            >
              Cancel
            </button>

            <div>
              <span className="text-3xs font-bold uppercase tracking-widest text-cyan-400">Upgrade Console Portal</span>
              <h3 className="font-display font-semibold text-white mt-1">Stripe Checkout Simulator</h3>
              <p className="text-3xs text-gray-500 mt-1 font-sans">
                Upgrading to: <span className="text-cyan-400 font-mono font-bold uppercase">{selectedPlan}</span> plan
              </p>
            </div>

            {checkoutError && (
              <div className="bg-red-950/40 border border-red-800/60 p-4.5 rounded-xl flex items-start space-x-2.5 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{checkoutError}</span>
              </div>
            )}

            {checkoutSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-800/60 p-4.5 rounded-xl flex items-start space-x-2.5 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{checkoutSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSimulatePayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-3xs font-bold uppercase tracking-wider text-gray-400">Card Number (16 digits)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                  <input 
                    type="text" 
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none pl-11 pr-4 py-3 rounded-xl text-xs text-white font-mono"
                    placeholder="4242 4242 4242 4242"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-3xs font-bold uppercase tracking-wider text-gray-400">Expiry (MM/YY)</label>
                  <input 
                    type="text" 
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none px-4 py-3 rounded-xl text-xs text-white font-mono"
                    placeholder="12/28"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-3xs font-bold uppercase tracking-wider text-gray-400">Security Code (CVC)</label>
                  <input 
                    type="password" 
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none px-4 py-3 rounded-xl text-xs text-white font-mono"
                    placeholder="***"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessingCheckout}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl text-xs transition"
              >
                {isProcessingCheckout ? "Upgrading Seat with Stripe..." : "Process Simulated Payment"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
