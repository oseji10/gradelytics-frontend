// app/support/page.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Button from "../../components/ui/button/Button";
import api from "../../../lib/api";
import { useModal } from "../../../context/ModalContext";

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
  user?: { name: string; email: string };
}

interface CurrentUser {
  role: "admin" | "user";
}

function CreateTicketForm({ onSuccess }: { onSuccess: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { closeModal } = useModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMsg(null);

    try {
      await api.post("/support/tickets", { subject, message });
      setStatus("success");
      setSubject("");
      setMessage("");
      setTimeout(() => {
        onSuccess();
        closeModal();
      }, 800);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.response?.data?.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === "success" && (
        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-center transition-all">
          Ticket created successfully!
        </div>
      )}
      {status === "error" && errorMsg && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-center transition-all">
          {errorMsg}
        </div>
      )}

      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Ticket Subject"
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
        required
      />

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe your issue..."
        rows={5}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
        required
      />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={closeModal}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="!bg-[#1F6F43] !hover:bg-[#084d93]">
          {isSubmitting ? "Sending..." : "Create Ticket"}
        </Button>
      </div>
    </form>
  );
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [replyMessages, setReplyMessages] = useState<{ [key: number]: string }>({});
  const [replyErrors, setReplyErrors] = useState<{ [key: number]: string }>({});
  const [statusFilter, setStatusFilter] = useState<"all" | SupportTicket["status"]>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatClosing, setIsChatClosing] = useState(false);

  const { openModal } = useModal();
  const chatRef = useRef<HTMLDivElement | null>(null);
  const autoFetchInterval = useRef<NodeJS.Timer | null>(null);

  // --- Fetch current user
  const fetchUser = async () => {
    try {
      const res = await api.get("/user");
      setCurrentUser(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch user", err);
      return null;
    }
  };

  // --- Fetch all tickets
  const fetchTickets = async (user?: CurrentUser) => {
    if (!user) return;
    try {
      const endpoint = user.role === "admin" ? "/support/tickets/all" : "/support/tickets";
      const res = await api.get(endpoint);
      setTickets(res.data?.tickets || []);
      if (!selectedTicketId && res.data?.tickets.length > 0) {
        setSelectedTicketId(res.data.tickets[0].ticketId);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    }
  };

  // --- Fetch only replies for the selected ticket
  const fetchRepliesForTicket = async (ticketId: number) => {
    if (!currentUser) return;
    try {
      const endpoint = currentUser.role === "admin" ? "/support/tickets/all" : "/support/tickets";
      const res = await api.get(endpoint);
      const updatedTicket = res.data?.tickets.find((t: SupportTicket) => t.ticketId === ticketId);
      if (!updatedTicket) return;
      setTickets((prev) =>
        prev.map((t) =>
          t.ticketId === ticketId ? { ...t, replies: updatedTicket.replies, status: updatedTicket.status } : t
        )
      );
    } catch (err) {
      console.error("Failed to fetch ticket replies", err);
    }
  };

  // --- Initialize
  useEffect(() => {
    (async () => {
      const user = await fetchUser();
      await fetchTickets(user);
    })();
  }, []);

  // --- Auto-fetch ticket list
  useEffect(() => {
    if (!currentUser) return;
    const intervalId = window.setInterval(() => {
      fetchTickets(currentUser);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [currentUser, selectedTicketId]);

  // --- Auto-fetch only replies for selected ticket
  useEffect(() => {
    if (!selectedTicketId || !currentUser) return;
    autoFetchInterval.current = setInterval(() => {
      fetchRepliesForTicket(selectedTicketId);
    }, 10000);
    return () => {
      if (autoFetchInterval.current) clearInterval(autoFetchInterval.current);
    };
  }, [selectedTicketId, currentUser]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const formatDateLong = (date: string) =>
    new Date(date).toLocaleString("en-US", {
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

  const handleReplyChange = (ticketId: number, value: string) => {
    setReplyMessages((prev) => ({ ...prev, [ticketId]: value }));
    setReplyErrors((prev) => ({ ...prev, [ticketId]: "" }));
  };

  const handleReplySubmit = async (ticketId: number) => {
    const message = replyMessages[ticketId]?.trim();
    if (!message) return;

    try {
      await api.post(`/support/tickets/${ticketId}/reply`, { message });
      setReplyMessages((prev) => ({ ...prev, [ticketId]: "" }));
      setReplyErrors((prev) => ({ ...prev, [ticketId]: "" }));
      await fetchRepliesForTicket(ticketId);
      setTimeout(() => chatRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      setReplyErrors((prev) => ({
        ...prev,
        [ticketId]: err?.response?.data?.message || "Failed to send reply. Try again.",
      }));
    }
  };

  const stats = useMemo(() => {
    const counts = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      in_progress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
    };
    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesTerm =
        !term ||
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

  const selectedTicket = filteredTickets.find((t) => t.ticketId === selectedTicketId) || null;

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
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Support</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">How can we help?</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Get quick answers, track tickets, and stay informed as your requests move forward.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {currentUser?.role !== "admin" ? (
                <Button
                  className="!bg-[#1F6F43] !hover:bg-[#084d93]"
                  onClick={() =>
                    openModal({
                      title: "Create Ticket",
                      content: <CreateTicketForm onSuccess={() => fetchTickets(currentUser)} />,
                    })
                  }
                >
                  Create Ticket
                </Button>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                  Admin accounts manage tickets in Admin Support.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500" htmlFor="ticket-search">
                Search tickets
              </label>
              <input
                id="ticket-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by subject or message"
                className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
              />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Support hours</p>
              <p className="mt-2 font-medium text-gray-900 dark:text-gray-100">Monday to Saturday</p>
              <p className="text-xs text-gray-500">8:00am - 8:00pm (WAT)</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1F6F43]/10 px-3 py-1 text-xs font-semibold text-[#1F6F43]">
                24h response SLA
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total tickets", value: stats.total, accent: "text-gray-900" },
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
                <h2 className="mt-2 text-2xl font-semibold">Your requests</h2>
              </div>
              <div className="text-xs text-gray-500">
                Last sync: {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
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
              {filteredTickets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                  No tickets yet. Start a new request to get help.
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isActive = selectedTicketId === ticket.ticketId;
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
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className={`text-sm font-semibold ${isActive ? "text-[#1F6F43]" : "text-gray-900 dark:text-white"}`}>
                            {ticket.subject}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(ticket.created_at)}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace("_", " ").toUpperCase()}
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
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 transition-opacity ${
            isChatClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeChat}
        >
          <div
            className={`relative flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-[0_20px_60px_rgba(15,23,42,0.18)] transition-all dark:border-white/10 dark:bg-[#0f141b] ${
              isChatClosing ? "translate-y-4 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Conversation</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{selectedTicket.subject}</h3>
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

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
              <div className="flex items-start justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Opened {formatDateLong(selectedTicket.created_at)}
                </p>
                <span className={`rounded-full px-4 py-2 text-xs font-semibold ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div className="flex justify-end">
                <div className="max-w-md">
                  <div className="rounded-xl rounded-tr-sm bg-gradient-to-br from-[#1F6F43] to-[#084d93] px-3 py-1.5 text-[13px] font-medium text-white ring-1 ring-white/15">
                    {selectedTicket.message}
                  </div>
                  <p className="mt-0.5 text-right text-[11px] text-blue-100/95">
                    You • {formatDate(selectedTicket.created_at)}
                  </p>
                </div>
              </div>

              {selectedTicket.replies.map((reply) => (
                <div key={reply.replyId} className={`flex ${reply.is_admin ? "justify-start" : "justify-end"}`}>
                  <div className="max-w-md">
                    <div
                      className={`rounded-xl px-3 py-1.5 text-[13px] font-medium ${
                        reply.is_admin
                          ? "bg-white text-gray-900 ring-1 ring-gray-200/70 dark:bg-white/10 dark:text-white dark:ring-white/10"
                          : "bg-gradient-to-br from-[#1F6F43] to-[#084d93] text-white ring-1 ring-white/15"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                          reply.is_admin ? "text-gray-500 dark:text-gray-300" : "text-blue-100/95"
                        }`}
                      >
                        {reply.is_admin ? "Support" : "You"}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap">{reply.message}</p>
                    </div>
                    <p
                      className={`mt-0.5 text-[11px] ${
                        reply.is_admin ? "text-left text-gray-500" : "text-right text-blue-100/95"
                      }`}
                    >
                      {formatDate(reply.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatRef} />
            </div>

            {(selectedTicket.status === "open" || selectedTicket.status === "in_progress") && (
              <div className="border-t border-gray-200 px-5 py-4 dark:border-white/10">
                <div className="flex flex-col gap-3">
                  <textarea
                    value={replyMessages[selectedTicket.ticketId] || ""}
                    onChange={(e) => handleReplyChange(selectedTicket.ticketId, e.target.value)}
                    rows={2}
                    placeholder="Write your reply with context, steps tried, and desired outcome."
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                  />
                  <div className="flex items-center justify-between">
                    {replyErrors[selectedTicket.ticketId] && (
                      <p className="text-xs text-red-500">{replyErrors[selectedTicket.ticketId]}</p>
                    )}
                    <Button
                      onClick={() => handleReplySubmit(selectedTicket.ticketId)}
                      className="ml-auto !bg-[#1F6F43] !hover:bg-[#084d93]"
                    >
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {(selectedTicket.status === "resolved" || selectedTicket.status === "closed") && (
              <div className="border-t border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200">
                This ticket is {selectedTicket.status.toUpperCase()}. If you still need help, create a new ticket.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
