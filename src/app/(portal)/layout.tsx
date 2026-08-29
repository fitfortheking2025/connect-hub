import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  WalletCards, 
  ShieldCheck, 
  User 
} from "lucide-react";
import LogoutButton from "@/app/components/LogoutButton";
import ChangePasswordModal from "@/app/components/ChangePasswordModal";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const currentUser = {
    fullName: session?.user?.name || "System Admin",
    username: (session?.user as any)?.username || "admin_connect",
    role: (session?.user as any)?.role || "ADMIN",
  };

  const isAdmin = currentUser.role === "ADMIN";

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative overflow-x-hidden pb-24 md:pb-0 bg-[#F4F6FA]">
      
      {/* 1. Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-3.5 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 rounded-xl bg-orange-500/10 p-1 border border-orange-500/20">
            <Image src="/connect-hub.png" alt="Connect Hub" fill className="object-contain p-0.5" priority />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-[#111827] leading-tight">Connect Hub</h1>
            <span className="text-[9px] font-bold text-[#FF6B00] uppercase tracking-wider">{currentUser.role.replace("_", " ")}</span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <ChangePasswordModal />
          <LogoutButton />
        </div>
      </header>

      {/* 2. Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 justify-between m-4 rounded-[32px] shadow-xl shadow-slate-200/50 sticky top-4 h-[calc(100vh-2rem)] z-30">
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
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:text-[#111827] hover:bg-orange-50/70 transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              Dashboard
            </Link>

            <Link
              href="/vips"
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

            {isAdmin && (
              <div className="pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 block">
                  Administration
                </span>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-700 bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/60 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  Staff Accounts
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* User Card with Change Password & Logout */}
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
                {currentUser.role.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ChangePasswordModal />
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* 3. Main Content Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl">
        {children}
      </main>

      {/* 4. Mobile Floating Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-3 inset-x-4 z-40 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-[24px] p-2 shadow-2xl shadow-slate-400/30 flex items-center justify-around">
        <Link
          href="/"
          className="flex flex-col items-center gap-1 py-1 px-3 text-slate-500 hover:text-[#FF6B00] transition-colors"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </Link>

        <Link
          href="/first-timers"
          className="flex flex-col items-center gap-1 py-1 px-3 text-slate-500 hover:text-[#FF6B00] transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          <span className="text-[10px] font-bold">Visitors</span>
        </Link>

        <Link
          href="/team"
          className="flex flex-col items-center gap-1 py-1 px-3 text-slate-500 hover:text-[#FF6B00] transition-colors"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold">Team</span>
        </Link>

        <Link
          href="/finances"
          className="flex flex-col items-center gap-1 py-1 px-3 text-slate-500 hover:text-[#FF6B00] transition-colors"
        >
          <WalletCards className="w-5 h-5" />
          <span className="text-[10px] font-bold">Dues</span>
        </Link>

        {isAdmin && (
          <Link
            href="/admin/users"
            className="flex flex-col items-center gap-1 py-1 px-3 text-rose-600 hover:text-rose-700 transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-bold">Admin</span>
          </Link>
        )}
      </nav>

    </div>
  );
}