"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import { ChevronLeftIcon, MailIcon } from "@/icons";
import Icon from "@/components/Icons";
import api from "../../../lib/api";
import Badge from "@/components/ui/badge/Badge";

/* ---------------- Types ---------------- */

interface UserRole {
  roleId: number;
  roleName: string;
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
  phoneNumber: string | null;
  email_verified_at: string | null;
  role: number;
  currentPlan: number | null;
  status: "active" | "pending" | "suspended" | "inactive";
  otp_expires_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user_role: UserRole;
}

interface TenantSummary {
  schoolId: number;
  tenantName: string;
  tenantEmail: string | null;
  status: "active" | "inactive" | string;
  created_at: string;
}

/* ---------------- Modals ---------------- */

// Success Modal
function EmailSuccessModal({
  isOpen,
  message,
  onClose,
}: {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Email Sent!</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <Button onClick={onClose} className="w-full !bg-[#1F6F43] hover:!bg-[#084d93]">
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}

// Error Modal
function EmailErrorModal({
  isOpen,
  message,
  onClose,
}: {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to Send</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Main Component ---------------- */

const ITEMS_PER_PAGE = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userTenants, setUserTenants] = useState<TenantSummary[]>([]);
  const [userTenantsLoading, setUserTenantsLoading] = useState(false);
  const [userTenantsError, setUserTenantsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Selection & Email States
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

  const [isSingleEmailModalOpen, setIsSingleEmailModalOpen] = useState(false);
  const [singleEmailUser, setSingleEmailUser] = useState<User | null>(null);
  const [singleSubject, setSingleSubject] = useState("");
  const [singleMessage, setSingleMessage] = useState("");

  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");

  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showEmailError, setShowEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState("");

  const [sendingSingle, setSendingSingle] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        setUsers((res.data || []).sort((a: User, b: User) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phoneNumber && user.phoneNumber.includes(searchTerm));

      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesRole = roleFilter === "all" || user.user_role.roleName === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  // Safety reset if current page is invalid after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const formatDate = (date: string | null) =>
    date
      ? new Date(date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const getTenantOwnerId = (tenant: any) => {
    const candidate =
      tenant?.userId ??
      tenant?.user_id ??
      tenant?.ownerId ??
      tenant?.owner_id ??
      tenant?.createdBy ??
      tenant?.created_by ??
      tenant?.user?.id ??
      tenant?.owner?.id;
    const num = Number(candidate);
    return Number.isFinite(num) ? num : null;
  };

  const statusBadgeColor = (status: User["status"]) => {
    switch (status) {
      case "active": return "success";
      case "pending": return "secondary";
      case "suspended": return "error";
      case "inactive": return "warning";
      default: return "secondary";
    }
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "info";
      case "USER": return "success";
      default: return "secondary";
    }
  };

  const statusTabs = useMemo(
    () => [
      { key: "all", label: "All", count: users.length },
      { key: "active", label: "Active", count: users.filter((u) => u.status === "active").length },
      { key: "pending", label: "Pending", count: users.filter((u) => u.status === "pending").length },
      { key: "suspended", label: "Suspended", count: users.filter((u) => u.status === "suspended").length },
      { key: "inactive", label: "Inactive", count: users.filter((u) => u.status === "inactive").length },
    ],
    [users]
  );

  const openModal = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setUserTenants([]);
    setUserTenantsError(null);
    document.body.style.overflow = "unset";
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUserTenants = async (userId: number) => {
      setUserTenantsLoading(true);
      setUserTenantsError(null);
      try {
        const res = await api.get("/tenants", { params: { userId } });
        if (!isMounted) return;
        const data = res.data || [];
        const filtered = data.filter((tenant: any) => getTenantOwnerId(tenant) === userId);
        setUserTenants(filtered);
      } catch (err: any) {
        if (!isMounted) return;
        setUserTenants([]);
        setUserTenantsError(err?.response?.data?.message || "Failed to load businesses for this user");
      } finally {
        if (isMounted) {
          setUserTenantsLoading(false);
        }
      }
    };

    if (isModalOpen && selectedUser?.id) {
      fetchUserTenants(selectedUser.id);
    }

    return () => {
      isMounted = false;
    };
  }, [isModalOpen, selectedUser?.id]);

  const ViewButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="
        relative inline-flex items-center justify-center
        rounded-md bg-[#1F6F43]
        px-3 py-1.5 text-xs font-medium text-white
        shadow-sm transition-all duration-200
        hover:bg-[#084d93] hover:-translate-y-[1px] hover:shadow-md
        active:translate-y-0
      "
    >
      View
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 hover:translate-x-full" />
    </button>
  );

  const handleStatusChange = async (userId: number, newStatus: User["status"]) => {
    try {
      await api.patch(`/users/${userId}/status`, { status: newStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update user status");
    }
  };

  const getPlanName = (planId: number | null) => {
    const plans: Record<number, string> = { 1: "Starter", 2: "Professional", 3: "Enterprise" };
    return planId ? plans[planId] || `Plan ${planId}` : "No Plan";
  };

  const toggleUserSelection = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    newSelected.has(userId) ? newSelected.delete(userId) : newSelected.add(userId);
    setSelectedUsers(newSelected);
  };

  const selectAll = () => {
    setSelectedUsers(
      selectedUsers.size === paginatedUsers.length
        ? new Set()
        : new Set(paginatedUsers.map(u => u.id))
    );
  };

  const openSingleEmailModal = (user: User) => {
    setSingleEmailUser(user);
    setSingleSubject(`Hello ${user.firstName} ${user.lastName}`);
    setSingleMessage(`Dear ${user.firstName},\n\n`);
    setIsSingleEmailModalOpen(true);
  };

  const handleSendSingleEmail = async () => {
    if (!singleSubject.trim() || !singleMessage.trim()) {
      setEmailErrorMessage("Please provide subject and message.");
      setShowEmailError(true);
      return;
    }

    setSendingSingle(true);
    try {
      await api.post(`/users/${singleEmailUser?.id}/send-email`, {
        subject: singleSubject,
        message: singleMessage,
      });

      setSuccessMessage("Email sent successfully!");
      setShowEmailSuccess(true);
      setIsSingleEmailModalOpen(false);
      setSingleSubject("");
      setSingleMessage("");
    } catch (err: any) {
      setEmailErrorMessage(err?.response?.data?.message || "Failed to send email.");
      setShowEmailError(true);
    } finally {
      setSendingSingle(false);
    }
  };

  const openBulkEmailModal = () => {
    if (filteredUsers.length === 0) {
      setEmailErrorMessage("No users to email.");
      setShowEmailError(true);
      return;
    }

    setBulkSubject("");
    setBulkMessage("Dear Users,\n\n");
    setIsBulkEmailModalOpen(true);
  };

  const handleSendBulkEmail = async () => {
    if (!bulkSubject.trim() || !bulkMessage.trim()) {
      setEmailErrorMessage("Please provide subject and message.");
      setShowEmailError(true);
      return;
    }

    const userIds = selectedUsers.size > 0
      ? Array.from(selectedUsers)
      : filteredUsers.map(u => u.id);

    setSendingBulk(true);
    try {
      await api.post("/users/broadcast-email", {
        userIds,
        subject: bulkSubject,
        message: bulkMessage,
      });

      setSuccessMessage(`Email broadcast sent to ${userIds.length} user(s)!`);
      setShowEmailSuccess(true);
      setIsBulkEmailModalOpen(false);
      setBulkSubject("");
      setBulkMessage("");
      setSelectedUsers(new Set());
    } catch (err: any) {
      setEmailErrorMessage(err?.response?.data?.message || "Failed to send broadcast.");
      setShowEmailError(true);
    } finally {
      setSendingBulk(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="space-y-3 px-2 py-3 md:px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Icon src={ChevronLeftIcon} className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Users Management
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total: <span className="font-medium">{filteredUsers.length}</span> user{filteredUsers.length !== 1 ? "s" : ""}
            </div>
            {filteredUsers.length > 0 && (
              <Button
                onClick={openBulkEmailModal}
                className="!bg-[#1F6F43] hover:!bg-[#084d93] flex items-center gap-2 w-full sm:w-auto"
              >
                <Icon src={MailIcon} className="w-4 h-4" />
                {selectedUsers.size > 0 ? `Email Selected (${selectedUsers.size})` : "Broadcast Email"}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  isActive
                    ? "border-[#1F6F43] bg-[#1F6F43]/10 text-[#1F6F43]"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/[0.12] dark:bg-white/[0.02] dark:text-gray-300 dark:hover:bg-white/[0.05]"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    isActive
                      ? "bg-[#1F6F43]/15 text-[#1F6F43]"
                      : "bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STUDENT">Student</option>
              <option value="STUDENT">Teacher</option>
              <option value="STUDENT">Parent</option>
            </select>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-2">
          {loading ? (
            <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">Loading users…</div>
          ) : error ? (
            <div className="text-center py-6 text-sm text-red-600">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">No users found.</div>
          ) : (
            <>
              {paginatedUsers.map((user) => (
                <div
                  key={user.id}
                  className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded mt-1"
                      />
                      <div className="w-10 h-10 rounded-full bg-[#1F6F43]/10 dark:bg-[#1F6F43]/20 flex items-center justify-center text-sm font-semibold text-[#1F6F43]">
                        {user.firstName ? user.firstName[0].toUpperCase() : "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                          {user.otherNames && <span className="text-xs text-gray-500"> ({user.otherNames})</span>}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2 border-gray-200 dark:border-white/[0.08]">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Role</span>
                      <div className="mt-1">
                        <Badge color={roleBadgeColor(user.user_role.roleName)} size="sm">
                          {user.user_role.roleName}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <div className="mt-1">
                        <Badge color={statusBadgeColor(user.status)} size="sm">
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Phone</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{user.phoneNumber || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created</span>
                      <p className="font-medium text-xs text-gray-900 dark:text-gray-100">{formatDate(user.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-white/[0.08]">
                    <ViewButton onClick={() => openModal(user)} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSingleEmailModal(user)}
                      className="flex items-center gap-1"
                    >
                      <Icon src={MailIcon} className="w-3 h-3" />
                      Email
                    </Button>
                  </div>
                </div>
              ))}

              {/* Mobile Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-3 mt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap justify-center">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      ← Prev
                    </button>

                    <div className="flex items-center gap-2">
                      <label htmlFor="mobile-page-select" className="text-sm whitespace-nowrap">Page:</label>
                      <select
                        id="mobile-page-select"
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                        className="min-w-[80px] px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
                      >
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <option key={page} value={page}>
                            {page}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm text-gray-500">of {totalPages}</span>
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="w-12 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={selectAll}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</TableCell>
                  <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</TableCell>
                  <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</TableCell>
                  <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</TableCell>
                  <TableCell isHeader className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Loading users…</TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={6} className="px-4 py-4 text-center text-sm text-red-600">{error}</TableCell></TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No users found.</TableCell></TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <TableCell className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1F6F43]/10 dark:bg-[#1F6F43]/20 flex items-center justify-center text-xs font-semibold text-[#1F6F43]">
                            {user.firstName ? user.firstName[0].toUpperCase() : "?"}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white block">
                              {user.firstName} {user.lastName}
                            </span>
                            {user.otherNames && <span className="text-xs text-gray-500 dark:text-gray-400 block">({user.otherNames})</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-600 dark:text-gray-400">{user.email}</div>
                          {user.phoneNumber && <div className="text-xs text-gray-500 dark:text-gray-400">{user.phoneNumber}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge color={roleBadgeColor(user.user_role.roleName)} size="sm">
                          {user.user_role.roleName}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ViewButton onClick={() => openModal(user)} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSingleEmailModal(user)}
                            className="flex items-center gap-1"
                          >
                            <Icon src={MailIcon} className="w-3 h-3" />
                            Email
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Desktop Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-white/[0.08] gap-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
              </p>

              <div className="flex items-center gap-3 order-1 sm:order-2 flex-wrap justify-center sm:justify-end">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-xs disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  <label htmlFor="desktop-page-select" className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap hidden sm:block">
                    Go to page:
                  </label>
                  <select
                    id="desktop-page-select"
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="min-w-[90px] px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <option key={page} value={page}>
                        {page}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">of {totalPages}</span>
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-xs disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                User Details
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-[#1F6F43]/10 dark:bg-[#1F6F43]/20 flex items-center justify-center text-3xl font-bold text-[#1F6F43]">
                  {selectedUser.firstName ? selectedUser.firstName[0].toUpperCase() : "?"}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  {selectedUser.otherNames && (
                    <p className="text-sm text-gray-500 mt-1">({selectedUser.otherNames})</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3">
                    <Badge color={roleBadgeColor(selectedUser.user_role.roleName)} size="md">
                      {selectedUser.user_role.roleName}
                    </Badge>
                    <Badge color={statusBadgeColor(selectedUser.status)} size="md">
                      {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                    </Badge>
                    {selectedUser.email_verified_at ? (
                      <Badge color="success" size="md">Email Verified</Badge>
                    ) : (
                      <Badge color="secondary" size="md">Email Not Verified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    User ID: #{selectedUser.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                      <p className="font-medium break-all">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                      <p className="font-medium">{selectedUser.phoneNumber || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Account Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
                      <p className="font-medium">{getPlanName(selectedUser.currentPlan)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Role ID</p>
                      <p className="font-medium">{selectedUser.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <div className="flex items-center gap-2">
                        <Badge color={statusBadgeColor(selectedUser.status)}>
                          {selectedUser.status}
                        </Badge>
                        <select
                          value={selectedUser.status}
                          onChange={(e) => handleStatusChange(selectedUser.id, e.target.value as User["status"])}
                          className="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Verification Timeline
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email Verified</p>
                      <p className="font-medium">{formatDate(selectedUser.email_verified_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">OTP Expires</p>
                      <p className="font-medium">{formatDate(selectedUser.otp_expires_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                    Account Timeline
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Created Date</p>
                      <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                      <p className="font-medium">{formatDate(selectedUser.updated_at)}</p>
                    </div>
                    {selectedUser.deleted_at && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Deleted Date</p>
                        <p className="font-medium">{formatDate(selectedUser.deleted_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Businesses
                </h4>
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/[0.08]">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-white/[0.04]">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Business
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {userTenantsLoading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                            Loading businesses...
                          </td>
                        </tr>
                      ) : userTenantsError ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-center text-xs text-red-600">
                            {userTenantsError}
                          </td>
                        </tr>
                      ) : userTenants.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                            No businesses found for this user.
                          </td>
                        </tr>
                      ) : (
                        userTenants.map((tenant) => (
                          <tr key={tenant.schoolId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {tenant.tenantName}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {tenant.tenantEmail || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <Badge color={tenant.status === "active" ? "success" : "error"} size="sm">
                                {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {formatDate(tenant.created_at)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Email Modal */}
      {isSingleEmailModalOpen && singleEmailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
              Send Email to {singleEmailUser.firstName} {singleEmailUser.lastName}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={singleSubject}
                  onChange={(e) => setSingleSubject(e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={singleMessage}
                  onChange={(e) => setSingleMessage(e.target.value)}
                  rows={8}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsSingleEmailModalOpen(false)} disabled={sendingSingle}>
                Cancel
              </Button>
              <Button
                onClick={handleSendSingleEmail}
                disabled={sendingSingle || !singleSubject.trim() || !singleMessage.trim()}
                className="!bg-[#1F6F43]"
              >
                {sendingSingle ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Email Modal */}
      {isBulkEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedUsers.size > 0
                ? `Broadcast to ${selectedUsers.size} Selected User(s)`
                : "Broadcast Email to All Filtered Users"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={bulkSubject}
                  onChange={(e) => setBulkSubject(e.target.value)}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder="Enter subject..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  rows={8}
                  className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsBulkEmailModalOpen(false)} disabled={sendingBulk}>
                Cancel
              </Button>
              <Button
                onClick={handleSendBulkEmail}
                disabled={sendingBulk || !bulkSubject.trim() || !bulkMessage.trim()}
                className="!bg-[#1F6F43]"
              >
                {sendingBulk ? "Sending..." : "Send Broadcast"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modals */}
      <EmailSuccessModal isOpen={showEmailSuccess} message={successMessage} onClose={() => setShowEmailSuccess(false)} />
      <EmailErrorModal isOpen={showEmailError} message={emailErrorMessage} onClose={() => setShowEmailError(false)} />
    </div>
  );
}