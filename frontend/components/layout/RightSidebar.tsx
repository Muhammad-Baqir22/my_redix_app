"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenSquare } from "lucide-react";
import { ApiSubreddit, ApiResponse } from "@/types/api";
import { apiFetch, getToken } from "@/lib/api";
import { communityColor } from "@/lib/utils";

function SubSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[var(--bg-hover)]" />
        <div className="space-y-1.5">
          <div className="w-24 h-3 bg-[var(--bg-hover)] rounded" />
          <div className="w-16 h-2.5 bg-[var(--bg-hover)] rounded" />
        </div>
      </div>
      <div className="w-14 h-6 bg-[var(--bg-hover)] rounded-lg" />
    </div>
  );
}

export default function RightSidebar() {
  const router  = useRouter();
  const [subs,    setSubs]    = useState<ApiSubreddit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    apiFetch<ApiResponse<ApiSubreddit[]>>("/api/subreddit/subs/")
      .then((res) => {
        const userId = typeof window !== "undefined" ? localStorage.getItem("userId") ?? "" : "";
        const all = res.data ?? [];
        setSubs(all.filter((s) => s.is_following || s.created_by === userId));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <aside className="px-4 py-4 flex flex-col gap-4">
      <div
        className="rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ background: "var(--bg-card)" }}
      >
        <div
          className="px-4 py-3 border-b border-[var(--border)]"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.08))" }}
        >
          <h3 className="text-white text-xs font-bold uppercase tracking-widest">
            Your Communities
          </h3>
        </div>

        <div className="flex flex-col">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SubSkeleton key={i} />)
            : subs.length === 0
            ? (
              <p className="text-[var(--text-3)] text-xs text-center px-4 py-5">
                You haven&apos;t joined any communities yet.
              </p>
            )
            : subs.map((sub) => {
                const color = communityColor(sub.name);
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border)] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: color }}
                      >
                        {sub.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[var(--text-1)] text-sm font-semibold">r/{sub.name}</p>
                        {sub.description && (
                          <p className="text-[var(--text-3)] text-xs truncate max-w-[110px]">
                            {sub.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/create-post?communityId=${sub.id}&community=${sub.name}`)}
                      className="flex items-center gap-1 text-xs font-semibold text-purple-400 border border-purple-500/40 hover:bg-purple-500/15 px-3 py-1 rounded-lg transition-all duration-150 flex-shrink-0"
                    >
                      <PenSquare size={11} />
                      Post
                    </button>
                  </div>
                );
              })
          }
        </div>

        <div className="px-4 py-3 border-t border-[var(--border)]">
          <Link
            href="/communities"
            className="block text-center text-purple-400 hover:text-purple-300 text-xs font-semibold transition-colors"
          >
            Explore Communities →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
        {["About", "Content Policy", "Privacy Policy", "User Agreement"].map((label) => (
          <Link
            key={label}
            href="#"
            className="text-[var(--text-3)] hover:text-[var(--text-2)] text-xs transition-colors"
          >
            {label}
          </Link>
        ))}
        <p className="text-[var(--text-3)] text-xs w-full mt-1">© 2026 RediX Ecosystem Inc.</p>
      </div>
    </aside>
  );
}
