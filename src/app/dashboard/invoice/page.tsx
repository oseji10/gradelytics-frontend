import { Suspense } from "react";
import InvoiceViewPage from "../../../components/tables/Invoice";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generated Invoice | Invoice Manager",
  description: "Create, send and track invoices online.",
  keywords: [
    "create invoice",
    "online invoicing",
    "send invoice Nigeria",
    "invoice tracking",
  ],
};

export default function Invoices() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Removed padding */}
        <Suspense fallback={<div className="py-10 text-center text-gray-500">Loading invoices...</div>}>
          <InvoiceViewPage />
        </Suspense>
      </div>
    </div>
  );
}
