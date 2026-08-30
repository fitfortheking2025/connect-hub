// src/app/components/BottomNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Sparkles, 
  BarChart3, 
  Users,
  ShieldCheck
} from "lucide-react";

interface BottomNavBarProps {
  isAdmin?: boolean;
}

export default function BottomNavBar({ isAdmin = false }: BottomNavBarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
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
    ...(isAdmin
      ? [
          {
            label: "Users",
            href: "/admin/users",
            icon: ShieldCheck,
            isActive: pathname.startsWith("/admin/users"),
          },
        ]
      : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-2px_16px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)] select-none">
      <div className="flex items-stretch justify-around max-w-md mx-auto px-1 h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`relative flex flex-col items-center justify-center flex-1 transition-transform duration-100 ease-out active:scale-90 touch-manipulation group ${
                item.isActive ? "text-[#FF6B00]" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {/* Facebook-style Top Active Indicator Bar */}
              {item.isActive && (
                <span className="absolute top-0 inset-x-3 h-0.5 bg-[#FF6B00] rounded-b-full shadow-sm shadow-orange-500/50 transition-all" />
              )}

              {/* Icon Container with Instant Scale Pop */}
              <div
                className={`transition-all duration-150 transform ${
                  item.isActive ? "scale-110 -translate-y-0.5" : "scale-100 group-hover:scale-105"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    item.isActive
                      ? "stroke-[2.5] text-[#FF6B00]"
                      : "stroke-[1.8] text-slate-400 group-hover:text-slate-600"
                  }`}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[10px] tracking-tight leading-none mt-1 transition-colors ${
                  item.isActive
                    ? "font-black text-[#FF6B00]"
                    : "font-semibold text-slate-400 group-hover:text-slate-600"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}