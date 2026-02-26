// // app/(dashboard)/dashboard/page.tsx
// import type { Metadata } from "next";
// import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
// import React from "react";
// import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
// import MonthlyInvoicesChart from "@/components/ecommerce/MonthlyInvoicesChart";
// import StatisticsChart from "@/components/ecommerce/StatisticsChart";
// import RecentInvoices from "@/components/ecommerce/RecentInvoices";
// import RevenueByCurrency from "@/components/ecommerce/RevenueByCurrency";
// import PlanDistribution from "@/components/ecommerce/PlanDistribution";
// import TopMarkets from "@/components/ecommerce/TopMarkets";

// export const metadata: Metadata = {
//   title: "gradelytics Dashboard",
//   description: "Overview of your invoicing platform: invoices, revenue, tenants, and more.",
// };

// export default function SuperAdminDashboard() {
//   return (
//     <div className="grid grid-cols-12 gap-4 md:gap-6">
//       {/* Main Content */}
//       <div className="col-span-12 space-y-6 xl:col-span-8">
//         {/* <EcommerceMetrics /> */}

//         {/* <MonthlyInvoicesChart /> */}

//         {/* <StatisticsChart /> */}

//         {/* <PlanDistribution /> */}

//         {/* <RevenueByCurrency /> */}

//         {/* <TopMarkets /> */}
//       </div>

//       {/* Sidebar / Right Column */}
//       <div className="col-span-12 xl:col-span-4 space-y-6">
//         {/* <MonthlyTarget />

//         <RecentInvoices /> */}
//       </div>
//     </div>
//   );
// }


