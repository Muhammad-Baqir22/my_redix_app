"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Globe, Trash2, Plus, Camera,
  AlertTriangle, Save, X, ArrowLeft, Loader2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { apiFetch, getCurrentUser, getToken, getProfileImages, saveProfileImages } from "@/lib/api";
import { ApiResponse, FeedPost } from "@/types/api";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 ${
        enabled ? "bg-purple-600" : "bg-white/[0.12]"
      }`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${enabled ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <h3 className="text-white text-sm font-semibold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-gray-400 text-xs font-medium mb-1.5 select-none">
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none transition-all duration-200 hover:border-white/20 focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/10";

interface SocialLink { id: string; url: string; }

function SocialLinkRow({ link, onDelete, onChange }: {
  link: SocialLink;
  onDelete: (id: string) => void;
  onChange: (id: string, url: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
        <Globe size={14} className="text-gray-500" />
      </div>
      <input
        type="url"
        value={link.url}
        onChange={(e) => onChange(link.id, e.target.value)}
        placeholder="https://yoursite.com"
        className={inputCls + " flex-1"}
      />
      <button
        type="button"
        onClick={() => onDelete(link.id)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 flex-shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/* ─── Upload helper ─── */
async function uploadToR2(file: File): Promise<string> {
  const res = await apiFetch<{ success: boolean; signedUrl: string; media_Url: string }>(
    "/api/upload/genrateUrl",
    {
      method: "POST",
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    }
  );
  const uploadRes = await fetch(res.signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!uploadRes.ok) throw new Error("Upload failed");
  return res.media_Url;
}

export default function EditProfilePage() {
  const router = useRouter();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [username,  setUsername]  = useState("");
  const [email,     setEmail]     = useState("");
  const [location,  setLocation]  = useState("");
  const [bio,       setBio]       = useState("");
  const [links,     setLinks]     = useState<SocialLink[]>([]);
  const [publicProfile,    setPublicProfile]    = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loaded,    setLoaded]    = useState(false);

  // image states
  const [avatarUrl,      setAvatarUrl]      = useState("");
  const [bannerUrl,      setBannerUrl]      = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    const user = getCurrentUser();
    if (!user) { router.push("/login"); return; }
    setEmail(user.email);
    // restore previously uploaded images
    const saved = getProfileImages();
    if (saved.avatarUrl) setAvatarUrl(saved.avatarUrl);
    if (saved.bannerUrl) setBannerUrl(saved.bannerUrl);

    if (user.username) {
      setUsername(user.username);
      setLoaded(true);
    } else {
      apiFetch<ApiResponse<FeedPost[]>>("/api/post/user?page=1&pageSize=1")
        .then((res) => { const f = res.data?.[0]; if (f?.username) setUsername(f.username); })
        .catch(() => {})
        .finally(() => setLoaded(true));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarUrl(URL.createObjectURL(file));
    try {
      const url = await uploadToR2(file);
      setAvatarUrl(url);
      saveProfileImages(url, bannerUrl);
      toast.success("Profile picture updated!");
    } catch {
      toast.error("Failed to upload profile picture.");
      setAvatarUrl("");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setBannerUrl(URL.createObjectURL(file));
    try {
      const url = await uploadToR2(file);
      setBannerUrl(url);
      saveProfileImages(avatarUrl, url);
      toast.success("Banner updated!");
    } catch {
      toast.error("Failed to upload banner.");
      setBannerUrl("");
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  };

  const addLink    = () => setLinks((p) => [...p, { id: Date.now().toString(), url: "" }]);
  const removeLink = (id: string) => setLinks((p) => p.filter((l) => l.id !== id));
  const updateLink = (id: string, url: string) => setLinks((p) => p.map((l) => l.id === id ? { ...l, url } : l));

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setIsSaving(false);
    toast.success("Profile updated!");
  };

  const handleDeleteAccount = () => {
    if (!showDeleteConfirm) { setShowDeleteConfirm(true); return; }
    toast.error("Account deletion is not available in this demo.");
    setShowDeleteConfirm(false);
  };

  const displayName  = username || (email ? email.split("@")[0] : "");
  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : "?";

  return (
    <>
      <Toaster position="top-center" theme="dark" richColors closeButton />

      {/* Hidden file inputs */}
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />

      <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
        <Navbar />
        <div className="flex pt-14">
          <div className="hidden md:flex flex-col fixed top-14 left-0 bottom-0 w-56 border-r border-white/[0.06] overflow-y-auto" style={{ background: "#0d1020" }}>
            <LeftSidebar />
          </div>

          <main className="flex-1 md:ml-56 px-4 sm:px-6 py-6 min-h-[calc(100vh-3.5rem)]">
            <div className="max-w-2xl mx-auto flex flex-col gap-5">

              <div className="flex items-center gap-3">
                <Link href="/profile" className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-sm">
                  <ArrowLeft size={16} /> Back
                </Link>
                <div>
                  <h1 className="text-white text-2xl font-bold">Edit Profile</h1>
                  <p className="text-gray-500 text-sm mt-0.5">Manage your digital identity.</p>
                </div>
              </div>

              {/* ── Banner + Avatar ── */}
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "rgba(255,255,255,0.025)" }}>

                {/* Banner */}
                <div
                  className="relative w-full h-36 sm:h-44 group cursor-pointer overflow-hidden"
                  onClick={() => !uploadingBanner && bannerInputRef.current?.click()}
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {uploadingBanner ? (
                      <Loader2 size={22} className="text-white animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-xl">
                        <Camera size={16} /> Change Banner
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar + name */}
                <div className="px-6 pt-0 pb-5">
                  <div className="relative -mt-10 mb-4 w-fit">
                    {/* Avatar circle */}
                    <div
                      className="w-20 h-20 rounded-full border-4 border-[#0d1020] overflow-hidden flex items-center justify-center text-white text-2xl font-bold cursor-pointer group"
                      style={avatarUrl ? undefined : { background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                      onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
                    >
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        loaded ? avatarLetter : ""
                      )}
                      {/* hover overlay */}
                      <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {uploadingAvatar
                          ? <Loader2 size={18} className="text-white animate-spin" />
                          : <Camera size={18} className="text-white" />
                        }
                      </div>
                    </div>
                  </div>

                  {loaded && (
                    <div>
                      <p className="text-white font-bold text-lg leading-tight">{displayName || "—"}</p>
                      <p className="text-gray-500 text-sm">@{username || displayName || "—"}</p>
                      {email && <p className="text-gray-600 text-xs mt-0.5">{email}</p>}
                    </div>
                  )}
                </div>
              </div>

              <Section title="Basic Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <input id="username" type="text" value={username || displayName} readOnly className={inputCls + " opacity-60 cursor-not-allowed"} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <input id="email" type="email" value={email} readOnly className={inputCls + " opacity-60 cursor-not-allowed"} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Your city" className={inputCls + " pl-9"} />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="bio">Bio</Label>
                    <span className="text-gray-600 text-xs">Markdown Supported</span>
                  </div>
                  <textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the ecosystem about yourself…" className={inputCls + " resize-none leading-relaxed"} />
                </div>
              </Section>

              <Section title="Social Connections">
                <div className="flex flex-col gap-3">
                  {links.map((link) => <SocialLinkRow key={link.id} link={link} onDelete={removeLink} onChange={updateLink} />)}
                  <button type="button" onClick={addLink} className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors mt-1 w-fit">
                    <Plus size={15} /> Add New Link
                  </button>
                </div>
              </Section>

              <Section title="Privacy Settings">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Public Profile</p>
                      <p className="text-gray-500 text-xs mt-0.5">Allow anyone to view your posts and details.</p>
                    </div>
                    <Toggle enabled={publicProfile} onChange={setPublicProfile} />
                  </div>
                  <div className="h-px bg-white/[0.05]" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Show Online Status</p>
                      <p className="text-gray-500 text-xs mt-0.5">Display your active status to your friends.</p>
                    </div>
                    <Toggle enabled={showOnlineStatus} onChange={setShowOnlineStatus} />
                  </div>
                </div>
              </Section>

              <div className="flex items-center justify-end gap-3">
                <Link href="/profile" className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 border border-white/[0.09] hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200">
                  Cancel
                </Link>
                <button type="button" onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-60 shadow-lg shadow-purple-900/30" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                  {isSaving
                    ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving…</>
                    : <><Save size={15} />Save Changes</>
                  }
                </button>
              </div>

              <div className="rounded-2xl border border-red-500/25 overflow-hidden" style={{ background: "rgba(239,68,68,0.04)" }}>
                <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-300 text-sm font-semibold">Danger Zone</p>
                      <p className="text-gray-500 text-xs mt-0.5">Once you delete your account, there is no going back.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {showDeleteConfirm && (
                      <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 border border-white/[0.09] hover:text-white transition-all">
                        <X size={14} /> Cancel
                      </button>
                    )}
                    <button type="button" onClick={handleDeleteAccount} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${showDeleteConfirm ? "bg-red-600 hover:bg-red-500 text-white" : "border border-red-500/40 text-red-400 hover:bg-red-500/10"}`}>
                      {showDeleteConfirm ? "Confirm Delete" : "Delete Account"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </>
  );
}
