"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, TrendingUp, Users, MessageSquare,
  Bookmark, Settings, HelpCircle, User,
} from "lucide-react";

const MAIN_NAV = [
  { label: "Home",      icon: Home,           href: "/" },
  { label: "Popular",   icon: TrendingUp,     href: "/popular" },
  { label: "Following", icon: Users,          href: "/following" },
  { label: "Messages",  icon: MessageSquare,  href: "/messages" },
  { label: "Saved",     icon: Bookmark,       href: "/saved" },
  { label: "Profile",   icon: User,           href: "/profile" },
];

const BOTTOM_NAV = [
  { label: "Settings", icon: Settings,   href: "/settings" },
  { label: "Help",     icon: HelpCircle, href: "/help" },
];

function NavItem({
  label,
  icon: Icon,
  href,
  active,
}: {
  label: string;
  icon: React.ElementType;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
        active
          ? "bg-purple-600/20 text-purple-300"
          : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <Icon
        size={18}
        className={`flex-shrink-0 transition-colors ${
          active ? "text-purple-400" : "text-gray-500 group-hover:text-gray-300"
        }`}
      />
      {label}
    </Link>
  );
}

export default function LeftSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full px-3 py-4">
      {/* Main nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {MAIN_NAV.map((item) => (
          <NavItem
            key={item.href}
            label={item.label}
            icon={item.icon}
            href={item.href}
            active={pathname === item.href}
          />
        ))}
      </nav>

      {/* Divider */}
      <div className="my-3 h-px bg-white/[0.06]" />

      {/* Bottom nav */}
      <nav className="flex flex-col gap-1">
        {BOTTOM_NAV.map((item) => (
          <NavItem
            key={item.href}
            label={item.label}
            icon={item.icon}
            href={item.href}
            active={pathname === item.href}
          />
        ))}
      </nav>
    </aside>
  );
}
