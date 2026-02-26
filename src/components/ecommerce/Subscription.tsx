// app/subscription/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import Button from "@/components/ui/button/Button";
import Link from "next/link";

export default function SubscriptionResult() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref");
  const reason = searchParams.get("reason");

  const isSuccess = !reason || reason === "successful";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {isSuccess ? (
          <>
            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Successful! 
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              Thank you for subscribing to gradelytics.
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Your plan has been upgraded. You now have access to all premium features.
            </p>

            {txRef && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-8">
                Transaction Reference: <span className="font-mono">{txRef}</span>
              </p>
            )}

            <div className="space-y-4">
              <Link href="/dashboard">
                <Button className="w-full !bg-[#1F6F43] !hover:bg-[#084d93]">
                  Go to Dashboard
                </Button>
              </Link>
<br/><br/>
              <Link href="/dashboard/invoices/create">
                <Button variant="outline" className="w-full">
                  Create An Invoice
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <XCircleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Failed
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              {reason === "cancelled"
                ? "You cancelled the payment."
                : "Something went wrong with your payment."}
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Don’t worry — no charges were made. You can try again anytime.
            </p>

            <div className="space-y-4">
              <Link href="/plans">
                <Button className="w-full !bg-[#1F6F43] !hover:bg-[#084d93]">
                  Try Again
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </>
        )}

        <p className="mt-10 text-xs text-gray-400 dark:text-gray-400">
          Questions? Contact support at support@gradelytics.app
        </p>
      </div>
    </div>
  );
}