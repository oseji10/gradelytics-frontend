"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function VerifyEmailPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("pending_user_email");
    if (!storedEmail) {
      router.push("/signin");
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  // ===== OTP INPUT HANDLERS =====
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  // ===== VERIFY OTP =====
  const verifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpString }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setSuccess("Email verified successfully. Redirecting...");
        setTimeout(() => {
          router.push("/setup-password");
        }, 1200);
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ===== RESEND OTP =====
  const resendOtp = async () => {
    setResendLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/resend-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setSuccess("OTP resent to your email");
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch {
      setError("Failed to resend OTP");
    } finally {
      setResendLoading(false);
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
              Verify your email
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the 6 digit OTP we sent to <b>{email}</b>
            </p>
          </div>

          {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}



         {/* OTP INPUTS */}
         <div className="flex justify-left gap-2 mb-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, i)}
              onPaste={i === 0 ? handleOtpPaste : undefined}
              className="w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg
                border-gray-300 dark:border-gray-600
                focus:border-brand-500 focus:ring-2 focus:ring-brand-200
                text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            />
          ))}
        </div>

                <button
          onClick={verifyOtp}
          disabled={loading}
          className="w-32 bg-[#1F6F43] hover:bg-brand-600 disabled:bg-brand-400 text-white py-3 rounded-lg font-semibold transition mb-4"
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        <div className="text-left">
          <button
            onClick={resendOtp}
            disabled={resendLoading}
            className="text-brand-500 hover:text-brand-600 disabled:text-brand-400 font-medium"
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
        </div>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Entered the wrong email?{" "}
              <Link
                href="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign In with a different email
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4">
//       <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-lg">
//         <h1 className="text-2xl font-bold text-center mb-2 text-gray-800 dark:text-white">
//           Verify your email
//         </h1>
//         <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
//           We sent a 6-digit code to <strong>{email}</strong>
//         </p>

//         {error && (
//           <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
//             {error}
//           </div>
//         )}

//         {success && (
//           <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg">
//             {success}
//           </div>
//         )}

//         {/* OTP INPUTS */}
//         <div className="flex justify-center gap-2 mb-6">
//           {otp.map((digit, i) => (
//             <input
//               key={i}
//               id={`otp-${i}`}
//               type="text"
//               maxLength={1}
//               value={digit}
//               onChange={(e) => handleOtpChange(e.target.value, i)}
//               onPaste={i === 0 ? handleOtpPaste : undefined}
//               className="w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg
//                 border-gray-300 dark:border-gray-600
//                 focus:border-brand-500 focus:ring-2 focus:ring-brand-200
//                 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
//             />
//           ))}
//         </div>

//         <button
//           onClick={verifyOtp}
//           disabled={loading}
//           className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white py-3 rounded-lg font-semibold transition mb-4"
//         >
//           {loading ? "Verifying..." : "Verify Email"}
//         </button>

//         <div className="text-center">
//           <button
//             onClick={resendOtp}
//             disabled={resendLoading}
//             className="text-brand-500 hover:text-brand-600 disabled:text-brand-400 font-medium"
//           >
//             {resendLoading ? "Sending..." : "Resend OTP"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
