"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeftIcon } from "@/icons";
import Icon from "@/components/Icons";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";

type ExamStatus = "Upcoming" | "Running" | "Ended" | "Cancelled";

interface DashboardStatsResponse {
  totalExams: number;
  runningNow: number;
  pendingGrading: number;
  avgCompletionRate: number | null;
}

interface Exam {
  id: number;
  title: string;
  courseCode: string;
  startTime: string;
  durationMinutes: number;
  totalCandidates: number;
  status: ExamStatus;
  startedCount?: number;
  completedCount?: number;
  pendingGrading?: number;
  createdAt?: string | null;
}

interface ExamsResponse {
  exams: Exam[];
}

export default function CBTDashboardHome() {
  const router = useRouter();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    totalCreated: 0,
    runningNow: 0,
    pendingGrading: 0,
    avgCompletion: "—",
  });

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchDashboardData = async (showToast = false) => {
    try {
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [statsRes, examsRes] = await Promise.all([
        api.get<DashboardStatsResponse>("/cbt/stats"),
        api.get<ExamsResponse>("/cbt/exams", {
          params: {
            limit: 20,
            sort: "startTime,desc",
          },
        }),
      ]);

      const statsData = statsRes.data;
      const examsData = examsRes.data;

      setStats({
        totalCreated: statsData?.totalExams ?? 0,
        runningNow: statsData?.runningNow ?? 0,
        pendingGrading: statsData?.pendingGrading ?? 0,
        avgCompletion:
          statsData?.avgCompletionRate != null
            ? `${Math.round(statsData.avgCompletionRate * 100)}%`
            : "—",
      });

      setExams(examsData?.exams ?? []);

      if (showToast) {
        toast({
          title: "Success",
          description: "Dashboard refreshed",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load CBT dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesStatus =
        filterStatus === "all" || exam.status === filterStatus;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        exam.title.toLowerCase().includes(q) ||
        (exam.courseCode || "").toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [exams, filterStatus, searchQuery]);

  const quickActions = [
    {
      label: "Create Exam",
      icon: PlusCircle,
      variant: "default" as const,
      className:
        "bg-[#1F6F43] hover:bg-[#1F6F43]/90 text-white h-14 text-lg",
      onClick: () => router.push("/dashboard/admin/create-cbt"),
    },
    {
      label: "Add Questions",
      icon: FileText,
      variant: "outline" as const,
      className: "h-14 text-lg",
      onClick: () =>
        toast({
          title: "Info",
          description: "Question bank view is not connected yet.",
        }),
    },
    {
      label: "Monitor Live Exams",
      icon: Clock,
      variant: "secondary" as const,
      className: "h-14 text-lg",
      onClick: () =>
        toast({
          title: "Info",
          description: "Live monitoring view is not connected yet.",
        }),
    },
  ];

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      <div className="space-y-8 px-4 py-8 md:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <Icon src={ChevronLeftIcon} className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              CBT Dashboard
            </h1>
          </div>

          <Button
            onClick={() => fetchDashboardData(true)}
            variant="outline"
            size="icon"
            disabled={loading || refreshing}
          >
            <RefreshCw
              className={cn(
                "h-5 w-5",
                (loading || refreshing) && "animate-spin"
              )}
            />
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-indigo-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Total Exams Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCreated}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Exams Running Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                {stats.runningNow}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pending Grading / Sync
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                {stats.pendingGrading}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Average Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgCompletion}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Start creating or managing exams instantly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant}
                  className={cn("justify-start gap-3", action.className)}
                  onClick={action.onClick}
                >
                  <action.icon className="h-6 w-6" />
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Exams ({filteredExams.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search exam or code..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Running">Running</SelectItem>
                  <SelectItem value="Ended">Ended</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                No exams found matching your filters.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>Candidates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">
                          <div>{exam.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {exam.courseCode || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Duration: {exam.durationMinutes} mins
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {exam.startTime
                              ? new Date(exam.startTime).toLocaleString([], {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "—"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>{exam.totalCandidates}</div>
                          {(exam.startedCount != null ||
                            exam.completedCount != null) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Started: {exam.startedCount ?? 0} · Completed:{" "}
                              {exam.completedCount ?? 0}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              exam.status === "Running"
                                ? "default"
                                : exam.status === "Upcoming"
                                  ? "secondary"
                                  : exam.status === "Ended"
                                    ? "outline"
                                    : "destructive"
                            }
                            className={
                              exam.status === "Running"
                                ? "bg-[#1F6F43] hover:bg-[#1F6F43]/90 text-white"
                                : undefined
                            }
                          >
                            {exam.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-[#1F6F43] hover:bg-[#1F6F43]/90 text-white"
                            onClick={() =>
  router.push(`/dashboard/admin/cbt-monitor?examId=${exam.id}`)
}
                          >
                            Monitor
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/admin/cbt-builder?examId=${exam.id}`)
                            }
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}