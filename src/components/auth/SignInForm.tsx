"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Icon from "@/components/Icons";
interface LoginResponse {
  success?: boolean;
  message?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  id?: string;
  schoolId?: string;
  requiresEmailVerification?: boolean;
  requiresPasswordSetup?: boolean;
  // access_token?: string; // If returned in body, uncomment
}

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  // const [email, setEmail] = useState("");


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError("");

//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signin`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         credentials: "include", // Crucial: sends/receives cookies
//         body: JSON.stringify(formData),
//       });

//       const data: LoginResponse = await response.json();

//       if (data.requiresEmailVerification) {
//   localStorage.setItem("pending_user_email", email);
//   router.push("/verify-email");
//   return;
// }

// if (data.requiresPasswordSetup) {
//   localStorage.setItem("pending_user_email", email);
//   router.push("/setup-password");
//   return;
// }
//       if (response.ok) {
//         // Store user data (even if JWT is in cookie, store profile info)
//         const userData = {
//           firstName: data.firstName,
//           lastName: data.lastName,
//           email: data.email,
//           phoneNumber: data.phoneNumber,
//           role: data.role,

//           // id: data.id,
//         };
//         // const schoolId = {data.schoolId;
//         localStorage.setItem("user", JSON.stringify(userData));
//         localStorage.setItem("currentSchoolId", String(data.schoolId)); // ✅

        
//         // Optional: If backend returns access_token in body, store it
//         // if (data.access_token) {
//         //   localStorage.setItem("access_token", data.access_token);
//         // }

//         // Redirect to dashboard
//         router.push("/dashboard");
//       } else {
//         setError(data.message || "Invalid credentials. Please try again.");
//       }
//     } catch (err) {
//       console.error("Login error:", err);
//       setError("Network error. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (data.requiresEmailVerification) {
      localStorage.setItem("pending_user_email", data.email);
      router.push("/verify-email");
      return;
    }

    if (data.requiresPasswordSetup) {
      localStorage.setItem("pending_user_email", data.email);
      router.push("/setup-password");
      return;
    }

    if (data.requiresPassword) {
      localStorage.setItem("pending_user_email", formData.username);
      router.push("/enter-password");
      return;
    }

    if (data.status) {
      router.push("/dashboard");
    } else {
      setError(data.message || "Login failed");
    }
  } catch {
    setError("Network error");
  } finally {
    setIsLoading(false);
  }
};



  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
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
              Sign In To Gradelytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                {/* <Input
                  name="username"
                  type="email"
                  placeholder="info@gmail.com"
                  value={formData.username}
                  onChange={handleChange}
                  required
                /> */}
                <Input
  type="email"
  placeholder="Enter your email"
  value={formData.username}
  onChange={(e) => setFormData({...formData, username: e.target.value})}
  required
/>

              </div>

              {/* <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      // <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      <Icon src={EyeIcon} className="fill-gray-500 dark:fill-gray-400"/>
                    ) : (
                      // <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      <Icon src={EyeCloseIcon} className="fill-gray-500 dark:fill-gray-400"/>
                    )}
                  </span>
                </div>
              </div> */}

              {/* <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Keep me logged in
                  </span>
                </div>
                <Link
                  href="/reset-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div> */}

              <div>
                {/* <Button
                  className="w-full bg-[#1F6F43]"
                  size="sm"
                  disabled={isLoading}
                  loading={isLoading} // Assuming your Button component supports loading prop
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button> */}

                <button
                  type="submit"
                  disabled={isLoading}
                  loading={isLoading} 
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-[#1F6F43] shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
                >
                  {isLoading ? "Checking..." : "Next"}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}