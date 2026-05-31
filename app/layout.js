import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PushProvider from "./components/PushProvider";
import ThemeProvider from "./components/ThemeProvider";
import ToastProvider from "./components/ToastProvider";
import InstallPrompt from "./components/InstallPrompt";
import UpdatePrompt from "./components/UpdatePrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
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
  manifest: "/manifest.json",
  themeColor: "#0D1117",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MatrixVerse",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("matrixverse-theme");if(!t||(t!=="dark"&&t!=="light"))t="dark";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`
        }} />
      </head>
      <body className="min-h-full flex flex-col"><ThemeProvider><ToastProvider><PushProvider>{children}<InstallPrompt /><UpdatePrompt /></PushProvider></ToastProvider></ThemeProvider></body>
    </html>
  );
}
