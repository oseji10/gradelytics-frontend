"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ChevronLeftIcon } from "@/icons";
import { toast } from "@/components/ui/use-toast";
import Icon from "@/components/Icons";
import api from "../../../lib/api";
import { useModal } from "../../../context/ModalContext";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface School {
  schoolId: number;
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;       // ← added
  schoolLogo: string | null;
  authorizedSignature: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  isDefault: number;
}

const ITEMS_PER_PAGE = 10;

export default function AdminSchools() {
  const { openModal, closeModal } = useModal();

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(schools.length / ITEMS_PER_PAGE);

  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return schools.slice(start, start + ITEMS_PER_PAGE);
  }, [schools, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [schools.length]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Fetch schools
  useEffect(() => {
    const fetchSchools = async () => {
      const loadingId = toast.loading("Loading schools...");

      try {
        setLoading(true);
        const response = await api.get("/schools");
        setSchools(
          (response.data ?? []).sort(
            (a: School, b: School) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );

        toast.success("Schools loaded", {
          description: `Found ${response.data?.length || 0} schools`,
          id: loadingId,
        });
      } catch (error: any) {
        console.error("Error fetching schools:", error);
        toast.error("Failed to load schools", {
          description: error?.response?.data?.message || "Please try again later",
          id: loadingId,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewSchool = (school: School) => {
    setSelectedSchool(school);
    openModal();
  };

  const handleEditSchool = (school: School) => {
    setEditingSchool({ ...school });
    setLogoPreview(school.schoolLogo ? `${process.env.NEXT_PUBLIC_FILE_URL}${school.schoolLogo}` : null);
    setSignaturePreview(school.authorizedSignature ? `${process.env.NEXT_PUBLIC_FILE_URL}${school.authorizedSignature}` : null);
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
    setSelectedSchool(null);
    setEditingSchool(null);
    setLogoPreview(null);
    setSignaturePreview(null);
  };

  const handleStatusToggle = async (school: School) => {
    const newStatus = school.status === "active" ? "inactive" : "active";
    setUpdatingStatus(school.schoolId);

    const loadingId = toast.loading(`Setting status to ${newStatus}...`);

    try {
      await api.patch(`/schools/${school.schoolId}/status`, { status: newStatus });
      setSchools(prev => prev.map(s => s.schoolId === school.schoolId ? { ...s, status: newStatus } : s));

      toast.success("Status updated", {
        description: `School is now ${newStatus}.`,
        id: loadingId,
      });
    } catch (err: any) {
      toast.error("Status change failed", {
        description: err?.response?.data?.message || "Operation failed",
        id: loadingId,
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSchool) return;

    const loadingId = toast.loading("Saving school changes...");

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      if (logoInputRef.current?.files?.[0]) {
        formData.append("schoolLogo", logoInputRef.current.files[0]);
      }
      if (signatureInputRef.current?.files?.[0]) {
        formData.append("authorizedSignature", signatureInputRef.current.files[0]);
      }

      formData.append("_method", "PUT");

      const res = await api.post(`/schools/${editingSchool.schoolId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.school) {
        setSchools(prev => prev.map(s => s.schoolId === editingSchool.schoolId ? res.data.school : s));
      }

      toast.success("School updated successfully", { id: loadingId });
      setTimeout(handleCloseModal, 1200);
    } catch (err: any) {
      toast.error("Failed to update school", {
        description: err?.response?.data?.message || "Please check your input",
        id: loadingId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSignaturePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
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
              Schools
            </h1>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total: <span className="font-medium">{schools.length}</span> school{schools.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <p className="py-12 text-center text-muted-foreground">Loading schools…</p>
          ) : schools.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No schools found</p>
          ) : (
            paginatedSchools.map((school) => (
              <div
                key={school.schoolId}
                className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all cursor-pointer dark:border-border/60"
                onClick={() => handleViewSchool(school)}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border flex-shrink-0">
                        {school.schoolLogo ? (
                          <Image
                            width={48}
                            height={48}
                            src={`${process.env.NEXT_PUBLIC_FILE_URL}${school.schoolLogo}`}
                            alt={school.schoolName}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-400">
                            {school.schoolName[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-foreground">{school.schoolName}</p>
                        <p className="text-sm text-muted-foreground">{school.schoolEmail}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSchool(school);
                      }}
                    >
                      View
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <div className="mt-1">
                        <Badge variant={school.status === "active" ? "default" : "destructive"}>
                          {school.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Default</span>
                      <div className="mt-1">
                        {school.isDefault === 1 ? (
                          <Badge variant="secondary">Current</Badge>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created</span>
                      <p className="mt-1">{formatDate(school.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="self-center text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-5/12">
                  School Name
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-3/12">
                  Contact
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-2/12">
                  Address
                </th>
                <th className="h-14 px-6 text-left font-semibold text-muted-foreground w-1/12">
                  Status
                </th>
                <th className="h-14 px-6 text-right font-semibold text-muted-foreground w-1/12">
                  Actions
                </th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                    Loading schools…
                  </TableCell>
                </TableRow>
              ) : schools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                    No schools found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSchools.map((school) => (
                  <TableRow
                    key={school.schoolId}
                    className="hover:bg-muted/40 transition-colors cursor-pointer border-b last:border-b-0"
                    onClick={() => handleViewSchool(school)}
                  >
                    <TableCell className="px-6 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border flex-shrink-0">
                          {school.schoolLogo ? (
                            <Image
                              width={40}
                              height={40}
                              src={`${process.env.NEXT_PUBLIC_FILE_URL}${school.schoolLogo}`}
                              alt={school.schoolName}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">
                              {school.schoolName[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        {school.schoolName}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      <div>
                        <p>{school.schoolEmail}</p>
                        {school.schoolPhone && <p>{school.schoolPhone}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {school.schoolAddress || "—"}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant={school.status === "active" ? "default" : "destructive"}>
                        {school.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSchool(school);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, schools.length)} of {schools.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedSchool && !editingSchool && (
        <Dialog open onOpenChange={handleCloseModal}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>School Details</DialogTitle>
            </DialogHeader>

            <div className="py-6 space-y-8">
              {/* Header with Logo */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
                  {selectedSchool.schoolLogo ? (
                    <Image
                      width={96}
                      height={96}
                      src={`${process.env.NEXT_PUBLIC_FILE_URL}${selectedSchool.schoolLogo}`}
                      alt={selectedSchool.schoolName}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
                      {selectedSchool.schoolName[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl font-semibold">{selectedSchool.schoolName}</h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                    {selectedSchool.isDefault === 1 && (
                      <Badge variant="secondary">Current School</Badge>
                    )}
                    <Badge variant={selectedSchool.status === "active" ? "default" : "destructive"}>
                      {selectedSchool.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Main Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold border-b pb-2">Contact Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{selectedSchool.schoolEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{selectedSchool.schoolPhone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Physical Address</p>
                      <p className="whitespace-pre-line">{selectedSchool.schoolAddress || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold border-b pb-2">Timeline</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p>{formatDate(selectedSchool.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p>{formatDate(selectedSchool.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature */}
              {selectedSchool.authorizedSignature && (
                <div className="pt-6 border-t">
                  <h4 className="text-lg font-semibold mb-4">Authorized Signature</h4>
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <Image
                      width={300}
                      height={120}
                      src={`${process.env.NEXT_PUBLIC_FILE_URL}${selectedSchool.authorizedSignature}`}
                      alt="Authorized Signature"
                      className="max-w-full h-auto object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-8">
              <Button variant="outline" onClick={handleCloseModal}>
                Close
              </Button>
              <Button
                onClick={() => {
                  handleCloseModal();
                  setTimeout(() => handleEditSchool(selectedSchool), 100);
                }}
              >
                Edit School
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Modal */}
      {editingSchool && (
        <Dialog open onOpenChange={handleCloseModal}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit School</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    School Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="schoolName"
                    defaultValue={editingSchool.schoolName}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="schoolPhone"
                    type="tel"
                    defaultValue={editingSchool.schoolPhone}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="schoolEmail"
                    type="email"
                    defaultValue={editingSchool.schoolEmail}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    School Address
                  </label>
                  <Textarea
                    name="schoolAddress"
                    defaultValue={editingSchool.schoolAddress || ""}
                    placeholder="Street address, city, state, postal code..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Logo & Signature */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    School Logo
                  </label>
                  <Input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  {logoPreview && (
                    <div className="mt-3">
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        width={120}
                        height={120}
                        className="object-contain rounded border"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Authorized Signature (Principal/Head Teacher)
                  </label>
                  <Input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureChange}
                  />
                  {signaturePreview && (
                    <div className="mt-3">
                      <Image
                        src={signaturePreview}
                        alt="Signature preview"
                        width={200}
                        height={80}
                        className="object-contain rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}