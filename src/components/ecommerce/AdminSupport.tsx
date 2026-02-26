// app/support/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import ComponentCard from "../common/ComponentCard";
import Button from "../ui/button/Button";
import api from "../../../lib/api";

interface SupportReply {
  replyId: number;
  message: string;
  is_admin: boolean;
  created_at: string;
}

interface SupportTicket {
  ticketId: number;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
  replies: SupportReply[];
  user?: {
    name?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [replyMessages, setReplyMessages] = useState<{ [key: number]: string }>({});
  const [selectedQuickReply, setSelectedQuickReply] = useState("");
  const [statuses, setStatuses] = useState<{ [key: number]: SupportTicket["status"] }>({});
  const [statusFilter, setStatusFilter] = useState<"all" | SupportTicket["status"]>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatClosing, setIsChatClosing] = useState(false);

  const quickReplies = [
    "Thanks for reaching out. We are looking into this and will update you shortly.",
    "Could you share a screenshot or exact error message so we can investigate faster?",
    "We have applied a fix. Please refresh and confirm if the issue is resolved.",
    "This is now resolved on our end. Let us know if you need anything else.",
  ];

  const getFullName = (user: SupportTicket["user"]) => {
    if (!user) return "Unknown Customer";
    if (user.name) return user.name;
    const first = user.firstName?.trim() || "";
    const last = user.lastName?.trim() || "";
    const fullName = [first, last].filter(Boolean).join(" ");
    return fullName || "Unknown Customer";
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await api.get("/support/tickets/all");
      const nextTickets = res.data?.tickets || [];
      setTickets(nextTickets);
      if (nextTickets.length > 0) {
        setSelectedTicketId((prev) => {
          if (prev && nextTickets.some((ticket) => ticket.ticketId === prev)) {
            return prev;
          }
          return nextTickets[0].ticketId;
        });
      } else {
        setSelectedTicketId(null);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchTickets();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status: SupportTicket["status"]) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "resolved":
      case "closed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const handleReplyChange = (ticketId: number, value: string) =>
    setReplyMessages((prev) => ({ ...prev, [ticketId]: value }));

  const handleAutoResize = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 160 ? "auto" : "hidden";
  };

  const handleReplySubmit = async (ticketId: number) => {
    const message = replyMessages[ticketId]?.trim();
    if (!message) return;

    try {
      await api.post(`/support/tickets/${ticketId}/admin-reply`, { message });
      setReplyMessages((prev) => ({ ...prev, [ticketId]: "" }));
      setSelectedQuickReply("");
      fetchTickets();
    } catch (err) {
      alert("Failed to send reply. Please try again.");
    }
  };

