import ExamBuilderPage from "@/components/tables/ExamBuilder";
import { Metadata } from "next";
import React from "react";


export const metadata: Metadata = {
   title: "Exam Builder | Gradelytics",
  description: "Create, send and track manage businesses online.",
  keywords: [
    "create school",
    "online school",
    "school management system for Nigeria",
  ],
};

export default function ExamBuilder() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          My Schools
        </h3> */}
        <div className="space-y-6">
          <ExamBuilderPage />
        </div>
      </div>
    </div>
  );
}
