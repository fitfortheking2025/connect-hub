// src/app/components/BottomNavbar.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Sparkles, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Calendar,
  WalletCards
} from "lucide-react";

interface BottomNavBarProps {
  isAdmin?: boolean;
  isAdminorTeamLeader?: boolean;
  isFinanceLeader?: boolean;
}

export default function BottomNavBar({ 
  isAdmin = false, 
  isAdminorTeamLeader = false,
  isFinanceLeader = false 
}: BottomNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const canAccessFinances = isAdmin || isFinanceLeader;

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "VIPs",
      href: "/vips",
      icon: Sparkles,
      isActive: pathname.startsWith("/vips"),
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      isActive: pathname.startsWith("/analytics"),
    },
    {
      label: "Team",
      href: "/connect-team",
      icon: Users,
      isActive: pathname.startsWith("/connect-team"),
    },
    ...(canAccessFinances
      ? [
          {
            label: "Finances",
            href: "/finances",
            icon: WalletCards,
            isActive: pathname.startsWith("/finances"),
          },
        ]
      : []),
    ...(isAdminorTeamLeader || isFinanceLeader
      ? [
          {
            label: "Sunday Attendance",
            href: "/sunday-schedule",
            icon: Calendar,
            isActive: pathname.startsWith("/sunday-schedule"),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            label: "Admin",
            href: "/admin/users",
            icon: ShieldCheck,
            isActive: pathname.startsWith("/admin/users"),
          },
        ]
      : []),
  ];

  const handleNavigate = (href: string) => {
    if (pathname === href) return;
    router.push(href);
  };

  return (
    <div className="md:hidden fixed bottom-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none select-none">
      <nav 
        className="pointer-events-auto flex items-center justify-between gap-1 px-3 py-2 bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.12)] rounded-full w-full max-w-[360px]"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              type="button"
              aria-label={item.label}
              onPointerDown={() => router.prefetch(item.href)}
              onClick={() => handleNavigate(item.href)}
              className={`relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-all duration-150 ease-out active:scale-75 touch-manipulation cursor-pointer ${
                item.isActive
                  ? "bg-orange-50 text-[#FF6B00] shadow-sm shadow-orange-500/10"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${
                  item.isActive
                    ? "stroke-[2.5] text-[#FF6B00] scale-110"
                    : "stroke-[2]"
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}