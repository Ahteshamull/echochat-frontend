import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppInitializer from "@/components/AppInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EchoChat - Premium Real-Time Chat App",
  description: "Experience lightning-fast 1-to-1 and group messaging with rich aesthetics and real-time Socket.io synchronizations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark-theme`}
    >
      <body className="min-h-full flex flex-col bg-bg-midnight text-white custom-scrollbar antialiased">
        <AppInitializer>
          {children}
        </AppInitializer>
      </body>
    </html>
  );
}
