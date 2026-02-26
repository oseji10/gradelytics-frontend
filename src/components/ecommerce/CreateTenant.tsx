// app/companies/create/page.tsx
"use client";
import React, { useEffect, useState, useRef } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import api from "../../../lib/api";
import Icon from "@/components/Icons";
import Link from "next/link";

interface Currency {
  id: number;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  currencyId: number;
}

interface Timezone {
  value: string;
  label: string;
}

interface Gateway {
  gatewayId: string | number;
  paymentGatewayName: string;
}

// Success Modal
function SuccessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Success!</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Tenant has been created successfully.</p>
          <div className="flex gap-3 w-full">
            <Button
              onClick={() => {
                onClose();
                window.history.back();
              }}
              className="flex-1 bg-brand-600 hover:bg-brand-700"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Upgrade Required Modal
function UpgradeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Upgrade Required</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Sorry you can't add any more businesses. Upgrade to premium to add more businesses.
          </p>
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button asChild className="flex-1">
              <Link href="/dashboard/plans">Upgrade Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Modal
function ErrorModal({ isOpen, message, onClose }: { isOpen: boolean; message: string; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AddCompanyPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [loadingGateways, setLoadingGateways] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Image preview states
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const timezones: Timezone[] = [
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

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/currencies`);
        if (!res.ok) throw new Error("Failed to fetch currencies");
        const data = await res.json();
        setCurrencies(data);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to load currencies.");
      } finally {
        setLoadingCurrencies(false);
      }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment-gateways`);
        if (!res.ok) throw new Error("Failed to fetch payment gateways");
        const data = await res.json();
        setGateways(data);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to load payment gateways.");
      } finally {
        setLoadingGateways(false);
      }
    };
    fetchGateways();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSignaturePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setShowUpgradeModal(false);

    const formData = new FormData(e.currentTarget);

    try {
      await api.post("/tenants", formData, { headers: { "Content-Type": undefined } });

      setShowSuccessModal(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create tenant. Please try again.";

      if (message === "Sorry you can't add any more businesses. Upgrade to premium to add more businesses.") {
        setShowUpgradeModal(true);
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
          >
            <Icon src={ChevronLeftIcon} className="w-5 h-5" />
            Back
          </button>
        </div>

        <ComponentCard title="Add New Business">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="tenantName">Business Name</Label>
                <input
                  id="tenantName"
                  name="tenantName"
                  type="text"
                  placeholder="Acme Corporation"
                  required
                  className="mt-1 w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <Label htmlFor="tenantPhone">Phone Number</Label>
                <input
                  id="tenantPhone"
                  name="tenantPhone"
                  type="tel"
                  placeholder="+234 801 234 5678"
                  required
                  className="mt-1 w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="tenantEmail">Email Address</Label>
                <input
                  id="tenantEmail"
                  name="tenantEmail"
                  type="email"
                  placeholder="info@acme.com"
                  required
                  className="mt-1 w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  name="currency"
                  className="mt-1 w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                  disabled={loadingCurrencies}
                >
                  <option value="">{loadingCurrencies ? "Loading currencies..." : "Select currency"}</option>
                  {currencies.map((cur) => (
                    <option key={cur.currencyId} value={cur.currencyId}>
                      {cur.currencyName} ({cur.currencyCode} - {cur.currencySymbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Added fields: Business Address & Tax ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="tenantAddress">Business Address</Label>
                <input
                  id="tenantAddress"
                  name="tenantAddress"
                  type="text"
                  placeholder="123 Lagos Street, Ikeja, Lagos, Nigeria"
                  className="mt-1 w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <Label htmlFor="taxId">Tax ID / TIN / VAT Number</Label>
                <input
                  id="taxId"
                  name="taxId"
                  type="text"
                  placeholder="0123456789Z1 or A12345678"
                  className="mt-1 w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <Label htmlFor="tenantLogo">Business Logo</Label>
              <input
                ref={logoInputRef}
                id="tenantLogo"
                name="tenantLogo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-gray-700 dark:file:text-brand-300"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Recommended: Square image (e.g., 512x512 PNG or JPG)
              </p>
              {logoPreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                  <img src={logoPreview} alt="Logo preview" className="h-32 w-32 object-contain rounded-lg border border-gray-300 dark:border-gray-700" />
                </div>
              )}
            </div>

            {/* Authorized Signature */}
            <div>
              <Label htmlFor="authorizedSignature">Authorized Signature</Label>
              <input
                ref={signatureInputRef}
                id="authorizedSignature"
                name="authorizedSignature"
                type="file"
                accept="image/*"
                onChange={handleSignatureChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-gray-700 dark:file:text-brand-300"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Upload signature image (transparent PNG preferred)
              </p>
              {signaturePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                  <img src={signaturePreview} alt="Signature preview" className="h-24 w-64 object-contain rounded-lg border border-gray-300 dark:border-gray-700 bg-white" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  name="timezone"
                  className="mt-1 w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                >
                  <option value="">Select timezone</option>
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="gatewayPreference">Payment Gateway Preference</Label>
                <select
                  id="gatewayPreference"
                  name="gatewayPreference"
                  className="mt-1 w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                  disabled={loadingGateways}
                >
                  <option value="">{loadingGateways ? "Loading gateways..." : "Select gateway"}</option>
                  {gateways.map((gateway) => (
                    <option key={gateway.gatewayId} value={gateway.gatewayId}>
                      {gateway.paymentGatewayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                className="w-full md:w-auto !bg-[#1F6F43] hover:!bg-[#084d93]"
                disabled={isSubmitting || loadingCurrencies || loadingGateways}
              >
                {isSubmitting ? "Creating Business..." : "Create Business"}
              </Button>
            </div>
          </form>
        </ComponentCard>
      </div>

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      <ErrorModal
        isOpen={!!errorMessage}
        message={errorMessage || "An unknown error occurred."}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}