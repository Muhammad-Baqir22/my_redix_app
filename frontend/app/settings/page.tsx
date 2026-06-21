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
    <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
      <Navbar />

      <div className="flex pt-14">
        <LeftSidebar />

        <main className="flex-1 sidebar-ml px-4 py-6 min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/profile"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all"
              >
                <ArrowLeft size={16} />
              </Link>
              <h1 className="text-white font-bold text-xl">Settings</h1>
            </div>

            {/* Account info */}
            {user && (
              <div
                className="flex items-center gap-3 p-4 rounded-2xl border border-white/[0.07] mb-5"
                style={{ background: "rgba(255,255,255,0.025)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                >
                  {(user.username || user.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{user.username || "—"}</p>
                  <p className="text-gray-500 text-xs truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Settings options */}
            <div className="rounded-2xl border border-white/[0.07] overflow-hidden" style={{ background: "rgba(255,255,255,0.025)" }}>

              <Link
                href="/profile/edit"
                className="flex items-center gap-3 px-4 py-4 hover:bg-white/[0.04] transition-colors border-b border-white/[0.06]"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
                  <UserPen size={15} className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Edit Profile</p>
                  <p className="text-gray-600 text-xs">Update avatar, banner, and info</p>
                </div>
                <ChevronRight size={15} className="text-gray-600" />
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                  <LogOut size={15} className="text-red-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-red-400 text-sm font-medium">Log out</p>
                  <p className="text-gray-600 text-xs">Sign out of your account</p>
                </div>
              </button>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
