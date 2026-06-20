"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";
import { 
  TrendingUp, 
  Award, 
  Compass, 
  CheckCircle2, 
  ChevronRight, 
  Lock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { io } from "socket.io-client";

interface Analytics {
  totalSignals: number;
  activeSignals: number;
  winRate: number;
  totalROI: number;
  averageROI: number;
  bestAsset: string;
}

interface Signal {
  id: string;
  type: string;
  asset: string;
  direction: string;
  entry: number;
  sl: number | null;
  tp1: number | null;
  status: string;
  createdAt: string;
  locked: boolean;
  result: {
    currentPrice: number;
    profitLoss: number;
    roi: number;
    status: string;
  } | null;
}

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Analytics
        const analyticsRes = await fetch("http://localhost:5000/api/signals/analytics");
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);

        // Fetch Signals
        const signalsRes = await fetch("http://localhost:5000/api/signals", { headers });
        const signalsData = await signalsRes.json();
        setSignals(signalsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Listen to real-time tick updates to sync current price and ROI
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
                : { currentPrice: data.currentPrice, profitLoss: data.profitLoss, roi: data.roi, status: data.status }
            };
          }
          return sig;
        })
      );
    });

    socket.on("new-signal", (newSig: any) => {
      setSignals((prev) => [newSig, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Decrypting terminal stats...</p>
      </div>
    );
  }

  // Calculate Cumulative ROI data for the Recharts graph
  // Sort signals chronological (oldest first) to accumulate
  const historicalSignals = [...signals]
    .filter(s => s.result && ["TP1", "TP2", "TP3", "SL"].includes(s.status))
    .reverse();

  let accum = 0;
  const chartData = historicalSignals.map((s, index) => {
    accum += s.result?.roi || 0;
    return {
      name: `Trade ${index + 1}`,
      ROI: Math.round(accum * 10) / 10,
      Asset: s.asset
    };
  });

  // Fallback if chartData is empty
  const graphData = chartData.length > 0 ? chartData : [
    { name: "Start", ROI: 0 },
    { name: "Trade 1", ROI: 4.2 },
    { name: "Trade 2", ROI: 8.5 },
    { name: "Trade 3", ROI: 7.0 },
    { name: "Trade 4", ROI: 14.8 }
  ];

  const activeSignals = signals.filter(s => ["PENDING", "ACTIVE", "TP1", "TP2"].includes(s.status));

  return (
    <div className="space-y-8">
      {/* WELCOME BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Dashboard Terminal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Standard metrics, live telemetry price updates, and cumulative profits.
          </p>
        </div>
        {user?.subscriptionStatus === "NONE" && (
          <Link 
            href="/dashboard/subscription"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 text-xs font-bold hover:bg-cyan-950/40 transition-all hover:scale-[1.02]"
          >
            <span>Lock VIP Access to reveal Targets</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* STATS TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glass hover:border-slate-800 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Platform Win Rate</span>
            <Award className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="block text-3xl font-extrabold text-white text-glow-cyan">
            {analytics?.winRate}%
          </span>
          <span className="text-xs text-slate-500 mt-2 block font-medium">Historical precision</span>
        </div>

        <div className="p-6 rounded-2xl glass hover:border-slate-800 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Cumulative ROI</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="block text-3xl font-extrabold text-emerald-400 text-glow-green">
            +{analytics?.totalROI}%
          </span>
          <span className="text-xs text-slate-500 mt-2 block font-medium">Net profit multiplier</span>
        </div>

        <div className="p-6 rounded-2xl glass hover:border-slate-800 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Average ROI</span>
            <Compass className="w-5 h-5 text-purple-400" />
          </div>
          <span className="block text-3xl font-extrabold text-purple-400">
            +{analytics?.averageROI}%
          </span>
          <span className="text-xs text-slate-500 mt-2 block font-medium">Per completed trade</span>
        </div>

        <div className="p-6 rounded-2xl glass hover:border-slate-800 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Active Signals</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-green" />
          </div>
          <span className="block text-3xl font-extrabold text-white">
            {activeSignals.length}
          </span>
          <span className="text-xs text-slate-500 mt-2 block font-medium">Running right now</span>
        </div>
      </div>

      {/* CHART & DETAILS GRID */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* CHART AREA */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm flex flex-col justify-between">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Cumulative ROI Timeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">Chronological trade execution trajectory</p>
            </div>
            <span className="text-xs text-slate-400 font-semibold border border-slate-800 px-2.5 py-1 rounded-lg">
              Asset Base: Forex + Crypto
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid #1e293b", borderRadius: "8px" }}
                  labelStyle={{ color: "#94a3b8", fontSize: "12px", fontWeight: "bold" }}
                  itemStyle={{ color: "#22d3ee", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="ROI" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorRoi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP ASSETS / SIDE INFO */}
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Platform Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">Key trading indicators summary</p>
          </div>

          <div className="my-6 space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl border border-slate-900 bg-slate-950/40">
              <span className="text-xs text-slate-400">Best Performing Asset</span>
              <span className="text-xs font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-950/20 px-2.5 py-1 rounded-lg">
                {analytics?.bestAsset}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl border border-slate-900 bg-slate-950/40">
              <span className="text-xs text-slate-400">Verified Integrations</span>
              <span className="text-xs font-bold text-white">Stripe, Paystack</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl border border-slate-900 bg-slate-950/40">
              <span className="text-xs text-slate-400">Signal Latency</span>
              <span className="text-xs font-bold text-cyan-400">WebSocket (~30ms)</span>
            </div>
          </div>

          <Link
            href="/dashboard/signals"
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 font-bold text-xs rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <span>Open Interactive Feed</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* QUICK LIVE FEED WIDGET */}
      <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Active Signal Telemetry</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time indicators on current positions</p>
          </div>
          <Link href="/dashboard/signals" className="text-xs font-semibold text-cyan-400 hover:underline">
            View All
          </Link>
        </div>

        {activeSignals.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            💤 No active signals open currently. Create a signal in Admin to trigger ticks.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-900">
                <tr>
                  <th className="pb-3 font-semibold">Asset</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Entry</th>
                  <th className="pb-3 font-semibold">Current Price</th>
                  <th className="pb-3 font-semibold">Targets Status</th>
                  <th className="pb-3 font-semibold text-right">Running P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {activeSignals.slice(0, 4).map((sig) => {
                  const pnl = sig.result?.profitLoss || 0;
                  return (
                    <tr key={sig.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-4 font-bold text-white flex items-center space-x-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${sig.direction === "BUY" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{sig.asset}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({sig.direction})</span>
                      </td>
                      <td className="py-4 text-xs font-semibold">{sig.type}</td>
                      <td className="py-4 text-slate-300 font-mono">{sig.entry}</td>
                      <td className="py-4 text-slate-100 font-mono font-bold">
                        {sig.result?.currentPrice || sig.entry}
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          sig.status === "ACTIVE" 
                            ? "bg-slate-800 text-slate-300 border border-slate-700" 
                            : sig.status === "PENDING"
                            ? "bg-slate-900 text-slate-500"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}>
                          {sig.status}
                        </span>
                      </td>
                      <td className={`py-4 text-right font-mono font-bold ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {sig.locked ? (
                          <div className="flex items-center justify-end space-x-1 text-slate-600">
                            <Lock className="w-3 h-3" />
                            <span className="text-[10px]">Locked</span>
                          </div>
                        ) : (
                          <>
                            {pnl >= 0 ? "+" : ""}
                            {pnl} {sig.type === "FOREX" ? "pips" : "%"}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
