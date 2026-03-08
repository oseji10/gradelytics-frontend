"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../../../lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Search,
  Loader2,
  FileQuestion,
  Pencil,
  FolderPlus,
  Save,
  MoveRight,
} from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";
type QuestionType = "single_choice" | "multi_choice" | "theory";

interface ExamInfo {
  examId: number;
  title: string;
  classId: number;
  subjectId: number;
  instructions?: string | null;
  totalMarks?: number;
  durationMinutes?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isPublished?: boolean;
  isLocked?: boolean;
  class?: {
    classId: number;
    className: string;
  } | null;
  subject?: {
    subjectId: number;
    subjectName: string;
  } | null;
}

interface BuilderQuestion {
  examSectionQuestionId?: number;
  examId?: number;
  questionId: number;
  orderIndex?: number;
  questionText: string;
  type: QuestionType;
  difficulty: Difficulty;
  mark: number;
  subjectId: number;
  topicId: number | null;
  imageUrl?: string | null;
  subjectName?: string;
  topicName?: string | null;
}

interface ExamSection {
  examSectionId: number;
  title: string;
  instructions?: string | null;
  sectionOrder: number;
  totalMarks?: number;
  questions: BuilderQuestion[];
}

interface Topic {
  topicId: number;
  topicName: string;
  subjectId: number;
}

function normalizeBuilderQuestion(item: any): BuilderQuestion {
  return {
    examSectionQuestionId: item.examSectionQuestionId
      ? Number(item.examSectionQuestionId)
      : undefined,
    examId: item.examId ? Number(item.examId) : undefined,
    questionId: Number(item.questionId),
    orderIndex: item.orderIndex != null ? Number(item.orderIndex) : undefined,
    questionText: String(item.questionText ?? ""),
    type: item.type,
    difficulty: item.difficulty,
    mark: Number(item.mark ?? 0),
    subjectId: Number(item.subjectId),
    topicId: item.topicId != null ? Number(item.topicId) : null,
    imageUrl: item.imageUrl ?? null,
    subjectName: item.subjectName ?? item.subject?.subjectName ?? "",
    topicName: item.topicName ?? item.topic?.topicName ?? null,
  };
}

function normalizeSection(item: any): ExamSection {
  return {
    examSectionId: Number(item.examSectionId),
    title: String(item.title ?? "Untitled Section"),
    instructions: item.instructions ?? null,
    sectionOrder: Number(item.sectionOrder ?? 1),
    totalMarks: Number(item.totalMarks ?? 0),
    questions: Array.isArray(item.questions)
      ? item.questions.map(normalizeBuilderQuestion)
      : [],
  };
}

function getDifficultyClass(difficulty: Difficulty) {
  switch (difficulty) {
    case "easy":
      return "bg-green-100 text-green-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "hard":
      return "bg-red-100 text-red-800";
    default:
      return "bg-muted text-foreground";
  }
}

function getTypeLabel(type: QuestionType) {
  switch (type) {
    case "single_choice":
      return "Single Choice";
    case "multi_choice":
      return "Multiple Choice";
    case "theory":
      return "Theory";
    default:
      return type;
  }
}

