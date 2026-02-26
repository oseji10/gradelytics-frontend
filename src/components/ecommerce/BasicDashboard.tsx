// app/(dashboard)/dashboard/page.tsx for Basic (Tenant) User
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRight, faArrowDownLeft } from "@fortawesome/free-solid-svg-icons";
import OutstandingAndCollected from "@/components/ecommerce/OutstandingAndCollected";
import RecentInvoices from "@/components/ecommerce/RecentInvoices";
import QuickActions from "@/components/ecommerce/QuickActions";
import { getUserName } from "../../../lib/auth";

export default function BasicDashboard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const currency = "₦";

  useEffect(() => {
    const userName = getUserName();
    if (!userName) {
      router.push("/signin");
    } else {
      setName(userName);
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1F6F43]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f9fc] to-[#eef2f7] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 sm:p-6 lg:p-8">
      {/* Welcome Header with Quick Actions */}
      <div className="mb-4 animate-fade-in">
        <div className="bg-[#1F6F43] rounded-2xl shadow-xl overflow-hidden">
          {/* <div className="bg-gradient-to-r from-[#1F6F43] to-[#084d93] dark:from-[#1e3a5f] dark:to-[#0d1f3c] rounded-2xl shadow-xl overflow-hidden"> */}
          <div className="p-8 sm:p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-lg">
                  <img 
                    src="/images/avatar.png" 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {!document.querySelector('img')?.src && (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">
                    Welcome back, {name || "User"}! 👋
                  </h1>
                  <p className="text-xs text-blue-100 mt-1">
                    Invoice dashboard overview
                  </p>
                </div>
              </div>
              <div className="w-full lg:w-auto">
                <p className="text-xs text-blue-100 font-medium uppercase tracking-widest mb-4">Quick Actions</p>
                <QuickActions />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs: Outstanding & Collected - Enhanced */}
      <div className="mb-2">
        {/* <OutstandingAndCollected currency={currency} /> */}
      </div>

      {/* Recent Invoices - Enhanced */}
      <div>
        {/* <RecentInvoices currency={currency} /> */}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}