"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiSubreddit, ApiResponse } from "@/types/api";
import { apiFetch, getToken } from "@/lib/api";
import { communityColor } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";

export default function CreatePostPage() {
  const router   = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [title,       setTitle]       = useState("");
  const [content,     setContent]     = useState("");
  const [subreddits,  setSubreddits]  = useState<ApiSubreddit[]>([]);
  const [selectedSub, setSelectedSub] = useState<string>("");
  const [submitting,  setSubmitting]  = useState(false);
  const [mediaUrl,    setMediaUrl]    = useState<string>("");
  const [uploading,   setUploading]   = useState(false);
  const [preview,     setPreview]     = useState<string>("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetch<ApiResponse<ApiSubreddit[]>>("/api/subreddit/subs/")
      .then((res) => setSubreddits(res.data ?? []))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      // Step 1: get pre-signed URL from backend
      const res = await apiFetch<{ success: boolean; signedUrl: string; media_Url: string }>(
        "/api/upload/genrateUrl",
        {
          method: "POST",
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        }
      );

      // Step 2: upload file directly to R2
      const uploadRes = await fetch(res.signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Upload to storage failed");

      setMediaUrl(res.media_Url);
      toast.success("Image uploaded!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image upload failed.");
      setMediaUrl(""); // clear URL but keep preview so user can see what they picked
    } finally {
      setUploading(false);
      // reset so same file can be re-selected
      e.target.value = "";
    }
  };

  const removeImage = () => {
    setPreview("");
    setMediaUrl("");
  };

  const submit = async () => {
    if (!title.trim()) { toast.error("Title is required."); return; }
    if (uploading) { toast.error("Please wait for the image to finish uploading."); return; }
    setSubmitting(true);
    try {
      await apiFetch<ApiResponse<unknown>>("/api/post/", {
        method: "POST",
        body: JSON.stringify({
          title:     title.trim(),
          content:   content.trim() || undefined,
          id:        selectedSub || undefined,
          media_url: mediaUrl || undefined,
        }),
      });
      toast.success("Post created!");
      router.push("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      <Navbar />

      <div className="flex pt-14">
        <LeftSidebar />

        <main className="flex-1 sidebar-ml px-4 py-8">
        <h1 className="text-white text-2xl font-bold mt-5 mb-6">Create a post</h1>

        <div className="flex flex-col gap-4">
          {/* Community selector */}
          <div
            className="rounded-2xl border border-white/[0.07] p-4"
            style={{ background: "rgba(255,255,255,0.025)" }}
          >
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
              Community (optional)
            </label>
            {subreddits.length === 0 ? (
              <p className="text-gray-600 text-sm">No communities found. Posts go to your personal feed.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSub("")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedSub === ""
                      ? "border-purple-500/60 bg-purple-500/15 text-purple-300"
                      : "border-white/[0.08] text-gray-500 hover:border-white/20 hover:text-gray-300"
                  }`}
                >
                  My feed
                </button>
                {subreddits.map((sub) => {
                  const color  = communityColor(sub.name);
                  const active = selectedSub === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSub(sub.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        active
                          ? "border-purple-500/60 bg-purple-500/15 text-purple-300"
                          : "border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-gray-200"
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      r/{sub.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Post content */}
          <div
            className="rounded-2xl border border-white/[0.07] overflow-hidden"
            style={{ background: "rgba(255,255,255,0.025)" }}
          >
            {/* Title */}
            <div className="p-4 border-b border-white/[0.06]">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="An interesting title…"
                maxLength={300}
                className="w-full bg-transparent text-white text-lg font-semibold placeholder-gray-600 focus:outline-none"
              />
              <div className="flex justify-end mt-1">
                <span className="text-gray-700 text-xs">{title.length}/300</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 border-b border-white/[0.06]">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Body text (optional)"
                rows={5}
                className="w-full bg-transparent text-gray-300 text-sm placeholder-gray-600 resize-none focus:outline-none leading-relaxed"
              />
            </div>

            {/* Image preview */}
            {(preview || uploading) && (
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <div className="relative w-full rounded-xl overflow-hidden bg-white/[0.04]">
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                      <Loader2 size={24} className="text-purple-400 animate-spin" />
                      <span className="ml-2 text-white text-sm">Uploading…</span>
                    </div>
                  )}
                  {preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="w-full max-h-72 object-cover" />
                  )}
                  {!uploading && (
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-all"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-gray-500 hover:text-purple-400 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <ImagePlus size={15} />
                )}
                {uploading ? "Uploading…" : "Add image"}
              </button>

              <div className="flex gap-2">
                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 border border-white/[0.08] hover:bg-white/[0.05] transition-all"
                >
                  <X size={14} />
                  Cancel
                </Link>
                <button
                  onClick={submit}
                  disabled={submitting || uploading || !title.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all"
                >
                  {submitting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
