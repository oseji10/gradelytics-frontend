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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeftIcon } from "@/icons";
import Icon from "@/components/Icons";
import api from "../../../lib/api";
import { Loader2 } from "lucide-react";

interface SchoolClass {
  classId: number;
  className: string;
}

interface Subject {
  subjectId: number;
  subjectName: string;
}

interface Student {
  studentId: number;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
}

interface AssessmentType {
  assessmentId: number;
  assessmentName: string;
  maxScore: string;
  weight: string;
}

interface ScoreEntry {
  assessmentId: number;
  score: number;
}

interface ScoreRecord {
  studentId: number;
  entries: ScoreEntry[];
  total?: number;
}

export default function ContinuousAssessment() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<number, ScoreRecord>>({});

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [noSubjectsAssigned, setNoSubjectsAssigned] = useState(false);

  // Auto-save related
  const [savingStudents, setSavingStudents] = useState<Set<number>>(new Set());
  const [globalSaving, setGlobalSaving] = useState(false);
  const saveTimeouts = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    fetchClasses();
    fetchAssessmentTypes();
  }, []);

  useEffect(() => {
    setSelectedSubjectId("");
    setNoSubjectsAssigned(false);
    setSubjects([]);
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId) {
      fetchSubjects();
    }
    if (selectedClassId && selectedSubjectId) {
      fetchStudentsAndScores();
    }
  }, [selectedClassId, selectedSubjectId, selectedTermId]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await api.get("/classes/school");
      setClasses(res.data || []);
    } catch (err) {
      toast.error("Failed to load classes");
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchAssessmentTypes = async () => {
    try {
      setLoadingAssessments(true);
      const res = await api.get("/assessment");
      const data = Array.isArray(res.data) ? res.data : [];
      setAssessmentTypes(data);
    } catch (err) {
      toast.error("Failed to load assessment types");
      setAssessmentTypes([]);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const fetchSubjects = async () => {
    if (!selectedClassId) return;

    setLoadingSubjects(true);
    setNoSubjectsAssigned(false);

    try {
      const res = await api.get(`/classes/${selectedClassId}/subjects`);
      const responseData = res.data;

      let subjectList: Subject[] = [];

      if (Array.isArray(responseData)) {
        subjectList = responseData;
      } else if (responseData && Array.isArray(responseData.subjects)) {
        subjectList = responseData.subjects;
      } else if (responseData && typeof responseData === 'object') {
        subjectList = Array.isArray(responseData) ? responseData : [];
      }

      setSubjects(subjectList);

      if (subjectList.length === 0) {
        setNoSubjectsAssigned(true);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || "";
      if (message.toLowerCase().includes("no subjects assigned")) {
        setNoSubjectsAssigned(true);
        setSubjects([]);
      } else {
        toast.error(message || "Failed to load subjects");
        setSubjects([]);
      }
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchStudentsAndScores = async () => {
    if (!selectedClassId || !selectedSubjectId) return;

    setLoadingStudents(true);
    try {
      const studentsRes = await api.get(`/classes/school/${selectedClassId}/students`);
      const rawStudents = studentsRes.data || [];
      const flattened = rawStudents
        .filter((enroll: any) => enroll.student?.user)
        .map((enroll: any) => ({
          studentId: enroll.student.studentId,
          firstName: enroll.student.user.firstName,
          lastName: enroll.student.user.lastName,
          otherNames: enroll.student.user.otherNames || undefined,
        }));
      setStudents(flattened);

      const scoresRes = await api.get(
        `/assessment/scores?classId=${selectedClassId}&subjectId=${selectedSubjectId}${
          selectedTermId && selectedTermId !== "null" ? `&termId=${selectedTermId}` : ""
        }`
      );

      const response = scoresRes.data;
      setIsEditable(response?.editable ?? true);

      const initialScores: Record<number, ScoreRecord> = {};
      flattened.forEach((student: Student) => {
        const studentData = response?.students?.find(
          (s: any) => s.studentId === student.studentId
        );

        let entries: ScoreEntry[] = [];

        if (studentData?.assessments && Array.isArray(studentData.assessments)) {
          entries = assessmentTypes.map((at) => {
            const existing = studentData.assessments.find(
              (a: any) => a.assessmentId === at.assessmentId
            );
            return {
              assessmentId: at.assessmentId,
              score: existing?.score ? Number(existing.score) : 0,
            };
          });
          toast.success("Data loaded", {
            description: `Existing scores for this subject loaded`,
          });
        } else {
          entries = assessmentTypes.map((at) => ({
            assessmentId: at.assessmentId,
            score: 0,
          }));
        }

        initialScores[student.studentId] = {
          studentId: student.studentId,
          entries,
        };
      });

      setScores(initialScores);
    } catch (err) {
      console.error("Scores fetch error:", err);
      toast.error("Failed to load students or existing scores");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Update handleScoreChange
const handleScoreChange = (
  studentId: number,
  assessmentId: number,
  value: string
) => {
  if (!isEditable) return;

  const numValue = value === "" ? 0 : Number(value);
  if (isNaN(numValue) || numValue < 0) return;

  const assType = assessmentTypes.find((at) => at.assessmentId === assessmentId);
  const max = assType ? Number(assType.maxScore) : 100;

  if (numValue > max) {
    toast.error(`Score cannot exceed ${max} for ${assType?.assessmentName || "this assessment"}`);
    return;
  }

  setScores((prev) => {
    const record = prev[studentId] || {
      studentId,
      entries: assessmentTypes.map((at) => ({
        assessmentId: at.assessmentId,
        score: 0,
      })),
    };

    let updatedEntries = [...record.entries];
    const index = updatedEntries.findIndex((e) => e.assessmentId === assessmentId);

    // Only update if value actually changed
    const currentScore = index !== -1 ? updatedEntries[index].score : 0;
    if (currentScore === numValue) return prev; // no change → skip

    if (index !== -1) {
      updatedEntries[index] = { ...updatedEntries[index], score: numValue };
    } else {
      updatedEntries.push({ assessmentId, score: numValue });
    }

    const newRecord = { ...record, entries: updatedEntries };

    // Trigger debounced save with fresh record
    if (saveTimeouts.current[studentId]) {
  clearTimeout(saveTimeouts.current[studentId]);
}

setSavingStudents(prev => new Set(prev).add(studentId));
setGlobalSaving(true);
const timeout = setTimeout(() => {
  saveSingleStudent(studentId, newRecord);
  delete saveTimeouts.current[studentId];
}, 800);

saveTimeouts.current[studentId] = timeout;
    return {
      ...prev,
      [studentId]: newRecord,
    };
  });
};

// Update saveSingleStudent to accept fresh record (no closure staleness)
const saveSingleStudent = async (studentId: number, freshRecord?: ScoreRecord) => {
  // Prefer fresh record if passed (from timeout), otherwise fall back to current state
  const record = freshRecord || scores[studentId];
  if (!record) return;

  setSavingStudents((prev) => new Set([...prev, studentId]));
  setGlobalSaving(true);

  try {
    for (const at of assessmentTypes) {
      const entry = record.entries.find((e) => e.assessmentId === at.assessmentId);
      if (!entry) continue;

      // Debug: log what we're actually sending
      console.log(`Saving for student ${studentId}, assessment ${at.assessmentId}: score = ${entry.score}`);

      await api.post(`/assessment/${at.assessmentId}/scores`, {
        classId: Number(selectedClassId),
        subjectId: Number(selectedSubjectId),
        scores: [{
          studentId,
          score: entry.score,
        }],
      });
    }
  } catch (err: any) {
    toast.error(`Failed to save for student: ${err?.response?.data?.message || 'Error'}`);
  } finally {
  setSavingStudents((prev) => {
    const next = new Set(prev);
    next.delete(studentId);

    // ✅ Correct place to update globalSaving
    if (next.size === 0) {
      setGlobalSaving(false);
    }

    return next;
  });
}
};
  const calculateTotal = (record: ScoreRecord) => {
    return record.entries.reduce((sum, e) => sum + (e.score || 0), 0);
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      <div className="space-y-8 px-4 py-8 md:px-8 lg:px-12">
        {/* Global Saving Indicator */}
        {globalSaving && (
          <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 border border-gray-200 dark:border-gray-700">
            <Loader2 className="h-4 w-4 animate-spin text-[#1F6F43]" />
            <span className="text-sm font-medium">Saving changes...</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <Icon src={ChevronLeftIcon} className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Continuous Assessment Scores
            </h1>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Select Class, Subject & Term</CardTitle>
            <CardDescription>
              Choose the class, subject, and term to enter scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>Class</Label>
                {loadingClasses ? (
                  <p className="text-sm text-muted-foreground py-2">Loading...</p>
                ) : (
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.classId} value={cls.classId.toString()}>
                          {cls.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label>Subject</Label>
                {loadingSubjects ? (
                  <p className="text-sm text-muted-foreground py-2">Loading subjects...</p>
                ) : !selectedClassId ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Select class first
                  </p>
                ) : noSubjectsAssigned ? (
                  <div className="py-3 px-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-md text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-300">
                      No subjects assigned to you for this class
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                      You cannot enter scores until a subject is assigned to you.
                      Please contact the admin or head of department.
                    </p>
                  </div>
                ) : subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No subjects available
                  </p>
                ) : (
                  <Select
                    value={selectedSubjectId}
                    onValueChange={setSelectedSubjectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((sub) => (
                        <SelectItem key={sub.subjectId} value={sub.subjectId.toString()}>
                          {sub.subjectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* <div>
                <Label>Term (optional)</Label>
                <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All terms / select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">All terms</SelectItem>
                    <SelectItem value="1">First Term</SelectItem>
                    <SelectItem value="2">Second Term</SelectItem>
                    <SelectItem value="3">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* Scores Entry */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>
              {selectedClassId && selectedSubjectId && !noSubjectsAssigned
                ? `Scores for ${classes.find((c) => c.classId === Number(selectedClassId))?.className} - ${
                    subjects.find((s) => s.subjectId === Number(selectedSubjectId))?.subjectName
                  }`
                : "Select class and subject to begin"}
            </CardTitle>
            <CardDescription>
              Enter continuous assessment scores for each student
              {!isEditable && selectedSubjectId && (
                <span className="ml-2 text-amber-600 font-medium">
                  (This record is no longer editable)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStudents || loadingAssessments ? (
              <div className="py-12 text-center text-muted-foreground">
                {loadingAssessments ? "Loading assessment types..." : "Loading students..."}
              </div>
            ) : !selectedClassId ? (
              <div className="py-12 text-center text-muted-foreground">
                Please select a class above
              </div>
            ) : noSubjectsAssigned ? (
              <div className="py-12 text-center">
                <p className="text-lg font-medium text-amber-700 dark:text-amber-300 mb-3">
                  Cannot enter scores
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  No subjects are currently assigned to you for this class. 
                  Please have a subject assigned before recording continuous assessment scores.
                </p>
              </div>
            ) : !selectedSubjectId ? (
              <div className="py-12 text-center text-muted-foreground">
                Please select a subject
              </div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No students found in this class
              </div>
            ) : assessmentTypes.length === 0 ? (
              <div className="py-12 text-center text-amber-600">
                No assessment types defined yet. Please define them in school settings.
              </div>
            ) : (
              <div className="rounded-md border">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground w-4/12">
                          Student Name
                        </th>
                        {assessmentTypes.map((at) => (
                          <th
                            key={at.assessmentId}
                            className="px-6 py-3 text-center text-sm font-medium text-muted-foreground w-1/12"
                          >
                            {at.assessmentName} (max {at.maxScore})
                          </th>
                        ))}
                        <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground w-1/12">
                          Total
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground w-1/12">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((student) => {
                        const record = scores[student.studentId] || {
                          studentId: student.studentId,
                          entries: assessmentTypes.map((at) => ({
                            assessmentId: at.assessmentId,
                            score: 0,
                          })),
                        };
                        const total = calculateTotal(record);

                        return (
                          <tr key={student.studentId} className="hover:bg-muted/30">
                            <td className="px-6 py-4 font-medium">
                              {student.firstName} {student.lastName}
                              {student.otherNames && ` (${student.otherNames})`}
                            </td>
                            {assessmentTypes.map((at) => {
                              const entry = record.entries.find(
                                (e) => e.assessmentId === at.assessmentId
                              ) || { score: 0 };

                              return (
                                <td key={at.assessmentId} className="px-6 py-4">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={Number(at.maxScore)}
                                    step="any"
                                    value={entry.score === 0 ? "" : entry.score}
                                    onChange={(e) =>
                                      handleScoreChange(
                                        student.studentId,
                                        at.assessmentId,
                                        e.target.value
                                      )
                                    }
                                    disabled={!isEditable}
                                    className="text-center"
                                  />
                                </td>
                              );
                            })}
                            <td className="px-6 py-4 text-center font-medium">
                              {total}
                            </td>
                            <td className="px-6 py-4 text-center text-xs">
                              {savingStudents.has(student.studentId) ? (
                                <span className="text-blue-600 flex items-center justify-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                                </span>
                              ) : (
                                <span className="text-green-600">Saved</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-6">
                  {students.map((student) => {
                    const record = scores[student.studentId] || {
                      studentId: student.studentId,
                      entries: assessmentTypes.map((at) => ({
                        assessmentId: at.assessmentId,
                        score: 0,
                      })),
                    };
                    const total = calculateTotal(record);

                    return (
                      <Card key={student.studentId} className="overflow-hidden">
                        <CardContent className="p-5">
                          <div className="font-medium mb-4">
                            {student.firstName} {student.lastName}
                            {student.otherNames && ` (${student.otherNames})`}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                            {assessmentTypes.map((at) => {
                              const entry = record.entries.find(
                                (e) => e.assessmentId === at.assessmentId
                              ) || { score: 0 };

                              return (
                                <div key={at.assessmentId}>
                                  <Label className="text-xs">
                                    {at.assessmentName} (max {at.maxScore})
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={Number(at.maxScore)}
                                    step="any"
                                    value={entry.score === 0 ? "" : entry.score}
                                    onChange={(e) =>
                                      handleScoreChange(
                                        student.studentId,
                                        at.assessmentId,
                                        e.target.value
                                      )
                                    }
                                    disabled={!isEditable}
                                  />
                                </div>
                              );
                            })}
                            <div className="flex items-end">
                              <div>
                                <Label className="text-xs">Total</Label>
                                <div className="text-lg font-bold">{total}</div>
                              </div>
                            </div>
                          </div>

                          <div className="text-right text-xs mt-2">
                            {savingStudents.has(student.studentId) ? (
                              <span className="text-blue-600 flex items-center justify-end gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                              </span>
                            ) : (
                              <span className="text-green-600">Saved</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional: Keep a global save button as fallback */}
            {selectedClassId && selectedSubjectId && students.length > 0 && !noSubjectsAssigned && (
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={() => {
                    students.forEach((s) => saveSingleStudent(s.studentId));
                  }}
                  disabled={saving || loadingStudents || !isEditable || savingStudents.size > 0}
                  variant="outline"
                >
                  {savingStudents.size > 0 ? "Saving..." : "Save All Now"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}