// components/dashboard/RecentInvoices.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";

interface Invoice {
  invoiceId: string;
  userGeneratedInvoiceId?: string | null;
  customerName?: string;
  accountName?: string;
  totalAmount: string | number;
  balanceDue?: string | number;
  status: string;
  invoiceDate: string;
  currency_detail: {
    currencySymbol: string;
  };
  customer?: {
    customerName: string;
  };
}

export default function RecentInvoices() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecentInvoices = async () => {
      setLoading(true);
      try {
        const response = await api.get('/invoices/latest');
        
        if (response.status === 200) {
          const data = Array.isArray(response.data) ? response.data : [response.data];
          setInvoices(data);
        }
      } catch (err: any) {
        console.error('Error fetching invoices:', err);
        setError('Failed to load recent invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentInvoices();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400";
      case "UNPAID":
      case "PENDING":
      case "SENT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400";
      case "OVERDUE":
        return "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    router.push(`/dashboard/invoice?invoiceId=${invoiceId}`);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Invoices
        </h3>
        <div className="text-center py-8 text-gray-500">Loading invoices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Invoices
        </h3>
        <div className="text-center py-8 text-red-600">{error}</div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Invoices
        </h3>
        <div className="text-center py-8 text-gray-500">No invoices yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Invoices
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.map((inv) => (
              <tr
                key={inv.invoiceId}
                onClick={() => handleViewInvoice(inv.invoiceId)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  <div className="font-semibold">
                    {inv.userGeneratedInvoiceId || inv.invoiceId}
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(inv.invoiceDate)}</div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {inv.customer?.customerName || inv.accountName || "-"}
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
  {inv.currency_detail.currencySymbol}{" "}
  {Number(
    Number(inv.balanceDue) === 0 || inv.balanceDue == null
      ? inv.amountPaid
      : inv.balanceDue
  ).toLocaleString()}
</td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      inv.status
                    )}`}
                  >
                    {inv.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optional: "View All" link */}
      {invoices.length > 0 && (
        <div className="mt-4 text-right">
          <button
            onClick={() => router.push("/dashboard/invoices")}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all invoices →
          </button>
        </div>
      )}
    </div>
  );
}