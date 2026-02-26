import AdminStudents from "@/components/tables/AdminStudents";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";


export const metadata: Metadata = {
  title: "Students | Students Manager",
  description: "Create, manage, and track students",
  keywords: [
    "manage students",
    "online school management system",
    "school management system",
  ],
};

export default function Students() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
     
        <div className="space-y-6">
          <AdminStudents />
        </div>
      </div>
    </div>
  );
}

