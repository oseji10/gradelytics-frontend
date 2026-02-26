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
import Button from "../../components/ui/button/Button";
import { ChevronLeftIcon, EyeIcon } from "@/icons";
import api from "../../../lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icons";

/* ---------------- types ---------------- */

interface Invoice {
  invoiceId: string;
  userGeneratedInvoiceId?: string | null;
  projectName: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currencySymbol: string;
  status: "draft" | "sent" | "paid" | "overdue";
  invoiceDate: string;
  type: "invoice";
}

interface Receipt {
  receiptId: string;
  userGeneratedReceiptId?: string | null;
  projectName: string;
  totalAmount: number;
  amountPaid: number;
  currencySymbol: string;
  status: "issued" | "void" | "partial";
  receiptDate: string;
  type: "receipt";
}

type Document = Invoice | Receipt;

/* ---------------- component ---------------- */

export default function CustomerInvoicesAndReceipts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");

  const [documents, setDocuments] = useState<Document[]>([]);
  const [customerName, setCustomerName] = useState<string>("Customer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------- Money Formatter ---------------- */
  const formatMoney = (value: number | null | undefined, currencySymbol: string = "$") => {
    const num = Number(value);
    if (isNaN(num) || value == null) return `${currencySymbol}0.00`;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(num)
      .replace("$", currencySymbol);
  };

  /* ---------------- Date Formatter ---------------- */
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  /* ---------------- Status Badge Color ---------------- */
  const statusBadgeColor = (status: string, type: "invoice" | "receipt") => {
    if (type === "receipt") {
      switch (status) {
        case "issued":
        case "paid":
          return "success";
        case "void":
          return "error";
        case "partial":
          return "warning";
        default:
          return "secondary";
      }
    }

    switch (status) {
      case "paid":
        return "success";
      case "overdue":
        return "error";
      case "sent":
        return "info";
      case "draft":
      default:
        return "secondary";
    }
  };

  /* ---------------- Fetch Data ---------------- */
  useEffect(() => {
    if (!customerId) {
      setError("No customer specified.");
      setLoading(false);
      return;
    }

    const fetchCustomerDocuments = async () => {
      try {
        const customerRes = await api.get(`/customers/${customerId}/invoices-and-receipt`);
        setCustomerName(customerRes.data.customerName || "Customer");

        const invoicesRes = await api.get(`/invoices/${customerId}/invoices`);
        const invoices: Invoice[] = (invoicesRes.data || []).map((i: any) => ({
          ...i,
          type: "invoice" as const,
          currencySymbol: i.currency_detail?.currencySymbol || "$",
        }));

        const receiptsRes = await api.get(`/invoices/${customerId}/receipts`);
        const receipts: Receipt[] = (receiptsRes.data || []).map((r: any) => ({
          ...r,
          type: "receipt" as const,
          currencySymbol: r.currency_detail?.currencySymbol || "$",
          receiptDate: r.updated_at.split("T")[0],
          invoiceDate: r.invoiceDate,
        }));

        const combined = [...invoices, ...receipts].sort((a, b) => {
          const dateA = new Date(a.type === "invoice" ? a.invoiceDate : (a as Receipt).receiptDate);
          const dateB = new Date(b.type === "invoice" ? b.invoiceDate : (b as Receipt).receiptDate);
          return dateB.getTime() - dateA.getTime();
        });

        setDocuments(combined);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load customer documents");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDocuments();
  }, [customerId]);

  /* ---------------- View Handler ---------------- */
  const handleViewDocument = (doc: Document) => {
    if (doc.type === "invoice") {
      router.push(`/dashboard/invoice?invoiceId=${doc.invoiceId}`);
    } else {
      router.push(`/dashboard/receipt?receiptId=${doc.receiptId}`);
    }
  };

  /* ---------------- UI ---------------- */

  if (!customerId) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center">
        <p className="text-red-600">Invalid access: No customer selected.</p>
        <button
          onClick={() => router.push("/customers")}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← Back to Customers
        </button>
      </div>
    );
  }

  const hasInvoices = documents.some((d) => d.type === "invoice");

  return (
    <div className="relative min-h-screen">
      <div className="space-y-6 py-6 px-4 md:px-6 lg:px-8">
        {/* Page Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900"
            >
              <Icon src={ChevronLeftIcon} className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {customerName}'s Invoices & Receipts
            </h1>
          </div>

          <Button
            className="!bg-[#1F6F43] hover:!bg-[#084d93] w-full sm:w-auto"
            onClick={() => router.push("/dashboard/invoices/create")}
          >
            Create Invoice
          </Button>
        </div>

        {/* Responsive Content */}
        <div className="block md:hidden">
          {/* Mobile Card View */}
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading invoices and receipts...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">{error}</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No invoices or receipts found for {customerName}.
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.type === "invoice" ? doc.invoiceId : doc.receiptId}
                  className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-5 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium mb-2 ${
                          doc.type === "invoice"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {doc.type.toUpperCase()}
                      </span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {doc.type === "invoice"
                          ? doc.userGeneratedInvoiceId || doc.invoiceId
                          : doc.userGeneratedReceiptId || doc.receiptId}
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="text-gray-600 hover:text-brand-600 transition"
                      title="View document"
                    >
                      <Icon src={EyeIcon} className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Project</span>
                      <p className="font-medium">{doc.projectName || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Date</span>
                      <p className="font-medium">
                        {formatDate(doc.type === "invoice" ? doc.invoiceDate : doc.receiptDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total</span>
                      <p className="font-medium">{formatMoney(doc.totalAmount, doc.currencySymbol)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {doc.type === "invoice" ? "Balance Due" : "Amount Paid"}
                      </span>
                      <p className="font-medium">
                        {doc.type === "invoice"
                          ? formatMoney(doc.balanceDue, doc.currencySymbol)
                          : formatMoney(doc.amountPaid, doc.currencySymbol)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        {
                          success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                          warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                          secondary: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
                        }[statusBadgeColor(doc.status, doc.type)]
                      }`}
                    >
                      {doc.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop/Tablet Table View (hidden on mobile) */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Type
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Document
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Project
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Date
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Total
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      {hasInvoices ? "Balance Due" : "Amount Paid"}
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Status
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-gray-500 dark:text-gray-400">
                        Loading invoices and receipts...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-red-600">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-gray-500 dark:text-gray-400">
                        No invoices or receipts found for {customerName}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc) => (
                      <TableRow
                        key={doc.type === "invoice" ? doc.invoiceId : doc.receiptId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <TableCell className="px-5 py-4 text-start">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                              doc.type === "invoice"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            }`}
                          >
                            {doc.type.toUpperCase()}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {doc.type === "invoice"
                              ? doc.userGeneratedInvoiceId || doc.invoiceId
                              : doc.userGeneratedReceiptId || doc.receiptId}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {doc.projectName || "—"}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {formatDate(doc.type === "invoice" ? doc.invoiceDate : doc.receiptDate)}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">
                          {formatMoney(doc.totalAmount, doc.currencySymbol)}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">
                          {doc.type === "invoice"
                            ? formatMoney(doc.balanceDue, doc.currencySymbol)
                            : formatMoney(doc.amountPaid, doc.currencySymbol)}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                              {
                                success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                secondary: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
                              }[statusBadgeColor(doc.status, doc.type)]
                            }`}
                          >
                            {doc.status.toUpperCase()}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="text-gray-600 hover:text-brand-600 transition"
                            title="View document"
                          >
                            <Icon src={EyeIcon} className="w-5 h-5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}