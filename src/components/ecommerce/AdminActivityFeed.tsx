"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";

interface SupportTicket {
  ticketId: number;
  subject: string;
  status: string;
  created_at: string;
  user?: {
    name?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface AdminInvoice {
  invoiceId?: string;
  userGeneratedInvoiceId?: string | null;
  status?: string | null;
  invoiceDate?: string | null;
  receiptDate?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: number;
  status?: string;
}

const getFullName = (user?: SupportTicket["user"]) => {
  if (!user) return "Unknown Customer";
  if (user.name) return user.name;
  const first = user.firstName?.trim() || "";
  const last = user.lastName?.trim() || "";
  const fullName = [first, last].filter(Boolean).join(" ");
  return fullName || "Unknown Customer";
};

const toTimestamp = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const formatWhen = (timestamp: number) =>
  new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getRangeStart = (range?: "7d" | "30d" | "90d" | "ytd") => {
  const now = new Date();
  if (range === "ytd") {
    return new Date(now.getFullYear(), 0, 1).getTime();
  }
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 0;
  return days ? now.getTime() - days * 24 * 60 * 60 * 1000 : 0;
};

export default function AdminActivityFeed({
  range,
  onPin,
}: {
  range?: "7d" | "30d" | "90d" | "ytd";
  onPin?: (item: {
    id: string;
    label: string;
    value: string;
    meta?: string;
    events?: string[];
    badge?: "new-user";
  }) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [hasNewUsers, setHasNewUsers] = useState(false);

  const getNewUserSignal = () => {
    try {
      const flag = window.localStorage.getItem("adminNewUsersFlag") === "true";
      const delta = Number(window.localStorage.getItem("adminNewUsersDelta") || 0);
      const at = Number(window.localStorage.getItem("adminNewUsersAt") || Date.now());
      return { flag, delta, at };
    } catch {
      return { flag: false, delta: 0, at: Date.now() };
    }
  };

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const [invoiceRes, ticketRes] = await Promise.all([
          api.get("/invoices/admin"),
          api.get("/support/tickets/all"),
        ]);

        const invoices: AdminInvoice[] = invoiceRes.data || [];
        const tickets: SupportTicket[] = ticketRes.data?.tickets || [];

        const invoiceItems: ActivityItem[] = invoices.map((invoice) => {
          const timestamp =
            toTimestamp(invoice.receiptDate) ||
            toTimestamp(invoice.invoiceDate) ||
            toTimestamp(invoice.updated_at) ||
            toTimestamp(invoice.createdAt) ||
            toTimestamp(invoice.created_at) ||
            Date.now();

          const status = String(invoice.status || "").toLowerCase();
          const isPaid = status === "paid" || status === "issued";
          const label = isPaid ? "Receipt issued" : "Invoice updated";
          const displayId = invoice.userGeneratedInvoiceId || invoice.invoiceId || "Invoice";

          return {
            id: `invoice-${invoice.invoiceId || displayId}-${timestamp}`,
            title: `${label}: ${displayId}`,
            subtitle: status ? `Status: ${status}` : "Invoice update",
            timestamp,
            status,
          };
        });

        const ticketItems: ActivityItem[] = tickets.map((ticket) => {
          const timestamp = toTimestamp(ticket.created_at) || Date.now();
          return {
            id: `ticket-${ticket.ticketId}-${timestamp}`,
            title: `Ticket opened: ${ticket.subject}`,
            subtitle: `Customer: ${getFullName(ticket.user)}`,
            timestamp,
            status: ticket.status,
          };
        });

        const newUserSignal = getNewUserSignal();
        const newUserItem: ActivityItem | null = newUserSignal.flag
          ? {
              id: `new-users-${newUserSignal.at}`,
              title:
                newUserSignal.delta > 1
                  ? `New users joined (+${newUserSignal.delta})`
                  : "New user joined",
              subtitle: "New account activity",
              timestamp: newUserSignal.at,
              status: "new-user",
            }
          : null;

        const combined = [newUserItem, ...invoiceItems, ...ticketItems].filter(
          (item): item is ActivityItem => Boolean(item)
        );
        setItems(combined);
        setHasNewUsers(newUserSignal.flag);
      } catch (error) {
        console.error("Failed to load activity feed", error);
        setItems([]);
        setHasNewUsers(false);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    const intervalId = window.setInterval(fetchActivity, 15000);

    return () => window.clearInterval(intervalId);
  }, [range]);

  const filteredItems = useMemo(() => {
    const start = getRangeStart(range);
    return items
      .filter((item) => (start ? item.timestamp >= start : true))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);
  }, [items, range]);

  const latestItem = filteredItems[0];
  const pinValue = loading
    ? "Loading"
    : filteredItems.length
    ? `${filteredItems.length} events`
    : "No events";
  const pinEvents = filteredItems.slice(0, 5).map((item) => item.title);
  const pinMeta = loading
    ? "Fetching latest signals"
    : latestItem
    ? `Latest: ${latestItem.title}`
    : "No recent activity";

  const handleClearNewUsers = () => {
    try {
      window.localStorage.removeItem("adminNewUsersFlag");
      window.localStorage.removeItem("adminNewUsersDelta");
      window.localStorage.removeItem("adminNewUsersAt");
    } catch {
      // Ignore storage errors.
    }
    setHasNewUsers(false);
    setItems((prev) => prev.filter((item) => item.status !== "new-user"));
    if (onPin) {
      onPin({
        id: "recent-activity",
        label: "Recent Activity",
        value: pinValue,
        meta: pinMeta,
        events: pinEvents,
      });
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Latest system events across invoices and support</p>
        </div>
        <div className="flex items-center gap-2">
          {hasNewUsers ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
              New users
            </span>
          ) : null}
          {hasNewUsers ? (
            <button
              type="button"
              onClick={handleClearNewUsers}
              className="text-[11px] font-semibold text-gray-500 hover:text-[#1F6F43]"
            >
              Clear
            </button>
          ) : null}
          {onPin ? (
            <button
              type="button"
              onClick={() =>
                onPin({
                  id: "recent-activity",
                  label: "Recent Activity",
                  value: pinValue,
                  meta: pinMeta,
                  events: pinEvents,
                  badge: hasNewUsers ? "new-user" : undefined,
                })
              }
              disabled={loading}
              className="text-[11px] font-semibold text-[#1F6F43] hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Pin
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-4 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
          No recent activity within this range.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div
                className={`mt-1 h-2 w-2 rounded-full ${
                  item.status === "new-user" ? "bg-red-500" : "bg-[#1F6F43]"
                }`}
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                  {item.status === "new-user" ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                      New
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                  <span className="text-[11px] text-gray-400">•</span>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{formatWhen(item.timestamp)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
