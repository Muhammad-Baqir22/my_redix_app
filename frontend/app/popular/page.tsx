"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import PostCard from "@/components/feed/PostCard";
import { apiFetch, getToken } from "@/lib/api";
import { ApiResponse, FeedPost } from "@/types/api";

function PostSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-2xl border border-white/[0.07] animate-pulse" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex flex-col items-center gap-2 w-8 flex-shrink-0">
        <div className="w-6 h-6 bg-white/[0.06] rounded-lg" />
        <div className="w-8 h-3 bg-white/[0.06] rounded" />
        <div className="w-6 h-6 bg-white/[0.06] rounded-lg" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="w-3/4 h-5 bg-white/[0.06] rounded" />
        <div className="w-full h-3 bg-white/[0.06] rounded" />
        <div className="w-2/3 h-3 bg-white/[0.06] rounded" />
      </div>
    </div>
  );
}

export default function PopularPage() {
  const router = useRouter();

  const [posts,   setPosts]   = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }

    apiFetch<ApiResponse<FeedPost[]>>("/api/post/popular?page=1&pageSize=20")
      .then((res) => setPosts(res.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load posts"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
      <Navbar />

      <div className="flex pt-14">
        <LeftSidebar />

        {/* Main feed */}
        <main className="flex-1 sidebar-ml xl:mr-72 px-4 py-6 min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
              <Flame size={20} className="text-orange-400" />
              <div>
                <h1 className="text-white font-bold text-xl">Popular</h1>
                <p className="text-gray-500 text-xs mt-0.5">Top posts from the last 24 hours</p>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle size={28} className="text-red-400" />
                <p className="text-gray-400 text-sm">{error}</p>
                <button
                  onClick={() => { setError(null); setLoading(true);
                    apiFetch<ApiResponse<FeedPost[]>>("/api/post/popular?page=1&pageSize=20")
                      .then((res) => setPosts(res.data ?? []))
                      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
                      .finally(() => setLoading(false));
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && posts.length === 0 && (
              <div className="py-20 text-center">
                <Flame size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 font-medium mb-1">Nothing trending yet</p>
                <p className="text-gray-600 text-sm">No posts with votes in the last 24 hours.</p>
              </div>
            )}

            {/* Posts */}
            {!loading && !error && posts.length > 0 && (
              <div className="flex flex-col gap-3">
                {posts.map((post, i) => (
                  <div key={post.id} className="relative">
                    {/* Rank badge */}
                    {i < 3 && (
                      <div
                        className="absolute -left-3 top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black z-10 border-2 border-[#0b0e1a]"
                        style={{
                          background: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : "#b45309",
                          color: "#0b0e1a",
                        }}
                      >
                        {i + 1}
                      </div>
                    )}
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>

        {/* Right sidebar */}
        <div
          className="hidden xl:flex flex-col fixed top-14 right-0 bottom-0 w-72 border-l border-white/[0.06] overflow-y-auto"
          style={{ background: "#0d1020" }}
        >
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
