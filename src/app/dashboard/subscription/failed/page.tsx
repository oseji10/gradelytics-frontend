// app/dashboard/subscription/success/page.tsx
import { Suspense } from "react";
import SubscriptionResult from "@/components/ecommerce/Subscription";
import SubscriptionFailed from "@/components/ecommerce/SubscriptionFailure";

// This is a Server Component (default)
export default function SubscriptionSuccessPage() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="space-y-6">
          {/* Wrap the client component in Suspense */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Loading payment status...
                </p>
              </div>
            }
          >
            <SubscriptionFailed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Subscription Status | gradelytics",
  description: "Payment confirmation for your subscription.",
};