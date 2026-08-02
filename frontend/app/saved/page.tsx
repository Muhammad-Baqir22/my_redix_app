"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import PostCard from "@/components/feed/PostCard";
import { getToken, apiFetch } from "@/lib/api";
import { ApiResponse, FeedPost } from "@/types/api";

function PostSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-2xl border border-[var(--border)] animate-pulse" style={{ background: "var(--bg-card)" }}>
      <div className="flex flex-col items-center gap-2 w-8 flex-shrink-0">
        <div className="w-6 h-6 bg-[var(--bg-hover)] rounded-lg" />
        <div className="w-8 h-3 bg-[var(--bg-hover)] rounded" />
        <div className="w-6 h-6 bg-[var(--bg-hover)] rounded-lg" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="w-3/4 h-5 bg-[var(--bg-hover)] rounded" />
        <div className="w-full h-3 bg-[var(--bg-hover)] rounded" />
        <div className="w-2/3 h-3 bg-[var(--bg-hover)] rounded" />
      </div>
    </div>
  );
}

export default function SavedPage() {
  const router = useRouter();
  const [posts,   setPosts]   = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetch<ApiResponse<FeedPost[]>>("/api/saved/")
      .then((res) => setPosts(res.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />

      <div className="flex pt-14">
        <LeftSidebar />

        <main className="flex-1 sidebar-ml px-4 py-6 min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
              <Bookmark size={20} className="text-purple-400" />
              <div>
                <h1 className="text-[var(--text-1)] font-bold text-xl">Saved</h1>
                {!loading && (
                  <p className="text-[var(--text-3)] text-xs mt-0.5">
                    {posts.length} saved {posts.length === 1 ? "post" : "posts"}
                  </p>
                )}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle size={28} className="text-red-400" />
                <p className="text-[var(--text-2)] text-sm">{error}</p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && posts.length === 0 && (
              <div className="py-24 text-center">
                <Bookmark size={32} className="text-[var(--text-3)] mx-auto mb-3" />
                <p className="text-[var(--text-2)] font-medium mb-1">Nothing saved yet</p>
                <p className="text-[var(--text-3)] text-sm">Hit the Save button on any post to bookmark it here.</p>
              </div>
            )}

            {/* Posts */}
            {!loading && !error && posts.length > 0 && (
              <div className="flex flex-col gap-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} initialSaved={true} />
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
