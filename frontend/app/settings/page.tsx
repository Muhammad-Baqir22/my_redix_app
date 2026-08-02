"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, UserPen, ChevronRight, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { getCurrentUser, getToken } from "@/lib/api";
import { useEffect } from "react";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push("/login");
  };

  const user = getCurrentUser();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />

      <div className="flex pt-14">
        <LeftSidebar />

        <main className="flex-1 sidebar-ml px-4 py-6 min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/profile"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-all"
              >
                <ArrowLeft size={16} />
              </Link>
              <h1 className="text-[var(--text-1)] font-bold text-xl">Settings</h1>
            </div>

            {/* Account info */}
            {user && (
              <div
                className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] mb-5"
                style={{ background: "var(--bg-card)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                >
                  {(user.username || user.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[var(--text-1)] font-semibold text-sm truncate">{user.username || "—"}</p>
                  <p className="text-[var(--text-3)] text-xs truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Settings options */}
            <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: "var(--bg-card)" }}>

              <Link
                href="/profile/edit"
                className="flex items-center gap-3 px-4 py-4 hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border)]"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
                  <UserPen size={15} className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[var(--text-1)] text-sm font-medium">Edit Profile</p>
                  <p className="text-[var(--text-3)] text-xs">Update avatar, banner, and info</p>
                </div>
                <ChevronRight size={15} className="text-[var(--text-3)]" />
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                  <LogOut size={15} className="text-red-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-red-400 text-sm font-medium">Log out</p>
                  <p className="text-[var(--text-3)] text-xs">Sign out of your account</p>
                </div>
              </button>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
