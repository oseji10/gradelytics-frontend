"use client";

import React, { useEffect, useMemo, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import api from "../../../lib/api";
import Icon from "@/components/Icons";

/* ---------------- types ---------------- */
interface Item {
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  // discountAmount removed — now global
}

interface Currency {
  currencyId: number;
  currencyName: string;
  currencyCode: string;
  currencySymbol: string;
}

interface Customer {
  customerId: number;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
}

/* ---------------- success modal ---------------- */
function InvoiceSuccessModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-2">Invoice Created</h3>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Your invoice has been created successfully.
        </p>
        <Button
          onClick={() => {
            onClose();
            window.history.back();
          }}
          className="w-full"
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}

function ErrorModal({ isOpen, message, onClose }: { isOpen: boolean; message: string; onClose: () => void }) {
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
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function CreateInvoicePage() {
  const tenantDefaultCurrencyId = "";
  const tenantDefaultCurrencySymbol = "";

  const [items, setItems] = useState<Item[]>([
    { itemDescription: "", quantity: 1, unitPrice: 0 },
  ]);

  const [form, setForm] = useState({
    userInvoiceId: "",
    projectName: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    taxPercentage: "",
    discountPercentage: "",     // ← new field
    amountPaid: 0,
    bank: "",
    accountName: "",
    accountNumber: "",
    notes: "",
    currency: tenantDefaultCurrencyId,
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
  });

  const [useCustomCurrency, setUseCustomCurrency] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  // ────────────────────────────────────────────────
  //  Load data
  // ────────────────────────────────────────────────
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await api.get("/customers/tenant");
        setCustomers(res.data);
      } catch {
        console.error("Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    };
    loadCustomers();
  }, []);

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const res = await api.get("/currencies");
        setCurrencies(res.data);
      } catch {
        console.error("Failed to load currencies");
      } finally {
        setLoadingCurrencies(false);
      }
    };
    loadCurrencies();
  }, []);

  // ────────────────────────────────────────────────
  //  Calculations
  // ────────────────────────────────────────────────
