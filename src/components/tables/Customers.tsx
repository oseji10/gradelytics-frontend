// app/customers/page.tsx
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
import { ChevronLeftIcon, MailIcon, PlusIcon } from "@/icons";
import api from "../../../lib/api";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icons";

interface Customer {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  created_at: string;
}


function AddCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCustomer: Customer) => void;
}) {
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.customerName.trim()) {
      setError("Customer name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/customers/tenant", {
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim() || null,
        customerPhone: form.customerPhone.trim() || null,
        customerAddress: form.customerAddress.trim() || null,
      });

      onSuccess(res.data);
      onClose();
      // Reset form
      setForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add customer.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 ring-1 ring-black/5 dark:ring-white/10">
        <h3 className="text-xl font-semibold mb-5">Add New Customer</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
              placeholder="john@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
              placeholder="+1 (555) 123-4567"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              value={form.customerAddress}
              onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
              placeholder="123 Main St, City, Country"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.customerName.trim()}
            className="!bg-[#1F6F43] hover:!bg-[#084d93]"
          >
            {loading ? "Adding..." : "Add Customer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Success Modal for Email Sent
function EmailSuccessModal({
  isOpen,
  message,
  onClose,
}: {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Email Sent!</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <Button onClick={onClose} className="w-full !bg-[#1F6F43] hover:!bg-[#084d93]">
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}

// Error Modal for Email Failure
function EmailErrorModal({
  isOpen,
  message,
  onClose,
}: {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to Send</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Selection for bulk actions
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());

  // View Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Single Email Modal
  const [isSingleEmailModalOpen, setIsSingleEmailModalOpen] = useState(false);
  const [singleEmailCustomer, setSingleEmailCustomer] = useState<Customer | null>(null);
  const [singleSubject, setSingleSubject] = useState("");
  const [singleMessage, setSingleMessage] = useState("");
  const [useAlternateEmail, setUseAlternateEmail] = useState(false);
  const [alternateEmail, setAlternateEmail] = useState("");

  // Bulk Email Modal
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");

  // Success/Error states for emails
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showEmailError, setShowEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState("");

  const [sendingSingle, setSendingSingle] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);


  const isPremiumUser = true;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get("/customers");
        setCustomers(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]); // Add to top
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

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

  const toggleCustomerSelection = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    newSelected.has(customerId) ? newSelected.delete(customerId) : newSelected.add(customerId);
    setSelectedCustomers(newSelected);
  };

  const selectAll = () => {
    setSelectedCustomers(
      selectedCustomers.size === customers.length && customers.length > 0
        ? new Set()
        : new Set(customers.map(c => c.customerId))
    );
  };

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewModalOpen(true);
  };

  const openSingleEmailModal = (customer: Customer) => {
    setSingleEmailCustomer(customer);
    setSingleSubject(`Hello ${customer.customerName}`);
    setSingleMessage(`Dear ${customer.customerName},\n\n`);
    setUseAlternateEmail(false);
    setAlternateEmail("");
    setIsSingleEmailModalOpen(true);
  };

  const openBulkEmailModal = () => {
    const ids = selectedCustomers.size > 0
      ? Array.from(selectedCustomers)
      : customers.map(c => c.customerId);

    if (ids.length === 0) {
      setEmailErrorMessage("No customers available to email.");
      setShowEmailError(true);
      return;
    }

    setBulkSubject("");
    setBulkMessage("Dear Customers,\n\n");
    setIsBulkEmailModalOpen(true);
  };

  const handleSendSingleEmail = async () => {
    if (!singleSubject.trim() || !singleMessage.trim()) {
      setEmailErrorMessage("Please provide subject and message.");
      setShowEmailError(true);
      return;
    }

    if (useAlternateEmail && !alternateEmail.trim()) {
      setEmailErrorMessage("Please enter an alternate email address.");
      setShowEmailError(true);
      return;
    }

    setSendingSingle(true);
    try {
      const payload: any = {
        subject: singleSubject,
        message: singleMessage,
      };

      if (useAlternateEmail && alternateEmail.trim()) {
        payload.alternateEmail = alternateEmail.trim();
      }

      await api.post(`/customers/${singleEmailCustomer?.customerId}/send-email`, payload);

      setSuccessMessage("Email sent successfully!");
      setShowEmailSuccess(true);
      setIsSingleEmailModalOpen(false);
      setSingleSubject("");
      setSingleMessage("");
      setSingleEmailCustomer(null);
      setUseAlternateEmail(false);
      setAlternateEmail("");
    } catch (err: any) {
      setEmailErrorMessage(err?.response?.data?.message || "Failed to send email.");
      setShowEmailError(true);
    } finally {
      setSendingSingle(false);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!bulkSubject.trim() || !bulkMessage.trim()) {
      setEmailErrorMessage("Please provide subject and message.");
      setShowEmailError(true);
      return;
    }

    const customerIds = selectedCustomers.size > 0
      ? Array.from(selectedCustomers)
      : customers.map(c => c.customerId);

    setSendingBulk(true);
    try {
      await api.post("/customers/broadcast-email", {
        customerIds,
        subject: bulkSubject,
        message: bulkMessage,
      });

      setSuccessMessage(`Broadcast sent to ${customerIds.length} customer(s)!`);
      setShowEmailSuccess(true);
      setIsBulkEmailModalOpen(false);
      setBulkSubject("");
      setBulkMessage("");
      setSelectedCustomers(new Set());
    } catch (err: any) {
      setEmailErrorMessage(err?.response?.data?.message || "Failed to send broadcast.");
      setShowEmailError(true);
    } finally {
      setSendingBulk(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="space-y-3 px-2 py-3 md:px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Icon src={ChevronLeftIcon} className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Customers
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setIsAddCustomerOpen(true)}
              className="flex items-center justify-center gap-2 !bg-green-600 hover:!bg-green-700 w-full sm:w-auto"
            >
              <Icon src={PlusIcon} className="w-4 h-4" />
              Add Customer
            </Button>

            {customers.length > 0 && (
              <Button
                onClick={openBulkEmailModal}
                disabled={customers.length === 0}
                className="!bg-[#1F6F43] hover:!bg-[#084d93] flex items-center gap-2 w-full sm:w-auto"
              >
                <Icon src={MailIcon} className="w-4 h-4" />
                {selectedCustomers.size > 0
                  ? `Email Selected (${selectedCustomers.size})`
                  : "Broadcast Email"}
              </Button>
            )}
          </div>
        </div>

        {/* Selection Info */}
        {customers.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedCustomers.size > 0
              ? `${selectedCustomers.size} customer${selectedCustomers.size > 1 ? 's' : ''} selected`
              : `${customers.length} total customer${customers.length > 1 ? 's' : ''}`}
          </div>
        )}

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-2">
          {loading ? (
            <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">Loading customers...</div>
          ) : error ? (
            <div className="text-center py-6 text-sm text-red-600">{error}</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
              No customers found.{" "}
              <Button onClick={() => router.push("/customers/create")} variant="outline" className="mt-4">
                Add Customer
              </Button>
            </div>
          ) : (
            customers.map((customer) => (
              <div
                key={customer.customerId}
                className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.customerId)}
                      onChange={() => toggleCustomerSelection(customer.customerId)}
                      className="rounded mt-1"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {customer.customerName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {customer.customerEmail || "No email"}
                      </p>
                    </div>
                  </div>
                  <ViewButton onClick={() => openViewModal(customer)} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2 border-gray-200 dark:border-white/[0.08]">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Phone</span>
                    <p className="text-gray-900 dark:text-gray-100">{customer.customerPhone || "—"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Added</span>
                    <p className="text-gray-900 dark:text-gray-100">{formatDate(customer.created_at)}</p>
                  </div>
                </div>

                {customer.customerEmail && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-white/[0.08]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSingleEmailModal(customer)}
                      className="flex items-center gap-1"
                    >
                      <Icon src={MailIcon} className="w-3 h-3" />
                      Email
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03]">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="border-b border-gray-200 dark:border-white/[0.08]">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.size === customers.length && customers.length > 0}
                        onChange={selectAll}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Name
                    </TableCell>
                    <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Email
                    </TableCell>
                    <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Phone
                    </TableCell>
                    <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Added
                    </TableCell>
                    <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-200 dark:divide-white/[0.08]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Loading customers...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-4 text-center text-sm text-red-600">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No customers found.{" "}
                        <Button onClick={() => router.push("/customers/create")} variant="outline">
                          Add Customer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow key={customer.customerId} className="hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                        <TableCell className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.has(customer.customerId)}
                            onChange={() => toggleCustomerSelection(customer.customerId)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.customerName}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-xs text-gray-600 dark:text-gray-400">
                          {customer.customerEmail || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-xs text-gray-600 dark:text-gray-400">
                          {customer.customerPhone || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(customer.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-2">
                            <ViewButton onClick={() => openViewModal(customer)} />
                            {customer.customerEmail && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openSingleEmailModal(customer)}
                                className="flex items-center gap-1"
                              >
                                <Icon src={MailIcon} className="w-3 h-3" />
                                Email
                              </Button>
                            )}
                          </div>
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

      {/* Modals remain unchanged */}
      {viewModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold">{selectedCustomer.customerName}</h2>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Email:</span>
                <p className="mt-1">{selectedCustomer.customerEmail || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Phone:</span>
                <p className="mt-1">{selectedCustomer.customerPhone || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Address:</span>
                <p className="mt-1 whitespace-pre-line">{selectedCustomer.customerAddress || "—"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Added:</span>
                <p className="mt-1">{formatDate(selectedCustomer.created_at)}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Button
                onClick={() =>
                  router.push(
                    `/dashboard/customer-invoices-and-receipts?customerId=${selectedCustomer.customerId}`
                  )
                }
                className="!bg-[#1F6F43] hover:!bg-[#084d93]"
              >
                View All Invoices & Receipts
              </Button>

              <Button variant="outline" onClick={() => setViewModalOpen(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Single & Bulk Email Modals + Success/Error Modals remain exactly the same */}
      {isSingleEmailModalOpen && singleEmailCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Send Email to {singleEmailCustomer.customerName}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={singleSubject}
                  onChange={(e) => setSingleSubject(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={singleMessage}
                  onChange={(e) => setSingleMessage(e.target.value)}
                  rows={8}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {isPremiumUser && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useAlternate"
                      checked={useAlternateEmail}
                      onChange={(e) => setUseAlternateEmail(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="useAlternate" className="text-sm font-medium cursor-pointer">
                      Send to alternate email address (Premium)
                    </label>
                  </div>
                  {useAlternateEmail && (
                    <input
                      type="email"
                      value={alternateEmail}
                      onChange={(e) => setAlternateEmail(e.target.value)}
                      placeholder="alternate@example.com"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsSingleEmailModalOpen(false)} disabled={sendingSingle}>
                Cancel
              </Button>
              <Button
                onClick={handleSendSingleEmail}
                disabled={sendingSingle || !singleSubject.trim() || !singleMessage.trim()}
                className="!bg-[#1F6F43] hover:!bg-[#084d93]"
              >
                {sendingSingle ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isBulkEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedCustomers.size > 0 ? `Email ${selectedCustomers.size} Selected Customer(s)` : "Broadcast Email to All Customers"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={bulkSubject}
                  onChange={(e) => setBulkSubject(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter subject..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  rows={8}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsBulkEmailModalOpen(false)} disabled={sendingBulk}>
                Cancel
              </Button>
              <Button
                onClick={handleSendBulkEmail}
                disabled={sendingBulk || !bulkSubject.trim() || !bulkMessage.trim()}
                className="!bg-[#1F6F43] hover:!bg-[#084d93]"
              >
                {sendingBulk ? "Sending..." : "Send Broadcast"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <EmailSuccessModal
        isOpen={showEmailSuccess}
        message={successMessage}
        onClose={() => setShowEmailSuccess(false)}
      />

      <EmailErrorModal
        isOpen={showEmailError}
        message={emailErrorMessage}
        onClose={() => setShowEmailError(false)}
      />

      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={handleCustomerAdded}
      />
    </div>
  );
}