"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Icon from "@/components/Icons";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    password: "",
    password_confirmation: "",
  });

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, [token, email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !email) {
      setError("Invalid reset link.");
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email: decodeURIComponent(email),
          password: formData.password,
          password_confirmation: formData.password_confirmation,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Your password has been reset successfully!");
        setTimeout(() => {
          router.push("/signin");
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password. The link may have expired.");
      }
    } catch (err) {
      setError("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // <div className="flex flex-col flex-1 lg:w-1/2 w-full bg-white dark:bg-gray-900">
    //   <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4 py-8">
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
     
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          {/* Mobile Logo */}
          <div className="block lg:hidden mb-8 text-center">
            <Link href="/" className="inline-block">
              <Image
                width={231}
                height={48}
                src="/images/logo/logo.svg"
                alt="Logo"
                priority
              />
            </Link>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Set New Password
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your new password must be different from previously used passwords.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                Redirecting to sign in...
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password">
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading || success}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  <Icon
                    src={showPassword ? EyeIcon : EyeCloseIcon}
                    className="w-5 h-5 fill-current"
                  />
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="password_confirmation">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                  disabled={isLoading || success}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  <Icon
                    src={showConfirmPassword ? EyeIcon : EyeCloseIcon}
                    className="w-5 h-5 fill-current"
                  />
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !token || !email || success}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#1F6F43] rounded-lg shadow hover:bg-[#0857a8] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{" "}
              <Link
                href="/signin"
                className="font-medium text-[#1F6F43] hover:text-[#0857a8] transition"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}