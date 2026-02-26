import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";

import ReceiptsPage from "../../../components/tables/Receipts";

export const metadata: Metadata = {
  title: "Receipts | Receipt Manager",
  description: "Create, send and track receipts online.",
  keywords: [
    "create receipt",
    "online receipts",
    "send receipt Nigeria",
    "send receipt Africa",
    "receipt tracking",
  ],
};

export default function Invoices() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="space-y-6">
          <ReceiptsPage />
        </div>
      </div>
    </div>
  );
}
