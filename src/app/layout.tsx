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
  title: {
    default: "PLIC - 카드로 송금하다 | 신용카드 계좌이체 서비스",
    template: "%s | PLIC",
  },
  description: "현금이나 계좌이체로 지불해야 하는 금액, 신용카드로 편하게 결제하세요. 결제일까지 여유, 원금 100% 송금, 카드 혜택 그대로! B2B 사업자 전용 카드 송금 서비스.",
  keywords: ["PLIC", "플릭", "카드결제", "카드송금", "신용카드 계좌이체", "사업자송금", "법인카드 송금", "B2B 송금", "카드로 송금", "사업자 결제"],
  authors: [{ name: "PLIC", url: "https://www.plic.kr" }],
  creator: "PLIC",
  publisher: "키스톤파트너스",
  metadataBase: new URL("https://www.plic.kr"),
  alternates: {
    canonical: "https://www.plic.kr",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "PLIC - 카드로 송금하다",
    description: "현금이나 계좌이체로 지불해야 하는 금액, 신용카드로 편하게 결제하세요. 원금 100% 송금, 카드 혜택 그대로!",
    type: "website",
    locale: "ko_KR",
    url: "https://www.plic.kr",
    siteName: "PLIC",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "PLIC - 카드로 송금하다",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PLIC - 카드로 송금하다",
    description: "신용카드로 계좌이체. 원금 100% 송금, 카드 혜택 그대로!",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
    other: {
      "naver-site-verification": [process.env.NAVER_SITE_VERIFICATION || ""],
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#2563EB" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
