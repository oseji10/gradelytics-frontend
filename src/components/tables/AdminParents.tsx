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
import { toast } from "@/components/ui/use-toast";
import { ChevronLeftIcon } from "@/icons";
import api from "../../../lib/api";
import Icon from "@/components/Icons";

/* ---------------- types ---------------- */

interface User {
  id: number;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string;
  phoneNumber: string;
  alternatePhoneNumber: string | null;
}

interface Parent {
  parentId: number;
  schoolId: number;
  userId: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user: User;
  // We'll fetch this separately or include in list response
  studentCount?: number;
}


interface Child {
  studentId: number;
  admissionNumber: string;
  schoolAssignedAdmissionNumber: string | null;
  gender: string | null;
  user: User;
  classes: {
    className: string;
  }[];
}

/* ---------------- component ---------------- */

export default function AdminParents() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);

  const [parentData, setParentData] = useState<{
  childrenCount: number;
  children: Child[];
}>({
  childrenCount: 0,
  children: [],
});

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentParent, setCurrentParent] = useState<Parent | null>(null);
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
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);

  // Delete state
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchParents = async () => {
      const loadingId = toast.loading("Loading parents...");

      try {
        setLoading(true);
        const res = await api.get("/school/parents"); // ← adjust endpoint if needed

        // If your backend already includes studentCount → great!
        // Otherwise you might need a separate call or different endpoint
        const parentsWithCount = await Promise.all(
  (res.data || []).map(async (p: Parent) => {
    try {
      const countRes = await api.get(`/parents/${p.parentId}/children`);
      return { ...p, studentCount: countRes.data.childrenCount || 0 };
    } catch {
      return { ...p, studentCount: 0 };
    }
  })
);

        const sorted = parentsWithCount.slice().sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setParents(sorted);

        toast.success("Parents loaded", {
          description: `Found ${sorted.length} parents`,
          id: loadingId,
        });
      } catch (err: any) {
        toast.error("Failed to load parents", {
          description: err?.response?.data?.message || "Connection issue",
          id: loadingId,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchParents();
  }, []);

  const openModal = (mode: "add" | "edit", parent?: Parent) => {
    setModalMode(mode);
    setCurrentParent(parent || null);
    setFormData({
      firstName: parent?.user.firstName || "",
      lastName: parent?.user.lastName || "",
      otherNames: parent?.user.otherNames || "",
      email: parent?.user.email || "",
      phoneNumber: parent?.user.phoneNumber || "",
      alternatePhoneNumber: parent?.user.alternatePhoneNumber || "",
    });
    setModalOpen(true);
  };

const [childrenLoading, setChildrenLoading] = useState(false);

const openView = async (parent: Parent) => {
  setSelectedParent(parent);
  setViewOpen(true);
  setChildrenLoading(true);
  setParentData({ childrenCount: 0, children: [] }); // reset first

  try {
    console.log(`Fetching children for parent ${parent.parentId}`);
    const res = await api.get(`/parents/${parent.parentId}/children`);
    console.log("Children API response:", res.data); // ← very important!

    // If your backend sometimes wraps it differently, you can try:
    // const data = res.data.data || res.data;

    setParentData(res.data);
  } catch (err: any) {
    console.error("Failed to load children:", err);
    toast.error("Could not load children's details", {
      description: err?.response?.data?.message || "Network error",
    });
    setParentData({ childrenCount: 0, children: [] });
  } finally {
    setChildrenLoading(false);
  }
};

  const handleSaveParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) return;

    const loadingId = toast.loading(
      modalMode === "add" ? "Adding new parent..." : "Updating parent..."
    );

    setIsSubmitting(true);

    try {
      let updatedParents: Parent[];

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        otherNames: formData.otherNames.trim() || null,
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        alternatePhoneNumber: formData.alternatePhoneNumber.trim() || null,
      };

      if (modalMode === "add") {
        const res = await api.post("/school/parents", payload);
        const created = res.data;
        // Optional: refetch count or assume 0 for new parent
        updatedParents = [{ ...created, studentCount: 0 }, ...parents];

        toast.success("Parent added", {
          description: `${formData.firstName} ${formData.lastName} was successfully created`,
          id: loadingId,
        });
      } else if (currentParent) {
        const res = await api.patch(`/school/parents/${currentParent.parentId}`, payload);
        const updated = res.data.parent || res.data;
        updatedParents = parents.map((p) =>
          p.parentId === currentParent.parentId ? { ...updated, studentCount: p.studentCount } : p
        );

        toast.success("Parent updated", {
          description: `${formData.firstName} ${formData.lastName} was successfully updated`,
          id: loadingId,
        });
      } else {
        throw new Error("No parent selected");
      }

      setParents(updatedParents);
      setModalOpen(false);
      setCurrentParent(null);
    } catch (err: any) {
      toast.error("Operation failed", {
        description: err?.response?.data?.message || `Failed to ${modalMode === "add" ? "add" : "update"} parent`,
        id: loadingId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteParent = async (parentId: number) => {
    const parent = parents.find((p) => p.parentId === parentId);
    const parentName = parent ? `${parent.user.firstName} ${parent.user.lastName}` : "this parent";

    const loadingId = toast.loading(`Deleting ${parentName}...`);

    setDeleteLoadingId(parentId);

    try {
      await api.delete(`/school/parents/${parentId}`);
      setParents((prev) => prev.filter((p) => p.parentId !== parentId));

      toast.success("Parent deleted", {
        description: `${parentName} has been permanently removed`,
        id: loadingId,
      });
    } catch (err: any) {
      toast.error("Delete failed", {
        description: err?.response?.data?.message || "Could not delete parent",
        id: loadingId,
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const fullName = (p: Parent) =>
    `${p?.user?.firstName} ${p?.user?.lastName}${p?.user?.otherNames ? ` ${p?.user?.otherNames}` : ""}`;

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
              Parents
            </h1>
          </div>

          <Button
            className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
            onClick={() => openModal("add")}
          >
            + Add New Parent
          </Button>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <p className="py-12 text-center text-muted-foreground">Loading parents…</p>
          ) : parents.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No parents found</p>
          ) : (
            parents.map((p) => (
              <div
                key={p.parentId}
                className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all cursor-pointer dark:border-border/60"
                onClick={() => openView(p)}
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="font-semibold text-lg text-foreground">{fullName(p)}</p>
                    <p className="text-sm text-muted-foreground">{p?.user?.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Students: {p.studentCount ?? "?"}
                    </p>
                  </div>
                  <div className="flex gap-2 self-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal("edit", p);
                      }}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteLoadingId === p.parentId}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deleteLoadingId === p.parentId ? "Deleting..." : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{fullName(p)}</strong>?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteParent(p.parentId)}
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
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-3/12">
                  Email
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  Students
                </th>
                <th className="h-14 px-6 text-right font-semibold text-muted-foreground w-2/12">
                  Actions
                </th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center text-muted-foreground">
                    Loading parents…
                  </TableCell>
                </TableRow>
              ) : parents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center text-muted-foreground">
                    No parents found
                  </TableCell>
                </TableRow>
              ) : (
                parents.map((p) => (
                  <TableRow
                    key={p.parentId}
                    className="hover:bg-muted/40 transition-colors cursor-pointer border-b last:border-b-0"
                    onClick={() => openView(p)}
                  >
                    <TableCell className="px-6 py-4 font-medium text-foreground">
                      {fullName(p)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {p.user.email}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground font-medium">
                      {p.studentCount ?? "—"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openView(p);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal("edit", p);
                        }}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteLoadingId === p.parentId}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {deleteLoadingId === p.parentId ? "Deleting..." : "Delete"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{fullName(p)}</strong>?<br />
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteParent(p.parentId)}
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
              <DialogTitle>{modalMode === "add" ? "Add New Parent" : "Edit Parent"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveParent} className="space-y-5 py-4">
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
                  {isSubmitting ? "Saving..." : modalMode === "add" ? "Add Parent" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        {/* View Modal */}
<Dialog open={viewOpen} onOpenChange={setViewOpen}>
  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
    <DialogHeader className="px-6 pt-6 pb-4 border-b">
      <DialogTitle>Parent Details</DialogTitle>
    </DialogHeader>

    <div className="flex-1 overflow-y-auto px-6 py-6">
      {selectedParent && (
        <div className="space-y-8">
          {/* Parent basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm text-muted-foreground mb-1">Full Name</h4>
              <p className="text-xl font-semibold">{fullName(selectedParent)}</p>
            </div>
            <div>
              <h4 className="text-sm text-muted-foreground mb-1">Email</h4>
              <p className="text-lg">{selectedParent.user.email}</p>
            </div>
            <div>
              <h4 className="text-sm text-muted-foreground mb-1">Phone</h4>
              <p className="text-lg">{selectedParent.user.phoneNumber}</p>
            </div>
            <div>
              <h4 className="text-sm text-muted-foreground mb-1">Alternate Phone</h4>
              <p className="text-lg">{selectedParent.user.alternatePhoneNumber || "—"}</p>
            </div>
            <div>
              <h4 className="text-sm text-muted-foreground mb-1">Number of Students</h4>
              <p className="text-2xl font-bold text-[#1F6F43]">
                {parentData.childrenCount}
                <span className="text-base font-normal ml-1.5">
                  {parentData.childrenCount === 1 ? "child" : "children"}
                </span>
              </p>
            </div>
          </div>

          {/* Linked Students - this section can grow long */}
          <div className="pt-6 border-t">
            <h4 className="text-lg font-medium mb-4">Linked Students</h4>

            {childrenLoading ? (
              <div className="py-10 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                <p className="mt-3 text-muted-foreground">Loading children...</p>
              </div>
            ) : parentData.childrenCount === 0 && parentData.children.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground italic bg-muted/30 rounded-lg">
                No children linked to this parent.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-lg font-semibold text-[#1F6F43] mb-2">
                  {parentData.childrenCount} 
                  {parentData.childrenCount === 1 ? " child" : " children"} linked
                </div>

                {parentData.children.map((child, index) => (
                  <div
                    key={child.studentId}
                    className="rounded-lg border bg-white dark:bg-gray-800 p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4 pb-3 border-b">
                      <h5 className="font-semibold text-base">
                        {child.user.firstName} {child.user.lastName}
                        {child.user.otherNames && (
                          <span className="text-muted-foreground ml-2 text-sm">
                            ({child.user.otherNames})
                          </span>
                        )}
                      </h5>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        child.gender === 'male' ? 'bg-blue-100 text-blue-800' : 
                        child.gender === 'female' ? 'bg-pink-100 text-pink-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {child.gender ? child.gender.charAt(0).toUpperCase() + child.gender.slice(1) : "—"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-xs mb-0.5">Admission No</span>
                        <p className="font-medium">
                          {child.schoolAssignedAdmissionNumber || child.admissionNumber || "—"}
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-xs mb-0.5">Class</span>
                        <p className="font-medium">
                          {child.classes?.[0]?.className || "Not assigned"}
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-xs mb-0.5">Date of Birth</span>
                        <p className="font-medium">
                          {child.dateOfBirth 
                            ? new Date(child.dateOfBirth).toLocaleDateString('en-GB') 
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-xs mb-0.5">Phone</span>
                        <p>{child.user.phoneNumber || "—"}</p>
                      </div>

                      <div className="sm:col-span-2 md:col-span-1">
                        <span className="text-muted-foreground block text-xs mb-0.5">Email</span>
                        <p className="break-all">{child.user.email || "—"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    <DialogFooter className="px-6 py-4 border-t">
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