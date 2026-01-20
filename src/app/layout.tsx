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
  title: "PLIC - 카드로 결제, 계좌로 송금",
  description: "카드 매입대금 정산대행 서비스. 카드 한도만큼 현금 즉시 송금, 분할결제부터 포인트 적립까지!",
  keywords: ["PLIC", "카드결제", "송금", "정산대행", "분할결제"],
  authors: [{ name: "PLIC" }],
  openGraph: {
    title: "PLIC - 카드로 결제, 계좌로 송금",
    description: "카드 매입대금 정산대행 서비스",
    type: "website",
    locale: "ko_KR",
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
        <meta name="theme-color" content="#ed843d" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
