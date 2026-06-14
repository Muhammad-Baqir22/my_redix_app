"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiSubreddit, ApiResponse } from "@/types/api";
import { apiFetch, getToken } from "@/lib/api";
import { communityColor } from "@/lib/utils";

function SubSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] last:border-0 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/[0.06]" />
        <div className="space-y-1.5">
          <div className="w-24 h-3 bg-white/[0.06] rounded" />
          <div className="w-16 h-2.5 bg-white/[0.06] rounded" />
        </div>
      </div>
      <div className="w-14 h-6 bg-white/[0.06] rounded-lg" />
    </div>
  );
}

export default function RightSidebar() {
  const [subs,    setSubs]    = useState<ApiSubreddit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    apiFetch<ApiResponse<ApiSubreddit[]>>("/api/subreddit/subs/")
      .then((res) => setSubs(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const follow = async (sub: ApiSubreddit) => {
    if (!getToken()) { toast.error("Please log in first."); return; }
    try {
      await apiFetch<ApiResponse<unknown>>("/api/subreddit/followsub", {
        method: "POST",
        body: JSON.stringify({ sub_id: sub.id }),
      });
      toast.success(`Joined r/${sub.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <aside className="px-4 py-4 flex flex-col gap-4">
      <div
        className="rounded-2xl border border-white/[0.07] overflow-hidden"
        style={{ background: "rgba(255,255,255,0.025)" }}
      >
        <div
          className="px-4 py-3 border-b border-white/[0.06]"
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
              <p className="text-gray-600 text-xs text-center px-4 py-5">
                You haven&apos;t created any communities yet.
              </p>
            )
            : subs.map((sub) => {
                const color = communityColor(sub.name);
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: color }}
                      >
                        {sub.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">r/{sub.name}</p>
                        {sub.description && (
                          <p className="text-gray-500 text-xs truncate max-w-[110px]">
                            {sub.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => follow(sub)}
                      className="text-xs font-semibold text-purple-400 border border-purple-500/40 hover:bg-purple-500/15 px-3 py-1 rounded-lg transition-all duration-150 flex-shrink-0"
                    >
                      Post
                    </button>
                  </div>
                );
              })
          }
        </div>

        <div className="px-4 py-3 border-t border-white/[0.06]">
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
            className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
          >
            {label}
          </Link>
        ))}
        <p className="text-gray-700 text-xs w-full mt-1">© 2024 RediX Ecosystem Inc.</p>
      </div>
    </aside>
  );
}
