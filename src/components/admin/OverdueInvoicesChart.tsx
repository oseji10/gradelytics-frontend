"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useEffect, useState } from "react";
import api from "../../../lib/api";

export default function OverdueInvoicesChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/admin/overdue-invoices-summary").then(res => {
      const formatted = [
        { period: "1–7 days", count: res.data["1_7_days"], color: "#1F6F43" }, // Blue
        { period: "8–30 days", count: res.data["8_30_days"], color: "#F59E0B" }, // Amber
        { period: "31+ days", count: res.data["31_plus_days"], color: "#DC2626" }, // Crimson
      ];
      setData(formatted);
    });
  }, []);

  return (
    <div className="glass-card rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Overdue Invoices
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fill: "#6B7280", fontSize: 12 }}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            tickFormatter={(value) => value.toLocaleString()}
            tick={{ fill: "#6B7280", fontSize: 12 }}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "1px solid #E5E7EB",
            }}
            formatter={(value: number) => `${value.toLocaleString()} invoices`}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ fontSize: "13px", fontWeight: 500 }}
          />
          <Bar
            dataKey="count"
            radius={[6, 6, 0, 0]} // rounded top corners
          >
            {data.map((entry, index) => (
              <cell
                key={`bar-${index}`}
                fill={entry.color}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
