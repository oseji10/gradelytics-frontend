"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
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
}

interface Club {
  clubId: number;
  clubName: string;
}

interface House {
  houseId: number;
  houseName: string;
}

interface ParentUser {
  id: number;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string | null;
  phoneNumber: string | null;
  alternatePhoneNumber: string | null;
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
  admissionNumber?: string | null;
  club?: Club | null;     // was string | null
  house?: House | null; 
  passport?: string | null;
  parentId: number | null;
  parents2: Parent[];
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
  const [houses, setHouses] = useState<House[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [parents2, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const [parentData, setParentData] = useState({
  childrenCount: 0,
  children: []
});

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
    admissionNumber: "",
    club: "",
    house: "",
  });

  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const loadingId = toast.loading("Loading data...");

      try {
        const [
          classesRes,
          housesRes,
          clubsRes,
          parents2Res,
          studentsRes,
        ] = await Promise.all([
          api.get("/classes/school"),
          api.get("/school/houses"),      // ← new
          api.get("/school/clubs"),       // ← new
          api.get("/school/parents"),
          api.get("/school/students"),
        ]);

        setClasses(classesRes.data || []);
        setHouses(housesRes.data || []);
        setClubs(clubsRes.data || []);
        setParents(parents2Res.data || []);

        const sorted = (studentsRes.data || []).slice().sort(
          (a: Student, b: Student) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setStudents(sorted);

        toast.success("Data loaded", {
          description: `Found ${sorted.length} students, ${classesRes.data?.length || 0} classes, ${housesRes.data?.length || 0} houses, ${clubsRes.data?.length || 0} clubs`,
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

  const openModal = (mode: "add" | "edit", student?: Student) => {
  setModalMode(mode);
  setCurrentStudent(student || null);
  setPassportFile(null);
  setPassportPreview(getPassportUrl(student?.passport) || null);

  setFormData({
    firstName: student?.user?.firstName || "",
    lastName: student?.user?.lastName || "",
    otherNames: student?.user?.otherNames || "",
    email: student?.user?.email || "",
    phoneNumber: student?.user?.phoneNumber || "",
    alternatePhoneNumber: student?.user?.alternatePhoneNumber || "",
    dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
    gender: student?.gender || "",
    bloodGroup: student?.bloodGroup || "",
    classId: student?.classes?.[0]?.classId?.toString() || "",
    parentId: student?.parents2?.[0]?.parentId?.toString() || "",
    admissionNumber: student?.admissionNumber || "",
    // Pre-fill club and house IDs (use null if not assigned)
    club: student?.clubId?.toString() || "none",
    house: student?.houseId?.toString() || "none",
  });

  setModalOpen(true);
};

const getPassportUrl = (passport?: string | null) => {
  // if (!passport) return null;
  return `${process.env.NEXT_PUBLIC_FILE_URL}${passport}`;
};

  const openView = (student: Student) => {
    setSelectedStudent(student);
    setViewOpen(true);
  };

  const handlePassportChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, etc.)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    setPassportFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPassportPreview(previewUrl);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.dateOfBirth) {
      toast.error("Required fields are missing");
      return;
    }

    const loadingId = toast.loading(
      modalMode === "add" ? "Adding new student..." : "Updating student..."
    );

    setIsSubmitting(true);

    try {
      const payload = new FormData();

      payload.append("firstName", formData.firstName.trim());
      payload.append("lastName", formData.lastName.trim());
      if (formData.otherNames.trim()) payload.append("otherNames", formData.otherNames.trim());
      if (formData.email.trim()) payload.append("email", formData.email.trim());
      if (formData.phoneNumber.trim()) payload.append("phoneNumber", formData.phoneNumber.trim());
      if (formData.alternatePhoneNumber.trim()) {
        payload.append("alternatePhoneNumber", formData.alternatePhoneNumber.trim());
      }
      payload.append("dateOfBirth", formData.dateOfBirth);
      if (formData.gender) payload.append("gender", formData.gender);
      if (formData.bloodGroup.trim()) payload.append("bloodGroup", formData.bloodGroup.trim());
      if (formData.classId) payload.append("classId", formData.classId);
      if (formData.parentId && formData.parentId !== "none") {
        payload.append("parentId", formData.parentId);
      }
      if (formData.admissionNumber.trim()) {
        payload.append("admissionNumber", formData.admissionNumber.trim());
      }
      if (formData.club) payload.append("clubId", formData.club);
      
      if (formData.house) payload.append("houseId", formData.house);

      if (passportFile) {
        payload.append("passport", passportFile);
      }

      let updatedStudents: Student[];

      if (modalMode === "add") {
        const res = await api.post("/school/students", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const created = res.data.student;
        updatedStudents = [created, ...students];
      } else if (currentStudent) {
        payload.append("_method", "PUT"); 
        const res = await api.post(`/school/students/${currentStudent.studentId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const updated = res.data.student || res.data;
        updatedStudents = students.map((s) =>
          s.studentId === currentStudent.studentId ? updated : s
        );
      } else {
        throw new Error("No student selected for update");
      }

      setStudents(updatedStudents);
      setModalOpen(false);
      setCurrentStudent(null);
      setPassportFile(null);
      setPassportPreview(null);

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
    `${s?.user?.firstName} ${s?.user?.lastName}${s?.user?.otherNames ? ` ${s?.user?.otherNames}` : ""}`;

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
    if (!student.parents2 || student.parents2.length === 0) return "Not assigned";
    const p = student.parents2[0];
    return `${p?.user?.firstName} ${p?.user?.lastName}${p?.user?.otherNames ? ` ${p?.user?.otherNames}` : ""}`;
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
            disabled={loading || classes.length === 0}
          >
            + Add New Student
          </Button>
        </div>

        {/* Mobile Cards - updated to show admissionNumber */}
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
                  {s.admissionNumber && (
                    <p className="text-sm text-muted-foreground">
                      Adm. No: {s.admissionNumber}
                    </p>
                  )}
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

        {/* Desktop Table - added Adm. No column */}
        <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-4/12">Name</th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-1/12">Adm. No</th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">Class</th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-3/12">Parent</th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">DOB</th>
                <th className="h-14 px-6 text-right font-semibold text-muted-foreground w-2/12">Actions</th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                    Loading students…
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
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
                    <TableCell className="px-6 py-4 text-muted-foreground">{s.admissionNumber || "—"}</TableCell>
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
  <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6">
    <DialogHeader className="mb-6">
      <DialogTitle className="text-xl">
        {modalMode === "add" ? "Add New Student" : "Edit Student"}
      </DialogTitle>
    </DialogHeader>

    <form onSubmit={handleSaveStudent} className="space-y-6">
      {/* Passport Upload – responsive flex */}
      <div className="space-y-3">
        <Label>Student Passport Photo (optional)</Label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="shrink-0">
            {passportPreview ? (
              <img
                src={passportPreview}
                alt="Passport preview"
                className="h-24 w-24 object-cover border-2 border-gray-300 shadow-sm"
              />
            ) : (
              <div className="h-24 w-24  bg-gray-200 flex items-center justify-center text-gray-500 text-sm border-2 border-gray-300">
                No photo
              </div>
            )}
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePassportChange}
              className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: square photo • Max 2MB • JPG, PNG, WebP
            </p>
          </div>
        </div>
      </div>

      {/* Form fields – responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
          <Label>Admission Number (optional)</Label>
          <Input
            value={formData.admissionNumber}
            onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
            placeholder="e.g. SCH/2025/001"
          />
        </div>
        <div>
          <Label>Date of Birth *</Label>
          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            required
          />
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
          <Input
            value={formData.bloodGroup}
            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
            placeholder="e.g. A+, O-, AB+"
          />
        </div>

        {/* Club Dropdown – using your fixed pattern */}
        <div>
          <Label>Club / Society (optional)</Label>
          {clubs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No clubs available</p>
          ) : (
            <Select
              value={formData.club ?? "none"}
              onValueChange={(val) => {
                setFormData({ 
                  ...formData, 
                  club: val === "none" ? null : val 
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {clubs.map((c) => (
                  <SelectItem 
                    key={c.clubId}
                    value={String(c.clubId)}
                  >
                    {c.clubName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* House Dropdown – using your fixed pattern */}
        <div>
          <Label>House (optional)</Label>
          {houses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No houses available</p>
          ) : (
            <Select
              value={formData.house ?? "none"}
              onValueChange={(val) => {
                setFormData({ ...formData, house: val === "none" ? null : val });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select house" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {houses.map((h) => (
                  <SelectItem 
                    key={h.houseId}
                    value={String(h.houseId)}
                  >
                    {h.houseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <Label>Class</Label>
          {classes.length === 0 ? (
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
          {parents2.length === 0 ? (
            <p className="text-sm text-destructive py-2">No parents2 available</p>
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
                {parents2.map((p) => (
                  <SelectItem key={p.parentId} value={p.parentId.toString()}>
                    {`${p.user.firstName} ${p.user.lastName}`}
                    {p.user.email && ` (${p.user.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label>Email (optional)</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <Label>Phone Number (optional)</Label>
          <Input
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          />
        </div>
      </div>

      <DialogFooter className="pt-6 border-t">
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
          disabled={isSubmitting}
          className="bg-[#1F6F43] hover:bg-[#1F6F43]/90 min-w-[140px]"
        >
          {isSubmitting 
            ? "Saving..." 
            : modalMode === "add" 
              ? "Add Student" 
              : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

        {/* View Modal - restored attendance analytics */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Details – {selectedStudent ? fullName(selectedStudent) : ""}</DialogTitle>
            </DialogHeader>

            {selectedStudent && (
  <div className="py-6 space-y-10">
    {/* Passport & Basic Info */}
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <div className="shrink-0">
        {getPassportUrl(selectedStudent.passport) ? (
  <img
    src={getPassportUrl(selectedStudent.passport)!}
    alt={`${fullName(selectedStudent)} passport`}
    className="h-40 w-40  object-cover border-4 border-gray-200 shadow-md"
  />
) : (
  <div className="h-40 w-40  bg-gray-200 flex items-center justify-center text-gray-500">
    No photo
  </div>
)}
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div>
          <h4 className="text-sm text-muted-foreground mb-1">Full Name</h4>
          <p className="text-lg font-semibold">{fullName(selectedStudent)}</p>
        </div>
        {selectedStudent.admissionNumber && (
          <div>
            <h4 className="text-sm text-muted-foreground mb-1">Admission Number</h4>
            <p className="text-lg font-medium">{selectedStudent.admissionNumber}</p>
          </div>
        )}
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
        {/* New: Club */}
        <div>
          <h4 className="text-sm text-muted-foreground mb-1">Club / Society</h4>
          <p className="text-lg">
            {selectedStudent.club ? selectedStudent.club.clubName : "None"}
          </p>
        </div>
        {/* New: House */}
        <div>
          <h4 className="text-sm text-muted-foreground mb-1">House</h4>
          <p className="text-lg">
            {selectedStudent.house ? selectedStudent.house.houseName : "None"}
          </p>
        </div>
      </div>
    </div>

   {/* Children Info */}
<div className="border-t pt-8">
  <h3 className="text-lg font-semibold mb-4">
    Children ({parentData.childrenCount})
  </h3>

  {parentData.children && parentData.children.length > 0 ? (
    parentData.children.map((child, index) => (
      <div key={child.studentId} className="mb-6 last:mb-0">

        <p className="font-medium mb-2">
          Child {index + 1}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">

          {/* Name */}
          <div>
            <span className="text-muted-foreground block">Name</span>
            <span>
              {child.user.firstName} {child.user.lastName}
              {child.user.otherNames && ` (${child.user.otherNames})`}
            </span>
          </div>

          {/* Admission Number */}
          <div>
            <span className="text-muted-foreground block">
              Admission Number
            </span>
            <span>
              {child.schoolAssignedAdmissionNumber ||
                child.admissionNumber ||
                "—"}
            </span>
          </div>

          {/* Class */}
          <div>
            <span className="text-muted-foreground block">Class</span>
            <span>
              {child.classes?.[0]?.className || "—"}
            </span>
          </div>

          {/* Gender */}
          <div>
            <span className="text-muted-foreground block">Gender</span>
            <span className="capitalize">
              {child.gender || "—"}
            </span>
          </div>

          {/* Phone */}
          <div>
            <span className="text-muted-foreground block">Phone</span>
            <span>
              {child.user.phoneNumber || "—"}
            </span>
          </div>

          {/* Email */}
          <div className="sm:col-span-3">
            <span className="text-muted-foreground block">Email</span>
            <span>
              {child.user.email || "—"}
            </span>
          </div>

        </div>

      </div>
    ))
  ) : (
    <p className="text-muted-foreground italic">
      No children found.
    </p>
  )}
</div>

    {/* Attendance Summary – kept as-is */}
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

    {/* Medical Notes */}
    <div className="border-t pt-8">
      <h3 className="text-lg font-semibold mb-4">Medical Notes</h3>
      <p className="text-muted-foreground italic">
        No medical notes recorded yet.
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