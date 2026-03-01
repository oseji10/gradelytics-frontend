import BroadSheet from "@/components/tables/Broadsheet";

import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Gradelytics Dashboard",
  description: "Overview of your invoicing platform: invoices, revenue, tenants, and more.",
};


export default function BroadsheetPage() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Broadsheet Report
        </h3>
        <div className="space-y-6">
          <BroadSheet />
        </div>
      </div>
    </div>
  );
}
