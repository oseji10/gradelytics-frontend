"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  Clock,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";

import api from "../../../lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

type ExamStatus = "Upcoming" | "Running" | "Ended" | "Cancelled";
type CandidateStatus = "in_progress" | "completed";

interface MonitorResponse {
  message: string;
  data: {
    exam: {
      examId: number;
      title: string;
      subjectName: string | null;
      classId: number;
      durationMinutes: number;
      startsAt: string | null;
      endsAt: string | null;
      status: ExamStatus;
    };
    summary: {
      eligibleCandidates: number;
      startedCount: number;
      inProgressCount: number;
      completedCount: number;
      notStartedCount: number;
    };
    candidates: Array<{
      attemptId: number;
      studentId: number;
      studentName: string;
      admissionNumber: string | null;
      status: CandidateStatus;
      startedAt: string | null;
      submittedAt: string | null;
      answeredQuestions: number;
      totalQuestions: number;
      score: number;
      remainingSeconds: number | null;
    }>;
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTimeLeft(seconds?: number | null) {
  if (seconds == null) return "—";

  const safe = Math.max(0, seconds);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function CbtMonitorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId")
    ? Number(searchParams.get("examId"))
    : NaN;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<MonitorResponse["data"] | null>(null);

  const loadMonitorData = async (showToast = false) => {
    try {
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const res = await api.get<MonitorResponse>(`/cbt/exams/${examId}/monitor`);

      setPayload(res.data.data);

      if (showToast) {
        toast({
          title: "Success",
          description: "Monitor data refreshed",
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load exam monitor data.");
      toast({
        title: "Error",
        description: "Failed to load exam monitor data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!Number.isNaN(examId)) {
      loadMonitorData();
    }
  }, [examId]);

  useEffect(() => {
    if (!payload) return;

    const interval = setInterval(() => {
      loadMonitorData();
    }, 15000);

    return () => clearInterval(interval);
  }, [payload?.exam.examId]);

  const candidates = payload?.candidates ?? [];

  const averageProgress = useMemo(() => {
    if (candidates.length === 0) return 0;

    const percentages = candidates.map((candidate) => {
      if (!candidate.totalQuestions) return 0;
      return (candidate.answeredQuestions / candidate.totalQuestions) * 100;
    });

    const avg =
      percentages.reduce((sum, value) => sum + value, 0) / percentages.length;

    return Math.round(avg);
  }, [candidates]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Card className="border-red-200 bg-red-50 rounded-2xl">
            <CardContent className="py-8 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Unable to load monitor</p>
                <p className="text-sm text-red-700 mt-1">
                  {error || "Something went wrong."}
                </p>
                <div className="mt-4 flex gap-3">
                  <Button onClick={() => loadMonitorData()}>Retry</Button>
                  <Button variant="outline" onClick={() => router.back()}>
                    Back
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { exam, summary } = payload;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="space-y-8 px-4 py-8 md:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Monitor Exam
              </h1>

              <Badge
                variant={
                  exam.status === "Running"
                    ? "default"
                    : exam.status === "Upcoming"
                    ? "secondary"
                    : exam.status === "Ended"
                    ? "outline"
                    : "destructive"
                }
                className={
                  exam.status === "Running"
                    ? "bg-[#1F6F43] hover:bg-[#1F6F43]/90 text-white"
                    : undefined
                }
              >
                {exam.status}
              </Badge>
            </div>

            <p className="text-lg font-semibold text-gray-900">{exam.title}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>{exam.subjectName || "No subject"}</span>
              <span>•</span>
              <span>{exam.durationMinutes} mins</span>
              <span>•</span>
              <span>Class ID: {exam.classId}</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => loadMonitorData(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Exam Schedule</CardTitle>
            <CardDescription>
              Live timing information for this exam
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Start Time
              </div>
              <p className="mt-2 text-base font-semibold text-gray-900">
                {formatDateTime(exam.startsAt)}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                End Time
              </div>
              <p className="mt-2 text-base font-semibold text-gray-900">
                {formatDateTime(exam.endsAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Eligible Candidates" value={summary.eligibleCandidates} />
          <StatCard label="Started" value={summary.startedCount} />
          <StatCard label="In Progress" value={summary.inProgressCount} />
          <StatCard label="Completed" value={summary.completedCount} />
          <StatCard label="Not Started" value={summary.notStartedCount} />
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Live Progress</CardTitle>
            <CardDescription>
              Average answered progress across active attempts: {averageProgress}%
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Candidates ({candidates.length})</CardTitle>
            <CardDescription>
              Students who have started or completed this exam
            </CardDescription>
          </CardHeader>

          <CardContent>
            {candidates.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                No attempt records yet for this exam.
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time Left</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate) => (
                      <TableRow key={candidate.attemptId}>
                        <TableCell>
                          <div className="font-medium">{candidate.studentName}</div>
                          <div className="text-xs text-muted-foreground">
                            {candidate.admissionNumber || "No admission no."}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              candidate.status === "in_progress"
                                ? "default"
                                : "outline"
                            }
                            className={
                              candidate.status === "in_progress"
                                ? "bg-[#1F6F43] hover:bg-[#1F6F43]/90 text-white"
                                : undefined
                            }
                          >
                            {candidate.status === "in_progress"
                              ? "In Progress"
                              : "Completed"}
                          </Badge>
                        </TableCell>

                        <TableCell>{formatDateTime(candidate.startedAt)}</TableCell>
                        <TableCell>{formatDateTime(candidate.submittedAt)}</TableCell>

                        <TableCell>
                          {candidate.answeredQuestions} / {candidate.totalQuestions}
                        </TableCell>

                        <TableCell>{candidate.score}</TableCell>

                        <TableCell>
                          {candidate.status === "in_progress"
                            ? formatTimeLeft(candidate.remainingSeconds)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{label}</span>
        </div>
        <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}