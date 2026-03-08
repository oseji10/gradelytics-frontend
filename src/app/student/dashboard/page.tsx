import ResultCheckerDashboard from "@/components/ecommerce/ResultCheckerDashboard";
import StudentLearnDashboard from "@/components/tables/StudentLearn";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Gradelytics | The powerful school management platform that helps schools automate results, manage students and teachers, and gain real-time academic insights — all in one smart system.",
  description: "Gradelytics is the simple, powerful school management platform that helps schools automate results, manage students and teachers, and gain real-time academic insights — all in one smart system.",
};

export default function StudentDashboard() {
  return <StudentLearnDashboard />;
}
