import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";

import ReceiptsPage from "../../../components/tables/Receipts";
import SupportPage from "@/components/ecommerce/Support";

export const metadata: Metadata = {
   title: "Customer Support | gradelytics",
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
    <div className="w-full min-h-screen">
      <div className="w-full rounded-none border-none bg-white dark:bg-white/[0.03] p-0">
        <SupportPage />
      </div>
    </div>
  );
}