// app/(dashboard)/dashboard/AdminDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserName } from "../../../lib/auth";
import AdminOutstandingAndCollected from "./AdminOutstandingAndCollected";
import AdminQuickActions from "./AdminQuickActions";
import AdminInsightsStrip from "./AdminInsightsStrip";
import AdminActivityFeed from "./AdminActivityFeed";
import AdminWatchlist from "./AdminWatchlist";
import InvoiceStatusChart from "../admin/InvoiceStatusChart";
import CurrencyDistributionChart from "../admin/CurrencyDistributionChart";
import RevenueTrendsChart from "../admin/RevenueTrendsChart";
import TopTenantsChart from "../admin/TopTenantsChart";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [analyticsRange, setAnalyticsRange] = useState<"7d" | "30d" | "90d" | "ytd">("30d");
  const [analyticsStyle, setAnalyticsStyle] = useState<
    | "standard"
    | "histogram"
    | "minimal"
    | "area"
    | "compact"
    | "stacked"
    | "outlined"
    | "dotted"
    | "gradient"
    | "monochrome"
    | "glass"
  >("standard");
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isInsightsClosing, setIsInsightsClosing] = useState(false);
  const [watchlist, setWatchlist] = useState<
    Array<{ id: string; label: string; value: string; meta?: string; events?: string[]; badge?: "new-user" }>
  >([]);
  const currency = "₦";

  useEffect(() => {
    const userName = getUserName();
    if (!userName) {
      router.push("/signin"); // Redirect if not logged in
    } else {
      setName(userName);
    }
  }, [router]);

  useEffect(() => {
    const stored = window.localStorage.getItem("adminWatchlist");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWatchlist(parsed);
        }
      } catch {
        setWatchlist([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("adminWatchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  const handlePin = (item: {
    id: string;
    label: string;
    value: string;
    meta?: string;
    events?: string[];
    badge?: "new-user";
  }) => {
    setWatchlist((prev) => {
      const exists = prev.some((existing) => existing.id === item.id);
      if (exists) {
        return prev.map((existing) => (existing.id === item.id ? { ...existing, ...item } : existing));
      }
      return [...prev, item];
    });
  };

  const handleClearBadge = (id: string) => {
    if (id === "recent-activity") {
      try {
        window.localStorage.removeItem("adminNewUsersFlag");
        window.localStorage.removeItem("adminNewUsersDelta");
        window.localStorage.removeItem("adminNewUsersAt");
      } catch {
        // Ignore storage errors.
      }
    }
    setWatchlist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, badge: undefined } : item))
    );
  };

  const handleRemovePin = (id: string) => {
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <style jsx>{`
        @keyframes insightsPanelIn {
          from {
            transform: translateX(100%);
            opacity: 0.6;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes insightsPanelOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 sm:p-6 shadow-[0_1px_0_rgba(16,24,40,0.04)] dark:border-white/10 dark:bg-gray-900">
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#1F6F43]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-20 h-40 w-40 rounded-full bg-[#1F6F43]/10 blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center justify-center overflow-hidden">
              <img
                src="/images/avatar.png"
                alt="Admin Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#1F6F43]">
                Super Admin Console
              </p>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                Welcome back, {name || "Admin"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage businesses, invoices, and system-wide settings
              </p>
            </div>
          </div>
          <div className="w-full md:w-auto">
            {/* <AdminQuickActions /> */}
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Analytics Overview</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Enterprise performance, invoicing, and revenue signals</p>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Updated just now
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-gray-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Range</span>
              <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 text-xs dark:border-white/10 dark:bg-gray-900">
                {[
                  { label: "7D", value: "7d" },
                  { label: "30D", value: "30d" },
                  { label: "90D", value: "90d" },
                  { label: "YTD", value: "ytd" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAnalyticsRange(option.value)}
                    className={
                      analyticsRange === option.value
                        ? "rounded-full bg-[#1F6F43] px-3 py-1 text-white"
                        : "rounded-full px-3 py-1 text-gray-500 dark:text-gray-400"
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Style</span>
                <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 text-xs dark:border-white/10 dark:bg-gray-900">
                  {[
                    { label: "Standard", value: "standard" },
                    { label: "Histogram", value: "histogram" },
                    { label: "Area", value: "area" },
                    { label: "Compact", value: "compact" },
                    { label: "Stacked", value: "stacked" },
                    { label: "Outlined", value: "outlined" },
                    { label: "Dotted", value: "dotted" },
                    { label: "Gradient", value: "gradient" },
                    { label: "Monochrome", value: "monochrome" },
                    { label: "Glass", value: "glass" },
                    { label: "Minimal", value: "minimal" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAnalyticsStyle(option.value)}
                      className={
                        analyticsStyle === option.value
                          ? "rounded-full bg-[#1F6F43] px-2.5 py-1 text-white"
                          : "rounded-full px-2.5 py-1 text-gray-500 dark:text-gray-400"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex w-full items-center gap-2 sm:hidden">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400" htmlFor="analytics-style">
                  Style
                </label>
                <select
                  id="analytics-style"
                  value={analyticsStyle}
                  onChange={(event) => setAnalyticsStyle(event.target.value as typeof analyticsStyle)}
                  className="w-full rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="standard">Standard</option>
                  <option value="histogram">Histogram</option>
                  <option value="area">Area</option>
                  <option value="compact">Compact</option>
                  <option value="stacked">Stacked</option>
                  <option value="outlined">Outlined</option>
                  <option value="dotted">Dotted</option>
                  <option value="gradient">Gradient</option>
                  <option value="monochrome">Monochrome</option>
                  <option value="glass">Glass</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
              <span className="rounded-full bg-[#1F6F43]/10 px-2.5 py-1 text-xs font-semibold text-[#1F6F43]">Live</span>
              <button
                type="button"
                onClick={() => {
                  setIsInsightsOpen(true);
                  setIsInsightsClosing(false);
                }}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-[#1F6F43]/40 hover:text-[#1F6F43] dark:border-white/10 dark:text-gray-300"
              >
                Insights
              </button>
              <button className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-[#1F6F43]/40 hover:text-[#1F6F43] dark:border-white/10 dark:text-gray-300">
                Export
              </button>
            </div>
          </div>
        </div>

        <AdminWatchlist items={watchlist} onRemove={handleRemovePin} onClearBadge={handleClearBadge} />

        {/* <AdminOutstandingAndCollected currency={currency} range={analyticsRange} /> */}

        <div className="md:hidden -mx-4 px-4">
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            <div className="min-w-[85vw] snap-start">
              {/* <InvoiceStatusChart range={analyticsRange} style={analyticsStyle} /> */}
            </div>
            <div className="min-w-[85vw] snap-start">
              {/* <TopTenantsChart range={analyticsRange} style={analyticsStyle} /> */}
            </div>
            <div className="min-w-[85vw] snap-start">
              {/* <CurrencyDistributionChart range={analyticsRange} style={analyticsStyle} /> */}
            </div>
            <div className="min-w-[85vw] snap-start">
              {/* <RevenueTrendsChart range={analyticsRange} style={analyticsStyle} /> */}
            </div>
          </div>
        </div>
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          <div className="w-full">
            {/* <InvoiceStatusChart range={analyticsRange} style={analyticsStyle} /> */}
          </div>
          <div className="w-full">
            {/* <TopTenantsChart range={analyticsRange} style={analyticsStyle} /> */}
          </div>

          <div className="w-full">
            {/* <CurrencyDistributionChart range={analyticsRange} style={analyticsStyle} /> */}
          </div>
          <div className="w-full">
            {/* <RevenueTrendsChart range={analyticsRange} style={analyticsStyle} /> */}
          </div>
        </div>

      </div>

      {/* Admin-specific Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* <AllTenants /> Widget showing all tenants/businesses */}
        {/* <RevenueByCurrency currency={currency} /> Revenue overview */}
        {/* <RecentInvoices currency={currency} /> Recent invoices across all tenants */}
      </div>

      {isInsightsOpen || isInsightsClosing ? (
        <div
          className={`fixed inset-0 z-[60] flex items-stretch justify-end transition-opacity duration-300 ease-out ${
            isInsightsClosing ? "opacity-0" : "opacity-100"
          }`}
        >
          <div
            className="absolute inset-0 bg-black/40"
            role="button"
            tabIndex={-1}
            onClick={() => {
              setIsInsightsClosing(true);
              window.setTimeout(() => {
                setIsInsightsOpen(false);
                setIsInsightsClosing(false);
              }, 300);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsInsightsClosing(true);
                window.setTimeout(() => {
                  setIsInsightsOpen(false);
                  setIsInsightsClosing(false);
                }, 300);
              }
            }}
          />
          <div
            className={`relative h-full w-full sm:max-w-xl bg-white shadow-2xl will-change-transform dark:bg-gray-950 ${
              isInsightsClosing ? "animate-[insightsPanelOut_360ms_ease-in_forwards]" : "animate-[insightsPanelIn_420ms_cubic-bezier(0.16,1,0.3,1)]"
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Insights</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Pinned metrics</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsInsightsClosing(true);
                  window.setTimeout(() => {
                    setIsInsightsOpen(false);
                    setIsInsightsClosing(false);
                  }, 300);
                }}
                className="rounded-full border border-gray-200 p-2 text-gray-500 hover:text-gray-900 dark:border-white/10 dark:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-full overflow-y-auto px-5 py-5 space-y-6">
              <AdminInsightsStrip onPin={handlePin} />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Recent activity</p>
                <h4 className="mt-2 text-base font-semibold text-gray-900 dark:text-white">Latest signals</h4>
                <div className="mt-4">
                  <AdminActivityFeed range={analyticsRange} onPin={handlePin} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
