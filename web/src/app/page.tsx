"use client";

import Link from "next/link";
import { TrendingUp, Activity, ShieldCheck, Award, Zap, Bell, Check, Users, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#060814] flex flex-col selection:bg-[#06b6d4] selection:text-[#060814]">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-[60vh] right-1/4 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full px-4 lg:px-8 py-4 bg-[#060814]/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              SIGNALS PRO
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a>
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Live Feed</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link 
              href="/auth/register" 
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative px-4 pt-20 pb-16 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <Zap className="w-3.5 h-3.5" />
          <span>REAL-TIME PIP & ROI CALCULATOR ENGINE LIVE</span>
        </div>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
          Supercharge Your Trades with{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            High-Accuracy Signals
          </span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl font-light">
          Get real-time Forex & Crypto trading alerts straight to your web browser and mobile app. Built with automatic targets, SL checking, and AI sentiment analysis.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link 
            href="/auth/register" 
            className="flex items-center space-x-2 px-8 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-slate-950 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
          >
            <span>Start Trading Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            href="#pricing" 
            className="px-8 py-4 text-base font-bold rounded-xl border border-slate-800 bg-slate-950/40 text-slate-300 hover:text-white hover:bg-slate-900/60 hover:border-slate-700 transition-all"
          >
            View Pricing
          </Link>
        </div>

        {/* HERO STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl w-full mt-24 px-6 py-8 rounded-2xl border border-slate-900 bg-slate-950/30 backdrop-blur-sm">
          <div className="text-center md:border-r border-slate-900">
            <span className="block text-3xl lg:text-4xl font-extrabold text-cyan-400">84.6%</span>
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1 block">Win Rate</span>
          </div>
          <div className="text-center md:border-r border-slate-900">
            <span className="block text-3xl lg:text-4xl font-extrabold text-emerald-400">+4,850+</span>
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1 block">Monthly Pips</span>
          </div>
          <div className="text-center md:border-r border-slate-900">
            <span className="block text-3xl lg:text-4xl font-extrabold text-purple-400">&lt; 3.8s</span>
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1 block">Latency Alert</span>
          </div>
          <div className="text-center">
            <span className="block text-3xl lg:text-4xl font-extrabold text-white">12,480+</span>
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1 block">Active Users</span>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="px-4 py-20 lg:px-8 border-t border-slate-900 bg-[#04060f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Designed For High-Performance Traders
            </h2>
            <p className="mt-4 text-slate-400">
              Stop guessing. Access a structured trade tracking dashboard and execution layer engineered for accuracy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-cyan-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/50 flex items-center justify-center text-cyan-400 border border-cyan-500/20 mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Real-Time Price Sync</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connects directly to Live APIs (Binance for Crypto, Forex volatility engines) to track entry triggers and TP/SL values instantly.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/50 flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Detailed ROI Tracking</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Watch target hits update live. ROI, duration, and win-loss status calculations are handled automatically for all accounts.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-purple-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-950/50 flex items-center justify-center text-purple-400 border border-purple-500/20 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Secure Payment Gateways</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Subscribe seamlessly via Stripe globally, or Paystack and Flutterwave locally. Instant automatic webhook verification ensures 0 downtime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="px-4 py-24 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Choose Your Trading Intelligence Tier
          </h2>
          <p className="mt-4 text-slate-400">
            Unleash the full potential of professional signals with customizable subscriptions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {/* BASIC */}
          <div className="p-8 rounded-2xl bg-slate-950/20 border border-slate-900 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div>
              <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Basic</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-black text-white">$9.99</span>
                <span className="text-slate-500 ml-2">/ month</span>
              </div>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                Perfect for hobbyists looking to test basic trade entries and setups.
              </p>
              <ul className="mt-8 space-y-4 text-sm text-slate-300">
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Access to Entry Targets & TP1</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Live price tracking feed</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-600 line-through">
                  <Check className="w-4 h-4 text-slate-600" />
                  <span>TP2 / TP3 Locked</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-600 line-through">
                  <Check className="w-4 h-4 text-slate-600" />
                  <span>AI Sentiment analysis score</span>
                </li>
              </ul>
            </div>
            <Link 
              href="/auth/register?plan=BASIC" 
              className="mt-8 w-full block text-center py-3 px-4 font-bold text-sm rounded-lg border border-slate-800 text-slate-300 bg-slate-950 hover:bg-slate-900 transition-all"
            >
              Get Basic Access
            </Link>
          </div>

          {/* PRO */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-950/60 border-2 border-cyan-500/50 flex flex-col justify-between relative shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:scale-105 transition-all">
            <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 text-xs font-bold rounded-full bg-cyan-500 text-slate-950 uppercase tracking-widest">
              Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-widest">Pro</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-black text-white">$29.99</span>
                <span className="text-slate-500 ml-2">/ month</span>
              </div>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                For active traders aiming to maximize profits and review advanced targets.
              </p>
              <ul className="mt-8 space-y-4 text-sm text-slate-300">
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Access to TP1 & TP2 targets</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Live price tracking feed</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Push notification alerts (FCM)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>AI confidence score indicators</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-600 line-through">
                  <Check className="w-4 h-4 text-slate-600" />
                  <span>TP3 target locked</span>
                </li>
              </ul>
            </div>
            <Link 
              href="/auth/register?plan=PRO" 
              className="mt-8 w-full block text-center py-3 px-4 font-bold text-sm rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
            >
              Get Pro Access
            </Link>
          </div>

          {/* VIP */}
          <div className="p-8 rounded-2xl bg-slate-950/20 border border-slate-900 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div>
              <h3 className="text-lg font-bold text-purple-400 uppercase tracking-widest">VIP Elite</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-black text-white">$79.99</span>
                <span className="text-slate-500 ml-2">/ month</span>
              </div>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                Complete access to all features, custom high-ROI targets, and premium broadcasts.
              </p>
              <ul className="mt-8 space-y-4 text-sm text-slate-300">
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Access to all targets (TP1, TP2, TP3)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Uncensored Stop Loss values</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Full AI Sentiment & Market scoring</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Copy Trading Simulation dashboard</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Direct Telegram channel entry</span>
                </li>
              </ul>
            </div>
            <Link 
              href="/auth/register?plan=VIP" 
              className="mt-8 w-full block text-center py-3 px-4 font-bold text-sm rounded-lg border border-purple-500/30 text-purple-300 bg-purple-950/20 hover:bg-purple-950/40 transition-all"
            >
              Get VIP Access
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-12 border-t border-slate-900 bg-slate-950/60 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-extrabold text-white text-base tracking-tight">SIGNALS PRO</span>
          <p>© 2026 Signals Pro Platform. All rights reserved. Trading financial markets carries risks.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
