"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { 
  TrendingUp, 
  Activity, 
  CreditCard, 
  Gift, 
  LogOut, 
  Bell, 
  Menu, 
  X, 
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptionStatus: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; type?: string }[]>([]);

  // Authenticate user
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      router.push("/auth/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setLoading(false);
    }
  }, [router]);

  // WebSocket notifications listener
  useEffect(() => {
    if (!user) return;

    const socket: Socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to Real-time WebSockets");
      socket.emit("join-signals");
    });

    // Listen for custom notifications
    socket.on("user-notification", (data: any) => {
      if (data.userId && data.userId !== user.id) return;
      
      const newNotification = {
        id: Math.random().toString(),
        title: data.title,
        message: data.message,
        type: data.type
      };

      setNotifications((prev) => [newNotification, ...prev]);

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
      }, 6000);
    });

    // Listen for global broadcast notifications
    socket.on("global-notification", (data: any) => {
      if (data.planTarget !== "ALL" && data.planTarget !== user.subscriptionStatus) return;

      const newNotification = {
        id: Math.random().toString(),
        title: `📣 ${data.title}`,
        message: data.message,
        type: "BROADCAST"
      };

      setNotifications((prev) => [newNotification, ...prev]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
      }, 8000);
    });

    // Sync subscription status changes in real-time
    socket.on("subscription-updated", (data: any) => {
      if (data.userId === user.id) {
        const updatedUser = { ...user, subscriptionStatus: data.plan };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

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
          <p className="text-sm text-slate-400 font-medium">Booting trading terminal...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { label: "Overview", href: "/dashboard", icon: Activity },
    { label: "Live Feed", href: "/dashboard/signals", icon: TrendingUp },
    { label: "VIP Plans", href: "/dashboard/subscription", icon: CreditCard },
    { label: "Referrals", href: "/dashboard/referrals", icon: Gift },
  ];

  return (
    <div className="flex min-h-screen bg-[#060814]">
      {/* REAL-TIME NOTIFICATION BANNER CONTAINER */}
      <div className="fixed top-6 right-6 z-50 flex flex-col space-y-4 max-w-sm w-full">
        {notifications.map((notif) => (
          <div 
            key={notif.id}
            className="p-4 rounded-xl border border-slate-800 bg-[#090d1f]/95 backdrop-blur-md shadow-2xl flex items-start space-x-3 animate-slide-in"
          >
            {notif.type === "SIGNAL_ALERT" ? (
              <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-200">{notif.title}</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
            </div>
            <button 
              onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-900 bg-slate-950/40 backdrop-blur-md shrink-0">
        <div className="p-6 border-b border-slate-900">
          <Link href="/" className="text-xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            SIGNALS PRO
          </Link>
          <div className="mt-4 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-green shrink-0" />
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">LIVE PRICE FEED</span>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active 
                    ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-400" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent"
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* PROFILE CARD */}
        <div className="p-6 border-t border-slate-900">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-slate-950 text-sm">
              {user?.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white truncate">{user?.name}</span>
              <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                user?.subscriptionStatus === "VIP" 
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" 
                  : user?.subscriptionStatus === "PRO"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : user?.subscriptionStatus === "BASIC"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-500 border border-slate-700"
              }`}>
                {user?.subscriptionStatus || "NONE"}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-950/10 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Terminal</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* MOBILE HEADER */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-[#060814]/80 backdrop-blur-md">
          <Link href="/" className="text-lg font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            SIGNALS PRO
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* MOBILE SIDE NAV */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-[#060814]/95 backdrop-blur-lg pt-20 px-6">
            <nav className="space-y-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-base font-semibold ${
                      active 
                        ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-400" 
                        : "text-slate-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-base font-semibold text-rose-400 hover:bg-rose-950/20 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        )}

        {/* SCROLLABLE VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
