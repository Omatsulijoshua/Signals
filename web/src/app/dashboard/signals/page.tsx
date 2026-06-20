"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Lock, 
  TrendingUp, 
  Percent, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  CheckCircle,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { io } from "socket.io-client";

interface Signal {
  id: string;
  type: string;
  asset: string;
  direction: string;
  entry: number;
  sl: number | null;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  riskRatio: number;
  timeframe: string;
  aiConfidence: number;
  sentiment: string;
  status: string;
  createdAt: string;
  locked: boolean;
  result: {
    currentPrice: number;
    profitLoss: number;
    roi: number;
    status: string;
    duration: number;
  } | null;
}

export default function SignalsFeed() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL"); // ALL, FOREX, CRYPTO
  const [filterStatus, setFilterStatus] = useState<string>("ALL"); // ALL, ACTIVE, COMPLETED
  const [userPlan, setUserPlan] = useState<string>("NONE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserPlan(JSON.parse(storedUser).subscriptionStatus);
    }

    const fetchSignals = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/signals", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setSignals(data);
      } catch (error) {
        console.error("Error loading signals feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();

    // Listen for WebSocket ticks
    const socket = io("http://localhost:5000");
    socket.on("signal-price-tick", (data: any) => {
      setSignals((prev) => 
        prev.map((sig) => {
          if (sig.id === data.signalId) {
            return {
              ...sig,
              status: data.status,
              result: sig.result 
                ? { ...sig.result, currentPrice: data.currentPrice, profitLoss: data.profitLoss, roi: data.roi, status: data.status }
                : { currentPrice: data.currentPrice, profitLoss: data.profitLoss, roi: data.roi, status: data.status, duration: 0 }
            };
          }
          return sig;
        })
      );
    });

    socket.on("new-signal", (newSig: any) => {
      setSignals((prev) => [newSig, ...prev]);
    });

    socket.on("update-signal", (updatedSig: any) => {
      setSignals((prev) => prev.map(s => s.id === updatedSig.id ? updatedSig : s));
    });

    socket.on("delete-signal", (data: any) => {
      setSignals((prev) => prev.filter(s => s.id !== data.id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Decrypting live telemetry feeds...</p>
      </div>
    );
  }

  // Apply filters
  const filteredSignals = signals.filter((sig) => {
    const matchesType = filterType === "ALL" || sig.type === filterType;
    
    let matchesStatus = true;
    if (filterStatus === "ACTIVE") {
      matchesStatus = ["PENDING", "ACTIVE", "TP1", "TP2"].includes(sig.status);
    } else if (filterStatus === "COMPLETED") {
      matchesStatus = ["TP3", "SL", "EXPIRED"].includes(sig.status);
    }
    
    return matchesType && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Signals Terminal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse real-time market opportunities with detailed metrics.
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-slate-900 bg-slate-950/40 p-1">
            {["ALL", "FOREX", "CRYPTO"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                  filterType === type 
                    ? "bg-slate-900 text-cyan-400 border border-slate-800" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg border border-slate-900 bg-slate-950/40 p-1">
            {["ALL", "ACTIVE", "COMPLETED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                  filterStatus === status 
                    ? "bg-slate-900 text-cyan-400 border border-slate-800" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SIGNALS LIST */}
      {filteredSignals.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-slate-900 bg-slate-950/10 text-slate-500 text-sm">
          💤 No signals matching the criteria are currently available. Check back soon!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredSignals.map((sig) => {
            const pnl = sig.result?.profitLoss || 0;
            const current = sig.result?.currentPrice || sig.entry;
            const isForex = sig.type === "FOREX";
            const dirColor = sig.direction === "BUY" ? "text-emerald-400" : "text-rose-400";
            const isCompleted = ["TP3", "SL", "EXPIRED"].includes(sig.status);

            return (
              <div 
                key={sig.id} 
                className={`p-6 rounded-2xl glass transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isCompleted 
                    ? "border-slate-900 hover:border-slate-800" 
                    : sig.direction === "BUY" 
                    ? "hover:border-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)]" 
                    : "hover:border-rose-500/20 hover:shadow-[0_0_20px_rgba(244,63,94,0.05)]"
                }`}
              >
                {/* Glow bar */}
                <div className={`absolute top-0 left-0 w-full h-[3px] ${
                  isCompleted 
                    ? "bg-slate-800" 
                    : sig.direction === "BUY" 
                    ? "bg-emerald-500" 
                    : "bg-rose-500"
                }`} />

                {/* Top header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-black text-white">{sig.asset}</span>
                      <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded ${
                        sig.direction === "BUY" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {sig.direction}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold border border-slate-800 px-2 py-0.5 rounded">
                        {sig.timeframe}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      Posted: {new Date(sig.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isCompleted && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-green" />
                    )}
                    <span className={`text-xs font-bold uppercase ${
                      isCompleted ? "text-slate-500" : "text-cyan-400"
                    }`}>
                      {sig.status}
                    </span>
                  </div>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-2 gap-6 border-b border-slate-900 pb-6 mb-6">
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Entry Trigger</span>
                    <span className="text-base font-extrabold text-slate-300 font-mono mt-1 block">{sig.entry}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Current price</span>
                    <span className="text-base font-extrabold text-white font-mono mt-1 block">{current}</span>
                  </div>
                </div>

                {/* Target Progress Bars */}
                <div className="space-y-4 mb-6 relative">
                  <h4 className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>Target Milestones</span>
                    <span className={`font-mono text-xs ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {sig.locked ? "Locked" : `${pnl >= 0 ? "+" : ""}${pnl} ${isForex ? "pips" : "%"}`}
                    </span>
                  </h4>

                  {sig.locked ? (
                    // LOCK SCREEN
                    <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center text-center space-y-2 py-6">
                      <Lock className="w-5 h-5 text-slate-600" />
                      <span className="text-xs font-bold text-slate-400">Target Analytics Encrypted</span>
                      <p className="text-[10px] text-slate-500 max-w-[220px]">
                        Subscribe to basic, pro, or VIP tiers to reveal SL, TP1, and TP2 thresholds.
                      </p>
                      <Link 
                        href="/dashboard/subscription"
                        className="text-[10px] font-bold text-cyan-400 hover:underline flex items-center space-x-1 mt-1"
                      >
                        <span>Upgrade Plan</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    // PROGRESS STAGE
                    <div className="space-y-3">
                      {/* SL */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 flex items-center space-x-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Stop Loss (SL)</span>
                        </span>
                        <span className="font-mono text-slate-400 font-bold">{sig.sl || "LOCKED"}</span>
                      </div>
                      
                      {/* TP1 */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 flex items-center space-x-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-500" />
                          <span>Take Profit 1 (TP1)</span>
                        </span>
                        <span className="font-mono text-slate-400 font-bold">{sig.tp1 || "LOCKED"}</span>
                      </div>

                      {/* TP2 */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 flex items-center space-x-1.5">
                          {sig.tp2 ? (
                            <CheckCircle className="w-3.5 h-3.5 text-cyan-500" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-700" />
                          )}
                          <span>Take Profit 2 (TP2)</span>
                        </span>
                        <span className={`font-mono font-bold ${sig.tp2 ? "text-slate-400" : "text-slate-700"}`}>
                          {sig.tp2 || "LOCKED"}
                        </span>
                      </div>

                      {/* TP3 */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 flex items-center space-x-1.5">
                          {sig.tp3 ? (
                            <CheckCircle className="w-3.5 h-3.5 text-cyan-500" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-700" />
                          )}
                          <span>Take Profit 3 (TP3)</span>
                        </span>
                        <span className={`font-mono font-bold ${sig.tp3 ? "text-slate-400" : "text-slate-700"}`}>
                          {sig.tp3 || "LOCKED"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI enhancement details */}
                <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500/80" />
                    <span>AI Score:</span>
                    <span className="font-bold text-slate-300">{sig.aiConfidence}%</span>
                  </div>

                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <span>Sentiment:</span>
                    <span className={`font-bold ${
                      sig.sentiment === "BULLISH" 
                        ? "text-emerald-400" 
                        : sig.sentiment === "BEARISH" 
                        ? "text-rose-400" 
                        : "text-slate-400"
                    }`}>
                      {sig.sentiment}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
