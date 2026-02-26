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
import { toast, dismiss } from "@/components/ui/use-toast"; // ← added
import { ChevronLeftIcon } from "@/icons";
import api from "../../../lib/api";
import Icon from "@/components/Icons";

/* ---------------- types ---------------- */

interface SchoolClass {
  classId: number;
  className: string;
}

interface Subject {
  subjectId: number;
  subjectName: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string;
  phoneNumber: string;
  alternatePhoneNumber: string | null;
}

interface Teacher {
  teacherId: number;
  schoolId: number;
  userId: number;
  qualification: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user: User;
}

/* ---------------- component ---------------- */

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    otherNames: "",
    email: "",
    phoneNumber: "",
    alternatePhoneNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View modal
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Delete state
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      const loadingId = toast.loading("Loading teachers...");

      try {
        setLoading(true);
        const res = await api.get("/school/teachers");
        const sorted = (res.data || []).slice().sort(
          (a: Teacher, b: Teacher) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setTeachers(sorted);

        toast.success("Teachers loaded", {
          description: `Found ${res.data?.length || 0} teachers`,
          id: loadingId,
        });
      } catch (err: any) {
        toast.error("Failed to load teachers", {
          description: err?.response?.data?.message || "Connection issue",
          id: loadingId,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const openModal = (mode: "add" | "edit", teacher?: Teacher) => {
    setModalMode(mode);
    setCurrentTeacher(teacher || null);
    setFormData({
      firstName: teacher?.user.firstName || "",
      lastName: teacher?.user.lastName || "",
      otherNames: teacher?.user.otherNames || "",
      email: teacher?.user.email || "",
      phoneNumber: teacher?.user.phoneNumber || "",
      alternatePhoneNumber: teacher?.user.alternatePhoneNumber || "",
    });
    setModalOpen(true);
  };

  const openView = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setViewOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) return;

    const loadingId = toast.loading(
      modalMode === "add" ? "Adding new teacher..." : "Updating teacher..."
    );

    setIsSubmitting(true);

    try {
      let updatedTeachers: Teacher[];

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        otherNames: formData.otherNames.trim() || null,
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        alternatePhoneNumber: formData.alternatePhoneNumber.trim() || null,
      };

      if (modalMode === "add") {
        const res = await api.post("/school/teachers", payload);
        const created = res.data; // adjust if wrapped (e.g. res.data.teacher)
        updatedTeachers = [created, ...teachers];

        toast.success("Teacher added", {
          description: `${formData.firstName} ${formData.lastName} was successfully created`,
          id: loadingId,
        });
      } else if (currentTeacher) {
        const res = await api.patch(`/school/teachers/${currentTeacher.teacherId}`, payload);
        const updated = res.data.teacher || res.data;
        updatedTeachers = teachers.map((t) =>
          t.teacherId === currentTeacher.teacherId ? updated : t
        );

        toast.success("Teacher updated", {
          description: `${formData.firstName} ${formData.lastName} was successfully updated`,
          id: loadingId,
        });
      } else {
        throw new Error("No teacher selected");
      }

      setTeachers(updatedTeachers);
      setModalOpen(false);
      setCurrentTeacher(null);
    } catch (err: any) {
      toast.error("Operation failed", {
        description: err?.response?.data?.message || `Failed to ${modalMode === "add" ? "add" : "update"} teacher`,
        id: loadingId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: number) => {
    const teacher = teachers.find(t => t.teacherId === teacherId);
    const teacherName = teacher ? `${teacher.user.firstName} ${teacher.user.lastName}` : "this teacher";

    const loadingId = toast.loading(`Deleting ${teacherName}...`);

    setDeleteLoadingId(teacherId);

    try {
      await api.delete(`/school/teachers/${teacherId}`);
      setTeachers((prev) => prev.filter((t) => t.teacherId !== teacherId));

      toast.success("Teacher deleted", {
        description: `${teacherName} has been permanently removed`,
        id: loadingId,
      });
    } catch (err: any) {
      toast.error("Delete failed", {
        description: err?.response?.data?.message || "Could not delete teacher",
        id: loadingId,
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const fullName = (t: Teacher) =>
    `${t.user.firstName} ${t.user.lastName}${t.user.otherNames ? ` ${t.user.otherNames}` : ""}`;

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
              Teachers
            </h1>
          </div>

          <Button
            className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
            onClick={() => openModal("add")}
          >
            + Add New Teacher
          </Button>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <p className="py-12 text-center text-muted-foreground">Loading teachers…</p>
          ) : teachers.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No teachers found</p>
          ) : (
            teachers.map((t) => (
              <div
                key={t.teacherId}
                className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all cursor-pointer dark:border-border/60"
                onClick={() => openView(t)}
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="font-semibold text-lg text-foreground">{fullName(t)}</p>
                    <p className="text-sm text-muted-foreground">{t.user.email}</p>
                    <p className="text-sm text-muted-foreground">{t.user.phoneNumber}</p>
                  </div>
                  <div className="flex gap-2 self-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal("edit", t);
                      }}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteLoadingId === t.teacherId}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deleteLoadingId === t.teacherId ? "Deleting..." : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{fullName(t)}</strong>?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTeacher(t.teacherId)}
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
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-5/12">
                  Name
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-4/12">
                  Email
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  Phone
                </th>
                <th className="h-14 px-6 text-right font-semibold text-muted-foreground w-3/12">
                  Actions
                </th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center text-muted-foreground">
                    Loading teachers…
                  </TableCell>
                </TableRow>
              ) : teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center text-muted-foreground">
                    No teachers found
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((t) => (
                  <TableRow
                    key={t.teacherId}
                    className="hover:bg-muted/40 transition-colors cursor-pointer border-b last:border-b-0"
                    onClick={() => openView(t)}
                  >
                    <TableCell className="px-6 py-4 font-medium text-foreground">
                      {fullName(t)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {t.user.email}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {t.user.phoneNumber}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openView(t);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal("edit", t);
                        }}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteLoadingId === t.teacherId}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {deleteLoadingId === t.teacherId ? "Deleting..." : "Delete"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{fullName(t)}</strong>?<br />
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTeacher(t.teacherId)}
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{modalMode === "add" ? "Add New Teacher" : "Edit Teacher"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveTeacher} className="space-y-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Other Names</Label>
                  <Input
                    value={formData.otherNames}
                    onChange={(e) => setFormData({ ...formData, otherNames: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Alternate Phone (optional)</Label>
                  <Input
                    value={formData.alternatePhoneNumber}
                    onChange={(e) => setFormData({ ...formData, alternatePhoneNumber: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : modalMode === "add" ? "Add Teacher" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Teacher Details</DialogTitle>
            </DialogHeader>

            {selectedTeacher && (
              <div className="py-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-1">Full Name</h4>
                    <p className="text-xl font-semibold">{fullName(selectedTeacher)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-1">Email</h4>
                    <p className="text-lg">{selectedTeacher.user.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-1">Phone</h4>
                    <p className="text-lg">{selectedTeacher.user.phoneNumber}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-1">Alternate Phone</h4>
                    <p className="text-lg">{selectedTeacher.user.alternatePhoneNumber || "—"}</p>
                  </div>
                </div>

                {/* Placeholder for assignments */}
                <div className="pt-6 border-t">
                  <p className="text-sm text-muted-foreground italic">
                    Class teacher & subject assignments coming soon...
                  </p>
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
      </div>
    </div>
  );
}