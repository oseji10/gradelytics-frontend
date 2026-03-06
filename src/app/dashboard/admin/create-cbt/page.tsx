import CBTDashboardHome from "@/components/tables/AdminCBT";
import CreateExamPage from "@/components/tables/AdminCreateCBTExam";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";


export const metadata: Metadata = {
   title: "Create CBT Exam | Gradelytics",
  description: "Create, send and track manage businesses online.",
  keywords: [
    "create school",
    "online school",
    "school management system for Nigeria",
  ],
};

export default function CBT() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          My Schools
        </h3> */}
        <div className="space-y-6">
          <CreateExamPage />
        </div>
      </div>
    </div>
  );
}
