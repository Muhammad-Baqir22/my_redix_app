"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, MessageSquare, Share2, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { FeedPost, ApiResponse } from "@/types/api";
import { apiFetch, getToken } from "@/lib/api";
import { communityColor, formatCount } from "@/lib/utils";

export default function PostCard({ post, initialSaved = false }: { post: FeedPost; initialSaved?: boolean }) {

  const [userVote, setUserVote] = useState<-1 | 0 | 1>(0);
  const [total, setTotal]       = useState(post.votes);
  const [saved, setSaved]       = useState(initialSaved);
  const [savingInProgress, setSavingInProgress] = useState(false);

  const color = post.subreddit_name ? communityColor(post.subreddit_name) : "#7c3aed";

  const handleVote = async (type: 1 | -1) => {
    if (!getToken()) { toast.error("Please log in to vote."); return; }

    const next = (userVote === type ? 0 : type) as -1 | 0 | 1;
    const diff = next - userVote;

    setUserVote(next);
    setTotal((t) => t + diff);

    try {
      await apiFetch<ApiResponse<unknown>>("/api/vote/", {
        method: "POST",
        body: JSON.stringify({ post_id: post.id, vote_type: next }),
      });
    } catch {
      setUserVote(userVote);
      setTotal((t) => t - diff);
      toast.error("Failed to vote. Try again.");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast.success("Link copied to clipboard!");
  };

  return (
    <article
      className="flex gap-4 p-4 rounded-2xl border border-white/[0.07] hover:border-purple-500/20 transition-all duration-200 group"
      style={{ background: "rgba(255,255,255,0.025)" }}
    >
      {/* Vote column */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
        <button
          onClick={() => handleVote(1)}
          aria-label="Upvote"
          className={`p-1.5 rounded-lg transition-all duration-150 hover:bg-white/[0.08] ${
            userVote === 1 ? "text-orange-400" : "text-gray-500 hover:text-orange-400"
          }`}
        >
          <ArrowUp size={17} strokeWidth={2.5} />
        </button>
        <span
          className={`text-xs font-bold min-w-[32px] text-center leading-none ${
            userVote === 1 ? "text-orange-400" : userVote === -1 ? "text-blue-400" : "text-gray-400"
          }`}
        >
          {formatCount(total)}
        </span>
        <button
          onClick={() => handleVote(-1)}
          aria-label="Downvote"
          className={`p-1.5 rounded-lg transition-all duration-150 hover:bg-white/[0.08] ${
            userVote === -1 ? "text-blue-400" : "text-gray-500 hover:text-blue-400"
          }`}
        >
          <ArrowDown size={17} strokeWidth={2.5} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {post.subreddit_name && (
            <>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ background: color }}
              >
                {post.subreddit_name.charAt(0).toUpperCase()}
              </div>
              <Link href={`/community/${post.subreddit_name}`} className="text-white text-xs font-semibold hover:text-purple-300 transition-colors">
                r/{post.subreddit_name}
              </Link>
              <span className="text-gray-700 text-xs">•</span>
            </>
          )}
          <span className="text-gray-500 text-xs">
            by{" "}
            <Link href={`/profile/${post.username}`} className="hover:text-purple-400 transition-colors">
              u/{post.username}
            </Link>
          </span>
        </div>

        {/* Title */}
        <Link href={`/post/${post.id}`}>
          <h2 className="text-white text-base font-bold leading-snug mb-2 group-hover:text-purple-100 transition-colors">
            {post.title}
          </h2>
        </Link>

        {/* Body */}
        {post.content && (
          <p className="text-gray-400 text-sm leading-relaxed mb-3 line-clamp-3">
            {post.content}
          </p>
        )}

        {/* Media */}
        {post.media_url && (
          <div className="w-full h-52 rounded-xl mb-3 overflow-hidden bg-white/[0.04]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.media_url} alt="Post media" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 mt-1 -ml-1.5">
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 text-xs font-medium hover:bg-white/[0.07] hover:text-gray-300 transition-all duration-150"
          >
            <MessageSquare size={14} />
            {post.comment.length} Comments
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 text-xs font-medium hover:bg-white/[0.07] hover:text-gray-300 transition-all duration-150"
          >
            <Share2 size={14} />
            Share
          </button>
          <button
            disabled={savingInProgress}
            onClick={async () => {
              setSavingInProgress(true);
              try {
                if (saved) {
                  await apiFetch("/api/saved/", { method: "DELETE", body: JSON.stringify({ post_id: post.id }) });
                  setSaved(false);
                  toast.success("Removed from saved");
                } else {
                  await apiFetch("/api/saved/", { method: "POST", body: JSON.stringify({ post_id: post.id }) });
                  setSaved(true);
                  toast.success("Post saved!");
                }
              } catch {
                toast.error("Something went wrong");
              } finally {
                setSavingInProgress(false);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/[0.07] transition-all duration-150 ${saved ? "text-purple-400" : "text-gray-500 hover:text-gray-300"}`}
          >
            <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </article>
  );
}
