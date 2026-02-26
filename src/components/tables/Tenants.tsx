// app/companies/page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon } from "@/icons";
import Icon from "@/components/Icons";
import api from "../../../lib/api";
import { useModal } from "../../../context/ModalContext";

interface Tenant {
  schoolId: number;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  tenantAddress: string | null;      // ← NEW
  taxId: string | null;              // ← NEW
  tenantLogo: string | null;
  authorizedSignature: string | null;
  timezone: string;
  countryCode: string | null;
  gatewayPreference: number;
  currency: {
    currencyName: string;
    currencyCode: string;
    currencySymbol: string;
    country: string;
    currencyId: number;
  } | number;
  payment_gateway: {
    paymentGatewayName: string;
    gatewayId: number;
  };
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  isDefault: number;
}

interface Currency {
  currencyId: number;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
}

interface Gateway {
  gatewayId: number;
  paymentGatewayName: string;
}

const timezones = [
  { value: "Africa/Lagos", label: "West Africa Time (Lagos, Nigeria) - WAT" },
  { value: "Africa/Accra", label: "Greenwich Mean Time (Accra, Ghana) - GMT" },
  { value: "Africa/Nairobi", label: "East Africa Time (Nairobi, Kenya) - EAT" },
  { value: "Africa/Johannesburg", label: "South Africa Standard Time (Johannesburg) - SAST" },
  { value: "Africa/Cairo", label: "Egypt Standard Time (Cairo) - EET" },
  { value: "Europe/London", label: "Greenwich Mean Time / British Summer Time (London) - GMT/BST" },
  { value: "Europe/Paris", label: "Central European Time (Paris, Berlin) - CET" },
  { value: "America/New_York", label: "Eastern Time (New York) - ET" },
  { value: "America/Chicago", label: "Central Time (Chicago) - CT" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles) - PT" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (Dubai) - GST" },
  { value: "Asia/Singapore", label: "Singapore Time - SGT" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (Tokyo) - JST" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (Sydney) - AEST" },
  { value: "Pacific/Auckland", label: "New Zealand Time (Auckland) - NZT" },
  { value: "UTC", label: "Coordinated Universal Time - UTC" },
];

