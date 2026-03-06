// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Calendar, Clock, FileText, GraduationCap, Loader2, PlusCircle, RefreshCw, Search } from "lucide-react";
// import { cn } from "@/lib/utils";
// import api from "../../../lib/api";
// import { toast } from "@/components/ui/use-toast";
// import { ChevronLeftIcon } from "@/icons"; // assuming your custom icon import
// import Icon from "@/components/Icons";

// interface Exam {
//   id: number;
//   title: string;
//   courseCode: string;
//   startTime: string;
//   durationMinutes: number;
//   totalCandidates: number;
//   status: "Upcoming" | "Running" | "Ended" | "Cancelled";
//   startedCount?: number;
//   completedCount?: number;
//   pendingGrading?: number;
//   createdAt: string;
// }

// export default function CBTDashboardHome() {
//   const [exams, setExams] = useState<Exam[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({
//     totalCreated: 0,
//     runningNow: 0,
//     pendingGrading: 0,
//     avgCompletion: "—",
//   });

//   // Filters
//   const [filterStatus, setFilterStatus] = useState<string>("all");
//   const [searchQuery, setSearchQuery] = useState<string>("");

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     setLoading(true);
//     try {
//       // You can combine into one endpoint or keep separate — here separate for clarity
//       const [statsRes, examsRes] = await Promise.all([
//         api.get("/cbt/stats"),
//         api.get("/cbt/exams", { params: { limit: 20, sort: "startTime,desc" } }),
//       ]);

//       setStats({
//         totalCreated: statsRes.data.totalExams || 0,
//         runningNow: statsRes.data.runningNow || 0,
//         pendingGrading: statsRes.data.pendingGrading || 0,
//         avgCompletion: statsRes.data.avgCompletionRate
//           ? `${Math.round(statsRes.data.avgCompletionRate * 100)}%`
//           : "—",
//       });

//       setExams(examsRes.data.exams || []);
//     } catch (err) {
//       console.error(err);
//       toast({
//         title: "Error",
//         description: "Failed to load CBT dashboard data",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredExams = exams.filter((exam) => {
//     const matchesStatus = filterStatus === "all" || exam.status === filterStatus;
//     const matchesSearch =
//       searchQuery === "" ||
//       exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       exam.courseCode?.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesStatus && matchesSearch;
//   });

//   const quickActions = [
//     {
//       label: "Create Exam",
//       icon: PlusCircle,
//       variant: "default" as const,
//       className: "bg-[#1F6F43] hover:bg-[#1F6F43]/90 text-white h-14 text-lg",
//       onClick: () => {
//         // router.push("/cbt/exams/new") or open modal
//         toast({ title: "Redirecting to create exam..." });
//       },
//     },
//     {
//       label: "Add Questions",
//       icon: FileText,
//       variant: "outline" as const,
//       className: "h-14 text-lg",
//       onClick: () => toast({ title: "Opening question bank..." }),
//     },
//     {
//       label: "Monitor Live Exams",
//       icon: Clock,
//       variant: "secondary" as const,
//       className: "h-14 text-lg",
//       onClick: () => toast({ title: "Opening proctor view..." }),
//     },
//   ];

//   return (
//     <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
//       <div className="space-y-8 px-4 py-8 md:px-8 lg:px-12">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <button
//               onClick={() => window.history.back()}
//               className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
//             >
//               <Icon src={ChevronLeftIcon} className="w-4 h-4" />
//               Back
//             </button>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//               CBT Dashboard
//             </h1>
//           </div>

//           <Button
//             onClick={fetchDashboardData}
//             variant="outline"
//             size="icon"
//             disabled={loading}
//           >
//             <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
//           </Button>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//           <Card className="border-l-4 border-l-indigo-600">
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium flex items-center gap-2">
//                 <GraduationCap className="h-4 w-4" />
//                 Total Exams Created
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold">{stats.totalCreated}</div>
//             </CardContent>
//           </Card>

//           <Card className="border-l-4 border-l-emerald-600">
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium flex items-center gap-2">
//                 <Clock className="h-4 w-4" />
//                 Exams Running Now
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
//                 {stats.runningNow}
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="border-l-4 border-l-amber-600">
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium flex items-center gap-2">
//                 <FileText className="h-4 w-4" />
//                 Pending Grading / Sync
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
//                 {stats.pendingGrading}
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="border-l-4 border-l-blue-600">
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium flex items-center gap-2">
//                 Average Completion
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-3xl font-bold">{stats.avgCompletion}</div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Quick Actions */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Quick Actions</CardTitle>
//             <CardDescription>
//               Start creating or managing exams instantly
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//               {quickActions.map((action, i) => (
//                 <Button
//                   key={i}
//                   variant={action.variant}
//                   className={cn("justify-start gap-3", action.className)}
//                   onClick={action.onClick}
//                 >
//                   <action.icon className="h-6 w-6" />
//                   {action.label}
//                 </Button>
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//         {/* Recent / Active Exams */}
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
//             <CardTitle>Exams ({filteredExams.length})</CardTitle>
//             <div className="flex flex-wrap items-center gap-3">
//               <div className="relative w-64">
//                 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                 <Input
//                   placeholder="Search exam or code..."
//                   className="pl-9"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                 />
//               </div>

//               <Select value={filterStatus} onValueChange={setFilterStatus}>
//                 <SelectTrigger className="w-40">
//                   <SelectValue placeholder="All Status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Status</SelectItem>
//                   <SelectItem value="Upcoming">Upcoming</SelectItem>
//                   <SelectItem value="Running">Running</SelectItem>
//                   <SelectItem value="Ended">Ended</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </CardHeader>

