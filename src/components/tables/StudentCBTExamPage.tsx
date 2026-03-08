"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Loader2,
  Send,
  User,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "short_answer";

interface ExamOption {
  optionId: number;
  optionText: string;
  optionLabel?: string;
}

interface ExamQuestion {
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  marks: number;
  options: ExamOption[];
  answer?: number[] | null;
  answerText?: string | null;
  isFlagged?: boolean;
}

interface ExamSection {
  sectionId: number | null;
  title: string;
  instruction?: string | null;
  questions: ExamQuestion[];
}

interface StudentIdentity {
  studentId: number;
  studentName: string;
  className?: string | null;
  passportUrl?: string | null;
}

interface ExamAttemptPayload {
  examId: number;
  attemptId: number;
  title: string;
  subjectName: string;
  durationMinutes: number;
  instruction?: string | null;
  startedAt: string;
  endsAt: string;
  status: "in_progress" | "submitted" | "expired";
  student?: StudentIdentity | null;
  sections: ExamSection[];
}

interface StartExamApiResponse {
  message: string;
  data: {
    student?: {
      studentId: number;
      studentName: string;
      className?: string | null;
      passportUrl?: string | null;
    };
    exam: {
      examId: number;
      title: string;
      subjectName: string;
      durationMinutes: number;
      instruction?: string | null;
      startedAt: string;
      endsAt: string;
      timeRemainingSeconds: number;
    };
    attempt: {
      attemptId: number;
      status: "in_progress" | "completed";
    };
    sections: Array<{
      sectionId: number | null;
      title: string;
      description?: string | null;
      instructions?: string | null;
      orderIndex: number;
      questions: Array<{
        questionId: number;
        questionText: string;
        type: string | null;
        mark: number;
        orderIndex: number;
        options: Array<{
          optionId: number;
          optionText: string;
          optionLabel?: string;
        }>;
        studentAnswer?: {
          selectedOptionId?: number | null;
          answerText?: string | null;
          isFlagged?: boolean;
        } | null;
      }>;
    }>;
  };
}

