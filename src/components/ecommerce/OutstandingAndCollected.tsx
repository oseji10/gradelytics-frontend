"use client";

import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMoneyBillWave,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../../lib/api";

interface SummaryResponse {
  collected: number;
  outstanding: number;
}

export default function OutstandingAndCollected({
  currency,
}: {
  currency: string;
}) {
  const [data, setData] = useState<SummaryResponse>({
    collected: 0,
    outstanding: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get("/invoices/summary");
        setData(res.data);
      } catch (error) {
        console.error("Failed to load invoice summary", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow p-6 animate-pulse h-32" />
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow p-6 animate-pulse h-32" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Outstanding */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-200 dark:border-blue-800/30 p-5 transition-all duration-300 group overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-200 dark:bg-blue-900/30 rounded-full opacity-10" />
        
        <div className="flex justify-between items-start relative z-10">
          <div className="flex-1">
            <p className="text-xs text-[#1F6F43] dark:text-blue-200 font-medium uppercase tracking-wide">
              Outstanding
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {data.currency_symbol} {data.outstanding.toLocaleString()}
            </h3>
            <p className="text-xs text-[#1F6F43] dark:text-blue-300 mt-1">
              Amount yet to receive
            </p>
          </div>

          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1F6F43] to-[#084d93] dark:from-[#1F6F43] dark:to-[#084d93] flex items-center justify-center text-white transition-transform duration-300">
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-xl" />
          </div>
        </div>
      </div>

      {/* Collected */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-200 dark:border-blue-800/30 p-5 transition-all duration-300 group overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-200 dark:bg-blue-900/30 rounded-full opacity-10" />
        
        <div className="flex justify-between items-start relative z-10">
          <div className="flex-1">
            <p className="text-xs text-[#1F6F43] dark:text-blue-200 font-medium uppercase tracking-wide">
              Collected
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {data.currency_symbol} {data.collected.toLocaleString()}
            </h3>
            <p className="text-xs text-[#1F6F43] dark:text-blue-300 mt-1">
              Total payments received
            </p>
          </div>

          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1F6F43] to-[#084d93] dark:from-[#1F6F43] dark:to-[#084d93] flex items-center justify-center text-white transition-transform duration-300">
            <FontAwesomeIcon icon={faCircleCheck} className="text-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
