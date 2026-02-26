import { Suspense } from "react";
import { Metadata } from "next";
import ReceiptViewPage from "../../../components/tables/Receipt";

export const metadata: Metadata = {
  title: "Receipt | Receipt Manager",
  description: "Create, send and track receipts online.",
  keywords: [
    "create receipt",
    "online receipts",
    "send receipt Nigeria",
    "send receipt Africa",
    "receipt tracking",
  ],
};

export default function Receipt() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="space-y-6">
          {/* Wrap the table component in Suspense */}
          <Suspense fallback={<div className="py-10 text-center text-gray-500">Loading invoices...</div>}>
            <ReceiptViewPage />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
