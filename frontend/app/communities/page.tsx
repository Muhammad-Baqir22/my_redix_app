"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, UserPlus, Check, Plus, X, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { apiFetch, getToken } from "@/lib/api";
import { ApiResponse } from "@/types/api";

interface Subreddit {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  member_count: number;
  is_following: boolean;
}

export default function CommunitiesPage() {
  const router = useRouter();
  const [subs, setSubs] = useState<Subreddit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const userId = typeof window !== "undefined" ? (localStorage.getItem("userId") ?? "") : "";

  const load = () => {
    apiFetch<ApiResponse<Subreddit[]>>("/api/subreddit/subs/")
      .then((res) => setSubs(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    load();
  }, [router]);

  const toggleFollow = async (sub: Subreddit) => {
    const endpoint = sub.is_following ? "/api/subreddit/unfollowsub" : "/api/subreddit/followsub";
    setSubs((prev) => prev.map((s) => s.id === sub.id
      ? { ...s, is_following: !s.is_following, member_count: s.member_count + (s.is_following ? -1 : 1) }
      : s
    ));
    try {
      await apiFetch(endpoint, { method: "POST", body: JSON.stringify({ sub_id: sub.id }) });
    } catch {
      setSubs((prev) => prev.map((s) => s.id === sub.id
        ? { ...s, is_following: sub.is_following, member_count: sub.member_count }
        : s
      ));
      toast.error("Something went wrong");
    }
  };

  const createCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await apiFetch("/api/subreddit/sub", {
        method: "POST",
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() }),
      });
      toast.success(`r/${form.name.trim()} created!`);
      setShowModal(false);
      setForm({ name: "", description: "" });
      setLoading(true);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create community");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#0b0e1a" }}>
      <Navbar />
      <div className="flex pt-14">
        <LeftSidebar />
        <main className="flex-1 sidebar-ml px-3 sm:px-4 py-5 min-h-[calc(100vh-3.5rem)] pb-20 md:pb-6 overflow-x-hidden">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-white font-bold text-xl">Communities</h1>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl text-white text-xs sm:text-sm font-semibold transition-all hover:opacity-90 flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
              >
                <Plus size={14} />
                <span className="hidden xs:inline sm:inline">Create</span>
                <span className="hidden sm:inline"> Community</span>
              </button>
            </div>

            {/* Skeletons */}
            {loading && (
              <div className="flex flex-col gap-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && subs.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-sm mb-4">No communities yet.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                >
                  Create the first one
                </button>
              </div>
            )}

            {/* Community list */}
            <div className="flex flex-col gap-2.5">
              {subs.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 px-3 py-3 sm:p-4 rounded-2xl border border-white/[0.07] hover:border-purple-500/20 transition-all"
                  style={{ background: "rgba(255,255,255,0.025)" }}
                >
                  {/* Icon + info (clickable) */}
                  <Link href={`/community/${sub.name}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
                    >
                      <Hash size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold text-sm truncate">r/{sub.name}</p>
                      <span className="text-gray-600 text-xs flex items-center gap-1 mt-0.5">
                        <Users size={10} />
                        {sub.member_count} members
                      </span>
                      {sub.description && (
                        <p className="text-gray-500 text-xs truncate mt-0.5">{sub.description}</p>
                      )}
                    </div>
                  </Link>

                  {/* Join/Joined button — hidden for the community creator */}
                  {sub.created_by === userId ? (
                    <span className="text-xs font-semibold text-purple-400 border border-purple-500/40 px-2.5 py-1.5 rounded-lg flex-shrink-0">
                      Admin
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleFollow(sub)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-semibold transition-all duration-150 flex-shrink-0 ${
                        sub.is_following ? "bg-white/[0.06] text-gray-400" : "text-white"
                      }`}
                      style={sub.is_following ? undefined : { background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                    >
                      {sub.is_following
                        ? <><Check size={11} /><span>Joined</span></>
                        : <><UserPlus size={11} /><span>Join</span></>
                      }
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Create Community Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-white/[0.1] p-5 sm:p-6"
            style={{ background: "#141728" }}
          >
            {/* Drag handle on mobile */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Create Community</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={createCommunity} className="flex flex-col gap-4">
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Community name</label>
                <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 focus-within:border-purple-500/50 transition-colors">
                  <span className="text-gray-500 text-sm mr-1">r/</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.replace(/\s/g, "_") }))}
                    placeholder="community_name"
                    required
                    autoFocus
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">
                  Description <span className="text-gray-600">(optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What is this community about?"
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 resize-none outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
              <div className="flex gap-3 justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 text-sm hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !form.name.trim()}
                  className="px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
