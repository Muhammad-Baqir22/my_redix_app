"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, Mail, Plus } from "lucide-react";
import { getCurrentUser, getProfileImages } from "@/lib/api";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Popular", href: "/popular" },
  { label: "Communities", href: "/communities" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [query,     setQuery]     = useState("");
  const [initial,   setInitial]   = useState("U");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.username) setInitial(user.username[0].toUpperCase());
    else if (user?.email) setInitial(user.email[0].toUpperCase());
    const { avatarUrl } = getProfileImages();
    if (avatarUrl) setAvatarUrl(avatarUrl);
  }, []);

  const handleSearch = (e: { preventDefault(): void }) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-4 gap-4 border-b border-white/[0.07]"
      style={{ background: "rgba(11, 14, 26, 0.97)", backdropFilter: "blur(16px)" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 11h-3v3a1 1 0 01-2 0v-3H8a1 1 0 010-2h3V8a1 1 0 012 0v3h3a1 1 0 010 2z" />
          </svg>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">RediX</span>
      </Link>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-shrink-0 w-56 xl:w-72">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts…"
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200 hover:border-white/15 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10"
        />
      </form>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1 flex-1">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              pathname === link.href
                ? "text-white bg-white/[0.08]"
                : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          aria-label="Notifications"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all duration-150"
        >
          <Bell size={17} />
        </button>
        <button
          aria-label="Messages"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all duration-150"
        >
          <Mail size={17} />
        </button>

        <Link
          href="/create-post"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Create Post
        </Link>

        {/* Avatar — links to profile */}
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-1 hover:ring-2 hover:ring-purple-500/60 transition-all duration-200 overflow-hidden"
          style={!avatarUrl ? { background: "linear-gradient(135deg, #7c3aed, #a855f7)" } : undefined}
          aria-label="Go to profile"
        >
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            : initial}
        </Link>
      </div>
    </header>
  );
}
