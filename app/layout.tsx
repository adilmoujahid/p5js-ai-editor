import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "p5.js AI Editor",
  description: "AI-powered p5.js code editor with real-time preview and WebSocket connectivity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background min-h-screen">{children}</body>
    </html>
  );
}
