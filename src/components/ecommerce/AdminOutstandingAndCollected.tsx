"use client";

import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMoneyBillWave,
  faCircleCheck,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../../lib/api";

interface AdminCurrencySummary {
  currency_code: number;
  currency_symbol: string;
  collected: number;
  outstanding: number;
  country?: string;
}

export default function AdminOutstandingAndCollected({
  range,
}: {
  range?: "7d" | "30d" | "90d" | "ytd";
}) {
  const [data, setData] = useState<AdminCurrencySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchAdminSummary = async () => {
      setLoading(true);
      try {
        const res = await api.get("/invoices/admin-summary", {
          params: range ? { range } : undefined,
        });
        setData(res.data);
      } catch (error) {
        console.error("Failed to load admin invoice summary", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminSummary();
  }, [range]);

  const visibleData = showAll ? data : data.slice(0, 1);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-5 animate-pulse h-24 dark:border-white/10 dark:bg-gray-900"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibleData.map((item) => (
          <React.Fragment key={item.currency_code}>
            {/* Outstanding */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-900">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total Outstanding
                  </p>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {item.currency_symbol}{" "}
                    {item.outstanding.toLocaleString()}
                  </h3>
                  <p className="text-xs text-[#1F6F43] dark:text-blue-300">
                    Currency Code: {item.currency_code} | Country: {item.country}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-full bg-[#1F6F43]/10 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faMoneyBillWave}
                    className="text-[#1F6F43]"
                  />
                </div>
              </div>
            </div>

            {/* Collected */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-900">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total Collected
                  </p>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {item.currency_symbol}{" "}
                    {item.collected.toLocaleString()}
                  </h3>
                  <p className="text-xs text-[#1F6F43] dark:text-blue-300">
                    Currency Code: {item.currency_code} | Country: {item.country}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-full bg-[#1F6F43]/10 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    className="text-[#1F6F43]"
                  />
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* View More / View Less */}
      {data.length > 1 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 text-sm font-medium text-[#1F6F43] hover:underline"
          >
            {showAll ? "View less" : "View more"}
            <FontAwesomeIcon icon={showAll ? faChevronUp : faChevronDown} />
          </button>
        </div>
      )}
    </div>
  );
}
