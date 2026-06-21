"use client";

import { useEffect, useState } from "react";
import { Bell, UserPlus, ArrowUp, MessageSquare, Mail, Check } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { apiFetch } from "@/lib/api";
import { ApiResponse } from "@/types/api";

interface Notification {
  id: string;
  type: "follow" | "like" | "comment" | "message" | string;
  message: string;
  Read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotifIcon({ type }: { type: string }) {
  const base = "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0";
  if (type === "follow") {
    return (
      <div className={base} style={{ background: "rgba(124,58,237,0.15)" }}>
        <UserPlus size={17} className="text-purple-400" />
      </div>
    );
  }
  if (type === "like") {
    return (
      <div className={base} style={{ background: "rgba(239,68,68,0.12)" }}>
        <ArrowUp size={17} className="text-red-400" />
      </div>
    );
  }
  if (type === "comment") {
    return (
      <div className={base} style={{ background: "rgba(59,130,246,0.12)" }}>
        <MessageSquare size={17} className="text-blue-400" />
      </div>
    );
  }
  if (type === "message") {
    return (
      <div className={base} style={{ background: "rgba(16,185,129,0.12)" }}>
        <Mail size={17} className="text-emerald-400" />
      </div>
    );
  }
  return (
    <div className={base} style={{ background: "rgba(255,255,255,0.06)" }}>
      <Bell size={17} className="text-gray-400" />
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    apiFetch<ApiResponse<Notification[]>>("/api/notification/")
      .then((r) => setNotifications(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    const t = setTimeout(() => {
      apiFetch("/api/notification/mark-read", { method: "PATCH" }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const markAllRead = () => {
    setMarkingRead(true);
    apiFetch("/api/notification/mark-read", { method: "PATCH" })
      .then(() => setNotifications((prev) => prev.map((n) => ({ ...n, Read: true }))))
      .catch(() => {})
      .finally(() => setMarkingRead(false));
  };

  const unreadCount = notifications.filter((n) => !n.Read).length;

  return (
    <div className="min-h-screen" style={{ background: "#0b0e1a", color: "#fff" }}>
      <Navbar />
      <div className="flex pt-14">
        <LeftSidebar />
        <main className="flex-1 sidebar-ml min-h-screen">
          <div className="max-w-2xl mx-auto px-4 py-8 w-full">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                >
                  <Bell size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Notifications</h1>
                  {unreadCount > 0 && (
                    <p className="text-xs text-purple-400">{unreadCount} unread</p>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={markingRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all duration-150 disabled:opacity-50"
                >
                  <Check size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              </div>
            )}

            {/* Empty */}
            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <Bell size={28} className="text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            )}

            {/* List */}
            {!loading && notifications.length > 0 && (
              <div
                className="rounded-2xl border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06]"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]"
                    style={!notif.Read ? { background: "rgba(124,58,237,0.05)" } : undefined}
                  >
                    <NotifIcon type={notif.type} />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-relaxed ${
                          notif.Read ? "text-gray-300" : "text-white font-medium"
                        }`}
                      >
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {timeAgo(notif.created_at)}
                      </p>
                    </div>
                    {!notif.Read && (
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
