"use client";

import { Mail, MessageCircle, FileText, ChevronDown } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { useState } from "react";

const FAQS = [
  {
    q: "How do I create a post?",
    a: "Click the 'Create Post' button on the home page or navigate to any community and use the post form at the top.",
  },
  {
    q: "How do I join a community?",
    a: "Go to the Communities page from the sidebar, browse available communities, and click the Join button.",
  },
  {
    q: "How do I send a message?",
    a: "Click on a user's profile and use the message button, or go to Messages from the sidebar to start a conversation.",
  },
  {
    q: "How do I edit my profile?",
    a: "Go to Profile from the sidebar, then click 'Edit Profile' to update your username, avatar, and bio.",
  },
  {
    q: "How do I report an issue?",
    a: "Send us an email at the address below and we'll get back to you as soon as possible.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl border border-white/[0.07] overflow-hidden"
      style={{ background: "rgba(255,255,255,0.025)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-white font-medium text-sm">{q}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-gray-400 text-sm border-t border-white/[0.05] pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0b0e1a" }}>
      <Navbar />
      <div className="flex pt-14">
        <LeftSidebar />
        <main className="flex-1 sidebar-ml px-4 py-8 min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-2xl mx-auto">

            <div className="mb-8 flex items-center gap-3">
              <MessageCircle size={20} className="text-purple-400" />
              <h1 className="text-white font-bold text-2xl">Help & Support</h1>
            </div>

            {/* Contact card */}
            <div
              className="rounded-2xl border border-purple-500/20 p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              style={{ background: "rgba(124,58,237,0.08)" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                <Mail size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm mb-1">Contact Support</p>
                <p className="text-gray-400 text-sm mb-2">
                  Have a question or found a bug? Reach out and we'll respond as soon as possible.
                </p>
                <a
                  href="mailto:bakaransari686@gmail.com"
                  className="text-purple-400 hover:text-purple-300 font-medium text-sm transition-colors"
                >
                  bakaransari686@gmail.com
                </a>
              </div>
            </div>

            {/* FAQ */}
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-gray-400" />
              <h2 className="text-white font-semibold text-base">Frequently Asked Questions</h2>
            </div>
            <div className="flex flex-col gap-3">
              {FAQS.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
