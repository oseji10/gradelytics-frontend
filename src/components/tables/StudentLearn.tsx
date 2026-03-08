"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  BookOpen,
  Brain,
  FileText,
  GraduationCap,
  LogOut,
  TimerReset,
  Trophy,
  TrendingUp,
  UserCircle2,
  ClipboardList,
  PlayCircle,
  Target,
  Clock3,
  ChevronRight,
  Lock,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────
interface SchoolInfo {
  name: string;
  logoUrl?: string | null;
}

interface StudentProfile {
  studentId: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  className?: string | null;
  admissionNumber?: string | null;
  avatarUrl?: string | null;
}

interface ActiveExam {
  id: number | string;
  title: string;
  subject: string;
  durationMinutes: number;
  totalQuestions: number;
  status: "not_started" | "in_progress" | "completed";
  examType: "school" | "waec" | "jamb";
  startUrl?: string;
  resumeUrl?: string;
}

interface SubjectPerformance {
  subject: string;
  accuracy: number;
  attempts: number;
}

interface PracticeAnalytics {
  overallAccuracy: number;
  totalPracticeSessions: number;
  totalQuestionsAnswered: number;
  weeklyStudyMinutes: number;
  strengths: string[];
  weakAreas: string[];
  subjectPerformance: SubjectPerformance[];
}

interface ResourceItem {
  id: number | string;
  title: string;
  type: "pdf" | "note" | "video" | "syllabus" | "past_question";
  subject?: string;
  href: string;
}

interface RecentActivityItem {
  id: number | string;
  title: string;
  description?: string;
  type: "exam" | "practice" | "resource";
  timestamp?: string;
}

