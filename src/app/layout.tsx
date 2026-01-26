import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "unplanned - 目的のない出会いを、友達と。",
  description: "4-6人のソーシャルディナーで、新しい出会いを楽しむ。月額1,980円で参加し放題。",
  openGraph: {
    title: "unplanned - 目的のない出会いを、友達と。",
    description: "4-6人のソーシャルディナーで、新しい出会いを楽しむ。月額1,980円で参加し放題。",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
