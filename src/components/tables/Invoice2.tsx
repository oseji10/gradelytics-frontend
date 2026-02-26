// app/invoice/page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
// import html2pdf from 'html2pdf.js';
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import api from "../../../lib/api";
import { ChevronLeftIcon } from "@/icons";
import Icon from "@/components/Icons";

const html2pdf = typeof window !== 'undefined' ? require('html2pdf.js') : null;

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

// TYPES
interface FullInvoice {
  invoiceId: string;
  userGeneratedInvoiceId?: string | null;
  projectName: string;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currencySymbol: string;
  status: string;
  invoiceDate: string;
  dueDate?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  accountName: string;
  accountNumber: string;
  bank: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  notes?: string;
  company: {
    name: string;
    email: string;
    phone: string;
    logoUrl: string;
    signatureUrl: string;
  };
  user: {
    currentPlan: number | string;
  };
}

// Status Badge
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

// Share Buttons (kept almost original, removed pdfBlob dependency for simplicity)
const ShareButtons = ({ invoice }: { invoice: FullInvoice }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareableLink, setShareableLink] = useState<string>("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareableLink(window.location.href);
    }
  }, []);

  const formatMoney = (value: number, symbol: string = "₦") => {
    return `${symbol} ${new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2 }).format(value)}`;
  };

  const getShareMessage = () => {
    return `Invoice ${invoice.userGeneratedInvoiceId || invoice.invoiceId}\nFrom: ${invoice.company.name}\nTo: ${invoice.customerName}\nAmount: ${formatMoney(invoice.totalAmount, invoice.currencySymbol)}\nStatus: ${invoice.status}\nView: ${shareableLink}`;
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      alert('Link copied!');
    } catch {
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

// ────────────────────────────────────────────────────────────────

export default function InvoiceViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");

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

  const [logoBase64, setLogoBase64] = useState<string>("");
const [signatureBase64, setSignatureBase64] = useState<string>("");

  const contentRef = useRef<HTMLDivElement>(null);

  // Add this helper function near the top of the file
const getBase64Image = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to load image as base64:", err);
    return ""; // fallback to empty
  }
};

  const formatMoney = (value: number, symbol: string = "₦") => {
    return `${symbol} ${new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2 }).format(value)}`;
  };

  // In fetchInvoice, after setting invoice:
