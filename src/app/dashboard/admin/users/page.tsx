import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";

import AdminUsersPage from "@/components/ecommerce/Users";

export const metadata: Metadata = {
  title: "Users | Users Manager",
  description: "Create, manage, send and track invoices online.",
  keywords: [
    "manage invoice users",
  ],
};

export default function Users() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
     
        <div className="space-y-6">
          <AdminUsersPage />
        </div>
      </div>
    </div>
  );
}

