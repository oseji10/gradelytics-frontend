import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "gradelytics | The powerful invoicing app",
  description: "Gradelytics is the simple, powerful school management platform that helps schools automate results, manage students and teachers, and gain real-time academic insights — all in one smart system.",
};

export default function SignUp() {
  return <SignUpForm />;
}
