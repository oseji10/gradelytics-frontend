import { Suspense } from "react";
import { Metadata } from "next";
import CustomersPage from "../../../components/tables/Customers";
export const metadata: Metadata = {
  title: "Customer | Customer Manager",
  description: "Create customers, send customized emails and texts while generating invoices.",
  keywords: [
    "create customer",
    "create invoice",
    "online invoicing",
    "send invoice Nigeria",
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
            <CustomersPage />
          </Suspense>
        </div>
      </div>
    </div>
  );
}