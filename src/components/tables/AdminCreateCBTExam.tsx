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
import { toast } from "@/components/ui/use-toast";
import { ChevronLeftIcon } from "@/icons";
import api from "../../../lib/api";
import Icon from "@/components/Icons";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/* ---------------- types ---------------- */

interface Exam {
  id: number;
  title: string;
  classId: number;
  subjectId: number;
  className: string;
  subjectName: string;
  instructions: string;
  duration: number; // in minutes
  startsAt: string;
  endsAt: string;
  attemptLimit: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultImmediately: boolean;
  examType: 'practice' | 'graded';
  countsAs?: 'CA1' | 'CA2' | 'EXAM';
  maxScore?: number;
  weight?: number;
  created_at: string;
  status: 'draft' | 'published' | 'archived';
}

interface Class {
  classId: number;
  className: string;
}

interface Subject {
  subjectId: number;
  subjectName: string;
  classId: number;
}

/* ---------------- component ---------------- */

export default function AdminCBTExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data for exam creation
  const [formData, setFormData] = useState({
    // Step 1: Basics
    title: "",
    classId: "",
    subjectId: "",
    instructions: "",
    
    // Step 2: Timing
    duration: "",
    startsAt: "",
    endsAt: "",
    attemptLimit: "",
    
    // Step 3: Settings
    shuffleQuestions: false,
    shuffleOptions: false,
    showResultImmediately: false,
    examType: "practice",
    countsAs: "CA1",
    maxScore: "",
    weight: "",
  });

  // View modal
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Delete state
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const mapExam = (x: any): Exam => ({
  id: Number(x.examId),
  title: String(x.title ?? ""),
  classId: Number(x.classId),
  subjectId: Number(x.subjectId),
  className: String(x.class?.className ?? ""),
  subjectName: String(x.subject?.subjectName ?? ""),
  instructions: String(x.instructions ?? ""),
  duration: Number(x.durationMinutes ?? 0),
  startsAt: String(x.startsAt ?? ""),
  endsAt: String(x.endsAt ?? ""),
  attemptLimit: Number(x.attemptLimit ?? 1),
  shuffleQuestions: Boolean(x.shuffleQuestions),
  shuffleOptions: Boolean(x.shuffleOptions),
  showResultImmediately: Boolean(x.showResultImmediately),
  examType: x.scoreMode === "graded" ? "graded" : "practice",
  countsAs:
    x.resultComponent === "CA1" ? "CA1" :
    x.resultComponent === "CA2" ? "CA2" :
    x.resultComponent === "EXAM" ? "EXAM" :
    undefined,
  maxScore: x.componentMaxScore != null ? Number(x.componentMaxScore) : undefined,
  weight: x.totalMarks != null ? Number(x.totalMarks) : undefined,
  created_at: String(x.created_at ?? new Date().toISOString()),
  status: x.isPublished ? "published" : "draft",
});

  useEffect(() => {
    const fetchInitialData = async () => {
      const loadingId = toast.loading("Loading exams...");

      try {
        setLoading(true);
        
        // Fetch exams
        // const examsRes = await api.get("/cbt");
        
       const classesRes = await api.get("/classes/school");

const rawClasses =
  Array.isArray(classesRes.data)
    ? classesRes.data
    : Array.isArray(classesRes.data?.data)
      ? classesRes.data.data
      : [];

const normalizedClasses: Class[] = rawClasses.map((c: any) => ({
  classId: Number(c.classId ?? c.class_id ?? c.id),
  className: String(c.className ?? c.class_name ?? c.name ?? ""),
}));
setClasses(normalizedClasses);

// const sorted = (examsRes.data || []).slice().sort(
//   (a: Exam, b: Exam) =>
//     new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
// );

// setExams(sorted);


// Fetch exams
const examsRes = await api.get("/cbt");

// ✅ handle your response shape: { status, data: { data: [...] } }
const rawExams =
  Array.isArray(examsRes.data)
    ? examsRes.data
    : Array.isArray(examsRes.data?.data)
      ? examsRes.data.data
      : Array.isArray(examsRes.data?.data?.data)
        ? examsRes.data.data.data
        : [];

// ✅ map backend -> frontend shape
const normalizedExams: Exam[] = rawExams.map((x: any) => ({
  id: Number(x.examId),
  title: String(x.title ?? ""),
  classId: Number(x.classId),
  subjectId: Number(x.subjectId),
  className: String(x.class?.className ?? ""),
  subjectName: String(x.subject?.subjectName ?? ""),
  instructions: String(x.instructions ?? ""),
  duration: Number(x.durationMinutes ?? 0),
  startsAt: String(x.startsAt ?? ""),
  endsAt: String(x.endsAt ?? ""),
  attemptLimit: Number(x.attemptLimit ?? 1),
  shuffleQuestions: Boolean(x.shuffleQuestions),
  shuffleOptions: Boolean(x.shuffleOptions),
  showResultImmediately: Boolean(x.showResultImmediately),

  // backend uses scoreMode: "practice" | "graded" (or similar)
  examType: (x.scoreMode === "graded" ? "graded" : "practice"),

  // optional graded fields (adjust if you have them)
  countsAs: x.resultComponent === "CA1" ? "CA1"
    : x.resultComponent === "CA2" ? "CA2"
    : x.resultComponent === "EXAM" ? "EXAM"
    : undefined,

  maxScore: x.componentMaxScore ? Number(x.componentMaxScore) : undefined,
  weight: x.totalMarks ? Number(x.totalMarks) : undefined,

  created_at: String(x.created_at ?? new Date().toISOString()),

  status: x.isPublished ? "published" : "draft",
}));

const sorted = normalizedExams.slice().sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);

setExams(sorted);



        toast.success("Exams loaded", {
          description: `Found ${sorted.length} exams`,
          id: loadingId,
        });
      } catch (err: any) {
        toast.error("Failed to load exams", {
          description: err?.response?.data?.message || "Connection issue",
          id: loadingId,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const openModal = (mode: "add" | "edit", exam?: Exam) => {
    setModalMode(mode);
    setCurrentExam(exam || null);
    setCurrentStep(1);
    
//     if (exam) {
//       setFormData({
//   title: exam.title,
//   classId: String(exam.classId),
//   subjectId: String(exam.subjectId),
//   instructions: exam.instructions,
//   duration: exam.duration.toString(),
//   startsAt: exam.startsAt,
//   endsAt: exam.endsAt,
//   attemptLimit: exam.attemptLimit.toString(),
//   shuffleQuestions: exam.shuffleQuestions,
//   shuffleOptions: exam.shuffleOptions,
//   showResultImmediately: exam.showResultImmediately,
//   examType: exam.examType,
//   countsAs: exam.countsAs || "CA1",
//   maxScore: exam.maxScore?.toString() || "",
//   weight: exam.weight?.toString() || "",
// });
if (exam) {
  const classIdStr = String(exam.classId);

  setFormData({
    title: exam.title,
    classId: classIdStr,
    subjectId: String(exam.subjectId),
    instructions: exam.instructions,
    duration: exam.duration.toString(),
    startsAt: toDateTimeLocal(exam.startsAt),
    endsAt: toDateTimeLocal(exam.endsAt),
    attemptLimit: exam.attemptLimit.toString(),
    shuffleQuestions: exam.shuffleQuestions,
    shuffleOptions: exam.shuffleOptions,
    showResultImmediately: exam.showResultImmediately,
    examType: exam.examType,
    countsAs: exam.countsAs || "CA1",
    maxScore: exam.maxScore?.toString() || "",
    weight: exam.weight?.toString() || "",
  });

  // ✅ ensure dropdown has options
  fetchSubjectsByClass(classIdStr);

    } else {
      // Set default values for new exam
      setFormData({
        title: "",
        classId: "",
        subjectId: "",
        instructions: "",
        duration: "",
        startsAt: "",
        endsAt: "",
        attemptLimit: "1",
        shuffleQuestions: false,
        shuffleOptions: false,
        showResultImmediately: false,
        examType: "practice",
        countsAs: "CA1",
        maxScore: "",
        weight: "",
      });
    }
    
    setModalOpen(true);
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return false;
    }
    if (!formData.classId) {
      toast.error("Please select a class");
      return false;
    }
    if (!formData.subjectId) {
      toast.error("Please select a subject");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      toast.error("Please enter a valid duration");
      return false;
    }
    if (!formData.startsAt) {
      toast.error("Start date is required");
      return false;
    }
    if (!formData.endsAt) {
      toast.error("End date is required");
      return false;
    }
    if (new Date(formData.startsAt) >= new Date(formData.endsAt)) {
      toast.error("End date must be after start date");
      return false;
    }
    if (!formData.attemptLimit || parseInt(formData.attemptLimit) <= 0) {
      toast.error("Please enter a valid attempt limit");
      return false;
    }
    return true;
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < 3) {
      nextStep();
      return;
    }

    // Final validation for step 3
    if (formData.examType === "graded") {
      if (!formData.maxScore || parseInt(formData.maxScore) <= 0) {
        toast.error("Please enter a valid max score for graded exam");
        return;
      }
      if (!formData.weight || parseInt(formData.weight) <= 0) {
        toast.error("Please enter a valid weight for graded exam");
        return;
      }
    }

    const loadingId = toast.loading(
      modalMode === "add" ? "Creating exam..." : "Updating exam..."
    );

    setIsSubmitting(true);

    try {
      let updatedExams: Exam[];

      const payload = {
        title: formData.title,
        classId: formData.classId,
        subjectId: formData.subjectId,
        instructions: formData.instructions,
        durationMinutes: parseInt(formData.duration),
        startsAt: formData.startsAt,
        endsAt: formData.endsAt,
        attemptLimit: parseInt(formData.attemptLimit),
        shuffleQuestions: formData.shuffleQuestions,
        shuffleOptions: formData.shuffleOptions,
        showResultImmediately: formData.showResultImmediately,
        examType: formData.examType,
        ...(formData.examType === "graded" && {
          countsAs: formData.countsAs,
          maxScore: parseInt(formData.maxScore),
          weight: parseInt(formData.weight),
        }),
      };

      if (modalMode === "add") {
        const res = await api.post("/cbt/exams", payload);
const createdExam = mapExam(res.data?.data ?? res.data); // depending on create response
updatedExams = [createdExam, ...exams];
        toast.success("Exam created", {
          description: `${formData.title} was successfully created`,
          id: loadingId,
        });
      } else if (currentExam) {
        const res = await api.patch(`/cbt/${currentExam.id}`, payload);

// ✅ your API returns {status, message, data}
const updatedBackend = res.data?.data;

// ✅ normalize into Exam
const updatedExam = mapExam(updatedBackend);

updatedExams = exams.map((ex) =>
  ex.id === currentExam.id ? updatedExam : ex
);

        toast.success("Exam updated", {
          description: `${formData.title} was successfully updated`,
          id: loadingId,
        });
      } else {
        throw new Error("No exam selected");
      }

      setExams(updatedExams);
      setModalOpen(false);
      setCurrentExam(null);
      setCurrentStep(1);
    } catch (err: any) {
      toast.error("Operation failed", {
        description: err?.response?.data?.message || `Failed to ${modalMode === "add" ? "create" : "update"} exam`,
        id: loadingId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExam = async (examId: number) => {
    const exam = exams.find((e) => e.id === examId);
    const examName = exam ? exam.title : "this exam";

    const loadingId = toast.loading(`Deleting ${examName}...`);

    setDeleteLoadingId(examId);

    try {
      await api.delete(`/cbt/exams/${examId}`);
      setExams((prev) => prev.filter((e) => e.id !== examId));

      toast.success("Exam deleted", {
        description: `${examName} has been permanently removed`,
        id: loadingId,
      });
    } catch (err: any) {
      toast.error("Delete failed", {
        description: err?.response?.data?.message || "Could not delete exam",
        id: loadingId,
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-gray-100 text-gray-800",
      published: "bg-green-100 text-green-800",
      archived: "bg-yellow-100 text-yellow-800",
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const filteredSubjects = subjects.filter(
  (s) => !formData.classId || s.classId === Number(formData.classId)
);


const fetchSubjectsByClass = async (classId: string) => {
  if (!classId) return;

  setSubjectsLoading(true);
  setSubjects([]); // clear old subjects

  try {
    // ✅ adjust endpoint to your actual route
    const res = await api.get(`/classes/${classId}/subjects`);

    // normalize common API shapes
    const raw =
      Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.subjects)
            ? res.data.subjects
            : [];

    const normalized: Subject[] = raw.map((s: any) => ({
      subjectId: Number(s.subjectId ?? s.subject_id ?? s.id),
      subjectName: String(s.subjectName ?? s.subject_name ?? s.name ?? ""),
      classId: Number(s.classId ?? s.class_id ?? classId),
    }));

    setSubjects(normalized);
  } catch (err: any) {
    setSubjects([]);
    toast.error("Failed to load subjects", {
      description: err?.response?.data?.message || "Could not fetch subjects for this class",
    });
  } finally {
    setSubjectsLoading(false);
  }
};


// Add this helper function somewhere in your component or in a utils file
const formatDateWithOrdinal = (dateString: string) => {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  // Add ordinal suffix (st, nd, rd, th)
  return formattedDate.replace(/(\d+)(?=,)/, (match) => {
    const day = parseInt(match);
    const suffix = ['th', 'st', 'nd', 'rd'][
      (day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10
    ];
    return day + suffix;
  });
};

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  // datetime-local expects local time
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
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
              CBT Exams
            </h1>
          </div>

          <Button
            className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
            onClick={() => openModal("add")}
          >
            + Create New Exam
          </Button>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <p className="py-12 text-center text-muted-foreground">Loading exams…</p>
          ) : exams.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No exams found</p>
          ) : (
            exams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all cursor-pointer dark:border-border/60"
                onClick={() => {
                  setSelectedExam(exam);
                  setViewOpen(true);
                }}
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-lg text-foreground">{exam.title}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(exam.status)}`}>
                        {exam.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{exam.className} • {exam.subjectName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Duration: {exam.duration} mins • Attempts: {exam.attemptLimit}
                    </p>
                  </div>
                  <div className="flex gap-2 self-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal("edit", exam);
                      }}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteLoadingId === exam.id}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deleteLoadingId === exam.id ? "Deleting..." : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{exam.title}</strong>?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteExam(exam.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-3/12">
                  Title
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  Class/Subject
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  Duration
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  Status
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  Type
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
                    Loading exams…
                  </TableCell>
                </TableRow>
              ) : exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    No exams found
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow
                    key={exam.id}
                    className="hover:bg-muted/40 transition-colors cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      setSelectedExam(exam);
                      setViewOpen(true);
                    }}
                  >
                    <TableCell className="px-6 py-4 font-medium text-foreground">
                      {exam.title}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {exam.className}<br/>
                      <span className="text-xs">{exam?.subjectName}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {exam.duration} mins
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(exam.status)}`}>
                        {exam.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {exam.examType}
                      {exam.examType === 'graded' && ` (${exam.countsAs})`}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExam(exam);
                          setViewOpen(true);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal("edit", exam);
                        }}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteLoadingId === exam.id}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {deleteLoadingId === exam.id ? "Deleting..." : "Delete"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{exam.title}</strong>?<br />
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteExam(exam.id)}
                              className="bg-destructive hover:bg-destructive/90"
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

        {/* Create/Edit Exam Modal - Multi-step */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>
                {modalMode === "add" ? "Create New Exam" : "Edit Exam"}
              </DialogTitle>
              <DialogDescription>
                Step {currentStep} of 3: {currentStep === 1 ? "Basic Information" : currentStep === 2 ? "Timing Settings" : "Exam Configuration"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveExam} className="flex-1 overflow-y-auto px-6 py-6">
              {/* Step 1: Basics */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="title">Exam Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Mathematics Mid-Term Examination"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="class">Class *</Label>
 <Select
  value={formData.classId}
  onValueChange={(value) => {
    setFormData((prev) => ({
      ...prev,
      classId: value,
      subjectId: "", // ✅ reset subject
    }));

    fetchSubjectsByClass(value); // ✅ fetch subjects for selected class
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Select class" />
  </SelectTrigger>
  <SelectContent>
    {classes.map((cls) => (
      <SelectItem key={cls.classId} value={String(cls.classId)}>
        {cls.className}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Select
  value={formData.subjectId}
  onValueChange={(value) =>
    setFormData((prev) => ({ ...prev, subjectId: value }))
  }
  disabled={!formData.classId || subjectsLoading}
>
  <SelectTrigger>
    <SelectValue
      placeholder={
        !formData.classId
          ? "Select class first"
          : subjectsLoading
            ? "Loading subjects..."
            : "Select subject"
      }
    />
  </SelectTrigger>

  <SelectContent>
    {subjects.length === 0 ? (
      <SelectItem value="__none" disabled>
        {subjectsLoading ? "Loading..." : "No subjects found for this class"}
      </SelectItem>
    ) : (
      subjects.map((subj) => (
        <SelectItem key={subj.subjectId} value={String(subj.subjectId)}>
          {subj.subjectName}
        </SelectItem>
      ))
    )}
  </SelectContent>
</Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="Enter exam instructions for students..."
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Timing */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="duration">Duration (minutes) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 60"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startsAt">Start Date/Time *</Label>
                      <Input
                        id="startsAt"
                        type="datetime-local"
                        value={formData.startsAt}
                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="endsAt">End Date/Time *</Label>
                      <Input
                        id="endsAt"
                        type="datetime-local"
                        value={formData.endsAt}
                        onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="attemptLimit">Attempt Limit *</Label>
                    <Input
                      id="attemptLimit"
                      type="number"
                      min="1"
                      value={formData.attemptLimit}
                      onChange={(e) => setFormData({ ...formData, attemptLimit: e.target.value })}
                      placeholder="e.g., 1"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Number of times a student can attempt this exam
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Settings */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Exam Behavior</h3>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="shuffleQuestions" className="cursor-pointer">
                        Shuffle Questions
                      </Label>
                      <Switch
                        id="shuffleQuestions"
                        checked={formData.shuffleQuestions}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, shuffleQuestions: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="shuffleOptions" className="cursor-pointer">
                        Shuffle Options
                      </Label>
                      <Switch
                        id="shuffleOptions"
                        checked={formData.shuffleOptions}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, shuffleOptions: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="showResultImmediately" className="cursor-pointer">
                        Show Result Immediately
                      </Label>
                      <Switch
                        id="showResultImmediately"
                        checked={formData.showResultImmediately}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, showResultImmediately: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-4">Exam Type</h3>
                    
                    <RadioGroup
                      value={formData.examType}
                      onValueChange={(value: 'practice' | 'graded') => 
                        setFormData({ ...formData, examType: value })
                      }
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="practice" id="practice" />
                        <Label htmlFor="practice">Practice Exam</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="graded" id="graded" />
                        <Label htmlFor="graded">Graded Exam</Label>
                      </div>
                    </RadioGroup>

                    {formData.examType === "graded" && (
                      <div className="mt-4 space-y-4 pl-6 border-l-2 border-muted">
                        <div>
                          <Label htmlFor="countsAs">Counts As *</Label>
                          <Select
                            value={formData.countsAs}
                            onValueChange={(value: 'CA1' | 'CA2' | 'EXAM') => 
                              setFormData({ ...formData, countsAs: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select assessment type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CA1">Continuous Assessment 1</SelectItem>
                              <SelectItem value="CA2">Continuous Assessment 2</SelectItem>
                              <SelectItem value="EXAM">Final Exam</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="maxScore">Max Score *</Label>
                            <Input
                              id="maxScore"
                              type="number"
                              min="1"
                              value={formData.maxScore}
                              onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                              placeholder="e.g., 100"
                            />
                          </div>
                          <div>
                            <Label htmlFor="weight">Weight (%) *</Label>
                            <Input
                              id="weight"
                              type="number"
                              min="1"
                              max="100"
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              placeholder="e.g., 20"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>

            <DialogFooter className="px-6 py-4 border-t">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
                  Previous
                </Button>
              )}
              <Button
                type="submit"
                onClick={handleSaveExam}
                disabled={isSubmitting}
                className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
              >
                {isSubmitting 
                  ? "Saving..." 
                  : currentStep === 3 
                    ? (modalMode === "add" ? "Create Exam" : "Save Changes")
                    : "Next"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Exam Modal */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>Exam Details</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {selectedExam && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-1">Title</h4>
                      <p className="text-lg font-semibold">{selectedExam.title}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-1">Status</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(selectedExam.status)}`}>
                        {selectedExam.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-1">Class</h4>
                      <p>{selectedExam.className}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-1">Subject</h4>
                      <p>{selectedExam.subjectName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-1">Instructions</h4>
                      <p className="text-sm">{selectedExam.instructions || "No instructions provided"}</p>
                    </div>
                  </div>

                  {/* Timing Info */}
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Timing & Attempts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm text-muted-foreground mb-1">Duration</h4>
                        <p>{selectedExam.duration} minutes</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-muted-foreground mb-1">Start Date</h4>
                        {/* <p>{new Date(selectedExam.startsAt).toLocaleString()}</p> */}
                        <p>{formatDateWithOrdinal(selectedExam.startsAt)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-muted-foreground mb-1">End Date</h4>
                        {/* <p>{new Date(selectedExam.endsAt).toLocaleString()}</p> */}
                        <p>{formatDateWithOrdinal(selectedExam.endsAt)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-muted-foreground mb-1">Attempt Limit</h4>
                        <p>{selectedExam.attemptLimit}</p>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Exam Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm text-muted-foreground mb-1">Shuffle Questions</h4>
                        <p>{selectedExam.shuffleQuestions ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-muted-foreground mb-1">Shuffle Options</h4>
                        <p>{selectedExam.shuffleOptions ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-muted-foreground mb-1">Show Result Immediately</h4>
                        <p>{selectedExam.showResultImmediately ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-muted-foreground mb-1">Exam Type</h4>
                        <p className="capitalize">{selectedExam.examType}</p>
                      </div>
                      {selectedExam.examType === "graded" && (
                        <>
                          <div>
                            <h4 className="text-sm text-muted-foreground mb-1">Counts As</h4>
                            <p>{selectedExam.countsAs}</p>
                          </div>
                          <div>
                            <h4 className="text-sm text-muted-foreground mb-1">Max Score</h4>
                            <p>{selectedExam.maxScore}</p>
                          </div>
                          <div>
                            <h4 className="text-sm text-muted-foreground mb-1">Weight</h4>
                            <p>{selectedExam.weight}%</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
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
                  openModal("edit", selectedExam!);
                }}
                className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
              >
                Edit Exam
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}