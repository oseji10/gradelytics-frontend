// import { Outfit } from "next/font/google";
// import type { Metadata } from "next";
// import "../../globals.css";

// import { SidebarProvider } from "@/context/SidebarContext";
// import { ThemeProvider } from "@/context/ThemeContext";

// const outfit = Outfit({
//   subsets: ["latin"],
// });

// export const viewport: Metadata = {
//   title: "gradelytics",
//   description: "Get paid faster with professional, branded invoices you can send in under 2 minutes.",
//   manifest: "/manifest.json",
//   themeColor: "#1F6F43",
//   appleWebApp: {
//     capable: true,
//     statusBarStyle: "default",
//     title: "gradelytics",
//   },
//    keywords: [
//     "invoice management",
//     "billing software Nigeria",
//     "billing software Africa",
//     "invoice app",
//     "receipt generator",
//     "business finance tool",
//     "online invoice generator for small business",
//     "invoice app Africa",
//     "create invoice and get paid faster",
//     "professional invoice templates"
//   ],
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <head>
//         {/* iOS / PWA Support */}
//         <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
//         <meta name="apple-mobile-web-app-capable" content="yes" />
//         <meta
//           name="apple-mobile-web-app-status-bar-style"
//           content="default"
//         />
//       </head>
//       <body className={`${outfit.className} dark:bg-gray-900`}>
//         {/* <ThemeProvider> */}
//           <SidebarProvider>
//             {children}
//             </SidebarProvider>
//         {/* </ThemeProvider> */}
//       </body>
//     </html>
//   );
// }


// app/(result-checker)/layout.tsx
"use client";

import AppHeader from "@/components/ecommerce/ParentHeader";
import { ReactNode, useEffect, useState } from "react";
// import AppHeader from "@/components/layout/AppHeader"; // adjust path to where you put it

// You can reuse the same types as in your dashboard
interface SchoolInfo {
  name: string;
  logoUrl?: string | null;
}

export default function ResultCheckerLayout({ children }: { children: ReactNode }) {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/result-checker`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          // You could redirect or show error UI here if needed
          console.warn("Could not load school info", res.status);
          setSchoolInfo({ name: "Your School" });
          return;
        }

        const data = await res.json();
        console.log("Fetched school info:", data.schoolLogo);
        setSchoolInfo({
          name: data.schoolName || "Your School",
          logoUrl: data.schoolLogo
            ? `${process.env.NEXT_PUBLIC_FILE_URL}${data.schoolLogo}`
            : null,
        });
      } catch (err) {
        console.error("School info fetch failed:", err);
        setSchoolInfo({ name: "Your School" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolData();
  }, []);

  return (
    <>
      <AppHeader
        schoolName={schoolInfo?.name}
        logoUrl={schoolInfo?.logoUrl}
        // Optional: disable logout on some sub-pages if needed
        // showLogout={someCondition}
      />

      {/* 
        Optional: show a small loading state only for the header part
        (the rest of the page can still render via Suspense or own loading.tsx)
      */}
      {isLoading ? (
        <div className="h-16 bg-white border-b animate-pulse" aria-hidden="true" />
      ) : null}

      {children}
    </>
  );
}