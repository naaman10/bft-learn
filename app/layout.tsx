import type { Metadata } from "next";
import { National_Park } from "next/font/google";
import "./globals.css";

const nationalPark = National_Park({
  subsets: ["latin"],
  variable: "--font-national-park",
  adjustFontFallback: false,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "BFT Learn",
  description: "Learning portal for BFT tuition students",
  icons: {
    icon: [
      { url: "/favicons/favicon.ico", sizes: "any" },
      {
        url: "/favicons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/favicons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/favicons/site.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nationalPark.variable} ${nationalPark.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
