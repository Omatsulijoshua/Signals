"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  TrendingUp, 
  CreditCard, 
  Megaphone, 
  LogOut, 
  Activity 
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      router.push("/auth/login");
    } else {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== "ADMIN" && parsed.role !== "SUPER_ADMIN") {
        router.push("/dashboard"); // Redirect normal users
      } else {
        setAdmin(parsed);
        setLoading(false);
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060814] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Authorizing admin console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#05060f]">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-900 bg-slate-950/60 backdrop-blur-md shrink-0">
        <div className="p-6 border-b border-slate-900">
          <Link href="/" className="text-xl font-black bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
            ADMIN CONSOLE
          </Link>
          <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-black uppercase rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            {admin?.role}
          </span>
        </div>

        <nav className="flex-1 p-6 space-y-2 text-sm font-semibold text-slate-400">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500/5 to-indigo-500/5 border border-cyan-500/10 text-cyan-400">
            <Activity className="w-4.5 h-4.5" />
            <span>Console Panel</span>
          </div>
          <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:text-white hover:bg-slate-900/40">
            <TrendingUp className="w-4.5 h-4.5" />
            <span>Go to User Feed</span>
          </Link>
        </nav>

        <div className="p-6 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-950/10 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Terminal</span>
          </button>
        </div>
      </aside>

      {/* VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
