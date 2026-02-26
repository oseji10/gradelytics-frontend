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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeftIcon } from "@/icons";
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

interface User {
  id: number;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string;
  phoneNumber: string;
}

interface TeacherBasic {
  teacherId: number;
  user: User;
  qualification?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  pivot?: { classId: number; teacherId: number };
}

interface SchoolClass {
  classId: number;
  schoolId: number;
  className: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  school: School;
  class_teachers: TeacherBasic[];   // ← matches your actual API response
}

/* ---------------- component ---------------- */

export default function AdminClasses() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<TeacherBasic[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit class modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentClass, setCurrentClass] = useState<SchoolClass | null>(null);
  const [classNameInput, setClassNameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View class modal
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);

  // Assign teachers modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Delete state
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  // Fetch classes + teachers
  useEffect(() => {
    const fetchData = async () => {
      const loadingId = toast.loading("Loading classes and teachers...");

      try {
        const [classesRes, teachersRes] = await Promise.all([
          api.get("/classes/school"),
          api.get("/school/teachers"),
        ]);

        // Normalize to ensure class_teachers is always an array
        const normalizedClasses = (classesRes.data || []).map((cls: any) => ({
          ...cls,
          class_teachers: cls.class_teachers || [],
        }));

        const sortedClasses = normalizedClasses.sort(
          (a: SchoolClass, b: SchoolClass) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setClasses(sortedClasses);
        setTeachers(teachersRes.data || []);

        toast.success("Data loaded", {
          description: `Found ${sortedClasses.length} classes and ${teachersRes.data?.length || 0} teachers`,
          id: loadingId,
        });
      } catch (err: any) {
        toast.error("Failed to load data", {
          description: err?.response?.data?.message || "Connection issue",
          id: loadingId,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (mode: "add" | "edit", cls?: SchoolClass) => {
    setModalMode(mode);
    setCurrentClass(cls || null);
    setClassNameInput(cls ? cls.className : "");
    setModalOpen(true);
  };

  const openView = (cls: SchoolClass) => {
    setSelectedClass(cls);
    setSelectedTeacherIds(cls.class_teachers.map(t => t.teacherId));
    setViewOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) return;

    const loadingId = toast.loading(
      modalMode === "add" ? "Creating class..." : "Updating class..."
    );

    setIsSubmitting(true);

    try {
      let updatedClasses: SchoolClass[];

      const payload = { className: classNameInput.trim() };

      if (modalMode === "add") {
        const res = await api.post("/classes/school", payload);
        const created = { ...res.data, class_teachers: [] };
        updatedClasses = [created, ...classes];

        toast.success("Class created", {
          description: `"${classNameInput.trim()}" has been added successfully.`,
          id: loadingId,
        });
      } else if (currentClass) {
        const res = await api.patch(`/classes/school/${currentClass.classId}`, payload);
        const updated = res.data.class || res.data;
        updatedClasses = classes.map((c) =>
          c.classId === currentClass.classId ? { ...c, ...updated } : c
        );

        toast.success("Class updated", {
          description: `Class name updated to "${classNameInput.trim()}".`,
          id: loadingId,
        });
      } else {
        throw new Error("No class selected for edit");
      }

      setClasses(updatedClasses);
      setModalOpen(false);
      setClassNameInput("");
      setCurrentClass(null);
    } catch (err: any) {
      toast.error("Operation failed", {
        description: err?.response?.data?.message || `Could not ${modalMode === "add" ? "add" : "update"} class`,
        id: loadingId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (classId: number) => {
    const cls = classes.find((c) => c.classId === classId);
    const className = cls?.className || "this class";

    const loadingId = toast.loading(`Deleting "${className}"...`);

    setDeleteLoadingId(classId);

    try {
      await api.delete(`/classes/school/${classId}`);
      setClasses((prev) => prev.filter((c) => c.classId !== classId));

      toast.success("Class deleted", {
        description: `"${className}" has been permanently removed.`,
        id: loadingId,
      });
    } catch (err: any) {
      toast.error("Delete failed", {
        description: err?.response?.data?.message || "Could not delete the class.",
        id: loadingId,
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleAssignTeachers = async () => {
    if (!selectedClass) return;

    const loadingId = toast.loading("Updating assigned teachers...");

    setAssignLoading(true);

    try {
      const payload = { teacherIds: selectedTeacherIds };

      await api.patch(`/classes/school/${selectedClass.classId}/assign-teachers`, payload);

      const updatedAssigned = teachers.filter(t => selectedTeacherIds.includes(t.teacherId));
      const updatedClass = { ...selectedClass, class_teachers: updatedAssigned };

      setClasses(prev =>
        prev.map(c => c.classId === selectedClass.classId ? updatedClass : c)
      );
      setSelectedClass(updatedClass);

      toast.success("Teachers updated", {
        description: `Assigned ${selectedTeacherIds.length} teacher${selectedTeacherIds.length === 1 ? "" : "s"} to ${selectedClass.className}`,
        id: loadingId,
      });

      setAssignModalOpen(false);
    } catch (err: any) {
      toast.error("Assignment failed", {
        description: err?.response?.data?.message || "Could not update assigned teachers",
        id: loadingId,
      });
    } finally {
      setAssignLoading(false);
    }
  };

  const getTeachersSummary = (teachersList: TeacherBasic[]) => {
    if (teachersList.length === 0) return "—";
    if (teachersList.length <= 2) {
      return teachersList.map(t => `${t.user.firstName} ${t.user.lastName}`).join(", ");
    }
    return `${teachersList.map(t => `${t.user.firstName} ${t.user.lastName}`).slice(0, 2).join(", ")} +${teachersList.length - 2} more`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
              Classes
            </h1>
          </div>

          <Button
            className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
            onClick={() => openModal("add")}
          >
            + Add New Class
          </Button>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <p className="py-12 text-center text-muted-foreground">Loading classes…</p>
          ) : classes.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No classes found</p>
          ) : (
            classes.map((cls) => (
              <div
                key={cls.classId}
                className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all cursor-pointer dark:border-border/60"
                onClick={() => openView(cls)}
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="font-semibold text-lg text-foreground">{cls.className}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created {formatDate(cls.created_at)}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Teachers:</p>
                      <p className="text-sm font-medium">
                        {getTeachersSummary(cls.class_teachers)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal("edit", cls);
                      }}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteLoadingId === cls.classId}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deleteLoadingId === cls.classId ? "Deleting..." : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{cls.className}</strong>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteClass(cls.classId)}
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
                  Class Name
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  School
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  Created
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-3/12">
                  Class Teachers
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
                    Loading classes…
                  </TableCell>
                </TableRow>
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                    No classes found
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow
                    key={cls.classId}
                    className="hover:bg-muted/40 transition-colors cursor-pointer border-b last:border-b-0"
                    onClick={() => openView(cls)}
                  >
                    <TableCell className="px-6 py-4 font-medium text-foreground">
                      {cls.className}
                    </TableCell>
                    <TableCell className="px-6 py-4 font-medium text-foreground">
                      {cls.school?.schoolName || "—"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {formatDate(cls.created_at)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {getTeachersSummary(cls.class_teachers)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openView(cls);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal("edit", cls);
                        }}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteLoadingId === cls.classId}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {deleteLoadingId === cls.classId ? "Deleting..." : "Delete"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{cls.className}</strong>?<br />
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteClass(cls.classId)}
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

        {/* Add/Edit Class Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{modalMode === "add" ? "Add New Class" : "Edit Class"}</DialogTitle>
              <DialogDescription>
                {modalMode === "add"
                  ? "Enter the name for the new class."
                  : "Update the class name below."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveClass} className="space-y-6">
              <Input
                value={classNameInput}
                onChange={(e) => setClassNameInput(e.target.value)}
                placeholder="Class name"
                required
                disabled={isSubmitting}
                autoFocus
                className="h-11"
              />

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
                  disabled={isSubmitting || !classNameInput.trim()}
                >
                  {isSubmitting
                    ? modalMode === "add" ? "Adding..." : "Updating..."
                    : modalMode === "add" ? "Add Class" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Class Modal */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Class Details</DialogTitle>
              <DialogDescription>
                Full information about this class and its assigned teachers
              </DialogDescription>
            </DialogHeader>

            {selectedClass && (
              <div className="py-6 space-y-8">
                {/* Class Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1.5">
                      Class Name
                    </h4>
                    <p className="text-xl font-semibold text-foreground">
                      {selectedClass.className}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1.5">
                      Created On
                    </h4>
                    <p className="text-foreground">{formatDate(selectedClass.created_at)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1.5">
                      Last Updated
                    </h4>
                    <p className="text-foreground">{formatDate(selectedClass.updated_at)}</p>
                  </div>
                </div>

                {/* Assigned Teachers */}
                <div className="pt-6 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      Assigned Teachers ({selectedClass.class_teachers.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignModalOpen(true)}
                    >
                      {selectedClass.class_teachers.length ? "Edit" : "Assign"} Teachers
                    </Button>
                  </div>

                  {selectedClass.class_teachers.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedClass.class_teachers.map((t) => (
                        <li key={t.teacherId} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                            {t.user.firstName[0]}{t.user.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {t.user.firstName} {t.user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{t.user.email}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic">No teachers assigned to this class yet</p>
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
                      <p className="text-foreground">{selectedClass.school.schoolName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                      <p className="text-foreground">{selectedClass.school.schoolEmail}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Phone</h4>
                      <p className="text-foreground">
                        {selectedClass.school.schoolPhone || "—"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Address</h4>
                      <p className="text-foreground">
                        {selectedClass.school.schoolAddress || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                      <p
                        className={`font-medium ${
                          selectedClass.school.status === "active"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {selectedClass.school.status.charAt(0).toUpperCase() +
                          selectedClass.school.status.slice(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Multiple Teachers Modal */}
        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Teachers to Class</DialogTitle>
              <DialogDescription>
                Select one or more teachers for <strong>{selectedClass?.className}</strong>.
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
                        setSelectedTeacherIds(prev =>
                          checked
                            ? [...prev, t.teacherId]
                            : prev.filter(id => id !== t.teacherId)
                        );
                      }}
                    />
                    <Label
                      htmlFor={`teacher-${t.teacherId}`}
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      {t.user.firstName} {t.user.lastName}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({t.user.email})
                      </span>
                    </Label>
                  </div>
                ))
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignModalOpen(false)}
                disabled={assignLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignTeachers}
                disabled={assignLoading}
              >
                {assignLoading ? "Saving..." : "Save Assignments"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}