import { Metadata } from "next";
import React from "react";
import StudentExamReviewPage from "@/components/tables/StudentCBTReview";

export const metadata: Metadata = {
   title: "Exam Review | Gradelytics - The powerful school management platform that helps schools automate results, manage students and teachers, and gain real-time academic insights — all in one smart system.",
  description: "Create and manage affective domains.",
  keywords: [
    "create school",
    "online school",
    "school management system for Nigeria",
  ],
};

export default function CBTSubmittedPage() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          My Schools
        </h3> */}
        <div className="space-y-6">
          < StudentExamReviewPage/>
        </div>
      </div>
    </div>
  );
}
