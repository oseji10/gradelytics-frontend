"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  LogOut,
  TrendingUp,
  Brain,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

// ── Types (matched to real API response) ─────────────────────────────────
interface SubjectResult {
  subject: string;
  total: string;           // comes as string e.g. "74.00"
  grade: string;
}

interface TermResult {
  term: string;
  academicYear: string;
  overallAverage: number;
  overallGrade: string;
  classPosition: string;
  isPublished: boolean;
  publishedAt: string;
  subjects: SubjectResult[];
  attendance: Attendance;
}

interface Child {
  studentId: number;
  schoolAssignedAdmissionNumber: string | null;
  admissionNumber: string | null;
  studentName: string;
  results: TermResult[];
  attendance: Attendance; // overall / fallback attendance
}

interface Attendance {
  percentage: number;
  presentDays: number;
  totalDays: number;
  lateDays: number;
}

interface SchoolInfo {
  name: string;
  logoUrl?: string | null;
}

// ── AI & Analytics Helpers ───────────────────────────────────────────────
function classifyPerformance(avg: number) {
  if (avg >= 85) return "Exceptional";
  if (avg >= 75) return "Strong";
  if (avg >= 65) return "Good";
  if (avg >= 50) return "Fair";
  return "Needs Improvement";
}

function detectTrend(current: number, previous?: number) {
  if (!previous) return null;
  const diff = current - previous;
  if (diff >= 5) return { type: "major_improvement", diff };
  if (diff >= 2) return { type: "improvement", diff };
  if (diff <= -5) return { type: "major_drop", diff };
  if (diff <= -2) return { type: "drop", diff };
  return { type: "stable", diff: 0 };
}

function calculatePercentile(positionStr: string) {
  const [pos, total] = positionStr.split("/").map(s => parseInt(s.trim()) || 1);
  if (total === 0) return 0;
  return Math.round(((total - pos) / total) * 100);
}

function analyzeSubjects(subjects: SubjectResult[]) {
  const strengths = subjects.filter(s => Number(s.total) >= 75).map(s => s.subject);
  const weakAreas = subjects.filter(s => Number(s.total) < 60).map(s => s.subject);
  return { strengths, weakAreas };
}

function calculateConsistency(subjects: SubjectResult[]) {
  const totals = subjects.map(s => Number(s.total));
  const max = Math.max(...totals);
  const min = Math.min(...totals);
  const gap = max - min;
  if (gap <= 10) return "Highly Consistent";
  if (gap <= 20) return "Moderately Consistent";
  return "Performance Variation Detected";
}

function analyzeAttendance(percentage: number) {
  if (percentage >= 95) return "excellent";
  if (percentage >= 85) return "strong";
  if (percentage >= 70) return "moderate";
  return "low";
}

function generateAISummary(
  name: string,
  current: TermResult,
  previous: TermResult | undefined,
  attendance: Attendance
) {
  if (!current.overallAverage) return "No performance data available yet.";

  const firstName = name.split(" ")[0];
  const performance = classifyPerformance(current.overallAverage);
  const trend = detectTrend(current.overallAverage, previous?.overallAverage);
  const { strengths, weakAreas } = analyzeSubjects(current.subjects);
  const consistency = calculateConsistency(current.subjects);
  const attendanceLevel = analyzeAttendance(attendance.percentage);
  const percentile = calculatePercentile(current.classPosition || "0/1");

  let summary = `${firstName} demonstrated **${performance}** academic performance this term with an average of **${current.overallAverage.toFixed(1)}%**. `;

  if (trend) {
    if (trend.type.includes("improvement")) {
      summary += `This reflects an improvement of **${trend.diff.toFixed(1)}%** from last term. `;
    } else if (trend.type.includes("drop")) {
      summary += `There was a decline of **${Math.abs(trend.diff).toFixed(1)}%** compared to last term. `;
    } else {
      summary += `Performance remained stable compared to last term. `;
    }
  }

  summary += `Ranks in the top **${percentile}%** of the class. `;
  summary += `Consistency is **${consistency}**. `;

  if (strengths.length) summary += `Strong in **${strengths.slice(0, 2).join(" & ")}**. `;
  if (weakAreas.length) summary += `Needs focus in **${weakAreas.slice(0, 2).join(" & ")}**. `;

  summary += `Attendance (${attendance.percentage}%) is **${attendanceLevel}**.`;

  return summary;
}

