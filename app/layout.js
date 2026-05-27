import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PushProvider from "./components/PushProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "MatrixVerse — Track. Improve. Dominate the Markets.",
    template: "%s | MatrixVerse",
  },
  description:
    "MatrixVerse is the all-in-one platform for serious traders. Trading journal, AI analysis, community feed, leaderboard, prop firm tracker and psychology tools — all in one place.",
  keywords: [
    "forex trading journal",
    "trading journal app",
    "AI trade analyzer",
    "prop firm tracker",
    "forex community",
    "trading psychology",
    "FTMO challenge tracker",
    "forex leaderboard",
    "SMC trading",
    "ICT trading",
    "funded trader",
  ],
  authors: [{ name: "MatrixVerse" }],
  creator: "MatrixVerse",
  metadataBase: new URL("https://matrixverse.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://matrixverse.vercel.app",
    siteName: "MatrixVerse",
    title: "MatrixVerse — Track. Improve. Dominate the Markets.",
    description:
      "The all-in-one trading platform. Journal your trades, get AI feedback, connect with traders, and climb the leaderboard.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MatrixVerse Trading Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MatrixVerse — Track. Improve. Dominate the Markets.",
    description:
      "The all-in-one trading platform. Journal, AI analysis, community and leaderboard.",
    images: ["/og-image.png"],
    creator: "@matrixverse",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><PushProvider>{children}</PushProvider></body>
    </html>
  );
}
