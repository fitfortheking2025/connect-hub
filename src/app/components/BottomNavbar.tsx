// src/app/components/BottomNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
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

  return (
    <div className="md:hidden fixed bottom-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none select-none">
      <nav className="pointer-events-auto flex items-center justify-between gap-1 px-3 py-2 bg-white/90 backdrop-blur-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full w-full max-w-[340px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-label={item.label}
              className={`relative flex items-center justify-center h-11 w-11 rounded-full transition-all duration-150 ease-out active:scale-90 touch-manipulation ${
                item.isActive
                  ? "bg-orange-50 text-[#FF6B00]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${
                  item.isActive
                    ? "stroke-[2.5] text-[#FF6B00] fill-[#FF6B00]/10 scale-105"
                    : "stroke-[2]"
                }`}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}