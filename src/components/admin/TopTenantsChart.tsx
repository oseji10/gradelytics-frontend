"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from "recharts";
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

export default function TopTenantsChart({
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
      .get("/admin/top-tenants", {
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
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="mt-2 h-3 w-44 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
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
  const showGrid = !isMinimal;
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

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Tenants</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Top revenue contributors by tenant</p>
        </div>
        <span className="rounded-full bg-[#1F6F43]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1F6F43]">
          {rangeLabel}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        {isHistogram ? (
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            {showGrid ? (
              <CartesianGrid
                stroke="rgba(0,0,0,0.05)"
                vertical={false}
                strokeDasharray={isDotted ? "4 4" : undefined}
              />
            ) : null}
            <XAxis
              dataKey="tenantName"
              tick={{ fill: "#6B7280", fontSize: isCompact ? 10 : 11 }}
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
              background={isStacked ? { fill: "#E5E7EB" } : undefined}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={palette[index % palette.length]}
                  fillOpacity={isOutlined ? 0.2 : 1}
                  stroke={isOutlined ? palette[index % palette.length] : undefined}
                  strokeWidth={isOutlined ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: isCompact ? 10 : 20, right: 30, left: isCompact ? 10 : 20, bottom: isCompact ? 10 : 20 }}
          >
            {showGrid ? (
              <CartesianGrid
                stroke="rgba(0,0,0,0.05)"
                vertical={false}
                strokeDasharray={isDotted ? "4 4" : undefined}
              />
            ) : null}
            <XAxis
              type="number"
              tickFormatter={(value) => `₦${value.toLocaleString()}`}
              tick={{ fill: "#6B7280", fontSize: isCompact ? 11 : 12 }}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              dataKey="tenantName"
              type="category"
              width={isCompact ? 110 : 150}
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
            <Bar
              dataKey="revenue"
              radius={[6, 6, 6, 6]}
              background={isStacked ? { fill: "#E5E7EB" } : undefined}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={palette[index % palette.length]}
                  fillOpacity={isOutlined ? 0.2 : 1}
                  stroke={isOutlined ? palette[index % palette.length] : undefined}
                  strokeWidth={isOutlined ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
