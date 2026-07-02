"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, Mail, Plus, Users, Hash, X } from "lucide-react";
import { getCurrentUser, getProfileImages, apiFetch } from "@/lib/api";
import { ApiResponse } from "@/types/api";

interface UserResult   { id: string; username: string; avatar_url?: string | null; }
interface SubResult    { id: string; name: string; description?: string | null; }
interface SearchResult { users: UserResult[]; subs: SubResult[]; }

const NAV_LINKS = [
  { label: "Home",        href: "/" },
  { label: "Popular",     href: "/popular" },
  { label: "Communities", href: "/communities" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();

  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<SearchResult>({ users: [], subs: [] });
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const [initial,     setInitial]     = useState("U");
  const [avatarUrl,   setAvatarUrl]   = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounce   = useRef<NodeJS.Timeout | null>(null);

  /* ── Load current user avatar ── */
  useEffect(() => {
    const user = getCurrentUser();
    if (user?.username) setInitial(user.username[0].toUpperCase());
    else if (user?.email) setInitial(user.email[0].toUpperCase());
    const { avatarUrl: av } = getProfileImages();
    if (av) setAvatarUrl(av);
  }, []);

  /* ── Poll unread notification count every 30s ── */
  useEffect(() => {
    const fetchCount = () =>
      apiFetch<ApiResponse<{ count: number }>>("/api/notification/unread-count")
        .then((r) => setUnreadCount(r.data?.count ?? 0))
        .catch(() => {});
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, []);

  /* ── Close dropdown when clicking outside ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Live search with 300ms debounce ── */
  const doSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setResults({ users: [], subs: [] });
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    const enc = encodeURIComponent(q.trim());
    Promise.all([
      apiFetch<ApiResponse<UserResult[]>>(`/api/users/search?q=${enc}`),
      apiFetch<ApiResponse<SubResult[]>>(`/api/subreddit/search?q=${enc}`),
    ])
      .then(([usersRes, subsRes]) => {
        setResults({
          users: (usersRes.data ?? []).slice(0, 5),
          subs:  (subsRes.data  ?? []).slice(0, 4),
        });
      })
      .catch(() => setResults({ users: [], subs: [] }))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const clearSearch = () => {
    setQuery("");
    setResults({ users: [], subs: [] });
    setOpen(false);
  };

  const total = results.users.length + results.subs.length;

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-4 gap-4 border-b border-white/[0.07]"
      style={{ background: "rgba(11, 14, 26, 0.97)", backdropFilter: "blur(16px)" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center flex-shrink-0 mr-2">
        <span className="text-white font-bold text-lg tracking-tight">RediX</span>
      </Link>

      {/* Search with live dropdown */}
      <div ref={wrapperRef} className="relative flex-1 min-w-0 max-w-[140px] sm:max-w-[224px] xl:max-w-[320px]">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => { if (query.trim() && total > 0) setOpen(true); }}
              placeholder="Search users & communities…"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-8 pr-8 py-2 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200 hover:border-white/15 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </form>

        {/* Dropdown */}
        {open && query.trim() && (
          <div
            className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl border border-white/[0.1] overflow-hidden shadow-2xl shadow-black/60 z-50"
            style={{ background: "#0d1020" }}
          >
            {loading && (
              <div className="flex items-center justify-center py-5">
                <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              </div>
            )}

            {!loading && total === 0 && (
              <div className="px-4 py-5 text-center">
                <p className="text-gray-500 text-sm">No results for &quot;{query}&quot;</p>
              </div>
            )}

            {!loading && results.users.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                  <Users size={12} className="text-gray-600" />
                  <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-wider">Users</span>
                </div>
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05] transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={user.avatar_url ? undefined : { background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                    >
                      {user.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        : user.username[0].toUpperCase()
                      }
                    </div>
                    <span className="text-white text-sm">u/{user.username}</span>
                  </Link>
                ))}
              </div>
            )}

            {!loading && results.subs.length > 0 && (
              <div>
                <div className={`flex items-center gap-2 px-4 pb-1.5 ${results.users.length > 0 ? "pt-2 border-t border-white/[0.06] mt-1" : "pt-3"}`}>
                  <Hash size={12} className="text-gray-600" />
                  <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-wider">Communities</span>
                </div>
                {results.subs.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05] transition-colors cursor-pointer"
                    onClick={() => { setOpen(false); setQuery(""); }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
                    >
                      r/
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">r/{sub.name}</p>
                      {sub.description && (
                        <p className="text-gray-600 text-xs truncate">{sub.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* See all results */}
            {!loading && total > 0 && (
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => { setOpen(false); }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-purple-400 text-xs font-semibold hover:bg-white/[0.04] transition-colors border-t border-white/[0.06] mt-1"
              >
                <Search size={12} />
                See all results for &quot;{query}&quot;
              </Link>
            )}
          </div>
        )}
      </div>

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
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all duration-150"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        <Link
          href="/messages"
          aria-label="Messages"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all duration-150"
        >
          <Mail size={17} />
        </Link>

        <Link
          href="/create-post"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Create Post
        </Link>

        {/* Avatar */}
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-1 hover:ring-2 hover:ring-purple-500/60 transition-all duration-200 overflow-hidden"
          style={!avatarUrl ? { background: "linear-gradient(135deg, #7c3aed, #a855f7)" } : undefined}
          aria-label="Go to profile"
        >
          {avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            : initial}
        </Link>
      </div>
    </header>
  );
}
