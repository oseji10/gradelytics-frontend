import { Outfit } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";

const outfit = Outfit({
  subsets: ["latin"],
});

export const viewport: Metadata = {
  title: "gradelytics",
  description: "Get paid faster with professional, branded invoices you can send in under 2 minutes.",
  manifest: "/manifest.json",
  themeColor: "#1F6F43",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "gradelytics",
  },
   keywords: [
    "invoice management",
    "billing software Nigeria",
    "billing software Africa",
    "invoice app",
    "receipt generator",
    "business finance tool",
    "online invoice generator for small business",
    "invoice app Africa",
    "create invoice and get paid faster",
    "professional invoice templates"
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* iOS / PWA Support */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
      </head>
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