useEffect(() => {
  if (!invoice) return;

  const loadImages = async () => {
  if (invoice.company.logoUrl) {
    try {
      const base64 = await getBase64Image(invoice.company.logoUrl);
      console.log("Logo base64:", base64.substring(0, 50) + "..."); // check if real data
      setLogoBase64(base64);
    } catch (err) {
      console.error("Logo base64 failed:", err);
    }
  }
  // same for signature
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
        const res = await api.get(`/invoices/${invoiceId}`);
        const raw = Array.isArray(res.data) ? res.data[0] : res.data;

        if (!raw || !raw.tenant) throw new Error("Invoice or company data not found");

        const items = raw.items.map((item: any) => ({
          description: item.itemDescription,
          amount: parseFloat(item.amount),
        }));

        const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
        const taxPercentage = parseFloat(raw.taxPercentage || "0");
        const taxAmount = subtotal * (taxPercentage / 100);
        const totalAmount = subtotal + taxAmount;
        const amountPaidVal = parseFloat(raw.amountPaid || "0");
        const balanceDue = totalAmount - amountPaidVal;

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
          taxPercentage,
          taxAmount,
          totalAmount,
          amountPaid: amountPaidVal,
          balanceDue,
          currencySymbol: raw.currency_detail?.currencySymbol || "₦",
          status: raw.status.toUpperCase(),
          invoiceDate: raw.invoiceDate,
          dueDate: raw.dueDate,
          customerName: raw.customer?.customerName || raw.accountName,
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
        const updated = { ...invoice };
        updated.status = selectedStatus;
        if (selectedStatus === "PARTIAL_PAYMENT" && amountPaid) {
          const paid = parseFloat(amountPaid);
          updated.amountPaid = paid;
          updated.balanceDue = updated.totalAmount - paid;
        }
        setInvoice(updated);
      }

      alert("Status updated successfully!");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update status");
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
    if (/^\d*\.?\d*$/.test(value)) setAmountPaid(value);
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current || !invoice) return;

    setIsGeneratingPdf(true);

    const element = contentRef.current;

    const opt = {
      margin:       [1, 1, 1, 1],
      filename:     `Invoice_${invoice.userGeneratedInvoiceId || invoice.invoiceId}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
    html2canvas: {
    scale: 1,                         // ← reduced from 2 → better fit, less cutoff
    useCORS: true,
    logging: false, 
    windowWidth: 794,                    // keep true for now to debug
    backgroundColor: null,                 // ← A4 at 96dpi (very important!)
    // This helps force content to respect page width
    width: 794,
    height: 1723,
    
    ignoreElements: (el) => {
      // Hide elements with lab colors (extreme measure)
      if (getComputedStyle(el).backgroundColor.includes('lab(')) {
        return true;
      }
      return false;
    }
  },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
  pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf()
        .from(element)
        .set(opt)
        .save();
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendEmail = async (sendToAlternate: boolean = false) => {
    if (!invoiceId) return;

    try {
      setIsSendingEmail(true);

      let targetEmail = invoice?.customerEmail;

      if (sendToAlternate && alternateEmail.trim()) {
        targetEmail = alternateEmail.trim();
      }

      if (!targetEmail) throw new Error("No email address available");

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

  const isPremium = ["2", "3", 2, 3].includes(invoice?.user.currentPlan ?? "");

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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => window.history.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
      >
        <Icon src={ChevronLeftIcon} className="w-5 h-5"/>
        Back
      </button>

      <ComponentCard title={`Invoice ${invoice.userGeneratedInvoiceId || invoice.invoiceId}`}>
        {/* This div is what will be converted to PDF */}
       <div
  ref={contentRef}
  // className="bg-white p-8 md:p-10 print:p-8"
  className="bg-white p-8 md:p-10 print:p-8 text-base"
  style={{
    width: '210mm',                     // ← exact A4 width
    minHeight: '297mm',                 // ← minimum A4 height
    maxWidth: '210mm',                  // ← prevent overflow
    boxSizing: 'border-box',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',                 // ← helps contain overflowing elements
  }}
>
          {/* Company Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b pb-8">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1F6F43]">{invoice.company.name}</h1>
              <p className="text-gray-600">{invoice.company.email}</p>
              <p className="text-gray-600">{invoice.company.phone}</p>
            </div>
            {invoice.company.logoUrl && (
  <img
    src={logoBase64 || invoice.company.logoUrl}
    alt="Company Logo"
    className="h-24 sm:h-32 object-contain mx-auto sm:mx-0"
  />
)}
          </div>

          {/* Project & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">{invoice.projectName}</h2>
              <div className="mt-4 space-y-1">
                <p className="text-gray-600 font-medium">Bill To:</p>
                <p className="text-gray-800">{invoice.customerName}</p>
                {invoice.customerAddress && (
                  <p className="text-gray-600 text-sm whitespace-pre-line">{invoice.customerAddress}</p>
                )}
                {invoice.customerEmail && <p className="text-gray-600">{invoice.customerEmail}</p>}
                {invoice.customerPhone && <p className="text-gray-600">{invoice.customerPhone}</p>}
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-2xl sm:text-3xl font-bold">
                {formatMoney(invoice.totalAmount, invoice.currencySymbol)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Balance Due</p>
              <p className="text-lg sm:text-xl font-semibold text-orange-600">
                {formatMoney(invoice.balanceDue, invoice.currencySymbol)}
              </p>
            </div>
          </div>

          {/* Status Section */}
          <div className="bg-gray-50 p-4 rounded-lg mt-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
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
                <div className="p-4 bg-blue-50 rounded border border-blue-200">
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
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <p className="text-gray-500">Invoice Date</p>
              <p className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-gray-500">Due Date</p>
                <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Amount Paid</p>
              <p className="font-medium">{formatMoney(invoice.amountPaid, invoice.currencySymbol)}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mt-8">
            <table className="w-full border-collapse min-w-full sm:min-w-0">
              <thead>
                <tr className="border-b text-left text-gray-600 bg-gray-50">
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-4 px-2">{item.description}</td>
                    <td className="py-4 px-2 text-right font-medium">
                      {formatMoney(item.amount, invoice.currencySymbol)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-3 px-2 text-right font-medium">Subtotal</td>
                  <td className="py-3 px-2 text-right">{formatMoney(invoice.subtotal, invoice.currencySymbol)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 text-right font-medium">Tax ({invoice.taxPercentage}%)</td>
                  <td className="py-3 px-2 text-right">{formatMoney(invoice.taxAmount, invoice.currencySymbol)}</td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="py-4 px-2 text-right font-bold text-lg">Total</td>
                  <td className="py-4 px-2 text-right font-bold text-xl">
                    {formatMoney(invoice.totalAmount, invoice.currencySymbol)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

{/* Payment Details - inline critical styles */}
<div 
  style={{
    backgroundColor: '#f0fdf4',        // exact bg-green-50
    padding: '24px',
    borderRadius: '8px',
    marginTop: '32px',
    minHeight: '140px',
    pageBreakBefore: 'always',
  }}
>
  <h3 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '18px' }}>
    Payment Details
  </h3>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#1f2937' }}>
    <p><strong>Account Name:</strong> {invoice.accountName}</p>
    <p><strong>Account Number:</strong> {invoice.accountNumber}</p>
    <p><strong>Bank:</strong> {invoice.bank}</p>
  </div>
</div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8">
              <h3 className="font-semibold text-lg mb-2">Notes</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded">{invoice.notes}</p>
            </div>
          )}

          {/* Signature */}
        {invoice.company.signatureUrl && (
  <div className="mt-12 flex justify-center sm:justify-end">
    <div className="text-center">
      <img
        src={signatureBase64 || invoice.company.signatureUrl}
        alt="Authorized Signature"
        className="h-20 object-contain"
      />
      <p className="text-sm text-gray-600 mt-2">Authorized Signature</p>
    </div>
  </div>
)}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-8 border-t">
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={() => handleSendEmail(false)}
              disabled={isSendingEmail || !invoice.customerEmail}
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
                  Sending...
                </>
              ) : (
                `Send to ${invoice.customerEmail ?? "Customer Email"}`
              )}
            </button>

            {isPremium && (
              <div className="flex flex-col gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
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
                      className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          Sending...
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

          <ShareButtons invoice={invoice} />

          <Button
            variant="outline"
            onClick={handleDownloadPDF}
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
      </ComponentCard>
    </div>
  );
}