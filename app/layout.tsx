import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Amr Moussa — QA Engineering, Automation & AI",
    template: "%s · Amr Moussa",
  },
  description:
    "Amr Moussa, Senior QA Engineer and Test Automation Lead. Original, practical writing on QA engineering, Playwright, performance testing, and AI-powered testing.",
  openGraph: {
    type: "website",
    siteName: "Amr Moussa",
    title: "Amr Moussa — QA Engineering, Automation & AI",
    description:
      "Original, practical writing on QA engineering, Playwright, performance testing, and AI-powered testing.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@amro_kaza",
  },
};

const themeInit = `(function(){try{var t=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='dark'||(!t&&m);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${newsreader.variable} ${inter.variable} ${jetbrains.variable}`}>
        <div className="flex min-h-dvh flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
