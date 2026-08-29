import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import SplashScreen from "../components/SplashScreen";
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  WalletCards, 
  LogOut, 
  User 
} from "lucide-react";

const font = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"] 
});

export const metadata: Metadata = {
  title: "Connect Hub | Discipleship Ministry",
  description: "Connect Ministry & First-Timers Discipleship Hub",
};

export const viewport: Viewport = {
  themeColor: "#FF7A00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = {
    fullName: "System Admin",
    username: "admin_connect",
    role: "Head of Connect",
  };

  return (
    <html lang="en">
      <body className={`${font.className} bg-[#F4F6FA] text-[#1E2640] min-h-screen antialiased flex flex-col md:flex-row relative overflow-x-hidden selection:bg-[#FF6B00] selection:text-white pb-24 md:pb-0`}>
        
        {/* Splash Screen */}
        <SplashScreen />

        {/* Ambient Glow */}
        <div className="fixed -top-32 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-[#FF7A00]/20 via-[#FFA043]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Mobile & Tablet Top Bar */}
        <header className="md:hidden flex items-center justify-between px-5 py-3.5 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-xl bg-orange-500/10 p-1 border border-orange-500/20">
              <Image
                src="/connect-hub.png"
                alt="Connect Hub"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-[#111827] leading-tight">Connect Hub</h1>
              <span className="text-[9px] font-bold text-[#FF6B00] uppercase tracking-wider">Portal</span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-xs font-bold text-[#111827] leading-none">{currentUser.fullName}</div>
              <span className="text-[10px] text-slate-400 font-medium">@{currentUser.username}</span>
            </div>
            <button 
              className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200/60 active:scale-95" 
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-72 shrink-0 bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 justify-between m-4 rounded-[32px] shadow-xl shadow-slate-200/50 sticky top-4 h-[calc(100vh-2rem)]">
          <div className="space-y-7">
            <Link href="/" className="flex items-center gap-3 group px-1">
              <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-1 border border-orange-500/25 shadow-sm transition-transform group-hover:scale-105">
                <Image
                  src="/connect-hub.png"
                  alt="Connect Hub"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <div>
                <h1 className="font-extrabold text-base text-[#111827] tracking-tight leading-none">Connect Hub</h1>
                <span className="text-[10px] font-bold text-[#FF6B00] tracking-wider uppercase">Ministry Portal</span>
              </div>
            </Link>

            <nav className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 block">
                Navigation
              </span>

              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold bg-[#FF6B00] text-white shadow-lg shadow-orange-500/25 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                href="/first-timers"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:text-[#111827] hover:bg-orange-50/70 transition-all"
              >
                <UserPlus className="w-4 h-4 text-slate-400" />
                First Timers
              </Link>

              <Link
                href="/team"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:text-[#111827] hover:bg-orange-50/70 transition-all"
              >
                <Users className="w-4 h-4 text-slate-400" />
                Connect Team
              </Link>

              <Link
                href="/finances"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:text-[#111827] hover:bg-orange-50/70 transition-all"
              >
                <WalletCards className="w-4 h-4 text-slate-400" />
                Ledger & Dues
              </Link>
            </nav>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shrink-0 shadow-sm shadow-orange-500/20 font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-[#111827] truncate leading-tight">
                  {currentUser.fullName}
                </div>
                <span className="text-[10px] font-semibold text-[#FF6B00] block truncate">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <button 
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0" 
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl">
          {children}
        </main>

        {/* Mobile PWA Bottom Navigation */}
        <nav className="md:hidden fixed bottom-3 left-4 right-4 h-16 bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-[28px] shadow-2xl shadow-slate-900/10 flex items-center justify-around px-4 z-50">
          <Link href="/" className="flex flex-col items-center gap-1 text-[#FF6B00] transition-transform active:scale-95">
            <div className="p-1 rounded-xl bg-orange-50">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold tracking-tight">Home</span>
          </Link>

          <Link href="/first-timers" className="flex flex-col items-center gap-1 text-slate-500 hover:text-[#FF6B00] transition-transform active:scale-95">
            <UserPlus className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight">Visitors</span>
          </Link>

          <Link href="/team" className="flex flex-col items-center gap-1 text-slate-500 hover:text-[#FF6B00] transition-transform active:scale-95">
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight">Team</span>
          </Link>

          <Link href="/finances" className="flex flex-col items-center gap-1 text-slate-500 hover:text-[#FF6B00] transition-transform active:scale-95">
            <WalletCards className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight">Dues</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}