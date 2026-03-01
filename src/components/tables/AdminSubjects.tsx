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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronLeftIcon } from "@/icons";
import { toast } from "@/components/ui/use-toast";
import api from "../../../lib/api";
import Icon from "@/components/Icons";

/* ---------------- types ---------------- */

interface School {
  schoolId: number;
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolLogo: string | null;
  schoolAddress: string | null;
  addedBy: string | null;
  isDefault: number;
  status: string;
  currentPlan: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

interface UserBasic {
  id: number;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string;
  phoneNumber: string | null;
  alternatePhoneNumber: string | null;
  role: number | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

interface TeacherBasic {
  teacherId: number;
  schoolId: number;
  userId: number;
  qualification: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user: UserBasic;
}

interface ClassBasic {
  classId: number;
  className: string;
}

interface Subject {
  subjectId: number;
  schoolId: number;
  subjectName: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  teachers: TeacherBasic[];
  school: School;
  assignedClass?: ClassBasic | null;
}

/* ---------------- component ---------------- */

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<TeacherBasic[]>([]);
  const [classes, setClasses] = useState<ClassBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [subjectNameInput, setSubjectNameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View modal
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Assign Teachers modal
  const [assignTeachersOpen, setAssignTeachersOpen] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  const [assignTeachersLoading, setAssignTeachersLoading] = useState(false);

  // Assign Class modal (single select)
  const [assignClassOpen, setAssignClassOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [assignClassLoading, setAssignClassLoading] = useState(false);

  // Delete state
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [subjectsRes, teachersRes, classesRes] = await Promise.all([
          api.get("/school/subjects"),
          api.get("/school/teachers"),
          api.get("/classes/school"),
        ]);

        const normalizedSubjects: Subject[] = (subjectsRes.data || []).map(
          (raw: any) => {
            // Extract first class from subject_teachers (if any)
            let assignedClass: ClassBasic | null = null;
            if (raw.subject_teachers?.length > 0) {
              const firstWithClass = raw.subject_teachers.find(
                (st: any) => st.class && st.class.classId
              );
              if (firstWithClass?.class) {
                assignedClass = {
                  classId: firstWithClass.class.classId,
                  className: firstWithClass.class.className,
                };
              }
            }

            return {
              ...raw,
              teachers: raw.teachers || [],
              assignedClass,
            };
          }
        );

        const sortedSubjects = normalizedSubjects.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setSubjects(sortedSubjects);
        setTeachers(teachersRes.data || []);
        setClasses(classesRes.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (mode: "add" | "edit", subj?: Subject) => {
    setModalMode(mode);
    setCurrentSubject(subj || null);
    setSubjectNameInput(subj ? subj.subjectName : "");
    setModalOpen(true);
    setError("");
  };

  const openView = (subj: Subject) => {
    setSelectedSubject(subj);
    setViewOpen(true);
  };

  const openAssignTeachers = (subj: Subject) => {
    setSelectedSubject(subj);
    const currentIds = subj.teachers.map((t) => t.teacherId);
    setSelectedTeacherIds(currentIds);
    setAssignTeachersOpen(true);
  };

  const openAssignClass = (subj: Subject) => {
    setSelectedSubject(subj);
    setSelectedClassId(subj.assignedClass?.classId?.toString() || "");
    setAssignClassOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectNameInput.trim()) return;

    const loadingId = toast.loading(
      modalMode === "add" ? "Creating subject..." : "Updating subject..."
    );

    setIsSubmitting(true);
    setError("");

    try {
      let updatedSubjects: Subject[];

      const payload = { subjectName: subjectNameInput.trim() };

      if (modalMode === "add") {
        const res = await api.post("/school/subjects", payload);
        const created: Subject = {
          ...res.data,
          teachers: [],
          assignedClass: null,
        };
        updatedSubjects = [created, ...subjects];

        toast.success("Subject created", { id: loadingId });
      } else if (currentSubject) {
        const res = await api.patch(
          `/school/subjects/${currentSubject.subjectId}`,
          payload
        );
        const updatedRaw = res.data.subject || res.data;
        const updated: Subject = {
          ...updatedRaw,
          teachers: currentSubject.teachers,
          assignedClass: currentSubject.assignedClass,
        };
        updatedSubjects = subjects.map((s) =>
          s.subjectId === currentSubject.subjectId ? updated : s
        );

        toast.success("Subject updated", { id: loadingId });
      } else {
        throw new Error("No subject selected");
      }

      setSubjects(updatedSubjects);
      setModalOpen(false);
      setSubjectNameInput("");
      setCurrentSubject(null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          `Failed to ${modalMode === "add" ? "add" : "update"} subject`
      );
      toast.error("Operation failed", { id: loadingId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    const subject = subjects.find((s) => s.subjectId === subjectId);
    const subjectName = subject?.subjectName || "this subject";

    const loadingId = toast.loading(`Deleting "${subjectName}"...`);

    setDeleteLoadingId(subjectId);
    setError("");

    try {
      await api.delete(`/school/subjects/${subjectId}`);
      setSubjects((prev) => prev.filter((s) => s.subjectId !== subjectId));

      toast.success("Subject deleted", { id: loadingId });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete subject");
      toast.error("Delete failed", { id: loadingId });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleAssignTeachers = async () => {
    if (!selectedSubject) return;

    const count = selectedTeacherIds.length;
    const subjectName = selectedSubject.subjectName;

    const loadingId = toast.loading(
      count === 0 ? "Unassigning all teachers..." : "Assigning teachers..."
    );

    setAssignTeachersLoading(true);
    setError("");

    try {
      let updatedAssigned: TeacherBasic[] = [];

      if (count === 0) {
        await api.delete(`/school/subjects/${selectedSubject.subjectId}/assign-teachers`);
        updatedAssigned = [];

        toast.success("Teachers unassigned", {
          description: `All teachers have been removed from "${subjectName}".`,
          id: loadingId,
        });
      } else {
        await api.patch(`/school/subjects/${selectedSubject.subjectId}/assign-teachers`, {
          teacherIds: selectedTeacherIds,
        });

        updatedAssigned = teachers
          .filter((t) => selectedTeacherIds.includes(t.teacherId))
          .map((t) => ({ teacherId: t.teacherId, user: t.user }));

        toast.success("Teachers assigned", {
          description: `${count} teacher${count === 1 ? "" : "s"} assigned to "${subjectName}".`,
          id: loadingId,
        });
      }

      setSubjects((prev) =>
        prev.map((s) =>
          s.subjectId === selectedSubject.subjectId
            ? { ...s, teachers: updatedAssigned }
            : s
        )
      );

      setAssignTeachersOpen(false);
      setSelectedTeacherIds([]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to update teacher assignments";
      setError(msg);
      toast.error("Action failed", {
        description: msg,
        id: loadingId,
      });
    } finally {
      setAssignTeachersLoading(false);
    }
  };

  const handleAssignClass = async () => {
    if (!selectedSubject) return;

    const loadingId = toast.loading("Updating class assignment...");

    setAssignClassLoading(true);
    setError("");

    try {
      let updatedClass: ClassBasic | null = null;

      if (!selectedClassId || selectedClassId === "null") {
        await api.delete(`/school/subjects/${selectedSubject.subjectId}/assign-class`);
        updatedClass = null;
      } else {
        await api.patch(`/school/subjects/${selectedSubject.subjectId}/assign-class`, {
          classId: Number(selectedClassId),
        });

        const chosenClass = classes.find((c) => c.classId === Number(selectedClassId));
        updatedClass = chosenClass ? { classId: chosenClass.classId, className: chosenClass.className } : null;
      }

      setSubjects((prev) =>
        prev.map((s) =>
          s.subjectId === selectedSubject.subjectId
            ? { ...s, assignedClass: updatedClass }
            : s
        )
      );

      setAssignClassOpen(false);
      setSelectedClassId("");

      toast.success("Class assignment updated", { id: loadingId });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update class assignment");
      toast.error("Action failed", { id: loadingId });
    } finally {
      setAssignClassLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const fullTeacherName = (teacher: TeacherBasic) =>
    `${teacher.user.firstName} ${teacher.user.lastName}${
      teacher.user.otherNames ? ` ${teacher.user.otherNames}` : ""
    }`;

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
              Subjects
            </h1>
          </div>

          <Button
            className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
            onClick={() => openModal("add")}
          >
            + Add New Subject
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive dark:bg-destructive/20">
            {error}
          </div>
        )}

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <p className="py-12 text-center text-muted-foreground">Loading subjects…</p>
          ) : subjects.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No subjects found</p>
          ) : (
            subjects.map((subj) => (
              <div
                key={subj.subjectId}
                className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all cursor-pointer dark:border-border/60"
                onClick={() => openView(subj)}
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="font-semibold text-lg text-foreground">{subj.subjectName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created {formatDate(subj.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2 self-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal("edit", subj);
                      }}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteLoadingId === subj.subjectId}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deleteLoadingId === subj.subjectId ? "Deleting..." : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{subj.subjectName}</strong>?
                            <br />
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSubject(subj.subjectId)}
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
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-4/12">
                  Subject Name
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-3/12">
                  Assigned Teachers
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-3/12">
                  Assigned Class
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  Created
                </th>
                <th className="h-14 px-6 text-right font-semibold text-muted-foreground w-2/12">
                  Actions
                </th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                    Loading subjects…
                  </TableCell>
                </TableRow>
              ) : subjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                    No subjects found
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((subj) => (
                  <TableRow
                    key={subj.subjectId}
                    className="hover:bg-muted/40 transition-colors cursor-pointer border-b last:border-b-0"
                    onClick={() => openView(subj)}
                  >
                    <TableCell className="px-6 py-4 font-medium text-foreground">
                      {subj.subjectName}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {subj.teachers?.length > 0
                        ? subj.teachers.map((t) => fullTeacherName(t)).join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {subj.assignedClass ? subj.assignedClass.className : "Not assigned"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {formatDate(subj.created_at)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openView(subj);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal("edit", subj);
                        }}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteLoadingId === subj.subjectId}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {deleteLoadingId === subj.subjectId ? "Deleting..." : "Delete"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{subj.subjectName}</strong>?
                              <br />
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSubject(subj.subjectId)}
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{modalMode === "add" ? "Add New Subject" : "Edit Subject"}</DialogTitle>
              <DialogDescription>
                {modalMode === "add"
                  ? "Enter the name for the new subject."
                  : "Update the subject name below."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveSubject} className="space-y-6">
              <Input
                value={subjectNameInput}
                onChange={(e) => setSubjectNameInput(e.target.value)}
                placeholder="e.g. Mathematics, English, Physics..."
                required
                disabled={isSubmitting}
                autoFocus
                className="h-11"
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !subjectNameInput.trim()}
                >
                  {isSubmitting
                    ? modalMode === "add"
                      ? "Adding..."
                      : "Updating..."
                    : modalMode === "add"
                    ? "Add Subject"
                    : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        {/* View Modal – now scrollable */}
<Dialog open={viewOpen} onOpenChange={setViewOpen}>
  <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
    <DialogHeader className="flex-shrink-0">
      <DialogTitle>Subject Details</DialogTitle>
      <DialogDescription>
        Full information about this subject, assigned teachers, and class
      </DialogDescription>
    </DialogHeader>

    <div className="flex-1 overflow-y-auto py-6 px-1 space-y-8">
      {selectedSubject && (
        <>
          {/* Subject Info */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1.5">
                Subject Name
              </h4>
              <p className="text-xl font-semibold text-foreground">
                {selectedSubject.subjectName}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1.5">
                Created On
              </h4>
              <p className="text-foreground">{formatDate(selectedSubject.created_at)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1.5">
                Last Updated
              </h4>
              <p className="text-foreground">{formatDate(selectedSubject.updated_at)}</p>
            </div>
          </div>

          {/* Assigned Teachers */}
          <div className="pt-6 border-t space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Assigned Teachers</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAssignTeachers(selectedSubject)}
              >
                {selectedSubject.teachers.length ? "Edit" : "Assign"} Teachers
              </Button>
            </div>

            {selectedSubject.teachers.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {selectedSubject.teachers.map((t) => (
                  <li key={t.teacherId}>
                    {fullTeacherName(t)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">No teachers assigned yet</p>
            )}
          </div>

          {/* Assigned Class */}
          <div className="pt-6 border-t space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Assigned Class</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAssignClass(selectedSubject)}
              >
                {selectedSubject.assignedClass ? "Change" : "Assign"} Class
              </Button>
            </div>

            {selectedSubject.assignedClass ? (
              <p className="text-sm">
                <strong>{selectedSubject.assignedClass.className}</strong>
              </p>
            ) : (
              <p className="text-muted-foreground italic">Not assigned to any class yet</p>
            )}
          </div>

          {/* School Info */}
          <div className="pt-6 border-t space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Associated School</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  School Name
                </h4>
                <p className="text-foreground">{selectedSubject.school.schoolName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                <p className="text-foreground">{selectedSubject.school.schoolEmail}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Phone</h4>
                <p className="text-foreground">
                  {selectedSubject.school.schoolPhone || "—"}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Address</h4>
                <p className="text-foreground">
                  {selectedSubject.school.schoolAddress || "Not provided"}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                <p
                  className={`font-medium ${
                    selectedSubject.school.status === "active"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {selectedSubject.school.status.charAt(0).toUpperCase() +
                    selectedSubject.school.status.slice(1)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>

    <DialogFooter className="flex-shrink-0">
      <Button variant="outline" onClick={() => setViewOpen(false)}>
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

        {/* Assign Teachers Modal */}
        <Dialog open={assignTeachersOpen} onOpenChange={setAssignTeachersOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Teachers to Subject</DialogTitle>
              <DialogDescription>
                {selectedSubject && (
                  <>Select teachers who will teach <strong>{selectedSubject.subjectName}</strong>.</>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 max-h-80 overflow-y-auto space-y-1">
              {teachers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No teachers available</p>
              ) : (
                teachers.map((t) => (
                  <div key={t.teacherId} className="flex items-center space-x-3 py-2">
                    <Checkbox
                      id={`teacher-${t.teacherId}`}
                      checked={selectedTeacherIds.includes(t.teacherId)}
                      onCheckedChange={(checked) => {
                        setSelectedTeacherIds((prev) =>
                          checked
                            ? [...prev, t.teacherId]
                            : prev.filter((id) => id !== t.teacherId)
                        );
                      }}
                    />
                    <Label
                      htmlFor={`teacher-${t.teacherId}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {fullTeacherName(t)}
                    </Label>
                  </div>
                ))
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignTeachersOpen(false)}
                disabled={assignTeachersLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignTeachers}
                disabled={assignTeachersLoading}
              >
                {assignTeachersLoading ? "Saving..." : "Save Assignments"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Class Modal (single select) */}
        <Dialog open={assignClassOpen} onOpenChange={setAssignClassOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Class to Subject</DialogTitle>
              <DialogDescription>
                {selectedSubject && (
                  <>Choose one class that will offer <strong>{selectedSubject.subjectName}</strong>.</>
                )}
                <br />
                <span className="text-xs text-muted-foreground">
                  Only one class can be assigned at a time.
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <Label>Select Class</Label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Unassign / No class</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.classId} value={c.classId.toString()}>
                      {c.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignClassOpen(false)}
                disabled={assignClassLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignClass}
                disabled={assignClassLoading}
              >
                {assignClassLoading ? "Saving..." : "Save Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}