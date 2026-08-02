"use client";

import { Image as ImageIcon, Link2 } from "lucide-react";
import Link from "next/link";

export default function CreatePostBox() {
  return (
    <Link
      href="/create-post"
      className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] transition-all duration-200 group"
      style={{ background: "var(--bg-card)" }}
    >
      {/* Input placeholder */}
      <div className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] group-hover:opacity-80 rounded-xl px-4 py-2.5 text-[var(--text-3)] text-sm transition-all duration-200">
        Share something with the ecosystem…
      </div>

      {/* Icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-all duration-150">
          <ImageIcon size={16} />
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-all duration-150">
          <Link2 size={16} />
        </div>
      </div>
    </Link>
  );
}
