"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, ArrowUp, ArrowDown, MessageSquare, Share2 } from "lucide-react";
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

/* ─── Main page ─── */
export default function ProfilePage() {
  const router = useRouter();

  const [username,   setUsername]   = useState("");
  const [email,      setEmail]      = useState("");
  const [posts,      setPosts]      = useState<FeedPost[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<"posts" | "saved" | "tagged">("posts");
  const [avatarUrl,  setAvatarUrl]  = useState("");
  const [bannerUrl,  setBannerUrl]  = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }

    const user = getCurrentUser();
    if (!user) { router.push("/login"); return; }

    setEmail(user.email);

    const { avatarUrl: av, bannerUrl: bv } = getProfileImages();
    if (av) setAvatarUrl(av);
    if (bv) setBannerUrl(bv);

    const loadPosts = () =>
      apiFetch<ApiResponse<FeedPost[]>>("/api/post/user?page=1&pageSize=20")
        .then((res) => {
          const data = res.data ?? [];
          setPosts(data);
          // extract username from first post if not in storage
          if (!user.username && data[0]?.username) setUsername(data[0].username);
          else if (user.username) setUsername(user.username);
        })
        .catch(() => {})
        .finally(() => setLoading(false));

    loadPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
        <Navbar />

        <div className="flex pt-14">
          <div
            className="hidden md:flex flex-col fixed top-14 left-0 bottom-0 w-56 border-r border-white/[0.06] overflow-y-auto"
            style={{ background: "#0d1020" }}
          >
            <LeftSidebar />
          </div>

          <main className="flex-1 md:ml-56 min-h-[calc(100vh-3.5rem)]">
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-sm font-bold">0</span>
                    <span className="text-gray-500 text-sm">followers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-sm font-bold">0</span>
                    <span className="text-gray-500 text-sm">following</span>
                  </div>
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
