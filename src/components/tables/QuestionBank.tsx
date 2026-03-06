"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeftIcon, PlusIcon, TrashIcon, ImageIcon } from "@/icons";
import api from "../../../lib/api";
import Icon from "@/components/Icons";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/* ---------------- types ---------------- */

interface Question {
  questionId: number;  // Changed from 'id'
  questionText: string;
  type: 'single_choice' | 'multi_choice' | 'theory';
  difficulty: 'easy' | 'medium' | 'hard';
  mark: number;
  subjectId: number;
  topicId: number | null;
  imageUrl?: string | null;
  options?: QuestionOption[];
  created_at: string;
  updated_at: string;
  schoolId: number;
  createdBy: number;
  subject: {  // Added subject object
    subjectId: number;
    subjectName: string;
  };
  topic: {    // Added topic object (can be null)
    topicId: number;
    topicName: string;
  } | null;
}

interface QuestionOption {
  optionId: number;  // Changed from 'id'
  questionId: number;
  optionLabel: string;
  optionText: string;
  isCorrect: boolean;
  created_at: string;
  updated_at: string;
}

interface QuestionOption {
  id: number;
  optionText: string;
  isCorrect: boolean;
}

interface Subject {
  subjectId: number;
  subjectName: string;
}

interface Topic {
  topicId?: number | null;
  topicName: string;
  subjectId: number;
}

interface FilterState {
  subjectId: string;
  topicId: string;
  difficulty: string;
  type: string;
  search: string;
}

/* ---------------- component ---------------- */

export default function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
const [topics, setTopics] = useState<Topic[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    subjectId: "",
    topicId: "",
    difficulty: "",
    type: "",
    search: "",
  });

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Question form state
  const [formData, setFormData] = useState({
    questionText: "",
    type: "single_choice" as 'single_choice' | 'multi_choice' | 'theory',
    difficulty: "medium" as 'easy' | 'medium' | 'hard',
    mark: "",
    subjectId: "",
    topicId: "",
    imageUrl: "",
    options: [] as { optionText: string; isCorrect: boolean }[],
  });

  // View modal
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Delete state
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  // Preview modal for long questions
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [questions, filters]);

  const fetchInitialData = async () => {
  const loadingId = toast.loading("Loading question bank...");

  try {
    setLoading(true);
    
    // Fetch questions - handle paginated response
    const questionsRes = await api.get("/cbt/questions");
    // The questions are in data.data (the nested data property)
    const questionsData = questionsRes.data?.data?.data || [];
    console.log("Questions data:", questionsData); // For debugging
    
    // Fetch subjects
    const subjectsRes = await api.get("/school/subjects");
    setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
    
    // Fetch topics
    const topicsRes = await api.get("/cbt/topics");
    const topicsData = topicsRes.data?.data || topicsRes.data || [];
    setTopics(Array.isArray(topicsData) ? topicsData : []);

    // Sort questions by created_at if they exist
    const sorted = Array.isArray(questionsData) 
      ? questionsData.slice().sort((a: Question, b: Question) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      : [];

    setQuestions(sorted);
    setFilteredQuestions(sorted);

    toast.success("Question bank loaded", {
      description: `Found ${sorted.length} questions`,
      id: loadingId,
    });
  } catch (err: any) {
    console.error("Fetch error:", err);
    toast.error("Failed to load questions", {
      description: err?.response?.data?.message || "Connection issue",
      id: loadingId,
    });
    // Set empty arrays on error
    setQuestions([]);
    setFilteredQuestions([]);
    setSubjects([]);
    setTopics([]);
  } finally {
    setLoading(false);
  }
};


const applyFilters = () => {
  let filtered = [...questions];

  if (filters.subjectId && filters.subjectId !== "all") {
    const sid = Number(filters.subjectId);
    filtered = filtered.filter((q) => q.subjectId === sid);
  }

  if (filters.topicId && filters.topicId !== "all") {
    const tid = Number(filters.topicId);
    filtered = filtered.filter((q) => (q.topicId ?? null) === tid);
  }

  if (filters.difficulty && filters.difficulty !== "all") {
    filtered = filtered.filter((q) => q.difficulty === filters.difficulty);
  }

  if (filters.type && filters.type !== "all") {
    filtered = filtered.filter((q) => q.type === filters.type);
  }

  if (filters.search.trim()) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter((q) =>
      q.questionText.toLowerCase().includes(s) ||
      (q.subjectName ?? "").toLowerCase().includes(s) ||
      (q.topicName ?? "").toLowerCase().includes(s)
    );
  }

  setFilteredQuestions(filtered);
};

