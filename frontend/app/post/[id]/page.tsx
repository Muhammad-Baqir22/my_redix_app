"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowUp, ArrowDown, MessageSquare, Share2, Send,
} from "lucide-react";
import { toast } from "sonner";
import { BackendComment, PostDetail, ApiResponse } from "@/types/api";
import { apiFetch, getToken } from "@/lib/api";
import { communityColor, formatCount, timeAgo } from "@/lib/utils";

/* ─── Comment vote ─── */
async function voteComment(comment_id: string, vote_type: -1 | 0 | 1) {
  await apiFetch<ApiResponse<unknown>>("/api/vote/comment", {
    method: "POST",
    body: JSON.stringify({ comment_id, vote_type }),
  });
}

/* ─── Recursive comment item ─── */
function CommentItem({
  comment,
  postId,
  depth = 0,
  onReplyPosted,
}: {
  comment: BackendComment;
  postId: string;
  depth?: number;
  onReplyPosted: () => void;
}) {
  const [vote,       setVote]       = useState<-1 | 0 | 1>(0);
  const [total,      setTotal]      = useState(comment.commentVote);
  const [replying,   setReplying]   = useState(false);
  const [replyText,  setReplyText]  = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleVote = async (type: 1 | -1) => {
    if (!getToken()) { toast.error("Please log in to vote."); return; }
    const next = (vote === type ? 0 : type) as -1 | 0 | 1;
    const diff = next - vote;
    setVote(next);
    setTotal((t) => t + diff);
    try {
      await voteComment(comment.id, next);
    } catch {
      setVote(vote);
      setTotal((t) => t - diff);
      toast.error("Vote failed.");
    }
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch<ApiResponse<unknown>>("/api/comment/", {
        method: "POST",
        body: JSON.stringify({ content: replyText.trim(), post_id: postId, parent_id: comment.id }),
      });
      setReplyText("");
      setReplying(false);
      onReplyPosted();
      toast.success("Reply posted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post reply.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${depth > 0 ? "ml-5 border-l border-white/[0.06] pl-4" : ""}`}>
      <div className="py-3">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-full bg-purple-600/50 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
            {comment.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-purple-300 text-xs font-semibold">u/{comment.username}</span>
          <span className="text-gray-600 text-xs">{timeAgo(comment.created_at)}</span>
        </div>

        {/* Content */}
        <p className="text-gray-300 text-sm leading-relaxed mb-2">{comment.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-1 -ml-1">
          <button
            onClick={() => handleVote(1)}
            className={`p-1.5 rounded-lg text-xs transition-all hover:bg-white/[0.06] ${vote === 1 ? "text-orange-400" : "text-gray-600 hover:text-orange-400"}`}
          >
            <ArrowUp size={13} strokeWidth={2.5} />
          </button>
          <span className={`text-xs font-bold ${vote === 1 ? "text-orange-400" : vote === -1 ? "text-blue-400" : "text-gray-500"}`}>
            {formatCount(total)}
          </span>
          <button
            onClick={() => handleVote(-1)}
            className={`p-1.5 rounded-lg text-xs transition-all hover:bg-white/[0.06] ${vote === -1 ? "text-blue-400" : "text-gray-600 hover:text-blue-400"}`}
          >
            <ArrowDown size={13} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setReplying((v) => !v)}
            className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded-lg text-gray-600 text-xs hover:bg-white/[0.06] hover:text-gray-300 transition-all"
          >
            <MessageSquare size={12} />
            Reply
          </button>
        </div>

        {/* Reply input */}
        {replying && (
          <div className="mt-2 flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              rows={2}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <button
              onClick={submitReply}
              disabled={submitting || !replyText.trim()}
              className="self-end p-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-all flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          depth={depth + 1}
          onReplyPosted={onReplyPosted}
        />
      ))}
    </div>
  );
}

/* ─── Skeleton ─── */
function PostDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="w-2/3 h-7 bg-white/[0.06] rounded-lg" />
      <div className="w-24 h-3 bg-white/[0.06] rounded" />
      <div className="space-y-2">
        <div className="w-full h-3 bg-white/[0.06] rounded" />
        <div className="w-5/6 h-3 bg-white/[0.06] rounded" />
        <div className="w-4/6 h-3 bg-white/[0.06] rounded" />
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function PostPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();

  const [post,        setPost]        = useState<PostDetail | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [vote,        setVote]        = useState<-1 | 0 | 1>(0);
  const [voteTotal,   setVoteTotal]   = useState(0);
  const [comment,     setComment]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [comments,    setComments]    = useState<BackendComment[]>([]);

  const loadPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ApiResponse<PostDetail>>(`/api/post/post/${id}`);
      setPost(res.data);
      setVoteTotal(res.data.votepost ?? 0);
      setComments(res.data.comment ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    loadPost();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleVote = async (type: 1 | -1) => {
    if (!getToken()) { toast.error("Please log in to vote."); return; }
    const next = (vote === type ? 0 : type) as -1 | 0 | 1;
    const diff = next - vote;
    setVote(next);
    setVoteTotal((t) => t + diff);
    try {
      await apiFetch<ApiResponse<unknown>>("/api/vote/", {
        method: "POST",
        body: JSON.stringify({ post_id: id, vote_type: next }),
      });
    } catch {
      setVote(vote);
      setVoteTotal((t) => t - diff);
      toast.error("Vote failed.");
    }
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch<ApiResponse<unknown>>("/api/comment/", {
        method: "POST",
        body: JSON.stringify({ content: comment.trim(), post_id: id }),
      });
      setComment("");
      toast.success("Comment posted.");
      await loadPost();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const color = post?.name ? communityColor(post.name) : "#7c3aed";

  return (
    <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center px-4 border-b border-white/[0.06]"
        style={{ background: "#0d1020" }}
      >
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} />
          Back to feed
        </Link>
        <span
          className="ml-4 text-xl font-black tracking-tight"
          style={{ background: "linear-gradient(135deg, #a78bfa, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          RediX
        </span>
      </nav>

      <main className="pt-14 max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <PostDetailSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={loadPost}
              className="px-4 py-2 rounded-xl text-sm text-white border border-white/[0.1] hover:bg-white/[0.05] transition-all"
            >
              Retry
            </button>
          </div>
        ) : post && (
          <div className="flex flex-col gap-5">
            {/* Post card */}
            <article
              className="rounded-2xl border border-white/[0.07] p-5"
              style={{ background: "rgba(255,255,255,0.025)" }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {post.name && (
                  <>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: color }}
                    >
                      {post.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-xs font-semibold">r/{post.name}</span>
                    <span className="text-gray-700 text-xs">•</span>
                  </>
                )}
                <span className="text-gray-500 text-xs">
                  by <span className="hover:text-purple-400 cursor-pointer">u/{post.username}</span>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-white text-xl font-bold leading-snug mb-3">{post.title}</h1>

              {/* Body */}
              {post.content && (
                <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
              )}

              {/* Media */}
              {post.media_url && (
                <div className="w-full rounded-xl mb-4 overflow-hidden bg-white/[0.04]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.media_url} alt="Post media" className="w-full object-cover" />
                </div>
              )}

              {/* Vote + share bar */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5 bg-white/[0.04] rounded-xl px-2 py-1">
                  <button
                    onClick={() => handleVote(1)}
                    className={`p-1 rounded-lg transition-all hover:bg-white/[0.08] ${vote === 1 ? "text-orange-400" : "text-gray-500 hover:text-orange-400"}`}
                  >
                    <ArrowUp size={15} strokeWidth={2.5} />
                  </button>
                  <span className={`text-xs font-bold min-w-[28px] text-center ${vote === 1 ? "text-orange-400" : vote === -1 ? "text-blue-400" : "text-gray-400"}`}>
                    {formatCount(voteTotal)}
                  </span>
                  <button
                    onClick={() => handleVote(-1)}
                    className={`p-1 rounded-lg transition-all hover:bg-white/[0.08] ${vote === -1 ? "text-blue-400" : "text-gray-500 hover:text-blue-400"}`}
                  >
                    <ArrowDown size={15} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] text-gray-500 text-xs">
                  <MessageSquare size={13} />
                  {comments.length} Comments
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] text-gray-500 text-xs hover:text-gray-300 transition-colors"
                >
                  <Share2 size={13} />
                  Share
                </button>
              </div>
            </article>

            {/* Comment box */}
            <div
              className="rounded-2xl border border-white/[0.07] p-4"
              style={{ background: "rgba(255,255,255,0.025)" }}
            >
              <p className="text-white text-sm font-semibold mb-3">Add a comment</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What are your thoughts?"
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-purple-500/50 transition-colors mb-3"
              />
              <div className="flex justify-end">
                <button
                  onClick={submitComment}
                  disabled={submitting || !comment.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all"
                >
                  {submitting ? "Posting…" : (
                    <>
                      <Send size={14} />
                      Comment
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Comments */}
            {comments.length > 0 && (
              <div
                className="rounded-2xl border border-white/[0.07] px-5"
                style={{ background: "rgba(255,255,255,0.025)" }}
              >
                <p className="text-white text-sm font-semibold py-3 border-b border-white/[0.06]">
                  {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
                </p>
                {comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    postId={id}
                    onReplyPosted={loadPost}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