//           <CardContent>
//             {loading ? (
//               <div className="py-20 flex justify-center">
//                 <Loader2 className="h-8 w-8 animate-spin" />
//               </div>
//             ) : filteredExams.length === 0 ? (
//               <div className="py-16 text-center text-muted-foreground">
//                 No exams found matching your filters.
//               </div>
//             ) : (
//               <div className="rounded-md border">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Exam</TableHead>
//                       <TableHead>Start Time</TableHead>
//                       <TableHead>Candidates</TableHead>
//                       <TableHead>Status</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredExams.map((exam) => (
//                       <TableRow key={exam.id}>
//                         <TableCell className="font-medium">
//                           <div>{exam.title}</div>
//                           <div className="text-sm text-muted-foreground">
//                             {exam.courseCode}
//                           </div>
//                         </TableCell>
//                         <TableCell>
//                           <div className="flex items-center gap-2">
//                             <Calendar className="h-4 w-4 text-muted-foreground" />
//                             {new Date(exam.startTime).toLocaleString([], {
//                               dateStyle: "medium",
//                               timeStyle: "short",
//                             })}
//                           </div>
//                         </TableCell>
//                         <TableCell>{exam.totalCandidates}</TableCell>
//                         <TableCell>
//                           <Badge
//                             variant={
//                               exam.status === "Running"
//                                 ? "default"
//                                 : exam.status === "Upcoming"
//                                 ? "secondary"
//                                 : exam.status === "Ended"
//                                 ? "outline"
//                                 : "destructive"
//                             }
//                           >
//                             {exam.status}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-right space-x-2">
//                           <Button variant="ghost" size="sm">
//                             Monitor
//                           </Button>
//                           <Button variant="ghost" size="sm">
//                             Edit
//                           </Button>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
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
import { Calendar, Clock, FileText, GraduationCap, Loader2, PlusCircle, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeftIcon } from "@/icons"; // assuming your custom icon import
import Icon from "@/components/Icons";
import { useRouter } from "next/navigation";

// ── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_STATS = {
  totalCreated: 142,
  runningNow: 3,
  pendingGrading: 18,
  avgCompletion: "78%",
};

const MOCK_EXAMS = [
  {
    id: 101,
    title: "Introduction to Econometrics",
    courseCode: "ECO 301",
    startTime: "2026-03-05T09:00:00",
    durationMinutes: 120,
    totalCandidates: 187,
    status: "Running",
    startedCount: 172,
    completedCount: 133,
  },
  {
    id: 102,
    title: "Research Methods – 300 Level",
    courseCode: "SSC 302",
    startTime: "2026-03-06T08:00:00",
    durationMinutes: 150,
    totalCandidates: 124,
    status: "Upcoming",
  },
  {
    id: 103,
    title: "Corporate Finance 400L",
    courseCode: "FIN 401",
    startTime: "2026-03-04T14:00:00",
    durationMinutes: 180,
    totalCandidates: 96,
    status: "Ended",
    pendingGrading: 7,
  },
  {
    id: 104,
    title: "Business Law II",
    courseCode: "LAW 312",
    startTime: "2026-03-05T10:30:00",
    durationMinutes: 90,
    totalCandidates: 68,
    status: "Running",
    startedCount: 65,
    completedCount: 42,
  },
  {
    id: 105,
    title: "Principles of Accounting",
    courseCode: "ACC 101",
    startTime: "2026-03-07T11:00:00",
    durationMinutes: 120,
    totalCandidates: 210,
    status: "Upcoming",
  },
];

export default function CBTDashboardHome() {
  const [exams, setExams] = useState(MOCK_EXAMS);
  const [stats] = useState(MOCK_STATS);
  const [loading] = useState(false); // no real loading needed with mock
  const router = useRouter();
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Mock "refresh" – just re-set the same data
  const handleRefresh = () => {
    // toast({ title: "Dashboard refreshed (mock data)" });
    toast.success("Dashboard refreshed");
    // Could simulate slight delay or randomization if desired
  };

  const filteredExams = exams.filter((exam) => {
    const matchesStatus = filterStatus === "all" || exam.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.courseCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const quickActions = [
    {
      label: "Create Exam",
      icon: PlusCircle,
      variant: "default" as const,
      className: "bg-[#1F6F43] hover:bg-[#1F6F43]/90 text-white h-14 text-lg",
    //   onClick: () => toast("Opening create exam form..."),
      onClick: () => router.push('/dashboard/admin/create-cbt'),

    },
    {
      label: "Add Questions",
      icon: FileText,
      variant: "outline" as const,
      className: "h-14 text-lg",
      onClick: () => toast("Opening question bank..."),
    },
    {
      label: "Monitor Live Exams",
      icon: Clock,
      variant: "secondary" as const,
      className: "h-14 text-lg",
      onClick: () => toast("Opening proctor / live monitoring..."),
    },
  ];

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      <div className="space-y-8 px-4 py-8 md:px-8 lg:px-12">
        {/* Header */}
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
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            disabled={loading}
          >
            <RefreshCw className={cn("h-5 w-5")} />
          </Button>
        </div>

        {/* Stats Cards */}
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

        {/* Quick Actions */}
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

        {/* Recent / Active Exams */}
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
                            {exam.courseCode}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(exam.startTime).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </div>
                        </TableCell>
                        <TableCell>{exam.totalCandidates}</TableCell>
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
                          >
                            {exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm">
                            Monitor
                          </Button>
                          <Button variant="ghost" size="sm">
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