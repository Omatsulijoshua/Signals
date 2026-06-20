"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  TrendingUp, 
  CreditCard, 
  Megaphone, 
  Sparkles, 
  Trash2, 
  Check, 
  Plus, 
  ShieldAlert, 
  Loader2,
  RefreshCw
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptionStatus: string;
  subscriptionExpires: string | null;
  createdAt: string;
  _count: { referrals: number };
}

interface Signal {
  id: string;
  type: string;
  asset: string;
  direction: string;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskRatio: number;
  timeframe: string;
  aiConfidence: number;
  sentiment: string;
  status: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  provider: string;
  reference: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("signals"); // signals, users, payments, broadcast
  
  // Data lists
  const [users, setUsers] = useState<User[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  // Loaders
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states: New Signal
  const [sigType, setSigType] = useState("FOREX");
  const [sigAsset, setSigAsset] = useState("EURUSD");
  const [sigDir, setSigDir] = useState("BUY");
  const [sigEntry, setSigEntry] = useState("");
  const [sigSl, setSigSl] = useState("");
  const [sigTp1, setSigTp1] = useState("");
  const [sigTp2, setSigTp2] = useState("");
  const [sigTp3, setSigTp3] = useState("");
  const [sigRisk, setSigRisk] = useState("1.0");
  const [sigTimeframe, setSigTimeframe] = useState("1H");
  const [sigConfidence, setSigConfidence] = useState("80");
  const [sigSentiment, setSigSentiment] = useState("BULLISH");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Form states: Broadcast
  const [bcTitle, setBcTitle] = useState("");
  const [bcMessage, setBcMessage] = useState("");
  const [bcTarget, setBcTarget] = useState("ALL");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch users
      const usersRes = await fetch("http://localhost:5000/api/admin/users", { headers });
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Fetch signals
      const signalsRes = await fetch("http://localhost:5000/api/signals", { headers });
      const signalsData = await signalsRes.json();
      setSignals(signalsData);

      // Fetch payments
      const paymentsRes = await fetch("http://localhost:5000/api/payments", { headers });
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData);
    } catch (error) {
      console.error("Error fetching admin console data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // AI SIGNAL BUILDER PRE-FILL
  const handleAIGenerate = async () => {
    setAiGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/signals/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ asset: sigAsset, type: sigType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSigDir(data.direction);
      setSigEntry(data.entry.toString());
      setSigSl(data.sl.toString());
      setSigTp1(data.tp1.toString());
      setSigTp2(data.tp2.toString());
      setSigTp3(data.tp3.toString());
      setSigRisk(data.riskRatio.toString());
      setSigTimeframe(data.timeframe);
      setSigConfidence(data.aiConfidence.toString());
      setSigSentiment(data.sentiment);
    } catch (error) {
      console.error(error);
    } finally {
      setAiGenerating(false);
    }
  };

  // PUBLISH SIGNAL
  const handlePublishSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: sigType,
          asset: sigAsset,
          direction: sigDir,
          entry: sigEntry,
          sl: sigSl,
          tp1: sigTp1,
          tp2: sigTp2,
          tp3: sigTp3,
          riskRatio: sigRisk,
          timeframe: sigTimeframe,
          aiConfidence: sigConfidence,
          sentiment: sigSentiment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh list & Reset fields
      setSignals((prev) => [data, ...prev]);
      setSigEntry("");
      setSigSl("");
      setSigTp1("");
      setSigTp2("");
      setSigTp3("");
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // DELETE SIGNAL
  const handleDeleteSignal = async (id: string) => {
    if (!confirm("Delete this trading signal?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/signals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setSignals((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  // UPDATE USER SUBSCRIPTION STATUS DIRECTLY
  const handleOverrideSubscription = async (userId: string, newPlan: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subscriptionStatus: newPlan })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, subscriptionStatus: data.subscriptionStatus, subscriptionExpires: data.subscriptionExpires } : u));
    } catch (error) {
      console.error(error);
    }
  };

  // MANUAL PAYMENT APPROVAL
  const handleApprovePayment = async (payId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/payments/approve/${payId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPayments((prev) => prev.map((p) => p.id === payId ? { ...p, status: "SUCCESSFUL" } : p));
      fetchData(); // Refresh list to sync user status changes
    } catch (error) {
      console.error(error);
    }
  };

  // BROADCAST ANNOUNCEMENT
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/admin/notifications/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: bcTitle, message: bcMessage, planTarget: bcTarget })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBcTitle("");
      setBcMessage("");
      alert("System broadcast transmitted successfully!");
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Decrypting administration logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">SuperAdmin Terminal</h1>
          <p className="text-slate-400 text-sm mt-1">Platform-wide control parameters and broadcast systems.</p>
        </div>
        <button onClick={fetchData} className="p-3.5 rounded-xl border border-slate-900 hover:border-slate-800 transition-all text-slate-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2.5">
        {[
          { id: "signals", label: "Signals Manager", icon: TrendingUp },
          { id: "users", label: "Users Registry", icon: Users },
          { id: "payments", label: "Transaction Audits", icon: CreditCard },
          { id: "broadcast", label: "Broadcaster Channel", icon: Megaphone }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                activeTab === tab.id 
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                  : "border border-slate-900 bg-slate-950/20 text-slate-400 hover:text-white hover:border-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* RENDER TAB CONTENTS */}
      {activeTab === "signals" && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* CREATOR PANEL */}
          <div className="lg:col-span-1 p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm">
            <h3 className="text-base font-bold text-white mb-6">Create Setup</h3>
            
            <form onSubmit={handlePublishSignal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Asset Type</label>
                  <select 
                    value={sigType} 
                    onChange={(e) => {
                      setSigType(e.target.value);
                      setSigAsset(e.target.value === "FOREX" ? "EURUSD" : "BTC");
                    }} 
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-300 text-xs font-bold"
                  >
                    <option value="FOREX">Forex</option>
                    <option value="CRYPTO">Crypto</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Instrument</label>
                  <select 
                    value={sigAsset} 
                    onChange={(e) => setSigAsset(e.target.value)} 
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-300 text-xs font-bold"
                  >
                    {sigType === "FOREX" ? (
                      <>
                        <option value="EURUSD">EURUSD</option>
                        <option value="GBPUSD">GBPUSD</option>
                        <option value="XAUUSD">XAUUSD</option>
                      </>
                    ) : (
                      <>
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                        <option value="SOL">SOL</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* AI GENERATOR TRIGGER */}
              <button
                type="button"
                disabled={aiGenerating}
                onClick={handleAIGenerate}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-indigo-400 text-xs font-bold hover:bg-indigo-950/30 transition-all"
              >
                {aiGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Target Engine Preds</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Direction</label>
                  <select value={sigDir} onChange={(e) => setSigDir(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-300 text-xs font-bold">
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Entry Trigger</label>
                  <input type="number" step="any" required value={sigEntry} onChange={(e) => setSigEntry(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-100 text-xs font-mono" placeholder="1.0850" />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1 text-rose-400">Stop Loss (SL)</label>
                <input type="number" step="any" required value={sigSl} onChange={(e) => setSigSl(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-100 text-xs font-mono" placeholder="1.0820" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">TP 1</label>
                  <input type="number" step="any" required value={sigTp1} onChange={(e) => setSigTp1(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-100 text-xs font-mono" placeholder="1.0880" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">TP 2</label>
                  <input type="number" step="any" required value={sigTp2} onChange={(e) => setSigTp2(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-100 text-xs font-mono" placeholder="1.0910" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">TP 3</label>
                  <input type="number" step="any" required value={sigTp3} onChange={(e) => setSigTp3(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-100 text-xs font-mono" placeholder="1.0940" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Timeframe</label>
                  <input type="text" value={sigTimeframe} onChange={(e) => setSigTimeframe(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-100 text-xs font-bold" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Risk %</label>
                  <input type="number" step="any" value={sigRisk} onChange={(e) => setSigRisk(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-100 text-xs font-bold" />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-4 py-3.5 rounded-xl font-bold bg-indigo-600 text-white text-xs hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Transmit Live Signal"}
              </button>
            </form>
          </div>

          {/* LIST EDITOR */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm">
            <h3 className="text-base font-bold text-white mb-6">Historical Logs</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-400">
                <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-900 pb-3">
                  <tr>
                    <th className="pb-3">Asset</th>
                    <th className="pb-3">Entry</th>
                    <th className="pb-3">SL / TP3</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {signals.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/10">
                      <td className="py-3.5 font-bold text-white flex items-center space-x-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.direction === "BUY" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{s.asset}</span>
                        <span className="text-[9px] text-slate-500 font-normal">({s.direction})</span>
                      </td>
                      <td className="py-3.5 font-mono">{s.entry}</td>
                      <td className="py-3.5 font-mono text-slate-500">
                        {s.sl} / {s.tp3}
                      </td>
                      <td className="py-3.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          s.status === "ACTIVE" 
                            ? "bg-slate-800 text-slate-300" 
                            : ["TP1", "TP2", "TP3"].includes(s.status)
                            ? "bg-emerald-500/20 text-emerald-400"
                            : s.status === "SL"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-slate-900 text-slate-600"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button onClick={() => handleDeleteSignal(s.id)} className="p-1.5 rounded-lg border border-slate-900 hover:border-rose-500/20 hover:text-rose-400 transition-all text-slate-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm">
          <h3 className="text-base font-bold text-white mb-6">User Accounts</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-900">
                <tr>
                  <th className="pb-3">User Details</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Referred Count</th>
                  <th className="pb-3">Current VIP Plan</th>
                  <th className="pb-3 text-right">Subscription Action Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/10">
                    <td className="py-4">
                      <span className="block font-bold text-white">{u.name}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{u.email}</span>
                    </td>
                    <td className="py-4 font-semibold text-slate-300">{u.role}</td>
                    <td className="py-4 font-mono font-bold">{u._count?.referrals || 0}</td>
                    <td className="py-4">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        u.subscriptionStatus !== "NONE" 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : "bg-slate-800 text-slate-500 border border-slate-700"
                      }`}>
                        {u.subscriptionStatus}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {["NONE", "BASIC", "PRO", "VIP"].map((tier) => (
                          <button
                            key={tier}
                            disabled={u.subscriptionStatus === tier}
                            onClick={() => handleOverrideSubscription(u.id, tier)}
                            className="px-2.5 py-1 rounded-md border border-slate-900 bg-slate-950 hover:bg-slate-900 text-[10px] text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:scale-100 font-bold uppercase"
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm">
          <h3 className="text-base font-bold text-white mb-6">Audited Payments</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-900">
                <tr>
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Gateway</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Manual Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/10">
                    <td className="py-4 font-mono font-bold text-[11px] text-slate-300">{p.reference}</td>
                    <td className="py-4">
                      <span className="block text-white font-bold">{p.user?.name}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{p.user?.email}</span>
                    </td>
                    <td className="py-4 font-semibold">{p.provider}</td>
                    <td className="py-4 font-mono font-bold text-white">${p.amount}</td>
                    <td className="py-4">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        p.status === "SUCCESSFUL" 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : p.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {p.status === "PENDING" && (
                        <button
                          onClick={() => handleApprovePayment(p.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all text-[10px]"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "broadcast" && (
        <div className="max-w-2xl p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm">
          <h3 className="text-base font-bold text-white mb-2">Transmit Notification Alert</h3>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            Broadcast message telemetry in real-time to active WebSocket clients.
          </p>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Target Audience</label>
              <select value={bcTarget} onChange={(e) => setBcTarget(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-300 text-xs font-bold">
                <option value="ALL">All Registered Users</option>
                <option value="BASIC">Basic Subscribers Only</option>
                <option value="PRO">Pro Subscribers Only</option>
                <option value="VIP">VIP Subscribers Only</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Notice Title</label>
              <input type="text" required value={bcTitle} onChange={(e) => setBcTitle(e.target.value)} placeholder="🚀 Scheduled Platform Maintenance" className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-100 text-xs font-bold" />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Message Body</label>
              <textarea required rows={4} value={bcMessage} onChange={(e) => setBcMessage(e.target.value)} placeholder="Write details here..." className="w-full py-2.5 px-3 rounded-xl border border-slate-900 bg-slate-950 text-slate-100 text-xs font-medium" />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3.5 rounded-xl font-bold bg-indigo-600 text-white text-xs hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center space-x-1.5"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Transmit Broadcast Alert</span></>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
