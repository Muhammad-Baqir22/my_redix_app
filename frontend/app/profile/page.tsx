"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, ArrowUp, ArrowDown, MessageSquare, Share2, X } from "lucide-react";
import { toast, Toaster } from "sonner";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { apiFetch, getCurrentUser, getToken, getProfileImages } from "@/lib/api";
import { ApiResponse, FeedPost } from "@/types/api";
import { formatCount, timeAgo } from "@/lib/utils";

/* ─── Mini post card for profile feed ─── */
function ProfilePostCard({ post }: { post: FeedPost }) {
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

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast.success("Link copied!");
  };

  return (
    <article
      className="border-b border-white/[0.06] px-5 py-4 hover:bg-white/[0.02] transition-colors"
    >
      {/* Title */}
      <Link href={`/post/${post.id}`}>
        <h3 className="text-white font-semibold text-sm leading-snug mb-1.5 hover:text-purple-300 transition-colors">
          {post.title}
        </h3>
      </Link>

      {/* Body preview */}
      {post.content && (
        <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{post.content}</p>
      )}

      {/* Media */}
      {post.media_url && (
        <div className="w-full rounded-xl overflow-hidden mb-3 bg-white/[0.04]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.media_url} alt="Post media" className="w-full max-h-64 object-cover" />
        </div>
      )}

      {/* Meta + actions */}
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-xs">{timeAgo(post.created_at ?? new Date().toISOString())}</span>

        <div className="flex items-center gap-0.5">
          {/* Votes */}
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
            onClick={handleShare}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-gray-600 text-xs hover:bg-white/[0.06] hover:text-gray-300 transition-all"
          >
            <Share2 size={12} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Skeleton ─── */
function PostSkeleton() {
  return (
    <div className="border-b border-white/[0.06] px-5 py-4 animate-pulse space-y-2">
      <div className="w-3/4 h-4 bg-white/[0.06] rounded" />
      <div className="w-full h-3 bg-white/[0.06] rounded" />
      <div className="w-1/2 h-3 bg-white/[0.06] rounded" />
    </div>
  );
}

/* ─── Follow list modal ─── */
interface FollowUser { id: string; username: string; email: string; avatar_url?: string | null; }

function FollowModal({
  title, users, loading, onClose,
}: {
  title: string;
  users: FollowUser[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/[0.1] overflow-hidden"
        style={{ background: "#0d1020" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
          <p className="text-white font-bold text-sm">{title}</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-white/[0.07] flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-28 h-3 bg-white/[0.07] rounded" />
                    <div className="w-40 h-2.5 bg-white/[0.05] rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && users.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-10">Nobody here yet.</p>
          )}

          {!loading && users.map((u) => (
            <Link
              key={u.id}
              href={`/profile/${u.username}`}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
            >
              <div
                className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={u.avatar_url ? undefined : { background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                {u.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                  : u.username[0].toUpperCase()
                }
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">u/{u.username}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function ProfilePage() {
  const router = useRouter();

  const [username,        setUsername]        = useState("");
  const [email,           setEmail]           = useState("");
  const [posts,           setPosts]           = useState<FeedPost[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState<"posts" | "saved" | "tagged">("posts");
  const [avatarUrl,       setAvatarUrl]       = useState("");
  const [bannerUrl,       setBannerUrl]       = useState("");
  const [followersCount,  setFollowersCount]  = useState(0);
  const [followingCount,  setFollowingCount]  = useState(0);
  const [modal,           setModal]           = useState<"followers" | "following" | null>(null);
  const [modalUsers,      setModalUsers]      = useState<FollowUser[]>([]);
  const [modalLoading,    setModalLoading]    = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }

    const user = getCurrentUser();
    if (!user) { router.push("/login"); return; }

    setEmail(user.email);

    const { avatarUrl: av, bannerUrl: bv } = getProfileImages();
    if (av) setAvatarUrl(av);
    if (bv) setBannerUrl(bv);

    apiFetch<ApiResponse<FeedPost[]>>("/api/post/user?page=1&pageSize=20")
      .then((res) => {
        const data = res.data ?? [];
        setPosts(data);
        const resolvedUsername = user.username || data[0]?.username || "";
        if (resolvedUsername) {
          setUsername(resolvedUsername);
          apiFetch<ApiResponse<{ followers_count: number; following_count: number; avatar_url?: string; banner_url?: string }>>(`/api/users/${resolvedUsername}`)
            .then((r) => {
              setFollowersCount(r.data.followers_count ?? 0);
              setFollowingCount(r.data.following_count ?? 0);
              if (r.data.avatar_url) setAvatarUrl(r.data.avatar_url);
              if (r.data.banner_url) setBannerUrl(r.data.banner_url);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = async (type: "followers" | "following") => {
    setModal(type);
    setModalUsers([]);
    setModalLoading(true);
    try {
      const endpoint = type === "followers" ? "/api/users/followers" : "/api/users/userfollow";
      const res = await apiFetch<ApiResponse<any[]>>(endpoint);
      const list: FollowUser[] = (res.data ?? []).map((entry: any) =>
        type === "followers"
          ? { id: entry.followby.id, username: entry.followby.username, email: entry.followby.email, avatar_url: entry.followby.avatar_url }
          : { id: entry.user.id,     username: entry.user.username,     email: entry.user.email,     avatar_url: entry.user.avatar_url }
      );
      setModalUsers(list);
    } catch {
      setModalUsers([]);
    } finally {
      setModalLoading(false);
    }
  };

  const displayName  = username || (email ? email.split("@")[0] : "");
  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : "?";

  const TABS = [
    { key: "posts",  label: "Posts" },
    { key: "saved",  label: "Saved" },
    { key: "tagged", label: "Tagged" },
  ] as const;

  return (
    <>
      <Toaster position="top-center" theme="dark" richColors closeButton />

      {modal && (
        <FollowModal
          title={modal === "followers" ? "Followers" : "Following"}
          users={modalUsers}
          loading={modalLoading}
          onClose={() => setModal(null)}
        />
      )}

      <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
        <Navbar />

        <div className="flex pt-14">
          <LeftSidebar />

          <main className="flex-1 sidebar-ml min-h-[calc(100vh-3.5rem)]">
            <div className="max-w-2xl mx-auto">

              {/* ── Banner ── */}
              <div
                className="w-full h-36 sm:h-48 overflow-hidden"
                style={{
                  background: bannerUrl
                    ? undefined
                    : "radial-gradient(ellipse at 20% 60%, rgba(124,58,237,0.6) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(99,102,241,0.4) 0%, transparent 50%), linear-gradient(135deg, #050820 0%, #1a0845 40%, #0f0530 70%, #050820 100%)",
                }}
              >
                {bannerUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                )}
              </div>

              {/* ── Profile header ── */}
              <div
                className="border-b border-white/[0.06] px-5 pb-4"
                style={{ background: "rgba(255,255,255,0.015)" }}
              >
                {/* Avatar row */}
                <div className="flex items-end justify-between -mt-12 mb-3">
                  {/* Avatar */}
                  <div
                    className="w-24 h-24 rounded-full border-4 border-[#0b0e1a] overflow-hidden flex items-center justify-center text-white text-3xl font-bold flex-shrink-0"
                    style={avatarUrl ? undefined : { background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                  >
                    {avatarUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      : avatarLetter
                    }
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-14">
                    <Link
                      href="/profile/edit"
                      className="px-4 py-1.5 rounded-full text-sm font-semibold text-white border border-white/20 hover:bg-white/[0.08] transition-all"
                    >
                      Edit Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:bg-white/[0.08] transition-all"
                    >
                      <Settings size={15} />
                    </Link>
                  </div>
                </div>

                {/* Name + handle */}
                <div className="mb-3">
                  <p className="text-white font-bold text-xl leading-tight">{displayName || "—"}</p>
                  <p className="text-gray-500 text-sm">@{username || displayName || "—"}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-sm font-bold">{posts.length}</span>
                    <span className="text-gray-500 text-sm">posts</span>
                  </div>
                  <button
                    onClick={() => openModal("followers")}
                    className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                  >
                    <span className="text-white text-sm font-bold">{followersCount}</span>
                    <span className="text-gray-500 text-sm">followers</span>
                  </button>
                  <button
                    onClick={() => openModal("following")}
                    className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                  >
                    <span className="text-white text-sm font-bold">{followingCount}</span>
                    <span className="text-gray-500 text-sm">following</span>
                  </button>
                </div>
              </div>

              {/* ── Tabs ── */}
              <div className="flex border-b border-white/[0.06]" style={{ background: "rgba(255,255,255,0.015)" }}>
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                      activeTab === tab.key
                        ? "border-purple-500 text-purple-300"
                        : "border-transparent text-gray-600 hover:text-gray-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Posts feed ── */}
              <div style={{ background: "rgba(255,255,255,0.015)" }}>
                {activeTab === "posts" && (
                  loading ? (
                    Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
                  ) : posts.length === 0 ? (
                    <div className="py-20 text-center">
                      <p className="text-gray-500 text-sm">No posts yet.</p>
                      <Link
                        href="/create-post"
                        className="mt-3 inline-block px-5 py-2 rounded-full text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all"
                      >
                        Create your first post
                      </Link>
                    </div>
                  ) : (
                    posts.map((post) => <ProfilePostCard key={post.id} post={post} />)
                  )
                )}

                {(activeTab === "saved" || activeTab === "tagged") && (
                  <div className="py-20 text-center">
                    <p className="text-gray-500 text-sm">Coming soon.</p>
                  </div>
                )}
              </div>

            </div>
          </main>
        </div>
      </div>
    </>
  );
}
