"use client";

import { useEffect, useState } from "react";
import { 
  Gift, 
  Copy, 
  Check, 
  Users, 
  Coins, 
  Share2, 
  ChevronRight 
} from "lucide-react";

interface ReferralUser {
  id: string;
  name: string;
  subscriptionStatus: string;
  createdAt: string;
}

export default function ReferralsDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error("Error loading profile referrals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleCopyLink = () => {
    if (!profile) return;
    const inviteLink = `${window.location.origin}/auth/register?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Decrypting referral tree...</p>
      </div>
    );
  }

  const referrals: ReferralUser[] = profile?.referrals || [];
  const activeReferralsCount = referrals.filter(r => r.subscriptionStatus !== "NONE").length;
  
  // Estimate payout: $5 per active referral subscription
  const estimatedEarnings = activeReferralsCount * 5.0;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Referral Program
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Invite fellow traders to Signals Pro. Earn recurring subscription rebates for every active member.
        </p>
      </div>

      {/* REBATES PANEL */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl glass hover:border-slate-800 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Total Invites</span>
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="block text-3xl font-extrabold text-white">
            {referrals.length}
          </span>
          <span className="text-xs text-slate-500 mt-2 block font-medium">Registered accounts</span>
        </div>

        <div className="p-6 rounded-2xl glass hover:border-slate-800 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Active Subscriptions</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-green" />
          </div>
          <span className="block text-3xl font-extrabold text-emerald-400 text-glow-green">
            {activeReferralsCount}
          </span>
          <span className="text-xs text-slate-500 mt-2 block font-medium">BASIC, PRO, or VIP tiers</span>
        </div>

        <div className="p-6 rounded-2xl glass hover:border-slate-800 transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Bonuses Earned</span>
            <Coins className="w-5 h-5 text-yellow-500/80" />
          </div>
          <span className="block text-3xl font-extrabold text-white">
            ${estimatedEarnings.toFixed(2)}
          </span>
          <span className="text-xs text-slate-500 mt-2 block font-medium">Withdrawable balance</span>
        </div>
      </div>

      {/* SHARE LINKS */}
      <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm">
        <h3 className="text-base font-bold text-white mb-2">Your Invitation Link</h3>
        <p className="text-xs text-slate-500 mb-6">Copy and paste this link to invite users.</p>

        <div className="flex items-center space-x-3">
          <div className="flex-1 p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 font-mono text-xs text-slate-300 select-all truncate">
            {typeof window !== "undefined" 
              ? `${window.location.origin}/auth/register?ref=${profile?.referralCode}`
              : `http://localhost:3000/auth/register?ref=${profile?.referralCode}`
            }
          </div>
          <button 
            onClick={handleCopyLink}
            className="p-3.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center shrink-0"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* REFERRALS LOGS */}
      <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm">
        <h3 className="text-base font-bold text-white mb-6">Referred Registrations</h3>

        {referrals.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            💤 No referred accounts yet. Share your invitation link to earn commissions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-900">
                <tr>
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Joined Date</th>
                  <th className="pb-3 font-semibold text-right">Subscription Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 font-bold text-white">{ref.name}</td>
                    <td className="py-4 text-xs">{new Date(ref.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ref.subscriptionStatus !== "NONE" 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : "bg-slate-800 text-slate-500 border border-slate-700"
                      }`}>
                        {ref.subscriptionStatus}
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
