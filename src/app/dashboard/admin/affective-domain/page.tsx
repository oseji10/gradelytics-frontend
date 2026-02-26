import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";

import AdminSchools from "@/components/tables/AdminSchools";
import MarkAttendance from "@/components/tables/AdminAttendance";
import AffectiveDomainEntry from "@/components/tables/AdminAffectiveDomain";

export const metadata: Metadata = {
   title: "Affective Domain | Domain Manager",
  description: "Create and manage affective domains.",
  keywords: [
    "create school",
    "online school",
    "school management system for Nigeria",
  ],
};

export default function AffectiveDomain() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          My Schools
        </h3> */}
        <div className="space-y-6">
          <AffectiveDomainEntry />
        </div>
      </div>
    </div>
  );
}
