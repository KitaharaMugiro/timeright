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
  title: {
    default: "Dine Tokyo（ダイントーキョー）｜初対面の男女4-6人とディナーができるアプリ",
    template: "%s | Dine Tokyo",
  },
  description:
    "人生を動かすのは偶然の出会いだ。「はじめまして」に会いに行こう。",
  applicationName: "Dine Tokyo",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Dine Tokyo（ダイントーキョー）",
    description:
      "初対面の男女4-6人とディナーができるアプリ。人生を動かすのは偶然の出会いだ。「はじめまして」に会いに行こう。",
    siteName: "Dine Tokyo",
    url: "https://dine-tokyo.vercel.app/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dine Tokyo（ダイントーキョー）",
    description:
      "初対面の男女4-6人とディナーができるアプリ。人生を動かすのは偶然の出会いだ。「はじめまして」に会いに行こう。",
  },
  verification: {
    google: "nCQXz1fhJHjeKkxo7U2qJDwl1COf_hqg2d0VZyFZUSg",
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
    <html lang="ja" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Dine Tokyo",
              alternateName: "ダイントーキョー",
              url: "https://dine-tokyo.vercel.app/",
            }),
          }}
        />
      </head>
      <body
        className={`${shipporiMincho.variable} ${notoSansJP.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
