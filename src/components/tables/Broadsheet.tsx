"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeftIcon, MessageSquare, User, Printer } from "lucide-react";
import api from "../../../lib/api"; // adjust path according to your project

interface SchoolClass {
  classId: number;
  className: string;
}

interface Subject {
  subjectId: number;
  subjectName: string;
}

interface Score {
  total: string;
  grade: string;
  remark?: string;
}

interface StudentSummary {
  studentId: number;
  firstName: string;
  lastName: string;
  otherNames: string;
  admissionNumber: string | null;
  scores: Record<string, Score>;
  total: number;
  average: number;
  grade: string;
  position: number;
  teacherComment?: string;
  principalComment?: string;
}

interface TermInfo {
  termId: number;
  termName: string;
}

interface ClassResult {
  className: string | null;
  term: TermInfo;
  classAverage: number;
  bestSubject?: { name: string; avg: number };
  worstSubject?: { name: string; avg: number };
  subjects: Subject[];
  students: StudentSummary[];
  session?: string; // added based on your usage
}

export default function ClassResultSummary() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("1");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");

  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<ClassResult | null>(null);

  // Teacher modal
  const [teacherStudent, setTeacherStudent] = useState<StudentSummary | null>(null);
  const [teacherComment, setTeacherComment] = useState("");
  const [savingTeacher, setSavingTeacher] = useState(false);

  // Principal modal
  const [principalStudent, setPrincipalStudent] = useState<StudentSummary | null>(null);
  const [principalComment, setPrincipalComment] = useState("");
  const [savingPrincipal, setSavingPrincipal] = useState(false);

  const printContentRef = useRef<HTMLDivElement>(null);

  const terms = [
    { value: "1", label: "First Term" },
    { value: "2", label: "Second Term" },
    { value: "3", label: "Third Term" },
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedTerm) {
      fetchClassResult();
    }
  }, [selectedClassId, selectedTerm]);

  // Reset subject filter when class or term changes
  useEffect(() => {
    setSelectedSubjectId("all");
  }, [selectedClassId, selectedTerm]);

  const fetchClasses = async () => {
    try {
      const res = await api.get("/classes/school");
      setClasses(res.data || []);
    } catch {
      toast.error("Failed to load classes");
    }
  };

  const fetchClassResult = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/results/class-summary/${selectedClassId}?term=${selectedTerm}`);
      setResultData(res.data);
    } catch (err) {
      toast.error("Could not load class result summary");
      setResultData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printContentRef.current || !resultData) return;

    const visibleSubjectCount =
      selectedSubjectId === "all" ? resultData.subjects.length : 1;
    const useA3 = visibleSubjectCount >= 12;
    const paperSize = useA3 ? "A3 landscape" : "A4 landscape";

    const printWindow = window.open("", "", "height=900,width=1300");
    if (!printWindow) {
      toast.error("Please allow popups for printing");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${resultData.className || "Class"} - ${resultData.term?.termName || "Term"}</title>
          <style>
            @page { size: ${paperSize}; margin: 12mm 10mm; }
            body { font-family: Arial, Helvetica, sans-serif; margin: 0; font-size: 9.5pt; color: #111; }
            h1 { text-align: center; font-size: 18pt; margin: 0 0 6px; }
            .subtitle { text-align: center; font-size: 11pt; color: #444; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #999; padding: 5px 6px; text-align: center; vertical-align: middle; }
            th { background-color: #e8ecef; font-weight: bold; font-size: 9pt; }
            td { font-size: 9pt; }
            .student-name-cell { text-align: left; font-weight: bold; min-width: 160px; max-width: 180px; }
            .admission { font-size: 8pt; color: #555; font-weight: normal; }
            .subject-header { writing-mode: vertical-rl; text-orientation: mixed; white-space: nowrap; height: 120px; vertical-align: bottom; padding-bottom: 8px; font-size: 8.5pt; }
            .numeric-cell { min-width: 50px; }
            .position-cell { min-width: 60px; }
            .remarks-column-head, .remarks-column-cell { display: none !important; }
            .print-comment-head, .print-comment-cell { display: table-cell !important; }
          </style>
        </head>
        <body>
          ${printContentRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 700);
  };

  const openTeacherModal = (student: StudentSummary) => {
    setTeacherStudent(student);
    setTeacherComment(student.teacherComment || "");
  };

  const openPrincipalModal = (student: StudentSummary) => {
    setPrincipalStudent(student);
    setPrincipalComment(student.principalComment || "");
  };

  const saveTeacherComment = async () => {
    if (!teacherStudent || !resultData) return;
    setSavingTeacher(true);

    try { 
      await api.patch(`/results/${teacherStudent.studentId}/class-teacher-comment/`, {
        termId: resultData.term.termId,
        classTeacherComment: teacherComment,
        // principalComment: teacherStudent.principalComment || "",
      });

      setResultData((prev) =>
        prev
          ? {
              ...prev,
              students: prev.students.map((s) =>
                s.studentId === teacherStudent.studentId ? { ...s, teacherComment } : s
              ),
            }
          : null
      );

      toast.success("Teacher comment saved");
      setTeacherStudent(null);
    } catch {
      toast.error("Failed to save teacher comment");
    } finally {
      setSavingTeacher(false);
    }
  };

  const savePrincipalComment = async () => {
    if (!principalStudent || !resultData) return;
    setSavingPrincipal(true);

    try {
      await api.patch(`/results/${principalStudent.studentId}/principal-comment/`, {
        // termId: resultData.term.termId,
        // teacherComment: principalStudent.teacherComment || "",
        principalComment: principalComment,
      });

      setResultData((prev) =>
        prev
          ? {
              ...prev,
              students: prev.students.map((s) =>
                s.studentId === principalStudent.studentId ? { ...s, principalComment } : s
              ),
            }
          : null
      );

      toast.success("Principal comment saved");
      setPrincipalStudent(null);
    } catch {
      toast.error("Failed to save principal comment");
    } finally {
      setSavingPrincipal(false);
    }
  };

  const getGradeColor = (grade?: string) => {
    if (!grade) return "bg-gray-100 text-gray-800 border-gray-300";
    const g = grade.toUpperCase();
    if (g === "A") return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (g === "B") return "bg-blue-100 text-blue-800 border-blue-300";
    if (g === "C") return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (g === "D") return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const formatPosition = (pos?: number) => {
    if (!pos) return "—";
    if (pos === 1) return "1ˢᵗ";
    if (pos === 2) return "2ⁿᵈ";
    if (pos === 3) return "3ʳᵈ";
    return `${pos}ᵗʰ`;
  };

  if (!resultData) {
    // early return handled in render below
  }

  const isAllSubjects = selectedSubjectId === "all";
  const displayedSubjects = isAllSubjects
    ? resultData?.subjects ?? []
    : resultData?.subjects.filter((s) => s.subjectId.toString() === selectedSubjectId) ?? [];

  return (
    <div className="min-h-screen bg-gray-50/40 dark:bg-gray-950 pb-16">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header & filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Class Result Summary</h1>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select Term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.classId} value={cls.classId.toString()}>
                    {cls.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {resultData && resultData.subjects.length > 0 && (
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filter by Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {resultData.subjects.map((sub) => (
                    <SelectItem key={sub.subjectId} value={sub.subjectId.toString()}>
                      {sub.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !selectedClassId || !selectedTerm ? (
          <div className="text-center py-20 text-muted-foreground text-lg">
            Please select a class and term to view the result summary
          </div>
        ) : !resultData ? (
          <div className="text-center py-20 text-muted-foreground">
            No result data available for this class/term
          </div>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl font-bold">
                      {resultData.className || "Class Result"}
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      <b>
                        {resultData.term?.termName || "Term"} {resultData.session || "Session"}{" "}
                        Academic Session
                      </b>
                      <br />
                      Class Average:{" "}
                      <span className="font-bold text-primary">
                        {resultData.classAverage?.toFixed(2) || "—"}%
                      </span>
                    </CardDescription>
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePrint}
                    className="gap-2 px-6"
                  >
                    <Printer className="h-5 w-5" />
                    Print
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <div ref={printContentRef}>
              <div className="mb-6 text-center hidden print:block">
                <h1 className="text-2xl font-bold">
                  {resultData.className} – {resultData.term?.termName} {resultData.session || ""}{" "}
                  Results
                </h1>
                <p className="text-gray-600 mt-1">
                  Class Average: {resultData.classAverage?.toFixed(2)}%
                </p>
              </div>

              <Card className="overflow-hidden mb-10 print:shadow-none print:border-0">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/60 print:bg-gray-100">
                          <TableHead className="sticky left-0 z-10 min-w-[220px] print:bg-gray-100 print:w-[160px]">
                            Student
                          </TableHead>

                          {displayedSubjects.map((sub) => (
                            <TableHead
                              key={sub.subjectId}
                              className="text-center print:bg-gray-100 subject-header min-w-[90px]"
                            >
                              {sub.subjectName}
                            </TableHead>
                          ))}

                          <TableHead className="text-center numeric-cell print:bg-gray-100">
                            Total
                          </TableHead>
                          <TableHead className="text-center numeric-cell print:bg-gray-100">
                            Average
                          </TableHead>
                          {/* <TableHead className="text-center numeric-cell print:bg-gray-100">
                            Grade
                          </TableHead> */}
                          <TableHead className="text-center position-cell print:bg-gray-100">
                            Position
                          </TableHead>

                          <TableHead className="w-20 text-center remarks-column-head print:hidden">
                            Remarks
                          </TableHead>

                          <TableHead className="hidden print:table-cell print:bg-gray-100 print-comment-head min-w-[180px]">
                            Class Teacher Comment
                          </TableHead>
                          <TableHead className="hidden print:table-cell print:bg-gray-100 print-comment-head min-w-[180px]">
                            Principal Comment
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
  {resultData.students.map((student) => (
    <TableRow key={student.studentId} className="hover:bg-muted/30 print:hover:bg-transparent">
      {/* Student name */}
      <TableCell className="sticky left-0 bg-background z-10 print:bg-white student-name-cell">
        <div>
          {student.firstName} {student.lastName} {student.otherNames || ""}
        </div>
        <div className="admission">{student.admissionNumber || "—"}</div>
      </TableCell>

      {/* Per-subject scores */}
      {displayedSubjects.map((sub) => {
        const score = student.scores[sub.subjectId.toString()];
        return (
          <TableCell key={sub.subjectId} className="text-center numeric-cell">
            {/* {score?.total ?? "—"} */}
            <span className="font-medium">{score.total ?? "-"}</span><br/>
      <span className="text-sm text-muted-foreground font-semibold">
        {score.grade}
      </span>
          </TableCell>
        );
      })}

      {/* Overall Total */}
      <TableCell className="text-center font-medium numeric-cell">
        {student.total ?? "—"}
      </TableCell>

      {/* Overall Average */}
      <TableCell className="text-center font-medium numeric-cell">
        {student.average ? student.average.toFixed(2) : "—"}
      </TableCell>

      {/* Overall Grade – only one column */}
      {/* <TableCell className="text-center">
        <Badge
          variant="outline"
          className={getGradeColor(student.grade)}
        >
          {student.grade || "—"}
        </Badge>
      </TableCell> */}

      {/* Position */}
      <TableCell className="text-center font-medium position-cell">
        {formatPosition(student.position)}
      </TableCell>

      {/* Remarks buttons (screen only) */}
      <TableCell className="remarks-column-cell print:hidden text-center space-x-1">
        <Button variant="ghost" size="icon" onClick={() => openTeacherModal(student)}>
          <User className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => openPrincipalModal(student)}>
          <MessageSquare className="h-4 w-4" />
        </Button>
      </TableCell>

      {/* Print-only teacher comment */}
      <TableCell className="hidden print:table-cell print-comment-cell text-left text-xs align-top max-w-[180px]">
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {student.teacherComment || "—"}
        </div>
      </TableCell>

      {/* Print-only principal comment */}
      <TableCell className="hidden print:table-cell print-comment-cell text-left text-xs align-top max-w-[180px]">
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {student.principalComment || "—"}
        </div>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Class Statistics */}
            <div className="grid gap-6 md:grid-cols-3 print:hidden">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Class Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {resultData.classAverage?.toFixed(2)}%
                  </div>
                  <Progress value={resultData.classAverage || 0} className="mt-3 h-2" />
                </CardContent>
              </Card>

              {resultData.bestSubject && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Best Subject</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-semibold">{resultData.bestSubject.name}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Avg: {resultData.bestSubject.avg.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
              )}

              {resultData.worstSubject && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Worst Subject</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-semibold">{resultData.worstSubject.name}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Avg: {resultData.worstSubject.avg.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      {/* Teacher Comment Modal */}
      <Dialog open={!!teacherStudent} onOpenChange={() => setTeacherStudent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Class Teacher Comment</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {teacherStudent?.firstName} {teacherStudent?.lastName}
            </p>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={teacherComment}
              onChange={(e) => setTeacherComment(e.target.value)}
              placeholder="Enter class teacher's remark here..."
              rows={5}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeacherStudent(null)}>
              Cancel
            </Button>
            <Button onClick={saveTeacherComment} disabled={savingTeacher}>
              {savingTeacher ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Principal Comment Modal */}
      <Dialog open={!!principalStudent} onOpenChange={() => setPrincipalStudent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Principal Comment</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {principalStudent?.firstName} {principalStudent?.lastName}
            </p>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={principalComment}
              onChange={(e) => setPrincipalComment(e.target.value)}
              placeholder="Enter principal's remark here..."
              rows={5}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrincipalStudent(null)}>
              Cancel
            </Button>
            <Button onClick={savePrincipalComment} disabled={savingPrincipal}>
              {savingPrincipal ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}