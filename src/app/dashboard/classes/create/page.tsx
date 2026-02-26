import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";
import CreateInvoicePage from "../../../../components/ecommerce/CreateInvoice";

export const metadata: Metadata = {
  title: "Create Invoice | Invoice Manager",
  description: "Create, send and track invoices online.",
  keywords: [
    "create invoice",
    "online invoicing",
    "send invoice Nigeria",
    "invoice tracking",
  ],
};

export default function CreateInvoice() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Create Invoices
        </h3>
        <div className="space-y-6">
          <CreateInvoicePage />
        </div>
      </div>
    </div>
  );
}