interface DashboardPayload {
  schoolName?: string;
  schoolLogo?: string | null;
  student?: {
    studentId?: number;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    className?: string | null;
    admissionNumber?: string | null;
    avatarUrl?: string | null;
  };
  activeExams?: ActiveExam[];
  waecSubjects?: string[];
  jambSubjects?: string[];
  analytics?: Partial<PracticeAnalytics>;
  resources?: ResourceItem[];
  recentActivity?: RecentActivityItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────
function greetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getAccuracyTone(accuracy: number) {
  if (accuracy >= 80) return "Excellent";
  if (accuracy >= 70) return "Strong";
  if (accuracy >= 60) return "Good";
  if (accuracy >= 50) return "Fair";
  return "Needs Work";
}

function getExamTypeLabel(type: ActiveExam["examType"]) {
  if (type === "school") return "School CBT";
  if (type === "waec") return "WAEC Practice";
  return "JAMB CBT";
}

function getResourceTypeLabel(type: ResourceItem["type"]) {
  switch (type) {
    case "pdf":
      return "PDF";
    case "note":
      return "Note";
    case "video":
      return "Video";
    case "syllabus":
      return "Syllabus";
    case "past_question":
      return "Past Question";
    default:
      return "Resource";
  }
}

function formatTimestamp(ts?: string) {
  if (!ts) return "Recently";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString();
}

function buildAIInsight(
  fullName: string,
  analytics: PracticeAnalytics,
  activeExams: ActiveExam[]
) {
  const firstName = fullName.split(" ")[0] || "Student";
  const tone = getAccuracyTone(analytics.overallAccuracy);

  let message = `${firstName}, your current practice performance is **${tone}** with an overall accuracy of **${analytics.overallAccuracy}%**. `;

  if (analytics.strengths.length > 0) {
    message += `Your strongest areas right now are **${analytics.strengths.slice(0, 2).join("** and **")}**. `;
  }

  if (analytics.weakAreas.length > 0) {
    message += `You should focus more on **${analytics.weakAreas.slice(0, 2).join("** and **")}**. `;
  }

  if (analytics.weeklyStudyMinutes > 0) {
    message += `You have logged **${analytics.weeklyStudyMinutes} minutes** of study this week. `;
  }

  const pending = activeExams.filter(
    (exam) => exam.status === "not_started" || exam.status === "in_progress"
  ).length;

  if (pending > 0) {
    message += `You currently have **${pending} active test${pending > 1 ? "s" : ""}** available.`;
  } else {
    message += `No active tests are waiting for you right now, so this is a good time to practice weak areas.`;
  }

  return message;
}

// ── Main Component ───────────────────────────────────────────────────────
export default function StudentLearnDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [activeExams, setActiveExams] = useState<ActiveExam[]>([]);
  const [waecSubjects, setWaecSubjects] = useState<string[]>([]);
  const [jambSubjects, setJambSubjects] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<PracticeAnalytics | null>(null);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/student/dashboard`,
          {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.replace("/student?reason=session_expired");
            return;
          }
          throw new Error("Failed to load student dashboard");
        }

        const data: DashboardPayload = await res.json();

        setSchoolInfo({
          name: data.school?.schoolName || "Your School",
          logoUrl: data.school?.schoolLogo
            ? `${process.env.NEXT_PUBLIC_API_URL}/${data.schoolLogo}`
            : null,
        });

        setStudent({
          studentId: data.student?.studentId || 0,
          fullName: data.student?.fullName || "Student",
          firstName: data.student?.firstName || data.student?.fullName?.split(" ")[0] || "Student",
          lastName: data.student?.lastName,
          className: data.student?.className || null,
          admissionNumber: data.student?.admissionNumber || null,
          avatarUrl: data.student?.avatarUrl || null,
        });

        setActiveExams(data.activeExams || []);
        setWaecSubjects(
          data.waecSubjects || [
            "Mathematics",
            "English Language",
            "Biology",
            "Chemistry",
            "Physics",
            "Economics",
          ]
        );
        setJambSubjects(
          data.jambSubjects || [
            "Use of English",
            "Mathematics",
            "Biology",
            "Chemistry",
          ]
        );

        setAnalytics({
          overallAccuracy: Number(data.analytics?.overallAccuracy ?? 0),
          totalPracticeSessions: Number(data.analytics?.totalPracticeSessions ?? 0),
          totalQuestionsAnswered: Number(data.analytics?.totalQuestionsAnswered ?? 0),
          weeklyStudyMinutes: Number(data.analytics?.weeklyStudyMinutes ?? 0),
          strengths: data.analytics?.strengths || [],
          weakAreas: data.analytics?.weakAreas || [],
          subjectPerformance: data.analytics?.subjectPerformance || [],
        });

        setResources(data.resources || []);
        setRecentActivity(data.recentActivity || []);
      } catch (err) {
        console.error("Student dashboard load error:", err);
        setError("Unable to load dashboard data.");

        // Safe fallback UI data so the page still renders cleanly
        setSchoolInfo({ name: "Your School" });
        setStudent({
          studentId: 0,
          fullName: "Student",
          firstName: "Student",
          className: null,
          admissionNumber: null,
          avatarUrl: null,
        });
        setActiveExams([]);
        setWaecSubjects([
          "Mathematics",
          "English Language",
          "Biology",
          "Chemistry",
        ]);
        setJambSubjects([
          "Use of English",
          "Mathematics",
          "Physics",
          "Chemistry",
        ]);
        setAnalytics({
          overallAccuracy: 0,
          totalPracticeSessions: 0,
          totalQuestionsAnswered: 0,
          weeklyStudyMinutes: 0,
          strengths: [],
          weakAreas: [],
          subjectPerformance: [],
        });
        setResources([]);
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [router]);

  const aiInsight = useMemo(() => {
    if (!student || !analytics) return "";
    return buildAIInsight(student.fullName, analytics, activeExams);
  }, [student, analytics, activeExams]);

  const pendingExams = activeExams.filter(
    (exam) => exam.status === "not_started" || exam.status === "in_progress"
  );

  const completedExams = activeExams.filter((exam) => exam.status === "completed");

  if (loading) return <DashboardSkeleton />;

  if (!student || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md text-center p-8 rounded-2xl shadow-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Dashboard unavailable</h2>
          <p className="text-muted-foreground">
            We could not load the student learning dashboard.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top hero */}
        <Card className="border-green-100 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 px-6 py-8 text-white">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 ring-4 ring-white/20">
                    <AvatarFallback className="text-2xl font-bold bg-white text-green-700">
                      {student.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="text-sm text-white/80">{greetingByTime()}</p>
                    <h1 className="text-3xl font-bold tracking-tight">
                      {student.firstName } {student.lastName}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/90">
                      <Badge className="bg-white/15 hover:bg-white/15 border border-white/20 text-white">
                        {student.className || "Class not assigned"}
                      </Badge>
                      {student.admissionNumber && (
                        <Badge className="bg-white/15 hover:bg-white/15 border border-white/20 text-white">
                          {student.admissionNumber}
                        </Badge>
                      )}
                      {/* <Badge className="bg-white/15 hover:bg-white/15 border border-white/20 text-white">
                        {schoolInfo?.name || "Your School"}
                      </Badge> */}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="/student/dashboard/cbt">
                    <Button className="bg-white text-green-700 hover:bg-green-50 rounded-xl">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Start Learning
                    </Button>
                  </Link>

                  {/* <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 hover:text-white rounded-xl"
                    onClick={() => router.push("/student/logout")}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button> */}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 p-6 bg-white">
              <QuickStatCard
                icon={<ClipboardList className="h-5 w-5 text-green-600" />}
                label="Active Tests"
                value={String(pendingExams.length)}
                hint="School, WAEC, JAMB"
              />
              <QuickStatCard
                icon={<Target className="h-5 w-5 text-green-600" />}
                label="Practice Accuracy"
                value={`${analytics.overallAccuracy}%`}
                hint={getAccuracyTone(analytics.overallAccuracy)}
              />
              <QuickStatCard
                icon={<Brain className="h-5 w-5 text-green-600" />}
                label="Questions Answered"
                value={String(analytics.totalQuestionsAnswered)}
                hint={`${analytics.totalPracticeSessions} sessions`}
              />
              <QuickStatCard
                icon={<Clock3 className="h-5 w-5 text-green-600" />}
                label="Study This Week"
                value={`${analytics.weeklyStudyMinutes} mins`}
                hint="Learning time"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm rounded-2xl">
            <CardContent className="py-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Some dashboard data could not be loaded.</p>
                <p className="text-sm text-amber-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <ActionCard
            title="School CBT"
            description="Write scheduled school tests and exams."
            icon={<GraduationCap className="h-6 w-6 text-green-700" />}
            href="/student/dashboard/cbt"
            badge={`${pendingExams.filter((e) => e.examType === "school").length} available`}
          />
          <ActionCard
            title="WAEC Practice"
            description="Practice WAEC-style past questions by subject."
            icon={<BookOpen className="h-6 w-6 text-green-700" />}
            href="/student/waec"
            badge={`${waecSubjects.length} subjects`}
          />
          <ActionCard
            title="JAMB CBT"
            description="Simulate the real JAMB CBT experience."
            icon={<TimerReset className="h-6 w-6 text-green-700" />}
            href="/student/jamb"
            badge={`${jambSubjects.length} subjects`}
          />
          <ActionCard
            title="Study Resources"
            description="Access notes, syllabus, PDFs, and learning materials."
            icon={<FileText className="h-6 w-6 text-green-700" />}
            href="/student/resources"
            badge={`${resources.length} resources`}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Insight */}
            <Card className="border-green-100 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white pb-3">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Brain className="h-6 w-6 text-green-600" />
                  Gradelytics Learn Insight
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <p className="text-base leading-relaxed text-gray-800 whitespace-pre-line">
                  {aiInsight}
                </p>
              </CardContent>
            </Card>

            {/* Active exams */}
            <Card className="border-green-100 shadow-md rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-xl">Available Tests</CardTitle>
                  <Link href="/student/cbt">
                    <Button variant="outline" className="rounded-xl">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingExams.length === 0 ? (
                  <EmptyState
                    icon={<ClipboardList className="h-8 w-8 text-muted-foreground" />}
                    title="No active tests right now"
                    description="Use this time to practice WAEC or JAMB questions."
                  />
                ) : (
                  pendingExams.map((exam) => {
                    const actionHref =
                      exam.status === "in_progress"
                        ? exam.resumeUrl || "/student/cbt"
                        : exam.startUrl || "/student/cbt";

                    return (
                      <div
                        key={exam.id}
                        className="border rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                              <Badge variant="outline">{getExamTypeLabel(exam.examType)}</Badge>
                              <Badge
                                className={
                                  exam.status === "in_progress"
                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                    : "bg-green-100 text-green-800 border-green-200"
                                }
                              >
                                {exam.status === "in_progress" ? "In Progress" : "Not Started"}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span>{exam.subject}</span>
                              <span>{exam.totalQuestions} questions</span>
                              <span>{exam.durationMinutes} mins</span>
                            </div>
                          </div>

                          <Link href={actionHref}>
                            <Button className="rounded-xl bg-green-700 hover:bg-green-800 w-full md:w-auto">
                              {exam.status === "in_progress" ? "Resume Test" : "Start Test"}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* WAEC and JAMB subject access */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-green-100 shadow-md rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    WAEC Practice
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {waecSubjects.slice(0, 8).map((subject) => (
                      <Badge
                        key={subject}
                        variant="outline"
                        className="px-3 py-1 bg-green-50 border-green-200"
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                  <Link href="/student/waec">
                    <Button className="w-full rounded-xl bg-green-700 hover:bg-green-800">
                      Open WAEC Practice
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-green-100 shadow-md rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TimerReset className="h-5 w-5 text-green-600" />
                    JAMB Simulation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {jambSubjects.slice(0, 8).map((subject) => (
                      <Badge
                        key={subject}
                        variant="outline"
                        className="px-3 py-1 bg-green-50 border-green-200"
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                  <Link href="/student/jamb">
                    <Button className="w-full rounded-xl bg-green-700 hover:bg-green-800">
                      Open JAMB CBT
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Practice analytics */}
            <Card className="border-green-100 shadow-md rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  Practice Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {analytics.subjectPerformance.length === 0 ? (
                  <EmptyState
                    icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
                    title="No analytics yet"
                    description="Once the student starts practicing, subject accuracy will appear here."
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InsightList
                        title="Strong Topics"
                        items={analytics.strengths}
                        tone="success"
                      />
                      <InsightList
                        title="Needs Focus"
                        items={analytics.weakAreas}
                        tone="warning"
                      />
                    </div>

                    <div className="space-y-4">
                      {analytics.subjectPerformance.map((item) => (
                        <div key={item.subject} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-800">{item.subject}</span>
                            <span className="text-muted-foreground">
                              {item.accuracy}% • {item.attempts} attempts
                            </span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                              style={{ width: `${Math.max(0, Math.min(100, item.accuracy))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Student access policy */}
            <Card className="border-amber-200 bg-amber-50 shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                  <Lock className="h-5 w-5" />
                  Results Access
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-800 space-y-3">
                <p>
                  Official school results are not available on the student dashboard.
                </p>
                <p>
                  Parents or guardians should use the result checker portal to view report cards and published results.
                </p>
              </CardContent>
            </Card>

