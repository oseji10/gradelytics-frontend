import AdminSettingsPage from "@/components/admin/Settings";
import SchoolSettings from "@/components/tables/AdminSchoolSettings";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Gradelytics Settings",
  description: "Overview of your school management system.",
};


export default function Setting() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="space-y-6">
          <SchoolSettings />
          {/* <UserAddressCard /> */}
        </div>
      </div>
    </div>
  );
}
