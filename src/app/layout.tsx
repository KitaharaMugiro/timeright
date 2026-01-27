import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";

const shipporiMincho = Shippori_Mincho({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
        className={`${shipporiMincho.variable} ${notoSansJP.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
