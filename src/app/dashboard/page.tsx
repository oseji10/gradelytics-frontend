// app/(dashboard)/dashboard/page.tsx
"use client"; // <- Important, now this runs in the browser

import React, { useEffect, useState } from "react";
import BasicDashboard from "@/components/ecommerce/BasicDashboard";
import SuperAdminDashboard from "@/components/ecommerce/SuperAdminDashboard";
import { getRole } from "../../../lib/auth";

const DashboardPage: React.FC = () => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const userRole = getRole();
    setRole(userRole);
  }, []);

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1F6F43]"></div>
      </div>
    );
  }

  const isSuperAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  return isSuperAdmin ? <SuperAdminDashboard /> : <BasicDashboard />;
};

export default DashboardPage;
