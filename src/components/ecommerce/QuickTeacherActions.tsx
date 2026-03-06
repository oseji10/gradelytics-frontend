// components/gradelytics/QuickTeacherActions.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ClipboardList,
  BookOpen,
  BarChart3,
  PlusCircle,
  MessageSquare,
  Users,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickTeacherActionsProps {
  role: "teacher" | "principal" | "admin";
}

export default function QuickTeacherActions({ role }: QuickTeacherActionsProps) {
  const router = useRouter();

  const teacherActions = [
    {
      label: "Mark Attendance",
      icon: Users,
    //   variant: "default" as const,
    variant: "outline" as const,
      onClick: () => router.push("/dashboard/admin/attendance"),
    },
    {
      label: "Enter Grades",
      icon: BookOpen,
    //   variant: "default" as const,
    variant: "outline" as const,
      onClick: () => router.push("/dashboard/admin/continuous-assessment"),
    },
    {
      label: "Add Assessment",
      icon: PlusCircle,
      variant: "outline" as const,
      onClick: () => router.push("/dashboard/admin/psychomotor-domain"),
    },
    {
      label: "View Class Report",
      icon: BarChart3,
      variant: "outline" as const,
      onClick: () => router.push("/dashboard/admin/broadsheet-report"),
    },
    {
      label: "Comment on Results",
      icon: MessageSquare,
      variant: "outline" as const,
      onClick: () => router.push("/results/comments"),
    },
  ];

  const principalActions = [
    {
      label: "School Overview",
      icon: BarChart3,
      variant: "default" as const,
      onClick: () => router.push("/dashboard/school"),
    },
    {
      label: "Review Teacher Comments",
      icon: FileText,
      variant: "default" as const,
      onClick: () => router.push("/results/review-teacher-comments"),
    },
    {
      label: "Add Principal Comment",
      icon: MessageSquare,
      variant: "default" as const,
      onClick: () => router.push("/results/principal-comments"),
    },
    {
      label: "View All Classes",
      icon: Users,
      variant: "outline" as const,
      onClick: () => router.push("/classes"),
    },
    {
      label: "Generate Report Cards",
      icon: ClipboardList,
      variant: "outline" as const,
      onClick: () => router.push("/reports/generate"),
    },
  ];

  const actions = role === "principal" || role === "admin" ? principalActions : teacherActions;

  return (
    <Card className="border-none shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-14 justify-start gap-3 text-left font-medium"
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}