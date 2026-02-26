// app/subscription/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import Button from "@/components/ui/button/Button";
import Link from "next/link";

export default function SubscriptionFailed() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref");
  const reason = searchParams.get("reason");
  const status = searchParams.get("status"); // Optional: some gateways use "status"

  // Success: has tx_ref and no failure reason (or explicitly successful)
  const isSuccess =
    txRef &&
    (!reason ||
      reason === "successful" ||
      reason === "success" ||
      status === "successful" ||
      status === "success");

  // Failure or cancellation: has a reason indicating error/cancellation
  const isCancelled = reason === "cancelled" || reason === "user_cancelled";
  const failureReason =
    reason && !["successful", "success", "cancelled", "user_cancelled"].includes(reason)
      ? reason
      : null;

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
                Transaction Reference:{" "}
                <span className="font-mono break-all">{txRef}</span>
              </p>
            )}

            <div className="space-y-4">
              <Link href="/dashboard">
                <Button className="w-full !bg-[#1F6F43] !hover:bg-[#084d93]">
                  Go to Dashboard
                </Button>
              </Link>

              <br />

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
              {isCancelled
                ? "You cancelled the payment process."
                : failureReason
                ? "Your payment could not be processed."
                : "Something went wrong with your payment."}
            </p>

            {failureReason && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Reason: <span className="font-medium">{failureReason}</span>
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              No charges were made to your account. You can try subscribing again.
            </p>

            {txRef && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Reference: <span className="font-mono">{txRef}</span>
              </p>
            )}

            <div className="space-y-4">
              <Link href="/plans">
                <Button className="w-full !bg-[#1F6F43] !hover:bg-[#084d93]">
                  Try Again
                </Button>
              </Link>
<br/><br/>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </>
        )}

        <p className="mt-10 text-xs text-gray-400 dark:text-gray-500">
          Questions? Contact support at{" "}
          <a
            href="mailto:support@gradelytics.app"
            className="underline hover:text-gray-600 dark:hover:text-gray-300"
          >
            support@gradelytics.app
          </a>
        </p>
      </div>
    </div>
  );
}