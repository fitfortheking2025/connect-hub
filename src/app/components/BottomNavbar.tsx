// src/app/components/BottomNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Sparkles, 
  BarChart3, 
  Users 
} from "lucide-react";

export default function BottomNavBar() {
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
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-1 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 select-none touch-manipulation active:scale-95 transition-transform ${
                item.isActive ? "text-[#FF6B00]" : "text-slate-400"
              }`}
            >
              <div
                className={`p-1.5 rounded-2xl transition-colors ${
                  item.isActive
                    ? "bg-orange-50 text-[#FF6B00]"
                    : "bg-transparent text-slate-400"
                }`}
              >
                <Icon className={`w-5 h-5 ${item.isActive ? "stroke-[2.5]" : "stroke-[1.9]"}`} />
              </div>

              <span
                className={`text-[10px] font-bold tracking-tight mt-0.5 ${
                  item.isActive ? "text-[#FF6B00] font-black" : "text-slate-400"
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