// app/password-reset/page.tsx
import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient"; // Your client component with useSearchParams
import ResetPasswordPage from "@/components/auth/PasswordReset";

export const metadata = {
  title: "Reset Password | gradelytics",
  description: "Reset your gradelytics account password securely.",
};

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1F6F43] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordPage />
    </Suspense>
  );
}