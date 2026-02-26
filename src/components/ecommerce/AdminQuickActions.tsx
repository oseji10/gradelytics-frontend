"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faTags,
  faComments,
  faUsers,
  faFileInvoiceDollar,
  faReceipt,
  faXmark,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import api from "../../../lib/api"; // Axios instance

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-0 flex items-center justify-center transition-transform duration-300 z-50 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-2xl w-full max-w-6xl transform animate-modalSlideUp border border-white/60 dark:border-white/10 ring-1 ring-black/5">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200/80 dark:border-gray-700/80">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1F6F43]">{title} Analysis</h2>
              <span className="rounded-full bg-[#1F6F43]/10 px-2 py-0.5 text-xs font-semibold text-[#1F6F43]">
                Live
              </span>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:text-[#1F6F43] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="text-2xl" />
            </button>
          </div>
          <div className="p-6 max-h-[85vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}

interface KpiData {
  weekly: number[];
  monthly: number[];
  recentItems: any[];
  newUsers?: number;
  returningUsers?: number;
  activeUsers?: number;
  inactiveUsers?: number;
  totalBusinesses?: number;
  newBusinesses?: number;
  activeBusinesses?: number;
  inactiveBusinesses?: number;
  paidInvoices?: number;
  unpaidInvoices?: number;
  totalRevenue?: number;
  breakdown?: Record<string, number>; // for Receipts categories
}

interface RecentInvoice {
  invoiceId?: string;
  userGeneratedInvoiceId?: string | null;
  userGeneratedReceiptId?: string | null;
  receiptId?: string | null;
  status?: string;
  invoiceDate?: string | null;
  receiptDate?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface SubscriptionRevenueItem {
  status?: string;
  created_at?: string | null;
  plan?: {
    price?: string;
  };
}

const COLORS = ["#1F6F43", "#FF7F50", "#00C49F", "#FFBB28", "#9B59B6"];

export default function AdminQuickActions() {
  const actions = [
    { href: "/dashboard/admin/subscriptions", label: "Subscriptions", icon: faTags },
    { href: "/dashboard/admin/support", label: "Support", icon: faComments },
    { href: "/dashboard/admin/profile", label: "Settings", icon: faGear },
  ];

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [subscriptionRevenueUsd, setSubscriptionRevenueUsd] = useState<number | null>(null);
  const [subscriptionItems, setSubscriptionItems] = useState<SubscriptionRevenueItem[]>([]);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [revenueRange, setRevenueRange] = useState<"day" | "week" | "month" | "year">("month");
  const [revenueTrend, setRevenueTrend] = useState<Array<{ period: string; revenue: number }>>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<
    "Users" | "Invoices" | "Receipts" | "Businesses" | null
  >(null);
  const [modalData, setModalData] = useState<KpiData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoadingCounts(true);
      try {
        const res = await api.get("/admin/dashboard-counts");
        const data = res.data;

        setTotalUsers(data.totalUsers ?? 0);
        setTotalInvoices(data.totalInvoices ?? 0);
        setTotalReceipts(data.totalReceipts ?? 0);
        setTotalBusinesses(data.totalBusinesses ?? 0);
      } catch (err) {
        console.error("Error fetching dashboard counts:", err);
      } finally {
        setLoadingCounts(false);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchSubscriptionRevenue = async () => {
      setRevenueLoading(true);
      try {
        const res = await api.get("/subscribers");
        const raw = res.data?.subscriptions ?? res.data ?? [];
        const items: SubscriptionRevenueItem[] = Array.isArray(raw) ? raw : [];
        setSubscriptionItems(items);

        const paidItems = items.filter(
          (item) => String(item.status || "").toLowerCase() === "active"
        );
        const total = paidItems.reduce((sum, item) => {
          const price = Number.parseFloat(item.plan?.price || "0");
          return Number.isNaN(price) ? sum : sum + price;
        }, 0);
        setSubscriptionRevenueUsd(total);
      } catch (err) {
        console.error("Error fetching subscription revenue:", err);
        setSubscriptionItems([]);
        setSubscriptionRevenueUsd(null);
      } finally {
        setRevenueLoading(false);
      }
    };

    fetchSubscriptionRevenue();
  }, []);

  useEffect(() => {
    if (!revenueModalOpen) return;

    const toIsoDate = (value?: string | null) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const getPeriodKey = (date: Date, range: "day" | "week" | "month" | "year") => {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      if (range === "day") {
        return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
      if (range === "month") {
        const monthName = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
        return `${monthName} ${year}`;
      }
      if (range === "year") {
        return `${year}`;
      }

      const temp = new Date(Date.UTC(year, month, day));
      const dayNum = temp.getUTCDay() || 7;
      temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
    };

    const getSortKey = (date: Date, range: "day" | "week" | "month" | "year") => {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      if (range === "day") return Date.UTC(year, month, day);
      if (range === "month") return Date.UTC(year, month, 1);
      if (range === "year") return Date.UTC(year, 0, 1);

      const temp = new Date(Date.UTC(year, month, day));
      const dayNum = temp.getUTCDay() || 7;
      temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
      return Date.UTC(temp.getUTCFullYear(), temp.getUTCMonth(), temp.getUTCDate());
    };

    setTrendLoading(true);
    try {
      const paidItems = subscriptionItems.filter(
        (item) => String(item.status || "").toLowerCase() === "active"
      );
      const buckets = new Map<string, { period: string; revenue: number; sort: number }>();

      paidItems.forEach((item) => {
        const date = toIsoDate(item.created_at);
        if (!date) return;
        const price = Number.parseFloat(item.plan?.price || "0");
        if (Number.isNaN(price)) return;

        const period = getPeriodKey(date, revenueRange);
        const sort = getSortKey(date, revenueRange);
        const current = buckets.get(period);
        if (current) {
          current.revenue += price;
        } else {
          buckets.set(period, { period, revenue: price, sort });
        }
      });

      const sorted = Array.from(buckets.values())
        .sort((a, b) => a.sort - b.sort)
        .map(({ period, revenue }) => ({ period, revenue }));
      setRevenueTrend(sorted);
    } finally {
      setTrendLoading(false);
    }
  }, [revenueModalOpen, revenueRange, subscriptionItems]);

  const kpiActions = [
    { label: "Users", count: totalUsers, icon: faUsers, isKpi: true },
    { label: "Invoices", count: totalInvoices, icon: faFileInvoiceDollar, isKpi: true },
    { label: "Receipts", count: totalReceipts, icon: faReceipt, isKpi: true },
    { label: "Businesses", count: totalBusinesses, icon: faBuilding, isKpi: true },
  ];

  const combinedActions = [...kpiActions, ...actions.map((a) => ({ ...a, isKpi: false }))];

  const openModal = async (
    type: "Users" | "Invoices" | "Receipts" | "Businesses"
  ) => {
    setModalContent(type);
    setModalOpen(true);
    setModalLoading(true);

    try {
      // DEFAULT: dashboard details (Users & Businesses)
      if (type === "Users" || type === "Businesses") {
        const res = await api.get(`/admin/dashboard-details/${type.toLowerCase()}`);
        const data: KpiData = res.data;

        data.weekly = Array.isArray(data.weekly) ? data.weekly : [];
        data.monthly = Array.isArray(data.monthly) ? data.monthly : [];
        data.recentItems = Array.isArray(data.recentItems) ? data.recentItems : [];

        setModalData(data);
        return;
      }

      // INVOICES — SAME AS AdminInvoices page
      if (type === "Invoices") {
        const [kpiRes, invoicesRes] = await Promise.all([
          api.get("/admin/dashboard-details/invoices"),
          api.get("/invoices/admin"),
        ]);

        const invoices: RecentInvoice[] = invoicesRes.data || [];
        const getInvoiceDate = (inv: RecentInvoice) =>
          inv.invoiceDate || inv.createdAt || inv.created_at || null;
        const sortedInvoices = [...invoices].sort((a, b) =>
          new Date(getInvoiceDate(b) || 0).getTime() -
          new Date(getInvoiceDate(a) || 0).getTime()
        );

        setModalData({
          ...kpiRes.data,
          recentItems: sortedInvoices.slice(0, 10),
        });
        return;
      }

      // RECEIPTS — SAME PATTERN
      if (type === "Receipts") {
        // Fetch KPI data
        const kpiRes = await api.get("/admin/dashboard-details/receipts");

        // Fetch invoices (same as invoices modal)
        const invoicesRes = await api.get("/invoices/admin");
        const invoices: RecentInvoice[] = invoicesRes.data || [];
        const getReceiptDate = (inv: RecentInvoice) =>
          inv.updated_at || inv.receiptDate || inv.createdAt || inv.created_at || null;

        // Only keep invoices with status 'paid'
        const paidInvoices = invoices.filter(
          (inv: any) => String(inv.status).toLowerCase() === "paid"
        );
        const sortedPaid = [...paidInvoices].sort((a, b) =>
          new Date(getReceiptDate(b) || 0).getTime() -
          new Date(getReceiptDate(a) || 0).getTime()
        );

        setModalData({
          ...kpiRes.data,
          recentItems: sortedPaid.slice(0, 10),
        });

        return;
      }

    } catch (err) {
      console.error(`Error fetching ${type} modal data:`, err);
      setModalData({
        weekly: [],
        monthly: [],
        recentItems: [],
      });
    } finally {
      setModalLoading(false);
    }
  };

  const renderCharts = () => {
    if (!modalData) return null;

    const lineData = modalData.weekly.map((v, i) => ({ label: `Week ${i + 1}`, value: v }));

    let pieData: { name: string; value: number }[] = [];
    if (modalContent === "Users") {
      pieData = [
        { name: "New Users", value: modalData.newUsers ?? 0 },
        { name: "Returning", value: modalData.returningUsers ?? 0 },
        { name: "Active", value: modalData.activeUsers ?? 0 },
        { name: "Inactive", value: modalData.inactiveUsers ?? 0 },
      ];
    } else if (modalContent === "Invoices") {
      pieData = [
        { name: "Paid", value: modalData.paidInvoices ?? 0 },
        { name: "Unpaid", value: modalData.unpaidInvoices ?? 0 },
      ];
    } else if (modalContent === "Receipts") {
      // Use breakdown categories if provided, else single total
      if (modalData.breakdown && Object.keys(modalData.breakdown).length > 0) {
        pieData = Object.entries(modalData.breakdown).map(([k, v]) => ({ name: k, value: v }));
      } else {
        pieData = [{ name: "Total", value: modalData.weekly.reduce((a, b) => a + b, 0) }];
      }
    } else if (modalContent === "Businesses") {
      pieData = [
        { name: "Active", value: modalData.activeBusinesses ?? 0 },
        { name: "Inactive", value: modalData.inactiveBusinesses ?? 0 },
        { name: "New", value: modalData.newBusinesses ?? 0 },
      ];
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 shadow">
          <h3 className="text-sm font-medium text-[#1F6F43] mb-2">Weekly Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#1F6F43" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {pieData.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 shadow">
            <h3 className="text-sm font-medium text-[#1F6F43] mb-2">Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={80}
                  label
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const computeAvg = (arr?: number[]) =>
    arr && arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : "0";

  const formatUsd = (value: number | null) => {
    if (value === null || Number.isNaN(value)) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatShortDate = (date?: string | null) =>
    date
      ? new Date(date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const getStatusClass = (status?: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "paid" || normalized === "issued") {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
    if (normalized === "overdue" || normalized === "unpaid" || normalized === "void" || normalized === "failed") {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    if (normalized === "sent" || normalized === "partial") {
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    }
    return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  };

  return (
    <div className="w-full font-sans">
      <button
        type="button"
        onClick={() => setRevenueModalOpen(true)}
        className="mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-[#1F6F43]/40 dark:border-white/[0.08] dark:bg-gray-900"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Subscription Revenue</p>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {revenueLoading ? "…" : formatUsd(subscriptionRevenueUsd)}
            </h3>
          </div>
          <span className="rounded-full bg-[#1F6F43]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1F6F43]">
            USD
          </span>
        </div>
        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          Total revenue over time (tap to view trend)
        </p>
      </button>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {combinedActions.map((item, idx) => (
          <div key={idx} className="w-full">
            {item.isKpi ? (
              <button
                onClick={() =>
                  openModal(
                    item.label as "Users" | "Invoices" | "Receipts" | "Businesses"
                  )
                }
                className="flex flex-col items-start justify-center gap-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 transition hover:border-[#1F6F43]/40 dark:border-white/10 dark:bg-gray-900 dark:text-gray-200"
              >
                <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  {item.label}
                </div>
                <div className="text-base font-semibold truncate">
                  {loadingCounts ? "…" : item.count.toLocaleString()}
                </div>
              </button>
            ) : (
              <a
                href={item.href ?? "#"}
                className="flex flex-col items-center justify-center gap-2 w-full rounded-xl border border-gray-200 bg-white py-2 text-[#1F6F43] transition hover:border-[#1F6F43]/40 hover:text-[#1F6F43] dark:border-white/10 dark:bg-gray-900 dark:text-gray-300"
              >
                <div className="w-10 h-10 rounded-full bg-[#1F6F43]/10 flex items-center justify-center text-sm font-bold">
                  <FontAwesomeIcon icon={item.icon} className="text-base" />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
              </a>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalContent ?? ""}
      >
        {modalLoading ? (
          <div className="flex justify-center items-center h-full">
            <span className="animate-spin border-b-2 border-[#1F6F43] rounded-full w-6 h-6" />
          </div>
        ) : (
          modalData && (
            <div className="space-y-6 text-gray-800 dark:text-gray-200">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 shadow">
                  <h3 className="text-sm font-medium text-[#1F6F43]">Total {modalContent}</h3>
                  <p className="text-2xl font-bold">
                    {modalContent === "Users"
                      ? totalUsers
                      : modalContent === "Invoices"
                      ? totalInvoices
                      : modalContent === "Receipts"
                      ? totalReceipts
                      : modalContent === "Businesses"
                      ? totalBusinesses
                      : 0}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 shadow">
                  <h3 className="text-sm font-medium text-[#1F6F43]">Weekly Avg</h3>
                  <p className="text-2xl font-bold">{computeAvg(modalData.weekly)}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 shadow">
                  <h3 className="text-sm font-medium text-[#1F6F43]">Monthly Avg</h3>
                  <p className="text-2xl font-bold">{computeAvg(modalData.monthly)}</p>
                </div>
              </div>

              {/* Charts + Breakdown */}
              {renderCharts()}

              {(modalContent === "Invoices" || modalContent === "Receipts") ? (
                <div className="rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Latest {modalContent}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Most recent {modalContent === "Invoices" ? "invoices" : "receipts"}
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      Top 10
                    </span>
                  </div>

                  <div className="space-y-2">
                    {modalData.recentItems.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                        No {modalContent === "Invoices" ? "invoices" : "receipts"} found.
                      </div>
                    ) : (
                      modalData.recentItems.map((item: RecentInvoice, idx: number) => {
                        const label =
                          item.userGeneratedInvoiceId ||
                          item.invoiceId ||
                          item.userGeneratedReceiptId ||
                          item.receiptId ||
                          "—";
                        const date =
                          modalContent === "Receipts"
                            ? item.updated_at || item.receiptDate || item.createdAt || item.created_at
                            : item.invoiceDate || item.createdAt || item.created_at;
                        return (
                          <div
                            key={`${label}-${idx}`}
                            className="flex items-center justify-between rounded-lg border border-gray-200/80 bg-white px-3 py-2 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02]"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                                {label}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatShortDate(date)}
                              </p>
                            </div>
                            <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(item.status)}`}>
                              {(item.status || "unknown").toString().toUpperCase()}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
                  <h3 className="font-semibold text-[#1F6F43] mb-3">
                    Recent {modalContent}
                  </h3>
                  <ul className="space-y-2">
                    {modalData.recentItems.slice(0, 10).map((item, idx) => (
                      <li key={idx} className="rounded-lg border border-gray-200/80 bg-white px-3 py-2 text-xs text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-gray-200">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )
        )}
      </Modal>

      {revenueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/95 p-5 shadow-2xl dark:bg-gray-900/95">
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-3 dark:border-gray-700/80">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Subscription Revenue
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total revenue over time
                </p>
              </div>
              <button
                onClick={() => setRevenueModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:text-[#1F6F43] hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label="Close revenue modal"
              >
                ×
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {["day", "week", "month", "year"].map((range) => (
                <button
                  key={range}
                  onClick={() => setRevenueRange(range as "day" | "week" | "month" | "year")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    revenueRange === range
                      ? "bg-[#1F6F43] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02]">
              {trendLoading ? (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading trend...
                </div>
              ) : revenueTrend.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  No revenue data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      axisLine={{ stroke: "#E5E7EB" }}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      axisLine={{ stroke: "#E5E7EB" }}
                    />
                    <Tooltip
                      formatter={(value: number) => `$${Number(value).toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.95)",
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1F6F43"
                      strokeWidth={3}
                      dot={{ r: 3, fill: "#1F6F43", stroke: "#fff", strokeWidth: 2 }}
                      activeDot={{ r: 5, stroke: "#1F6F43", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