export default function CompaniesListPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const { isAnyModalOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        const response = await api.get("/tenants/user-tenants");
        setTenants(response.data ?? []);
      } catch (error) {
        console.error("Error fetching tenants:", error);
        setTenants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  useEffect(() => {
    if (editingTenant) {
      const fetchData = async () => {
        try {
          const [currRes, gateRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/currencies`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment-gateways`),
          ]);

          if (currRes.ok) setCurrencies(await currRes.json());
          if (gateRes.ok) setGateways(await gateRes.json());
        } catch (err) {
          console.error("Failed to load options:", err);
        }
      };
      fetchData();
    }
  }, [editingTenant]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const handleViewTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    openModal();
  };

  const handleEditTenant = (tenant: Tenant) => {
    const currencyObject =
      tenant.currency && typeof tenant.currency === "object"
        ? tenant.currency
        : currencies.find((c) => c.currencyId === Number(tenant.currency)) || {
            currencyId: 1,
            currencyName: "Naira",
            currencyCode: "NGN",
            currencySymbol: "₦",
            country: "Nigeria",
          };

    setEditingTenant({
      ...tenant,
      currency: currencyObject,
    });

    setLogoPreview(
      tenant.tenantLogo
        ? `${process.env.NEXT_PUBLIC_FILE_URL}${tenant.tenantLogo}`
        : null
    );
    setSignaturePreview(
      tenant.authorizedSignature
        ? `${process.env.NEXT_PUBLIC_FILE_URL}${tenant.authorizedSignature}`
        : null
    );
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
    setSelectedTenant(null);
    setEditingTenant(null);
    setLogoPreview(null);
    setSignaturePreview(null);
    setSuccessMessage(null);
    setStatusError(null);
  };

  const handleStatusToggle = async (tenant: Tenant) => {
    const newStatus = tenant.status === "active" ? "inactive" : "active";
    setUpdatingStatus(tenant.schoolId);

    try {
      await api.patch(`/tenants/${tenant.schoolId}/status`, { status: newStatus });
      setTenants((prev) =>
        prev.map((t) =>
          t.schoolId === tenant.schoolId ? { ...t, status: newStatus } : t
        )
      );
      setStatusError(null);
    } catch (error: any) {
      console.error("Failed to update status:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update company status.";
      setStatusError(message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTenant) return;

    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData();

      formData.append("tenantName", (form.elements.namedItem("tenantName") as HTMLInputElement).value);
      formData.append("tenantEmail", (form.elements.namedItem("tenantEmail") as HTMLInputElement).value);
      formData.append("tenantPhone", (form.elements.namedItem("tenantPhone") as HTMLInputElement).value);
      formData.append("tenantAddress", (form.elements.namedItem("tenantAddress") as HTMLInputElement).value || "");  // ← NEW
      formData.append("taxId", (form.elements.namedItem("taxId") as HTMLInputElement).value || "");                  // ← NEW
      formData.append("timezone", (form.elements.namedItem("timezone") as HTMLSelectElement).value);
      formData.append("gatewayPreference", (form.elements.namedItem("gatewayPreference") as HTMLSelectElement).value);

      if (logoInputRef.current?.files?.[0]) {
        formData.append("tenantLogo", logoInputRef.current.files[0]);
      }
      if (signatureInputRef.current?.files?.[0]) {
        formData.append("authorizedSignature", signatureInputRef.current.files[0]);
      }

      formData.append("_method", "PUT");

      const response = await api.post(`/tenants/${editingTenant.schoolId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.tenant) {
        setTenants((prev) =>
          prev.map((t) =>
            t.schoolId === editingTenant.schoolId ? response.data.tenant : t
          )
        );
      }

      setSuccessMessage("Business updated successfully!");
      setTimeout(() => handleCloseModal(), 1500);
    } catch (error: any) {
      console.error("Update error:", error);
      alert(error?.response?.data?.message || "Failed to update business.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSignaturePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
      <div
        className={`transition-all duration-300 ${
          isAnyModalOpen ? "blur-md pointer-events-none" : ""
        }`}
      >
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
                My Businesses
              </h1>
            </div>
            <Link
              href="/dashboard/tenants/create"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1F6F43] hover:bg-[#084d93] px-3 py-1.5 text-sm font-medium text-white w-full sm:w-auto"
            >
              Add Business
            </Link>
          </div>

          {/* ────────────────────────────────────────────────
              MOBILE CARD VIEW
          ──────────────────────────────────────────────── */}
          <div className="block md:hidden space-y-2">
            {loading ? (
              <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">Loading businesses...</div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                No businesses found.{" "}
                <Link href="/dashboard/tenants/create" className="text-brand-600 hover:underline font-medium">
                  Add your first business
                </Link>
              </div>
            ) : (
              tenants.map((tenant) => (
                <div
                  key={tenant.schoolId}
                  className="rounded-lg border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.03] p-3 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border flex-shrink-0">
                        {tenant.tenantLogo ? (
                          <Image
                            width={40}
                            height={40}
                            src={`${process.env.NEXT_PUBLIC_FILE_URL}${tenant.tenantLogo}`}
                            alt={tenant.tenantName}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-400">
                            {tenant.tenantName[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {tenant.tenantName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {tenant.tenantEmail}
                        </p>
                      </div>
                    </div>
                    <ViewButton onClick={() => handleViewTenant(tenant)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2 border-gray-200 dark:border-white/[0.08]">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <div className="mt-1">
                        <Badge color={tenant.status === "active" ? "success" : "error"} size="sm">
                          {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Currency</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {tenant.currency && typeof tenant.currency === "object"
                          ? `${tenant.currency.currencySymbol} ${tenant.currency.currencyCode}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Address</span> {/* ← NEW */}
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate">
                        {tenant.tenantAddress || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Tax ID</span> {/* ← NEW */}
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {tenant.taxId || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created</span>
                      <p className="font-medium text-xs text-gray-900 dark:text-gray-100">{formatDate(tenant.created_at)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Active</span>
                      <div className="mt-1">
                        {tenant.isDefault === 1 ? (
                          <Badge size="sm" color="info">Current</Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/[0.08]">
                    <button
                      onClick={() => handleStatusToggle(tenant)}
                      disabled={updatingStatus === tenant.schoolId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                        style={{
                          backgroundColor: tenant.status === "active" ? "#10b981" : "#6b7280",
                        }}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                            tenant.status === "active" ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {tenant.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </button>

                    <button
                      onClick={() => handleEditTenant(tenant)}
                      className="text-brand-600 hover:text-brand-700 font-medium text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ────────────────────────────────────────────────
              DESKTOP TABLE VIEW
          ──────────────────────────────────────────────── */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[1200px]"> {/* Increased min-width to fit new columns */}
                <Table>
                  <TableHeader className="border-b border-gray-200 dark:border-white/[0.08]">
                    <TableRow>
                      <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Business</TableCell>
                      <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</TableCell>
                      <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</TableCell>
                      <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</TableCell>           {/* ← NEW */}
                      <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tax ID</TableCell>           {/* ← NEW */}
                      <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Currency</TableCell>
                      <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</TableCell>
                      <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</TableCell>
                      <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</TableCell>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-200 dark:divide-white/[0.08]">
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          Loading businesses...
                        </TableCell>
                      </TableRow>
                    ) : tenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No businesses found.{" "}
                          <Link href="/dashboard/tenants/create" className="text-brand-500 hover:underline">
                            Add your first business
                          </Link>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tenants.map((tenant) => (
                        <TableRow key={tenant.schoolId} className="hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden border">
                                {tenant.tenantLogo ? (
                                  <Image
                                    width={36}
                                    height={36}
                                    src={`${process.env.NEXT_PUBLIC_FILE_URL}${tenant.tenantLogo}`}
                                    alt={tenant.tenantName}
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                                    {tenant?.tenantName[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{tenant?.tenantName}</span>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3">
                            {tenant.isDefault === 1 ? (
                              <Badge size="sm" color="info">Current</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>

                          <TableCell className="px-4 py-3">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{tenant.tenantEmail}</p>
                              <p className="text-xs text-gray-500">{tenant.tenantPhone}</p>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 truncate max-w-[180px]">
                            {tenant.tenantAddress || "—"}  {/* ← NEW */}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {tenant.taxId || "—"}  {/* ← NEW */}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {tenant.currency && typeof tenant.currency === "object"
                              ? `${tenant.currency.currencySymbol} ${tenant.currency.currencyCode}`
                              : "—"}
                          </TableCell>

                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleStatusToggle(tenant)}
                                disabled={updatingStatus === tenant.schoolId}
                                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                                style={{
                                  backgroundColor: tenant.status === "active" ? "#10b981" : "#6b7280",
                                }}
                              >
                                <span
                                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                    tenant.status === "active" ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                              <Badge color={tenant.status === "active" ? "success" : "error"}>
                                {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{formatDate(tenant.created_at)}</TableCell>

                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ViewButton onClick={() => handleViewTenant(tenant)} />
                              <button
                                onClick={() => handleEditTenant(tenant)}
                                className="text-brand-600 hover:text-brand-700 font-medium text-sm"
                              >
                                Edit
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Details Modal – updated with new fields */}
      {selectedTenant && !editingTenant && !statusError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold">Business Details</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-8">
              {/* Company Header with Logo */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  {selectedTenant.tenantLogo ? (
                    <Image
                      width={96}
                      height={96}
                      src={`${process.env.NEXT_PUBLIC_FILE_URL}${selectedTenant.tenantLogo}`}
                      alt={selectedTenant?.tenantName}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl font-bold text-gray-600 dark:text-gray-400">
                      {selectedTenant?.tenantName[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTenant.tenantName}</h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                    {selectedTenant.isDefault === 1 && (
                      <Badge color="info" size="md">Current Business</Badge>
                    )}
                    <Badge color={selectedTenant.status === "active" ? "success" : "error"} size="md">
                      {selectedTenant.status.charAt(0).toUpperCase() + selectedTenant.status.slice(1)}
                    </Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ID: #{selectedTenant.schoolId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Business Information – now includes address & tax id */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Business Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                      <p className="font-medium">{selectedTenant.tenantAddress || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Tax ID / TIN / VAT</p>
                      <p className="font-medium">{selectedTenant.taxId || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                      <p className="font-medium">{selectedTenant.tenantEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                      <p className="font-medium">{selectedTenant.tenantPhone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Country Code</p>
                      <p className="font-medium">{selectedTenant.countryCode || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Financial Settings
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Currency</p>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{selectedTenant.currency?.currencySymbol || "?"}</span>
                        <span className="font-medium">{selectedTenant.currency?.currencyCode || "—"}</span>
                        <span className="text-sm text-gray-500">({selectedTenant.currency?.currencyName || "Unknown"})</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Payment Gateway</p>
                      <p className="font-medium">
                        {selectedTenant.payment_gateway?.paymentGatewayName || "Not set"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Regional Settings
                  </h4>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Timezone</p>
                    <p className="font-medium">
                      {timezones.find(t => t.value === selectedTenant.timezone)?.label || selectedTenant.timezone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Timeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created Date</p>
                    <p className="font-medium">{formatDate(selectedTenant.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="font-medium">{formatDate(selectedTenant.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Authorized Signature */}
              {selectedTenant.authorizedSignature && (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Authorized Signature
                  </h4>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col items-center">
                      <div className="w-64 h-24 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                        <Image
                          width={256}
                          height={96}
                          src={`${process.env.NEXT_PUBLIC_FILE_URL}${selectedTenant.authorizedSignature}`}
                          alt="Authorized Signature"
                          className="max-w-full max-h-full object-contain"
                          unoptimized
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Official signature for documents
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleCloseModal();
                    setTimeout(() => handleEditTenant(selectedTenant), 100);
                  }}
                  className="px-6 py-3 rounded-lg bg-[#1F6F43] hover:bg-[#084d93] text-white font-medium transition-colors"
                >
                  Edit Business
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal – now includes tenantAddress & taxId */}
      {editingTenant && !statusError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8 bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Edit Business</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-center">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Business Name</label>
                  <input
                    name="tenantName"
                    type="text"
                    defaultValue={editingTenant?.tenantName}
                    required
                    className="mt-1 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                  <input
                    name="tenantPhone"
                    type="tel"
                    defaultValue={editingTenant.tenantPhone}
                    required
                    className="mt-1 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                  <input
                    name="tenantEmail"
                    type="email"
                    defaultValue={editingTenant.tenantEmail}
                    required
                    className="mt-1 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tax ID / TIN / VAT Number</label>
                  <input
                    name="taxId"
                    type="text"
                    defaultValue={editingTenant.taxId || ""}
                    placeholder="0123456789Z1 or A12345678"
                    className="mt-1 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Business Address</label>
                <input
                  name="tenantAddress"
                  type="text"
                  defaultValue={editingTenant.tenantAddress || ""}
                  placeholder="123 Lagos Street, Ikeja, Lagos, Nigeria"
                  className="mt-1 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Business Logo</label>
                <input
                  ref={logoInputRef}
                  name="tenantLogo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-brand-50 file:text-brand-700"
                />
                {logoPreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Current/Preview:</p>
                    <img src={logoPreview} alt="Logo" className="h-32 w-32 object-contain rounded-lg border" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Authorized Signature</label>
                <input
                  ref={signatureInputRef}
                  name="authorizedSignature"
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureChange}
                  className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-brand-50 file:text-brand-700"
                />
                {signaturePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Current/Preview:</p>
                    <img src={signaturePreview} alt="Signature" className="h-24 w-64 object-contain rounded-lg border bg-white" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
                  <select
                    name="timezone"
                    defaultValue={editingTenant.timezone}
                    className="mt-1 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    required
                  >
                    <option value="">Select timezone</option>
                    {timezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Gateway</label>
                  <select
                    name="gatewayPreference"
                    defaultValue={editingTenant.gatewayPreference}
                    className="mt-1 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    required
                  >
                    {gateways.map((g) => (
                      <option key={g.gatewayId} value={g.gatewayId}>
                        {g.paymentGatewayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-lg bg-[#1F6F43] hover:bg-[#084d93] text-white font-medium disabled:opacity-70"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cannot Change Status
              </h2>
            </div>

            <div className="mb-8">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {statusError}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setStatusError(null);
                  closeModal();
                }}
                className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}