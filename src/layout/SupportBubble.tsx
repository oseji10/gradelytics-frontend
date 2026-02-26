"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/Icons";
import { ChatIcon } from "@/icons";
import { getRole } from "../../lib/auth";

export default function SupportBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(getRole());
  }, []);

  if (pathname?.startsWith("/dashboard/support") || pathname?.startsWith("/dashboard/admin/support")) {
    return null;
  }

  const isAdmin = role?.toUpperCase().includes("ADMIN");
  if (isAdmin) return null;

  const targetPath = "/dashboard/support";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
      <style jsx>{`
        @keyframes bubbleIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes gentleWiggle {
          0% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-2px);
          }
          70% {
            transform: translateY(1px);
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
      <div
        className="hidden sm:flex items-center gap-3 rounded-2xl border border-black/10 bg-white/95 px-4 py-2 text-xs font-semibold text-gray-700 shadow-lg backdrop-blur dark:border-white/[0.12] dark:bg-gray-900/90 dark:text-gray-200"
        style={{ animation: "gentleWiggle 2.6s ease-in-out infinite" }}
      >
        Need help? We respond fast.
      </div>
      <button
        type="button"
        onClick={() => router.push(targetPath)}
        aria-label="Open support"
        className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-[#1F6F43] text-white shadow-[0_12px_30px_rgba(10,102,194,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#084e96] hover:shadow-[0_16px_40px_rgba(10,102,194,0.45)] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/30"
        style={{ animation: "bubbleIn 260ms ease-out" }}
      >
        <span className="absolute -inset-2 rounded-full bg-[#1F6F43]/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
        <Icon src={ChatIcon} className="relative h-5 w-5 filter brightness-0 invert" />
      </button>
    </div>
  );
}
