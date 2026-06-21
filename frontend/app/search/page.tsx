"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Users, Hash, AlertCircle, UserPlus } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { apiFetch, getToken } from "@/lib/api";
import { ApiResponse } from "@/types/api";

interface UserResult {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
}

interface SubredditResult {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/[0.07] animate-pulse" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="w-10 h-10 rounded-full bg-white/[0.07] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-32 h-4 bg-white/[0.07] rounded" />
        <div className="w-48 h-3 bg-white/[0.05] rounded" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const query        = searchParams.get("q") ?? "";

  const [users,     setUsers]     = useState<UserResult[]>([]);
  const [subs,      setSubs]      = useState<SubredditResult[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [fetched,   setFetched]   = useState(false);
  const [tab,       setTab]       = useState<"users" | "communities">("users");
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    if (!query) return;

    setLoading(true);
    setError(null);
    setFetched(false);

    const q = encodeURIComponent(query);
    Promise.all([
      apiFetch<ApiResponse<UserResult[]>>(`/api/users/search?q=${q}`),
      apiFetch<ApiResponse<SubredditResult[]>>(`/api/subreddit/search?q=${q}`),
    ])
      .then(([usersRes, subsRes]) => {
        setUsers(usersRes.data ?? []);
        setSubs(subsRes.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Search failed"))
      .finally(() => { setLoading(false); setFetched(true); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const followCommunity = async (subId: string) => {
    try {
      await apiFetch("/api/subreddit/followsub", {
        method: "POST",
        body: JSON.stringify({ sub_id: subId }),
      });
      setFollowing((prev) => new Set(prev).add(subId));
    } catch {
      // ignore
    }
  };

  const total = users.length + subs.length;

  return (
    <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
      <Navbar />

      <div className="flex pt-14">
        <LeftSidebar />

        <main className="flex-1 sidebar-ml px-4 py-6 min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="mb-5 flex items-center gap-3">
              <Search size={18} className="text-purple-400 flex-shrink-0" />
              <div>
                <h1 className="text-white font-bold text-xl">
                  {query ? `Results for "${query}"` : "Search"}
                </h1>
                {fetched && !loading && (
                  <p className="text-gray-500 text-sm mt-0.5">
                    {total} {total === 1 ? "result" : "results"} found
                  </p>
                )}
              </div>
            </div>

            {/* No query */}
            {!query && (
              <div className="py-20 text-center">
                <p className="text-gray-500 text-sm">Type a username or community name and press Enter.</p>
              </div>
            )}

            {query && (
              <>
                {/* Tabs */}
                <div className="flex gap-1 mb-4 p-1 rounded-xl border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.025)" }}>
                  {(["users", "communities"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        tab === t
                          ? "text-white bg-white/[0.08]"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {t === "users"
                        ? <><Users size={14} /> Users {fetched && !loading && `(${users.length})`}</>
                        : <><Hash size={14} /> Communities {fetched && !loading && `(${subs.length})`}</>
                      }
                    </button>
                  ))}
                </div>

                {/* Loading */}
                {loading && (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <AlertCircle size={28} className="text-red-400" />
                    <p className="text-gray-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Users tab */}
                {!loading && !error && tab === "users" && (
                  <>
                    {users.length === 0 && fetched ? (
                      <div className="py-16 text-center">
                        <p className="text-gray-400 font-medium mb-1">No users found</p>
                        <p className="text-gray-600 text-sm">Try a different username.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {users.map((user) => (
                          <Link
                            key={user.id}
                            href={`/profile/${user.username}`}
                            className="flex items-center gap-3 p-4 rounded-2xl border border-white/[0.07] hover:border-purple-500/30 transition-all duration-200 cursor-pointer"
                            style={{ background: "rgba(255,255,255,0.025)" }}
                          >
                            <div
                              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={user.avatar_url ? undefined : { background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                            >
                              {user.avatar_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                                : user.username[0].toUpperCase()
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm truncate">u/{user.username}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Communities tab */}
                {!loading && !error && tab === "communities" && (
                  <>
                    {subs.length === 0 && fetched ? (
                      <div className="py-16 text-center">
                        <p className="text-gray-400 font-medium mb-1">No communities found</p>
                        <p className="text-gray-600 text-sm">Try a different name.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {subs.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-3 p-4 rounded-2xl border border-white/[0.07] hover:border-purple-500/30 transition-all duration-200"
                            style={{ background: "rgba(255,255,255,0.025)" }}
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
                            >
                              r/
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm truncate">r/{sub.name}</p>
                              {sub.description && (
                                <p className="text-gray-500 text-xs truncate">{sub.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => followCommunity(sub.id)}
                              disabled={following.has(sub.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex-shrink-0 ${
                                following.has(sub.id)
                                  ? "bg-white/[0.06] text-gray-500 cursor-default"
                                  : "text-white hover:opacity-90 active:scale-[0.97]"
                              }`}
                              style={following.has(sub.id) ? undefined : { background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                            >
                              <UserPlus size={12} />
                              {following.has(sub.id) ? "Joined" : "Join"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
