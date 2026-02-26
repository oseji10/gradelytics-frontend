"use client";

import React, { useState, useEffect } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
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
  const [activeTab, setActiveTab] = useState<"standard" | "nigeria">("standard");
  const [selectedNairaPlan, setSelectedNairaPlan] = useState<string>("Basic");

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
    if (plan.price === 0) return;

    setProcessingPlan(plan.id.toString());

    try {
      const res = await api.post(`/subscribe/${plan.id}`);
      const { payment_link } = res.data;
      if (payment_link) window.location.href = payment_link;
    } catch (err: any) {
      console.error("Failed to initiate subscription:", err);
      alert(err?.response?.data?.error || "Failed to start subscription. Please try again.");
    } finally {
      setProcessingPlan(null);
    }
  };

  const currentPlanId = plans.find((p) => p.is_subscribed)?.id || null;

  const nairaPlans = [
    { name: "Basic", amount: 3563 },
    { name: "Premium", amount: 8588 },
  ];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Tabs */}
      <div className="flex justify-center mb-8 gap-4">
        <button
          className={`px-6 py-2 rounded-t-lg font-semibold transition ${
            activeTab === "standard"
              ? "bg-[#1F6F43] text-white"
              : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
          onClick={() => setActiveTab("standard")}
        >
          Standard
        </button>
        <button
          className={`px-6 py-2 rounded-t-lg font-semibold transition ${
            activeTab === "nigeria"
              ? "bg-[#1F6F43] text-white"
              : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
          onClick={() => setActiveTab("nigeria")}
        >
          For Nigeria Customers 🇳🇬
        </button>
      </div>

      {/* Standard Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-0">
        {loading && <p className="text-center text-xl text-gray-600 col-span-full">Loading plans...</p>}
        {error && <p className="text-center text-xl text-red-600 col-span-full">{error}</p>}

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

      {/* Nigerian Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] z-40
          ${activeTab === "nigeria" ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-8 pt-24 flex flex-col h-full justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-4 text-center">
              Alternative Payment Option 🇳🇬
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-center">
              Select your plan and pay to the bank account below. Include your email or business name as description.
            </p>

            {/* Nigerian Plans Buttons */}
            <div className="flex justify-center gap-2 mb-4">
              {nairaPlans.map((plan) => (
                <Button
                  key={plan.name}
                  onClick={() => setSelectedNairaPlan(plan.name)}
                  className="bg-[#1F6F43] text-white px-3 py-2 rounded-lg hover:bg-[#1F6F43] transition"
                >
                  {plan.name} ₦{plan.amount}
                </Button>
              ))}
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4 text-center space-y-2">
              <p><strong>Account Name:</strong> ClickBase Technologies Ltd</p>
              <p><strong>Account Number:</strong> 1228481040</p>
              <p><strong>Bank:</strong> Zenith Bank</p>
              <p><strong>Email:</strong> support@gradelytics.app</p>
            </div>

            <div className="flex flex-col gap-3 items-center mb-6">
              <a
                href={`https://wa.me/2349088559072?text=${encodeURIComponent(
                  `I want to pay for gradelytics subscription. I just paid for ${selectedNairaPlan} plan.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#25D366] text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition w-full text-center"
              >
                Chat on WhatsApp
              </a>

              <a
                href="/dashboard/support"
                className="inline-block bg-[#1F6F43] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#084d93] transition w-full text-center"
              >
                Go to Support
              </a>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
              Note: Ensure you include your email or business name when making the payment.
            </p>
          </div>

          <Button
            className="self-end text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl font-bold mt-4"
            onClick={() => setActiveTab("standard")}
          >
            ×
          </Button>
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Payments powered by Flutterwave • All paid plans are monthly subscriptions</p>
      </div>
    </div>
  );
}
