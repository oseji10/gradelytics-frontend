// components/layout/AppHeader.tsx  or  components/dashboard/DashboardHeader.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface AppHeaderProps {
  schoolName?: string;
  logoUrl?: string | null;
  showLogout?: boolean;     // optional – some pages might not want logout
}

export default function AppHeader({
  schoolName = "Your School",
  logoUrl,
  showLogout = true,
}: AppHeaderProps) {
  const router = useRouter();

  const fallbackLogo = `https://placehold.co/180x60/1F6F43/FFFFFF/png?text=${encodeURIComponent(
    schoolName.slice(0, 12) || "School"
  )}`;

  return (
    <header className="bg-white shadow-md border-b sticky top-0 z-20 backdrop-blur-sm bg-opacity-95 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={`${logoUrl}`}
            alt={`${schoolName} Logo`}
            className="h-16 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.src = fallbackLogo;
            }}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {schoolName} Result Portal
            </h1>
            <p className="text-sm text-green-700 font-medium">Powered by Gradelytics</p>
          </div>
        </div>

        {showLogout && (
          <Button
            variant="outline"
            size="sm"
            className="border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800"
            onClick={() => router.push("/logout")}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        )}
      </div>
    </header>
  );
}