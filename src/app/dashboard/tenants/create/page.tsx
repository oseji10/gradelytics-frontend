import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";
import AddCompanyPage from "../../../../components/ecommerce/CreateTenant";

export const metadata: Metadata = {
  title: "gradelytics Dashboard",
  description: "Overview of your invoicing platform: invoices, revenue, tenants, and more.",
};

export default function CreateTenant() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Create New Business
        </h3>
        <div className="space-y-6">
          <AddCompanyPage />
        </div>
      </div>
    </div>
  );
}
