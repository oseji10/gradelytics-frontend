import ParentLogin from "@/components/auth/ParentLogin";
import SignInForm from "@/components/auth/SignInForm";
import StudentSignInPage from "@/components/auth/StudentLogin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Gradelytics | The powerful school management software for Nigerian schools",
  description: "Gradelytics is the simple, powerful school management platform that helps schools automate results, manage students and teachers, and gain real-time academic insights — all in one smart system.",
};

export default function SignIn() {
  return <StudentSignInPage />;
}
