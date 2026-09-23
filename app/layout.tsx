import type { Metadata, Viewport } from "next";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/public-sans/700.css";
import "./globals.css";
import { OfflineBanner } from "@/components/offline-banner";
import { Onboarding } from "@/components/onboarding";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "Sabi · Realtime Road Safety Intelligence",
  description: "Know what's known about the road ahead, with live honesty-decaying confidence.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#f7f8fa]">
      <body className="min-h-screen bg-[#f7f8fa] text-[#111827] antialiased selection:bg-black selection:text-white">
        <OfflineBanner />
        <Onboarding />
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-28 pt-3 sm:px-5">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
