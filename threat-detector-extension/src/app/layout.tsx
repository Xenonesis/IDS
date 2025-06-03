import type { Metadata } from "next";
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
  title: "AI-Powered Threat Detector | Advanced Browser Security Extension",
  description: "Protect yourself from online threats with our advanced browser extension that uses AI and threat intelligence APIs to detect phishing, malware, and suspicious behavior in real-time.",
  keywords: ["cybersecurity", "threat detection", "browser extension", "phishing protection", "malware detection", "AI security"],
  authors: [{ name: "Threat Detector Team" }],
  creator: "Threat Detector",
  publisher: "Threat Detector",
  robots: "index, follow",
  openGraph: {
    title: "AI-Powered Threat Detector",
    description: "Advanced browser security extension with AI-powered threat detection",
    type: "website",
    siteName: "AI-Powered Threat Detector",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Powered Threat Detector",
    description: "Advanced browser security extension with AI-powered threat detection",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#dc2626",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
