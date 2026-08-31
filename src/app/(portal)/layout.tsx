import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { UserCircle2 } from "lucide-react";
import LogoutButton from "@/app/components/LogoutButton";
import ChangePasswordModal from "@/app/components/ChangePasswordModal";
import MobileUserDrawer from "@/app/components/MobileUserDrawer";
import BottomNavBar from "@/app/components/BottomNavbar";
import SidebarNav from "@/app/components/SidebarNav";
import PullToRefresh from "@/app/components/PullToRefresh";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;
  // Case-insensitive check to ensure 'admin' or 'ADMIN' works reliably
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 p-5 justify-between shrink-0 h-screen sticky top-0 z-30">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-3 px-2">
            <div className="relative w-9 h-9 rounded-2xl overflow-hidden shadow-md shadow-orange-500/20 bg-white">
              <Image
                src="/connect-hub.png"
                alt="Connect Hub"
                fill
                sizes="36px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="font-black text-base text-[#111827] tracking-tight leading-none">
                Connect Hub
              </h1>
              <span className="text-[10px] font-bold text-[#FF6B00]">
                River of God
              </span>
            </div>
          </Link>

          {/* Pass isAdmin to SidebarNav */}
          <SidebarNav isAdmin={isAdmin} />
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : <UserCircle2 className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-[#111827] truncate">
                  {user.name || user.email}
                </div>
                <div className="text-[9px] font-black text-orange-500 uppercase tracking-wider">
                  {isAdmin ? "Admin" : user.role || "Minister"}
                </div>
              </div>
            </div>

            <ChangePasswordModal />
          </div>

          <LogoutButton className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors w-full text-left" />
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-white shadow-sm">
              <Image
                src="/connect-hub.png"
                alt="Connect Hub"
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
            <div>
              <span className="font-black text-sm text-[#111827] leading-none block">Connect Hub</span>
            </div>
          </Link>

          <MobileUserDrawer user={user} isAdmin={isAdmin} />
        </header>

        {/* PullToRefresh Wrapper */}
        <PullToRefresh>
          <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto pb-28 md:pb-8">
            {children}
          </main>
        </PullToRefresh>

        {/* Pass isAdmin to BottomNavBar */}
        <BottomNavBar isAdmin={isAdmin} />
      </div>
    </div>
  );
}