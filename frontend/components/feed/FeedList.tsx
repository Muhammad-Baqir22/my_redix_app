"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { FeedPost, ApiResponse } from "@/types/api";
import { apiFetch, getToken } from "@/lib/api";
import PostCard from "./PostCard";

function PostSkeleton() {
  return (
    <div
      className="flex gap-4 p-4 rounded-2xl border border-white/[0.07] animate-pulse"
      style={{ background: "rgba(255,255,255,0.025)" }}
    >
      <div className="flex flex-col items-center gap-2 w-8 flex-shrink-0">
        <div className="w-6 h-6 bg-white/[0.06] rounded-lg" />
        <div className="w-8 h-3 bg-white/[0.06] rounded" />
        <div className="w-6 h-6 bg-white/[0.06] rounded-lg" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex gap-2 items-center">
          <div className="w-5 h-5 bg-white/[0.06] rounded-full" />
          <div className="w-24 h-3 bg-white/[0.06] rounded" />
          <div className="w-32 h-3 bg-white/[0.06] rounded" />
        </div>
        <div className="w-3/4 h-5 bg-white/[0.06] rounded" />
        <div className="w-full h-3 bg-white/[0.06] rounded"/>
        <div className="w-2/3 h-3 bg-white/[0.06] rounded" />
        <div className="flex gap-2 mt-1">
          <div className="w-24 h-6 bg-white/[0.06] rounded-lg" />
          <div className="w-16 h-6 bg-white/[0.06] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function FeedList() {
  const router  = useRouter();
  const [posts,       setPosts]       = useState<FeedPost[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    setError(null);
    try {
      const res = await apiFetch<ApiResponse<FeedPost[]>>(
        `/api/post/?page=${pageNum}&pageSize=10`
      );
      const incoming = res.data ?? [];
      setPosts((prev) => append ? [...prev, ...incoming] : incoming);
      setHasMore(incoming.length === 10);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    fetchPosts(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, true);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle size={32} className="text-red-400" />
        <div>
          <p className="text-white font-medium mb-1">Failed to load posts</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
        <button
          onClick={() => fetchPosts(1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white border border-white/[0.1] hover:bg-white/[0.05] transition-all"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-gray-400 text-lg font-medium">Your feed is empty</p>
        <p className="text-gray-600 text-sm">Follow communities or users to see posts here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full py-3 rounded-2xl border border-white/[0.07] text-gray-400 text-sm font-medium hover:bg-white/[0.04] hover:text-white transition-all duration-200 disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more posts"}
        </button>
      )}
    </div>
  );
}
