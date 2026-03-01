"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import api from "../../../lib/api";

// ────────────────────────────────────────────────────────────────
//  Interfaces (simplified from your original)
// ────────────────────────────────────────────────────────────────

interface SchoolSession {
  academicYearId: number;
  academicYearName: string;
  startDate: string;
  endDate: string;
  isActive: number;
}

interface SchoolTerm {
  termId: number;
  academicYearId: number;
  termName: string;
  startDate: string;
  endDate: string;
  isActive: number;
}

interface AssessmentType {
  assessmentId: number;
  assessmentName: string;
  maxScore: number;
  weight?: number;
  created_at: string;
}

interface Domain {
  domainId: number;
  domainName: string;
  domainType: "Affective" | "Psychomotor";
  maxScore: string;
  weight: string;
  comment?: string | null;
  created_at: string;
}

interface GradeBoundary {
  gradeId: number;
  minScore: number;
  maxScore: number;
  grade: string;
  remark: string;
  gradePoint: number;
}

interface Club {
  clubId: number;
  name: string;
  created_at: string;
}

interface House {
  houseId: number;
  name: string;
  created_at: string;
}

// ────────────────────────────────────────────────────────────────

export default function SchoolSettings() {
  const [loading, setLoading] = useState(true);

  const [sessions, setSessions] = useState<SchoolSession[]>([]);
  const [terms, setTerms] = useState<SchoolTerm[]>([]);
  const [assessments, setAssessments] = useState<AssessmentType[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [grades, setGrades] = useState<GradeBoundary[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [houses, setHouses] = useState<House[]>([]);

  const [currentSessionId, setCurrentSessionId] = useState("");
  const [currentTermId, setCurrentTermId] = useState("");

  // ── Modals ───────────────────────────────────────────────────────
  const [modals, setModals] = useState({
    addSession: false,
    editSession: false,
    addTerm: false,
    editTerm: false,
    addAssessment: false,
    editAssessment: false,
    addDomain: false,
    editDomain: false,
    addGrade: false,
    editGrade: false,
    addClub: false,
    editClub: false,
    addHouse: false,
    editHouse: false,
  });

  // ── Form state ───────────────────────────────────────────────────
  const [form, setForm] = useState({
    session: { name: "", start: undefined as Date | undefined, end: undefined as Date | undefined, id: null as number | null },
    term: { sessionId: "", name: "First Term", start: undefined as Date | undefined, end: undefined as Date | undefined, id: null as number | null },
    assessment: { name: "", maxScore: "", weight: "", id: null as number | null },
    domain: { name: "", type: "Affective" as "Affective" | "Psychomotor", maxScore: "", weight: "", comment: "", id: null as number | null },
    grade: { min: "", max: "", letter: "", remark: "", point: "", id: null as number | null },
    club: { name: "", id: null as number | null },
    house: { name: "", id: null as number | null },
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const res = await Promise.all([
        api.get("/academic-years"),
        api.get("/terms"),
        api.get("/assessment"),
        api.get("/domains"),
        api.get("/grading"),
        api.get("/school/clubs"),
        api.get("/school/houses"),
      ]);

      setSessions(res[0].data || []);
      setTerms(res[1].data || []);
      setAssessments(res[2].data || []);

      const domData = res[3].data || {};
    //   setDomains([...(domData.affective || []), ...(domData.psychomotor || [])]);
    setDomains([
  ...(domData.affective || []).map(item => ({
    ...item,
    domainType: "Affective" as const,
  })),
  ...(domData.psychomotor || []).map(item => ({
    ...item,
    domainType: "Psychomotor" as const,
  })),
]);

      setGrades(res[4].data?.grades || []);
      setClubs(res[5].data || []);
      setHouses(res[6].data || []);

      const activeSess = res[0].data.find((s: any) => s.isActive === 1);
      const activeTerm = res[1].data.find((t: any) => t.isActive === 1);

      setCurrentSessionId(activeSess?.academicYearId?.toString() ?? "");
      setCurrentTermId(activeTerm?.termId?.toString() ?? "");
    } catch (err: any) {
      toast.error("Failed to load settings");
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────
  //  Helpers (unchanged)
  // ────────────────────────────────────────────────────────────────

  const openAdd = (key: keyof typeof modals) => {
    resetSection(key.replace("add", "").toLowerCase() as any);
    setModals((p) => ({ ...p, [key]: true }));
  };

  const openEdit = (key: keyof typeof modals) => {
    setModals((p) => ({ ...p, [key]: true }));
  };

  const close = (key: keyof typeof modals) => {
    setModals((p) => ({ ...p, [key]: false }));
  };

  const resetSection = (section: string) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        name: "",
        start: undefined,
        end: undefined,
        sessionId: "",
        maxScore: "",
        weight: "",
        comment: "",
        type: "Affective",
        min: "",
        max: "",
        letter: "",
        remark: "",
        point: "",
        id: null,
      },
    }));
  };

  const startEdit = (section: string, item: any) => {
    let update = { ...form };

    switch (section) {
      case "session":
        update.session = {
          name: item.academicYearName,
          start: new Date(item.startDate),
          end: new Date(item.endDate),
          id: item.academicYearId,
        };
        break;
      case "term":
        update.term = {
          sessionId: item.academicYearId.toString(),
          name: item.termName,
          start: new Date(item.startDate),
          end: new Date(item.endDate),
          id: item.termId,
        };
        break;
      case "assessment":
        update.assessment = {
          name: item.assessmentName,
          maxScore: item.maxScore.toString(),
          weight: item.weight?.toString() ?? "",
          id: item.assessmentId,
        };
        break;
      case "domain":
        update.domain = {
          name: item.domainName,
          type: item.domainType,
          maxScore: item.maxScore,
          weight: item.weight ?? "",
          comment: item.comment ?? "",
          id: item.domainId,
        };
        break;
      case "grade":
        update.grade = {
          min: item.minScore.toString(),
          max: item.maxScore.toString(),
          letter: item.grade,
          remark: item.remark,
          point: item.gradePoint.toString(),
          id: item.gradeId,
        };
        break;
      case "club":
        update.club = { name: item.name, id: item.clubId };
        break;
      case "house":
        update.house = { name: item.name, id: item.houseId };
        break;
    }

    setForm(update);
    openEdit(`edit${section.charAt(0).toUpperCase() + section.slice(1)}` as any);
  };

  // ────────────────────────────────────────────────────────────────
  //  Save handlers – using original toast.success / toast.error style
  // ────────────────────────────────────────────────────────────────

  const saveSession = async () => {
    const { name, start, end, id } = form.session;
    if (!name.trim() || !start || !end) {
      toast.error("Session name, start date and end date are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        academicYearName: name.trim(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
      if (id) {
        await api.patch(`/academic-years/${id}`, payload);
        toast.success("Session updated");
      } else {
        await api.post("/academic-years", payload);
        toast.success("Session created");
      }
      loadAllData();
      close(id ? "editSession" : "addSession");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save session");
    } finally {
      setSubmitting(false);
    }
  };

  const saveTerm = async () => {
    const { sessionId, name, start, end, id } = form.term;
    if (!sessionId || !name.trim() || !start || !end) {
      toast.error("Session, term name and dates are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        academicYearId: Number(sessionId),
        termName: name.trim(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
      if (id) {
        await api.patch(`/terms/${id}`, payload);
        toast.success("Term updated");
      } else {
        await api.post("/terms", payload);
        toast.success("Term created");
      }
      loadAllData();
      close(id ? "editTerm" : "addTerm");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save term");
    } finally {
      setSubmitting(false);
    }
  };

  const saveAssessment = async () => {
    const { name, maxScore, weight, id } = form.assessment;
    if (!name.trim() || !maxScore) {
      toast.error("Assessment name and max score are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        assessmentName: name.trim(),
        maxScore: Number(maxScore),
        weight: weight ? Number(weight) : undefined,
      };
      if (id) {
        await api.patch(`/assessment/${id}`, payload);
        toast.success("Assessment type updated");
      } else {
        await api.post("/assessment", payload);
        toast.success("Assessment type created");
      }
      loadAllData();
      close(id ? "editAssessment" : "addAssessment");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save assessment type");
    } finally {
      setSubmitting(false);
    }
  };

  const saveDomain = async () => {
    const { name, type, maxScore, weight, comment, id } = form.domain;
    if (!name.trim() || !type || !maxScore) {
      toast.error("Domain name, type and max score are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        domainName: name.trim(),
        domainType: type,
        maxScore: Number(maxScore),
        weight: weight ? Number(weight) : null,
        comment: comment.trim() || null,
      };
      if (id) {
        await api.patch(`/domains/${id}`, payload);
        toast.success("Domain updated");
      } else {
        await api.post("/domains/save", payload);
        toast.success("Domain created");
      }
      loadAllData();
      close(id ? "editDomain" : "addDomain");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save domain");
    } finally {
      setSubmitting(false);
    }
  };

  const saveGrade = async () => {
    const { min, max, letter, remark, point, id } = form.grade;
    if (!min || !max || !letter.trim() || !remark.trim()) {
      toast.error("All grade fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        minScore: Number(min),
        maxScore: Number(max),
        grade: letter.trim().toUpperCase(),
        remark: remark.trim(),
        gradePoint: Number(point) || 0,
      };
      if (id) {
        await api.patch(`/grading/${id}`, payload);
        toast.success("Grade boundary updated");
      } else {
        await api.post("/grading", payload);
        toast.success("Grade boundary created");
      }
      loadAllData();
      close(id ? "editGrade" : "addGrade");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save grade boundary");
    } finally {
      setSubmitting(false);
    }
  };

  const saveClub = async () => {
    const { name, id } = form.club;
    if (!name.trim()) {
      toast.error("Club name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (id) {
        await api.patch(`/school/clubs/${id}`, { clubName: name.trim() });
        toast.success("Club updated");
      } else {
        await api.post("/school/clubs", { clubName: name.trim() });
        toast.success("Club created");
      }
      loadAllData();
      close(id ? "editClub" : "addClub");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save club");
    } finally {
      setSubmitting(false);
    }
  };

  const saveHouse = async () => {
    const { name, id } = form.house;
    if (!name.trim()) {
      toast.error("House name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (id) {
        await api.patch(`/school/houses/${id}`, { houseName: name.trim() });
        toast.success("House updated");
      } else {
        await api.post("/school/houses", { houseName: name.trim() });
        toast.success("House created");
      }
      loadAllData();
      close(id ? "editHouse" : "addHouse");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save house");
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────────────────────
  //  JSX (unchanged from your last working refactored version)
  // ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <h1 className="text-3xl font-bold">School Academic Settings</h1>
          </div>
        </div>

        {/* Current Period */}
        <Card className="border-green-200 bg-green-50/40 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle>Set Current Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Session</Label>
                <Select value={currentSessionId} onValueChange={setCurrentSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => (
                      <SelectItem key={s.academicYearId} value={s.academicYearId.toString()}>
                        {s.academicYearName} {s.isActive ? "• Current" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Term</Label>
                <Select value={currentTermId} onValueChange={setCurrentTermId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map(t => (
                      <SelectItem key={t.termId} value={t.termId.toString()}>
                        {t.termName} {t.isActive ? "• Current" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card>
          <CardHeader className="flex-row justify-between items-center pb-2">
            <div>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Academic years</CardDescription>
            </div>
            <Button onClick={() => openAdd("addSession")}>+ Add Session</Button>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-8">Loading...</p> : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Start</th>
                      <th className="text-left px-4 py-3">End</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sessions.map(s => (
                      <tr key={s.academicYearId} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{s.academicYearName}</td>
                        <td className="px-4 py-3">{format(new Date(s.startDate), "MMM yyyy")}</td>
                        <td className="px-4 py-3">{format(new Date(s.endDate), "MMM yyyy")}</td>
                        <td className="px-4 py-3">
                          {s.isActive ? <span className="text-green-700">Current</span> :
                           new Date(s.startDate) > new Date() ? <span className="text-blue-600">Upcoming</span> :
                           <span className="text-gray-500">Ended</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => startEdit("session", s)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader className="flex-row justify-between items-center pb-2">
            <div>
              <CardTitle>Terms</CardTitle>
              <CardDescription>Academic terms per session</CardDescription>
            </div>
            <Button onClick={() => openAdd("addTerm")}>+ Add Term</Button>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-8">Loading...</p> : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="text-left px-4 py-3">Session</th>
                      <th className="text-left px-4 py-3">Term</th>
                      <th className="text-left px-4 py-3">Start</th>
                      <th className="text-left px-4 py-3">End</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {terms.map(t => {
                      const sess = sessions.find(s => s.academicYearId === t.academicYearId);
                      return (
                        <tr key={t.termId} className="hover:bg-muted/30">
                          <td className="px-4 py-3">{sess?.academicYearName ?? "—"}</td>
                          <td className="px-4 py-3">{t.termName}</td>
                          <td className="px-4 py-3">{format(new Date(t.startDate), "MMM yyyy")}</td>
                          <td className="px-4 py-3">{format(new Date(t.endDate), "MMM yyyy")}</td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" onClick={() => startEdit("term", t)}>
                              Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment Types */}
        <Card>
          <CardHeader className="flex-row justify-between items-center pb-2">
            <div>
              <CardTitle>Assessment Types</CardTitle>
              <CardDescription>CA, Exam, Project, etc.</CardDescription>
            </div>
            <Button onClick={() => openAdd("addAssessment")}>+ Add Assessment</Button>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-8">Loading...</p> : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Max Score</th>
                      <th className="text-left px-4 py-3">Weight</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assessments.map(a => (
                      <tr key={a.assessmentId} className="hover:bg-muted/30">
                        <td className="px-4 py-3">{a.assessmentName}</td>
                        <td className="px-4 py-3">{a.maxScore}</td>
                        <td className="px-4 py-3">{a.weight ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => startEdit("assessment", a)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Domains */}
        <Card>
          <CardHeader className="flex-row justify-between items-center pb-2">
            <div>
              <CardTitle>Domains (Affective & Psychomotor)</CardTitle>
              <CardDescription>Behavioural and skill domains</CardDescription>
            </div>
            <Button onClick={() => openAdd("addDomain")}>+ Add Domain</Button>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-8">Loading...</p> : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Type</th>
                      <th className="text-left px-4 py-3">Max Score</th>
                      <th className="text-left px-4 py-3">Weight</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {domains.map((d, index) => (
                      <tr
                        key={`${d.domainType}-${d.domainId}-${index}`}
                        className="hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">{d.domainName}</td>
                        <td className="px-4 py-3">{d.domainType}</td>
                        <td className="px-4 py-3">{parseFloat(d.maxScore).toFixed(1)}</td>
                        <td className="px-4 py-3">{d.weight ? parseFloat(d.weight).toFixed(1) : "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => startEdit("domain", d)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grades */}
        <Card>
          <CardHeader className="flex-row justify-between items-center pb-2">
            <div>
              <CardTitle>Grading Scale</CardTitle>
              <CardDescription>Percentage → Grade boundaries</CardDescription>
            </div>
            <Button onClick={() => openAdd("addGrade")}>+ Add Grade</Button>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-8">Loading...</p> : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="text-left px-4 py-3">Range</th>
                      <th className="text-left px-4 py-3">Grade</th>
                      <th className="text-left px-4 py-3">Remark</th>
                      <th className="text-left px-4 py-3">Point</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {grades
                      .sort((a, b) => b.maxScore - a.maxScore)
                      .map((g, index) => (
                        <tr
                          key={`${g.grade}-${g.minScore}-${g.maxScore}-${index}`}
                          className="hover:bg-muted/30"
                        >
                          <td className="px-4 py-3">
                            {g.minScore} – {g.maxScore}
                          </td>
                          <td className="px-4 py-3 font-medium">{g.grade}</td>
                          <td className="px-4 py-3">{g.remark}</td>
                          <td className="px-4 py-3">{g.gradePoint}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit("grade", g)}
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clubs */}
        <Card>
          <CardHeader className="flex-row justify-between items-center pb-2">
            <div>
              <CardTitle>Clubs</CardTitle>
              <CardDescription>Extracurricular clubs</CardDescription>
            </div>
            <Button onClick={() => openAdd("addClub")}>+ Add Club</Button>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-8">Loading...</p> : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Created</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {clubs.map(c => (
                      <tr key={c.clubId} className="hover:bg-muted/30">
                        <td className="px-4 py-3">{c.clubName}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(new Date(c.created_at), "d MMM yyyy")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => startEdit("club", c)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Houses */}
        <Card>
          <CardHeader className="flex-row justify-between items-center pb-2">
            <div>
              <CardTitle>Houses</CardTitle>
              <CardDescription>School houses</CardDescription>
            </div>
            <Button onClick={() => openAdd("addHouse")}>+ Add House</Button>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-8">Loading...</p> : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Created</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {houses.map(h => (
                      <tr key={h.houseId} className="hover:bg-muted/30">
                        <td className="px-4 py-3">{h.houseName}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(new Date(h.created_at), "d MMM yyyy")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => startEdit("house", h)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ──────────────────────────────────────────────────────────────── */}
        {/*                          M O D A L S                               */}
        {/* ──────────────────────────────────────────────────────────────── */}

        {/* Session Modal */}
        <Dialog
          open={modals.addSession || modals.editSession}
          onOpenChange={(open) => {
            if (!open) {
              close("addSession");
              close("editSession");
              resetSection("session");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.session.id ? "Edit Session" : "New Session"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div>
                <Label>Session name *</Label>
                <Input
                  value={form.session.name}
                  onChange={e => setForm(p => ({ ...p, session: { ...p.session, name: e.target.value } }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start", !form.session.start && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.session.start ? format(form.session.start, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.session.start}
                        onSelect={d => setForm(p => ({ ...p, session: { ...p.session, start: d } }))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start", !form.session.end && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.session.end ? format(form.session.end, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.session.end}
                        onSelect={d => setForm(p => ({ ...p, session: { ...p.session, end: d } }))}
                        disabled={d => form.session.start ? d < form.session.start : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(form.session.id ? "editSession" : "addSession")}>
                Cancel
              </Button>
              <Button disabled={submitting} onClick={saveSession}>
                {submitting ? "Saving..." : form.session.id ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Term Modal */}
        <Dialog
          open={modals.addTerm || modals.editTerm}
          onOpenChange={(open) => !open && (close("addTerm"), close("editTerm"), resetSection("term"))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.term.id ? "Edit Term" : "New Term"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div>
                <Label>Session *</Label>
                <Select
                  value={form.term.sessionId}
                  onValueChange={v => setForm(p => ({ ...p, term: { ...p.term, sessionId: v } }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => (
                      <SelectItem key={s.academicYearId} value={s.academicYearId.toString()}>
                        {s.academicYearName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Term name *</Label>
                <Select
                  value={form.term.name}
                  onValueChange={v => setForm(p => ({ ...p, term: { ...p.term, name: v } }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Term">First Term</SelectItem>
                    <SelectItem value="Second Term">Second Term</SelectItem>
                    <SelectItem value="Third Term">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start", !form.term.start && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.term.start ? format(form.term.start, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.term.start}
                        onSelect={d => setForm(p => ({ ...p, term: { ...p.term, start: d } }))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start", !form.term.end && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.term.end ? format(form.term.end, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.term.end}
                        onSelect={d => setForm(p => ({ ...p, term: { ...p.term, end: d } }))}
                        disabled={d => form.term.start ? d < form.term.start : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(form.term.id ? "editTerm" : "addTerm")}>
                Cancel
              </Button>
              <Button disabled={submitting} onClick={saveTerm}>
                {submitting ? "Saving..." : form.term.id ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assessment Modal */}
        <Dialog
          open={modals.addAssessment || modals.editAssessment}
          onOpenChange={(open) => !open && (close("addAssessment"), close("editAssessment"), resetSection("assessment"))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.assessment.id ? "Edit Assessment Type" : "New Assessment Type"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.assessment.name}
                  onChange={e => setForm(p => ({ ...p, assessment: { ...p.assessment, name: e.target.value } }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max score *</Label>
                  <Input
                    type="number"
                    value={form.assessment.maxScore}
                    onChange={e => setForm(p => ({ ...p, assessment: { ...p.assessment, maxScore: e.target.value } }))}
                  />
                </div>
                <div>
                  <Label>Weight % (optional)</Label>
                  <Input
                    type="number"
                    value={form.assessment.weight}
                    onChange={e => setForm(p => ({ ...p, assessment: { ...p.assessment, weight: e.target.value } }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(form.assessment.id ? "editAssessment" : "addAssessment")}>
                Cancel
              </Button>
              <Button disabled={submitting} onClick={saveAssessment}>
                {submitting ? "Saving..." : form.assessment.id ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Domain Modal */}
        <Dialog
          open={modals.addDomain || modals.editDomain}
          onOpenChange={(open) => !open && (close("addDomain"), close("editDomain"), resetSection("domain"))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.domain.id ? "Edit Domain" : "New Domain"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.domain.name}
                  onChange={e => setForm(p => ({ ...p, domain: { ...p.domain, name: e.target.value } }))}
                />
              </div>
              <div>
                <Label>Type *</Label>
                <Select
                  value={form.domain.type}
                  onValueChange={v => setForm(p => ({ ...p, domain: { ...p.domain, type: v as "Affective" | "Psychomotor" } }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Affective">Affective</SelectItem>
                    <SelectItem value="Psychomotor">Psychomotor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max score *</Label>
                  <Input
                    type="number"
                    value={form.domain.maxScore}
                    onChange={e => setForm(p => ({ ...p, domain: { ...p.domain, maxScore: e.target.value } }))}
                  />
                </div>
                <div>
                  <Label>Weight %</Label>
                  <Input
                    type="number"
                    value={form.domain.weight}
                    onChange={e => setForm(p => ({ ...p, domain: { ...p.domain, weight: e.target.value } }))}
                  />
                </div>
              </div>
              <div>
                <Label>Comment (optional)</Label>
                <Input
                  value={form.domain.comment}
                  onChange={e => setForm(p => ({ ...p, domain: { ...p.domain, comment: e.target.value } }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(form.domain.id ? "editDomain" : "addDomain")}>
                Cancel
              </Button>
              <Button disabled={submitting} onClick={saveDomain}>
                {submitting ? "Saving..." : form.domain.id ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Grade Modal */}
        <Dialog
          open={modals.addGrade || modals.editGrade}
          onOpenChange={(open) => !open && (close("addGrade"), close("editGrade"), resetSection("grade"))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.grade.id ? "Edit Grade Boundary" : "New Grade Boundary"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Min score *</Label>
                <Input
                  type="number"
                  value={form.grade.min}
                  onChange={e => setForm(p => ({ ...p, grade: { ...p.grade, min: e.target.value } }))}
                />
              </div>
              <div>
                <Label>Max score *</Label>
                <Input
                  type="number"
                  value={form.grade.max}
                  onChange={e => setForm(p => ({ ...p, grade: { ...p.grade, max: e.target.value } }))}
                />
              </div>
              <div>
                <Label>Grade letter *</Label>
                <Input
                  maxLength={2}
                  value={form.grade.letter}
                  onChange={e => setForm(p => ({ ...p, grade: { ...p.grade, letter: e.target.value.toUpperCase() } }))}
                />
              </div>
              <div>
                <Label>Remark *</Label>
                <Input
                  value={form.grade.remark}
                  onChange={e => setForm(p => ({ ...p, grade: { ...p.grade, remark: e.target.value } }))}
                />
              </div>
              <div className="col-span-2">
                <Label>Grade point</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.grade.point}
                  onChange={e => setForm(p => ({ ...p, grade: { ...p.grade, point: e.target.value } }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(form.grade.id ? "editGrade" : "addGrade")}>
                Cancel
              </Button>
              <Button disabled={submitting} onClick={saveGrade}>
                {submitting ? "Saving..." : form.grade.id ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Club Modal */}
        <Dialog
          open={modals.addClub || modals.editClub}
          onOpenChange={(open) => !open && (close("addClub"), close("editClub"), resetSection("club"))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.club.id ? "Edit Club" : "New Club"}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label>Name *</Label>
              <Input
                value={form.club.name}
                onChange={e => setForm(p => ({ ...p, club: { ...p.club, name: e.target.value } }))}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(form.club.id ? "editClub" : "addClub")}>
                Cancel
              </Button>
              <Button disabled={submitting} onClick={saveClub}>
                {submitting ? "Saving..." : form.club.id ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* House Modal */}
        <Dialog
          open={modals.addHouse || modals.editHouse}
          onOpenChange={(open) => !open && (close("addHouse"), close("editHouse"), resetSection("house"))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.house.id ? "Edit House" : "New House"}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label>Name *</Label>
              <Input
                value={form.house.name}
                onChange={e => setForm(p => ({ ...p, house: { ...p.house, name: e.target.value } }))}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(form.house.id ? "editHouse" : "addHouse")}>
                Cancel
              </Button>
              <Button disabled={submitting} onClick={saveHouse}>
                {submitting ? "Saving..." : form.house.id ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}