import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";

import MySubscriptionsPage from "@/components/tables/MySubscriptions";

export const metadata: Metadata = {
  title: "My Subscriptions | Subscription Manager",
  description: "Create, manage, send and track invoices online.",
  keywords: [
    "manage invoice subscribers",
    "online invoicing",
    "send invoice Nigeria",
    "invoice tracking",
  ],
};

export default function Subscribers() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
     
        <div className="space-y-6">
          <MySubscriptionsPage />
        </div>
      </div>
    </div>
  );
}

