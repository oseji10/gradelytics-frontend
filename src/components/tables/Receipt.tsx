// app/receipt/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  pdf,
} from "@react-pdf/renderer";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import api from "../../../lib/api";
import { ChevronLeftIcon } from "@/icons";
import Icon from "@/components/Icons";

// Success Modal
function EmailSuccessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Receipt Sent!</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your receipt has been successfully sent.
        </p>
        <Button onClick={onClose} className="w-full !bg-[#1F6F43] !hover:bg-[#084e96]">
          OK
        </Button>
      </div>
    </div>
  );
}

interface FullReceipt {
  receiptId: string;
  userGeneratedReceiptId?: string | null;
  projectName: string;
  subtotal: number;               // sum of line totals (before discount & tax)
  taxPercentage: number;
  taxAmount: number;
  discountPercentage: number;
  discountAmount: number;
  totalAmount: number;            // grand total = (subtotal - discount) + tax
  amountPaid: number;
  currencySymbol: string;
  status: string;
  receiptDate: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  accountName: string;
  accountNumber: string;
  bank: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;               // computed: quantity × unitPrice
  }>;
  notes?: string | null;
  company: {
    name: string;
    email: string;
    phone: string;
    logoUrl: string;
    signatureUrl: string;
    taxId: string;
    tenantAddress: string;
  };
  user: {
    currentPlan: number | string;
  };
}

const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#333" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottom: "2 solid #e0e0e0",
    paddingBottom: 15,
  },
  logo: { width: 140, height: "auto" },
  companyInfo: { textAlign: "right", maxWidth: 220 },
  companyName: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 6, color: "#16A34A" },
  title: { fontSize: 28, fontFamily: "Helvetica-Bold", marginBottom: 8, textAlign: "center", color: "#16A34A" },
  receiptNumber: { textAlign: "center", marginBottom: 25, fontSize: 14 },
  section: { marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { color: "#555", fontSize: 10 },
  value: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  customerAddress: { fontSize: 10, marginTop: 3, color: "#555", maxWidth: 200 },
  table: { width: "100%", marginVertical: 20, border: "1 solid #d1d5db" },
  tableHeader: {
    backgroundColor: "#f0fdf4",
    flexDirection: "row",
    borderBottom: "1 solid #d1d5db",
  },
  tableRow: { flexDirection: "row", borderBottom: "1 solid #d1d5db" },
  cell: { padding: 8, flexGrow: 1, flexBasis: 0 },
  cellCenter: { textAlign: "center" },
  cellRight: { textAlign: "right" },
  totalRow: { backgroundColor: "#dcfce7", fontFamily: "Helvetica-Bold" },
  paidRow: { backgroundColor: "#bbf7d0", fontFamily: "Helvetica-Bold", fontSize: 13 },
  discountRow: { color: "#dc2626" },
  paymentSection: { marginTop: 25, padding: 12, backgroundColor: "#f0fdf4", borderRadius: 6 },
  notes: { marginTop: 30, padding: 12, backgroundColor: "#f9fafb", borderRadius: 6 },
  signatureSection: { marginTop: 45, alignItems: "flex-end" },
  signatureImage: { width: 160, height: 70 },
  signatureLabel: { marginTop: 6, fontSize: 9, textAlign: "center" },
});

