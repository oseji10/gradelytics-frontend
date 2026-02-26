// app/invoices/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { ChevronLeftIcon } from "@/icons";
import api from "../../../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icons";

/* ---------------- types ---------------- */
interface Invoice {
  invoiceId: string;
  userGeneratedInvoiceId?: string | null;
  projectName: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currencyCode: string;
  currencySymbol: string;
  status: "draft" | "sent" | "paid" | "overdue";
  invoiceDate: string;
  createdAt: string;
  currency_detail?: {
    currencySymbol: string;
  };
}

/* ---------------- component ---------------- */
export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------- helpers ---------------- */
  const formatMoney = (
    value: number | null | undefined,
    currencyCode?: string,
    currencySymbol?: string
  ) => {
    const num = Number(value);
    const symbol = currencySymbol || "$";

    if (isNaN(num)) return `${symbol}0.00`;

    try {
      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode || "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const parts = formatter.formatToParts(num);
      const currencyPart =
        parts.find((p) => p.type === "currency")?.value || "$";

      return formatter.format(num).replace(currencyPart, symbol);
    } catch {
      return `${symbol}${num.toFixed(2)}`;
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const statusBadgeColor = (status: Invoice["status"]) =>
    ({
      paid:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      overdue:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      sent:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      draft:
        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    }[status]);

  const navigateToInvoice = (invoiceId: string) =>
    router.push(`/dashboard/invoice?invoiceId=${invoiceId}`);

  /* ---------------- fetch ---------------- */
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await api.get("/invoices");
        // Sort invoices by invoiceDate descending (latest first)
        const sorted = res.data
          .slice() // make a copy to avoid mutating original
          .sort(
            (a: Invoice, b: Invoice) =>
              new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
          );
        setInvoices(sorted);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

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
              My Invoices
            </h1>
          </div>

          <Link
            href="/dashboard/invoices/create"
            className="rounded-md bg-[#1F6F43] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#084d93]"
          >
            Create Invoice
          </Link>
        </div>

        {/* ---------------- Mobile Cards ---------------- */}
        <div className="block md:hidden space-y-2">
          {loading ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading invoices…
            </p>
          ) : error ? (
            <p className="py-6 text-center text-sm text-red-600">{error}</p>
          ) : (
            invoices.map((inv) => {
              const symbol =
                inv.currency_detail?.currencySymbol || inv.currencySymbol;

              return (
                <div
                  key={inv.invoiceId}
                  onClick={() => navigateToInvoice(inv.invoiceId)}
                  className="
                    rounded-lg border border-gray-200 bg-white
                    p-3 shadow-sm transition hover:shadow-md
                    dark:border-white/[0.08] dark:bg-white/[0.03]
                  "
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {inv.userGeneratedInvoiceId || inv.invoiceId}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {inv.projectName || "No project"}
                      </p>
                    </div>
                    <ViewButton
                      onClick={() => navigateToInvoice(inv.invoiceId)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t pt-2 text-xs border-gray-200 dark:border-white/[0.08]">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Date
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {formatDate(inv.invoiceDate)}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Paid
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {formatMoney(
                          inv.amountPaid,
                          inv.currencyCode,
                          symbol
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Balance
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {formatMoney(
                          inv.balanceDue,
                          inv.currencyCode,
                          symbol
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Status
                      </span>
                      <span
                        className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs ${statusBadgeColor(
                          inv.status
                        )}`}
                      >
                        {inv.status.toUpperCase()}
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
                <th className="py-2 px-3 font-medium">Invoice</th>
                <th className="py-2 px-3 font-medium">Project</th>
                <th className="py-2 px-3 font-medium">Date</th>
                <th className="py-2 px-3 font-medium">Paid</th>
                <th className="py-2 px-3 font-medium">Balance</th>
                <th className="py-2 px-3 font-medium">Status</th>
                <th className="py-2 px-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-white/[0.08]">
              {invoices.map((inv) => {
                const symbol =
                  inv.currency_detail?.currencySymbol || inv.currencySymbol;

                return (
                  <tr
                    key={inv.invoiceId}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <TableCell className="py-2 px-3 font-medium text-gray-900 dark:text-white">
                      {inv.userGeneratedInvoiceId || inv.invoiceId}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-gray-700 dark:text-gray-300">
                      {inv.projectName || "—"}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-gray-700 dark:text-gray-300">
                      {formatDate(inv.invoiceDate)}
                    </TableCell>
                    <TableCell className="py-2 px-3 font-medium text-gray-900 dark:text-white">
                      {formatMoney(
                        inv.amountPaid,
                        inv.currencyCode,
                        symbol
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-3 font-medium text-gray-900 dark:text-white">
                      {formatMoney(
                        inv.balanceDue,
                        inv.currencyCode,
                        symbol
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${statusBadgeColor(
                          inv.status
                        )}`}
                      >
                        {inv.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <ViewButton
                        onClick={() => navigateToInvoice(inv.invoiceId)}
                      />
                    </TableCell>
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
