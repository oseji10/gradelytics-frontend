import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";


import CbtMonitorPage from "@/components/tables/AdminCBTMonitor";

export const metadata: Metadata = {
  title: "CBT Monitor | Gradelytics - The powerful school management platform that helps schools automate results, manage students and teachers, and gain real-time academic insights — all in one smart system.",
  description: "Create, manage, send and track invoices online.",
  keywords: [
    "manage classes",
    "online school management system",
    "school management system",
  ],
};

export default function Invoices() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
     
        <div className="space-y-6">
          <CbtMonitorPage />
        </div>
      </div>
    </div>
  );
}