const resetFilters = () => {
  setFilters({
    subjectId: "",
    topicId: "",
    difficulty: "",
    type: "",
    search: "",
  });
};
  

const openModal = (mode: "add" | "edit", question?: Question) => {
  console.log("Opening modal with question:", question);
  
  setModalMode(mode);
  setCurrentQuestion(question || null);
  
  if (question) {
    setFormData({
      questionText: question.questionText,
      type: question.type,
      difficulty: question.difficulty,
      mark: String(question.mark ?? ""),
      subjectId: String(question.subjectId ?? ""),
      topicId: question.topicId ? String(question.topicId) : "",
      imageUrl: question.imageUrl || "",
      options: question.options?.map(opt => ({
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
      })) || [{ optionText: "", isCorrect: false }],
    });
  } else {
    setFormData({
      questionText: "",
      type: "single_choice",
      difficulty: "medium",
      mark: "",
      subjectId: "",
      topicId: "",
      imageUrl: "",
      options: [{ optionText: "", isCorrect: false }],
    });
  }
  
  setModalOpen(true);
};

      const addOption = () => {
        setFormData({
          ...formData,
          options: [...formData.options, { optionText: "", isCorrect: false }],
        });
      };

      const removeOption = (index: number) => {
        if (formData.options.length > 1) {
          setFormData({
            ...formData,
            options: formData.options.filter((_, i) => i !== index),
          });
        }
      };

  const updateOption = (index: number, field: string, value: any) => {
    const updatedOptions = [...formData.options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    
    // If single choice and setting this option as correct, set all others to false
    if (formData.type === "single_choice" && field === "isCorrect" && value === true) {
      updatedOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }
    
    setFormData({ ...formData, options: updatedOptions });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation
  if (!formData.questionText.trim()) {
    toast.error("Question text is required");
    return;
  }
  if (!formData.mark || parseInt(formData.mark) <= 0) {
    toast.error("Please enter a valid mark");
    return;
  }
  if (!formData.subjectId) {
    toast.error("Please select a subject");
    return;
  }

  // Validate options for choice questions
  if (formData.type !== "theory") {
    if (formData.options.some(opt => !opt.optionText.trim())) {
      toast.error("All options must have text");
      return;
    }
    if (!formData.options.some(opt => opt.isCorrect)) {
      toast.error("Please select at least one correct answer");
      return;
    }
  }

  const loadingId = toast.loading(
    modalMode === "add" ? "Adding question..." : "Updating question..."
  );

  setIsSubmitting(true);

  try {
    const payload = {
      questionText: formData.questionText,
      type: formData.type,
      difficulty: formData.difficulty,
      mark: parseInt(formData.mark),
      subjectId: parseInt(formData.subjectId),
      topicId: formData.topicId ? parseInt(formData.topicId) : null,
      ...(formData.imageUrl && { imageUrl: formData.imageUrl }),
      ...(formData.type !== "theory" && { 
        options: formData.options.map(opt => ({
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
        }))
      }),
    };

    let updatedQuestions: Question[];

    if (modalMode === "add") {
      const res = await api.post("/cbt/questions", payload);
      const created = res.data?.data || res.data;
      
      // Enhance the created question with subject/topic names
      const subject = subjects.find(s => s.subjectId === parseInt(formData.subjectId));
      const topic = topics.find(t => t.topicId === parseInt(formData.topicId));
      
      const enhancedQuestion = {
        ...created,
        id: created.questionId, // Add id alias
        subjectName: subject?.subjectName || "",
        topicName: topic?.topicName || "",
        subject: subject || { subjectId: parseInt(formData.subjectId), subjectName: subject?.subjectName || "" },
        topic: topic || null,
      };
      
      updatedQuestions = [enhancedQuestion, ...questions];

      toast.success("Question added", {
        description: "Question was successfully created",
        id: loadingId,
      });
    } else if (currentQuestion) {
      const res = await api.patch(`/cbt/questions/${currentQuestion.questionId}`, payload);
      const updated = res.data?.data || res.data;
      console.log("Updated question:", updated);
      
      // Enhance the updated question with subject/topic names
      const subject = subjects.find(s => s.subjectId === parseInt(formData.subjectId));
      const topic = topics.find(t => t.topicId === parseInt(formData.topicId));
      
      const enhancedQuestion = {
        ...updated,
        id: updated.questionId, // Add id alias
        questionId: updated.questionId,
        subjectName: subject?.subjectName || currentQuestion.subjectName,
        topicName: topic?.topicName || currentQuestion.topicName,
        subject: subject || currentQuestion.subject,
        topic: topic || currentQuestion.topic,
      };
      
      updatedQuestions = questions.map((q) =>
        q.questionId === currentQuestion.questionId ? enhancedQuestion : q
      );

      toast.success("Question updated", {
        description: "Question was successfully updated",
        id: loadingId,
      });
    } else {
      throw new Error("No question selected");
    }

    setQuestions(updatedQuestions);
    setFilteredQuestions(updatedQuestions); // Also update filtered questions
    setModalOpen(false);
    setCurrentQuestion(null);
  } catch (err: any) {
    console.error("Save error:", err);
    toast.error("Operation failed", {
      description: err?.response?.data?.message || `Failed to ${modalMode === "add" ? "add" : "update"} question`,
      id: loadingId,
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const handleDeleteQuestion = async (questionId: number) => {
    const question = questions.find((q) => q.questionid === questionId);
    const questionPreview = question?.questionText.substring(0, 50) + "...";

    const loadingId = toast.loading("Deleting question...");

    setDeleteLoadingId(questionId);

    try {
      await api.delete(`/questions/${questionId}`);
      setQuestions((prev) => prev.filter((q) => q.questionid !== questionId));

      toast.success("Question deleted", {
        description: "Question has been permanently removed",
        id: loadingId,
      });
    } catch (err: any) {
      toast.error("Delete failed", {
        description: err?.response?.data?.message || "Could not delete question",
        id: loadingId,
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800",
    };
    return styles[difficulty as keyof typeof styles] || styles.medium;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      single_choice: "Single Choice",
      multi_choice: "Multiple Choice",
      theory: "Theory",
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="space-y-6 px-4 py-6 md:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
            >
              <Icon src={ChevronLeftIcon} className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Question Bank
            </h1>
          </div>

          <Button
            className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
            onClick={() => openModal("add")}
          >
            {/* <PlusIcon className="w-4 h-4 mr-2" /> */}
            <Icon src={PlusIcon} className="w-4 h-4" />
            
            Add New Question
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
<div>
  <Label htmlFor="subject">Subject</Label>
  <Select
    value={filters.subjectId}
    onValueChange={(value) => setFilters({ ...filters, subjectId: value, topicId: "" })}
  >
    <SelectTrigger>
      <SelectValue placeholder="All Subjects" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Subjects</SelectItem>
      {subjects.map((subject) => (
        <SelectItem key={subject.subjectId} value={String(subject.subjectId)}>
  {subject.subjectName}
</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

<div>
  <Label htmlFor="topic">Topic</Label>
  <Select
    value={filters.topicId}
    onValueChange={(value) => setFilters({ ...filters, topicId: value === "all" ? "" : value })}
    disabled={!filters.subjectId || filters.subjectId === "all"}
  >
    <SelectTrigger>
      <SelectValue placeholder={filters.subjectId && filters.subjectId !== "all" ? "Select Topic" : "Select Subject First"} />
    </SelectTrigger>
    
<SelectContent>
  {topics && topics.length > 0 ? (
    topics
  .filter(t => t.subjectId?.toString() === filters.subjectId)
      .map((topic) => (
        <SelectItem key={topic.topicId} value={topic.topicId}>
          {topic.topicName}
        </SelectItem>
      ))
  ) : (
    <SelectItem value="no-topics" disabled>No topics available</SelectItem>
  )}
</SelectContent>
  </Select>
</div>

<div>
  <Label htmlFor="difficulty">Difficulty</Label>
  <Select
    value={filters.difficulty}
    onValueChange={(value) => setFilters({ ...filters, difficulty: value === "all" ? "" : value })}
  >
    <SelectTrigger>
      <SelectValue placeholder="All Difficulties" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Difficulties</SelectItem>
      <SelectItem value="easy">Easy</SelectItem>
      <SelectItem value="medium">Medium</SelectItem>
      <SelectItem value="hard">Hard</SelectItem>
    </SelectContent>
  </Select>
</div>

<div>
  <Label htmlFor="type">Question Type</Label>
  <Select
    value={filters.type}
    onValueChange={(value) => setFilters({ ...filters, type: value === "all" ? "" : value })}
  >
    <SelectTrigger>
      <SelectValue placeholder="All Types" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Types</SelectItem>
      <SelectItem value="single_choice">Single Choice</SelectItem>
      <SelectItem value="multi_choice">Multiple Choice</SelectItem>
      <SelectItem value="theory">Theory</SelectItem>
    </SelectContent>
  </Select>
</div>
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search questions..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          {(filters.subjectId || filters.topicId || filters.difficulty || filters.type || filters.search) && (
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </Card>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredQuestions.length} of {questions.length} questions
        </div>

        {/* Questions Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-4/12">
                  Question
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  Type
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  Difficulty
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-1/12">
                  Mark
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  Subject/Topic
                </th>
                <th className="h-14 px-6 text-right font-semibold text-muted-foreground w-1/12">
                  Actions
                </th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    Loading questions…
                  </TableCell>
                </TableRow>
              ) : filteredQuestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    No questions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuestions.map((q) => (
                  <TableRow
                    key={q.questionid}
                    className="hover:bg-muted/40 transition-colors border-b last:border-b-0"
                  >
                    <TableCell className="px-6 py-4">
                      <div 
                        className="font-medium text-foreground cursor-pointer hover:text-[#1F6F43] line-clamp-2"
                        onClick={() => {
                          setPreviewQuestion(q);
                          setPreviewOpen(true);
                        }}
                      >
                        {q.questionText}
                      </div>
                      {q.imageUrl && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          <ImageIcon className="w-3 h-3 mr-1" />
                          Has image
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline">
                        {getTypeLabel(q.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyBadge(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 font-medium">
                      {q.mark}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="text-sm">
                        <div>{q.subjectName}</div>
                        <div className="text-xs text-muted-foreground">{q.topicName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedQuestion(q);
                          setViewOpen(true);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal("edit", q)}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteLoadingId === q.questionid}
                          >
                            {deleteLoadingId === q.questionid ? "..." : "Delete"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Question</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this question? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteQuestion(q.questionid)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add/Edit Question Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>
                {modalMode === "add" ? "Add New Question" : "Edit Question"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Question Text */}
                <div>
                  <Label htmlFor="questionText">Question Text *</Label>
                  <Textarea
                    id="questionText"
                    value={formData.questionText}
                    onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                    placeholder="Enter your question here..."
                    rows={4}
                    required
                  />
                </div>

                {/* Image URL */}
                <div>
                  <Label htmlFor="imageUrl">Image URL (optional)</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type">Question Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => {
                        setFormData({ 
                          ...formData, 
                          type: value,
                          options: value !== "theory" ? [{ optionText: "", isCorrect: false }] : []
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_choice">Single Choice</SelectItem>
                        <SelectItem value="multi_choice">Multiple Choice</SelectItem>
                        <SelectItem value="theory">Theory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty *</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mark">Mark *</Label>
                    <Input
                      id="mark"
                      type="number"
                      min="1"
                      value={formData.mark}
                      onChange={(e) => setFormData({ ...formData, mark: e.target.value })}
                      placeholder="e.g., 5"
                      required
                    />
                  </div>
                </div>

                {/* Subject and Topic */}
                {/* Subject and Topic */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <Label htmlFor="subject">Subject *</Label>
    <Select
      value={formData.subjectId}
      onValueChange={(value) => {
        console.log("Selected subject:", value); // Debug log
        setFormData({ ...formData, subjectId: value, topicId: "" });
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select subject" />
      </SelectTrigger>
      <SelectContent>
        {subjects.map((subject) => (
          <SelectItem key={subject.subjectId} value={String(subject.subjectId)}>
            {subject.subjectName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  <div>
    <Label htmlFor="topic">Topic *</Label>
    <Select
      value={formData.topicId}
      onValueChange={(value) => {
        console.log("Selected topic:", value); // Debug log
        setFormData({ ...formData, topicId: value });
      }}
      disabled={!formData.subjectId}
    >
      <SelectTrigger>
        <SelectValue placeholder={formData.subjectId ? "Select topic" : "Select subject first"} />
      </SelectTrigger>
      <SelectContent>
        {formData.subjectId ? (
          topics && topics.length > 0 ? (
            topics
              .filter((t) => t.subjectId?.toString() === formData.subjectId)
              .map((topic) => (
                <SelectItem key={topic.topicId} value={String(topic.topicId)}>
                  {topic.topicName}
                </SelectItem>
              ))
          ) : (
            <SelectItem value="no-topics" disabled>No topics available</SelectItem>
          )
        ) : (
          <SelectItem value="select-first" disabled>Select a subject first</SelectItem>
        )}
      </SelectContent>
    </Select>
  </div>
</div>
                {/* Options for choice questions */}
                {formData.type !== "theory" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Options</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addOption}>
                        {/* <PlusIcon className="w-4 h-4 mr-2" /> */}
                        <Icon src={PlusIcon} className="w-4 h-4" />

                        Add Option
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex-1">
                            <Input
                              value={option.optionText}
                              onChange={(e) => updateOption(index, "optionText", e.target.value)}
                              placeholder={`Option ${index + 1}`}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center space-x-2">
                              {formData.type === "single_choice" ? (
                                <RadioGroup
                                  value={option.isCorrect ? "correct" : ""}
                                  onValueChange={() => updateOption(index, "isCorrect", true)}
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="correct" id={`correct-${index}`} />
                                    <Label htmlFor={`correct-${index}`} className="text-sm">Correct</Label>
                                  </div>
                                </RadioGroup>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={option.isCorrect}
                                    onCheckedChange={(checked) => updateOption(index, "isCorrect", checked)}
                                  />
                                  <Label className="text-sm">Correct</Label>
                                </div>
                              )}
                            </div>
                            {formData.options.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                {/* <TrashIcon className="w-4 h-4" /> */}
                                <Icon src={TrashIcon} className="w-4 h-4" />
                                
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>

            <DialogFooter className="px-6 py-4 border-t">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSaveQuestion}
                disabled={isSubmitting}
                className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
              >
                {isSubmitting ? "Saving..." : modalMode === "add" ? "Add Question" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Question Modal */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>Question Details</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {selectedQuestion && (
                <div className="space-y-6">
                  {/* Question */}
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-2">Question</h4>
                    <p className="text-lg">{selectedQuestion.questionText}</p>
                  </div>

                  {selectedQuestion.imageUrl && (
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-2">Image</h4>
                      <img 
                        src={selectedQuestion.imageUrl} 
                        alt="Question" 
                        className="max-w-full h-auto rounded-lg border"
                      />
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-1">Type</h4>
                      <Badge variant="outline">{getTypeLabel(selectedQuestion.type)}</Badge>
                    </div>
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-1">Difficulty</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyBadge(selectedQuestion.difficulty)}`}>
                        {selectedQuestion.difficulty}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-1">Mark</h4>
                      <p className="font-medium">{selectedQuestion.mark}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-1">Subject</h4>
                      <p>{selectedQuestion.subjectName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-1">Topic</h4>
                      <p>{selectedQuestion.topicName}</p>
                    </div>
                  </div>

                  {/* Options */}
                  {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-2">Options</h4>
                      <div className="space-y-2">
                        {selectedQuestion.options.map((opt, idx) => (
                          <div 
                            key={opt.id} 
                            className={`p-3 rounded-lg border ${
                              opt.isCorrect ? 'border-green-500 bg-green-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{opt.optionText}</span>
                              {opt.isCorrect && (
                                <Badge className="bg-green-600">Correct Answer</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setViewOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setViewOpen(false);
                  openModal("edit", selectedQuestion!);
                }}
                className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
              >
                Edit Question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Question Preview Modal */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Question Preview</DialogTitle>
            </DialogHeader>
            {previewQuestion && (
              <div className="py-4">
                <p className="whitespace-pre-wrap">{previewQuestion.questionText}</p>
                {previewQuestion.imageUrl && (
                  <img 
                    src={previewQuestion.imageUrl} 
                    alt="Question" 
                    className="mt-4 max-w-full h-auto rounded-lg border"
                  />
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}