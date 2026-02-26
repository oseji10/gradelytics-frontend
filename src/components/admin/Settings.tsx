"use client";
import React, { useEffect, useState, useMemo } from "react";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import api from "../../../lib/api";

// Types
interface Currency {
  currencyId: number;
  currencyName: string;
  currencyCode: string;
  currencySymbol: string;
  country: string;
}

interface SubscriptionPlan {
  planId: number;
  planName: string;
  price: string;
  currency: number;
  features: string;
  isPopular: number;
  tenantLimit: number;
  invoiceLimit: number;
  flutterwavePlanId: string | null;
  currency_detail: Currency;
}

interface PaymentGateway {
  gatewayId: number;
  paymentGatewayName: string;
  url: string | null;
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="rounded-xl px-4 py-2 text-sm font-medium transition
                      disabled:cursor-not-allowed disabled:opacity-40
                      hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Previous
        </Button>

        {start > 1 && (
          <>
            <Button variant="secondary" onClick={() => onPageChange(1)}>
              1
            </Button>
            {start > 2 && <span className="px-3 py-2 text-gray-500">...</span>}
          </>
        )}

        {pageNumbers.map((page) => (
        <Button
          key={page}
          variant="secondary"
          onClick={() => onPageChange(page)}
          className={
            page === currentPage
              ? "!bg-[#1F6F43] !text-white shadow-sm"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }
        >
          {page}
        </Button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-3 py-2 text-gray-500">...</span>}
            <Button variant="secondary" onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="secondary"
          disabled={currentPage >= totalPages}
          onClick={() => {
            if (currentPage < totalPages) {
              onPageChange(currentPage + 1);
            }
          }}
          className={`min-w-[90px] transition
            ${currentPage >= totalPages
              ? "cursor-not-allowed opacity-40"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// Modal Component
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}


// Success Modal Component
function SuccessModal({
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Success
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

          <Button onClick={onClose} className="w-full">
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}

// Error Modal Component
function ErrorModal({ 
  isOpen, 
  message, 
  onClose 
}: { 
  isOpen: boolean; 
  message: string; 
  onClose: () => void 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h3 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Error
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 10;

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);

  // Pagination states
  const [currencyPage, setCurrencyPage] = useState(1);
  const [planPage, setPlanPage] = useState(1);
  const [gatewayPage, setGatewayPage] = useState(1);

  // Modals & forms
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false);


  // Notification modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");


  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);

  const [currencyForm, setCurrencyForm] = useState({
    currencyName: "",
    currencyCode: "",
    currencySymbol: "",
    country: "",
  });

  const [planForm, setPlanForm] = useState({
    planName: "",
    price: "",
    currency: 16,
    features: "",
    isPopular: 0,
    tenantLimit: 1,
    invoiceLimit: 10,
    flutterwavePlanId: "",
  });

  const [gatewayForm, setGatewayForm] = useState({
    paymentGatewayName: "",
    url: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [currRes, plansRes, gwRes] = await Promise.all([
          api.get("/currencies"),
          api.get("/subscription-plans"),
          api.get("/payment-gateways"),
        ]);

        setCurrencies(currRes.data);
        setPlans(plansRes.data);
        setGateways(gwRes.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Paginated data using useMemo for performance
  const paginatedCurrencies = useMemo(() => {
    const start = (currencyPage - 1) * ITEMS_PER_PAGE;
    return currencies.slice(start, start + ITEMS_PER_PAGE);
  }, [currencies, currencyPage]);

  const paginatedPlans = useMemo(() => {
    const start = (planPage - 1) * ITEMS_PER_PAGE;
    return plans.slice(start, start + ITEMS_PER_PAGE);
  }, [plans, planPage]);

  const paginatedGateways = useMemo(() => {
    const start = (gatewayPage - 1) * ITEMS_PER_PAGE;
    return gateways.slice(start, start + ITEMS_PER_PAGE);
  }, [gateways, gatewayPage]);

  const currencyTotalPages = Math.ceil(currencies.length / ITEMS_PER_PAGE);
  const planTotalPages = Math.ceil(plans.length / ITEMS_PER_PAGE);
  const gatewayTotalPages = Math.ceil(gateways.length / ITEMS_PER_PAGE);

  // Reset page to 1 when data changes (after add/edit/delete)
  useEffect(() => {
    setCurrencyPage(1);
    setPlanPage(1);
    setGatewayPage(1);
  }, [currencies.length, plans.length, gateways.length]);

   // Show success notification
  const showSuccess = (message: string) => {
    setNotificationMessage(message);
    setShowSuccessModal(true);
  };

  // Show error notification
  const showError = (message: string) => {
    setNotificationMessage(message);
    setShowErrorModal(true);
  };
  
  // Currency Modal Handler
  const openCurrencyModal = (currency?: Currency) => {
    if (currency) {
      setEditingCurrency(currency);
      setCurrencyForm({
        currencyName: currency.currencyName,
        currencyCode: currency.currencyCode,
        currencySymbol: currency.currencySymbol,
        country: currency.country,
      });
    } else {
      setEditingCurrency(null);
      setCurrencyForm({ currencyName: "", currencyCode: "", currencySymbol: "", country: "" });
    }
    setCurrencyModalOpen(true);
  };

  const saveCurrency = async () => {
    try {
      if (editingCurrency) {
        await api.patch(`/currencies/${editingCurrency.currencyId}`, currencyForm);
      } else {
        await api.post("/currencies", currencyForm);
      }
      setCurrencyModalOpen(false);
      const res = await api.get("/currencies");
      setCurrencies(res.data);
      showSuccess("Currency saved successfully!");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to save currency");
    }
  };

  // Plan Modal Handler
  const openPlanModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        planName: plan.planName,
        price: plan.price,
        currency: plan.currency,
        features: plan.features.replace(/"/g, "").replace(/\\u2717/g, "✗"),
        isPopular: plan.isPopular,
        tenantLimit: plan.tenantLimit,
        invoiceLimit: plan.invoiceLimit,
        flutterwavePlanId: plan.flutterwavePlanId || "",
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        planName: "",
        price: "",
        currency: 16,
        features: "",
        isPopular: 0,
        tenantLimit: 1,
        invoiceLimit: 10,
        flutterwavePlanId: "",
      });
    }
    setPlanModalOpen(true);
  };

  const savePlan = async () => {
    try {
      if (editingPlan) {
        await api.patch(`/subscription-plans/${editingPlan.planId}`, planForm);
      } else {
        await api.post("/subscription-plans", planForm);
      }
      setPlanModalOpen(false);
      const res = await api.get("/subscription-plans");
      setPlans(res.data);
      showSuccess("Subscription plan saved successfully!");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to save plan");
    }
  };

  // Gateway Modal Handler
  const openGatewayModal = (gateway?: PaymentGateway) => {
    if (gateway) {
      setEditingGateway(gateway);
      setGatewayForm({
        paymentGatewayName: gateway.paymentGatewayName,
        url: gateway.url || "",
      });
    } else {
      setEditingGateway(null);
      setGatewayForm({ paymentGatewayName: "", url: "" });
    }
    setGatewayModalOpen(true);
  };

  const saveGateway = async () => {
    try {
      if (editingGateway) {
        await api.patch(`/payment-gateways/${editingGateway.gatewayId}`, gatewayForm);
      } else {
        await api.post("/payment-gateways", gatewayForm);
      }
      setGatewayModalOpen(false);
      const res = await api.get("/payment-gateways");
      setGateways(res.data);
      showSuccess("Payment gateway saved successfully!");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to save gateway");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="w-full">
      <div className="mb-5">
        <h2 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Platform Configuration
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Manage currencies, pricing architecture, and payment infrastructure that power your billing engine.
        </p>
      </div>

      <div className="space-y-12">
        {/* Currencies Table */}
        {/* ===================== CURRENCIES ===================== */}
      <section>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  Currencies
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Define supported billing currencies across regions.
                </p>
              </div>

              <Button
                onClick={() => openCurrencyModal()}
                className="rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm !bg-[#1F6F43] hover:opacity-90"
              >
                Add Currency
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50/70 backdrop-blur dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Code</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Symbol</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Country</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {paginatedCurrencies.map((c) => (
                    <tr
                      key={c.currencyId}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    >
                      <td className="px-6 py-4 text-sm">{c.currencyName}</td>
                      <td className="px-6 py-4 text-sm font-mono">{c.currencyCode}</td>
                      <td className="px-6 py-4 text-sm">{c.currencySymbol}</td>
                      <td className="px-6 py-4 text-sm">{c.country}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openCurrencyModal(c)}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#1F6F43] hover:bg-blue-50 dark:hover:bg-gray-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currencyPage}
              totalPages={currencyTotalPages}
              onPageChange={setCurrencyPage}
            />
          </div>
        </div>
      </section>

      {/* ===================== PLANS ===================== */}
      <section>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  Subscription Plans
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Control pricing, limits, and growth tiers.
                </p>
              </div>

              <Button
                onClick={() => openPlanModal()}
                className="rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm !bg-[#1F6F43] hover:opacity-90"
              >
                Add Plan
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50/70 backdrop-blur dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Currency</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Tenants</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Invoices</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Popular</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {paginatedPlans.map((p) => (
                    <tr
                      key={p.planId}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    >
                      <td className="px-6 py-4 text-sm font-medium break-words">{p.planName}</td>
                      <td className="px-6 py-4 text-sm break-words">{p.currency_detail.currencySymbol}{p.price}</td>
                      <td className="px-6 py-4 text-sm break-words">{p.currency_detail.currencyCode}</td>
                      <td className="px-6 py-4 text-sm break-words">{p.tenantLimit === -1 ? "Unlimited" : p.tenantLimit}</td>
                      <td className="px-6 py-4 text-sm break-words">{p.invoiceLimit === -1 ? "Unlimited" : p.invoiceLimit}</td>
                      <td className="px-6 py-4 text-sm break-words">{p.isPopular ? "Yes" : "No"}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button
                          onClick={() => openPlanModal(p)}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#1F6F43] hover:bg-blue-50 dark:hover:bg-gray-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={planPage}
              totalPages={planTotalPages}
              onPageChange={setPlanPage}
            />
          </div>
        </div>
      </section>

      {/* ===================== GATEWAYS ===================== */}
      <section>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  Payment Gateways
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configure payment providers and integrations.
                </p>
              </div>

              <Button
                onClick={() => openGatewayModal()}
                className="rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm !bg-[#1F6F43] hover:opacity-90"
              >
                Add Gateway
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50/70 backdrop-blur dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">URL</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {paginatedGateways.map((g) => (
                    <tr
                      key={g.gatewayId}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    >
                      <td className="px-6 py-4 text-sm font-medium">{g.paymentGatewayName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{g.url || "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openGatewayModal(g)}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#1F6F43] hover:bg-blue-50 dark:hover:bg-gray-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={gatewayPage}
              totalPages={gatewayTotalPages}
              onPageChange={setGatewayPage}
            />
          </div>
        </div>
      </section>

      </div>

      {/* Currency Modal with plain HTML inputs */}
      <Modal
        isOpen={currencyModalOpen}
        onClose={() => setCurrencyModalOpen(false)}
        title={editingCurrency ? "Edit Currency" : "Add Currency"}
      >
        <div className="space-y-5">
          {/* Currency Name */}
          <div>
            <Label>Currency Name</Label>
            <input
              type="text"
              placeholder="e.g. Nigerian Naira"
              value={currencyForm.currencyName}
              onChange={(e) =>
                setCurrencyForm({
                  ...currencyForm,
                  currencyName: e.target.value,
                })
              }
              autoComplete="off"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition
                        focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[rgba(10,102,194,0.25)]
                        dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Currency Code */}
          <div>
            <Label>Currency Code</Label>
            <input
              type="text"
              placeholder="e.g. NGN"
              maxLength={3}
              value={currencyForm.currencyCode}
              onChange={(e) =>
                setCurrencyForm({
                  ...currencyForm,
                  currencyCode: e.target.value.toUpperCase(),
                })
              }
              autoComplete="off"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition
                        focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[rgba(10,102,194,0.25)]
                        dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Currency Symbol */}
          <div>
            <Label>Currency Symbol</Label>
            <input
              type="text"
              placeholder="e.g. ₦"
              value={currencyForm.currencySymbol}
              onChange={(e) =>
                setCurrencyForm({
                  ...currencyForm,
                  currencySymbol: e.target.value,
                })
              }
              autoComplete="off"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition
                        focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[rgba(10,102,194,0.25)]
                        dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Country */}
          <div>
            <Label>Country</Label>
            <input
              type="text"
              placeholder="e.g. Nigeria"
              value={currencyForm.country}
              onChange={(e) =>
                setCurrencyForm({
                  ...currencyForm,
                  country: e.target.value,
                })
              }
              autoComplete="off"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition
                        focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[rgba(10,102,194,0.25)]
                        dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setCurrencyModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={saveCurrency}
              className="!bg-[#1F6F43] !text-white hover:!bg-[#004182] focus:!ring-2 focus:!ring-[rgba(10,102,194,0.35)]"
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Plan Modal with plain HTML inputs */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={editingPlan ? "Edit Plan" : "Add Plan"}
      >
        <div className="space-y-4">
          <div>
            <Label>Plan Name</Label>
            <input
              type="text"
              placeholder="Enter plan name"
              value={planForm.planName}
              onChange={(e) =>
                setPlanForm({ ...planForm, planName: e.target.value })
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price</Label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter price"
                value={planForm.price}
                onChange={(e) =>
                  setPlanForm({ ...planForm, price: e.target.value })
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <Label>Currency</Label>
              <select
                value={planForm.currency}
                onChange={(e) =>
                  setPlanForm({ ...planForm, currency: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {currencies.map((c) => (
                  <option key={c.currencyId} value={c.currencyId}>
                    {c.currencyCode} - {c.currencyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Features (one per line)</Label>
            <textarea
              rows={5}
              placeholder="Enter one feature per line"
              value={planForm.features}
              onChange={(e) =>
                setPlanForm({ ...planForm, features: e.target.value })
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tenant Limit</Label>
              <input
                type="number"
                placeholder="Enter tenant limit"
                value={planForm.tenantLimit}
                onChange={(e) =>
                  setPlanForm({
                    ...planForm,
                    tenantLimit: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <Label>Invoice Limit</Label>
              <input
                type="number"
                placeholder="Enter invoice limit"
                value={planForm.invoiceLimit}
                onChange={(e) =>
                  setPlanForm({
                    ...planForm,
                    invoiceLimit: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="popular"
              checked={planForm.isPopular === 1}
              onChange={(e) =>
                setPlanForm({ ...planForm, isPopular: e.target.checked ? 1 : 0 })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="popular" className="!mb-0">
              Mark as Popular
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPlanModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={savePlan}
              className="!bg-[#1F6F43] !text-white hover:!bg-[#004182] focus:!ring-2 focus:!ring-[rgba(10,102,194,0.35)]"
            >
              Save Plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Gateway Modal with plain HTML inputs */}
      <Modal
        isOpen={gatewayModalOpen}
        onClose={() => setGatewayModalOpen(false)}
        title={editingGateway ? "Edit Gateway" : "Add Gateway"}
      >
        <div className="space-y-4">
          <div>
            <Label>Gateway Name</Label>
            <input
              type="text"
              placeholder="Enter gateway name"
              value={gatewayForm.paymentGatewayName}
              onChange={(e) =>
                setGatewayForm({ ...gatewayForm, paymentGatewayName: e.target.value })
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <Label>URL (optional)</Label>
            <input
              type="text"
              placeholder="Enter gateway URL"
              value={gatewayForm.url}
              onChange={(e) =>
                setGatewayForm({ ...gatewayForm, url: e.target.value })
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setGatewayModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveGateway}
              className="!bg-[#1F6F43] !text-white hover:!bg-[#004182] focus:!ring-2 focus:!ring-[rgba(10,102,194,0.35)]"
            >
              Save Gateway
            </Button>
          </div>
        </div>
      </Modal>

       {/* Success Notification Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        message={notificationMessage}
        onClose={() => setShowSuccessModal(false)}
      />

      {/* Error Notification Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        message={notificationMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  );
}