// ── Main Component ───────────────────────────────────────────────────────
export default function ResultCheckerDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [showSubjectTrend, setShowSubjectTrend] = useState<{
    subject: string;
    history: { term: string; score: number }[];
  } | null>(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/result-checker`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.replace("/result-checker/?reason=session_expired");
            return;
          }
          throw new Error("Failed to load dashboard data");
        }

        const data = await res.json();

        // School info
        setSchoolInfo({
          name: data.schoolName || "Your School",
          logoUrl: data.schoolLogo
            ? `${process.env.NEXT_PUBLIC_API_URL}/${data.schoolLogo}`
            : null,
        });

        // Map children
        const mappedChildren = (data.children || []).map((child: any) => ({
          studentId: child.studentId,
          schoolAssignedAdmissionNumber: child.schoolAssignedAdmissionNumber || null,
          admissionNumber: child.admissionNumber || null,
          studentName: child.studentName,
          results: child.results || [],
          attendance: child.attendance || { percentage: 0, presentDays: 0, totalDays: 0, lateDays: 0 },
        }));

        setChildren(mappedChildren);

        // Auto-select first child
        if (mappedChildren.length > 0) {
          setSelectedChildId(mappedChildren[0].studentId);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
        setSchoolInfo({ name: "Your School" });
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [router]);

  const selectedChild = children.find(c => c.studentId === selectedChildId);

  // Most recent published term for selected child
  const displayedResult = useMemo<TermResult | null>(() => {
    if (!selectedChild) return null;
    const published = selectedChild.results.filter(r => r.isPublished);
    if (published.length === 0) return null;
    return published.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )[0];
  }, [selectedChild]);

  const previousResult = useMemo<TermResult | undefined>(() => {
    if (!selectedChild || !displayedResult) return undefined;
    const published = selectedChild.results
      .filter(r => r.isPublished && r.term !== displayedResult.term)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return published[0];
  }, [selectedChild, displayedResult]);

  const aiSummary = useMemo(() => {
    if (!selectedChild || !displayedResult) return "";
    return generateAISummary(
      selectedChild.studentName,
      displayedResult,
      previousResult,
      displayedResult.attendance || { percentage: 0, presentDays: 0, totalDays: 0, lateDays: 0 }
    );
  }, [selectedChild, displayedResult, previousResult]);

  // ── Analytics helpers ──────────────────────────────────────────────────
  const change = previousResult && displayedResult?.overallAverage
    ? (displayedResult.overallAverage - previousResult.overallAverage).toFixed(1)
    : null;
  const isImprovement = change && Number(change) > 0;
  const isBigDrop = change && Number(change) < -5;

  const strengths = displayedResult?.subjects.filter(s => Number(s.total) >= 75).map(s => s.subject) || [];
  const needsAttention = displayedResult?.subjects.filter(s => Number(s.total) < 60).map(s => s.subject) || [];

  const gamificationBadges: string[] = [];
  if (displayedResult?.classPosition?.includes("1st") || displayedResult?.classPosition?.includes("2nd")) {
    gamificationBadges.push("🏆 Top Performer");
  }
  if (isImprovement) gamificationBadges.push("📈 Most Improved");
  if (displayedResult?.attendance.percentage === 100) gamificationBadges.push("📅 Perfect Attendance");

  const teacherRemark = isBigDrop
    ? "Needs extra support in weak areas. Let's schedule a meeting."
    : "Excellent effort. Keep pushing in core subjects.";
  const principalRemark = isBigDrop
    ? "Intervention recommended: extra classes suggested."
    : "Outstanding progress. A role model in the class.";

  const handleSubjectClick = (subjectName: string) => {
    if (!selectedChild) return;
    const history = selectedChild.results
      .filter(r => r.isPublished)
      .map(r => {
        const subj = r.subjects.find(s => s.subject === subjectName);
        return { term: r.term, score: subj ? Number(subj.total) : 0 };
      })
      .filter(h => h.score > 0);
    if (history.length > 0) {
      setShowSubjectTrend({ subject: subjectName, history });
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (!selectedChild || !displayedResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md text-center p-8 rounded-2xl shadow-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No results available</h2>
          <p className="text-muted-foreground">
            No published results found for the selected student.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      {/* Header */}
      {/* <header className="bg-white shadow-md border-b sticky top-0 z-20 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={schoolInfo?.logoUrl || `https://placehold.co/180x60/1F6F43/FFFFFF/png?text=${encodeURIComponent(schoolInfo?.name || "School")}`}
              alt={`${schoolInfo?.name || "School"} Logo`}
              className="h-10 w-auto object-contain drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/180x60/1F6F43/FFFFFF/png?text=${encodeURIComponent(schoolInfo?.name?.slice(0,12) || "School")}`;
              }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {schoolInfo?.name || "Your School"}
              </h1>
              <p className="text-sm text-green-700 font-medium">Powered by Gradelytics</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800 transition-colors"
            onClick={() => router.push("/logout")}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header> */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Child selector */}
        {children.length > 1 && (
          <Card className="border-green-100 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-green-50/50 pb-3">
              <CardTitle className="text-lg">Select Child</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-3">
                {children.map(child => (
                  <Button
                    key={child.studentId}
                    variant={selectedChildId === child.studentId ? "default" : "outline"}
                    className={`flex items-center gap-2 transition-all ${
                      selectedChildId === child.studentId
                        ? "bg-green-700 text-white hover:bg-green-800"
                        : "border-green-200 hover:border-green-400 hover:bg-green-50"
                    }`}
                    onClick={() => setSelectedChildId(child.studentId)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className={selectedChildId === child.studentId ? "bg-white text-green-700" : ""}>
                        {child.studentName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {child.studentName}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          {/* Main profile + insights */}
          <Card className="md:col-span-2 border-green-100 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-white pb-6 pt-6">
              <CardTitle className="flex items-center gap-5">
                <Avatar className="h-20 w-20 ring-4 ring-green-100 ring-offset-2">
                  <AvatarFallback className="text-3xl bg-green-700 text-white font-bold">
                    {selectedChild.studentName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {selectedChild.studentName}
                  </h2>
                  <div className="mt-2 flex items-center gap-3 text-muted-foreground">
                    <span className="text-lg">Admission Number:</span>
                    <Badge variant="outline" className="text-sm border-green-300 bg-green-50">
                      {selectedChild.schoolAssignedAdmissionNumber?.trim()
  ? selectedChild.schoolAssignedAdmissionNumber
  : selectedChild.admissionNumber}
                    </Badge>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-10 pt-8 px-6 pb-8">
              {/* Quick stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border shadow-sm text-center">
                  <p className="text-sm text-muted-foreground mb-1">Current Term</p>
                  <p className="text-2xl font-bold text-gray-900">{displayedResult.term}</p>
                  <p className="text-sm text-muted-foreground mt-1">{displayedResult.academicYear}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border shadow-sm text-center">
                  <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                  <p className="text-4xl font-extrabold text-green-700">
                    {displayedResult.overallAverage.toFixed(1)}
                  </p>
                  <Badge variant="outline" className="mt-2 text-base px-4 py-1">
                    {displayedResult.overallGrade}
                  </Badge>
                </div>
                <div className="bg-white p-5 rounded-xl border shadow-sm text-center">
                  <p className="text-sm text-muted-foreground mb-1">Class Position</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {displayedResult.classPosition}
                  </p>
                </div>
              </div>

              {/* AI Insight */}
              <Card className="border-green-200 bg-gradient-to-br from-green-50/70 via-white to-white rounded-xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <Brain className="h-6 w-6 text-green-600" />
                    Gradelytics AI Insight
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed text-gray-800 whitespace-pre-line">
                    {aiSummary}
                  </p>
                </CardContent>
              </Card>

              {/* Performance Analytics */}
              <div className="space-y-8">
                <h3 className="font-semibold text-xl flex items-center gap-3 text-green-800">
                  <TrendingUp className="h-6 w-6" /> Performance Analytics
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Term Trend */}
                  <div className="bg-white p-5 rounded-xl border shadow-sm">
                    <p className="text-sm font-medium text-gray-700 mb-3">Term Trend</p>
                    <div className="flex items-end gap-3 h-24">
                      {selectedChild.results
                        .filter(r => r.isPublished)
                        .map((r, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t"
                              style={{ height: `${r.overallAverage}%` }}
                            />
                            <span className="text-xs mt-2 text-muted-foreground">{r.term.slice(0, 3)}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Change indicator */}
                  {change && (
                    <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center">
                      <div className={`text-5xl font-bold ${isImprovement ? "text-green-600" : "text-amber-600"}`}>
                        {isImprovement ? "↑" : "↓"} {Math.abs(Number(change))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">from previous term</p>
                    </div>
                  )}

                  {/* Strengths & Focus */}
                  <div className="bg-white p-5 rounded-xl border shadow-sm space-y-6">
                    {strengths.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-2">Strengths</p>
                        <div className="flex flex-wrap gap-2">
                          {strengths.map(s => (
                            <Badge
                              key={s}
                              variant="default"
                              className="bg-green-600 hover:bg-green-700 cursor-pointer"
                              onClick={() => handleSubjectClick(s)}
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {needsAttention.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-amber-700 mb-2">Needs Attention</p>
                        <div className="flex flex-wrap gap-2">
                          {needsAttention.map(s => (
                            <Badge
                              key={s}
                              variant="outline"
                              className="border-amber-600 text-amber-800 cursor-pointer hover:bg-amber-50"
                              onClick={() => handleSubjectClick(s)}
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Achievements */}
              {gamificationBadges.length > 0 && (
                <div className="pt-4">
                  <p className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
                    This Term's Achievements
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {gamificationBadges.map((badge, i) => (
                      <Badge key={i} className="text-sm px-4 py-1.5 bg-amber-100 text-amber-800 border-amber-300">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Class Teacher Remark</p>
                  <p className="text-sm italic text-gray-700">“{teacherRemark}”</p>
                </div>
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Principal Remark</p>
                  <p className="text-sm italic text-gray-700">“{principalRemark}”</p>
                </div>
              </div>

              {/* Access info */}
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-4 border-t">
                <div>
                  Last accessed: <span className="font-medium text-gray-700">2 hours ago</span>
                </div>
                <div>
                  Viewed <span className="font-medium text-gray-700">3 times</span> this term
                </div>
              </div>

              {/* Download */}
              <Link href={`/result-checker/dashboard/report-card/?studentId=${selectedChild.studentId}`} target='_blank'>
              <Button className="w-full h-12 text-base bg-green-700 hover:bg-green-800 shadow-lg hover:shadow-xl transition-all rounded-xl">
                View Report Card
              </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card className="border-green-100 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-green-50/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Users className="h-6 w-6 text-green-600" />
                Attendance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="text-center">
                <div className="text-6xl font-extrabold text-green-700 drop-shadow-sm">
                  {displayedResult.attendance.percentage}%
                </div>
                <p className="text-base font-medium text-gray-600 mt-1">Attendance Rate</p>

                <div className="mt-5 h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000"
                    style={{ width: `${displayedResult.attendance.percentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <p className="text-2xl font-bold text-green-700">{displayedResult.attendance.presentDays}</p>
                  <p className="text-xs text-muted-foreground mt-1">Present</p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <p className="text-2xl font-bold text-amber-600">{displayedResult.attendance.lateDays}</p>
                  <p className="text-xs text-muted-foreground mt-1">Late</p>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <p className="text-2xl font-bold text-gray-700">{displayedResult.attendance.totalDays}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Days</p>
                </div>
              </div>

              <div className="text-center text-sm font-medium pt-2">
                {displayedResult.attendance.percentage >= 90 ? (
                  <span className="text-green-700">Excellent consistency — outstanding!</span>
                ) : (
                  <span className="text-amber-700">Good attendance — aim for 95%+ next term</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Academic Journey */}
        <Card className="border-green-100 shadow-md rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Academic Journey Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">
              {selectedChild.results.map((r, i) => (
                <div
                  key={i}
                  className="min-w-[160px] bg-white border rounded-xl p-5 text-center shadow-sm snap-center hover:shadow-md transition-shadow"
                >
                  <div className="text-xs text-muted-foreground">{r.academicYear}</div>
                  <div className="text-3xl font-bold text-green-700 mt-2">{r.overallAverage.toFixed(1)}</div>
                  <div className="text-base font-medium mt-1">{r.term}</div>
                  <div className="text-xs text-muted-foreground mt-3">{r.classPosition}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Latest Term Detailed Results Table */}
        <Card className="border-green-100 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Latest Term Results</CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1 bg-white">
                  {displayedResult.term}
                </Badge>
                <span className="text-sm text-muted-foreground">{displayedResult.academicYear}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="bg-green-50/70 border-b">
                    <th className="text-left p-5 font-medium text-gray-700">Subject</th>
                    <th className="text-center p-5 font-medium text-gray-700">Total</th>
                    <th className="text-center p-5 font-medium text-gray-700">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedResult.subjects.map((sub, index) => (
                    <tr
                      key={index}
                      className="border-b last:border-none hover:bg-green-50/30 transition-colors"
                    >
                      <td className="p-5 font-medium text-gray-800 cursor-pointer hover:underline" onClick={() => handleSubjectClick(sub.subject)}>
                        {sub.subject}
                      </td>
                      <td className="text-center p-5 font-semibold text-gray-900">{sub.total}</td>
                      <td className="text-center p-5">
                        <Badge
                          variant={
                            sub.grade === "A" ? "default" :
                            sub.grade === "B" ? "secondary" :
                            sub.grade === "C" ? "outline" :
                            "destructive"
                          }
                          className="min-w-[3rem] py-1.5 text-sm"
                        >
                          {sub.grade}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="sm:hidden p-5 text-center text-sm text-muted-foreground bg-gray-50 border-t">
                ← Scroll horizontally to view full table →
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Subject Trend Dialog */}
      <Dialog open={!!showSubjectTrend} onOpenChange={() => setShowSubjectTrend(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{showSubjectTrend?.subject} Trend Across Terms</DialogTitle>
          </DialogHeader>
          <div className="pt-6 pb-4">
            <div className="flex items-end gap-4 h-64 px-2">
              {showSubjectTrend?.history.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-sm font-medium text-gray-700 mb-2">{item.term}</div>
                  <div
                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg shadow-md transition-all duration-300"
                    style={{ height: `${item.score}%` }}
                  />
                  <div className="text-lg font-bold text-gray-900 mt-3">{item.score}</div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Skeleton className="h-20 w-full mb-10 rounded-2xl" />
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full mt-10 rounded-2xl" />
      </div>
    </div>
  );
}