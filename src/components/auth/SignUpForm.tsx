"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Image from "next/image"; // ← Added this import
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [currencies, setCurrencies] = useState<
    { currencyId: number; country: string; currencyName: string; currencySymbol?: string }[]
  >([]);

  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [currencyError, setCurrencyError] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    yourName: "",
    email: "",
    phoneNumber: "",
    currency: "",
  });

  // OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Fetch currencies on mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      setLoadingCurrencies(true);
      setCurrencyError("");
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/currencies`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrencies(data);
        } else {
          setCurrencyError("Failed to load currencies");
          console.error("Failed to fetch currencies");
        }
      } catch (error) {
        setCurrencyError("Error loading currencies");
        console.error("Error fetching currencies:", error);
      } finally {
        setLoadingCurrencies(false);
      }
    };

    fetchCurrencies();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isChecked) return;

    if (!formData.companyName.trim()) {
    alert("Company name is required!");
    // or set error state
    return;
  }

  if (!formData.yourName.trim()) {
    alert("Your name is required!");
    // or set error state
    return;
  }

  if (!formData.email.trim()) {
    alert("Email is required!");
    // or set error state
    return;
  }

  if (!formData.phoneNumber.trim()) {
    alert("Phone number is required!");
    // or set error state
    return;
  }

  if (!formData.currency.trim()) {
    alert("Currency is required!");
    // or set error state
    return;
  }
    setIsLoading(true);

    const payload = {
      companyName: formData.companyName.trim(),
      fullName: formData.yourName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      currencyId: Number(formData.currency),
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setUserEmail(formData.email);
        // setShowOtpModal(true);
        if (response.ok) {
  localStorage.setItem("pending_user_email", formData.email);
  router.push("/verify-email");
}

        setFormData({
          companyName: "",
          yourName: "",
          email: "",
          phoneNumber: "",
          currency: "",
        });
      } else {
        alert(data.message || "Sign up failed. Please check your details.");
      }
    } catch (error) {
      console.error("Error during sign up:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP handlers (unchanged)
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null;
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      const last = document.getElementById(`otp-5`) as HTMLInputElement | null;
      last?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setOtpError("Please enter complete OTP code");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    setOtpSuccess("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          otp: otpString,
        }),
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setOtpSuccess("Email verified! Redirecting to password setup...");
        localStorage.setItem("pending_user_email", userEmail);
        setTimeout(() => {
          router.push("/setup-password");
        }, 1200);
      } else {
        setOtpError(data.message || "Invalid OTP code");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setOtpError("");
    setOtpSuccess("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setOtpSuccess("OTP has been resent to your email!");
        setTimeout(() => setOtpSuccess(""), 3000);
      } else {
        setOtpError(data.message || "Failed to resend OTP");
      }
    } catch (error) {
      setOtpError("Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          {/* Logo - Visible ONLY on mobile (hidden on lg and larger) */}
          <div className="block lg:hidden mb-8 text-center">
            <Link href="/" className="inline-block">
              <Image
                width={231}
                height={48}
                src="/images/logo/logo.svg"
                alt="Logo"
                priority // Optional: faster load on initial view
              />
            </Link>
          </div>

          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your details to create an account!
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Company Name */}
              <div>
                <Label>
                  Company Name<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="companyName"
                  name="companyName"
                  placeholder="Enter your company name"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Your Name */}
              <div>
                <Label>
                  Your Name<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="yourName"
                  name="yourName"
                  placeholder="Enter your full name"
                  value={formData.yourName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label>
                  Email<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <Label>
                  Phone Number<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Currency Dropdown */}
              <div>
                <Label>
                  Currency<span className="text-error-500">*</span>
                </Label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  disabled={loadingCurrencies}
                  className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">
                    {loadingCurrencies
                      ? "Loading currencies..."
                      : currencyError
                      ? "Error loading currencies"
                      : "Select your currency"}
                  </option>
                  {currencies.map((c) => (
                    <option key={c.currencyId} value={c.currencyId}>
                      {c.country} - {c.currencyName} {c.currencySymbol ? `(${c.currencySymbol})` : ""}
                    </option>
                  ))}
                </select>
                {currencyError && (
                  <p className="mt-1 text-sm text-error-500">{currencyError}</p>
                )}
              </div>

              {/* Checkbox */}
              <div className="flex items-center gap-3">
                <Checkbox
                  className="w-5 h-5 accent-[#1F6F43]"
                  checked={isChecked}
                  onChange={setIsChecked}
                />
                <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                  By creating an account means you agree to the{" "}
                  <span className="text-gray-800 dark:text-white/90">
                    Terms and Conditions,
                  </span>{" "}
                  and our{" "}
                  <span className="text-gray-800 dark:text-white">
                    Privacy Policy
                  </span>
                </p>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || !isChecked || loadingCurrencies}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-[#1F6F43] shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Sign Up"}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Already have an account?
              <Link
                href="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                {" "}
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* OTP Modal - unchanged */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Verify Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                We sent a 6-digit code to <strong>{userEmail}</strong>
              </p>
            </div>

            {otpError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                {otpError}
              </div>
            )}
            {otpSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-4">
                {otpSuccess}
              </div>
            )}

            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  className="w-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-center text-xl font-semibold focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                />
              ))}
            </div>

            <button
              onClick={handleOtpSubmit}
              disabled={otpLoading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white py-3 rounded-lg font-semibold mb-4 transition"
            >
              {otpLoading ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="text-center">
              <button
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="text-brand-500 hover:text-brand-600 disabled:text-brand-400 font-medium"
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}