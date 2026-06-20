"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  CreditCard, 
  Check, 
  Loader2, 
  ChevronRight, 
  ShieldCheck, 
  Coins, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  status: string;
  provider: string;
  reference: string;
  createdAt: string;
}

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal checkout state
  const [checkoutReference, setCheckoutReference] = useState<string | null>(null);
  const [checkoutAmount, setCheckoutAmount] = useState<number>(0);
  const [checkoutPlan, setCheckoutPlan] = useState<string>("");
  const [checkoutProvider, setCheckoutProvider] = useState<string>("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/payments/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setPayments(data);
      } catch (error) {
        console.error("Error loading payment history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleCheckout = async (plan: string, provider: string) => {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan, provider })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to initialize payment");

      setCheckoutReference(data.reference);
      setCheckoutAmount(data.amount);
      setCheckoutPlan(plan);
      setCheckoutProvider(provider);
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSimulateWebhook = async (success: boolean) => {
    if (!checkoutReference) return;
    setSimulatingWebhook(true);
    try {
      let endpoint = "stripe-webhook";
      let payload: any = { reference: checkoutReference };

      if (checkoutProvider === "STRIPE") {
        endpoint = "stripe-webhook";
        payload.success = success;
      } else if (checkoutProvider === "PAYSTACK") {
        endpoint = "paystack-webhook";
        payload.status = success ? "success" : "failed";
      } else if (checkoutProvider === "FLUTTERWAVE") {
        endpoint = "flutterwave-webhook";
        payload.status = success ? "successful" : "failed";
      } else {
        // Fallback or Admin manual override
        endpoint = `approve/${checkoutReference}`; // Custom manual approve
      }

      const res = await fetch(`http://localhost:5000/api/payments/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Webhook simulation failed");

      // Successful webhook mock callback triggers real user settings refresh
      if (success) {
        // Local state sync
        const updatedUser = { ...user, subscriptionStatus: checkoutPlan };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        // Fetch refreshed payment history
        const token = localStorage.getItem("token");
        const histRes = await fetch("http://localhost:5000/api/payments/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const histData = await histRes.json();
        setPayments(histData);
      }

      // Close modal
      setCheckoutReference(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Decrypting payment registry...</p>
      </div>
    );
  }

  const plans = [
    { name: "BASIC", price: "$9.99", desc: "Unlock entry ranges & TP1 targets.", color: "text-emerald-400 border-emerald-500/20 bg-emerald-950/10" },
    { name: "PRO", price: "$29.99", desc: "Unlock TP1 + TP2, notifications, and AI scores.", color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20" },
    { name: "VIP", price: "$79.99", desc: "Unlock TP3, SL indicators, sentiment details, copytrading, and Telegram VIP channels.", color: "text-purple-400 border-purple-500/20 bg-purple-950/10" }
  ];

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          VIP Subscriptions
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Lock premium market analytics, high-accuracy target milestones, and SMS alert telemetry.
        </p>
      </div>

      {/* PLANS CARDS */}
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((p) => (
          <div 
            key={p.name} 
            className={`p-6 rounded-2xl border flex flex-col justify-between ${
              user?.subscriptionStatus === p.name 
                ? "border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)] relative" 
                : "border-slate-900 bg-slate-950/10"
            }`}
          >
            {user?.subscriptionStatus === p.name && (
              <span className="absolute top-0 right-6 -translate-y-1/2 px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-cyan-500 text-slate-950 uppercase tracking-wider">
                Current Plan
              </span>
            )}
            <div>
              <h3 className={`text-base font-bold uppercase tracking-wider ${p.color.split(" ")[0]}`}>{p.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-black text-white">{p.price}</span>
                <span className="text-slate-500 text-xs ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed">{p.desc}</p>
            </div>

            <div className="mt-8 space-y-3">
              <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-2">Select gateway</span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={user?.subscriptionStatus === p.name || checkoutLoading}
                  onClick={() => handleCheckout(p.name, "STRIPE")}
                  className="py-2 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition-all disabled:opacity-30"
                >
                  Stripe
                </button>
                <button
                  disabled={user?.subscriptionStatus === p.name || checkoutLoading}
                  onClick={() => handleCheckout(p.name, "PAYSTACK")}
                  className="py-2 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition-all disabled:opacity-30"
                >
                  Paystack
                </button>
              </div>
              <button
                disabled={user?.subscriptionStatus === p.name || checkoutLoading}
                onClick={() => handleCheckout(p.name, "FLUTTERWAVE")}
                className="w-full py-2 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition-all disabled:opacity-30"
              >
                Flutterwave
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* WEBHOOK SIMULATOR MODAL */}
      {checkoutReference && (
        <div className="fixed inset-0 z-50 bg-[#060814]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl border border-slate-800 bg-[#0a0d1f] shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">💳 Payment Gateway Simulator</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              We have generated a mock checkout transaction session. Select an outcome below to simulate the API webhook callback.
            </p>

            <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/60 space-y-2 text-xs font-mono mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan Tier:</span>
                <span className="text-purple-400 font-bold">{checkoutPlan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount due:</span>
                <span className="text-white">${checkoutAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway Ref:</span>
                <span className="text-cyan-400 text-[10px]">{checkoutReference}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                disabled={simulatingWebhook}
                onClick={() => handleSimulateWebhook(true)}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-emerald-500 text-slate-950 text-xs hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center space-x-1"
              >
                {simulatingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Simulate Success</span></>}
              </button>

              <button
                disabled={simulatingWebhook}
                onClick={() => handleSimulateWebhook(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-rose-500 text-slate-950 text-xs hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all flex items-center justify-center"
              >
                Simulate Fail
              </button>
            </div>

            <button
              onClick={() => setCheckoutReference(null)}
              className="mt-4 w-full py-2.5 text-center text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase transition-all"
            >
              Cancel Checkout
            </button>
          </div>
        </div>
      )}

      {/* TRANSACTION LOGS */}
      <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm">
        <h3 className="text-base font-bold text-white mb-6">Invoice & Billing History</h3>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            💤 No invoices generated. Initiate a gateway checkout to create logs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-900">
                <tr>
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Gateway</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 font-mono text-[11px] text-slate-300 font-bold">{p.reference}</td>
                    <td className="py-4 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 text-xs font-semibold">{p.provider}</td>
                    <td className="py-4 font-mono text-xs text-white">${p.amount}</td>
                    <td className="py-4 text-right">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
                        p.status === "SUCCESSFUL" 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : p.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading subscription terminal...</div>}>
      <SubscriptionContent />
    </Suspense>
  );
}
