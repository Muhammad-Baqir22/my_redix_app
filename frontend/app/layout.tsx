import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MobileNav from "@/components/layout/MobileNav";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RediX — The next generation Reddit experience",
  description: "Join the ecosystem and start exploring communities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        {/* Apply saved theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("theme")||"dark";document.documentElement.classList.toggle("dark",t==="dark");}catch(e){}})();` }} />
      </head>
      <body className="min-h-full flex flex-col pb-16 md:pb-0">
        <ThemeProvider>
          {children}
          <MobileNav />
          <Toaster position="top-center" theme="dark" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
