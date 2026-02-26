"use client";

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import api from "../../../lib/api";

// Brand-forward palette
const COLORS = [
  "#1F6F43",
  "#1D4ED8",
  "#2563EB",
  "#3B82F6",
  "#60A5FA",
  "#93C5FD",
  "#BFDBFE",
];

export default function CurrencyDistributionChart({
  range,
  style,
}: {
  range?: "7d" | "30d" | "90d" | "ytd";
  style?:
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
    | "glass";
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const rangeLabel =
    range === "7d"
      ? "7D"
      : range === "30d"
      ? "30D"
      : range === "90d"
      ? "90D"
      : "YTD";

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/currency-distribution", {
        params: range ? { range } : undefined,
      })
      .then((res) => {
        setData(res.data);
      })
      .catch(() => {
        setData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [range]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <div className="h-3 w-36 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="mt-2 h-3 w-40 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
          <span className="rounded-full bg-[#1F6F43]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1F6F43]">
            {rangeLabel}
          </span>
        </div>
        <div className="h-[280px] rounded-xl bg-gray-50 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  const currentStyle = style ?? "standard";
  const isHistogram = currentStyle === "histogram";
  const isMinimal = currentStyle === "minimal";
  const isCompact = currentStyle === "compact";
  const isOutlined = currentStyle === "outlined";
  const isDotted = currentStyle === "dotted";
  const isStacked = currentStyle === "stacked";
  const isGradient = currentStyle === "gradient";
  const isMonochrome = currentStyle === "monochrome";
  const isGlass = currentStyle === "glass";
  const showLegend = !isMinimal && !isCompact;
  const showLabels = !isMinimal && !isCompact;
  const innerRadius = isCompact ? 60 : 70;
  const outerRadius = isCompact ? 95 : 110;
  const palette = isMonochrome
    ? [
        "#1F6F43",
        "rgba(10,102,194,0.85)",
        "rgba(10,102,194,0.7)",
        "rgba(10,102,194,0.55)",
        "rgba(10,102,194,0.4)",
      ]
    : COLORS;
  const cardClass = isGlass
    ? "rounded-2xl border border-gray-200/70 bg-white/70 p-5 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-gray-900/70"
    : "rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-900";
  const stackedData = isStacked
    ? [
        data.reduce(
          (acc: Record<string, number | string>, item: { currency: string; total: number }) => {
            acc[item.currency] = item.total;
            return acc;
          },
          { name: "Currency" }
        ),
      ]
    : [];

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Currency Distribution</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Share of revenue by currency</p>
        </div>
        <span className="rounded-full bg-[#1F6F43]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1F6F43]">
          {rangeLabel}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        {isStacked ? (
          <BarChart data={stackedData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid
              stroke="rgba(0,0,0,0.05)"
              vertical={false}
              strokeDasharray={isDotted ? "4 4" : undefined}
            />
            <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={{ stroke: "#E5E7EB" }} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={{ stroke: "#E5E7EB" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.9)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "1px solid #E5E7EB",
              }}
              formatter={(value: number) => `₦${value.toLocaleString()}`}
            />
            {data.map((entry: { currency: string }, index: number) => (
              <Bar
                key={`bar-${entry.currency}`}
                dataKey={entry.currency}
                stackId="a"
                fill={palette[index % palette.length]}
                radius={index === data.length - 1 ? [6, 6, 0, 0] : 0}
              />
            ))}
          </BarChart>
        ) : isHistogram ? (
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid
              stroke="rgba(0,0,0,0.05)"
              vertical={false}
              strokeDasharray={isDotted ? "4 4" : undefined}
            />
            <XAxis
              dataKey="currency"
              tick={{ fill: "#6B7280", fontSize: isCompact ? 11 : 12 }}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              tick={{ fill: "#6B7280", fontSize: isCompact ? 11 : 12 }}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.9)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "1px solid #E5E7EB",
              }}
              formatter={(value: number) => `₦${value.toLocaleString()}`}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="currency"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={4}
              labelLine={false}
              label={
                showLabels
                  ? ({ currency, total }) => `${currency}: ₦${total.toLocaleString()}`
                  : undefined
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={palette[index % palette.length]}
                  fillOpacity={isOutlined ? 0.15 : 1}
                  stroke={palette[index % palette.length]}
                  strokeWidth={isOutlined ? 3 : 2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.9)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "1px solid #E5E7EB",
              }}
              formatter={(value: number) => `₦${value.toLocaleString()}`}
            />
            {showLegend ? (
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                wrapperStyle={{ fontSize: "13px", fontWeight: 500 }}
              />
            ) : null}
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
