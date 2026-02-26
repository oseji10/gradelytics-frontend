"use client";

import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import api from "../../../lib/api";

export default function PaymentMethodChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/admin/payment-method-breakdown").then(res => {
      setData(res.data);
    });
  }, []);

  return (
    <div className="card">
      <h3>Payment Methods</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="paymentMethod" />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
