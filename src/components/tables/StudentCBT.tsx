"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpenCheck,
  Clock3,
  FileQuestion,
  PlayCircle,
  RefreshCcw,
  Trophy,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ExamStatus = "not_started" | "in_progress" | "completed" | "missed";

interface ExamSummary {
  notStartedCount: number;
  inProgressCount: number;
  missedCount: number;
  completedCount: number;
}

interface StudentSchoolCbtExam {
  examId: number;
  title: string;
  subjectId: number;
  subjectName: string;
  classId: number;
  durationMinutes: number;
  totalQuestions: number | null;
  startTime: string | null;
  endTime: string | null;
  status: ExamStatus;
}

interface StatusResponse {
  message: string;
  summary: ExamSummary;
  availableExams: StudentSchoolCbtExam[];
  completedExams: StudentSchoolCbtExam[];
  missedExams: StudentSchoolCbtExam[];
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function getStatusBadge(status: ExamStatus) {
  switch (status) {
    case "not_started":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
          Not Started
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
          In Progress
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
          Completed
        </Badge>
      );
    case "missed":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
          Missed
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

export default function StudentSchoolCbtPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ExamSummary>({
    notStartedCount: 0,
    inProgressCount: 0,
    missedCount: 0,
    completedCount: 0,
  });
  const [availableExams, setAvailableExams] = useState<StudentSchoolCbtExam[]>([]);
  const [completedExams, setCompletedExams] = useState<StudentSchoolCbtExam[]>([]);
  const [missedExams, setMissedExams] = useState<StudentSchoolCbtExam[]>([]);
  const [error, setError] = useState("");

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/student/exams/status`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.replace("/student?reason=session_expired");
          return;
        }
        throw new Error("Failed to load school CBT exams");
      }

      const data: StatusResponse = await res.json();

      setSummary({
        notStartedCount: data.summary?.notStartedCount ?? 0,
        inProgressCount: data.summary?.inProgressCount ?? 0,
        missedCount: data.summary?.missedCount ?? 0,
        completedCount: data.summary?.completedCount ?? 0,
      });

      setAvailableExams(data.availableExams ?? []);
      setCompletedExams(data.completedExams ?? []);
      setMissedExams(data.missedExams ?? []);
    } catch (err) {
      console.error(err);
      setError("Unable to load school CBT exams right now.");
      setSummary({
        notStartedCount: 0,
        inProgressCount: 0,
        missedCount: 0,
        completedCount: 0,
      });
      setAvailableExams([]);
      setCompletedExams([]);
      setMissedExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  if (loading) return <StudentSchoolCbtSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Card className="border-green-100 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 px-6 py-8 text-white">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <p className="text-sm text-white/80">Gradelytics Learn</p>
                  <h1 className="text-3xl font-bold tracking-tight">
                    School CBT
                  </h1>
                  <p className="mt-2 text-white/90">
                    View and take your scheduled school computer-based tests.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="bg-primary border-white/30 text-white hover:bg-white/10 hover:text-white rounded-xl"
                    onClick={loadPage}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>

                  <Link href="/student/dashboard">
                    <Button className="bg-white text-green-700 hover:bg-green-50 rounded-xl">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-white">
              <StatCard label="Not Started" value={summary.notStartedCount} />
              <StatCard label="In Progress" value={summary.inProgressCount} />
              <StatCard label="Completed" value={summary.completedCount} />
              <StatCard label="Missed" value={summary.missedCount} />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50 rounded-2xl">
            <CardContent className="py-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Something went wrong</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <SectionTitle
          icon={<PlayCircle className="h-5 w-5 text-green-700" />}
          title="Available Exams"
          subtitle="Tests you can start or resume now"
        />

        {availableExams.length === 0 ? (
          <EmptyState
            icon={<BookOpenCheck className="h-8 w-8 text-muted-foreground" />}
            title="No available exams"
            description="There are no active school CBT exams for you at the moment."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {availableExams.map((exam) => (
              <ExamCard key={exam.examId} exam={exam} />
            ))}
          </div>
        )}

        <SectionTitle
          icon={<Trophy className="h-5 w-5 text-green-700" />}
          title="Completed Exams"
          subtitle="Tests you have already submitted"
        />

        {completedExams.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-8 w-8 text-muted-foreground" />}
            title="No completed exams yet"
            description="Your submitted school CBT exams will appear here."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {completedExams.map((exam) => (
              <ExamCard key={exam.examId} exam={exam} />
            ))}
          </div>
        )}

        <SectionTitle
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
          title="Missed Exams"
          subtitle="Scheduled tests whose time window has passed"
        />

        {missedExams.length === 0 ? (
          <EmptyState
            icon={<AlertCircle className="h-8 w-8 text-muted-foreground" />}
            title="No missed exams"
            description="You have not missed any school CBT exam."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {missedExams.map((exam) => (
              <ExamCard key={exam.examId} exam={exam} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ExamCard({ exam }: { exam: StudentSchoolCbtExam }) {
  const actionHref =
    exam.status === "in_progress"
      ? `/student/cbt/${exam.examId}/resume`
      : exam.status === "not_started"
      ? `/student/dashboard/start-exam?examId=${exam.examId}`
      : exam.status === "completed"
      ? `/student/dashboard/review?examId=${exam.examId}`
      : "#";

  const actionLabel =
    exam.status === "in_progress"
      ? "Resume Exam"
      : exam.status === "not_started"
      ? "Start Exam"
      : exam.status === "completed"
      ? "Review"
      : "Unavailable";

  return (
    <Card className="border-green-100 shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-lg leading-snug">{exam.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{exam.subjectName}</Badge>
              {getStatusBadge(exam.status)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <MiniInfo
            icon={<FileQuestion className="h-4 w-4 text-green-700" />}
            label="Questions"
            value={exam.totalQuestions != null ? String(exam.totalQuestions) : "—"}
          />
          <MiniInfo
            icon={<Clock3 className="h-4 w-4 text-green-700" />}
            label="Duration"
            value={`${exam.durationMinutes} mins`}
          />
          <MiniInfo
            icon={<Clock3 className="h-4 w-4 text-green-700" />}
            label="Start Time"
            value={formatDateTime(exam.startTime)}
          />
          <MiniInfo
            icon={<Clock3 className="h-4 w-4 text-green-700" />}
            label="End Time"
            value={formatDateTime(exam.endTime)}
          />
        </div>

        {exam.status === "in_progress" && (
          <div className="rounded-xl border bg-amber-50 p-3 text-sm text-amber-800">
            You have already started this exam. Resume to continue before time runs out.
          </div>
        )}

        {exam.status === "completed" && (
          <div className="rounded-xl border bg-green-50 p-3 text-sm text-green-800">
            You have submitted this exam successfully.
          </div>
        )}

        {exam.status === "missed" && (
          <div className="rounded-xl border bg-red-50 p-3 text-sm text-red-800">
            This exam is no longer available because the allowed time window has passed.
          </div>
        )}

        {actionHref === "#" ? (
          <Button disabled className="w-full rounded-xl">
            {actionLabel}
          </Button>
        ) : (
          <Link href={actionHref} className="block">
            <Button className="w-full rounded-xl bg-green-700 hover:bg-green-800">
              {actionLabel}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-gray-50 p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-gray-900 break-words">{value}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed rounded-2xl">
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </CardContent>
    </Card>
  );
}

function StudentSchoolCbtSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-8 w-64 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <Skeleton className="h-8 w-64 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}