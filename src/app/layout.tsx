import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, Noto_Sans_JP, Inter } from "next/font/google";
import Script from "next/script";
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
    images: [
      {
        url: "https://dine-tokyo.vercel.app/twitter_card_cat_1200x630.png",
        width: 1200,
        height: 630,
        alt: "Dine Tokyo - 初対面の男女4-6人とディナーができるアプリ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dine Tokyo（ダイントーキョー）",
    description:
      "初対面の男女4-6人とディナーができるアプリ。人生を動かすのは偶然の出会いだ。「はじめまして」に会いに行こう。",
    images: ["https://dine-tokyo.vercel.app/twitter_card_cat_1200x630.png"],
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
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3T97L1CLJJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3T97L1CLJJ');
          `}
        </Script>
        {/* Facebook Pixel */}
        <Script id="facebook-pixel" strategy="lazyOnload">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1099337492317945');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1099337492317945&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}
