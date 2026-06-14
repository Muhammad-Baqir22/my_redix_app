"use client";

import { Image as ImageIcon, Link2 } from "lucide-react";
import Link from "next/link";

export default function CreatePostBox() {
  return (
    <Link
      href="/create-post"
      className="flex items-center gap-3 p-3 rounded-2xl border border-white/[0.07] hover:border-white/[0.12] transition-all duration-200 group"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
      >
        U
      </div>

      {/* Input placeholder */}
      <div className="flex-1 bg-white/[0.04] border border-white/[0.07] group-hover:border-white/15 rounded-xl px-4 py-2.5 text-gray-600 text-sm transition-all duration-200">
        Share something with the ecosystem…
      </div>

      {/* Icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.07] transition-all duration-150">
          <ImageIcon size={16} />
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.07] transition-all duration-150">
          <Link2 size={16} />
        </div>
      </div>
    </Link>
  );
}