export default function StudentTakeExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId")
    ? Number(searchParams.get("examId"))
    : NaN;

  const [loading, setLoading] = useState(true);
  const [savingQuestionId, setSavingQuestionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [error, setError] = useState("");

  const [exam, setExam] = useState<ExamAttemptPayload | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const autosaveTimeout = useRef<NodeJS.Timeout | null>(null);

  const normalizeQuestionType = (type: string | null): QuestionType => {
    if (type === "multiple_choice") return "single_choice";
    if (type === "single_choice") return "single_choice";
    if (type === "true_false") return "true_false";
    if (type === "short_answer") return "short_answer";
    return "single_choice";
  };

  const normalizePayload = (response: StartExamApiResponse): ExamAttemptPayload => {
    return {
      examId: response.data.exam.examId,
      attemptId: response.data.attempt.attemptId,
      title: response.data.exam.title,
      subjectName: response.data.exam.subjectName,
      durationMinutes: response.data.exam.durationMinutes,
      instruction: response.data.exam.instruction ?? null,
      startedAt: response.data.exam.startedAt,
      endsAt: response.data.exam.endsAt,
      status: response.data.attempt.status === "completed" ? "submitted" : "in_progress",
      student: response.data.student
        ? {
            studentId: response.data.student.studentId,
            studentName: response.data.student.studentName,
            className: response.data.student.className ?? null,
            passportUrl: response.data.student.passportUrl ?? null,
          }
        : null,
      sections: (response.data.sections ?? []).map((section) => ({
        sectionId: section.sectionId,
        title: section.title,
        instruction: section.instructions ?? null,
        questions: (section.questions ?? []).map((question) => ({
          questionId: question.questionId,
          questionText: question.questionText,
          questionType: normalizeQuestionType(question.type),
          marks: Number(question.mark ?? 1),
          options: question.options ?? [],
          answer: question.studentAnswer?.selectedOptionId
            ? [question.studentAnswer.selectedOptionId]
            : [],
          answerText: question.studentAnswer?.answerText ?? null,
          isFlagged: !!question.studentAnswer?.isFlagged,
        })),
      })),
    };
  };

  const findFirstNonEmptySectionIndex = (sections: ExamSection[]) => {
    const index = sections.findIndex((section) => section.questions.length > 0);
    return index === -1 ? 0 : index;
  };

  const loadExam = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/student/cbt/${examId}/start`,
        {
          method: "POST",
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
        throw new Error("Failed to load exam");
      }

      const response: StartExamApiResponse = await res.json();
      const normalized = normalizePayload(response);

      setExam(normalized);
      setTimeLeft(Math.max(0, Math.floor(response.data.exam.timeRemainingSeconds ?? 0)));

      const firstValidSectionIndex = findFirstNonEmptySectionIndex(normalized.sections);
      setActiveSectionIndex(firstValidSectionIndex);
      setActiveQuestionIndex(0);
    } catch (err) {
      console.error(err);
      setError("Unable to load exam right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isNaN(examId)) {
      loadExam();
    }
  }, [examId]);

  useEffect(() => {
    if (!exam) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 1);

        if (next <= 0) {
          clearInterval(timer);
          handleSubmitExam(true);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam]);

  const sections = exam?.sections ?? [];
  const activeSection = sections[activeSectionIndex] ?? null;
  const activeQuestion = activeSection?.questions?.[activeQuestionIndex] ?? null;

  const flatQuestions = useMemo(() => {
    return sections.flatMap((section, sectionIndex) =>
      section.questions.map((question, questionIndex) => ({
        ...question,
        sectionId: section.sectionId,
        sectionTitle: section.title,
        sectionIndex,
        questionIndex,
      }))
    );
  }, [sections]);

  const answeredCount = useMemo(() => {
    return flatQuestions.filter((q) => (q.answer?.length ?? 0) > 0).length;
  }, [flatQuestions]);

  const flaggedCount = useMemo(() => {
    return flatQuestions.filter((q) => q.isFlagged).length;
  }, [flatQuestions]);

  const totalQuestions = flatQuestions.length;
  const progressPercent = totalQuestions
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  const sectionAnsweredCount = useMemo(() => {
    if (!activeSection) return 0;
    return activeSection.questions.filter((q) => (q.answer?.length ?? 0) > 0).length;
  }, [activeSection]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const updateQuestionLocally = (
    sectionIndex: number,
    questionIndex: number,
    updates: Partial<ExamQuestion>
  ) => {
    setExam((prev) => {
      if (!prev) return prev;

      const nextSections = [...prev.sections];
      const nextSection = { ...nextSections[sectionIndex] };
      const nextQuestions = [...nextSection.questions];
      const nextQuestion = { ...nextQuestions[questionIndex], ...updates };

      nextQuestions[questionIndex] = nextQuestion;
      nextSection.questions = nextQuestions;
      nextSections[sectionIndex] = nextSection;

      return { ...prev, sections: nextSections };
    });
  };

  const saveAnswer = async (
    questionId: number,
    selectedOptionIds: number[],
    flagged?: boolean
  ) => {
    if (!exam) return;

    try {
      setSavingQuestionId(questionId);

      const selectedOptionId = selectedOptionIds.length ? selectedOptionIds[0] : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/student/cbt/${exam.examId}/answer`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId,
            selectedOptionId,
            isFlagged: !!flagged,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to save answer");
      }
    } catch (err) {
      console.error("Failed to save answer", err);
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleSelectOption = (optionId: number) => {
    if (!exam || !activeQuestion || !activeSection) return;

    let nextAnswer: number[] = [];

    if (activeQuestion.questionType === "multiple_choice") {
      const current = activeQuestion.answer ?? [];
      nextAnswer = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
    } else {
      nextAnswer = [optionId];
    }

    updateQuestionLocally(activeSectionIndex, activeQuestionIndex, {
      answer: nextAnswer,
    });

    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);

    autosaveTimeout.current = setTimeout(() => {
      saveAnswer(
        activeQuestion.questionId,
        nextAnswer,
        activeQuestion.isFlagged ?? false
      );
    }, 400);
  };

  const handleToggleFlag = () => {
    if (!activeQuestion) return;

    const nextFlagged = !activeQuestion.isFlagged;

    updateQuestionLocally(activeSectionIndex, activeQuestionIndex, {
      isFlagged: nextFlagged,
    });

    saveAnswer(
      activeQuestion.questionId,
      activeQuestion.answer ?? [],
      nextFlagged
    );
  };

  const goToQuestion = (sectionIndex: number, questionIndex: number) => {
    setActiveSectionIndex(sectionIndex);
    setActiveQuestionIndex(questionIndex);
  };

  const goNext = () => {
    if (!activeSection) return;

    if (activeQuestionIndex < activeSection.questions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
      return;
    }

    let nextSectionIndex = activeSectionIndex + 1;
    while (nextSectionIndex < sections.length) {
      if (sections[nextSectionIndex].questions.length > 0) {
        setActiveSectionIndex(nextSectionIndex);
        setActiveQuestionIndex(0);
        return;
      }
      nextSectionIndex++;
    }
  };

  const goPrevious = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex((prev) => prev - 1);
      return;
    }

    let prevSectionIndex = activeSectionIndex - 1;
    while (prevSectionIndex >= 0) {
      const prevSection = sections[prevSectionIndex];
      if (prevSection.questions.length > 0) {
        setActiveSectionIndex(prevSectionIndex);
        setActiveQuestionIndex(Math.max(0, prevSection.questions.length - 1));
        return;
      }
      prevSectionIndex--;
    }
  };

  const handleSubmitExam = async (autoSubmit = false) => {
    if (!exam) return;

    try {
      setSubmitting(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/student/cbt/${exam.examId}/submit`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            autoSubmit,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to submit exam");
      }

      router.replace(`/student/dashboard/submitted?examId=${exam.examId}`);
    } catch (err) {
      console.error(err);
      setError("Unable to submit exam right now.");
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  if (loading) return <StudentExamSkeleton />;

  if (error && !exam) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="border-red-200 bg-red-50 rounded-2xl">
            <CardContent className="py-8 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Unable to load exam</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <div className="mt-4">
                  <Button onClick={loadExam}>Retry</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!exam || totalQuestions === 0 || !activeSection || !activeQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="rounded-2xl">
            <CardContent className="py-10 text-center">
              <p className="text-lg font-semibold">No exam content found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                This exam has no usable questions yet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isLowTime = timeLeft <= 300;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-4 lg:py-6 space-y-6">
        <Card className="rounded-2xl border-green-100 shadow-sm">
          <CardContent className="p-5 lg:p-6">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{exam.subjectName}</Badge>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {sections.length} Section{sections.length > 1 ? "s" : ""}
                  </Badge>
                </div>

                <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>

                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>
                    Section {activeSectionIndex + 1} of {sections.length}
                  </span>
                  <span>•</span>
                  <span>{activeSection.title}</span>
                  <span>•</span>
                  <span>
                    Question {activeQuestionIndex + 1} of{" "}
                    {activeSection.questions.length}
                  </span>
                </div>
              </div>

              <div
                className={`rounded-2xl border px-4 py-3 min-w-[160px] ${
                  isLowTime
                    ? "bg-red-50 border-red-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                  <span>Time Left</span>
                </div>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    isLowTime ? "text-red-700" : "text-green-700"
                  }`}
                >
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">
                  {answeredCount}/{totalQuestions} answered
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </CardContent>

          <div className="lg:hidden sticky top-3 z-20">
  <StudentIdentityCard student={exam.student} compact />
</div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="hidden lg:block">
  <StudentIdentityCard student={exam.student} />
</div>
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sections.map((section, index) => {
                  const answered = section.questions.filter(
                    (q) => (q.answer?.length ?? 0) > 0
                  ).length;

                  const isActive = activeSectionIndex === index;

                  return (
                    <button
                      key={`${section.sectionId ?? "section"}-${index}`}
                      onClick={() => {
                        if (section.questions.length === 0) return;
                        setActiveSectionIndex(index);
                        setActiveQuestionIndex(0);
                      }}
                      className={`w-full text-left rounded-xl border p-3 transition ${
                        isActive
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 hover:bg-gray-50"
                      } ${section.questions.length === 0 ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm text-gray-900">
                          {section.title}
                        </p>
                        {isActive && section.questions.length > 0 && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {answered}/{section.questions.length} answered
                      </p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Exam Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <SummaryRow label="Answered" value={answeredCount} />
                <SummaryRow label="Unanswered" value={totalQuestions - answeredCount} />
                <SummaryRow label="Flagged" value={flaggedCount} />
                <Separator />
                <Button
                  className="w-full rounded-xl bg-green-700 hover:bg-green-800"
                  onClick={() => setShowSubmitDialog(true)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Exam
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-9 space-y-6">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="text-lg">{activeSection.title}</CardTitle>
                    {activeSection.instruction && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {activeSection.instruction}
                      </p>
                    )}
                  </div>

                  <Badge variant="outline">
                    {sectionAnsweredCount}/{activeSection.questions.length} answered
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Question {activeQuestionIndex + 1}
                    </p>
                    <div className="mt-2 text-base md:text-lg font-medium text-gray-900 leading-7 whitespace-pre-line">
                      {activeQuestion.questionText}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{activeQuestion.marks} mark(s)</Badge>
                    {savingQuestionId === activeQuestion.questionId && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Saving...
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {activeQuestion.options.map((option, idx) => {
                    const selected =
                      activeQuestion.answer?.includes(option.optionId) ?? false;

                    return (
                      <button
                        key={option.optionId}
                        onClick={() => handleSelectOption(option.optionId)}
                        className={`w-full text-left rounded-2xl border p-4 transition ${
                          selected
                            ? "border-green-400 bg-green-50"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                              selected
                                ? "border-green-600 bg-green-600 text-white"
                                : "border-gray-300 text-gray-600"
                            }`}
                          >
                            {option.optionLabel || String.fromCharCode(65 + idx)}
                          </div>

                          <div className="text-sm md:text-base text-gray-900 whitespace-pre-line">
                            {option.optionText}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={handleToggleFlag}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    {activeQuestion.isFlagged ? "Remove Flag" : "Mark for Review"}
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={goPrevious}
                      disabled={activeSectionIndex === 0 && activeQuestionIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>

                    <Button
                      className="rounded-xl bg-green-700 hover:bg-green-800"
                      onClick={goNext}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Question Palette</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {activeSection.questions.map((question, index) => {
                    const answered = (question.answer?.length ?? 0) > 0;
                    const flagged = !!question.isFlagged;
                    const active = index === activeQuestionIndex;

                    return (
                      <button
                        key={question.questionId}
                        onClick={() => goToQuestion(activeSectionIndex, index)}
                        className={`h-11 w-11 rounded-xl border text-sm font-semibold transition relative ${
                          active
                            ? "border-green-600 bg-green-600 text-white"
                            : answered
                            ? "border-green-300 bg-green-50 text-green-800"
                            : "border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        {index + 1}
                        {flagged && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500 border border-white" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-4 mt-5 text-xs text-muted-foreground">
                  <LegendDot className="bg-green-600" label="Current" />
                  <LegendDot className="bg-green-200" label="Answered" />
                  <LegendDot className="bg-white border border-gray-300" label="Unanswered" />
                  <LegendDot className="bg-amber-500" label="Flagged" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Please review this summary before submitting.</p>
            <div className="rounded-xl border bg-gray-50 p-4 space-y-2">
              <SummaryRow label="Total Questions" value={totalQuestions} />
              <SummaryRow label="Answered" value={answeredCount} />
              <SummaryRow label="Unanswered" value={totalQuestions - answeredCount} />
              <SummaryRow label="Flagged" value={flaggedCount} />
            </div>

            {totalQuestions - answeredCount > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
                You still have unanswered questions.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowSubmitDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-green-700 hover:bg-green-800"
              onClick={() => handleSubmitExam(false)}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function LegendDot({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${className}`} />
      <span>{label}</span>
    </div>
  );
}

function StudentExamSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
          <div className="xl:col-span-9 space-y-6">
            <Skeleton className="h-[520px] rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentIdentityCard({
  student,
  compact = false,
}: {
  student?: StudentIdentity | null;
  compact?: boolean;
}) {
  const initials =
    student?.studentName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "ST";

  if (!student) return null;

  if (compact) {
    return (
      <Card className="rounded-6xl border-green-100 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {student.passportUrl ? (
              <img
                src={student.passportUrl}
                alt={student.studentName}
                className="h-16 w-16 rounded-xl object-cover border"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold border">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Candidate</p>
              <p className="font-semibold text-gray-900 truncate">
                {student.studentName}
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {student.className && (
                  <Badge variant="outline">{student.className}</Badge>
                )}
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  ID: {student.studentId}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-green-100 shadow-sm sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Candidate Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          {student.passportUrl ? (
            <img
              src={student.passportUrl}
              alt={student.studentName}
              className="h-28 w-28 rounded-2xl object-cover border shadow-sm"
            />
          ) : (
            <div className="h-28 w-28 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center font-bold text-2xl border shadow-sm">
              {initials}
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{student.studentName}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {student.className || "Class not available"}
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-3 space-y-2 text-sm">
          <SummaryRow label="Student ID" value={student.studentId} />
          <SummaryRow label="Class" value={student.className || "—"} />
        </div>
      </CardContent>
    </Card>
  );
}