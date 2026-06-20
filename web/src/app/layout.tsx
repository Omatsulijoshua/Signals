import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signals Pro — Premium Trading Signals & Analytics Platform",
  description: "Get real-time Forex and Crypto trading signals, powered by smart market analytics and AI performance tracking. Double your win rate today.",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#060814] text-[#f8fafc] antialiased">
        {children}
      </body>
    </html>
  );
}
