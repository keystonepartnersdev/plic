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
    default: "플릭(PLIC) - 카드로 송금하다 | 카드결제 송금 서비스",
    template: "%s | 플릭 PLIC",
  },
  description: "플릭(PLIC) - 현금이나 계좌이체로 지불해야 하는 금액, 신용카드로 편하게 결제하세요. 결제일까지 여유, 원금 100% 송금, 카드 혜택 그대로! B2B 사업자 전용 카드 송금 서비스.",
  keywords: ["플릭", "PLIC", "plic.kr", "카드결제 송금", "카드송금", "신용카드 계좌이체", "사업자송금", "법인카드 송금", "B2B 송금", "카드로 송금", "사업자 결제", "플릭 카드송금", "플릭 서비스"],
  authors: [{ name: "플릭 PLIC", url: "https://www.plic.kr" }],
  creator: "플릭 PLIC",
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
    title: "플릭(PLIC) - 카드로 송금하다",
    description: "플릭(PLIC) - 현금이나 계좌이체로 지불해야 하는 금액, 신용카드로 편하게 결제하세요. 원금 100% 송금, 카드 혜택 그대로!",
    type: "website",
    locale: "ko_KR",
    url: "https://www.plic.kr",
    siteName: "플릭 PLIC",
    images: [
      {
        url: "https://www.plic.kr/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "플릭(PLIC) - 카드로 송금하다",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "플릭(PLIC) - 카드로 송금하다",
    description: "플릭(PLIC) 카드결제로 송금. 원금 100% 송금, 카드 혜택 그대로!",
    images: ["https://www.plic.kr/images/og-image.png"],
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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.plic.kr/#organization",
      name: "플릭 PLIC",
      alternateName: ["플릭", "PLIC", "plic"],
      url: "https://www.plic.kr",
      logo: {
        "@type": "ImageObject",
        url: "https://www.plic.kr/favicon.svg",
      },
      description: "카드결제 송금 서비스 플릭(PLIC). 신용카드로 계좌이체, 사업자 B2B 송금 서비스.",
      foundingLocation: "대한민국",
      sameAs: ["https://www.plic.kr"],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.plic.kr/#website",
      url: "https://www.plic.kr",
      name: "플릭 PLIC",
      alternateName: "플릭",
      description: "플릭(PLIC) - 카드로 송금하다. 신용카드 계좌이체 B2B 사업자 카드 송금 서비스.",
      publisher: {
        "@id": "https://www.plic.kr/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://www.plic.kr/?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
      inLanguage: "ko-KR",
    },
    {
      "@type": "WebPage",
      "@id": "https://www.plic.kr/#webpage",
      url: "https://www.plic.kr",
      name: "플릭(PLIC) - 카드로 송금하다",
      isPartOf: {
        "@id": "https://www.plic.kr/#website",
      },
      about: {
        "@id": "https://www.plic.kr/#organization",
      },
      description: "플릭(PLIC) - 현금이나 계좌이체로 지불해야 하는 금액, 신용카드로 편하게 결제하세요.",
      inLanguage: "ko-KR",
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
