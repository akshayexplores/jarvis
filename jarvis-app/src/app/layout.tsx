import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jarvis — Personal OS",
  description: "A workspace that remembers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <span className="logo">◉ Jarvis</span>
          <Link href="/">Daily Brief</Link>
          <Link href="/ask">Ask Jarvis</Link>
          <Link href="/finance">Financial Pulse</Link>
          <Link href="/capture">Capture</Link>
          <Link href="/memory">Me