            {/* Study resources */}
            <Card className="border-green-100 shadow-md rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Study Resources</CardTitle>
                  <Link href="/student/resources">
                    <Button variant="ghost" size="sm" className="rounded-xl">
                      See all
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {resources.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="h-8 w-8 text-muted-foreground" />}
                    title="No resources yet"
                    description="Resources uploaded by the school will appear here."
                  />
                ) : (
                  resources.slice(0, 5).map((resource) => (
                    <Link
                      key={resource.id}
                      href={resource.href}
                      className="block border rounded-xl p-4 hover:bg-green-50/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{resource.title}</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <Badge variant="outline">{getResourceTypeLabel(resource.type)}</Badge>
                            {resource.subject && (
                              <Badge variant="outline">{resource.subject}</Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card className="border-green-100 shadow-md rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.length === 0 ? (
                  <EmptyState
                    icon={<UserCircle2 className="h-8 w-8 text-muted-foreground" />}
                    title="No recent activity"
                    description="Student actions will appear here after practice begins."
                  />
                ) : (
                  recentActivity.slice(0, 6).map((activity) => (
                    <div
                      key={activity.id}
                      className="border-l-2 border-green-200 pl-4 py-1"
                    >
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Motivation */}
            <Card className="border-green-100 shadow-md rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-green-600" />
                  Motivation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <p>Consistency beats cramming.</p>
                <p>Practice weak topics daily until they become strengths.</p>
                <p>Use WAEC and JAMB simulations to build exam confidence.</p>
                {completedExams.length > 0 && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {completedExams.length} completed test{completedExams.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Small Components ─────────────────────────────────────────────────────
function QuickStatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-gray-50 border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  href,
  badge,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full border-green-100 shadow-md rounded-2xl hover:shadow-lg transition-all hover:-translate-y-0.5">
        <CardContent className="p-6 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="outline">{badge}</Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-gray-50 p-8 text-center">
      <div className="mx-auto mb-3 h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
    </div>
  );
}

function InsightList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "success" | "warning";
}) {
  const isSuccess = tone === "success";

  return (
    <div className="border rounded-2xl p-5 bg-white shadow-sm">
      <p className={`text-sm font-medium mb-3 ${isSuccess ? "text-green-700" : "text-amber-700"}`}>
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge
              key={item}
              variant="outline"
              className={
                isSuccess
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }
            >
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}