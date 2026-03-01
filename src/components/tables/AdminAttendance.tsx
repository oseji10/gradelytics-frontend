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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import api from "../../../lib/api";
import { ChevronLeftIcon } from "@/icons";
import Icon from "@/components/Icons";

interface SchoolClass {
  classId: number;
  className: string;
}

interface Student {
  studentId: number;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
}

interface AttendanceRecord {
  studentId: number;
  status: "present" | "absent" | "late";
  notes: string;
}

export default function MarkAttendance() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, AttendanceRecord>>({});
  const [isEditable, setIsEditable] = useState(true);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingStudents, setSavingStudents] = useState<Set<number>>(new Set());

  const saveTimeouts = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      fetchStudentsAndAttendance();
    }

    return () => {
      Object.values(saveTimeouts.current).forEach(clearTimeout);
      saveTimeouts.current = {};
    };
  }, [selectedClassId, selectedDate]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await api.get("/classes/school");
      setClasses(res.data || []);
      toast.success("Data loaded", {
                description: `Found ${res.data?.length || 0} classes`,
              });
    } catch {
      toast.error("Data loaded", {
      description: `Failed to load classes`,
      });
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudentsAndAttendance = async () => {
    if (!selectedClassId) return;
    setLoadingStudents(true);

    try {
      const enrollRes = await api.get(`/classes/school/${selectedClassId}/students`);
      const raw = enrollRes.data || [];
      const flattened: Student[] = raw
        .filter((e: any) => e.student?.user)
        .map((e: any) => ({
          studentId: e.student.studentId,
          firstName: e.student.user.firstName,
          lastName: e.student.user.lastName,
          otherNames: e.student.user.otherNames || undefined,
        }));
      setStudents(flattened);

      const dateStr = format(selectedDate!, "yyyy-MM-dd");
      const attRes = await api.get(`/attendance?classId=${selectedClassId}&date=${dateStr}`);

      const data = attRes.data;
      setIsEditable(data.editable ?? true);
      toast.success("Data loaded", {
      description: `Attendance records for ${flattened.length} students loaded`,
      });
      const initial: Record<number, AttendanceRecord> = {};
      flattened.forEach((s) => {
        const ex = data.attendance?.find((r: any) => r.studentId === s.studentId);
        initial[s.studentId] = {
          studentId: s.studentId,
          status: (ex?.status as "present" | "absent" | "late") ?? "present",
          notes: ex?.notes ?? "",
        };
      });
      setAttendance(initial);
    } catch (err: any) {
      toast.error("Error", {
      description: `Failed to load students or attendance records for the selected class and date`,
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const markSaving = (studentId: number, saving: boolean) => {
    setSavingStudents((prev) => {
      const next = new Set(prev);
      if (saving) next.add(studentId);
      else next.delete(studentId);
      return next;
    });
  };

  const saveSingleStudent = async (
  studentId: number,
  record: AttendanceRecord
) => {
  if (!record) return;

  markSaving(studentId, true);

  try {
    const dateStr = format(selectedDate!, "yyyy-MM-dd");

    await api.post("/attendance/mark", {
      classId: Number(selectedClassId),
      date: dateStr,
      records: [
        {
          studentId,
          status: record.status,
          notes: record.notes || null,
        },
      ],
    });

    toast.success("Attendance saved", {
      description: `${
        students.find((s) => s.studentId === studentId)?.firstName ??
        "student"
      } saved successfully`,
    });
  } catch (err) {
    toast.error("Could not save student");
    console.error(err);
  } finally {
    markSaving(studentId, false);
  }
};

  const scheduleSave = (studentId: number, record: AttendanceRecord) => {
  if (saveTimeouts.current[studentId]) {
    clearTimeout(saveTimeouts.current[studentId]);
  }

  saveTimeouts.current[studentId] = setTimeout(() => {
    saveSingleStudent(studentId, record);
    delete saveTimeouts.current[studentId];
  }, 800);
};

  const handleStatusChange = (
  studentId: number,
  newStatus: "present" | "absent" | "late"
) => {
  if (!isEditable) return;

  const current = attendance[studentId];
  if (!current || current.status === newStatus) return;

  const updated = { ...current, status: newStatus };

  // 1️⃣ update state first
  setAttendance((prev) => ({
    ...prev,
    [studentId]: updated,
  }));

  // 2️⃣ schedule save using updated value
  scheduleSave(studentId, updated);
};

 const handleNotesChange = (studentId: number, notes: string) => {
  if (!isEditable) return;

  const current = attendance[studentId];
  if (!current || current.notes === notes) return;

  const updated = { ...current, notes };

  setAttendance((prev) => ({
    ...prev,
    [studentId]: updated,
  }));

  scheduleSave(studentId, updated);
};

  const handleBulkMark = (status: "present" | "absent" | "late") => {
    if (!isEditable) return;

    let changed = false;

    setAttendance((prev) => {
      const next = { ...prev };
      students.forEach((s) => {
        const current = next[s.studentId];
        if (current && current.status !== status) {
          next[s.studentId] = { ...current, status };
          changed = true;
          scheduleSave(s.studentId);
        }
      });
      return next;
    });

    if (changed) {
      toast.success(`All students marked as ${status}`);
    }
  };

  const handleSaveAllNow = async () => {
    if (!selectedClassId || !selectedDate) {
      toast.error("Please select class and date first");
      return;
    }

    Object.keys(saveTimeouts.current).forEach((key) => {
      clearTimeout(saveTimeouts.current[Number(key)]);
      delete saveTimeouts.current[Number(key)];
    });

    const promises = students.map((s) => saveSingleStudent(s.studentId));
    await Promise.allSettled(promises);

    toast.success("All attendance records saved");
  };

  const isSaving = savingStudents.size > 0;

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      <div className="space-y-8 px-4 py-8 md:px-8 lg:px-12">

        {isSaving && (
          <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 border border-gray-200 dark:border-gray-700">
            <Loader2 className="h-4 w-4 animate-spin text-[#1F6F43]" />
            <span className="text-sm font-medium">Saving changes…</span>
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
              Mark Attendance
            </h1>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Select Class & Date</CardTitle>
            <CardDescription>Choose the class and date to mark attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>Class</Label>
                {loadingClasses ? (
                  <p className="text-sm text-muted-foreground py-2">Loading classes…</p>
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
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleBulkMark("present")}
                  disabled={!isEditable || !selectedClassId || loadingStudents || isSaving}
                >
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkMark("absent")}
                  disabled={!isEditable || !selectedClassId || loadingStudents || isSaving}
                >
                  Mark All Absent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Content */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>
              {selectedClassId
                ? `Students in ${classes.find((c) => c.classId === Number(selectedClassId))?.className || ""}`
                : "Select class and date to begin"}
            </CardTitle>
            <CardDescription>
              {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "—"}
              {!isEditable && <span className="ml-2 text-amber-600 font-medium">(Not editable)</span>}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loadingStudents ? (
              <div className="py-12 text-center text-muted-foreground">Loading students…</div>
            ) : !selectedClassId || !selectedDate ? (
              <div className="py-12 text-center text-muted-foreground">
                Please select class and date above
              </div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No students found</div>
            ) : (
              <div className="rounded-md border">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground w-5/12">
                          Student Name
                        </th>
                        <th className="px-6 py-3 text-center w-2/12">Present</th>
                        <th className="px-6 py-3 text-center w-2/12">Absent</th>
                        <th className="px-6 py-3 text-center w-2/12">Late</th>
                        <th className="px-6 py-3 text-left w-3/12">Notes</th>
                        <th className="px-6 py-3 text-center w-1/12">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((student) => {
                        const record = attendance[student.studentId] ?? {
                          status: "present",
                          notes: "",
                        };
                        const isSavingThis = savingStudents.has(student.studentId);

                        return (
                          <tr key={student.studentId} className="hover:bg-muted/30">
                            <td className="px-6 py-4 font-medium">
                              {student.firstName} {student.lastName}
                              {student.otherNames && ` (${student.otherNames})`}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Checkbox
                                checked={record.status === "present"}
                                onCheckedChange={() => handleStatusChange(student.studentId, "present")}
                                disabled={!isEditable || isSavingThis}
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Checkbox
                                checked={record.status === "absent"}
                                onCheckedChange={() => handleStatusChange(student.studentId, "absent")}
                                disabled={!isEditable || isSavingThis}
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Checkbox
                                checked={record.status === "late"}
                                onCheckedChange={() => handleStatusChange(student.studentId, "late")}
                                disabled={!isEditable || isSavingThis}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <Textarea
                                value={record.notes}
                                onChange={(e) => handleNotesChange(student.studentId, e.target.value)}
                                disabled={!isEditable || isSavingThis}
                                placeholder="Optional notes…"
                                className="min-h-[60px] resize-none"
                              />
                            </td>
                            <td className="px-6 py-4 text-center text-xs">
                              {isSavingThis ? (
                                <span className="text-blue-600 flex items-center justify-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" /> saving
                                </span>
                              ) : (
                                <span className="text-green-600">saved</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 p-1">
                  {students.map((student) => {
                    const record = attendance[student.studentId] ?? {
                      status: "present",
                      notes: "",
                    };
                    const isSavingThis = savingStudents.has(student.studentId);

                    return (
                      <Card key={student.studentId} className="overflow-hidden border">
                        <CardContent className="p-5">
                          <div className="font-medium text-base mb-4">
                            {student.firstName} {student.lastName}
                            {student.otherNames && <span className="text-sm text-muted-foreground"> ({student.otherNames})</span>}
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-5">
                            <Button
                              variant={record.status === "present" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStatusChange(student.studentId, "present")}
                              disabled={!isEditable || isSavingThis}
                              className={cn(
                                record.status === "present" && "bg-green-600 hover:bg-green-700 text-white"
                              )}
                            >
                              Present
                            </Button>

                            <Button
                              variant={record.status === "absent" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStatusChange(student.studentId, "absent")}
                              disabled={!isEditable || isSavingThis}
                              className={cn(
                                record.status === "absent" && "bg-red-600 hover:bg-red-700 text-white"
                              )}
                            >
                              Absent
                            </Button>

                            <Button
                              variant={record.status === "late" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStatusChange(student.studentId, "late")}
                              disabled={!isEditable || isSavingThis}
                              className={cn(
                                record.status === "late" && "bg-amber-600 hover:bg-amber-700 text-white"
                              )}
                            >
                              Late
                            </Button>
                          </div>

                          <div className="mb-4">
                            <Label className="text-sm mb-1 block">Notes</Label>
                            <Textarea
                              value={record.notes}
                              onChange={(e) => handleNotesChange(student.studentId, e.target.value)}
                              disabled={!isEditable || isSavingThis}
                              placeholder="Optional notes..."
                              className="min-h-[80px] resize-none"
                            />
                          </div>

                          <div className="text-right text-xs mt-2">
                            {isSavingThis ? (
                              <span className="text-blue-600 flex items-center justify-end gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" /> saving…
                              </span>
                            ) : (
                              <span className="text-green-600">saved</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedClassId && students.length > 0 && (
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={handleSaveAllNow}
                  disabled={isSaving || loadingStudents || !isEditable}
                  className="bg-[#1F6F43] hover:bg-[#1F6F43]/90 px-8"
                  size="lg"
                >
                  {isSaving ? "Saving…" : "Save All Now"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}