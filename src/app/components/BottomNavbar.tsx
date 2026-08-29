"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Sparkles, 
  BarChart3, 
  Users, 
  UserCircle 
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
                item.isActive
                  ? "text-[#FF6B00]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  item.isActive
                    ? "bg-orange-50 text-[#FF6B00] shadow-sm shadow-orange-500/10 scale-105"
                    : "bg-transparent text-slate-400"
                }`}
              >
                <Icon className={`w-5 h-5 ${item.isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              </div>
              
              {/* Optional Active Dot Indicator */}
              {item.isActive && (
                <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}