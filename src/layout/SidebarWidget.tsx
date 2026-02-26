import React from "react";

export default function SidebarWidget() {
  return (
    <div
      className={`
        mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03] pb-10`}
    >
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
        Synchronize Data
      </h3>
      
      <a
        href="/dashboard/plans"
        target="_blank"
        rel="nofollow"
        className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-[#1F6F43] text-theme-sm hover:bg-brand-600"
      >
        Sync
      </a>
    </div>
  );
}