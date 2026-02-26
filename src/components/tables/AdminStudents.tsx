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

/* ---------------- types ---------------- */

interface SchoolClass {
  classId: number;
  className: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  pivot?: { studentId: number; classId: number; schoolId: number };
}

interface ParentUser {
  id: number;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string | null;
  phoneNumber: string | null;
}

interface Parent {
  parentId: number;
  user: ParentUser;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string | null;
  phoneNumber: string | null;
  alternatePhoneNumber: string | null;
}

interface Student {
  studentId: number;
  schoolId: number;
  userId: number;
  dateOfBirth: string;
  gender: "male" | "female" | null;
  bloodGroup: string | null;
  parentId: number | null;          // single parentId (for legacy/primary)
  parents: Parent[];                // ← array from backend
  classes: SchoolClass[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user: User;
}

/* ---------------- component ---------------- */

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(true);
  const [parentsLoading, setParentsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    otherNames: "",
    email: "",
    phoneNumber: "",
    alternatePhoneNumber: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    classId: "",
    parentId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const loadingId = toast.loading("Loading data...");

      try {
        setLoading(true);
        setClassesLoading(true);
        setParentsLoading(true);

        const [classesRes, parentsRes, studentsRes] = await Promise.all([
          api.get("/classes/school"),
          api.get("/school/parents"),
          api.get("/school/students"),
        ]);

        setClasses(classesRes.data || []);
        setParents(parentsRes.data || []);

        const sorted = (studentsRes.data || []).slice().sort(
          (a: Student, b: Student) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setStudents(sorted);

        toast.success("Data loaded", {
          description: `Found ${sorted.length} students, ${classesRes.data?.length || 0} classes, ${parentsRes.data?.length || 0} parents`,
          id: loadingId,
        });
      } catch (err: any) {
        toast.error("Failed to load data", {
          description: err?.response?.data?.message || "Connection issue",
          id: loadingId,
        });
      } finally {
        setLoading(false);
        setClassesLoading(false);
        setParentsLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (mode: "add" | "edit", student?: Student) => {
    setModalMode(mode);
    setCurrentStudent(student || null);
    setFormData({
      firstName: student?.user.firstName || "",
      lastName: student?.user.lastName || "",
      otherNames: student?.user.otherNames || "",
      email: student?.user.email || "",
      phoneNumber: student?.user.phoneNumber || "",
      alternatePhoneNumber: student?.user.alternatePhoneNumber || "",
      dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
      gender: student?.gender || "",
      bloodGroup: student?.bloodGroup || "",
      classId: student?.classes?.[0]?.classId?.toString() || "",
      parentId: student?.parents?.[0]?.parentId?.toString() || "",
    });
    setModalOpen(true);
  };

  const openView = (student: Student) => {
    setSelectedStudent(student);
    setViewOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.dateOfBirth) {
      toast.error("Required fields missing");
      return;
    }

    const loadingId = toast.loading(
      modalMode === "add" ? "Adding new student..." : "Updating student..."
    );

    setIsSubmitting(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        otherNames: formData.otherNames.trim() || null,
        email: formData.email.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
        alternatePhoneNumber: formData.alternatePhoneNumber.trim() || null,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender || null,
        bloodGroup: formData.bloodGroup.trim() || null,
        classId: formData.classId ? Number(formData.classId) : null,
        parentId:
          formData.parentId && formData.parentId !== "none"
            ? Number(formData.parentId)
            : null,
      };

      let updatedStudents: Student[];

      if (modalMode === "add") {
        const res = await api.post("/school/students", payload);
        const created = res.data;
        updatedStudents = [created, ...students];
      } else if (currentStudent) {
        const res = await api.patch(`/school/students/${currentStudent.studentId}`, payload);
        const updated = res.data.student || res.data;
        updatedStudents = students.map((s) =>
          s.studentId === currentStudent.studentId ? updated : s
        );
      } else {
        throw new Error("No student selected");
      }

      setStudents(updatedStudents);
      setModalOpen(false);
      setCurrentStudent(null);

      toast.success(modalMode === "add" ? "Student added" : "Student updated", {
        description: `${formData.firstName} ${formData.lastName} saved successfully`,
        id: loadingId,
      });
    } catch (err: any) {
      toast.error("Operation failed", {
        description: err?.response?.data?.message || "Could not save student",
        id: loadingId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    const student = students.find((s) => s.studentId === studentId);
    const studentName = student ? `${student.user.firstName} ${student.user.lastName}` : "this student";

    const loadingId = toast.loading(`Deleting ${studentName}...`);

    setDeleteLoadingId(studentId);

    try {
      await api.delete(`/school/students/${studentId}`);
      setStudents((prev) => prev.filter((s) => s.studentId !== studentId));

      toast.success("Student deleted", {
        description: `${studentName} has been permanently removed`,
        id: loadingId,
      });
    } catch (err: any) {
      toast.error("Delete failed", {
        description: err?.response?.data?.message || "Could not delete student",
        id: loadingId,
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const fullName = (s: Student) =>
    `${s.user.firstName} ${s.user.lastName}${s.user.otherNames ? ` ${s.user.otherNames}` : ""}`;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getPrimaryClassName = (student: Student) =>
    student.classes?.[0]?.className || "—";

  const getParentName = (student: Student) => {
    if (!student.parents || student.parents.length === 0) return "Not assigned";
    const p = student.parents[0];
    return `${p.user.firstName} ${p.user.lastName}${p.user.otherNames ? ` ${p.user.otherNames}` : ""}`;
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
              Students
            </h1>
          </div>

          <Button
            className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
            onClick={() => openModal("add")}
            disabled={classesLoading || parentsLoading || classes.length === 0}
          >
            + Add New Student
          </Button>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <p className="py-12 text-center text-muted-foreground">Loading students…</p>
          ) : students.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No students found</p>
          ) : (
            students.map((s) => (
              <div
                key={s.studentId}
                className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all cursor-pointer dark:border-border/60"
                onClick={() => openView(s)}
              >
                <div className="flex flex-col gap-2">
                  <p className="font-semibold text-lg text-foreground">{fullName(s)}</p>
                  <p className="text-sm text-muted-foreground">
                    Class: {getPrimaryClassName(s)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Parent: {getParentName(s)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    DOB: {formatDate(s.dateOfBirth)}
                  </p>
                  <div className="flex gap-2 self-end mt-2">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openModal("edit", s); }}>
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteLoadingId === s.studentId}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deleteLoadingId === s.studentId ? "Deleting..." : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{fullName(s)}</strong>?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteStudent(s.studentId)}
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
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-4/12">Name</th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">Class</th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-3/12">Parent</th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">DOB</th>
                <th className="h-14 px-6 text-right font-semibold text-muted-foreground w-3/12">Actions</th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                    Loading students…
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s) => (
                  <TableRow
                    key={s.studentId}
                    className="hover:bg-muted/40 transition-colors cursor-pointer border-b last:border-b-0"
                    onClick={() => openView(s)}
                  >
                    <TableCell className="px-6 py-4 font-medium text-foreground">{fullName(s)}</TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">{getPrimaryClassName(s)}</TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">{getParentName(s)}</TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">{formatDate(s.dateOfBirth)}</TableCell>
                    <TableCell className="px-6 py-4 text-right space-x-3">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openView(s); }}>
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openModal("edit", s); }}>
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteLoadingId === s.studentId}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {deleteLoadingId === s.studentId ? "Deleting..." : "Delete"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{fullName(s)}</strong>?<br />
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStudent(s.studentId)}
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

        {/* Add/Edit Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{modalMode === "add" ? "Add New Student" : "Edit Student"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveStudent} className="space-y-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                </div>
                <div>
                  <Label>Other Names</Label>
                  <Input value={formData.otherNames} onChange={(e) => setFormData({ ...formData, otherNames: e.target.value })} />
                </div>
                <div>
                  <Label>Date of Birth *</Label>
                  <Input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} required />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Blood Group</Label>
                  <Input value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })} placeholder="e.g. A+, O-, AB-" />
                </div>
                <div>
                  <Label>Class</Label>
                  {classesLoading ? (
                    <p className="text-sm text-muted-foreground py-2">Loading classes...</p>
                  ) : classes.length === 0 ? (
                    <p className="text-sm text-destructive py-2">No classes available</p>
                  ) : (
                    <Select value={formData.classId} onValueChange={(val) => setFormData({ ...formData, classId: val })}>
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
                  <Label>Parent / Guardian (optional)</Label>
                  {parentsLoading ? (
                    <p className="text-sm text-muted-foreground py-2">Loading parents...</p>
                  ) : parents.length === 0 ? (
                    <p className="text-sm text-destructive py-2">No parents available</p>
                  ) : (
                    <Select
                      value={formData.parentId}
                      onValueChange={(val) => setFormData({ ...formData, parentId: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No parent assigned</SelectItem>
                        {parents.map((p) => (
                          <SelectItem key={p.parentId} value={p.parentId.toString()}>
                            {`${p.user.firstName} ${p.user.lastName}`}
                            {p.user.email && ` (${p.user.email})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>Email (optional)</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <Label>Phone Number (optional)</Label>
                  <Input value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || classesLoading || parentsLoading}>
                  {isSubmitting ? "Saving..." : modalMode === "add" ? "Add Student" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Modal */}
<Dialog open={viewOpen} onOpenChange={setViewOpen}>
  <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Student Details – {fullName(selectedStudent || {} as Student)}</DialogTitle>
    </DialogHeader>

    {selectedStudent && (
      <div className="py-6 space-y-10">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm text-muted-foreground mb-1">Full Name</h4>
            <p className="text-lg font-semibold">{fullName(selectedStudent)}</p>
          </div>
          <div>
            <h4 className="text-sm text-muted-foreground mb-1">Class</h4>
            <p className="text-lg font-medium">{getPrimaryClassName(selectedStudent)}</p>
          </div>
          <div>
            <h4 className="text-sm text-muted-foreground mb-1">Date of Birth</h4>
            <p className="text-lg">{formatDate(selectedStudent.dateOfBirth)}</p>
          </div>
          <div>
            <h4 className="text-sm text-muted-foreground mb-1">Gender</h4>
            <p className="text-lg capitalize">{selectedStudent.gender || "—"}</p>
          </div>
          <div>
            <h4 className="text-sm text-muted-foreground mb-1">Blood Group</h4>
            <p className="text-lg">{selectedStudent.bloodGroup || "—"}</p>
          </div>
          <div>
            <h4 className="text-sm text-muted-foreground mb-1">Student Email</h4>
            <p className="text-lg">{selectedStudent.user.email || "—"}</p>
          </div>
        </div>

        {/* Parent / Guardian Info */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold mb-4">Parent / Guardian Contact Details</h3>
          
          {selectedStudent.parents && selectedStudent.parents.length > 0 ? (
            selectedStudent.parents.map((parent, index) => (
              <div key={parent.parentId} className="mb-6 last:mb-0">
                <p className="font-medium mb-2">
                  {index === 0 ? "Primary Guardian" : `Guardian ${index + 1}`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Name</span>
                    <span>
                      {parent.user.firstName} {parent.user.lastName}
                      {parent.user.otherNames && ` (${parent.user.otherNames})`}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Phone</span>
                    <span>{parent.user.phoneNumber || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Alternate Phone</span>
                    <span>{parent.user.alternatePhoneNumber || "—"}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-muted-foreground block">Email</span>
                    <span>{parent.user.email || "—"}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground italic">No parent/guardian assigned yet.</p>
          )}
        </div>

        {/* Medical Notes – Placeholder */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold mb-4">Medical Notes</h3>
          <div className="bg-muted/40 rounded-md p-4 text-sm">
            {false ? ( // Replace false with real condition when you have data
              <p>Allergies: None reported<br />Chronic conditions: —<br />Medications: —</p>
            ) : (
              <p className="text-muted-foreground italic">
                No medical notes recorded yet.<br />
                <span className="text-xs">(This section will display allergies, chronic conditions, current medications, emergency contacts, etc. when implemented)</span>
              </p>
            )}
          </div>
        </div>

        {/* Attendance Summary – Placeholder */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold mb-4">Attendance Summary (Current Term)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
              <p className="text-2xl font-bold text-green-600">92%</p>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg">
              <p className="text-2xl font-bold text-red-600">8%</p>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">3 days</p>
              <p className="text-sm text-muted-foreground">Late arrivals</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">145/158</p>
              <p className="text-sm text-muted-foreground">Days attended</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic text-center">
            Last updated: February 20, 2026 • Full attendance history coming soon...
          </p>
        </div>
      </div>
    )}

    <DialogFooter>
      <Button variant="outline" onClick={() => setViewOpen(false)}>
        Close
      </Button>
      {/* Optional: future Edit / Print buttons */}
      {/* <Button>Edit Details</Button> */}
    </DialogFooter>
  </DialogContent>
</Dialog>
      </div>
    </div>
  );
}