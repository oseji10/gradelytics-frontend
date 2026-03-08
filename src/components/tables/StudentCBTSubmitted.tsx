"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Home,
  Loader2,
  RefreshCcw,
  Trophy,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SubmittedExamSummary {
  examId: number;
  title: string;
  subjectName: string;
  status: "completed" | "submitted";
  submittedAt?: string | null;
  score?: number | null;
  totalQuestions?: number | null;
  answeredQuestions?: number | null;
  durationMinutes?: number | null;
  percentage?: number | null;
  canReview?: boolean;
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function StudentExamSubmittedPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
    const examId = searchParams.get("examId")
      ? Number(searchParams.get("examId"))
      : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<SubmittedExamSummary | null>(null);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/student/cbt/${examId}/submission-summary`,
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

        if (res.status === 404) {
          setSummary({
            examId,
            title: "Exam Submitted",
            subjectName: "School CBT",
            status: "completed",
            submittedAt: null,
            score: null,
            totalQuestions: null,
            answeredQuestions: null,
            durationMinutes: null,
            percentage: null,
            canReview: false,
          });
          return;
        }

        throw new Error("Failed to load submission summary");
      }

      const data = await res.json();

      setSummary({
        examId: data?.data?.examId ?? examId,
        title: data?.data?.title ?? "Exam Submitted",
        subjectName: data?.data?.subjectName ?? "School CBT",
        status: data?.data?.status ?? "completed",
        submittedAt: data?.data?.submittedAt ?? null,
        score: data?.data?.score ?? null,
        totalQuestions: data?.data?.totalQuestions ?? null,
        answeredQuestions: data?.data?.answeredQuestions ?? null,
        durationMinutes: data?.data?.durationMinutes ?? null,
        percentage: data?.data?.percentage ?? null,
        canReview: !!data?.data?.canReview,
      });
    } catch (err) {
      console.error(err);
      setError("Unable to load submission details right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isNaN(examId)) {
      loadSummary();
    }
  }, [examId]);

  if (loading) return <StudentExamSubmittedSkeleton />;

  if (error && !summary) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="border-red-200 bg-red-50 rounded-2xl">
            <CardContent className="py-8 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">
                  Unable to load submission page
                </p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <div className="mt-4 flex gap-3">
                  <Button onClick={loadSummary}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Link href="/student/cbt">
                    <Button variant="outline">Back to CBT</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const answered =
    summary?.answeredQuestions != null ? summary.answeredQuestions : "—";
  const total =
    summary?.totalQuestions != null ? summary.totalQuestions : "—";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card className="rounded-3xl border-green-100 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 px-6 py-10 text-white text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-white/15 flex items-center justify-center mb-5">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <p className="text-sm text-white/80">Gradelytics Learn</p>
              <h1 className="text-3xl font-bold mt-2">Exam Submitted</h1>
              <p className="mt-3 text-white/90 max-w-2xl mx-auto">
                Your answers have been submitted successfully. You can return to
                your dashboard or view more details below.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/15">
                  {summary?.subjectName || "School CBT"}
                </Badge>
                <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/15">
                  {summary?.status === "submitted" ? "Submitted" : "Completed"}
                </Badge>
              </div>
            </div>

            <div className="p-6 bg-white">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {summary?.title || "Exam Submitted"}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Submitted at {formatDateTime(summary?.submittedAt)}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <SummaryStatCard
                  icon={<FileQuestion className="h-5 w-5 text-green-700" />}
                  label="Answered"
                  value={`${answered}${total !== "—" ? ` / ${total}` : ""}`}
                />
                <SummaryStatCard
                  icon={<Trophy className="h-5 w-5 text-green-700" />}
                  label="Score"
                  value={
                    summary?.score != null ? String(summary.score) : "Pending"
                  }
                />
                <SummaryStatCard
                  icon={<CheckCircle2 className="h-5 w-5 text-green-700" />}
                  label="Percentage"
                  value={
                    summary?.percentage != null
                      ? `${summary.percentage}%`
                      : "Pending"
                  }
                />
                <SummaryStatCard
                  icon={<Clock3 className="h-5 w-5 text-green-700" />}
                  label="Duration"
                  value={
                    summary?.durationMinutes != null
                      ? `${summary.durationMinutes} mins`
                      : "—"
                  }
                />
              </div>

              <div className="mt-8 rounded-2xl border bg-green-50 p-4">
                <p className="text-sm font-medium text-green-900">
                  Submission recorded successfully
                </p>
                <p className="text-sm text-green-800 mt-1">
                  Your exam attempt has been saved. If your school allows review,
                  you may be able to view your answers after submission.
                </p>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    Some details could not be loaded
                  </p>
                  <p className="text-sm text-amber-800 mt-1">{error}</p>
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/student/dashboard/cbt">
                  <Button className="w-full sm:w-auto rounded-xl bg-green-700 hover:bg-green-800">
                    <Home className="h-4 w-4 mr-2" />
                    Back to CBT
                  </Button>
                </Link>

                <Link href="/student/dashboard">
                  <Button variant="outline" className="w-full sm:w-auto rounded-xl">
                    Go to Dashboard
                  </Button>
                </Link>

                {summary?.canReview && (
                  <Link href={`/student/dashboard/review?examId=${summary.examId}`}>
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl">
                      Review Exam
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function SummaryStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-3 break-words">{value}</p>
    </div>
  );
}

function StudentExamSubmittedSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-[420px] rounded-3xl" />
      </div>
    </div>
  );
}