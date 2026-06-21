"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUp, ArrowDown, MessageSquare, Share2, UserPlus, UserMinus } from "lucide-react";
import { toast, Toaster } from "sonner";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { apiFetch, getToken, getCurrentUserId } from "@/lib/api";
import { ApiResponse, FeedPost } from "@/types/api";
import { timeAgo, formatCount } from "@/lib/utils";

interface UserProfile {
  id: string;
  username: string;
  created_at: string;
  followers_count: number;
  following_count: number;
  avatar_url?: string | null;
  banner_url?: string | null;
}

interface FollowEntry {
  followed_by_id: string;
  user_id: string;
  user: { id: string; username: string; email: string };
}

function PostCard({ post }: { post: FeedPost }) {
  const [vote,  setVote]  = useState<-1 | 0 | 1>(0);
  const [total, setTotal] = useState(post.votes);

  const handleVote = async (type: 1 | -1) => {
    const next = (vote === type ? 0 : type) as -1 | 0 | 1;
    const diff = next - vote;
    setVote(next);
    setTotal((t) => t + diff);
    try {
      await apiFetch<ApiResponse<unknown>>("/api/vote/", {
        method: "POST",
        body: JSON.stringify({ post_id: post.id, vote_type: next }),
      });
    } catch {
      setVote(vote);
      setTotal((t) => t - diff);
    }
  };

  return (
    <article className="border-b border-white/[0.06] px-5 py-4 hover:bg-white/[0.02] transition-colors">
      <Link href={`/post/${post.id}`}>
        <h3 className="text-white font-semibold text-sm leading-snug mb-1.5 hover:text-purple-300 transition-colors">
          {post.title}
        </h3>
      </Link>

      {post.content && (
        <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{post.content}</p>
      )}

      {post.media_url && (
        <div className="w-full rounded-xl overflow-hidden mb-3 bg-white/[0.04]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.media_url} alt="Post media" className="w-full max-h-64 object-cover" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-xs">{timeAgo(post.created_at ?? new Date().toISOString())}</span>
        <div className="flex items-center gap-0.5">
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => handleVote(1)}
              className={`p-1 rounded-lg transition-all hover:bg-white/[0.06] ${vote === 1 ? "text-orange-400" : "text-gray-600 hover:text-orange-400"}`}
            >
              <ArrowUp size={13} strokeWidth={2.5} />
            </button>
            <span className={`text-xs font-bold ${vote === 1 ? "text-orange-400" : vote === -1 ? "text-blue-400" : "text-gray-500"}`}>
              {formatCount(total)}
            </span>
            <button
              onClick={() => handleVote(-1)}
              className={`p-1 rounded-lg transition-all hover:bg-white/[0.06] ${vote === -1 ? "text-blue-400" : "text-gray-600 hover:text-blue-400"}`}
            >
              <ArrowDown size={13} strokeWidth={2.5} />
            </button>
          </div>
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-gray-600 text-xs hover:bg-white/[0.06] hover:text-gray-300 transition-all"
          >
            <MessageSquare size={12} />
            {post.comment.length}
          </Link>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
              toast.success("Link copied!");
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-gray-600 text-xs hover:bg-white/[0.06] hover:text-gray-300 transition-all"
          >
            <Share2 size={12} />
          </button>
        </div>
      </div>
    </article>
  );
}

function PostSkeleton() {
  return (
    <div className="border-b border-white/[0.06] px-5 py-4 animate-pulse space-y-2">
      <div className="w-3/4 h-4 bg-white/[0.06] rounded" />
      <div className="w-full h-3 bg-white/[0.06] rounded" />
      <div className="w-1/2 h-3 bg-white/[0.06] rounded" />
    </div>
  );
}

export default function UserProfilePage() {
  const params   = useParams<{ username: string }>();
  const router   = useRouter();
  const username = params.username;

  const [profile,    setProfile]    = useState<UserProfile | null>(null);
  const [posts,      setPosts]      = useState<FeedPost[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }

    const currentUserId = getCurrentUserId();

    Promise.all([
      apiFetch<ApiResponse<UserProfile>>(`/api/users/${username}`),
      apiFetch<ApiResponse<FeedPost[]>>(`/api/post/user/${username}?page=1&pageSize=20`),
      // fetch follow list — 404 if empty is fine, we catch it
      apiFetch<ApiResponse<FollowEntry[]>>("/api/users/userfollow").catch(() => ({ data: [] as FollowEntry[] })),
    ])
      .then(([profileRes, postsRes, followRes]) => {
        const prof = profileRes.data;
        setProfile(prof);
        setPosts(postsRes.data ?? []);

        if (prof.id === currentUserId) {
          setIsOwnProfile(true);
        } else {
          const alreadyFollowing = (followRes as ApiResponse<FollowEntry[]>).data?.some(
            (f) => f.user_id === prof.id
          ) ?? false;
          setIsFollowing(alreadyFollowing);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiFetch("/api/users/userunfollow", {
          method: "POST",
          body: JSON.stringify({ follow_id: profile.id }),
        });
        setIsFollowing(false);
        setProfile((p) => p ? { ...p, followers_count: p.followers_count - 1 } : p);
        toast.success(`Unfollowed ${username}`);
      } else {
        await apiFetch("/api/users/userfollow", {
          method: "POST",
          body: JSON.stringify({ follow_id: profile.id }),
        });
        setIsFollowing(true);
        setProfile((p) => p ? { ...p, followers_count: p.followers_count + 1 } : p);
        toast.success(`Following ${username}`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setFollowLoading(false);
    }
  };

  const initial = username?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <Toaster position="top-center" theme="dark" richColors closeButton />

      <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
        <Navbar />

        <div className="flex pt-14">
          <LeftSidebar />

          <main className="flex-1 sidebar-ml min-h-[calc(100vh-3.5rem)]">
            <div className="max-w-2xl mx-auto">

              {/* Back button */}
              <div className="px-5 pt-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors"
                >
                  <ArrowLeft size={15} />
                  Back
                </button>
              </div>

              {notFound && (
                <div className="py-24 text-center">
                  <p className="text-white font-bold text-lg mb-1">User not found</p>
                  <p className="text-gray-500 text-sm">This account may not exist.</p>
                </div>
              )}

              {!notFound && (
                <>
                  {/* Banner */}
                  <div
                    className="w-full h-36 sm:h-48 mt-3 overflow-hidden"
                    style={profile?.banner_url ? undefined : {
                      background: "radial-gradient(ellipse at 20% 60%, rgba(124,58,237,0.5) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(99,102,241,0.35) 0%, transparent 50%), linear-gradient(135deg, #050820 0%, #1a0845 40%, #0f0530 70%, #050820 100%)",
                    }}
                  >
                    {profile?.banner_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Profile header */}
                  <div className="border-b border-white/[0.06] px-5 pb-4" style={{ background: "rgba(255,255,255,0.015)" }}>
                    {/* Avatar + follow button row */}
                    <div className="flex items-end justify-between -mt-12 mb-3">
                      <div
                        className="w-24 h-24 rounded-full border-4 border-[#0b0e1a] overflow-hidden flex items-center justify-center text-white text-3xl font-bold flex-shrink-0"
                        style={profile?.avatar_url ? undefined : { background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                      >
                        {profile?.avatar_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          : initial
                        }
                      </div>

                      {/* Follow / Unfollow button — hidden on own profile */}
                      {!isOwnProfile && !loading && (
                        <button
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          className={`mt-14 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                            isFollowing
                              ? "border-white/20 text-gray-300 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10"
                              : "text-white border-transparent hover:opacity-90"
                          } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          style={isFollowing ? undefined : { background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                        >
                          {isFollowing ? (
                            <><UserMinus size={14} /> Unfollow</>
                          ) : (
                            <><UserPlus size={14} /> Follow</>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Name */}
                    <div className="mb-3">
                      <p className="text-white font-bold text-xl leading-tight">{username}</p>
                      <p className="text-gray-500 text-sm">@{username}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-sm font-bold">{posts.length}</span>
                        <span className="text-gray-500 text-sm">posts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-sm font-bold">{profile?.followers_count ?? 0}</span>
                        <span className="text-gray-500 text-sm">followers</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-sm font-bold">{profile?.following_count ?? 0}</span>
                        <span className="text-gray-500 text-sm">following</span>
                      </div>
                      {profile?.created_at && (
                        <p className="text-gray-600 text-xs ml-auto">
                          Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Posts */}
                  <div style={{ background: "rgba(255,255,255,0.015)" }}>
                    {loading && Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)}

                    {!loading && posts.length === 0 && (
                      <div className="py-16 text-center">
                        <p className="text-gray-500 text-sm">No posts yet.</p>
                      </div>
                    )}

                    {!loading && posts.map((post) => <PostCard key={post.id} post={post} />)}
                  </div>
                </>
              )}

            </div>
          </main>
        </div>
      </div>
    </>
  );
}