const calculations = useMemo(() => {
  let subTotal = 0;

  const lineItems = items.map(item => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const lineTotal = qty * price;

    subTotal += lineTotal;

    return { ...item, computedTotal: lineTotal };
  });

  const taxRate   = Number(form.taxPercentage)    || 0;
  const discRate  = Number(form.discountPercentage) || 0;

  // ─── NEW ORDER: discount first, then tax ───
  const discountAmount = subTotal * (discRate / 100);
  const subTotalAfterDiscount = Math.max(0, subTotal - discountAmount);

  const taxAmount = subTotalAfterDiscount * (taxRate / 100);
  const grandTotal = subTotalAfterDiscount + taxAmount;

  const balanceDue = grandTotal - Number(form.amountPaid || 0);

  return {
    lineItems,
    subTotal,
    discountAmount,
    discountPercentage: discRate,
    taxAmount,
    grandTotal,
    balanceDue,
  };
}, [items, form.taxPercentage, form.discountPercentage, form.amountPaid]);
  // ────────────────────────────────────────────────
  //  Item handlers
  // ────────────────────────────────────────────────
  const addItem = () =>
    setItems([...items, { itemDescription: "", quantity: 1, unitPrice: 0 }]);

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof Item, value: string | number) => {
    const updated = [...items];
    if (field === "quantity" || field === "unitPrice") {
      updated[index][field] = Number(value) || 0;
    } else {
      updated[index][field] = value as string;
    }
    setItems(updated);
  };

  // ────────────────────────────────────────────────
  //  Add customer
  // ────────────────────────────────────────────────
  const handleAddCustomer = async () => {
    if (!newCustomer.customerName.trim()) {
      setErrorMessage("Customer name is required");
      return;
    }

    setIsAddingCustomer(true);
    try {
      const res = await api.post("/customers/tenant", newCustomer);
      setCustomers((prev) => [...prev, res.data]);
      setSelectedCustomerId(res.data.customerId);
      setShowAddCustomer(false);
      setNewCustomer({ customerName: "", customerPhone: "", customerEmail: "", customerAddress: "" });
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Failed to add customer");
    } finally {
      setIsAddingCustomer(false);
    }
  };

  // ────────────────────────────────────────────────
  //  Submit
  // ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        invoiceId: `INV-${Date.now()}`,
        userGeneratedInvoiceId: form.userInvoiceId || null,
        projectName: form.projectName,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || null,
        customerId: selectedCustomerId,
        taxPercentage: form.taxPercentage || null,
        discountPercentage: form.discountPercentage || null,     // ← added
        amountPaid: Number(form.amountPaid) || 0,
        currency: useCustomCurrency ? Number(form.currency) : undefined,
        bank: form.bank,
        accountName: form.accountName,
        accountNumber: form.accountNumber,
        notes: form.notes,
        items: calculations.lineItems.map(item => ({
          itemDescription: item.itemDescription,
          quantity: item.quantity,
          amount: item.unitPrice,
          // discountAmount removed from line items
        })),
      };

      await api.post("/invoices", payload);
      setShowSuccessModal(true);
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || "Something went wrong while creating the invoice"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (value: number) => {
    return `${new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2 }).format(value)}`;
  };

  // ────────────────────────────────────────────────
  //  Render
  // ────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => history.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm"
      >
        <Icon src={ChevronLeftIcon} className="w-5 h-5" />
        Return
      </button>

      {/* User Notes */}
      <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded flex items-center gap-2">
        <span className="text-lg">ℹ️</span>
        <p className="text-sm text-blue-800 dark:text-blue-200">Fill all required fields, add a customer, include items, and bank details. Tax & balance calculate automatically.</p>
      </div>

      <ComponentCard title="Create Invoice">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice ID */}
          <div>
            <Label>Invoice ID (Optional. System will auto-generate if you leave blank)</Label>
            <Input
              value={form.userInvoiceId}
              placeholder="E.g. INV-0001"
              onChange={(e) => setForm({ ...form, userInvoiceId: e.target.value })}
            />
          </div>

          {/* Project */}
          <div>
            <Label>Project / Title</Label>
            <Input
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              required
              placeholder="The title or name of this invoice"
            />
          </div>

          {/* Customer */}
          <div>
            <Label>Bill To (Customer)</Label>
            <div className="flex gap-3">
              <select
                className="w-full px-4 py-3 border rounded-lg"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">{loadingCustomers ? "Loading..." : "Select customer"}</option>
                {customers.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.customerName}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" onClick={() => setShowAddCustomer(true)}>
                + Add
              </Button>
            </div>
          </div>

          {/* ────────────── Items ────────────── */}
          <div>
            <Label>Invoice Items</Label>

            {items.map((item, i) => {
              const line = calculations.lineItems[i];
              return (
                <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3 items-end">
                  {/* Description */}
<div className="md:col-span-2">
  <Input
    placeholder="Description"
    value={item.itemDescription}
    onChange={(e) => updateItem(i, "itemDescription", e.target.value)}
    required
  />
</div>

{/* Qty – smaller */}
<div className="md:col-span-1 max-w-[150px]">
  <Label className="text-xs">Qty</Label>
  <Input
    type="number"
    min="1"
    step="1"
    value={item.quantity}
    onChange={(e) => updateItem(i, "quantity", e.target.value)}
    required
    placeholder="1"
  />
</div>

{/* Unit price + total + remove */}
<div className="md:col-span-2 flex items-center gap-2">
  <div className="flex-1">
    <Label className="text-xs">Unit Price</Label>
    <Input
      type="number"
      step="0.01"
      min="0"
      value={item.unitPrice}
      placeholder="0"
      onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
      required
    />
  </div>

  <div className="text-right min-w-[100px] text-sm font-medium text-gray-700 dark:text-gray-300">
    {/* formatMoney({line.computedTotal.toFixed(2)})} */}
    {formatMoney(line.computedTotal)}
  </div>

  {items.length > 1 && (
    <button
      type="button"
      onClick={() => removeItem(i)}
      className="text-red-600 text-xl pb-2"
    >
      ×
    </button>
  )}
</div>

                </div>
              );
            })}

            <button
              type="button"
              onClick={addItem}
              className="mt-3 text-sm text-brand-500 hover:underline"
            >
              + Add item
            </button>
          </div>

          {/* Tax, Discount & Payment – now on same row */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Label>Discount %</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                value={form.discountPercentage}
                onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
              />
            </div>
            <div>
              <Label>Tax % (e.g. 7.5)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={form.taxPercentage}
                onChange={(e) => setForm({ ...form, taxPercentage: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Amount Paid</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amountPaid}
                onChange={(e) => setForm({ ...form, amountPaid: Number(e.target.value) || 0 })}
                placeholder="Amount Paid"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg text-sm space-y-1.5">
  <div className="flex justify-between">
    <span>Subtotal:</span>
    
    <span>{formatMoney(calculations.subTotal)}</span>
  </div>

  <div className="flex justify-between text-amber-700 dark:text-amber-400">
    <span>Discount ({form.discountPercentage || 0}%):</span>
    <span>-{formatMoney(calculations.discountAmount)}</span>
  </div>

  <div className="flex justify-between">
    <span>Subtotal after discount:</span>
    <span>{formatMoney((calculations.subTotal - calculations.discountAmount))}</span>
  </div>

  <div className="flex justify-between">
    <span>Tax ({form.taxPercentage || 0}%):</span>
    <span>{formatMoney(calculations.taxAmount)}</span>
  </div>

  <div className="flex justify-between pt-3 border-t font-semibold text-base">
    <span>Grand Total:</span>
    <span>{formatMoney(calculations.grandTotal)}</span>
  </div>

  <div className="flex justify-between text-green-700 dark:text-green-400 font-medium">
    <span>Balance Due:</span>
    <span>{formatMoney(calculations.balanceDue)}</span>
  </div>
</div>

          {/* Bank Details */}
          <div className="grid md:grid-cols-3 gap-6">
            <input
              placeholder="Bank"
              value={form.bank}
              onChange={(e) => setForm({ ...form, bank: e.target.value })}
              required
              className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
            />
            <input
              placeholder="Account Name"
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              required
              className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
            />
            <input
              placeholder="Account Number"
              value={form.accountNumber}
              inputMode="numeric"
              autoComplete="off"
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                setForm({ ...form, accountNumber: digitsOnly });
              }}
              required
              className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
            />
          </div>

          {/* Notes */}
          <textarea
            className="w-full p-3 border rounded"
            placeholder="Notes / Payment instructions (optional)"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <Button
            type="submit"
            disabled={isSubmitting || isAddingCustomer}
            className="w-full md:w-auto !bg-[#1F6F43] hover:!bg-[#004182]" 
          >
            {isSubmitting ? "Creating..." : isAddingCustomer ? "Adding Customer..." : "Create Invoice"}
          </Button>
        </form>
      </ComponentCard>

      {/* Modals */}
      <InvoiceSuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
      <ErrorModal isOpen={!!errorMessage} message={errorMessage!} onClose={() => setErrorMessage(null)} />

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Add New Customer</h3>

            <Input
              placeholder="Customer Name *"
              value={newCustomer.customerName}
              onChange={(e) => setNewCustomer({ ...newCustomer, customerName: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={newCustomer.customerPhone ?? ""}
              onChange={(e) => setNewCustomer({ ...newCustomer, customerPhone: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={newCustomer.customerEmail ?? ""}
              onChange={(e) => setNewCustomer({ ...newCustomer, customerEmail: e.target.value })}
            />
            <textarea
              className="w-full p-3 border rounded"
              placeholder="Address"
              value={newCustomer.customerAddress ?? ""}
              onChange={(e) => setNewCustomer({ ...newCustomer, customerAddress: e.target.value })}
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddCustomer(false)} disabled={isAddingCustomer}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomer} disabled={isAddingCustomer}>
                {isAddingCustomer ? "Saving..." : "Save Customer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}