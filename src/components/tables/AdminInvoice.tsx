// app/invoice/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ComponentCard from "../common/ComponentCard";
import Button from "../ui/button/Button";
import api from "../../../lib/api";
import { ChevronLeftIcon } from "@/icons";
import Icon from "@/components/Icons";


// Add this Success Modal near the top (after imports)
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
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invoice Sent!</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your invoice has been successfully sent.
        </p>
        <Button onClick={onClose} className="w-full !bg-[#1F6F43] !hover:bg-[#084e96]">
          OK
        </Button>
      </div>
    </div>
  );
}

function StatusUpdateModal({
  isOpen,
  type,
  title,
  message,
  onClose,
  onCreateInvoice,
  onGoToReceipts,
}: {
  isOpen: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
  onCreateInvoice: () => void;
  onGoToReceipts: () => void;
}) {
  if (!isOpen) return null;

  const iconStyles =
    type === "success"
      ? "bg-[#1F6F43]/10 text-[#1F6F43]"
      : "bg-red-100 text-red-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="absolute right-4 top-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 pt-8">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${iconStyles}`}>
            {type === "success" ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <h3 className="text-center text-xl font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-center text-sm text-gray-600">{message}</p>

          {type === "success" ? (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                onClick={onCreateInvoice}
                className="w-full !bg-[#1F6F43] !text-white !hover:bg-[#084e96]"
              >
                Create Another Invoice
              </Button>
              <Button
                onClick={onGoToReceipts}
                variant="outline"
                className="w-full border-[#1F6F43]/30 text-[#1F6F43] hover:bg-[#1F6F43]/10"
              >
                Go to Receipts
              </Button>
            </div>
          ) : (
            <div className="mt-6">
              <Button
                onClick={onClose}
                className="w-full !bg-[#1F6F43] !text-white !hover:bg-[#084e96]"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ShareIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

// ==================== TYPES ====================
interface FullInvoice {
  invoiceId: string;
  userGeneratedInvoiceId?: string | null;
  projectName: string;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currencySymbol: string;
  status: string;
  invoiceDate: string;
  dueDate?: string | null;
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
    amount: number;
  }>;
  notes?: string | null;
  company: {
    name: string;
    email: string;
    phone: string;
    logoUrl: string;
    signatureUrl: string;
    taxId?: string | null;
    tenantAddress?: string | null;
  };
  user: {
    currentPlan: number | string; // 1 = free, 2 = premium, 3 = pro, etc.
  };
}


const StatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, string> = {
    UNPAID: "bg-red-100 text-red-800 border-red-200",
    PAID: "bg-green-100 text-green-800 border-green-200",
    OVERDUE: "bg-orange-100 text-orange-800 border-orange-200",
    PARTIAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PARTIAL_PAYMENT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const baseClasses = "px-3 py-1 rounded-full text-sm font-medium border";
  const colorClasses = statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <span className={`${baseClasses} ${colorClasses}`}>
      {status.replace("_", " ")}
    </span>
  );
};

const ShareButtons = ({ invoice }: { invoice: FullInvoice }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareableLink, setShareableLink] = useState<string>("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareableLink(window.location.href);
    }
  }, []);

  const formatMoney = (value: number, symbol: string = "₦") => {
    return `${symbol} ${new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
    }).format(value)}`;
  };

  const getShareMessage = () => {
    return `Invoice ${invoice.userGeneratedInvoiceId || invoice.invoiceId}
From: ${invoice.company.name}
To: ${invoice.customerName}
Amount: ${formatMoney(invoice.totalAmount, invoice.currencySymbol)}
Status: ${invoice.status}
View Invoice: ${shareableLink}`;
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      alert('Link copied!');
    } catch (err) {
      alert('Failed to copy');
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="flex items-center gap-2"
      >
        <ShareIcon className="w-5 h-5" />
        Share Invoice
      </Button>

      {showShareMenu && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Share via:</span>
              <button
                onClick={() => setShowShareMenu(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <button onClick={() => { shareOnWhatsApp(); setShowShareMenu(false); }} className="w-full p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg">
              WhatsApp
            </button>
            <button onClick={copyToClipboard} className="w-full p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg">
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminInvoice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");
  const contentRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<FullInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [alternateEmail, setAlternateEmail] = useState("");
  const [useAlternateEmail, setUseAlternateEmail] = useState(false);
  
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);
  const [logoBase64, setLogoBase64] = useState<string>("");
  const [signatureBase64, setSignatureBase64] = useState<string>("");

  const formatMoney = (value: number, symbol: string = "₦") => {
    return `${symbol} ${new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
    }).format(value)}`;
  };

  const getBase64Image = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Failed to load image as base64:", err);
      return "";
    }
  };

  useEffect(() => {
    if (!invoice) return;

    const loadImages = async () => {
      if (invoice.company.logoUrl) {
        const base64 = await getBase64Image(invoice.company.logoUrl);
        setLogoBase64(base64);
      }
      if (invoice.company.signatureUrl) {
        const base64 = await getBase64Image(invoice.company.signatureUrl);
        setSignatureBase64(base64);
      }
    };

    loadImages();
  }, [invoice]);

  useEffect(() => {
    if (!invoiceId) {
      setError("No invoice ID provided");
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${invoiceId}/admin`);
        const raw = Array.isArray(res.data) ? res.data[0] : res.data;

        if (!raw || !raw.tenant) {
          throw new Error("Invoice or company data not found");
        }

        const items = raw.items.map((item: any) => {
          const quantity = Number(item.quantity ?? 1);
          const unitPrice = Number(item.amount ?? 0);
          return {
            description: item.itemDescription,
            quantity,
            unitPrice,
            amount: quantity * unitPrice,
          };
        });

        const subtotal = Number(
          raw.subtotal ?? items.reduce((sum: number, item: any) => sum + item.amount, 0)
        );

        const discountPercentage = Number(raw.discountPercentage ?? 0);
        const discountAmount = Number(
          raw.discountAmount ?? subtotal * (discountPercentage / 100)
        );

        const amountAfterDiscount = Math.max(0, subtotal - discountAmount);

        const taxPercentage = Number(raw.taxPercentage ?? 0);
        const taxAmount = Number(
          raw.taxAmount ?? amountAfterDiscount * (taxPercentage / 100)
        );

        const totalAmount = Number(
          raw.totalAmount ?? amountAfterDiscount + taxAmount
        );

        const amountPaid = Number(raw.amountPaid ?? 0);
        const balanceDue = Number(raw.balanceDue ?? totalAmount - amountPaid);

        const logoUrl = raw.tenant.tenantLogo
          ? `${process.env.NEXT_PUBLIC_FILE_URL}${raw.tenant.tenantLogo}`
          : "";
        const signatureUrl = raw.tenant.authorizedSignature
          ? `${process.env.NEXT_PUBLIC_FILE_URL}${raw.tenant.authorizedSignature}`
          : "";

        const transformed: FullInvoice = {
          invoiceId: raw.invoiceId,
          userGeneratedInvoiceId: raw.userGeneratedInvoiceId,
          projectName: raw.projectName,
          subtotal,
          discountPercentage,
          discountAmount,
          taxPercentage,
          taxAmount,
          totalAmount,
          amountPaid,
          balanceDue,
          currencySymbol: raw.currency_detail?.currencySymbol || "₦",
          status: raw.status.toUpperCase(),
          invoiceDate: raw.invoiceDate,
          dueDate: raw.dueDate,
          customerName: raw.customer?.customerName || raw.accountName || "—",
          customerEmail: raw.customer?.customerEmail,
          customerPhone: raw.customer?.customerPhone,
          customerAddress: raw.customer?.customerAddress,
          accountName: raw.accountName,
          accountNumber: raw.accountNumber,
          bank: raw.bank,
          items,
          notes: raw.notes,
          company: {
            name: raw.tenant.tenantName || "Your Company",
            email: raw.tenant.tenantEmail || "",
            phone: raw.tenant.tenantPhone || "",
            logoUrl,
            signatureUrl,
            tenantAddress: raw.tenant.tenantAddress,
            taxId: raw.tenant.taxId,
          },
          user: {
            currentPlan: raw.creator?.currentPlan || 1,
          },
        };

        setInvoice(transformed);
        setSelectedStatus(transformed.status);
        setAmountPaid(transformed.amountPaid.toString());
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const showStatusModal = (type: "success" | "error", title: string, message: string) => {
    setStatusModal({ type, title, message });
  };

  const handleStatusUpdate = async () => {
    if (!invoiceId || !selectedStatus) return;

    setIsUpdatingStatus(true);
    try {
      const payload: any = {
        status: selectedStatus.toLowerCase().replace("_payment", ""),
      };

      if (selectedStatus === "PARTIAL_PAYMENT" && amountPaid) {
        payload.amountPaid = parseFloat(amountPaid);
      }

      await api.patch(`/invoices/${invoiceId}/status`, payload);

      if (invoice) {
        const updatedInvoice = { ...invoice };
        updatedInvoice.status = selectedStatus;
        
        if (selectedStatus === "PARTIAL_PAYMENT" && amountPaid) {
          const paidAmount = parseFloat(amountPaid);
          updatedInvoice.amountPaid = paidAmount;
          updatedInvoice.balanceDue = updatedInvoice.totalAmount - paidAmount;
        }
        
        setInvoice(updatedInvoice);
      }

      showStatusModal("success", "Status updated", "Invoice status was updated successfully.");
    } catch (err: any) {
      showStatusModal(
        "error",
        "Update failed",
        err?.response?.data?.message || "Failed to update status"
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setSelectedStatus(newStatus);
    setShowAmountInput(newStatus === "PARTIAL_PAYMENT");
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmountPaid(value);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceId) return;

    try {
      setIsGeneratingPdf(true);
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${invoice?.userGeneratedInvoiceId || invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to download PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

const handleSendEmail = async (sendToAlternate: boolean = false) => {
  if (!invoiceId) return;

  try {
    setIsSendingEmail(true);

    let targetEmail = invoice.customerEmail;

    if (sendToAlternate && alternateEmail.trim()) {
      targetEmail = alternateEmail.trim();
    }

    const payload = { email: targetEmail };

    await api.post(`/invoices/${invoiceId}/send-email`, payload);

    setShowSuccessModal(true);
    setUseAlternateEmail(false);
    setAlternateEmail("");
  } catch (err: any) {
    alert(err?.response?.data?.message || "Failed to send email");
  } finally {
    setIsSendingEmail(false);
  }
};

  if (loading) return <div className="text-center py-12">Loading invoice...</div>;

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center px-4">
        <p className="text-red-600 text-lg">{error || "Invoice not found"}</p>
        <button onClick={() => router.push("/invoices")} className="mt-6 text-blue-600 hover:underline">
          ← Back to Invoices
        </button>
      </div>
    );
  }

// const isPremium = invoice.user.currentPlan === 2 || invoice.user.currentPlan === 3;
// Safely check if user is on a premium plan (plan 2 or 3)
// Recommended: Explicit and safe comparison
const isPremium = ["2", "3", 2, 3].includes(invoice.user.currentPlan);

  return (
    <div className="max-w-4xl mx-auto p-0">
      {statusModal && (
        <StatusUpdateModal
          isOpen={!!statusModal}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onClose={() => setStatusModal(null)}
          onCreateInvoice={() => {
            setStatusModal(null);
            router.push("/dashboard/invoices/create");
          }}
          onGoToReceipts={() => {
            setStatusModal(null);
            router.push("/dashboard/receipts");
          }}
        />
      )}
      <button
        onClick={() => window.history.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
      >
        <Icon src={ChevronLeftIcon} className="w-5 h-5" />
        Back
      </button>

      <ComponentCard title={`Invoice ${invoice.userGeneratedInvoiceId || invoice.invoiceId}`}>
        <div
          ref={contentRef}
          className="max-w-full mx-auto p-2 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
          style={{
            width: "210mm",
            boxSizing: "border-box",
            fontSize: "12pt",
            lineHeight: 1.2,
            fontFamily: "Arial, sans-serif",
          }}
        >
          {/* Company Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b pb-2 border-gray-200 dark:border-gray-700">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1F6F43]">
                {invoice.company.name}
              </h1>
              {invoice.company.tenantAddress && (
                <p className="text-gray-800 dark:text-gray-300">{invoice.company.tenantAddress}</p>
              )}
              <p className="text-gray-800 dark:text-gray-300">{invoice.company.email}</p>
              <p className="text-gray-800 dark:text-gray-300">{invoice.company.phone}</p>
              {invoice.company.taxId && (
                <p className="text-gray-800 dark:text-gray-300 font-semibold">Tax ID: {invoice.company.taxId}</p>
              )}
            </div>
            {invoice.company.logoUrl && (
              <img
                src={logoBase64 || invoice.company.logoUrl}
                alt="Company Logo"
                className="h-20 sm:h-28 object-contain mx-auto sm:mx-0"
              />
            )}
          </div>

          {/* Project & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">{invoice.projectName}</h2>
              <div className="mt-4 space-y-1">
                <p className="text-gray-600 dark:text-gray-400 font-medium">Bill To:</p>
                <p className="text-gray-800 dark:text-gray-200">{invoice.customerName}</p>
                {invoice.customerAddress && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
                    {invoice.customerAddress}
                  </p>
                )}
                {invoice.customerEmail && (
                  <p className="text-gray-600 dark:text-gray-400">{invoice.customerEmail}</p>
                )}
                {invoice.customerPhone && (
                  <p className="text-gray-600">{invoice.customerPhone}</p>
                )}
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-2xl sm:text-3xl font-bold">
                {formatMoney(invoice.totalAmount, invoice.currencySymbol)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Balance Due</p>
              <p className="text-lg sm:text-xl font-semibold text-orange-600">
                {formatMoney(invoice.balanceDue, invoice.currencySymbol)}
              </p>
            </div>
          </div>

          {/* Status Section */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-700 font-medium">Current Status:</span>
                  <StatusBadge status={invoice.status} />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <label htmlFor="status" className="text-gray-700 font-medium whitespace-nowrap">
                      Change Status:
                    </label>
                    <select
                      id="status"
                      value={selectedStatus}
                      onChange={handleStatusChange}
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    >
                      <option value="UNPAID">UNPAID</option>
                      <option value="PAID">PAID</option>
                      <option value="OVERDUE">OVERDUE</option>
                      <option value="PARTIAL_PAYMENT">PARTIAL PAYMENT</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleStatusUpdate}
                    disabled={isUpdatingStatus || selectedStatus === invoice.status}
                    className="w-full sm:w-auto"
                  >
                    {isUpdatingStatus ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>

              {showAmountInput && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
                  <div className="flex flex-col gap-3">
                    <label htmlFor="amountPaid" className="text-gray-700 font-medium">
                      Amount Paid ({invoice.currencySymbol}):
                    </label>
                    <input
                      type="text"
                      id="amountPaid"
                      value={amountPaid}
                      onChange={handleAmountPaidChange}
                      placeholder="Enter amount paid"
                      className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <div className="text-sm text-gray-600">
                      Total: {formatMoney(invoice.totalAmount, invoice.currencySymbol)}
                      {amountPaid && parseFloat(amountPaid) > 0 && (
                        <span className="ml-3">
                          Balance: {formatMoney(invoice.totalAmount - parseFloat(amountPaid), invoice.currencySymbol)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm mt-8">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Invoice Date</p>
              <p className="font-medium dark:text-gray-100">
                {new Date(invoice.invoiceDate).toLocaleDateString()}
              </p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Due Date</p>
                <p className="font-medium dark:text-gray-100">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-gray-500 dark:text-gray-400">Amount Paid</p>
              <p className="font-medium dark:text-gray-100">
                {formatMoney(invoice.amountPaid, invoice.currencySymbol)}
              </p>
            </div>
          </div>

          {/* Items & Totals Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse min-w-full sm:min-w-0">
              <thead>
                <tr className="border-b text-left text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-right">Unit Price</th>
                  <th className="py-2 px-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 px-3">{item.description}</td>
                    <td className="py-2 px-2 text-center">{item.quantity}</td>
                    <td className="py-2 px-2 text-right">
                      {formatMoney(item.unitPrice, invoice.currencySymbol)}
                    </td>
                    <td className="py-2 px-2 text-right font-medium">
                      {formatMoney(item.amount, invoice.currencySymbol)}
                    </td>
                  </tr>
                ))}

                <tr>
                  <td colSpan={3} className="py-2 px-3 text-right font-medium">Subtotal</td>
                  <td className="py-2 px-2 text-right">
                    {formatMoney(invoice.subtotal, invoice.currencySymbol)}
                  </td>
                </tr>

                {invoice.discountPercentage > 0 && (
                  <tr>
                    <td colSpan={3} className="py-2 px-3 text-right font-medium text-amber-700 dark:text-amber-400">
                      Discount ({invoice.discountPercentage}%)
                    </td>
                    <td className="py-2 px-2 text-right text-amber-700 dark:text-amber-400">
                      -{formatMoney(invoice.discountAmount, invoice.currencySymbol)}
                    </td>
                  </tr>
                )}

                <tr>
                  <td colSpan={3} className="py-2 px-3 text-right font-medium">
                    Subtotal after discount
                  </td>
                  <td className="py-2 px-2 text-right">
                    {formatMoney(invoice.subtotal - invoice.discountAmount, invoice.currencySymbol)}
                  </td>
                </tr>

                <tr>
                  <td colSpan={3} className="py-2 px-3 text-right font-medium">VAT ({invoice.taxPercentage}%)</td>
                  <td className="py-2 px-2 text-right">
                    {formatMoney(invoice.taxAmount, invoice.currencySymbol)}
                  </td>
                </tr>

                <tr className="bg-blue-100 dark:bg-blue-800 font-bold">
                  <td colSpan={3} className="py-3 px-3 text-right text-base">Grand Total</td>
                  <td className="py-3 px-2 text-right text-base">
                    {formatMoney(invoice.totalAmount, invoice.currencySymbol)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Details */}
          <div
            className="mt-6 p-4 rounded bg-green-50 dark:bg-green-900 text-gray-900 dark:text-gray-100"
            style={{ pageBreakInside: "avoid" }}
          >
            <h3 className="font-semibold mb-3 text-lg">Payment Details</h3>
            <div className="space-y-1">
              <p><strong>Account Name:</strong> {invoice.accountName}</p>
              <p><strong>Account Number:</strong> {invoice.accountNumber}</p>
              <p><strong>Bank:</strong> {invoice.bank}</p>
            </div>
          </div>

          {/* Notes + Signature */}
          <div style={{ marginTop: "16px", pageBreakInside: "avoid" }}>
            {invoice.notes && (
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ fontWeight: 600, fontSize: "16px", marginBottom: "8px" }}>Notes</h3>
                <p className="p-3 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 whitespace-pre-line">
                  {invoice.notes}
                </p>
              </div>
            )}

            {invoice.company.signatureUrl && (
              <div className="mt-6 flex flex-col items-center text-center">
                <img
                  src={signatureBase64 || invoice.company.signatureUrl}
                  alt="Authorized Signature"
                  style={{
                    height: "70px",
                    objectFit: "contain",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
                <p className="mt-2 text-[13px] text-gray-500">Authorized Signature</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons – FULL SECTION */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 pt-8 border-t mt-8">
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={() => handleSendEmail(false)}
              disabled={isSendingEmail || !invoice.customerEmail}
              className={
                `
                  w-full px-6 py-3 rounded-md text-white font-medium transition
                  bg-[#1F6F43] hover:bg-[#084e96] active:bg-[#0a55a8]
                  disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                `
              }
            >
              {isSendingEmail && !useAlternateEmail ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                `Send to ${invoice.customerEmail ?? "Customer Email"}`
              )}
            </button>

            {isPremium && (
              <div className="flex flex-col gap-3 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useAlternate"
                    checked={useAlternateEmail}
                    onChange={(e) => setUseAlternateEmail(e.target.checked)}
                    className="rounded border-gray-300 text-[#1F6F43] focus:ring-[#1F6F43]"
                    disabled={isSendingEmail}
                  />
                  <label htmlFor="useAlternate" className="text-sm font-medium cursor-pointer text-gray-700 dark:text-gray-300">
                    Send to alternate email (Premium Feature)
                  </label>
                </div>

                {useAlternateEmail && (
                  <div className="flex flex-col gap-3">
                    <input
                      type="email"
                      value={alternateEmail}
                      onChange={(e) => setAlternateEmail(e.target.value)}
                      placeholder="alternate@example.com"
                      className="
                        w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600
                        rounded-md focus:outline-none focus:ring-2 focus:ring-[#1F6F43]
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                      "
                      disabled={isSendingEmail}
                    />

                    <button
                      onClick={() => handleSendEmail(true)}
                      disabled={isSendingEmail || !alternateEmail.trim()}
                      className={
                        `
                          w-full px-6 py-3 rounded-md text-white font-medium transition
                          bg-green-600 hover:bg-green-700 active:bg-green-800
                          disabled:opacity-60 disabled:cursor-not-allowed
                          flex items-center justify-center gap-2
                        `
                      }
                    >
                      {isSendingEmail && useAlternateEmail ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        "Send to Alternate Email"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {invoice && <ShareButtons invoice={invoice} />}

            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="
                w-full sm:w-auto px-6 py-3
                border border-gray-300 dark:border-gray-600
                text-gray-700 dark:text-gray-300
                hover:bg-gray-50 dark:hover:bg-gray-800
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>
        </div>

        <EmailSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
        />
      </ComponentCard>
    </div>
  );
}