export default function ExamBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId")
    ? Number(searchParams.get("examId"))
    : NaN;

  const [loading, setLoading] = useState(true);
  const [attaching, setAttaching] = useState(false);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionDeletingId, setSectionDeletingId] = useState<number | null>(null);
  const [sectionReorderingId, setSectionReorderingId] = useState<number | null>(null);
  const [questionReorderingId, setQuestionReorderingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [markSavingKey, setMarkSavingKey] = useState<string | null>(null);
  const [movingQuestionKey, setMovingQuestionKey] = useState<string | null>(null);

  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [sections, setSections] = useState<ExamSection[]>([]);
  const [questionBank, setQuestionBank] = useState<BuilderQuestion[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");

  const [markInputs, setMarkInputs] = useState<Record<string, string>>({});
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [topicFilter, setTopicFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const isReadOnly = Boolean(exam?.isPublished || exam?.isLocked);

  const allAttachedQuestionIds = useMemo(() => {
    return new Set(
      sections.flatMap((section) => section.questions.map((q) => q.questionId))
    );
  }, [sections]);

  const availableQuestions = useMemo(() => {
    return questionBank.filter((q) => !allAttachedQuestionIds.has(q.questionId));
  }, [questionBank, allAttachedQuestionIds]);

  const filteredBank = useMemo(() => {
    return availableQuestions.filter((q) => {
      const matchesSearch =
        !search.trim() ||
        q.questionText.toLowerCase().includes(search.toLowerCase()) ||
        (q.topicName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (q.subjectName ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesClass =
        !classFilter || String(exam?.classId ?? "") === classFilter;
      const matchesSubject =
        !subjectFilter || String(q.subjectId) === subjectFilter;
      const matchesDifficulty =
        !difficultyFilter || q.difficulty === difficultyFilter;
      const matchesType = !typeFilter || q.type === typeFilter;
      const matchesTopic =
        !topicFilter || String(q.topicId ?? "") === topicFilter;

      return (
        matchesSearch &&
        matchesClass &&
        matchesSubject &&
        matchesDifficulty &&
        matchesType &&
        matchesTopic
      );
    });
  }, [
    availableQuestions,
    search,
    classFilter,
    subjectFilter,
    difficultyFilter,
    typeFilter,
    topicFilter,
    exam,
  ]);

  const totalQuestions = sections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );

  const totalMarks = sections.reduce(
    (sum, section) =>
      sum +
      section.questions.reduce((sectionSum, q) => sectionSum + Number(q.mark || 0), 0),
    0
  );

  useEffect(() => {
    if (!examId || Number.isNaN(examId)) {
      setLoading(false);
      toast.error("Invalid exam ID");
      return;
    }
    void loadBuilderData();
  }, [examId]);

  const loadBuilderData = async () => {
    const loadingId = toast.loading("Loading exam builder...");

    try {
      setLoading(true);

      const [builderRes, topicsRes] = await Promise.all([
        api.get(`/cbt/exams/${examId}/builder`),
        api.get(`/cbt/topics`),
      ]);

      const payload = builderRes.data?.data ?? {};
      const examData = payload.exam ?? null;
      const loadedSections = Array.isArray(payload.sections)
        ? payload.sections.map(normalizeSection)
        : [];

      const allTopics = Array.isArray(topicsRes.data?.data)
        ? topicsRes.data.data
        : Array.isArray(topicsRes.data)
        ? topicsRes.data
        : [];

      setExam(examData);
      setSections(loadedSections);
      setTopics(allTopics);

      const nextMarkInputs: Record<string, string> = {};
      const nextMoveTargets: Record<string, string> = {};

      loadedSections.forEach((section) => {
        section.questions.forEach((q) => {
          const key = `${section.examSectionId}-${q.questionId}`;
          nextMarkInputs[key] = String(q.mark ?? 0);
          nextMoveTargets[key] = "";
        });
      });

      setMarkInputs(nextMarkInputs);
      setMoveTargets(nextMoveTargets);

      if (loadedSections.length > 0) {
        setSelectedSectionId((prev) =>
          prev && loadedSections.some((s) => s.examSectionId === prev)
            ? prev
            : loadedSections[0].examSectionId
        );
      } else {
        setSelectedSectionId(null);
      }

      if (examData?.subjectId) {
        const bankRes = await api.get(
          `/cbt/questions?subjectId=${examData.subjectId}${
            examData.classId ? `&classId=${examData.classId}` : ""
          }`
        );

        const rawBank = Array.isArray(bankRes.data?.data?.data)
          ? bankRes.data.data.data
          : Array.isArray(bankRes.data?.data)
          ? bankRes.data.data
          : [];

        setQuestionBank(rawBank.map(normalizeBuilderQuestion));
      } else {
        setQuestionBank([]);
      }

      toast.success("Exam builder ready", { id: loadingId });
    } catch (err: any) {
      toast.error("Failed to load exam builder", {
        id: loadingId,
        description: err?.response?.data?.message || "Could not load builder data",
      });
    } finally {
      setLoading(false);
    }
  };

  const activeSection =
    sections.find((section) => section.examSectionId === selectedSectionId) ?? null;

  const toggleSelectQuestion = (questionId: number) => {
    if (isReadOnly) return;

    setSelectedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const createSection = async () => {
    if (isReadOnly) {
      toast.error("This exam cannot be edited right now");
      return;
    }

    const title = newSectionTitle.trim();
    if (!title) {
      toast.error("Enter a section title");
      return;
    }

    const loadingId = toast.loading("Creating section...");

    try {
      setSectionSaving(true);

      await api.post(`/cbt/exams/${examId}/sections`, {
        title,
      });

      setNewSectionTitle("");
      await loadBuilderData();

      toast.success("Section created", { id: loadingId });
    } catch (err: any) {
      toast.error("Failed to create section", {
        id: loadingId,
        description: err?.response?.data?.message || "Could not create section",
      });
    } finally {
      setSectionSaving(false);
    }
  };

  const startRenameSection = (section: ExamSection) => {
    if (isReadOnly) return;
    setEditingSectionId(section.examSectionId);
    setEditingSectionTitle(section.title);
  };

  const saveRenameSection = async (sectionId: number) => {
    if (isReadOnly) {
      toast.error("This exam cannot be edited right now");
      return;
    }

    const title = editingSectionTitle.trim();
    if (!title) {
      toast.error("Section title cannot be empty");
      return;
    }

    const loadingId = toast.loading("Renaming section...");

    try {
      setSectionSaving(true);

      await api.patch(`/cbt/sections/${sectionId}`, {
        title,
      });

      setSections((prev) =>
        prev.map((section) =>
          section.examSectionId === sectionId
            ? { ...section, title }
            : section
        )
      );

      setEditingSectionId(null);
      setEditingSectionTitle("");

      toast.success("Section renamed", { id: loadingId });
    } catch (err: any) {
      toast.error("Rename failed", {
        id: loadingId,
        description: err?.response?.data?.message || "Could not rename section",
      });
    } finally {
      setSectionSaving(false);
    }
  };

  const deleteSection = async (sectionId: number) => {
    if (isReadOnly) {
      toast.error("This exam cannot be edited right now");
      return;
    }

    const confirmed = window.confirm(
      "Delete this section and all questions inside it?"
    );

    if (!confirmed) return;

    const loadingId = toast.loading("Deleting section...");

    try {
      setSectionDeletingId(sectionId);

      await api.delete(`/cbt/sections/${sectionId}`);
      await loadBuilderData();

      toast.success("Section deleted", { id: loadingId });
    } catch (err: any) {
      toast.error("Delete failed", {
        id: loadingId,
        description: err?.response?.data?.message || "Could not delete section",
      });
    } finally {
      setSectionDeletingId(null);
    }
  };

  const moveSection = async (
    sectionId: number,
    direction: "up" | "down"
  ) => {
    if (isReadOnly) {
      toast.error("This exam cannot be edited right now");
      return;
    }

    const currentIndex = sections.findIndex((s) => s.examSectionId === sectionId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const reordered = [...sections];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const payload = reordered.map((section, index) => ({
      examSectionId: section.examSectionId,
      sectionOrder: index + 1,
    }));

    const loadingId = toast.loading("Reordering sections...");

    try {
      setSectionReorderingId(sectionId);

      await api.post(`/cbt/exams/${examId}/sections/reorder`, {
        sections: payload,
      });

      setSections(
        reordered.map((section, index) => ({
          ...section,
          sectionOrder: index + 1,
        }))
      );

      toast.success("Sections reordered", { id: loadingId });
    } catch (err: any) {
      toast.error("Section reorder failed", {
        id: loadingId,
        description: err?.response?.data?.message || "Could not reorder sections",
      });
    } finally {
      setSectionReorderingId(null);
    }
  };

  const attachSelectedQuestions = async () => {
    if (isReadOnly) {
      toast.error("This exam cannot be edited right now");
      return;
    }

    if (!selectedSectionId) {
      toast.error("Create and select a section first");
      return;
    }

    if (selectedQuestionIds.length === 0) {
      toast.error("Select at least one question");
      return;
    }

    const loadingId = toast.loading("Adding questions to section...");

    try {
      setAttaching(true);

      await api.post(`/cbt/sections/${selectedSectionId}/questions/attach`, {
        questionIds: selectedQuestionIds,
      });

      await loadBuilderData();
      setSelectedQuestionIds([]);

      toast.success("Questions added", {
        id: loadingId,
        description: `${selectedQuestionIds.length} question(s) added to section`,
      });
    } catch (err: any) {
      toast.error("Attach failed", {
        id: loadingId,
        description: err?.response?.data?.message || "Could not attach questions",
      });
    } finally {
      setAttaching(false);
    }
  };

  const removeQuestion = async (sectionId: number, questionId: number) => {
    if (isReadOnly) {
      toast.error("This exam cannot be edited right now");
      return;
    }

    const loadingId = toast.loading("Removing question...");

    try {
      setRemovingId(questionId);

      await api.delete(`/cbt/sections/${sectionId}/questions/${questionId}`);
      await loadBuilderData();

      toast.success("Question removed", { id: loadingId });
    } catch (err: any) {
      toast.error("Remove failed", {
        id: loadingId,
        description: err?.response?.data?.message || "Could not remove question",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const moveQuestionInSection = async (
    sectionId: number,
    questionId: number,
    direction: "up" | "down"
  ) => {
    if (isReadOnly) {
      toast.error("This exam cannot be edited right now");
      return;
    }

    const section = sections.find((s) => s.examSectionId === sectionId);
    if (!section) return;

    const currentIndex = section.questions.findIndex((q) => q.questionId === questionId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= section.questions.length) return;

    const reorderedQuestions = [...section.questions];
    const temp = reorderedQuestions[currentIndex];
    reorderedQuestions[currentIndex] = reorderedQuestions[targetIndex];
    reorderedQuestions[targetIndex] = temp;

    const payload = reorderedQuestions.map((q, index) => ({
      questionId: q.questionId,
      orderIndex: index + 1,
    }));

    const loadingId = toast.loading("Reordering questions...");

    try {
      setQuestionReorderingId(questionId);

      await api.post(`/cbt/sections/${sectionId}/questions/reorder`, {
        questions: payload,
      });

      setSections((prev) =>
        prev.map((s) =>
          s.examSectionId === sectionId
            ? {
                ...s,
                questions: reorderedQuestions.map((q, index) => ({
                  ...q,
                  orderIndex: index + 1,
                })),
              }
            : s
        )
      );

      toast.success("Question order updated", { id: loadingId });
    } catch (err: any) {
      toast.error("Question reorder failed", {
        id: loadingId,
        description: err?.response?.data?.message || "Could not reorder questions",
      });
    } finally {
      setQuestionReorderingId(null);
    }
  };

  const saveQuestionMark = async (
    sectionId: number,
    questionId: number
  ) => {
    if (isReadOnly) {
      toast.error("This exam cannot be edited right now");
      return;
    }

    const key = `${sectionId}-${questionId}`;
    const rawValue = markInputs[key];

    if (rawValue == null || rawValue === "") {
      toast.error("Enter a valid mark");
      return;
    }

    const mark = Number(rawValue);

    if (Number.isNaN(mark) || mark < 0) {
      toast.error("Mark must be 0 or greater");
      return;
    }

    const loadingId = toast.loading("Updating mark...");

    try {
      setMarkSavingKey(key);

      await api.patch(`/cbt/sections/${sectionId}/questions/${questionId}/mark`, {
        mark,
      });

      setSections((prev) =>
        prev.map((section) =>
          section.examSectionId !== sectionId
            ? section
            : {
                ...section,
                questions: section.questions.map((q) =>
                  q.questionId === questionId ? { ...q, mark } : q
                ),
                totalMarks: section.questions.reduce((sum, q) => {
                  const nextMark = q.questionId === questionId ? mark : q.mark;
                  return sum + Number(nextMark || 0);
                }, 0),
              }
        )
      );

      setExam((prev) =>
        prev
          ? {
              ...prev,
              totalMarks: sections.reduce((grand, section) => {
                if (section.examSectionId !== sectionId) {
                  return grand + section.questions.reduce((s, q) => s + Number(q.mark || 0), 0);
                }
                return (
                  grand +
                  section.questions.reduce((s, q) => {
                    const nextMark = q.questionId === questionId ? mark : q.mark;
                    return s + Number(nextMark || 0);
                  }, 0)
                );
              }, 0),
            }
          : prev
      );

      toast.success("Mark updated", { id: loadingId });
    } catch (err: any) {
      toast.error("Update failed", {
        id: loadingId,
        description: err?.response?.data?.message || "Could not update mark",
      });
    } finally {
      setMarkSavingKey(null);
    }
  };

  const moveQuestionToAnotherSection = async (
    fromSectionId: number,
    questionId: number
  ) => {
    if (isReadOnly) {
      toast.error("This exam cannot be edited right now");
      return;
    }

    const key = `${fromSectionId}-${questionId}`;
    const toSectionId = Number(moveTargets[key]);

    if (!toSectionId || Number.isNaN(toSectionId)) {
      toast.error("Select a destination section");
      return;
    }

    if (toSectionId === fromSectionId) {
      toast.error("Choose a different section");
      return;
    }

    const loadingId = toast.loading("Moving question...");

    try {
      setMovingQuestionKey(key);

      await api.post(`/cbt/sections/${fromSectionId}/questions/${questionId}/move`, {
        toSectionId,
      });

      await loadBuilderData();

      toast.success("Question moved", { id: loadingId });
    } catch (err: any) {
      toast.error("Move failed", {
        id: loadingId,
        description: err?.response?.data?.message || "Could not move question",
      });
    } finally {
      setMovingQuestionKey(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading exam builder...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="space-y-6 px-4 py-6 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Exam Builder
            </h1>
            <p className="text-sm text-muted-foreground">
              Create sections, add questions, update marks, and control order.
            </p>
          </div>

          <Button
            onClick={attachSelectedQuestions}
            disabled={isReadOnly || attaching || selectedQuestionIds.length === 0 || !selectedSectionId}
          >
            {attaching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Selected to Section ({selectedQuestionIds.length})
          </Button>
        </div>

        {isReadOnly && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {exam?.isLocked
              ? "This exam is locked because students have already started or completed attempts."
              : "This exam is published. Unpublish it before making structural changes."}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Exam Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Title</p>
              <p className="font-medium">{exam?.title || "Untitled exam"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Class</p>
              <p className="font-medium">{exam?.class?.className || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subject</p>
              <p className="font-medium">{exam?.subject?.subjectName || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-medium">
                {exam?.durationMinutes ? `${exam.durationMinutes} mins` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Instructions</p>
              <p className="font-medium">{exam?.instructions || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Starts At</p>
              <p className="font-medium">
                {exam?.startsAt ? new Date(exam.startsAt).toLocaleString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ends At</p>
              <p className="font-medium">
                {exam?.endsAt ? new Date(exam.endsAt).toLocaleString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium">
                {exam?.isLocked ? "Locked" : exam?.isPublished ? "Published" : "Draft"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sections</p>
              <p className="font-medium">{sections.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Questions</p>
              <p className="font-medium">{totalQuestions}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Marks</p>
              <p className="font-medium">{totalMarks}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="min-h-[700px]">
            <CardHeader>
              <CardTitle>Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New section title"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  disabled={isReadOnly}
                />
                <Button onClick={createSection} disabled={isReadOnly || sectionSaving}>
                  {sectionSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FolderPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                {sections.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No sections yet. Create your first section.
                  </div>
                ) : (
                  sections.map((section, index) => {
                    const isActive = selectedSectionId === section.examSectionId;
                    const isEditing = editingSectionId === section.examSectionId;

                    return (
                      <div
                        key={section.examSectionId}
                        className={`rounded-xl border p-4 transition ${
                          isActive ? "border-primary bg-primary/5" : "bg-background"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedSectionId(section.examSectionId)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <Badge>{index + 1}</Badge>
                              {isEditing ? (
                                <Input
                                  value={editingSectionTitle}
                                  onChange={(e) =>
                                    setEditingSectionTitle(e.target.value)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  disabled={isReadOnly}
                                />
                              ) : (
                                <div className="font-medium">{section.title}</div>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {section.questions.length} question(s) • {section.totalMarks ?? 0} mark(s)
                            </p>
                          </button>

                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <Button
                                size="sm"
                                onClick={() => saveRenameSection(section.examSectionId)}
                                disabled={isReadOnly || sectionSaving}
                              >
                                Save
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => startRenameSection(section)}
                                disabled={isReadOnly}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="icon"
                              disabled={isReadOnly || index === 0 || sectionReorderingId === section.examSectionId}
                              onClick={() => moveSection(section.examSectionId, "up")}
                            >
                              {sectionReorderingId === section.examSectionId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowUp className="h-4 w-4" />
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              size="icon"
                              disabled={
                                isReadOnly ||
                                index === sections.length - 1 ||
                                sectionReorderingId === section.examSectionId
                              }
                              onClick={() => moveSection(section.examSectionId, "down")}
                            >
                              {sectionReorderingId === section.examSectionId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )}
                            </Button>

                            <Button
                              variant="destructive"
                              size="icon"
                              disabled={isReadOnly || sectionDeletingId === section.examSectionId}
                              onClick={() => deleteSection(section.examSectionId)}
                            >
                              {sectionDeletingId === section.examSectionId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[700px]">
            <CardHeader>
              <CardTitle>Question Bank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      className="pl-9"
                      placeholder="Search by question text or topic"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Class</Label>
                  <Select
                    value={classFilter || "all"}
                    onValueChange={(value) =>
                      setClassFilter(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All classes</SelectItem>
                      {exam?.classId && (
                        <SelectItem value={String(exam.classId)}>
                          {exam?.class?.className || `Class ${exam.classId}`}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subject</Label>
                  <Select
                    value={subjectFilter || "all"}
                    onValueChange={(value) =>
                      setSubjectFilter(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      {exam?.subjectId && (
                        <SelectItem value={String(exam.subjectId)}>
                          {exam?.subject?.subjectName || `Subject ${exam.subjectId}`}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Difficulty</Label>
                  <Select
                    value={difficultyFilter || "all"}
                    onValueChange={(value) =>
                      setDifficultyFilter(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All difficulties</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Question Type</Label>
                  <Select
                    value={typeFilter || "all"}
                    onValueChange={(value) =>
                      setTypeFilter(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="single_choice">Single Choice</SelectItem>
                      <SelectItem value="multi_choice">Multiple Choice</SelectItem>
                      <SelectItem value="theory">Theory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Topic</Label>
                  <Select
                    value={topicFilter || "all"}
                    onValueChange={(value) =>
                      setTopicFilter(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All topics</SelectItem>
                      {topics
                        .filter((t) => t.subjectId === exam?.subjectId)
                        .map((topic) => (
                          <SelectItem
                            key={topic.topicId}
                            value={String(topic.topicId)}
                          >
                            {topic.topicName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {!selectedSectionId && (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Create and select a section before adding questions.
                </div>
              )}

              {isReadOnly && (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Question bank selection is disabled while this exam is published or locked.
                </div>
              )}

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredBank.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No available questions match your filters.
                  </div>
                ) : (
                  filteredBank.map((q) => {
                    const selected = selectedQuestionIds.includes(q.questionId);

                    return (
                      <div
                        key={q.questionId}
                        className={`rounded-xl border p-4 transition ${
                          selected ? "border-primary bg-primary/5" : "bg-background"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => toggleSelectQuestion(q.questionId)}
                            className="text-left flex-1"
                          >
                            <div className="font-medium text-sm leading-6">
                              {q.questionText}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{getTypeLabel(q.type)}</Badge>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${getDifficultyClass(
                                  q.difficulty
                                )}`}
                              >
                                {q.difficulty}
                              </span>
                              <Badge variant="secondary">
                                {q.mark} mark{q.mark > 1 ? "s" : ""}
                              </Badge>
                              {q.topicName && (
                                <Badge variant="outline">{q.topicName}</Badge>
                              )}
                            </div>
                          </button>

                          <Button
                            type="button"
                            variant={selected ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleSelectQuestion(q.questionId)}
                            disabled={!selectedSectionId || isReadOnly}
                          >
                            {selected ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[700px]">
            <CardHeader>
              <CardTitle>
                {activeSection
                  ? `Questions in ${activeSection.title}`
                  : "Section Questions"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {!activeSection ? (
                <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                  Select a section to manage its questions.
                </div>
              ) : activeSection.questions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                  <FileQuestion className="mx-auto mb-3 h-8 w-8" />
                  No questions in this section yet.
                </div>
              ) : (
                activeSection.questions.map((q, index) => {
                  const key = `${activeSection.examSectionId}-${q.questionId}`;
                  const availableMoveTargets = sections.filter(
                    (s) => s.examSectionId !== activeSection.examSectionId
                  );

                  return (
                    <div key={q.questionId} className="rounded-xl border bg-background p-4">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <Badge>{index + 1}</Badge>
                              <Badge variant="outline">{getTypeLabel(q.type)}</Badge>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${getDifficultyClass(
                                  q.difficulty
                                )}`}
                              >
                                {q.difficulty}
                              </span>
                              <Badge variant="secondary">
                                {q.mark} mark{q.mark > 1 ? "s" : ""}
                              </Badge>
                            </div>

                            <p className="text-sm font-medium leading-6">
                              {q.questionText}
                            </p>

                            {q.topicName && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Topic: {q.topicName}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={
                                isReadOnly ||
                                index === 0 ||
                                questionReorderingId === q.questionId
                              }
                              onClick={() =>
                                moveQuestionInSection(
                                  activeSection.examSectionId,
                                  q.questionId,
                                  "up"
                                )
                              }
                            >
                              {questionReorderingId === q.questionId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowUp className="h-4 w-4" />
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              size="icon"
                              disabled={
                                isReadOnly ||
                                index === activeSection.questions.length - 1 ||
                                questionReorderingId === q.questionId
                              }
                              onClick={() =>
                                moveQuestionInSection(
                                  activeSection.examSectionId,
                                  q.questionId,
                                  "down"
                                )
                              }
                            >
                              {questionReorderingId === q.questionId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )}
                            </Button>

                            <Button
                              variant="destructive"
                              size="icon"
                              disabled={isReadOnly || removingId === q.questionId}
                              onClick={() =>
                                removeQuestion(activeSection.examSectionId, q.questionId)
                              }
                            >
                              {removingId === q.questionId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Mark
                            </Label>
                            <div className="mt-1 flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={markInputs[key] ?? ""}
                                onChange={(e) =>
                                  setMarkInputs((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                disabled={isReadOnly || markSavingKey === key}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  saveQuestionMark(
                                    activeSection.examSectionId,
                                    q.questionId
                                  )
                                }
                                disabled={isReadOnly || markSavingKey === key}
                              >
                                {markSavingKey === key ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Move to section
                            </Label>
                            <div className="mt-1 flex gap-2">
                              <Select
                                value={moveTargets[key] ?? ""}
                                onValueChange={(value) =>
                                  setMoveTargets((prev) => ({
                                    ...prev,
                                    [key]: value,
                                  }))
                                }
                                disabled={
                                  isReadOnly ||
                                  availableMoveTargets.length === 0 ||
                                  movingQuestionKey === key
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      availableMoveTargets.length === 0
                                        ? "No other section"
                                        : "Choose section"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableMoveTargets.map((section) => (
                                    <SelectItem
                                      key={section.examSectionId}
                                      value={String(section.examSectionId)}
                                    >
                                      {section.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  moveQuestionToAnotherSection(
                                    activeSection.examSectionId,
                                    q.questionId
                                  )
                                }
                                disabled={
                                  isReadOnly ||
                                  availableMoveTargets.length === 0 ||
                                  !moveTargets[key] ||
                                  movingQuestionKey === key
                                }
                              >
                                {movingQuestionKey === key ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoveRight className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}