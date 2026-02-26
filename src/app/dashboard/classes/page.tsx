import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";
import AddCompanyPage from "../../../components/ecommerce/CreateTenant";
import CompaniesListPage from "../../../components/tables/Tenants";
import InvoicesPage from "../../../components/tables/Invoices";
import ClassesPage from "@/components/tables/AdminClasses";

export const metadata: Metadata = {
  title: "Classes | Classes Manager",
  description: "Create, manage, send and track invoices online.",
  keywords: [
    "create class",
    "online school software",
    "school management system",
  ],
};

export default function Classes() {
  return (
    <div className="mx-0">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <ClassesPage />
      </div>
    </div>
  );
}