const ReceiptPDF = ({ receipt }: { receipt: FullReceipt }) => {
  const formatMoney = (value: number) =>
    new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2 }).format(value);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          {receipt.company.logoUrl ? (
            <Image style={pdfStyles.logo} src={receipt.company.logoUrl} />
          ) : (
            <View style={{ width: 140 }} />
          )}
          <View style={pdfStyles.companyInfo}>
            <Text style={pdfStyles.companyName}>{receipt.company.name}</Text>
            <Text>{receipt.company.email}</Text>
            <Text>{receipt.company.phone}</Text>
          </View>
        </View>

        <Text style={pdfStyles.title}>RECEIPT</Text>
        <Text style={pdfStyles.receiptNumber}>
          {receipt.userGeneratedReceiptId || receipt.receiptId}
        </Text>

        <View style={pdfStyles.section}>
          <View style={pdfStyles.row}>
            <View>
              <Text style={pdfStyles.label}>Issued To</Text>
              <Text style={pdfStyles.value}>{receipt.customerName}</Text>
              {receipt.customerAddress && (
                <Text style={pdfStyles.customerAddress}>{receipt.customerAddress}</Text>
              )}
              {receipt.customerEmail && <Text>{receipt.customerEmail}</Text>}
              {receipt.customerPhone && <Text>{receipt.customerPhone}</Text>}
            </View>
            <View>
              <Text style={pdfStyles.label}>Receipt Date</Text>
              <Text>{new Date(receipt.receiptDate).toLocaleDateString("en-GB")}</Text>
              <Text style={pdfStyles.label}>Status</Text>
              <Text style={pdfStyles.value}>{receipt.status}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.cell, { flexGrow: 3 }]}>Description</Text>
            <Text style={[pdfStyles.cell, pdfStyles.cellCenter]}>Qty</Text>
            <Text style={[pdfStyles.cell, pdfStyles.cellRight]}>Unit Price</Text>
            <Text style={[pdfStyles.cell, pdfStyles.cellRight]}>Line Total</Text>
          </View>

          {receipt.items.map((item, idx) => (
            <View key={idx} style={pdfStyles.tableRow} wrap={false}>
              <Text style={[pdfStyles.cell, { flexGrow: 3 }]}>{item.description}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.cellCenter]}>{item.quantity}</Text>
              <Text style={[pdfStyles.cell, pdfStyles.cellRight]}>
                {receipt.currencySymbol} {formatMoney(item.unitPrice)}
              </Text>
              <Text style={[pdfStyles.cell, pdfStyles.cellRight]}>
                {receipt.currencySymbol} {formatMoney(item.amount)}
              </Text>
            </View>
          ))}

          <View style={[pdfStyles.tableRow, pdfStyles.totalRow]}>
            <Text style={[pdfStyles.cell, { flexGrow: 3, textAlign: "right" }]}>Subtotal</Text>
            <Text style={[pdfStyles.cell, pdfStyles.cellRight]}>
              {receipt.currencySymbol} {formatMoney(receipt.subtotal)}
            </Text>
          </View>

          {receipt.discountPercentage > 0 && (
            <View style={[pdfStyles.tableRow, pdfStyles.totalRow]}>
              <Text style={[pdfStyles.cell, { flexGrow: 3, textAlign: "right", color: "#dc2626" }]}>
                Discount ({receipt.discountPercentage}%)
              </Text>
              <Text style={[pdfStyles.cell, pdfStyles.cellRight, { color: "#dc2626" }]}>
                -{receipt.currencySymbol} {formatMoney(receipt.discountAmount)}
              </Text>
            </View>
          )}

          <View style={[pdfStyles.tableRow, pdfStyles.totalRow]}>
            <Text style={[pdfStyles.cell, { flexGrow: 3, textAlign: "right" }]}>
              Amount after discount
            </Text>
            <Text style={[pdfStyles.cell, pdfStyles.cellRight]}>
              {receipt.currencySymbol} {formatMoney(receipt.subtotal - receipt.discountAmount)}
            </Text>
          </View>

          <View style={[pdfStyles.tableRow, pdfStyles.totalRow]}>
            <Text style={[pdfStyles.cell, { flexGrow: 3, textAlign: "right" }]}>
              Tax ({receipt.taxPercentage}%)
            </Text>
            <Text style={[pdfStyles.cell, pdfStyles.cellRight]}>
              {receipt.currencySymbol} {formatMoney(receipt.taxAmount)}
            </Text>
          </View>

          <View style={[pdfStyles.tableRow, pdfStyles.paidRow]}>
            <Text style={[pdfStyles.cell, { flexGrow: 3, textAlign: "right", color: "#16A34A" }]}>
              Amount Paid
            </Text>
            <Text style={[pdfStyles.cell, pdfStyles.cellRight, { color: "#16A34A" }]}>
              {receipt.currencySymbol} {formatMoney(receipt.amountPaid)}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.paymentSection}>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 8, fontSize: 12 }}>
            Payment Received Via
          </Text>
          <Text>Account Name: {receipt.accountName}</Text>
          <Text>Account Number: {receipt.accountNumber}</Text>
          <Text>Bank: {receipt.bank}</Text>
        </View>

        {receipt.notes && (
          <View style={pdfStyles.notes}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 6 }}>Notes</Text>
            <Text>{receipt.notes}</Text>
          </View>
        )}

        {receipt.company.signatureUrl && (
          <View style={pdfStyles.signatureSection}>
            <View>
              <Image style={pdfStyles.signatureImage} src={receipt.company.signatureUrl} />
              <Text style={pdfStyles.signatureLabel}>Authorized Signature</Text>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, string> = {
    ISSUED: "bg-green-100 text-green-800 border-green-200",
    PAID: "bg-green-100 text-green-800 border-green-200",
    VOID: "bg-red-100 text-red-800 border-red-200",
    PARTIAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const baseClasses = "px-3 py-1 rounded-full text-sm font-medium border mt-2";
  const colorClasses = statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <span className={`${baseClasses} ${colorClasses}`}>
      {status}
    </span>
  );
};

export default function ReceiptViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const receiptId = searchParams.get("receiptId");

  const [receipt, setReceipt] = useState<FullReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alternateEmail, setAlternateEmail] = useState("");
  const [useAlternateEmail, setUseAlternateEmail] = useState(false);

  const formatMoney = (value: number, symbol: string = "₦") => {
    return `${symbol} ${new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
    }).format(value)}`;
  };

  useEffect(() => {
    if (!receiptId) {
      setError("No receipt ID provided");
      setLoading(false);
      return;
    }

    const fetchReceipt = async () => {
      try {
        const res = await api.get(`/receipts/${receiptId}`);
        const raw = Array.isArray(res.data) ? res.data[0] : res.data;

        if (!raw || !raw.tenant) {
          throw new Error("Receipt or company data not found");
        }

        // Items transformation – backend now stores unit price in 'amount'
        const items = raw.items.map((item: any) => {
          const qty = Number(item.quantity ?? 1);
          const unitPrice = Number(item.amount ?? 0); // unit price
          const lineTotal = qty * unitPrice;

          return {
            description: item.itemDescription,
            quantity: qty,
            unitPrice,
            amount: lineTotal,
          };
        });

        // Prefer stored values, fallback to calculation
        const subtotal = Number(raw.subtotal ?? items.reduce((sum: number, i) => sum + i.amount, 0));

        const discountPercentage = Number(raw.discountPercentage ?? 0);
        const discountAmount = Number(raw.discountAmount ?? subtotal * (discountPercentage / 100));

        const amountAfterDiscount = Math.max(0, subtotal - discountAmount);

        const taxPercentage = Number(raw.taxPercentage ?? 0);
        const taxAmount = Number(raw.taxAmount ?? amountAfterDiscount * (taxPercentage / 100));

        const totalAmount = Number(raw.totalAmount ?? amountAfterDiscount + taxAmount);

        const amountPaid = Number(raw.amountPaid ?? totalAmount);

        const logoUrl = raw.tenant.tenantLogo
          ? `${process.env.NEXT_PUBLIC_FILE_URL}${raw.tenant.tenantLogo}`
          : "";
        const signatureUrl = raw.tenant.authorizedSignature
          ? `${process.env.NEXT_PUBLIC_FILE_URL}${raw.tenant.authorizedSignature}`
          : "";

        const transformed: FullReceipt = {
          receiptId: raw.receiptId || raw.id,
          userGeneratedReceiptId: raw.userGeneratedReceiptId,
          projectName: raw.projectName,
          subtotal,
          taxPercentage,
          taxAmount,
          discountPercentage,
          discountAmount,
          totalAmount,
          amountPaid,
          currencySymbol: raw.currency_detail?.currencySymbol || "₦",
          status: (raw.status || "ISSUED").toUpperCase(),
          receiptDate: raw.receiptDate || raw.updated_at,
          customerName: raw.customer?.customerName || raw.accountName || "Customer",
          customerEmail: raw.customer?.customerEmail,
          customerPhone: raw.customer?.customerPhone,
          customerAddress: raw.customer?.customerAddress,
          accountName: raw.accountName,
          accountNumber: raw.accountNumber,
          bank: raw.bank,
          items,
          notes: raw.notes,
          company: {
            name: raw.tenant.tenantName,
            email: raw.tenant.tenantEmail,
            phone: raw.tenant.tenantPhone,
            logoUrl,
            signatureUrl,
            taxId: raw.tenant.taxId,
            tenantAddress: raw.tenant.tenantAddress,
          },
          user: {
            currentPlan: raw.creator?.currentPlan || 1,
          },
        };

        setReceipt(transformed);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [receiptId]);

  const generatePDF = async () => {
    if (!receipt) return;
    setIsGeneratingPdf(true);
    try {
      const blob = await pdf(<ReceiptPDF receipt={receipt} />).toBlob();
      setPdfBlob(blob);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!receiptId) return;

    try {
      setLoading(true);
      const response = await api.get(`/receipts/${receiptId}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Receipt_${receipt?.userGeneratedReceiptId || receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to download PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (sendToAlternate: boolean = false) => {
    if (!receiptId) return;

    try {
      setIsSendingEmail(true);

      let targetEmail = receipt?.customerEmail || "";

      if (sendToAlternate && alternateEmail.trim()) {
        targetEmail = alternateEmail.trim();
      }

      const payload = { email: targetEmail };

      await api.post(`/receipts/${receiptId}/send-email`, payload);

      setShowSuccessModal(true);
      setUseAlternateEmail(false);
      setAlternateEmail("");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to send receipt");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-8" />
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between gap-6">
          <div className="space-y-3">
            <div className="h-10 w-48 bg-gray-200 rounded" />
            <div className="h-5 w-64 bg-gray-200 rounded" />
          </div>
          <div className="h-32 w-32 bg-gray-200 rounded mx-auto sm:mx-0" />
        </div>
      </div>
    </div>
  );

  if (loading) return <LoadingSkeleton />;

  if (error || !receipt) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center px-4">
        <p className="text-red-600 text-lg">{error || "Receipt not found"}</p>
        <button onClick={() => window.history.back()} className="mt-6 text-blue-600 hover:underline">
          ← Back to Receipts
        </button>
      </div>
    );
  }

  const isPremium = ["2", "3", 2, 3].includes(receipt.user.currentPlan);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => window.history.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
      >
        <Icon src={ChevronLeftIcon} className="w-5 h-5" />
        Back to Receipts
      </button>

      <ComponentCard title={`Receipt ${receipt.userGeneratedReceiptId || receipt.receiptId}`}>
        <div className="space-y-8">
          {/* Company Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b pb-8">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1F6F43]">{receipt.company.name}</h1>
              <p className="text-gray-600">{receipt.company?.tenantAddress}</p>
              <p className="text-gray-600">{receipt.company.email}</p>
              <p className="text-gray-600">{receipt.company.phone}</p>
              {receipt.company.taxId && (<p className="text-gray-600 font-bold">Tax ID: {receipt.company?.taxId}</p>)}
            </div>
            {receipt.company.logoUrl && (
              <img
                src={receipt.company.logoUrl}
                alt="Company Logo"
                className="h-24 sm:h-32 object-contain mx-auto sm:mx-0"
              />
            )}
          </div>

          {/* Project & Amount Paid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">{receipt.projectName}</h2>
              <div className="mt-4 space-y-1">
                <p className="text-gray-600 font-medium">Issued To:</p>
                <p className="text-gray-800">{receipt.customerName}</p>
                {receipt.customerAddress && (
                  <p className="text-gray-600 text-sm whitespace-pre-line">{receipt.customerAddress}</p>
                )}
                {receipt.customerEmail && <p className="text-gray-600">{receipt.customerEmail}</p>}
                {receipt.customerPhone && <p className="text-gray-600">{receipt.customerPhone}</p>}
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-2xl sm:text-3xl font-bold text-[#1F6F43]">
                {formatMoney(receipt.amountPaid, receipt.currencySymbol)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Amount Paid</p>
              <StatusBadge status={receipt.status} />
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-gray-500">Receipt Date</p>
              <p className="font-medium">{new Date(receipt.receiptDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Amount</p>
              <p className="font-medium">{formatMoney(receipt.totalAmount, receipt.currencySymbol)}</p>
            </div>
            <div>
              <p className="text-gray-500">Amount Paid</p>
              <p className="font-medium text-[#1F6F43]">{formatMoney(receipt.amountPaid, receipt.currencySymbol)}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-full sm:min-w-0">
              <thead>
                <tr className="border-b text-left text-gray-600 bg-blue-50">
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-right">Unit Price</th>
                  <th className="py-3 px-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-4 px-3">{item.description}</td>
                    <td className="py-4 px-2 text-center">{item.quantity}</td>
                    <td className="py-4 px-2 text-right">{formatMoney(item.unitPrice, receipt.currencySymbol)}</td>
                    <td className="py-4 px-2 text-right font-medium">
                      {formatMoney(item.amount, receipt.currencySymbol)}
                    </td>
                  </tr>
                ))}

                <tr>
                  <td colSpan={3} className="py-3 px-3 text-right font-medium">Subtotal</td>
                  <td className="py-3 px-2 text-right">
                    {formatMoney(receipt.subtotal, receipt.currencySymbol)}
                  </td>
                </tr>

                {receipt.discountPercentage > 0 && (
                  <tr>
                    <td colSpan={3} className="py-3 px-3 text-right font-medium text-red-700">
                      Discount ({receipt.discountPercentage}%)
                    </td>
                    <td className="py-3 px-2 text-right text-red-700">
                      -{formatMoney(receipt.discountAmount, receipt.currencySymbol)}
                    </td>
                  </tr>
                )}

                <tr>
                  <td colSpan={3} className="py-3 px-3 text-right font-medium">Amount after discount</td>
                  <td className="py-3 px-2 text-right">
                    {formatMoney(receipt.subtotal - receipt.discountAmount, receipt.currencySymbol)}
                  </td>
                </tr>

                <tr>
                  <td colSpan={3} className="py-3 px-3 text-right font-medium">Tax ({receipt.taxPercentage}%)</td>
                  <td className="py-3 px-2 text-right">{formatMoney(receipt.taxAmount, receipt.currencySymbol)}</td>
                </tr>

                <tr className="bg-blue-50">
                  <td colSpan={3} className="py-4 px-3 text-right font-bold text-lg">Total Paid</td>
                  <td className="py-4 px-2 text-right font-bold text-xl text-[#1F6F43]">
                    {formatMoney(receipt.amountPaid, receipt.currencySymbol)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Details */}
          <div className="bg-blue-50 dark:bg-[#E8F4FD] p-6 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-900">Payment Received Via</h3>
            <div className="space-y-2 text-gray-900 dark:text-gray-900">
              <p><strong>Account Name:</strong> {receipt.accountName}</p>
              <p><strong>Account Number:</strong> {receipt.accountNumber}</p>
              <p><strong>Bank:</strong> {receipt.bank}</p>
            </div>
          </div>

          {receipt.notes && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Notes</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded">{receipt.notes}</p>
            </div>
          )}

          {/* Signature */}
          {receipt.company.signatureUrl && (
            <div className="mt-12 flex justify-center sm:justify-end">
              <div className="text-center">
                <img
                  src={receipt.company.signatureUrl}
                  alt="Authorized Signature"
                  className="h-20 object-contain"
                />
                <p className="text-sm text-gray-600 mt-2">Authorized Signature</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-8 border-t">
            <div className="flex flex-col gap-4 w-full">
              <button
                onClick={() => handleSendEmail(false)}
                disabled={isSendingEmail || !receipt.customerEmail}
                className={`
                  w-full px-6 py-3 rounded-md text-white transition flex items-center justify-center gap-2
                  bg-[#1F6F43] hover:bg-[#084e96]
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isSendingEmail && !useAlternateEmail ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending Receipt...
                  </>
                ) : (
                  `Send to ${receipt.customerEmail ?? "Customer Email"}`
                )}
              </button>

              {isPremium && (
                <div className="flex flex-col gap-3 bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useAlternate"
                      checked={useAlternateEmail}
                      onChange={(e) => setUseAlternateEmail(e.target.checked)}
                      className="rounded"
                      disabled={isSendingEmail}
                    />
                    <label htmlFor="useAlternate" className="text-sm font-medium cursor-pointer">
                      Send to alternate email (Premium Feature)
                    </label>
                  </div>

                  {useAlternateEmail && (
                    <>
                      <input
                        type="email"
                        value={alternateEmail}
                        onChange={(e) => setAlternateEmail(e.target.value)}
                        placeholder="alternate@example.com"
                        className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={isSendingEmail}
                      />

                      <button
                        onClick={() => handleSendEmail(true)}
                        disabled={isSendingEmail || !alternateEmail.trim()}
                        className={`
                          w-full px-6 py-3 rounded-md text-white transition flex items-center justify-center gap-2
                          bg-green-600 hover:bg-green-700
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        {isSendingEmail && useAlternateEmail ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Sending Receipt...
                          </>
                        ) : (
                          "Send to Alternate Email"
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={pdfBlob ? handleDownloadPDF : generatePDF}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto"
            >
              {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>

          <EmailSuccessModal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
          />
        </div>
      </ComponentCard>
    </div>
  );
}