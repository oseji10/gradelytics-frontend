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
  DialogDescription,
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
import { ChevronLeftIcon } from "@/icons";
import Icon from "@/components/Icons";

interface SchoolSession {
  academicYearId: number;
  academicYearName: string;
  schoolId: number;
  startDate: string;
  endDate: string;
  isActive: number;
  isClosed: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface SchoolTerm {
  termId: number;
  academicYearId: number | null;
  termName: string;
  schoolId: number;
  startDate: string;
  endDate: string;
  termOrder: number | null;
  isActive: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  academic_year: any | null;
}

interface AssessmentType {
  assessmentId: number;
  assessmentName: string;           // e.g. "1st CA", "2nd CA", "Exam", "Project"
  description?: string | null;
  maxScore: number;           // e.g. 20, 30, 100, 40
  weight?: number;            // optional weighting percentage
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface DomainType {
  domainId: number;
  domainName: string;
  domainType: "Affective" | "Psychomotor";
  maxScore: number;
  weight: number | null;
  created_at: string;
  updated_at: string;
}

interface Domain {
  domainId: number;
  domainName: string;
  maxScore: string;     // comes as string "5.00" from backend
  weight: string;       // comes as string "10.00"
  schoolId: number;
  created_at: string;
  updated_at: string;
}

export default function SchoolSettings() {
  const [sessions, setSessions] = useState<SchoolSession[]>([]);
  const [terms, setTerms] = useState<SchoolTerm[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [loading, setLoading] = useState(true);

  // Session form states
  const [sessionName, setSessionName] = useState("");
  const [sessionStart, setSessionStart] = useState<Date | undefined>(undefined);
  const [sessionEnd, setSessionEnd] = useState<Date | undefined>(undefined);
  const [sessionSubmitting, setSessionSubmitting] = useState(false);

  // Term form states
  const [selectedSessionForTerm, setSelectedSessionForTerm] = useState<string>("");
  const [termName, setTermName] = useState("First Term");
  const [termStart, setTermStart] = useState<Date | undefined>(undefined);
  const [termEnd, setTermEnd] = useState<Date | undefined>(undefined);
  const [termSubmitting, setTermSubmitting] = useState(false);

  // Set Current Session & Term
  const [selectedCurrentSessionId, setSelectedCurrentSessionId] = useState<string>("");
  const [selectedCurrentTermId, setSelectedCurrentTermId] = useState<string>("");
  const [settingCurrent, setSettingCurrent] = useState(false);

  // Assessment Type form states
  const [assessmentTypeName, setAssessmentTypeName] = useState("");
  const [maxScore, setMaxScore] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState<number | null>(null);

  // near other form states
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editAssessmentName, setEditAssessmentName] = useState("");
const [editMaxScore, setEditMaxScore] = useState("");
const [editWeight, setEditWeight] = useState("");

// Domain form states
const [domainName, setDomainName] = useState("");
const [domainType, setDomainType] = useState<"Affective" | "Psychomotor" | "">("");
const [domainMaxScore, setDomainMaxScore] = useState("");
const [domainWeight, setDomainWeight] = useState("");
const [domainSubmitting, setDomainSubmitting] = useState(false);

// Edit domain modal
const [isEditDomainModalOpen, setIsEditDomainModalOpen] = useState(false);
const [editingDomainId, setEditingDomainId] = useState<number | null>(null);
const [editDomainName, setEditDomainName] = useState("");
const [editDomainType, setEditDomainType] = useState<"Affective" | "Psychomotor" | "">("");
const [editDomainMaxScore, setEditDomainMaxScore] = useState("");
const [editDomainWeight, setEditDomainWeight] = useState("");

const [domains, setDomains] = useState<DomainType[]>([]);
const [affectiveDomains, setAffectiveDomains] = useState<Domain[]>([]);
const [psychomotorDomains, setPsychomotorDomains] = useState<Domain[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, termsRes, assessmentsRes, domainsRes] = await Promise.all([
        api.get("/academic-years"),
        api.get("/terms"),
        api.get("/assessment"),  
        api.get("/domains"),
      ]);

      const safeSessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
      const safeTerms = Array.isArray(termsRes.data) ? termsRes.data : [];
      const safeAssessments = Array.isArray(assessmentsRes.data) ? assessmentsRes.data : [];
      
      setSessions(safeSessions);
      setTerms(safeTerms);
      setAssessmentTypes(safeAssessments);
      setDomains(Array.isArray(domainsRes.data) ? domainsRes.data : []);

      const domainsData = domainsRes.data;

    setAffectiveDomains(
      Array.isArray(domainsData?.affective) ? domainsData.affective : []
    );
    setPsychomotorDomains(
      Array.isArray(domainsData?.psychomotor) ? domainsData.psychomotor : []
    );

      // Pre-select current ones
      const currSession = safeSessions.find((s) => s.isActive === 1);
      const currTerm = safeTerms.find((t) => t.isActive === 1);
      setSelectedCurrentSessionId(currSession?.academicYearId?.toString() || "");
      setSelectedCurrentTermId(currTerm?.termId?.toString() || "");
    } catch (err: any) {
      toast.error("Failed to load academic data");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };


const handleSaveDomain = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!domainName.trim() || !domainType || !domainMaxScore) {
    toast.error("Domain name, type, and max score are required.");
    return;
  }

