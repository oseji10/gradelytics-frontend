"use client";

import React, { useEffect, useState } from "react";
import Button from "../../components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import api from "../../../lib/api";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";

/* ---------------- types ---------------- */

interface Receipt {
  receiptId: string;
  userGeneratedReceiptId?: string | null;
  projectName: string;
  totalAmount: number;
  amountPaid: number;
  currencyCode: string;
  currencySymbol: string;
  status: "issued" | "void" | "partial";
  receiptDate: string;
  createdAt: string;
  updated_at?: string;
  currency_detail?: {
    currencySymbol: string;
  };
}

/* ---------------- component ---------------- */

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------- helpers ---------------- */

  const formatMoney = (
    value: number | null | undefined,
    currencySymbol: string = "$"
  ) => {
    const num = Number(value);
    if (isNaN(num)) return `${currencySymbol}0.00`;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(num)
      .replace("$", currencySymbol);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const statusColor = (status: Receipt["status"]) =>
    ({
      issued:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      void:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      partial:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    }[status] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300");

  const handleViewReceipt = (receiptId: string) => {
    router.push(`/dashboard/receipt?receiptId=${receiptId}`);
  };

  /* ---------------- View Button ---------------- */

  const ViewButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="
        relative inline-flex items-center justify-center
        rounded-md bg-[#1F6F43]
        px-3 py-1.5 text-xs font-medium text-white
        shadow-sm transition-all duration-200
        hover:bg-[#084d93] hover:-translate-y-[1px] hover:shadow-md
        active:translate-y-0
      "
    >
      View
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 hover:translate-x-full" />
    </button>
  );

  /* ---------------- fetch ---------------- */

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const res = await api.get("/receipts");

        // Sort receipts descending by updated_at > receiptDate > createdAt
        const sorted = res.data
          .slice()
          .sort((a: Receipt, b: Receipt) => {
            const dateA = new Date(a.updated_at || a.receiptDate || a.createdAt).getTime();
            const dateB = new Date(b.updated_at || b.receiptDate || b.createdAt).getTime();
            return dateB - dateA; // latest first
          });

        setReceipts(sorted);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load receipts");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, []);

  /* ---------------- UI ---------------- */

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="space-y-3 px-2 py-3 md:px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Icon src={ChevronLeftIcon} className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Receipts
            </h1>
          </div>
        </div>

        {/* ---------------- Mobile Cards ---------------- */}
        <div className="block md:hidden space-y-2">
          {loading ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading receipts…
            </p>
          ) : error ? (
            <p className="py-6 text-center text-sm text-red-600">{error}</p>
          ) : (
            receipts.map((rec) => {
              const symbol =
                rec.currency_detail?.currencySymbol || rec.currencySymbol;

              return (
                <div
                  key={rec.receiptId}
                  onClick={() => handleViewReceipt(rec.receiptId)}
                  className="
                    rounded-lg border border-gray-200 bg-white
                    p-3 shadow-sm transition hover:shadow-md
                    dark:border-white/[0.08] dark:bg-white/[0.03]
                  "
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {rec.userGeneratedReceiptId || rec.receiptId}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {rec.projectName || "No project"}
                      </p>
                    </div>
                    <ViewButton
                      onClick={() => handleViewReceipt(rec.receiptId)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t pt-2 text-xs border-gray-200 dark:border-white/[0.08]">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Date
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {formatDate(
                          rec.updated_at || rec.receiptDate || rec.createdAt
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Amount
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {formatMoney(rec.totalAmount, symbol)}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Paid
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {formatMoney(rec.amountPaid, symbol)}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Status
                      </span>
                      <span
                        className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs ${statusColor(
                          rec.status
                        )}`}
                      >
                        {rec.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ---------------- Desktop Table ---------------- */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/[0.08] text-left text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-2 px-3 font-medium">Receipt</th>
                <th className="py-2 px-3 font-medium">Project</th>
                <th className="py-2 px-3 font-medium">Date</th>
                <th className="py-2 px-3 font-medium">Amount</th>
                <th className="py-2 px-3 font-medium">Paid</th>
                <th className="py-2 px-3 font-medium">Status</th>
                <th className="py-2 px-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-white/[0.08]">
              {receipts.map((rec) => {
                const symbol =
                  rec.currency_detail?.currencySymbol || rec.currencySymbol;

                return (
                  <tr
                    key={rec.receiptId}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">
                      {rec.userGeneratedReceiptId || rec.receiptId}
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                      {rec.projectName || "—"}
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                      {formatDate(
                        rec.updated_at || rec.receiptDate || rec.createdAt
                      )}
                    </td>
                    <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">
                      {formatMoney(rec.totalAmount, symbol)}
                    </td>
                    <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">
                      {formatMoney(rec.amountPaid, symbol)}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${statusColor(
                          rec.status
                        )}`}
                      >
                        {rec.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <ViewButton
                        onClick={() => handleViewReceipt(rec.receiptId)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
