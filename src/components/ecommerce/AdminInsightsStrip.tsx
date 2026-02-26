"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";

interface DashboardCounts {
  totalUsers: number;
  totalInvoices: number;
  totalReceipts: number;
  totalBusinesses: number;
}

export default function AdminInsightsStrip({
  onPin,
}: {
  onPin?: (item: { id: string; label: string; value: string; meta?: string }) => void;
}) {
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin/dashboard-counts");
        const data = res.data || {};
        const nextCounts = {
          totalUsers: Number(data.totalUsers || 0),
          totalInvoices: Number(data.totalInvoices || 0),
          totalReceipts: Number(data.totalReceipts || 0),
          totalBusinesses: Number(data.totalBusinesses || 0),
        };
        setCounts(nextCounts);
        try {
          const storedUsers = Number(window.localStorage.getItem("adminTotalUsers") || 0);
          if (storedUsers > 0 && nextCounts.totalUsers > storedUsers) {
            const delta = nextCounts.totalUsers - storedUsers;
            window.localStorage.setItem("adminNewUsersFlag", "true");
            window.localStorage.setItem("adminNewUsersDelta", String(delta));
            window.localStorage.setItem("adminNewUsersAt", String(Date.now()));
          }
          window.localStorage.setItem("adminTotalUsers", String(nextCounts.totalUsers));
        } catch (storageError) {
          console.warn("Unable to persist new user badge state", storageError);
        }
      } catch (error) {
        console.error("Failed to load dashboard counts", error);
        setCounts({
          totalUsers: 0,
          totalInvoices: 0,
          totalReceipts: 0,
          totalBusinesses: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const insights = useMemo(() => {
    const users = counts?.totalUsers || 0;
    const invoices = counts?.totalInvoices || 0;
    const receipts = counts?.totalReceipts || 0;
    const businesses = counts?.totalBusinesses || 0;

    const receiptRate = invoices > 0 ? ((receipts / invoices) * 100).toFixed(1) : "0.0";
    const invoicesPerBusiness = businesses > 0 ? (invoices / businesses).toFixed(1) : "0.0";
    const usersPerBusiness = businesses > 0 ? (users / businesses).toFixed(1) : "0.0";

    return [
      {
        label: "Total Users",
        value: users.toLocaleString(),
        meta: "Active accounts",
      },
      {
        label: "Total Businesses",
        value: businesses.toLocaleString(),
        meta: "Verified tenants",
      },
      {
        label: "Receipt Rate",
        value: `${receiptRate}%`,
        meta: "Receipts per invoice",
      },
      {
        label: "Invoices / Business",
        value: invoicesPerBusiness,
        meta: "Avg. invoices",
      },
      {
        label: "Users / Business",
        value: usersPerBusiness,
        meta: "Avg. users",
      },
    ];
  }, [counts]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-gray-900"
          >
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="mt-3 h-5 w-16 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="mt-2 h-3 w-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {insights.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-gray-900"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {item.label}
            </p>
            {onPin ? (
              <button
                type="button"
                onClick={() =>
                  onPin({
                    id: item.label.toLowerCase().replace(/\s+/g, "-"),
                    label: item.label,
                    value: item.value,
                    meta: item.meta,
                  })
                }
                className="text-[11px] font-semibold text-[#1F6F43] hover:underline"
              >
                Pin
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{item.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.meta}</p>
        </div>
      ))}
    </div>
  );
}