  const maxScoreNum = Number(domainMaxScore);
  if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
    toast.error("Max score must be a positive number.");
    return;
  }

  const weightNum = domainWeight ? Number(domainWeight) : null;
  if (weightNum !== null && (isNaN(weightNum) || weightNum < 0 || weightNum > 100)) {
    toast.error("Weight must be 0–100.");
    return;
  }

  setDomainSubmitting(true);
  try {
    const payload = {
      domainName: domainName.trim(),
      domainType,                        // "Affective" or "Psychomotor"
      maxScore: maxScoreNum,
      weight: weightNum,
    };

    // Then change post URL based on type:
// const endpoint = domainType === "Affective" ? "/domains/affective" : "/domains/psychomotor";
// await api.post(endpoint, { domainName, maxScore: maxScoreNum, weight: weightNum });

    await api.post("/domains/save", payload);   // ← backend should route to correct array
    toast.success("Domain created");

    fetchData();
    setDomainName("");
    setDomainType("");
    setDomainMaxScore("");
    setDomainWeight("");
  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Failed to create domain");
  } finally {
    setDomainSubmitting(false);
  }
};

  // ── Save / Update Session ───────────────────────────────────────────
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim() || !sessionStart || !sessionEnd) {
      toast.error("Please fill session name, start date, and end date.");
      return;
    }
    if (sessionEnd <= sessionStart) {
      toast.error("End date must be after start date.");
      return;
    }

    setSessionSubmitting(true);
    try {
      const payload = {
        academicYearName: sessionName.trim(),
        startDate: sessionStart.toISOString(),
        endDate: sessionEnd.toISOString(),
      };

      const current = sessions.find((s) => s.isActive === 1);
      if (current) {
        await api.patch(`/academic-years/${current.academicYearId}`, payload);
        toast.success("Current session updated");
      } else {
        await api.post("/academic-years", payload);
        toast.success("New session created");
      }
      fetchData();
      setSessionName("");
      setSessionStart(undefined);
      setSessionEnd(undefined);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save session");
    } finally {
      setSessionSubmitting(false);
    }
  };

  // ── Save / Update Term ──────────────────────────────────────────────
  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForTerm || !termName.trim() || !termStart || !termEnd) {
      toast.error("Please select session, term name, and dates.");
      return;
    }
    if (termEnd <= termStart) {
      toast.error("End date must be after start date.");
      return;
    }

    setTermSubmitting(true);
    try {
      const payload = {
        academicYearId: Number(selectedSessionForTerm),
        termName,
        startDate: termStart.toISOString(),
        endDate: termEnd.toISOString(),
      };

      const current = terms.find(
        (t) => t.isActive === 1 && t.academicYearId === Number(selectedSessionForTerm)
      );

      if (current) {
        await api.patch(`/terms/${current.termId}`, payload);
        toast.success("Current term updated");
      } else {
        await api.post("/terms", payload);
        toast.success("New term created");
      }
      fetchData();
      setSelectedSessionForTerm("");
      setTermName("First Term");
      setTermStart(undefined);
      setTermEnd(undefined);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save term");
    } finally {
      setTermSubmitting(false);
    }
  };

  // ── Save / Update Assessment Type ───────────────────────────────────
  const handleSaveAssessmentType = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!assessmentTypeName.trim() || !maxScore) {
    toast.error("Please enter assessment name and maximum score.");
    return;
  }

  const maxScoreNum = Number(maxScore);
  if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
    toast.error("Maximum score must be a positive number.");
    return;
  }

  setAssessmentSubmitting(true);
  try {
    const payload = {
      assessmentName: assessmentTypeName.trim(),
      maxScore: maxScoreNum,
      weight: weight ? Number(weight) : undefined,
    };

    await api.post("/assessment", payload);
    toast.success("New assessment type created");

    fetchData();
    setAssessmentTypeName("");
    setMaxScore("");
    setWeight("");
  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Failed to create assessment type");
  } finally {
    setAssessmentSubmitting(false);
  }
};


 const startEditAssessment = (type: AssessmentType) => {
  setEditAssessmentName(type.assessmentName);
  setEditMaxScore(type.maxScore.toString());
  setEditWeight(type.weight?.toString() || "");
  setEditingAssessmentId(type.assessmentId);
  setIsEditModalOpen(true);
};

