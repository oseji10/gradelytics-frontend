import ForgotPasswordForm from "@/components/auth/ForgotPassword";
import SetupPasswordPage from "@/components/auth/SetupPassword";
import { Metadata } from "next";
// import SetupPasswordPage from "../../../components/auth/SetupPassword";

export const metadata: Metadata = {
  title:
    "gradelytics | The powerful invoicing app",
  description: "Gradelytics is the simple, powerful school management platform that helps schools automate results, manage students and teachers, and gain real-time academic insights — all in one smart system.",
};

export default function ForgotPassword() {
  return <ForgotPasswordForm />;
}
