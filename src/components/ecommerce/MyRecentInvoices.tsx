// components/dashboard/RecentInvoices.tsx
"use client";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  total: number;
  status: "paid" | "unpaid" | "cancelled";
  created_at: string;
  public_id: string;
}

export default function MyRecentInvoices({ currency }: { currency: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/recent`)
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Invoices</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{invoices.length} shown</p>
      </div>

      {invoices.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No invoices yet. Create your first invoice to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Invoice</TableCell>
                <TableCell isHeader>Client</TableCell>
                <TableCell isHeader>Amount</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <p className="font-medium">{inv.invoice_number}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </TableCell>
                  <TableCell>{inv.client_name || "-"}</TableCell>
                  <TableCell>
                    {currency} {inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      color={
                        inv.status === "paid"
                          ? "success"
                          : inv.status === "unpaid"
                          ? "warning"
                          : "error"
                      }
                    >
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`/invoices/view?pid=${inv.public_id}`}
                      className="text-brand-500 hover:underline"
                    >
                      View
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}