const [editDomainCategory, setEditDomainCategory] = useState<"Affective" | "Psychomotor">("Affective");
const startEditDomain = (domain: DomainType) => {
  setEditDomainName(domain.domainName);
  setEditDomainType(domain.domainType);
  setEditDomainMaxScore(domain.maxScore.toString());
  setEditDomainWeight(domain.weight?.toString() || "");
  setEditingDomainId(domain.domainId);
  setEditDomainCategory(category);           // new state: const [editDomainCategory, setEditDomainCategory] = useState<"Affective" | "Psychomotor">("Affective");
  setIsEditDomainModalOpen(true);
};

const handleUpdateDomain = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!editDomainName.trim() || !editDomainType || !editDomainMaxScore || editingDomainId === null) {
    toast.error("Missing required fields or no domain selected.");
    return;
  }

  const maxScoreNum = Number(editDomainMaxScore);
  if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
    toast.error("Max score must be a positive number.");
    return;
  }

  const weightNum = editDomainWeight ? Number(editDomainWeight) : null;

  setDomainSubmitting(true);
  try {
    const payload = {
      domainName: editDomainName.trim(),
      domainType: editDomainType,
      maxScore: maxScoreNum,
      weight: weightNum,
    };

    await api.patch(`/domains/${editingDomainId}`, payload);
    toast.success("Domain updated");

    setIsEditDomainModalOpen(false);
    setEditingDomainId(null);
    fetchData();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Failed to update domain");
  } finally {
    setDomainSubmitting(false);
  }
};

  const handleUpdateAssessment = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editAssessmentName.trim() || !editMaxScore) {
    toast.error("Please enter assessment name and maximum score.");
    return;
  }


  if (editingAssessmentId === null) {
    toast.error("No assessment selected for update");
    setIsEditModalOpen(false);
    return;
  }
  const maxScoreNum = Number(editMaxScore);
  if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
    toast.error("Maximum score must be a positive number.");
    return;
  }

  setAssessmentSubmitting(true);
  try {
    const payload = {
      assessmentName: editAssessmentName.trim(),
      maxScore: maxScoreNum,
      weight: editWeight ? Number(editWeight) : undefined,
    };

    await api.patch(`/assessment/${editingAssessmentId}`, payload);
    toast.success("Assessment type updated");

    setIsEditModalOpen(false);
    setEditingAssessmentId(null);
    fetchData();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Failed to update assessment type");
  } finally {
    setAssessmentSubmitting(false);
  }
};

  // ── Set Current Session & Term ──────────────────────────────────────
  const handleSetCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurrentSessionId && !selectedCurrentTermId) {
      toast.warning("Select at least one to set as current.");
      return;
    }

    setSettingCurrent(true);
    try {
      if (selectedCurrentSessionId) {
        await api.patch(`/academic-years/${selectedCurrentSessionId}/activate`);
        toast.success("Current session updated");
      }
      if (selectedCurrentTermId) {
        await api.patch(`/terms/${selectedCurrentTermId}/activate`);
        toast.success("Current term updated");
      }
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to set current period");
    } finally {
      setSettingCurrent(false);
    }
  };

  const currentSession = sessions.find((s) => s.isActive === 1);
  const currentTerm = terms.find((t) => t.isActive === 1);

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="space-y-8 px-4 py-8 md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <Icon src={ChevronLeftIcon} className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              School Academic Settings
            </h1>
          </div>
        </div>

        {/* Set Current Session & Term */}
        <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle>Set Current Academic Period</CardTitle>
            <CardDescription>
              Choose which session and term should be active right now
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetCurrent} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Current Session</Label>
                  <Select
                    value={selectedCurrentSessionId}
                    onValueChange={(val) => {
                      console.log("Session selected:", val);
                      setSelectedCurrentSessionId(val);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select active session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.length === 0 ? (
                        <div className="py-2 px-4 text-sm text-muted-foreground">
                          No sessions available
                        </div>
                      ) : (
                        sessions.map((s) => (
                          <SelectItem key={s.academicYearId} value={s.academicYearId.toString()}>
                            {s.academicYearName} {s.isActive === 1 && "(Current)"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Current Term</Label>
                  <Select
                    value={selectedCurrentTermId}
                    onValueChange={(val) => {
                      console.log("Term selected:", val);
                      setSelectedCurrentTermId(val);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select active term" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map((t) => {
                        const session = sessions.find((s) => s.academicYearId === t.academicYearId);
                        return (
                          <SelectItem key={t.termId} value={t.termId.toString()}>
                            {session?.academicYearName || "—"} - {t.termName}{" "}
                            {t.isActive === 1 && "(Current)"}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={settingCurrent || (!selectedCurrentSessionId && !selectedCurrentTermId)}
                  className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
                >
                  {settingCurrent ? "Updating..." : "Set as Current"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Current Academic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current Academic Period</CardTitle>
            <CardDescription>Active session and term</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Current Session</h3>
                  {currentSession ? (
                    <div className="space-y-2">
                      <p className="text-xl font-bold">{currentSession.academicYearName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(currentSession.startDate), "MMM d, yyyy")} –{" "}
                        {format(new Date(currentSession.endDate), "MMM d, yyyy")}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Active
                      </span>
                    </div>
                  ) : (
                    <p className="text-amber-600">No active session set yet.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Current Term</h3>
                  {currentTerm ? (
                    <div className="space-y-2">
                      <p className="text-xl font-bold">{currentTerm.termName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(currentTerm.startDate), "MMM d, yyyy")} –{" "}
                        {format(new Date(currentTerm.endDate), "MMM d, yyyy")}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Active
                      </span>
                    </div>
                  ) : (
                    <p className="text-amber-600">No active term set yet.</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create / Update Session */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentSession ? "Update Current Session" : "Create New Session"}
            </CardTitle>
            <CardDescription>
              Define academic year with start and end dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSession} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Session Name *</Label>
                  <Input
                    placeholder="e.g. 2025/2026"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !sessionStart && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {sessionStart ? format(sessionStart, "PPP") : "Pick start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={sessionStart}
                        onSelect={setSessionStart}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !sessionEnd && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {sessionEnd ? format(sessionEnd, "PPP") : "Pick end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={sessionEnd}
                        onSelect={setSessionEnd}
                        initialFocus
                        disabled={(date) => (sessionStart ? date < sessionStart : false)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={sessionSubmitting}
                  className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
                >
                  {sessionSubmitting
                    ? "Saving..."
                    : currentSession
                    ? "Update Session"
                    : "Create Session"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Create / Update Term */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentTerm ? "Update Current Term" : "Create New Term"}
            </CardTitle>
            <CardDescription>
              Assign term to a session and set start/end dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveTerm} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Session *</Label>
                  <Select
                    value={selectedSessionForTerm}
                    onValueChange={setSelectedSessionForTerm}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.length === 0 ? (
                        <div className="py-2 px-4 text-sm text-muted-foreground">
                          No sessions available
                        </div>
                      ) : (
                        sessions.map((s) => (
                          <SelectItem key={s.academicYearId} value={s.academicYearId.toString()}>
                            {s.academicYearName} {s.isActive === 1 && "(Current)"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Term Name *</Label>
                  <Select value={termName} onValueChange={setTermName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Term">First Term</SelectItem>
                      <SelectItem value="Second Term">Second Term</SelectItem>
                      <SelectItem value="Third Term">Third Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Term Starts *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !termStart && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {termStart ? format(termStart, "PPP") : "Pick start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={termStart}
                        onSelect={setTermStart}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Term Ends *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !termEnd && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {termEnd ? format(termEnd, "PPP") : "Pick end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={termEnd}
                        onSelect={setTermEnd}
                        initialFocus
                        disabled={(date) => (termStart ? date < termStart : false)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={termSubmitting || !selectedSessionForTerm}
                  className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
                >
                  {termSubmitting
                    ? "Saving..."
                    : currentTerm
                    ? "Update Term"
                    : "Create Term"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* New: Assessment Types */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Assessment Type</CardTitle>
            <CardDescription>
              Define types like 1st CA, 2nd CA, Exam, Project, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveAssessmentType} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Assessment Name *</Label>
                  <Input
                    placeholder="e.g. 1st CA, Exam, Project"
                    value={assessmentTypeName}
                    onChange={(e) => setAssessmentTypeName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Maximum Score *</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 20, 30, 100"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Weight (%) (optional)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="e.g. 30"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
  <Button
    type="submit"
    disabled={assessmentSubmitting}
    className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
  >
    {assessmentSubmitting ? "Saving..." : "Create Assessment Type"}
  </Button>
</div>
            </form>
          </CardContent>
        </Card>



{/* Domains (Affective & Psychomotor) */}
<Card>
  <CardHeader>
    <CardTitle>Create Affective / Psychomotor Domain</CardTitle>
    <CardDescription>
      Define behavioural and skill-based assessment domains
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSaveDomain} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <Label>Domain Name *</Label>
          <Input
            placeholder="e.g. Attitude, Punctuality, Handwriting"
            value={domainName}
            onChange={(e) => setDomainName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Domain Type *</Label>
          <Select
            value={domainType}
            onValueChange={(val) => setDomainType(val as "Affective" | "Psychomotor")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Affective">Affective</SelectItem>
              <SelectItem value="Psychomotor">Psychomotor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Maximum Score *</Label>
          <Input
            type="number"
            min="1"
            placeholder="e.g. 5, 10, 20"
            value={domainMaxScore}
            onChange={(e) => setDomainMaxScore(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Weight (%) *</Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="e.g. 10, 20"
            value={domainWeight}
            onChange={(e) => setDomainWeight(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={domainSubmitting}
          className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
        >
          {domainSubmitting ? "Saving..." : "Create Domain"}
        </Button>
      </div>
    </form>
  </CardContent>
</Card>

{/* Domains History */}
{/* Affective Domains */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
<Card>
  <CardHeader>
    <CardTitle>Affective Domains</CardTitle>
    <CardDescription>Attitude, behavior, emotional domains</CardDescription>
  </CardHeader>
  <CardContent>
    {loading ? (
      <p>Loading...</p>
    ) : affectiveDomains.length === 0 ? (
      <p className="text-muted-foreground">No affective domains yet.</p>
    ) : (
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Domain</th>
              <th className="px-4 py-3 text-left font-medium">Max Score</th>
              <th className="px-4 py-3 text-left font-medium">Weight (%)</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {affectiveDomains.map((d) => (
              <tr key={d.domainId} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{d.domainName}</td>
                <td className="px-4 py-3">{parseFloat(d.maxScore).toFixed(1)}</td>
                <td className="px-4 py-3">{d.weight ? parseFloat(d.weight).toFixed(1) : "—"}</td>
                <td className="px-4 py-3">{format(new Date(d.created_at), "MMM d, yyyy")}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" onClick={() => startEditDomain(d, "Affective")}>
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

{/* Psychomotor Domains – similar structure */}
<Card>
  <CardHeader>
    <CardTitle>Psychomotor Domains</CardTitle>
    <CardDescription>Physical skills, coordination, practical domains</CardDescription>
  </CardHeader>
 <CardContent>
    {loading ? (
      <p>Loading...</p>
    ) : psychomotorDomains.length === 0 ? (
      <p className="text-muted-foreground">No psychomotor domains yet.</p>
    ) : (
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Domain</th>
              <th className="px-4 py-3 text-left font-medium">Max Score</th>
              <th className="px-4 py-3 text-left font-medium">Weight (%)</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {psychomotorDomains.map((d) => (
              <tr key={d.domainId} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{d.domainName}</td>
                <td className="px-4 py-3">{parseFloat(d.maxScore).toFixed(1)}</td>
                <td className="px-4 py-3">{d.weight ? parseFloat(d.weight).toFixed(1) : "—"}</td>
                <td className="px-4 py-3">{format(new Date(d.created_at), "MMM d, yyyy")}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" onClick={() => startEditDomain(d, "Psychomotor")}>
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
</div>

<Dialog open={isEditDomainModalOpen} onOpenChange={setIsEditDomainModalOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Domain</DialogTitle>
      <DialogDescription>Update affective/psychomotor domain details.</DialogDescription>
    </DialogHeader>

    <form onSubmit={handleUpdateDomain} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Domain Name *</Label>
          <Input
            value={editDomainName}
            onChange={(e) => setEditDomainName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Domain Type *</Label>
          <Select
            value={editDomainType}
            onValueChange={(val) => setEditDomainType(val as "Affective" | "Psychomotor")}
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

        <div>
          <Label>Maximum Score *</Label>
          <Input
            type="number"
            min="1"
            value={editDomainMaxScore}
            onChange={(e) => setEditDomainMaxScore(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Weight (%) *</Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={editDomainWeight}
            onChange={(e) => setEditDomainWeight(e.target.value)}
            required
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsEditDomainModalOpen(false);
            setEditingDomainId(null);
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={domainSubmitting}
          className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
        >
          {domainSubmitting ? "Updating..." : "Update Domain"}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>


        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Assessment Type</DialogTitle>
      <DialogDescription>
        Update the details of this assessment type.
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleUpdateAssessment} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Assessment Name *</Label>
          <Input
            placeholder="e.g. 1st CA, Exam, Project"
            value={editAssessmentName}
            onChange={(e) => setEditAssessmentName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Maximum Score *</Label>
          <Input
            type="number"
            min="1"
            placeholder="e.g. 20, 30, 100"
            value={editMaxScore}
            onChange={(e) => setEditMaxScore(e.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label>Weight (%) (optional)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="e.g. 30"
            value={editWeight}
            onChange={(e) => setEditWeight(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsEditModalOpen(false);
            setEditingAssessmentId(null);
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={assessmentSubmitting}
          className="bg-[#1F6F43] hover:bg-[#1F6F43]/90"
        >
          {assessmentSubmitting ? "Updating..." : "Update Assessment Type"}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

        {/* History Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sessions History */}
          <Card>
            <CardHeader>
              <CardTitle>Sessions History</CardTitle>
              <CardDescription>Past and upcoming academic sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <p className="text-muted-foreground">No sessions created yet.</p>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Session</th>
                        <th className="px-4 py-3 text-left font-medium">Start</th>
                        <th className="px-4 py-3 text-left font-medium">End</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sessions.map((s) => (
                        <tr key={s.academicYearId} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{s.academicYearName}</td>
                          <td className="px-4 py-3">
                            {format(new Date(s.startDate), "MMM d, yyyy")}
                          </td>
                          <td className="px-4 py-3">
                            {format(new Date(s.endDate), "MMM d, yyyy")}
                          </td>
                          <td className="px-4 py-3">
                            {s.isActive === 1 ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Current
                              </span>
                            ) : new Date(s.startDate) > new Date() ? (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                Upcoming
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                Ended
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms History */}
          <Card>
            <CardHeader>
              <CardTitle>Terms History</CardTitle>
              <CardDescription>Past and upcoming academic terms</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading terms...</p>
              ) : terms.length === 0 ? (
                <p className="text-muted-foreground">No terms created yet.</p>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Session</th>
                        <th className="px-4 py-3 text-left font-medium">Term</th>
                        <th className="px-4 py-3 text-left font-medium">Start</th>
                        <th className="px-4 py-3 text-left font-medium">End</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {terms.map((t) => {
                        const session = sessions.find((s) => s.academicYearId === t.academicYearId);
                        return (
                          <tr key={t.termId} className="hover:bg-muted/30">
                            <td className="px-4 py-3">{session?.academicYearName || "—"}</td>
                            <td className="px-4 py-3">{t.termName}</td>
                            <td className="px-4 py-3">
                              {format(new Date(t.startDate), "MMM d, yyyy")}
                            </td>
                            <td className="px-4 py-3">
                              {format(new Date(t.endDate), "MMM d, yyyy")}
                            </td>
                            <td className="px-4 py-3">
                              {t.isActive === 1 ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                  Current
                                </span>
                              ) : new Date(t.startDate) > new Date() ? (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                  Upcoming
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                  Ended
                                </span>
                              )}
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

          {/* New: Assessment Types History */}
<Card className="lg:col-span-2">
  <CardHeader>
    <CardTitle>Assessment Types History</CardTitle>
    <CardDescription>
      All defined assessment types (1st CA, Exam, etc.)
    </CardDescription>
  </CardHeader>
  <CardContent>
    {loading ? (
      <p>Loading assessment types...</p>
    ) : assessmentTypes.length === 0 ? (
      <p className="text-muted-foreground">No assessment types created yet.</p>
    ) : (
      <>
        {/* Desktop Table */}
        <div className="hidden md:block rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Assessment Type</th>
                <th className="px-4 py-3 text-left font-medium">Max Score</th>
                <th className="px-4 py-3 text-left font-medium">Weight (%)</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assessmentTypes.map((type) => (
                <tr key={type.assessmentId} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{type.assessmentName}</td>
                  <td className="px-4 py-3">{type.maxScore}</td>
                  <td className="px-4 py-3">{type.weight ?? "—"}</td>
                  <td className="px-4 py-3">
                    {format(new Date(type.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditAssessment(type)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {assessmentTypes.map((type) => (
            <Card key={type.assessmentId} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="font-medium mb-2">{type.assessmentName}</div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Max Score:</span>
                    <div>{type.maxScore}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Weight:</span>
                    <div>{type.weight ?? "—"}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Created:</span>
                    <div>{format(new Date(type.created_at), "MMM d, yyyy")}</div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditAssessment(type)}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    )}
  </CardContent>
</Card>
        </div>
      </div>
    </div>
  );
}