import type { Metadata } from "next";
import { Syne, Space_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "AEGIS AI — Autonomous Cyber-Immune Platform",
  description: "AEGIS AI learns what normal looks like in your network, detects anything that isn't — and neutralizes threats automatically before a human even has to react.",
  keywords: ["cybersecurity", "AI", "threat detection", "autonomous defense", "AEGIS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${spaceMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
