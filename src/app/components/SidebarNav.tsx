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

interface SidebarNavProps {
  isAdmin?: boolean;
}

export default function SidebarNav({ isAdmin = false }: SidebarNavProps) {
  const pathname = usePathname();

  const links = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard, exact: true },
    { label: "VIPs & Follow-Up", href: "/vips", icon: Sparkles },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Connect Team", href: "/connect-team", icon: Users },
    ...(isAdmin
      ? [
          {
            label: "User Accounts",
            href: "/admin/users",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              isActive
                ? "bg-orange-50 text-[#FF6B00] shadow-sm shadow-orange-500/10 font-extrabold"
                : "text-slate-600 hover:text-[#FF6B00] hover:bg-orange-50/50"
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}