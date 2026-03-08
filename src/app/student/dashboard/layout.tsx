// app/(result-checker)/layout.tsx
"use client";

import StudentAppHeader from "@/components/ecommerce/StudentHeader";
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student/school-info`, {
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
          name: data?.school?.schoolName || "Your School",
          logoUrl: data?.school?.schoolLogo
            ? `${process.env.NEXT_PUBLIC_FILE_URL}${data?.school?.schoolLogo}`
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
      <StudentAppHeader
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