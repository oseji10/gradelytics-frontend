"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useEffect, useState } from "react";
import api from "../../../lib/api";

export default function RevenueTrendsChart({
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
      .get("/admin/revenue-trends", {
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
            <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
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
  const isArea = currentStyle === "area" || currentStyle === "stacked";
  const isGradient = currentStyle === "gradient";
  const isMonochrome = currentStyle === "monochrome";
  const isGlass = currentStyle === "glass";
  const showLegend = !isMinimal && !isCompact;
  const showGrid = !isMinimal;
  const lineColor = isMonochrome ? "#1F6F43" : "#1F6F43";
  const gradientId = "revenueGradient";
  const cardClass = isGlass
    ? "rounded-2xl border border-gray-200/70 bg-white/70 p-5 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-gray-900/70"
    : "rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-900";

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Revenue Trends</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Net revenue performance by period</p>
        </div>
        <span className="rounded-full bg-[#1F6F43]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1F6F43]">
          {rangeLabel}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        {isHistogram ? (
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            {isGradient ? (
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1F6F43" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#1F6F43" stopOpacity={0.2} />
                </linearGradient>
              </defs>
            ) : null}
            {showGrid ? (
              <CartesianGrid
                stroke="rgba(0,0,0,0.05)"
                vertical={false}
                strokeDasharray={isDotted ? "4 4" : undefined}
              />
            ) : null}
            <XAxis
              dataKey="period"
              tick={{ fill: "#6B7280", fontSize: isCompact ? 11 : 12 }}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              tickFormatter={(value) => `₦${value.toLocaleString()}`}
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
            <Bar
              dataKey="revenue"
              radius={[6, 6, 0, 0]}
              fill={isGradient ? `url(#${gradientId})` : lineColor}
            />
          </BarChart>
        ) : isArea ? (
          <AreaChart data={data} margin={{ top: 18, right: 30, left: 0, bottom: 0 }}>
            {isGradient ? (
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1F6F43" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1F6F43" stopOpacity={0.05} />
                </linearGradient>
              </defs>
            ) : null}
            {showGrid ? (
              <CartesianGrid
                stroke="rgba(0,0,0,0.05)"
                vertical={false}
                strokeDasharray={isDotted ? "4 4" : undefined}
              />
            ) : null}
            <XAxis
              dataKey="period"
              tick={{ fill: "#6B7280", fontSize: isCompact ? 11 : 12 }}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              tickFormatter={(value) => `₦${value.toLocaleString()}`}
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
            {showLegend ? (
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: "13px", fontWeight: 500 }}
              />
            ) : null}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={lineColor}
              strokeWidth={isOutlined ? 2 : 3}
              fill={isGradient ? `url(#${gradientId})` : "rgba(10,102,194,0.18)"}
              fillOpacity={isOutlined ? 0.08 : 0.18}
              strokeDasharray={isDotted ? "4 4" : undefined}
            />
          </AreaChart>
        ) : (
          <LineChart
            data={data}
            margin={{ top: isCompact ? 10 : 20, right: 30, left: 0, bottom: 0 }}
          >
            {showGrid ? (
              <CartesianGrid
                stroke="rgba(0,0,0,0.05)"
                vertical={false}
                strokeDasharray={isDotted ? "4 4" : undefined}
              />
            ) : null}
            <XAxis
              dataKey="period"
              tick={{ fill: "#6B7280", fontSize: isCompact ? 11 : 12 }}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              tickFormatter={(value) => `₦${value.toLocaleString()}`}
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
            {showLegend ? (
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ fontSize: "13px", fontWeight: 500 }}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={lineColor}
              strokeWidth={isOutlined || isMinimal ? 2 : 3}
              dot={isMinimal ? false : { r: 5, fill: "#1F6F43", stroke: "#fff", strokeWidth: 2 }}
              activeDot={isMinimal ? { r: 5 } : { r: 7, stroke: "#1F6F43", strokeWidth: 2 }}
              strokeDasharray={isDotted ? "4 4" : undefined}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
