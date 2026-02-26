"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { ChevronLeftIcon, EyeIcon, InfoIcon } from "@/icons";
import Icon from "@/components/Icons";
import api from "../../../lib/api";
import Badge from "@/components/ui/badge/Badge";

/* ---------------- Types ---------------- */

interface Tenant {
  schoolId: number;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string | null;
  tenantLogo: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Customer {
  customerId: number;
  schoolId: number;
  customerName: string;
  customerAddress: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  created_at: string;
  updated_at: string;
  tenant: Tenant;
}

/* ---------------- Component ---------------- */

const ITEMS_PER_PAGE = 10;

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tenantFilter, setTenantFilter] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get("/customers/admin");
        setCustomers(res.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const formatDate = (date: string | null) =>
    date
      ? new Date(date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const formatAddress = (address: string | null) =>
    address ? address.replace(/\n/g, ", ") : "No address provided";

  // Unique tenants for filter
  const uniqueTenants = useMemo(() => {
    return Array.from(
      new Map(customers.map((c) => [c.tenant.schoolId, c.tenant])).values()
    );
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        searchTerm === "" ||
        customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.customerEmail &&
          customer.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.customerPhone && customer.customerPhone.includes(searchTerm)) ||
        customer.tenant.tenantName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTenant =
        tenantFilter === "all" || customer.tenant.schoolId === Number(tenantFilter);

      return matchesSearch && matchesTenant;
    });
  }, [customers, searchTerm, tenantFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tenantFilter]);

  // Safety: reset if current page is out of range
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const openModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    document.body.style.overflow = "unset";
  };

  const ViewButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="
        relative inline-flex items-center justify-center
        rounded-md bg-[#1F6F43]
        px-3 py-1.5 text-xs font-medium text-white
        shadow-sm transition-all duration-200
        hover:bg-[#084d93] hover:-translate-y-[1px] hover:shadow-md
        active:translate-y-0
      "
    >
      View
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 hover:translate-x-full" />
    </button>
  );

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="space-y-3 px-2 py-3 md:px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Icon src={ChevronLeftIcon} className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Customers Management
            </h1>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total: <span className="font-medium">{customers.length}</span>
            {filteredCustomers.length !== customers.length && (
              <span className="ml-2">(Showing: {filteredCustomers.length})</span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, phone, or business..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="all">All Businesses</option>
            {uniqueTenants.map((tenant) => (
              <option key={tenant.schoolId} value={tenant.schoolId}>
                {tenant.tenantName}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-2">
          {loading ? (
            <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">Loading customers…</div>
          ) : error ? (
            <div className="text-center py-6 text-sm text-red-600">{error}</div>
          ) : paginatedCustomers.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || tenantFilter !== "all"
                ? "No customers match your filters."
                : "No customers found."}
            </div>
          ) : (
            <>
              {paginatedCustomers.map((customer) => (
                <div
                  key={customer.customerId}
                  onClick={() => openModal(customer)}
                  className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1F6F43]/10 dark:bg-[#1F6F43]/20 flex items-center justify-center text-base font-bold text-[#1F6F43]">
                        {customer.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {customer.customerName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          ID: #{customer.customerId}
                        </p>
                      </div>
                    </div>
                    <ViewButton onClick={() => openModal(customer)} />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Contact</span>
                      <div className="mt-1">
                        {customer.customerEmail ? (
                          <p className="font-medium break-all text-gray-900 dark:text-gray-100">{customer.customerEmail}</p>
                        ) : (
                          <p className="text-gray-400">No email</p>
                        )}
                        {customer.customerPhone && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{customer.customerPhone}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Business</span>
                      <div className="mt-1 flex items-center gap-2">
                        <Icon src={InfoIcon} className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{customer.tenant.tenantName}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{customer.tenant.tenantEmail}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created</span>
                      <p className="font-medium text-xs mt-1 text-gray-900 dark:text-gray-100">{formatDate(customer.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Mobile Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 mt-8 px-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length}
                  </p>

                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                    >
                      ← Prev
                    </button>

                    <div className="flex items-center gap-3">
                      <label htmlFor="mobile-page-select" className="text-sm whitespace-nowrap">
                        Page:
                      </label>
                      <select
                        id="mobile-page-select"
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                        className="min-w-[80px] px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
                      >
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <option key={page} value={page}>
                            {page}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm text-gray-500">of {totalPages}</span>
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-200 dark:border-white/[0.08]">
                <TableRow>
                  <TableCell isHeader className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Customer
                  </TableCell>
                  <TableCell isHeader className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Contact
                  </TableCell>
                  <TableCell isHeader className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Business
                  </TableCell>
                  <TableCell isHeader className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Created
                  </TableCell>
                  <TableCell isHeader className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-gray-500 dark:text-gray-400">
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-red-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm || tenantFilter !== "all"
                        ? "No customers match your filters."
                        : "No customers found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <TableRow
                      key={customer.customerId}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                      onClick={() => openModal(customer)}
                    >
                      <TableCell className="px-3 py-2 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1F6F43]/10 dark:bg-[#1F6F43]/20 flex items-center justify-center text-sm font-semibold text-[#1F6F43]">
                            {customer.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800 dark:text-white/90 block">
                              {customer.customerName}
                            </span>
                            <span className="text-xs text-gray-500">ID: #{customer.customerId}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-2 text-start">
                        <div className="space-y-1">
                          {customer.customerEmail ? (
                            <div className="text-theme-sm text-gray-600 dark:text-gray-400">
                              {customer.customerEmail}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No email</span>
                          )}
                          {customer.customerPhone && (
                            <div className="text-xs text-gray-500">
                              {customer.customerPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-2 text-start">
                        <div className="flex items-center gap-2">
                          <Icon src={InfoIcon} className="w-4 h-4 text-gray-500" />
                          <div>
                            <span className="font-medium block">{customer.tenant.tenantName}</span>
                            <span className="text-xs text-gray-500">
                              {customer.tenant.tenantEmail}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-2 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                        {formatDate(customer.created_at)}
                      </TableCell>

                      <TableCell className="px-3 py-2 text-start">
                        <ViewButton onClick={() => openModal(customer)} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Desktop Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-white/[0.05] gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} customers
              </p>

              <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Previous
                </button>

                <div className="flex items-center gap-3">
                  <label
                    htmlFor="desktop-page-select"
                    className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap hidden sm:block"
                  >
                    Go to page:
                  </label>
                  <select
                    id="desktop-page-select"
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="min-w-[90px] px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <option key={page} value={page}>
                        {page}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                    of {totalPages}
                  </span>
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Customer Details
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-[#1F6F43]/10 dark:bg-[#1F6F43]/20 flex items-center justify-center text-3xl font-bold text-[#1F6F43]">
                  {selectedCustomer.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedCustomer.customerName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Customer ID: #{selectedCustomer.customerId}
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <Badge color="info" size="md">
                      Business: {selectedCustomer.tenant.tenantName}
                    </Badge>
                    <Badge color={selectedCustomer.tenant.status === "active" ? "success" : "secondary"} size="md">
                      {selectedCustomer.tenant.status.charAt(0).toUpperCase() + selectedCustomer.tenant.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Customer Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium break-all">
                        {selectedCustomer.customerEmail || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium">
                        {selectedCustomer.customerPhone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                      <p className="font-medium text-sm">
                        {formatAddress(selectedCustomer.customerAddress)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Associated Business
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Business Name</p>
                      <p className="font-medium">{selectedCustomer.tenant.tenantName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Business Email</p>
                      <p className="font-medium break-all">{selectedCustomer.tenant.tenantEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Business Phone</p>
                      <p className="font-medium">
                        {selectedCustomer.tenant.tenantPhone || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 mb-3">
                    Customer Timeline
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                      <p className="font-medium">{formatDate(selectedCustomer.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                      <p className="font-medium">{formatDate(selectedCustomer.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}