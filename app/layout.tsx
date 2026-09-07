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
