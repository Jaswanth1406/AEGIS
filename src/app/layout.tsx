import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
