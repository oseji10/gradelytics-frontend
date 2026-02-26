import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";


import AdminInvoices from "@/components/tables/AdminInvoices";
import ClassesPage from "@/components/tables/AdminClasses";
import AdminParents from "@/components/tables/AdminParents";

export const metadata: Metadata = {
  title: "Parents | Parents Manager",
  description: "Create, manage, and track student parents",
  keywords: [
    "manage parents",
    "online school management system",
    "school management system",
  ],
};

export default function Parents() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
     
        <div className="space-y-6">
          <AdminParents />
        </div>
      </div>
    </div>
  );
}