  const handleStatusChange = async (ticketId: number, newStatus: SupportTicket["status"]) => {
    try {
      await api.patch(`/support/tickets/${ticketId}/status`, { status: newStatus });
      setStatuses((prev) => ({ ...prev, [ticketId]: newStatus }));
      fetchTickets();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const selectedTicket = tickets.find((t) => t.ticketId === selectedTicketId);

  const conversation = useMemo(() => {
    if (!selectedTicket) return [];
    const baseMessage = {
      key: `ticket-${selectedTicket.ticketId}`,
      isAdmin: false,
      name: getFullName(selectedTicket.user),
      message: selectedTicket.message,
      createdAt: selectedTicket.created_at,
    };
    const replies = selectedTicket.replies.map((reply) => ({
      key: `reply-${reply.replyId}`,
      isAdmin: reply.is_admin,
      name: reply.is_admin ? "Support" : getFullName(selectedTicket.user),
      message: reply.message,
      createdAt: reply.created_at,
    }));

    return [baseMessage, ...replies].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [selectedTicket]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      in_progress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const customerName = getFullName(ticket.user).toLowerCase();
      const matchesTerm =
        !term ||
        customerName.includes(term) ||
        ticket.subject.toLowerCase().includes(term) ||
        ticket.message.toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [tickets, statusFilter, searchTerm]);

  useEffect(() => {
    if (!filteredTickets.length) {
      setSelectedTicketId(null);
      setIsChatOpen(false);
      return;
    }
    if (!selectedTicketId || !filteredTickets.some((t) => t.ticketId === selectedTicketId)) {
      setSelectedTicketId(filteredTickets[0].ticketId);
    }
  }, [filteredTickets, selectedTicketId]);

  useEffect(() => {
    if (!selectedTicketId) setIsChatOpen(false);
  }, [selectedTicketId]);

  const openChat = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatClosing(true);
    window.setTimeout(() => {
      setIsChatOpen(false);
      setIsChatClosing(false);
    }, 200);
  };

  const statusOptions: Array<{ value: "all" | SupportTicket["status"]; label: string }> = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <style jsx>{`
        @keyframes supportFade {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Admin Support</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Support command center</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Monitor queues, respond to customers, and keep every ticket moving.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              Total tickets: <span className="font-semibold text-gray-900 dark:text-white">{stats.total}</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <label
                className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
                htmlFor="admin-ticket-search"
              >
                Search tickets
              </label>
              <input
                id="admin-ticket-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by customer, subject, or message"
                className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
              />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Queue summary</p>
              <p className="mt-2 font-medium text-gray-900 dark:text-gray-100">Active tickets</p>
              <p className="text-xs text-gray-500">Open + In progress: {stats.open + stats.in_progress}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1F6F43]/10 px-3 py-1 text-xs font-semibold text-[#1F6F43]">
                Priority coverage
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total", value: stats.total, accent: "text-gray-900" },
            { label: "Open", value: stats.open, accent: "text-blue-700" },
            { label: "In progress", value: stats.in_progress, accent: "text-amber-700" },
            { label: "Resolved", value: stats.resolved + stats.closed, accent: "text-emerald-700" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{card.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${card.accent} dark:text-white`}>{card.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Ticket inbox</p>
                <h2 className="mt-2 text-2xl font-semibold">Customer requests</h2>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    statusFilter === option.value
                      ? "bg-[#1F6F43] text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-[#1F6F43]/40 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {loadingTickets ? (
                <ComponentCard className="p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">Loading tickets...</p>
                </ComponentCard>
              ) : filteredTickets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                  No tickets match the current filters.
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const currentStatus = statuses[ticket.ticketId] || ticket.status;
                  const isActive = ticket.ticketId === selectedTicketId;
                  const userName = getFullName(ticket.user);
                  const userEmail = ticket.user?.email || "No Email";

                  return (
                    <button
                      key={ticket.ticketId}
                      onClick={() => openChat(ticket.ticketId)}
                      className={`w-full rounded-xl border px-4 py-4 text-left transition-all ${
                        isActive
                          ? "border-[#1F6F43]/40 bg-[#1F6F43]/10"
                          : "border-gray-200 bg-white hover:border-[#1F6F43]/30 dark:border-white/10 dark:bg-white/5"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              isActive ? "text-[#1F6F43]" : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {userName}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{ticket.subject}</p>
                          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{userEmail}</p>
                        </div>
                        <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-auto ${getStatusColor(currentStatus)}`}>
                          {currentStatus.replace("_", " ").charAt(0).toUpperCase() + currentStatus.replace("_", " ").slice(1)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      {isChatOpen && selectedTicket && (
        <div
          className={`fixed inset-0 z-50 flex items-stretch justify-center overflow-y-auto bg-black/40 p-0 transition-opacity sm:items-center sm:px-4 sm:py-6 ${
            isChatClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeChat}
        >
          <div
            className={`relative flex h-full max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none border border-gray-200 bg-white shadow-2xl transition-all dark:border-white/10 dark:bg-[#0f141b] sm:h-auto sm:max-h-[80vh] sm:rounded-2xl ${
              isChatClosing ? "translate-y-4 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3 dark:border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Ticket detail</p>
                <h2 className="mt-2 text-lg font-semibold">{selectedTicket.subject}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {getFullName(selectedTicket.user)} • {selectedTicket.user?.email || "No email"}
                </p>
              </div>
              <button
                onClick={closeChat}
                className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:text-gray-900 dark:border-white/10 dark:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Opened {formatDate(selectedTicket.created_at)}</p>
                <span
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${getStatusColor(
                    statuses[selectedTicket.ticketId] || selectedTicket.status
                  )}`}
                >
                  {(statuses[selectedTicket.ticketId] || selectedTicket.status)
                    .replace("_", " ")
                    .charAt(0)
                    .toUpperCase() +
                    (statuses[selectedTicket.ticketId] || selectedTicket.status).replace("_", " ").slice(1)}
                </span>
              </div>

              {conversation.map((entry) => (
                <MessageBubble
                  key={entry.key}
                  isAdmin={entry.isAdmin}
                  name={entry.name}
                  message={entry.message}
                  createdAt={entry.createdAt}
                />
              ))}
            </div>

            <div className="border-t border-gray-200 px-3 py-3 sm:px-5 sm:py-4 dark:border-white/10">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[140px] flex-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Status
                    </label>
                    <select
                      value={statuses[selectedTicket.ticketId] || selectedTicket.status}
                      onChange={(e) =>
                        handleStatusChange(selectedTicket.ticketId, e.target.value as SupportTicket["status"])
                      }
                      className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  {(statuses[selectedTicket.ticketId] || selectedTicket.status) === "open" ||
                  (statuses[selectedTicket.ticketId] || selectedTicket.status) === "in_progress" ? (
                    <div className="min-w-[160px] flex-1">
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Quick reply
                      </label>
                      <select
                        value={selectedQuickReply}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedQuickReply(value);
                          if (value) {
                            setReplyMessages((prev) => {
                              const current = prev[selectedTicket.ticketId] || "";
                              const nextValue = current ? `${current}\n\n${value}` : value;
                              return { ...prev, [selectedTicket.ticketId]: nextValue };
                            });
                          }
                        }}
                        className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                      >
                        <option value="">Select a reply</option>
                        {quickReplies.map((reply) => (
                          <option key={reply} value={reply}>
                            {reply}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>

                {(statuses[selectedTicket.ticketId] || selectedTicket.status) === "open" ||
                (statuses[selectedTicket.ticketId] || selectedTicket.status) === "in_progress" ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={replyMessages[selectedTicket.ticketId] || ""}
                      onChange={(e) => handleReplyChange(selectedTicket.ticketId, e.target.value)}
                      onInput={handleAutoResize}
                      rows={2}
                      placeholder="Write a clear, actionable reply."
                      className="w-full min-h-[40px] max-h-[160px] resize-none rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-700 focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleReplySubmit(selectedTicket.ticketId)}
                        disabled={!replyMessages[selectedTicket.ticketId]?.trim()}
                        className="px-4 py-2 text-xs sm:px-8 sm:py-3 sm:text-sm !bg-[#1F6F43] !hover:bg-[#084d93] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send Reply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200">
                    This ticket is {(statuses[selectedTicket.ticketId] || selectedTicket.status) === "resolved"
                      ? "resolved"
                      : "closed"}. No further replies can be sent.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  isAdmin: boolean;
  name: string;
  message: string;
  createdAt: string;
}

function MessageBubble({ isAdmin, name, message, createdAt }: MessageBubbleProps) {
  const metaClass = isAdmin ? "text-blue-100/95" : "text-gray-500 dark:text-gray-300";
  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-[13px] font-medium sm:max-w-[70%] ${
          isAdmin
            ? "bg-gradient-to-br from-[#1F6F43] to-[#084d93] text-white ring-1 ring-white/15"
            : "bg-white text-gray-700 ring-1 ring-gray-200/70 dark:bg-white/10 dark:text-gray-100 dark:ring-white/10"
        }`}>
        <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${metaClass}`}>
          {isAdmin ? "Support" : name}
        </p>
        <p className="mt-0.5 whitespace-pre-wrap">{message}</p>
        <p className={`mt-0.5 text-[11px] ${metaClass} ${isAdmin ? "text-right" : "text-left"}`}>
          {new Date(createdAt).toLocaleString("en-US", { hour12: true })}
        </p>
      </div>
    </div>
  );
}
