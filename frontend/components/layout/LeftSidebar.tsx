"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, MessageSquare, Bookmark, Settings, HelpCircle, User, Menu } from "lucide-react";

const MAIN_NAV = [
  { label: "Home",     icon: Home,          href: "/" },
  { label: "Popular",  icon: TrendingUp,    href: "/popular" },
  { label: "Messages", icon: MessageSquare, href: "/messages" },
  { label: "Saved",    icon: Bookmark,      href: "/saved" },
  { label: "Profile",  icon: User,          href: "/profile" },
];

const BOTTOM_NAV = [
  { label: "Settings", icon: Settings,   href: "/settings" },
  { label: "Help",     icon: HelpCircle, href: "/help" },
];

export default function LeftSidebar() {
  const pathname   = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored     = localStorage.getItem("sidebar-collapsed") === "1";
    setCollapsed(stored);
    document.documentElement.style.setProperty("--sidebar-ml", stored ? "56px" : "224px");
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
    document.documentElement.style.setProperty("--sidebar-ml", next ? "56px" : "224px");
  };

  return (
    <div
      className={`hidden md:flex flex-col fixed top-14 left-0 bottom-0 border-r border-white/[0.06] overflow-hidden transition-all duration-300 z-40 ${collapsed ? "w-14" : "w-56"}`}
      style={{ background: "#0d1020" }}
    >
      <aside className="flex flex-col h-full py-3">

        {/* Hamburger toggle */}
        <div className={`flex mb-3 ${collapsed ? "justify-center" : "justify-end px-3"}`}>
          <button
            onClick={toggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all"
          >
            <Menu size={17} />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-0.5 flex-1 px-2">
          {MAIN_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  collapsed ? "justify-center px-0" : "px-3"
                } ${
                  active
                    ? "bg-purple-600/20 text-purple-300"
                    : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <item.icon
                  size={18}
                  className={`flex-shrink-0 ${active ? "text-purple-400" : "text-gray-500 group-hover:text-gray-300"}`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-2 h-px bg-white/[0.06] mx-2" />

        {/* Bottom nav */}
        <nav className="flex flex-col gap-0.5 px-2">
          {BOTTOM_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  collapsed ? "justify-center px-0" : "px-3"
                } ${
                  active
                    ? "bg-purple-600/20 text-purple-300"
                    : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <item.icon
                  size={18}
                  className={`flex-shrink-0 ${active ? "text-purple-400" : "text-gray-500 group-hover:text-gray-300"}`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

      </aside>
    </div>
  );
}
