import React, { useState } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  Video, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  Users, 
  Zap, 
  ChevronDown, 
  CheckCircle,
  Play,
  ArrowRight
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onNavigateToBlog: () => void;
}

export default function LandingPage({ onGetStarted, onNavigateToBlog }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const stats = [
    { value: "45M+", label: "Creator Views Generated" },
    { value: "98.4%", label: "Bio CTA Conversion Boost" },
    { value: "15,000+", label: "Active Solopreneurs" },
    { value: "14+", label: "Social Media Channels Supported" }
  ];

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
      title: "AI Profile & Bio Audits",
      desc: "Instant conversion diagnostics for TikTok, Reels, and YouTube bios. Double your CTR in 5 minutes."
    },
    {
      icon: <Video className="w-6 h-6 text-purple-400" />,
      title: "Retention Script Builder",
      desc: "Generates multi-scene scripts formatted with micro-hooks, auditory cues, and scene directions."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-pink-400" />,
      title: "Visual Competitor Analyzer",
      desc: "Decodes successful niche models, visual trends, and gaps to build a reliable posting pipeline."
    },
    {
      icon: <Calendar className="w-6 h-6 text-amber-400" />,
      title: "Smart Content Calendar",
      desc: "Transforms simple themes into 30-day cross-platform campaigns designed to build direct subscribers."
    },
    {
      icon: <Zap className="w-6 h-6 text-red-400" />,
      title: "Thumbnail Overlay Optimizer",
      desc: "Evaluates visual layouts and suggests short, high-contrast clickbait texts that bypass standard blindness."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: "Analytics Screenshot Auditor",
      desc: "Upload analytics data to receive a precise strategic roadmap correcting early hook drop-offs."
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "$19",
      desc: "Accelerate your initial growth with elite viral content generators.",
      features: [
        "150 Premium High-Velocity Credits",
        "Viral Video Hooks & Multi-Platform Copy",
        "Advanced Intelligent Hashtag Clustering",
        "Standard Cloud Processing Queue",
        "Weekly Custom Content Outlines"
      ],
      popular: false
    },
    {
      name: "Creator",
      price: "$49",
      desc: "The complete system designed for high-impact content directors.",
      features: [
        "450 Premium High-Velocity Credits",
        "Full Suite of 15+ Advanced AI Tools",
        "Deep Automated Video Screenshot Analytics",
        "Priority Dedicated Server Routing",
        "Access to Pro Prompt Template Library",
        "Priority Support Reply (Under 4 Hours)"
      ],
      popular: true
    },
    {
      name: "Agency",
      price: "$99",
      desc: "Scale multiple profiles with enterprise production-grade AI.",
      features: [
        "1,200 Premium High-Velocity Credits",
        "Enterprise Custom Strategic System Directives",
        "Seamless Team Seat Allocation & Sharing",
        "24/7 VIP Engineering Support Desk",
        "Full Competitor Strategy Analytics Extraction"
      ],
      popular: false
    }
  ];

  const faqs = [
    {
      q: "What is a 'Credit' and how are they consumed?",
      a: "Each tool run consumes credits based on complexity. For instance, running a basic Caption Generator consumes 5 credits, while a deep visual Profile Audit or Analytics Screenshot Analyzer consumes 15 to 25 credits. Your balance refills on your monthly billing cycle."
    },
    {
      q: "Can I connect my real social accounts?",
      a: "CreatorPilot AI is designed for manual strategy input. By decoupling from direct account linking, we completely bypass API restrictions or risk of account bans. It acts as an elite, detached strategy desk."
    },
    {
      q: "Does CreatorPilot support multi-modal image analysis?",
      a: "Yes! Utilizing our deep Gemini model proxy, our Analytics Screenshot Analyzer can read base64 image data from your dashboard snips to diagnose performance anomalies directly on the server."
    },
    {
      q: "What is your refund policy?",
      a: "We offer an unconditional 7-day money-back guarantee if you haven't consumed more than 30 credits during your trial period. Simply file a support ticket from your dashboard."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0d0f12] text-[#f3f4f6] grid-bg">
      {/* Structural Header */}
      <header id="landing-header" className="sticky top-0 z-50 glass-panel border-b border-gray-800/80 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-cyan-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-cyan-500/10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            CreatorPilot<span className="text-cyan-400">.AI</span>
          </span>
        </div>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-300">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
          <button onClick={onNavigateToBlog} className="hover:text-white transition">Blog</button>
          <a href="#faq" className="hover:text-white transition">FAQ</a>
        </nav>
        <button 
          id="btn-login-hero"
          onClick={onGetStarted}
          className="bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition duration-250 flex items-center space-x-2"
        >
          <span>Console Dashboard</span>
          <ArrowRight className="w-4 h-4 text-cyan-400" />
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 via-transparent to-transparent -z-10 blur-3xl"></div>
        
        {/* Hype Pill */}
        <div className="inline-flex items-center space-x-2 bg-cyan-950/40 border border-cyan-800/60 px-4 py-1.5 rounded-full text-xs font-semibold text-cyan-300 mb-8 tracking-wide">
          <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>v2.5 Release: Enterprise Multi-Modal Analysis Live</span>
        </div>

        <h1 className="font-display font-bold text-4xl sm:text-6xl text-white tracking-tight leading-[1.1] max-w-4xl mx-auto mb-6">
          The Tactical Strategy Suite For <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500 bg-clip-text text-transparent">Modern Solopreneurs</span>
        </h1>

        <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
          Audit bio profiles, generate retention-focused video scripts, optimize thumbnail CTR, and diagnose analytics drop-offs with deep multi-modal AI.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <button 
            id="btn-hero-primary"
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition duration-300 transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
          >
            <span>Launch CreatorPilot Free</span>
            <Sparkles className="w-4 h-4 text-white" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto bg-gray-900 border border-gray-800 hover:bg-gray-800/80 text-gray-300 hover:text-white font-medium px-8 py-4 rounded-xl transition flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 text-cyan-400" />
            <span>See Features</span>
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto border-t border-gray-850 pt-16">
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-4">
              <div className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-xs text-gray-400 font-medium tracking-wide uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-gray-900">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight mb-4">
            A Complete Creator Command Center
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            15 specialized, production-ready AI tools configured specifically to optimize social algorithms and conversion rates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <div key={i} className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="bg-gray-900 border border-gray-800 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  {feat.icon}
                </div>
                <h3 className="font-display font-semibold text-lg text-white mb-3">{feat.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-sans">{feat.desc}</p>
              </div>
              <button 
                onClick={onGetStarted}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center space-x-1.5 mt-6 group"
              >
                <span>Launch Tool</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Premium Pricing Table */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-t border-gray-900">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight mb-4">
            Affordable Plans For Scaling Brands
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Awarding instant monthly credits for running diagnostic strategies. No hidden fees or direct social logins required.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={`glass-panel p-8 rounded-2xl relative flex flex-col justify-between ${
                plan.popular ? "border-cyan-500/50 shadow-lg shadow-cyan-500/5 bg-[#12161f]" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-cyan-500 text-cyan-950 font-semibold text-2xs px-3 py-1 rounded-full uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              <div>
                <div className="text-sm text-cyan-400 font-semibold uppercase tracking-wider mb-2">{plan.name}</div>
                <div className="flex items-baseline mb-4">
                  <span className="font-display font-bold text-4xl text-white">{plan.price}</span>
                  <span className="text-gray-400 text-sm ml-2">/ month</span>
                </div>
                <p className="text-xs text-gray-400 mb-6">{plan.desc}</p>
                <ul className="space-y-3.5 mb-8 text-sm">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start space-x-2.5 text-gray-300">
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={onGetStarted}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                  plan.popular 
                    ? "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20" 
                    : "bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white"
                }`}
              >
                Choose {plan.name} Package
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Accordion FAQ */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto border-t border-gray-900">
        <h2 className="font-display font-bold text-3xl text-center text-white mb-12 tracking-tight">
          Frequently Answered Inquiries
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="glass-panel rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                className="w-full text-left p-6 flex justify-between items-center font-semibold text-white focus:outline-none"
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <span>{faq.q}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                    activeFaq === index ? "rotate-180" : ""
                  }`} 
                />
              </button>
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  activeFaq === index ? "max-h-56 border-t border-gray-850 p-6" : "max-h-0 overflow-hidden"
                }`}
              >
                <p className="text-sm text-gray-400 leading-relaxed font-sans">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-gradient-to-b from-gray-950 to-black py-20 px-6 text-center border-t border-gray-900">
        <div className="max-w-4xl mx-auto">
          <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-6" />
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight mb-4">
            Ready To Accelerate Your Organic Traffic?
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-10 text-sm sm:text-base font-sans">
            Scale your content pipeline and double your conversions using CreatorPilot AI. Refillable starter credits waiting for you inside.
          </p>
          <button 
            onClick={onGetStarted}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-cyan-500/25 transition duration-300"
          >
            Launch Creator Console
          </button>
          
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 mt-16 border-t border-gray-900 pt-8">
            <span>© 2026 CreatorPilot AI. All rights reserved.</span>
            <a href="#features" className="hover:text-white transition">Privacy Rules</a>
            <a href="#pricing" className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </section>
    </div>
  );
}
