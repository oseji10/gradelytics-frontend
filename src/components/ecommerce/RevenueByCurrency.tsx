// components/dashboard/RevenueByCurrency.tsx
"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown/Dropdown";
import { useState } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function RevenueByCurrency() {
  const options: ApexOptions = {
    colors: ["#FF7A00", "#7C3AED", "#00B894", "#3B82F6"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "pie",
      height: 300,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "60%",
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: { fontSize: "12px", colors: ["#fff"] },
    },
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      labels: { colors: "#6B7280" },
    },
    tooltip: {
      y: { formatter: (val: number) => `$${val.toLocaleString()}` },
    },
  };

  const series = [45000, 32000, 15000, 8000]; // Example revenue in USD
  const labels = ["NGN", "USD", "GBP", "EUR"];

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Revenue by Currency</h3>
        <div className="relative inline-block">
          <button onClick={() => setIsOpen(!isOpen)} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-40 p-2">
            <DropdownItem>View Details</DropdownItem>
          </Dropdown>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <ReactApexChart options={options} series={series} type="pie" height={300} />
      </div>
    </div>
  );
}