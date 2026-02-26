// app/plans/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import ComponentCard from "../common/ComponentCard";
import Button from "../ui/button/Button";
import api from "../../../lib/api";

// Checkmark & Cross SVGs
function CheckSVG({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6 text-green-500 flex-shrink-0"} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CrossSVG({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6 text-red-500 flex-shrink-0"} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface PlanFeature {
  text: string;
  available: boolean;
}

interface Plan {
  id: string | number;
  name: string;
  price: number;
  features: PlanFeature[];
  isPopular?: boolean;
  currencySymbol: string;
  is_subscribed: boolean;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await api.get("/plans");
        const rawPlans = res.data;

        const processedPlans: Plan[] = rawPlans.map((raw: any) => {
          let rawFeatures = raw.features || "";

          if (typeof rawFeatures === "string") {
            let cleaned = rawFeatures.trim();
            if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
              cleaned = cleaned.slice(1, -1);
            }
            rawFeatures = cleaned;
          }

          const featureStrings = rawFeatures
            .split('", "')
            .map((f: string) => f.replace(/^"|"$/g, "").trim())
            .filter((f: string) => f.length > 0);

          const features: PlanFeature[] = featureStrings.map((feature: string) => {
            const hasCross = feature.startsWith("✗") || feature.startsWith("\u2717");
            const text = feature.replace(/^✗|\u2717\s*/, "").trim();
            return {
              text,
              available: !hasCross,
            };
          });

          const price = parseFloat(raw.price);

          return {
            id: raw.planId,
            name: raw.planName,
            price,
            features,
            isPopular: raw.isPopular === 1 || raw.isPopular === true,
            currencySymbol: raw.currency_detail?.currencySymbol || "$",
            is_subscribed: raw.is_subscribed === true,
          };
        });

        setPlans(processedPlans);
      } catch (err) {
        console.error("Failed to load plans:", err);
        setError("Could not load pricing plans. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleUpgrade = async (plan: Plan) => {
    // Allow clicking on any paid plan (even if lower tier or same)
    // Only block if it's free or currently processing
    if (plan.price === 0) {
      return;
    }

    setProcessingPlan(plan.id.toString());

    try {
      const res = await api.post(`/subscribe/${plan.id}`);
      const { payment_link } = res.data;

      if (payment_link) {
        window.location.href = payment_link;
      }
    } catch (err: any) {
      console.error("Failed to initiate subscription:", err);
      alert(err?.response?.data?.error || "Failed to start subscription. Please try again.");
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center">
        <p className="text-xl text-gray-600">Loading plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }

  // Find current active plan ID for downgrade detection (for display only)
  const currentPlanId = plans.find((p) => p.is_subscribed)?.id || null;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Upgrade to unlock more features and grow your business faster.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isCurrentPlan = plan.is_subscribed;
          const isFreePlan = plan.price === 0;
          const isLowerTier =
            plan.price > 0 &&
            !isCurrentPlan &&
            currentPlanId &&
            (plan.id as number) < (currentPlanId as number);

          const buttonText = isCurrentPlan
            ? "Current Plan"
            : isFreePlan
            ? "Free Plan"
            : isLowerTier
            ? "Downgrade"
            : "Upgrade Now";

          // Only disable: Current Plan, Free Plan, or while processing
          const isButtonDisabled = isCurrentPlan || isFreePlan || processingPlan === plan.id.toString();

          return (
            <ComponentCard
              key={plan.id}
              className={`relative ${plan.isPopular ? "border-2 border-brand-500 shadow-lg" : ""}`}
            >
              {plan.isPopular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#1F6F43] text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{plan.name}</h2>

                <div className="mt-6">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {isFreePlan
                      ? "Free"
                      : `${plan.currencySymbol}${plan.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  </span>
                  {!isFreePlan && (
                    <span className="text-xl text-gray-500 dark:text-gray-400">
                      <br />
                      per month
                    </span>
                  )}
                </div>

                <ul className="mt-8 space-y-4 text-left">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {feature.available ? <CheckSVG /> : <CrossSVG />}
                      <span
                        className={`text-gray-700 dark:text-gray-300 ${
                          !feature.available ? "text-gray-400 line-through" : ""
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isButtonDisabled}
                  className={`mt-8 w-full ${
                    plan.isPopular && !isCurrentPlan && !isFreePlan
                      ? "bg-[#1F6F43] hover:bg-[#084d93]"
                      : isButtonDisabled
                      ? "bg-gray-500 dark:bg-gray-600 cursor-not-allowed opacity-70"
                      : "bg-[#1F6F43] hover:bg-[#084d93]"
                  }`}
                >
                  {processingPlan === plan.id.toString() ? "Processing..." : buttonText}
                </Button>

                {isLowerTier && (
                  <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 text-center">
                    Contact support to downgrade
                  </p>
                )}
              </div>
            </ComponentCard>
          );
        })}
      </div>

      <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Payments powered by Flutterwave • All paid plans are monthly subscriptions</p>
      </div>
    </div>
  );
}