"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Hash, Plus, MessageSquare, User } from "lucide-react";

const NAV = [
  { icon: Home,          href: "/",            label: "Home" },
  { icon: Hash,          href: "/communities", label: "Communities" },
  { icon: Plus,          href: "/create-post", label: "Post" },
  { icon: MessageSquare, href: "/messages",    label: "Messages" },
  { icon: User,          href: "/profile",     label: "Profile" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const hide = ["/login", "/signup"].includes(pathname);
  if (hide) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex md:hidden border-t border-white/[0.07] pb-safe"
      style={{ background: "rgba(11,14,26,0.97)", backdropFilter: "blur(16px)" }}
    >
      {NAV.map(({ icon: Icon, href, label }) => {
        const active = pathname === href;
        const isPost = href === "/create-post";
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
          >
            {isPost ? (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                <Icon size={18} className="text-white" strokeWidth={2.5} />
              </div>
            ) : (
              <>
                <Icon size={20} className={active ? "text-purple-400" : "text-gray-500"} />
                <span className={`text-[10px] font-medium ${active ? "text-purple-400" : "text-gray-600"}`}>
                  {label}
                </span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
