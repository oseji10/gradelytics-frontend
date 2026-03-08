"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Home,
  Trophy,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface ReviewOption {
  optionId: number;
  optionText: string;
  optionLabel?: string;
  isCorrect: boolean;
}

interface ReviewQuestion {
  questionId: number;
  questionText: string;
  questionType: string;
  mark: number;
  orderIndex: number;
  options: ReviewOption[];
  selectedOptionId?: number | null;
  answerText?: string | null;
  correctOptionId?: number | null;
  isCorrect?: boolean | null;
  scoreAwarded: number;
  isAnswered: boolean;
}

interface ReviewSection {
  sectionId: number | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  orderIndex: number;
  questions: ReviewQuestion[];
}

interface ReviewResponse {
  exam: {
    examId: number;
    title: string;
    subjectName: string;
    durationMinutes: number;
    submittedAt?: string | null;
    score: number;
    totalMarks: number;
    percentage: number;
    totalQuestions: number;
    answeredQuestions: number;
  };
  sections: ReviewSection[];
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function StudentExamReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId")
    ? Number(searchParams.get("examId"))
    : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ReviewResponse | null>(null);

  const loadReview = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/student/cbt/${examId}/review`,
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

        throw new Error("Failed to load exam review");
      }

      const response = await res.json();
      setData(response);
    } catch (err) {
      console.error(err);
      setError("Unable to load exam review right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isNaN(examId)) {
      loadReview();
    }
  }, [examId]);

  const flatQuestions = useMemo(() => {
    return (data?.sections ?? []).flatMap((section) => section.questions);
  }, [data]);

  const correctCount = useMemo(() => {
    return flatQuestions.filter((q) => q.isCorrect === true).length;
  }, [flatQuestions]);

  const wrongCount = useMemo(() => {
    return flatQuestions.filter(
      (q) => q.isAnswered && q.isCorrect === false
    ).length;
  }, [flatQuestions]);

  const skippedCount = useMemo(() => {
    return flatQuestions.filter((q) => !q.isAnswered).length;
  }, [flatQuestions]);

  if (loading) return <StudentExamReviewSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50 rounded-2xl">
            <CardContent className="py-8 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">
                  Unable to load review page
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {error || "Something went wrong."}
                </p>
                <div className="mt-4 flex gap-3">
                  <Button onClick={loadReview}>Retry</Button>
                  <Link href="/student/dashboard/cbt">
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

  const exam = data.exam;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Card className="rounded-3xl border-green-100 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 px-6 py-8 text-white">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/15">
                      {exam.subjectName}
                    </Badge>
                    <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/15">
                      Review
                    </Badge>
                  </div>

                  <h1 className="text-3xl font-bold">{exam.title}</h1>
                  <p className="mt-2 text-white/90">
                    Submitted at {formatDateTime(exam.submittedAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="/student/dashboard/cbt">
                    <Button className="bg-white text-green-700 hover:bg-green-50 rounded-xl">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to CBT
                    </Button>
                  </Link>

                  <Link href="/student/dashboard">
                    <Button
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 rounded-xl bg-white/20"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 p-6 bg-white">
              <StatCard
                icon={<Trophy className="h-5 w-5 text-green-700" />}
                label="Score"
                value={`${exam.score} / ${exam.totalMarks}`}
              />
              <StatCard
                icon={<CheckCircle2 className="h-5 w-5 text-green-700" />}
                label="Percentage"
                value={`${exam.percentage}%`}
              />
              <StatCard
                icon={<FileQuestion className="h-5 w-5 text-green-700" />}
                label="Answered"
                value={`${exam.answeredQuestions} / ${exam.totalQuestions}`}
              />
              <StatCard
                icon={<CheckCircle2 className="h-5 w-5 text-green-700" />}
                label="Correct"
                value={String(correctCount)}
              />
              <StatCard
                icon={<XCircle className="h-5 w-5 text-red-600" />}
                label="Wrong"
                value={String(wrongCount)}
              />
              <StatCard
                icon={<Clock3 className="h-5 w-5 text-amber-600" />}
                label="Skipped"
                value={String(skippedCount)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {data.sections.map((section, sectionIndex) => (
            <Card key={`${section.sectionId ?? "section"}-${sectionIndex}`} className="rounded-2xl">
              <CardHeader>
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  {section.instructions && (
                    <p className="text-sm text-muted-foreground">
                      {section.instructions}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {section.questions.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    No questions in this section.
                  </div>
                ) : (
                  section.questions.map((question, questionIndex) => (
                    <ReviewQuestionCard
                      key={question.questionId}
                      question={question}
                      number={questionIndex + 1}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

function ReviewQuestionCard({
  question,
  number,
}: {
  question: ReviewQuestion;
  number: number;
}) {
  const selectedOption = question.options.find(
    (option) => option.optionId === question.selectedOptionId
  );

  const correctOption = question.options.find((option) => option.isCorrect);

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Question {number}</p>
          <div className="mt-2 text-base md:text-lg font-medium text-gray-900 leading-7 whitespace-pre-line">
            {question.questionText}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{question.mark} mark(s)</Badge>

          {!question.isAnswered ? (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
              Skipped
            </Badge>
          ) : question.isCorrect ? (
            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
              Correct
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
              Wrong
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = option.optionId === question.selectedOptionId;
          const isCorrect = option.isCorrect;

          let className =
            "w-full rounded-2xl border p-4 text-left transition ";

          if (isCorrect && isSelected) {
            className += "border-green-500 bg-green-50";
          } else if (isCorrect) {
            className += "border-green-300 bg-green-50";
          } else if (isSelected && !isCorrect) {
            className += "border-red-300 bg-red-50";
          } else {
            className += "border-gray-200 bg-white";
          }

          return (
            <div key={option.optionId} className={className}>
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                    isCorrect
                      ? "border-green-600 bg-green-600 text-white"
                      : isSelected
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-gray-300 text-gray-600"
                  }`}
                >
                  {option.optionLabel || String.fromCharCode(65 + idx)}
                </div>

                <div className="flex-1">
                  <div className="text-sm md:text-base text-gray-900 whitespace-pre-line">
                    {option.optionText}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {isSelected && (
                      <Badge variant="outline">Your Answer</Badge>
                    )}
                    {isCorrect && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                        Correct Answer
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-gray-50 p-4 space-y-2 text-sm">
        <ReviewRow
          label="Your Answer"
          value={
            question.isAnswered
              ? selectedOption?.optionText || question.answerText || "Answered"
              : "Not answered"
          }
        />
        <ReviewRow
          label="Correct Answer"
          value={correctOption?.optionText || "—"}
        />
        <ReviewRow
          label="Score Awarded"
          value={String(question.scoreAwarded)}
        />
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function StatCard({
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
      <p className="text-2xl font-bold text-gray-900 mt-3 break-words">
        {value}
      </p>
    </div>
  );
}

function StudentExamReviewSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}