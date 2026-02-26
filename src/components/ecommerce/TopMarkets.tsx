// components/dashboard/TopMarkets.tsx
"use client";
import React from "react";
import Badge from "@/components/ui/badge/Badge";
import { ArrowUpIcon } from "@/icons";

const markets = [
  { country: "Nigeria", code: "NG", revenue: "$45,200", change: "+18.2%" },
  { country: "Ghana", code: "GH", revenue: "$32,100", change: "+12.5%" },
  { country: "Kenya", code: "KE", revenue: "$28,900", change: "+9.8%" },
  { country: "South Africa", code: "ZA", revenue: "$19,800", change: "+5.3%" },
  { country: "United Kingdom", code: "GB", revenue: "$15,400", change: "+3.1%" },
];

export default function TopMarkets() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Top Markets</h3>
      <div className="space-y-4">
        {markets.map((market, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg font-bold text-gray-800 dark:text-white">
                {market.code}
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white/90">{market.country}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{market.code}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800 dark:text-white/90">{market.revenue}</p>
              <Badge color="success" size="sm">
                <ArrowUpIcon />
                {market.change}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}