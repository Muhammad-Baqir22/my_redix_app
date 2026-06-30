"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Send, Phone, Video, MoreVertical,
  Image as ImageIcon, Paperclip, Plus, X,
  MessageSquare, Edit3, Users,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { apiFetch, getCurrentUserId, getToken } from "@/lib/api";
import { ApiResponse } from "@/types/api";

/* ─── Types ─── */
interface ChatUser {
  id: string;
  username: string;
  avatar_url?: string | null;
}
interface Message {
  id: string;
  senderId: string;
  receiverId: string | null;
  content: string;
  createdAt: string;
  sender: ChatUser;
}
interface Conversation {
  partner: ChatUser;
  lastMessage: Message;
}

/* ─── Avatar helper ─── */
function Avatar({ user, size = 10 }: { user: ChatUser; size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
      style={user.avatar_url ? undefined : { background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
    >
      {user.avatar_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
        : user.username[0]?.toUpperCase() ?? "?"
      }
    </div>
  );
}

/* ─── Time helpers ─── */
function formatTime(iso: string) {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
function formatDateDivider(iso: string) {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
function groupByDay(messages: Message[]) {
  const groups: { label: string; messages: Message[] }[] = [];
  let last = "";
  for (const msg of messages) {
    const label = formatDateDivider(msg.createdAt);
    if (label !== last) { groups.push({ label, messages: [msg] }); last = label; }
    else groups[groups.length - 1].messages.push(msg);
  }
  return groups;
}

/* ─── Main page ─── */
export default function MessagesPage() {
  const router = useRouter();

  /* myId must be state so the MQTT effect re-runs once localStorage is available */
  const [myId, setMyId] = useState<string>("");
  useEffect(() => { setMyId(getCurrentUserId() ?? ""); }, []);

  /* conversations */
  const [conversations,  setConversations]  = useState<Conversation[]>([]);
  const [loadingConvs,   setLoadingConvs]   = useState(true);

  /* people I follow / follow me */
  const [knownUsers,     setKnownUsers]     = useState<ChatUser[]>([]);

  /* search */
  const [search,         setSearch]         = useState("");
  const [searchResults,  setSearchResults]  = useState<ChatUser[]>([]);
  const [showDrop,       setShowDrop]       = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  /* active chat */
  const [activePartner,  setActivePartner]  = useState<ChatUser | null>(null);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);

  /* input */
  const [input,          setInput]          = useState("");
  const [sending,        setSending]        = useState(false);

  /* mobile */
  const [showMobileChat, setShowMobileChat] = useState(false);

  const bottomRef        = useRef<HTMLDivElement>(null);
  const inputRef         = useRef<HTMLTextAreaElement>(null);
  const activePartnerRef = useRef<ChatUser | null>(null);
  const pollRef          = useRef<NodeJS.Timeout | null>(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, [router]);

  /* ── Load conversations ── */
  const loadConversations = useCallback(async () => {
    try {
      const res = await apiFetch<ApiResponse<Conversation[]>>("/api/chat/conversations");
      setConversations(res.data ?? []);
    } catch { /* ignore */ }
    finally { setLoadingConvs(false); }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  /* ── Load followers + following → knownUsers ── */
  useEffect(() => {
    Promise.all([
      apiFetch<ApiResponse<any[]>>("/api/users/followers").catch(() => ({ data: [] })),
      apiFetch<ApiResponse<any[]>>("/api/users/userfollow").catch(() => ({ data: [] })),
    ]).then(([followersRes, followingRes]) => {
      const map = new Map<string, ChatUser>();
      for (const entry of (followersRes.data ?? [])) {
        const u = entry.followby;
        if (u && !map.has(u.id)) map.set(u.id, { id: u.id, username: u.username, avatar_url: u.avatar_url });
      }
      for (const entry of (followingRes.data ?? [])) {
        const u = entry.user;
        if (u && !map.has(u.id)) map.set(u.id, { id: u.id, username: u.username, avatar_url: u.avatar_url });
      }
      setKnownUsers(Array.from(map.values()));
    });
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Handle search input ── */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (!val.trim()) { setSearchResults([]); setShowDrop(false); return; }
    const q = val.toLowerCase();
    setSearchResults(knownUsers.filter((u) => u.username.toLowerCase().includes(q)));
    setShowDrop(true);
  };

  const clearSearch = () => { setSearch(""); setSearchResults([]); setShowDrop(false); };

  /* ── Load messages from DB ── */
  const loadMessages = useCallback(async (partnerId: string) => {
    try {
      const res = await apiFetch<ApiResponse<Message[]>>(`/api/chat/history/dm/${partnerId}`);
      setMessages(res.data ?? []);
    } catch { /* ignore */ }
    finally { setLoadingMsgs(false); }
  }, []);

  /* ── Keep ref in sync so MQTT handler can read current partner without stale closure ── */
  useEffect(() => { activePartnerRef.current = activePartner; }, [activePartner]);

  /* ── MQTT real-time (dynamic import avoids SSR issues with the mqtt package) ── */
  useEffect(() => {
    if (!myId) return;
    const token = getToken();
    if (!token) return;
    let mqttUsername = "";
    try { mqttUsername = JSON.parse(atob(token.split(".")[1])).sub ?? ""; }
    catch { return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mqttClient: any;
    import("mqtt").then(({ default: mqttLib }) => {
      const mqttWsUrl = process.env.NEXT_PUBLIC_MQTT_WS_URL ?? "ws://localhost:1883";
      const mqttUser  = process.env.NEXT_PUBLIC_MQTT_USERNAME ?? mqttUsername;
      const mqttPass  = process.env.NEXT_PUBLIC_MQTT_PASSWORD ?? token;
      mqttClient = mqttLib.connect(mqttWsUrl, { username: mqttUser, password: mqttPass });
      mqttClient.on("connect", () => { mqttClient.subscribe(`msg/${myId}/#`); });
      mqttClient.on("message", (_topic: string, payload: Buffer) => {
        try {
          const msg: Message = JSON.parse(payload.toString());
          if (activePartnerRef.current?.id === msg.senderId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
          setConversations((prev) => prev.map((c) =>
            c.partner.id === msg.senderId ? { ...c, lastMessage: msg } : c
          ));
        } catch { /* ignore */ }
      });
    }).catch(() => { /* MQTT unavailable — poll fallback handles it */ });

    return () => { mqttClient?.end(); };
  }, [myId]);

  /* ── 5-second poll fallback (covers cases where MQTT ACL blocks delivery) ── */
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activePartner) return;
    pollRef.current = setInterval(() => loadMessages(activePartner.id), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activePartner, loadMessages]);

  /* ── Scroll to bottom ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Open conversation ── */
  const openConversation = (partner: ChatUser) => {
    setActivePartner(partner);
    setMessages([]);
    setLoadingMsgs(true);
    setShowMobileChat(true);
    clearSearch();
    loadMessages(partner.id);

    setConversations((prev) => {
      if (prev.some((c) => c.partner.id === partner.id)) return prev;
      const placeholder: Message = {
        id: "", senderId: myId, receiverId: partner.id, content: "New conversation",
        createdAt: new Date().toISOString(), sender: { id: myId, username: "", avatar_url: null },
      };
      return [{ partner, lastMessage: placeholder }, ...prev];
    });
  };

  /* ── Send message ── */
  const sendMessage = async () => {
    if (!input.trim() || !activePartner || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    const optimistic: Message = {
      id: `tmp-${Date.now()}`, senderId: myId, receiverId: activePartner.id,
      content, createdAt: new Date().toISOString(),
      sender: { id: myId, username: "me", avatar_url: null },
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await apiFetch<ApiResponse<Message>>("/api/chat/send", {
        method: "POST",
        body: JSON.stringify({ receiver_id: activePartner.id, content }),
      });
      // Reload from DB — replaces the optimistic entry with the confirmed message
      await loadMessages(activePartner.id);
    } catch {
      // Even on HTTP failure the message may be in DB — reload to check
      await loadMessages(activePartner.id);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const messageGroups = groupByDay(messages);

  /* ─── Render ─── */
  return (
    <div className="h-screen overflow-hidden" style={{ background: "#0b0e1a" }}>
      <Navbar />
      <LeftSidebar />

      <div
        className="sidebar-ml flex overflow-hidden"
        style={{ height: "calc(100vh - 56px)", marginTop: "56px" }}
      >
        {/* ══ LEFT PANEL ══ */}
        <div
          className={`w-full md:w-72 flex-shrink-0 flex flex-col border-r border-white/[0.06] ${showMobileChat ? "hidden md:flex" : "flex"}`}
          style={{ background: "#0d1020" }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold text-base">Messages</h2>
              {/* <button
                onClick={() => { clearSearch(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all"
                title="New message"
              >
                <Edit3 size={15} />
              </button> */}
            </div>

            {/* Live search input */}
            <div ref={searchWrapRef} className="relative">
              <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.06] rounded-xl px-3 py-2 focus-within:border-purple-500/50 transition-colors">
                <Search size={14} className="text-gray-500 flex-shrink-0" />
                <input
                  value={search}
                  onChange={handleSearchChange}
                  onFocus={() => { if (search.trim()) setShowDrop(true); }}
                  placeholder="Search followers & following..."
                  className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none"
                />
                {search && (
                  <button onClick={clearSearch} className="text-gray-600 hover:text-gray-300 transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* ── Search dropdown ── */}
              {showDrop && (
                <div
                  className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl border border-white/[0.1] overflow-hidden shadow-xl shadow-black/50 z-40"
                  style={{ background: "#0b0e1a" }}
                >
                  {searchResults.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                      <Users size={20} className="text-gray-700" />
                      <p className="text-gray-500 text-xs">
                        No matches in your followers or following
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
                        <Users size={11} className="text-gray-600" />
                        <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-wider">
                          People you know
                        </span>
                      </div>
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => openConversation(user)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] transition-colors"
                        >
                          <Avatar user={user} size={8} />
                          <div className="text-left min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              u/{user.username}
                            </p>
                          </div>
                          <span className="ml-auto text-gray-600 text-xs flex-shrink-0">Message</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Conversation list (shown when not searching) */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs && (
              <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-white/[0.07] flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-24 h-3 bg-white/[0.07] rounded" />
                      <div className="w-36 h-2.5 bg-white/[0.05] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingConvs && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 px-4 text-center">
                <MessageSquare size={28} className="text-gray-700" />
                <p className="text-gray-500 text-sm">No conversations yet</p>
                <p className="text-gray-600 text-xs">Search for someone above to start chatting</p>
              </div>
            )}

            {!loadingConvs && conversations.map((conv) => {
              const isActive = activePartner?.id === conv.partner.id;
              const isMine   = conv.lastMessage.senderId === myId;
              return (
                <button
                  key={conv.partner.id}
                  onClick={() => openConversation(conv.partner)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-white/[0.03] transition-all ${
                    isActive ? "bg-purple-600/10 border-l-2 border-l-purple-500" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <Avatar user={conv.partner} size={10} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-white text-sm font-semibold truncate">{conv.partner.username}</p>
                      <span className="text-gray-600 text-xs flex-shrink-0 ml-1">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs truncate">
                      {isMine ? "You: " : ""}{conv.lastMessage.content}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div
          className={`flex-1 flex flex-col overflow-hidden ${!showMobileChat ? "hidden md:flex" : "flex"}`}
          style={{ background: "#0b0e1a" }}
        >
          {!activePartner ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
                <MessageSquare size={28} className="text-purple-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg mb-1">Your Messages</p>
                <p className="text-gray-500 text-sm">Search for a follower or following to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0"
                style={{ background: "#0d1020" }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-colors"
                  >
                    ←
                  </button>
                  <div className="relative">
                    <Avatar user={activePartner} size={9} />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#0d1020]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold leading-none">{activePartner.username}</p>
                    <p className="text-green-400 text-[10px] font-semibold mt-0.5 uppercase tracking-wide">Connected</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[Search, Phone, Video, MoreVertical].map((Icon, i) => (
                    <button key={i} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all">
                      <Icon size={15} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {loadingMsgs && (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  </div>
                )}

                {!loadingMsgs && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
                    <Avatar user={activePartner} size={14} />
                    <p className="text-white font-semibold mt-2">u/{activePartner.username}</p>
                    <p className="text-gray-500 text-sm">Send a message to start the conversation</p>
                  </div>
                )}

                {!loadingMsgs && messageGroups.map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">{group.label}</span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    {group.messages.map((msg, idx) => {
                      const isMe       = msg.senderId === myId;
                      const prev       = group.messages[idx - 1];
                      const showAvatar = !isMe && (idx === 0 || prev?.senderId !== msg.senderId);

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"} ${idx > 0 ? "mt-1" : ""}`}
                        >
                          {!isMe && (
                            <div className="w-7 flex-shrink-0">
                              {showAvatar && <Avatar user={msg.sender} size={7} />}
                            </div>
                          )}
                          <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                            {showAvatar && !isMe && (
                              <p className="text-purple-400 text-xs font-semibold mb-1 ml-1">{msg.sender.username}</p>
                            )}
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? "rounded-br-sm text-white" : "rounded-bl-sm text-gray-200"}`}
                              style={isMe
                                ? { background: "linear-gradient(135deg, #7c3aed, #6366f1)" }
                                : { background: "rgba(255,255,255,0.06)" }}
                            >
                              {msg.content}
                            </div>
                            <p className="text-gray-700 text-[10px] mt-0.5 mx-1">
                              {formatTime(msg.createdAt)}
                              {isMe && <span className="ml-1 text-purple-400">✓✓</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div className="flex-shrink-0 px-4 py-3 border-t border-white/[0.06]" style={{ background: "#0d1020" }}>
                <div
                  className="flex items-end gap-2 rounded-2xl border border-white/[0.08] px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-1 pb-0.5">
                    {[Plus, ImageIcon, Paperclip].map((Icon, i) => (
                      <button key={i} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-purple-400 transition-colors">
                        <Icon size={i === 0 ? 16 : 15} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none resize-none max-h-32 leading-relaxed py-1"
                    style={{ scrollbarWidth: "none" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 mb-0.5 transition-all ${input.trim() ? "text-white hover:opacity-90 active:scale-95" : "text-gray-700 cursor-not-allowed"}`}
                    style={input.trim() ? { background: "linear-gradient(135deg, #7c3aed, #6366f1)" } : undefined}
                  >
                    <Send size={14} className={sending ? "opacity-50" : ""} />
                  </button>
                </div>
                <p className="text-gray-700 text-[10px] text-center mt-1.5">
                  Press Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
