import { Suspense } from "react";
import { Metadata } from "next";
import PlansPage from "@/components/ecommerce/Plans";
export const metadata: Metadata = {
  title: "Plans | gradelytics",
  description: "Manage plans, upgrade to higher plans and enjoy unlimited offers.",
  keywords: [
    "manage plans",
    "invoice plans",
    "send invoice Africa",
    "invoice tracking",
  ],
};
export default function Receipt() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="space-y-6">
          {/* Wrap the table component in Suspense */}
          <Suspense fallback={<div className="py-10 text-center text-gray-500">Loading invoices...</div>}>
            <PlansPage />
          </Suspense>
        </div>
      </div>
    </div>
  );
}