"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, UserPlus, Check } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { apiFetch, getToken } from "@/lib/api";
import { ApiResponse } from "@/types/api";

interface Subreddit {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
}

export default function CommunitiesPage() {
  const router = useRouter();
  const [subs, setSubs] = useState<Subreddit[]>([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetch<ApiResponse<Subreddit[]>>("/api/subreddit/subs/")
      .then((res) => setSubs(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const follow = async (id: string) => {
    try {
      await apiFetch("/api/subreddit/followsub", {
        method: "POST",
        body: JSON.stringify({ sub_id: id }),
      });
      setFollowed((prev) => new Set(prev).add(id));
    } catch {}
  };

  const unfollow = async (id: string) => {
    try {
      await apiFetch("/api/subreddit/unfollowsub", {
        method: "POST",
        body: JSON.stringify({ sub_id: id }),
      });
      setFollowed((prev) => { const s = new Set(prev); s.delete(id); return s; });
    } catch {}
  };

  return (
    <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
      <Navbar />
      <div className="flex pt-14">
        <LeftSidebar />
        <main className="flex-1 sidebar-ml px-4 py-6 min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-white font-bold text-xl mb-5">Communities</h1>

            {loading && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
            )}

            {!loading && subs.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-20">No communities yet.</p>
            )}

            <div className="flex flex-col gap-3">
              {subs.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-white/[0.07]"
                  style={{ background: "rgba(255,255,255,0.025)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
                  >
                    <Hash size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">r/{sub.name}</p>
                    {sub.description && (
                      <p className="text-gray-500 text-xs truncate">{sub.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => followed.has(sub.id) ? unfollow(sub.id) : follow(sub.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex-shrink-0 ${
                      followed.has(sub.id)
                        ? "bg-white/[0.06] text-gray-400"
                        : "text-white"
                    }`}
                    style={followed.has(sub.id) ? undefined : { background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                  >
                    {followed.has(sub.id) ? <><Check size={12} /> Joined</> : <><UserPlus size={12} /> Join</>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
