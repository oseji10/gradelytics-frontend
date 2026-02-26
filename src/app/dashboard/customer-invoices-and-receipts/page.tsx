import { Suspense } from "react";
import { Metadata } from "next";
import CustomerInvoicesAndReceipts from "../../../components/tables/CustomerInvoicesAndReceipts";
export const metadata: Metadata = {
  title: "gradelytics Dashboard",
  description: "Overview of your invoicing platform: invoices, revenue, tenants, and more.",
};
export default function Receipt() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="space-y-6">
          {/* Wrap the table component in Suspense */}
          <Suspense fallback={<div className="py-10 text-center text-gray-500">Loading invoices...</div>}>
            <CustomerInvoicesAndReceipts />
          </Suspense>
        </div>
      </div>
    </div>
  );
}