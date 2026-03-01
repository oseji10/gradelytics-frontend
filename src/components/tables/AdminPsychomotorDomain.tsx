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
import { cn } from "@/lib/utils";

interface SchoolClass {
  classId: number;
  className: string;
}

interface PsychomotorDomain {
  domainId: number;
  domainName: string;
  maxScore: string;
  weight: string;
  schoolId: number;
  created_at: string;
  updated_at: string;
}

interface DomainEntry {
  domainId: number;
  rating: string;   // "1", "2", ..., "5", or ""
}

interface StudentRecord {
  studentId: number;
  entries: DomainEntry[];
}

interface Student {
  studentId: number;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
}

export default function PsychomotorDomainEntry() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [domains, setDomains] = useState<PsychomotorDomain[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<number, StudentRecord>>({});

  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [isEditable, setIsEditable] = useState(true);

  const [savingDomains, setSavingDomains] = useState<Set<number>>(new Set());
  const [globalSaving, setGlobalSaving] = useState(false);
  const saveTimeouts = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    fetchClasses();
    fetchDomains();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudentsAndRecords();
    } else {
      setStudents([]);
      setRecords({});
    }
  }, [selectedClassId]);

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

  const fetchDomains = async () => {
    try {
      setLoadingDomains(true);
      const res = await api.get("/domains");
      const data = res.data?.psychomotor || [];
      setDomains(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load psychomotor domains");
      setDomains([]);
    } finally {
      setLoadingDomains(false);
    }
  };

  const fetchStudentsAndRecords = async () => {
    if (!selectedClassId) return;

    setLoadingStudents(true);
    try {
      // 1. Students
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

      // 2. Psychomotor domain records
      const recordsRes = await api.get(`psychomotor/psychomotor/records?classId=${selectedClassId}`);
      const response = recordsRes.data;
      setIsEditable(response?.editable ?? true);

      // The response is a flat array of score objects
      const allScores = Array.isArray(response) ? response : [];

      // Build records map
      const initialRecords: Record<number, StudentRecord> = {};

      flattened.forEach((student) => {
        const studentScores = allScores.filter(
          (s: any) => s.studentId === student.studentId
        );

        const entries: DomainEntry[] = domains.map((d) => {
          const existing = studentScores.find(
            (score: any) => score.domainId === d.domainId
          );
          return {
            domainId: d.domainId,
            rating: existing?.score ? String(parseFloat(existing.score)) : "",
          };
        });

        initialRecords[student.studentId] = {
          studentId: student.studentId,
          entries,
        };
      });

      setRecords(initialRecords);
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("Failed to load students or psychomotor domain records");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleRatingChange = (studentId: number, domainId: number, rating: string) => {
    if (!isEditable) return;

    setRecords((prev) => {
      const record = prev[studentId] || {
        studentId,
        entries: domains.map((d) => ({ domainId: d.domainId, rating: "" })),
      };

      const updatedEntries = record.entries.map((e) =>
        e.domainId === domainId ? { ...e, rating } : e
      );

      const newRecord = { ...record, entries: updatedEntries };

      // Debounce save
      if (saveTimeouts.current[studentId]) {
        clearTimeout(saveTimeouts.current[studentId]);
      }
      saveTimeouts.current[studentId] = setTimeout(() => {
        saveStudentRatings(studentId, newRecord);
      }, 800);

      return { ...prev, [studentId]: newRecord };
    });
  };

  const saveStudentRatings = async (studentId: number, record?: StudentRecord) => {
    const studentRecord = record || records[studentId];
    if (!studentRecord) return;

    const ratingsByDomain: Record<number, { studentId: number; rating: string }[]> = {};

    studentRecord.entries.forEach((entry) => {
      if (entry.rating && entry.rating !== "") {
        if (!ratingsByDomain[entry.domainId]) {
          ratingsByDomain[entry.domainId] = [];
        }
        ratingsByDomain[entry.domainId].push({
          studentId,
          rating: entry.rating,
        });
      }
    });

    const savePromises = Object.entries(ratingsByDomain).map(([domainIdStr, ratings]) => {
      const domainId = Number(domainIdStr);
      setSavingDomains((prev) => new Set([...prev, domainId]));

      return api
        .post(`/psychomotor/psychomotor/${domainId}/scores`, {
          classId: Number(selectedClassId),
          ratings,
        })
        .catch((err) => {
          toast.error(`Failed to save ${domains.find(d => d.domainId === domainId)?.domainName || "domain"}`);
          console.error(err);
        })
        .finally(() => {
          setSavingDomains((prev) => {
            const next = new Set(prev);
            next.delete(domainId);
            return next;
          });
        });
    });

    await Promise.all(savePromises);
  };

  const saveAll = async () => {
    if (students.length === 0) return;

    setGlobalSaving(true);
    try {
      const promises = students.map((student) => {
        const record = records[student.studentId];
        if (record) return saveStudentRatings(student.studentId, record);
        return Promise.resolve();
      });

      await Promise.all(promises);
      toast.success("All ratings saved successfully");
    } catch {
      toast.error("Some ratings could not be saved");
    } finally {
      setGlobalSaving(false);
    }
  };

  const getMaxRating = (maxScoreStr: string): number => {
    const num = parseFloat(maxScoreStr);
    return isNaN(num) || num < 1 ? 5 : Math.floor(num);
  };

  const isSaving = savingDomains.size > 0 || globalSaving;

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      <div className="space-y-8 px-4 py-8 md:px-8 lg:px-12">
        {isSaving && (
          <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-900 shadow-xl rounded-lg px-5 py-3 flex items-center gap-3 border">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <span className="font-medium">Saving ratings...</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <Icon src={ChevronLeftIcon} className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Psychomotor Domain Entry
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Select Class</CardTitle>
            <CardDescription>Choose class to enter psychomotor ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs">
              <Label className="mb-1.5 block">Class</Label>
              {loadingClasses ? (
                <div className="h-10 flex items-center text-sm text-muted-foreground">
                  Loading classes...
                </div>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>
              {selectedClassId
                ? `Psychomotor Domains – ${classes.find((c) => c.classId === Number(selectedClassId))?.className}`
                : "Select a class to begin"}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              Rate students on behavioral domains
              {!isEditable && selectedClassId && (
                <span className="text-amber-600 font-medium text-sm ml-2">
                  (View only – period closed)
                </span>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loadingStudents || loadingDomains ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                <p>{loadingDomains ? "Loading domains..." : "Loading students..."}</p>
              </div>
            ) : !selectedClassId ? (
              <div className="py-20 text-center text-muted-foreground">
                Select a class above to view and rate students
              </div>
            ) : students.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                No students found in this class
              </div>
            ) : domains.length === 0 ? (
              <div className="py-20 text-center text-amber-600">
                No psychomotor domains have been defined yet.
                <br />
                Please add them in School Settings first.
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto border rounded-lg">
                  <table className="w-full divide-y table-fixed">
                    <thead className="bg-muted/60 sticky top-0 z-10">
                      <tr>
                        <th className="px-5 py-3.5 text-left text-sm font-semibold text-muted-foreground w-[240px] sticky left-0 bg-muted/60 z-20">
                          Student
                        </th>
                        {domains.map((domain) => (
                          <th
                            key={domain.domainId}
                            className="w-[148px] min-w-[148px] max-w-[148px] px-2 py-4 text-center text-sm font-medium text-muted-foreground align-middle"
                          >
                            <div className="line-clamp-3 h-12 flex items-center justify-center text-center leading-tight">
                              {domain.domainName}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              max {parseFloat(domain.maxScore).toFixed(0)}
                            </div>
                          </th>
                        ))}
                        <th className="px-3 py-3.5 text-center text-sm font-semibold text-muted-foreground w-[110px]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white dark:bg-gray-950">
                      {students.map((student) => {
                        const record = records[student.studentId] || {
                          studentId: student.studentId,
                          entries: domains.map((d) => ({ domainId: d.domainId, rating: "" })),
                        };

                        return (
                          <tr key={student.studentId} className="hover:bg-muted/40 transition-colors">
                            <td className="px-5 py-4 font-medium sticky left-0 bg-white dark:bg-gray-950 z-10 w-[240px]">
                              {student.firstName} {student.lastName}
                              {student.otherNames && (
                                <span className="text-xs text-muted-foreground block mt-0.5">
                                  {student.otherNames}
                                </span>
                              )}
                            </td>

                            {domains.map((d) => {
                              const entry = record.entries.find((e) => e.domainId === d.domainId) || { rating: "" };
                              const max = getMaxRating(d.maxScore);

                              return (
                                <td key={d.domainId} className="w-[148px] min-w-[148px] max-w-[148px] px-2 py-4 align-middle">
                                  <div className="flex justify-center">
                                    <Select
                                      value={entry.rating}
                                      onValueChange={(val) => handleRatingChange(student.studentId, d.domainId, val)}
                                      disabled={!isEditable}
                                    >
                                      <SelectTrigger className="w-[110px] h-9 text-center justify-center px-2">
                                        <SelectValue placeholder="—" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="null">—</SelectItem>
                                        {Array.from({ length: max }, (_, i) => i + 1).map((score) => (
                                          <SelectItem key={score} value={score.toString()}>
                                            {score}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </td>
                              );
                            })}

                            <td className="px-3 py-4 text-center w-[110px] text-xs">
                              {savingDomains.size > 0 ? (
                                <div className="flex items-center justify-center gap-1.5 text-blue-600">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Saving...
                                </div>
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
                <div className="md:hidden space-y-5">
                  {students.map((student) => {
                    const record = records[student.studentId] || {
                      studentId: student.studentId,
                      entries: domains.map((d) => ({ domainId: d.domainId, rating: "" })),
                    };

                    return (
                      <Card key={student.studentId} className="overflow-hidden border">
                        <CardContent className="p-5">
                          <div className="font-semibold text-base mb-4">
                            {student.firstName} {student.lastName}
                            {student.otherNames && (
                              <div className="text-sm text-muted-foreground mt-0.5">
                                {student.otherNames}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
                            {domains.map((d) => {
                              const entry = record.entries.find((e) => e.domainId === d.domainId) || {
                                rating: "",
                              };
                              const max = getMaxRating(d.maxScore);

                              return (
                                <div key={d.domainId} className="space-y-1.5">
                                  <Label className="text-xs font-medium line-clamp-2">
                                    {d.domainName}
                                    <span className="text-muted-foreground ml-1">
                                      (max {max})
                                    </span>
                                  </Label>
                                  <Select
                                    value={entry.rating}
                                    onValueChange={(val) =>
                                      handleRatingChange(student.studentId, d.domainId, val)
                                    }
                                    disabled={!isEditable}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="—" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="null">—</SelectItem>
                                      {Array.from({ length: max }, (_, i) => i + 1).map((score) => (
                                        <SelectItem key={score} value={score.toString()}>
                                          {score}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-5 text-right text-xs">
                            {savingDomains.size > 0 ? (
                              <span className="inline-flex items-center gap-1.5 text-blue-600">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Saving...
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
              </>
            )}

            {selectedClassId && students.length > 0 && (
              <div className="mt-8 flex justify-end">
                <Button
                  variant="outline"
                  onClick={saveAll}
                  disabled={isSaving || !isEditable}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save All Now"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}