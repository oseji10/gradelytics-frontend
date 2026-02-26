"use client";

import React, { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
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

// Raw enrollment shape (from /classes/school/:classId/students)
interface RawClassEnrollment {
  id: number;
  studentId: number;
  classId: number;
  schoolId: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  student: {
    studentId: number;
    schoolId: number;
    userId: number;
    admissionNumber: string | null;
    schoolAssignedAdmissionNumber: string | null;
    bloodGroup: string;
    gender: string;
    dateOfBirth: string;
    parentId: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      otherNames: string | null;
      email: string | null;
      phoneNumber: string | null;
      alternatePhoneNumber: string | null;
    };
  };
}

// Flattened student for UI
interface Student {
  studentId: number;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
}

// New attendance response shape
interface AttendanceResponse {
  editable: boolean;
  attendance: {
    attendanceId: number;
    classId: number;
    studentId: number;
    teacherId: number;
    schoolId: number;
    attendanceDate: string;
    termId: number;
    academicYearId: number;
    attendanceStatus: number;
    status: "present" | "absent" | "late";
    notes: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }[];
}

interface AttendanceRecord {
  studentId: number;
  status: "present" | "absent" | "late";
  notes?: string;
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedDate) {
      fetchStudentsAndAttendance();
    }
  }, [selectedClassId, selectedDate]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await api.get("/classes/school");
      setClasses(res.data || []);
    } catch (err) {
      toast.error("Failed to load classes");
      console.error("Classes fetch error:", err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudentsAndAttendance = async () => {
    if (!selectedClassId) return;

    setLoadingStudents(true);
    try {
      // 1. Fetch enrolled students
      const enrollRes = await api.get(`/classes/school/${selectedClassId}/students`);
      const rawEnrollments: RawClassEnrollment[] = enrollRes.data || [];

      // Flatten students
      const flattenedStudents: Student[] = rawEnrollments
        .filter((enroll) => enroll.student?.user)
        .map((enroll) => ({
          studentId: enroll.student.studentId,
          firstName: enroll.student.user.firstName,
          lastName: enroll.student.user.lastName,
          otherNames: enroll.student.user.otherNames || undefined,
        }));

      setStudents(flattenedStudents);

      // 2. Fetch attendance
      const dateStr = format(selectedDate!, "yyyy-MM-dd");
      const attendanceRes = await api.get(
        `/attendance?classId=${selectedClassId}&date=${dateStr}`
      ) as { data: AttendanceResponse };

      const responseData = attendanceRes.data;

      setIsEditable(responseData.editable ?? true);

      // Build attendance state
      const initialAttendance: Record<number, AttendanceRecord> = {};
      flattenedStudents.forEach((student) => {
        const existing = responseData.attendance?.find(
          (r) => r.studentId === student.studentId
        );
        initialAttendance[student.studentId] = {
          studentId: student.studentId,
          status: (existing?.status as "present" | "absent" | "late") || "present",
          notes: existing?.notes || "",
        };
      });

      setAttendance(initialAttendance);
    } catch (err: any) {
      toast.error("Failed to load students or attendance");
      console.error("Fetch error:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleBulkMark = (status: "present" | "absent" | "late") => {
    if (!isEditable) return;
    setAttendance((prev) => {
      const updated = { ...prev };
      students.forEach((s) => {
        updated[s.studentId] = {
          ...updated[s.studentId],
          status,
        };
      });
      return updated;
    });
  };

  const handleStatusChange = (studentId: number, status: "present" | "absent" | "late") => {
    if (!isEditable) return;
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleNotesChange = (studentId: number, notes: string) => {
    if (!isEditable) return;
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedDate || students.length === 0) {
      toast.error("Please select class and date");
      return;
    }

    if (!isEditable) {
      toast.info("This attendance is no longer editable");
      return;
    }

    setSaving(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const records = Object.values(attendance).map((r) => ({
        studentId: r.studentId,
        status: r.status,
        notes: r.notes || null,
      }));

      await api.post("/attendance/mark", {
        classId: Number(selectedClassId),
        date: dateStr,
        records,
      });

      toast.success(`Attendance saved for ${format(selectedDate, "PPP")}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save attendance");
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      <div className="space-y-8 px-4 py-8 md:px-8 lg:px-12">
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
            <CardDescription>
              Choose the class and date to mark attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Class */}
              <div>
                <Label>Class</Label>
                {loadingClasses ? (
                  <p className="text-sm text-muted-foreground py-2">Loading classes...</p>
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

              {/* Date */}
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

              {/* Bulk Actions */}
              <div className="flex items-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleBulkMark("present")}
                  disabled={!isEditable || !selectedClassId || loadingStudents}
                >
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkMark("absent")}
                  disabled={!isEditable || !selectedClassId || loadingStudents}
                >
                  Mark All Absent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>
              {selectedClassId
                ? `Students in Class ${classes.find((c) => c.classId === Number(selectedClassId))?.className || ""}`
                : "Select a class to begin"}
            </CardTitle>
            <CardDescription>
              {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "—"}
              {!isEditable && (
                <span className="ml-2 text-sm text-amber-600 font-medium">
                  (This attendance is no longer editable)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="py-12 text-center text-muted-foreground">Loading students...</div>
            ) : !selectedClassId ? (
              <div className="py-12 text-center text-muted-foreground">
                Please select a class and date above
              </div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No students found in this class
              </div>
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
                        <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground w-2/12">
                          Present
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground w-2/12">
                          Absent
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground w-2/12">
                          Late
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground w-3/12">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((student) => {
                        const record = attendance[student.studentId] || {
                          status: "present",
                          notes: "",
                        };
                        return (
                          <tr key={student.studentId} className="hover:bg-muted/30">
                            <td className="px-6 py-4 font-medium">
                              {student.firstName} {student.lastName}
                              {student.otherNames && ` (${student.otherNames})`}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Checkbox
                                checked={record.status === "present"}
                                onCheckedChange={() =>
                                  handleStatusChange(student.studentId, "present")
                                }
                                disabled={!isEditable}
                                className="mx-auto"
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Checkbox
                                checked={record.status === "absent"}
                                onCheckedChange={() =>
                                  handleStatusChange(student.studentId, "absent")
                                }
                                disabled={!isEditable}
                                className="mx-auto"
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Checkbox
                                checked={record.status === "late"}
                                onCheckedChange={() =>
                                  handleStatusChange(student.studentId, "late")
                                }
                                disabled={!isEditable}
                                className="mx-auto"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <Textarea
                                value={record.notes || ""}
                                onChange={(e) =>
                                  handleNotesChange(student.studentId, e.target.value)
                                }
                                disabled={!isEditable}
                                placeholder="Optional notes..."
                                className="min-h-[60px] resize-none"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {students.map((student) => {
                    const record = attendance[student.studentId] || {
                      status: "present",
                      notes: "",
                    };
                    return (
                      <Card key={student.studentId} className="overflow-hidden">
                        <CardContent className="p-5">
                          <div className="font-medium mb-3">
                            {student.firstName} {student.lastName}
                            {student.otherNames && ` (${student.otherNames})`}
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <Button
                              variant={record.status === "present" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStatusChange(student.studentId, "present")}
                              disabled={!isEditable}
                              className={cn(
                                record.status === "present" &&
                                  "bg-green-600 hover:bg-green-700 text-white"
                              )}
                            >
                              Present
                            </Button>
                            <Button
                              variant={record.status === "absent" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStatusChange(student.studentId, "absent")}
                              disabled={!isEditable}
                              className={cn(
                                record.status === "absent" &&
                                  "bg-red-600 hover:bg-red-700 text-white"
                              )}
                            >
                              Absent
                            </Button>
                            <Button
                              variant={record.status === "late" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStatusChange(student.studentId, "late")}
                              disabled={!isEditable}
                              className={cn(
                                record.status === "late" &&
                                  "bg-amber-600 hover:bg-amber-700 text-white"
                              )}
                            >
                              Late
                            </Button>
                          </div>

                          <Textarea
                            value={record.notes || ""}
                            onChange={(e) =>
                              handleNotesChange(student.studentId, e.target.value)
                            }
                            disabled={!isEditable}
                            placeholder="Add notes (optional)..."
                            className="min-h-[80px]"
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save Button */}
            {selectedClassId && students.length > 0 && (
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={handleSaveAttendance}
                  disabled={saving || loadingStudents || !isEditable}
                  className="bg-[#1F6F43] hover:bg-[#1F6F43]/90 px-8"
                  size="lg"
                >
                  {saving ? "Saving..." : isEditable ? "Save Attendance" : "Not Editable"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}