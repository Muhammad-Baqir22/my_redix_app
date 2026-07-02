"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, UserPlus, Check, Hash, PenSquare } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import PostCard from "@/components/feed/PostCard";
import { apiFetch, getToken } from "@/lib/api";
import { ApiResponse, FeedPost } from "@/types/api";

interface CommunityInfo {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  is_following: boolean;
}

export default function CommunityPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();

  const [community, setCommunity] = useState<CommunityInfo | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }

    apiFetch<ApiResponse<CommunityInfo>>(`/api/subreddit/${name}`)
      .then((res) => setCommunity(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoadingInfo(false));

    apiFetch<ApiResponse<FeedPost[]>>(`/api/subreddit/${name}/posts`)
      .then((res) => setPosts(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, [name, router]);

  const toggleFollow = async () => {
    if (!community) return;
    const endpoint = community.is_following ? "/api/subreddit/unfollowsub" : "/api/subreddit/followsub";
    setCommunity((c) => c ? { ...c, is_following: !c.is_following, member_count: c.member_count + (c.is_following ? -1 : 1) } : c);
    try {
      await apiFetch(endpoint, { method: "POST", body: JSON.stringify({ sub_id: community.id }) });
    } catch {
      setCommunity((c) => c ? { ...c, is_following: community.is_following, member_count: community.member_count } : c);
      toast.error("Something went wrong");
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
        <Navbar />
        <div className="flex pt-14">
          <LeftSidebar />
          <main className="flex-1 sidebar-ml flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 text-lg font-semibold mb-2">Community not found</p>
              <p className="text-gray-600 text-sm mb-4">r/{name} doesn&apos;t exist yet.</p>
              <Link href="/communities" className="text-purple-400 hover:text-purple-300 text-sm">Browse communities</Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
      <Navbar />
      <div className="flex pt-14">
        <LeftSidebar />
        <main className="flex-1 sidebar-ml min-h-[calc(100vh-3.5rem)]">
          {/* Banner */}
          <div className="w-full h-24 relative" style={{ background: "linear-gradient(135deg, #3b0764, #1e1b4b)" }}>
            <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4 sidebar-ml">
              <div className="max-w-2xl mx-auto flex items-end gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl border-4 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", borderColor: "#0b0e1a" }}
                >
                  {community ? community.name.charAt(0).toUpperCase() : <Hash size={24} />}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pt-12 pb-6">
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  {loadingInfo ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-6 w-40 bg-white/[0.06] rounded" />
                      <div className="h-3 w-64 bg-white/[0.04] rounded" />
                    </div>
                  ) : community && (
                    <>
                      <h1 className="text-white font-bold text-2xl">r/{community.name}</h1>
                      {community.description && (
                        <p className="text-gray-400 text-sm mt-1">{community.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-xs">
                        <Users size={12} />
                        <span>{community.member_count} {community.member_count === 1 ? "member" : "members"}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                  {community && (
                    <>
                      <Link
                        href={`/create-post?community=${community.name}&communityId=${community.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold border border-white/[0.1] hover:bg-white/[0.05] transition-all"
                      >
                        <PenSquare size={13} />
                        Post
                      </Link>
                      <button
                        onClick={toggleFollow}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                          community.is_following ? "bg-white/[0.06] text-gray-400" : "text-white"
                        }`}
                        style={community.is_following ? undefined : { background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                      >
                        {community.is_following ? <><Check size={13} /> Joined</> : <><UserPlus size={13} /> Join</>}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Posts */}
              <div className="flex flex-col gap-3 mt-2">
                {loadingPosts && (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                  ))
                )}
                {!loadingPosts && posts.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-gray-500 text-sm mb-3">No posts yet in this community.</p>
                    {community && (
                      <Link
                        href={`/create-post?community=${community.name}&communityId=${community.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                      >
                        <PenSquare size={14} />
                        Be the first to post
                      </Link>
                    )}
                  </div>
                )}
                {!loadingPosts && posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
