"use client";

import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PrinterIcon } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import api from "../../../lib/api";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";

// ── New Interfaces matching your updated endpoint ───────────────────────────
interface SchoolInfo {
  schoolName: string;
  email: string;
  phoneNumber: string;
  schoolAddress: string;
  schoolLogo: string;
  authorizedSignature: string;
}

interface SubjectResult {
  subjectName: string;
  "1st CA": string;
  "2nd CA": string;
  Exam: string;
  total: string;
  grade: string;
  position: string | null;
  remark: string;
}

interface DomainItem {
  name: string;
  rating: string | null;
}

interface Attendance {
  timesSchoolOpened: number;
  timesPresent: number;
  percentage: number;
}

interface StudentReportRaw {
  school: SchoolInfo;
  academicYear: string;
  term: string;
  fullName: string;
  className: string;
  gender: string;
  admissionNo: string;
  dob: string;
  age: number;
  house: string;
  club: string;
  passportUrl: string;
  subjects: SubjectResult[];
  domains: {
    affective: DomainItem[];
    psychomotor: DomainItem[];
  };
  attendance: Attendance;
  comments: {
    classTeacherComment: string;
    principalComment: string;
  };
}


// ── Transformed / Normalized Interface for rendering ────────────────────────
interface ReportDisplay {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolLogo: string;
  authorizedSignature: string;
  class_teacher:{
    fullName: string;
    signature: string;
  }
  comments: {
    classTeacherComment: string;
    principalComment: string;
  };
  term: string;
  academicYear: string;
  fullName: string;
  className: string;
  gender: string;
  admissionNo: string;
  dob: string;
  age: number;
  house?: string;
  club?: string;
  passportUrl?: string;
  subjects: {
    subjectName: string;
    ca: string;
    exam: string;
    total: string;
    grade: string;
    position: string;
    remark: string;
  }[];
  affective: { name: string; rating: string | null }[];
  psychomotor: { name: string; rating: string | null }[];
  attendance: Attendance;
  teacherComment: string;     // not in response → placeholder or empty
  principalComment: string;   // not in response → placeholder or empty
  nextTermBegins: string;     // not in response → placeholder or empty
}

export default function StudentReportPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<ReportDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



const [gradingScale, setGradingScale] = useState<
  { min: number; max: number; grade: string; remark: string }[]
>([]);

  // For testing — replace with real dynamic studentId later
  const studentId = 1; // ← change this or use useParams()

//   useEffect(() => {
//     const fetchReport = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const response = await api.get(`/results/student/${studentId}`);

//         const raw: StudentReportRaw = response.data;

//         // Transform raw response → display-friendly structure
//         const displayData: ReportDisplay = {
//           schoolName: raw.school.schoolName,
//           schoolAddress: raw.school.schoolAddress,
//           schoolPhone: raw.school.phoneNumber,
//           schoolEmail: raw.school.email,
//           schoolLogo: raw.school.schoolLogo,
//           authorizedSignature: raw.school.authorizedSignature,
//           teacher_name: raw.class_teacher?.fullName,
//           teacher_signature: raw.class_teacher?.signature,
//           term: raw.term,
//           academicYear: raw.academicYear,
//           fullName: raw.fullName.trim(),
//           className: raw.className,
//           gender: raw.gender,
//           admissionNo: raw.admissionNo || "—",
//           dob: raw.dob,
//           age: raw.age,
//           house: raw.house || "—",
//           club: raw.club || "—",
//           passportUrl: raw.passportUrl || "/placeholder-passport.jpg",
//           subjects: raw.subjects.map((s: any) => {
//   // Sum all values that look like CA / continuous assessment
//   let caTotal = 0;

//   // Dynamic detection: any key containing "ca", "assessment", "test", etc.
//   Object.entries(s).forEach(([key, value]) => {
//     if (
//       /ca|assessment|test|quiz|cont|continuous/i.test(key) &&
//       !/exam|total|grade|position|remark|subject/i.test(key)
//     ) {
//       const num = Number(value);
//       if (!isNaN(num)) {
//         caTotal += num;
//       }
//     }
//   });

//   return {
//     subjectName: s.subjectName || "—",
//     ca: caTotal.toFixed(2),          // ← only the total sum, e.g. "20.00"
//     exam: s.Exam || "—",
//     total: s.total || "—",
//     grade: s.grade || "—",
//     position: s.position || "—",
//     remark: s.remark || "—",
//   };
// }),
//           affective: raw.domains?.affective || [],
//       psychomotor: raw.domains?.psychomotor || [],
//           attendance: raw.attendance,
//           // Missing fields in current API response — use placeholders or leave empty
//           teacherComment: "",
//           principalComment: "",
//           nextTermBegins: "",
//         };

//         setReport(displayData);
//       } catch (err: any) {
//         console.error("Failed to fetch report:", err);
//         const msg = err?.response?.data?.message || "Could not load student report";
//         setError(msg);
//         toast({ variant: "destructive", title: "Error", description: msg });
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [studentId]);



useEffect(() => {
  const fetchReportAndGrading = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both in parallel
      const [reportRes, gradingRes] = await Promise.all([
        api.get(`/results/student/${studentId}`),
        api.get("/grading"),
      ]);

      const raw: StudentReportRaw = reportRes.data;

      // ── NEW: Parse grading scale ───────────────────────────────────────────
      let parsedScale: typeof gradingScale = [];

      const gradingData = gradingRes.data;

      if (gradingData && Array.isArray(gradingData.grades)) {
        parsedScale = gradingData.grades
          .map((item: any) => ({
            min: Number(item.minScore ?? 0),
            max: Number(item.maxScore ?? 100),
            grade: String(item.grade || "?"),
            remark: String(item.remark || ""),
          }))
          .filter((item) => !isNaN(item.min) && !isNaN(item.max)) // skip invalid
          .sort((a, b) => b.min - a.min); // descending order (highest first)
      }

      // Optional fallback if endpoint fails or returns no grades
      if (parsedScale.length === 0) {
        console.warn("No valid grades from /grading – using fallback");
        parsedScale = [
          { min: 70, max: 100, grade: "A", remark: "Excellent" },
          { min: 60, max: 69,  grade: "B", remark: "Very Good" },
          { min: 50, max: 59,  grade: "C", remark: "Good" },
          { min: 45, max: 49,  grade: "D", remark: "Poor" },
          { min: 0,  max: 44,  grade: "F", remark: "Fail" },
        ];
      }

      setGradingScale(parsedScale);
      // ──────────────────────────────────────────────────────────────────────

      // Your existing transformation (unchanged)
      const displayData: ReportDisplay = {
        schoolName: raw.school.schoolName,
        schoolAddress: raw.school.schoolAddress,
        schoolPhone: raw.school.phoneNumber,
        schoolEmail: raw.school.email,
        schoolLogo: raw.school.schoolLogo,
        authorizedSignature: raw.school.authorizedSignature,
        teacher_name: raw.class_teacher?.fullName,
        teacher_signature: raw.class_teacher?.signature,
        term: raw.term,
        academicYear: raw.academicYear,
        fullName: raw.fullName.trim(),
        className: raw.className,
        gender: raw.gender,
        admissionNo: raw.admissionNo || "—",
        dob: raw.dob,
        age: raw.age,
        house: raw.house || "—",
        club: raw.club || "—",
        class_teacher_comment: raw.comments?.classTeacherComment || "",
        principal_comment: raw.comments?.principalComment || "",
        passportUrl: raw.passportUrl || "/placeholder-passport.jpg",
        subjects: raw.subjects.map((s: any) => {
          let caTotal = 0;
          Object.entries(s).forEach(([key, value]) => {
            if (
              /ca|assessment|test|quiz|cont|continuous/i.test(key) &&
              !/exam|total|grade|position|remark|subject/i.test(key)
            ) {
              const num = Number(value);
              if (!isNaN(num)) {
                caTotal += num;
              }
            }
          });

          return {
            subjectName: s.subjectName || "—",
            ca: caTotal.toFixed(2),
            exam: s.Exam || "—",
            total: s.total || "—",
            grade: s.grade || "—",
            position: s.position || "—",
            remark: s.remark || "—",
          };
        }),
        affective: raw.domains?.affective || [],
        psychomotor: raw.domains?.psychomotor || [],
        attendance: raw.attendance,
        teacherComment: "",
        principalComment: "",
        nextTermBegins: "",
      };

      setReport(displayData);
    } catch (err: any) {
      console.error("Failed to fetch report or grading:", err);
      const msg =
        err?.response?.data?.message ||
        "Could not load student report or grading scale";
      setError(msg);
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  fetchReportAndGrading();
}, [studentId]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Report_${report?.fullName?.replace(/[^a-zA-Z0-9]/g, "_") || "Student"}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 10mm 12mm; }
      body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4; color: black; }
    `,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <span className="ml-4 text-gray-600">Loading student report...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-red-600">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p>{error || "Report not found"}</p>
        <Button variant="outline" className="mt-6" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:p-0 print:min-h-0">
      {/* Screen-only print button */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden">
        <Button
          onClick={handlePrint}
          className="gap-2 bg-blue-700 hover:bg-blue-800 text-white"
        >
          <PrinterIcon className="h-4 w-4" />
          Print Report Card
        </Button>
      </div>

      {/* Printable content */}
      <div
        ref={printRef}
        className="mx-auto w-full max-w-[210mm] bg-white print:max-w-none print:shadow-none"
      >
        <div className="p-6 md:p-10 print:p-[10mm] print:text-[11pt] print:leading-tight text-black font-serif">
          {/* Header – using real school data */}
          <div className="text-center mb-5 print:mb-4">
            <div className="flex justify-center items-center gap-4 mb-2 print:gap-3">
              {/* <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold print:w-12 print:h-12">
                LOGO
              </div> */}
              <div className="w-30 h-30  overflow-hidden flex-shrink-0">
                                        {report.schoolLogo ? (
                                          <Image
                                            width={100}
                                            height={100}
                                            src={`${process.env.NEXT_PUBLIC_FILE_URL}${report.schoolLogo}`}
                                            alt={report.schoolName}
                                            unoptimized                // ← bypasses Next.js image optimization
  priority                    // ← tells browser to load early (important for print)
  loading="eager"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">
                                            {report.schoolName[0].toUpperCase()}
                                          </div>
                                        )}
                                      </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide print:text-2xl print:tracking-normal">
                  {report.schoolName}
                </h1>
                <p className="text-xs print:text-[9pt] mt-0.5">
                  {report.schoolAddress}
                </p>
                <p className="text-xs print:text-[9pt]">
                  TEL: {report.schoolPhone} | Email: {report.schoolEmail}
                </p>
              </div>
            </div>

            <h2 className="text-lg md:text-xl font-bold uppercase mt-3 print:text-lg print:mt-2">
              {report.term.toUpperCase()} {report.academicYear} ACADEMIC SESSION STUDENT'S REPORT
            </h2>
          </div>

          {/* Student Info + Photo */}
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-6 mb-6 print:gap-4 print:grid-cols-[100px_1fr]">
            <div className="flex justify-center md:justify-start print:justify-start">
              <div className="w-28 h-36 border-2 border-black overflow-hidden bg-gray-100 print:w-24 print:h-32">
                {/* <img
                  src={report.passportUrl}
                  alt="Student"
                  className="w-full h-full object-cover"
                /> */}
                {report.schoolLogo ? (
                                          <Image
                                            width={100}
                                            height={100}
                                            src={`${process.env.NEXT_PUBLIC_FILE_URL}${report.passportUrl}`}
                                            alt={report.fullName}
                                            unoptimized                // ← bypasses Next.js image optimization
  priority                    // ← tells browser to load early (important for print)
  loading="eager"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">
                                            {report.fullName[0].toUpperCase()}
                                          </div>
                                        )}
              </div>
            </div>

            <div className="space-y-1 text-sm print:text-[10.5pt] print:space-y-0.5">
              <p><strong>NAME:</strong> {report.fullName}</p>
              <p><strong>CLASS:</strong> {report.className}</p>
              <p><strong>SESSION:</strong> {report.academicYear}</p>
              <p><strong>GENDER:</strong> {report.gender}</p>
              <p><strong>ADMISSION NO:</strong> {report.admissionNo || "—"}</p>
              <p><strong>D.O.B:</strong> {report.dob}  <strong>AGE:</strong> {report.age}yrs</p>
              <p><strong>HOUSE:</strong> {report.house || "—"}</p>
              <p><strong>CLUB/SOCIETY:</strong> {report.club || "—"}</p>
            </div>
          </div>

          {/* Cognitive Domain */}
          <div className="mb-6 print:mb-4">
            <h3 className="text-base font-bold uppercase mb-2 text-center print:text-[11pt] print:mb-1">
              COGNITIVE DOMAIN
            </h3>

            <div className="overflow-x-auto border border-black print:overflow-visible">
              <table className="w-full text-xs border-collapse print:text-[10pt]">
                <thead className="bg-gray-200 print:bg-gray-200">
                  <tr className="border-b-2 border-black">
                    <th className="border px-2 py-1 text-left font-medium w-[28%]">SUBJECTS</th>
                    <th className="border px-2 py-1 w-[12%]">CA</th>
                    <th className="border px-2 py-1 w-[12%]">EXAM</th>
                    <th className="border px-2 py-1 w-[12%]">TOTAL</th>
                    <th className="border px-2 py-1 w-[8%]">GRADE</th>
                    <th className="border px-2 py-1 w-[10%]">POSITION</th>
                    <th className="border px-2 py-1 w-[18%]">REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {report.subjects.map((sub, i) => (
                    <tr key={i} className="border-b">
                      <td className="border px-2 py-1">{sub.subjectName}</td>
                      <td className="border px-2 py-1 text-center">{sub.ca}</td>
                      <td className="border px-2 py-1 text-center">{sub.exam}</td>
                      <td className="border px-2 py-1 text-center font-medium">{sub.total}</td>
                      <td className="border px-2 py-1 text-center">{sub.grade}</td>
                      <td className="border px-2 py-1 text-center">{sub.position}</td>
                      <td className="border px-2 py-1">{sub.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs print:mt-2 print:flex print:justify-between print:gap-4 print:text-[10pt]">
              <div>
                <p><strong>Total Obtained:</strong> {report.subjects.reduce((sum, s) => sum + Number(s.total || 0), 0).toFixed(2)}</p>
                <p><strong>Total Obtainable:</strong> {report.subjects.length * 100}</p>
                <p><strong>Percentage:</strong> {report.subjects.length ? ((report.subjects.reduce((sum, s) => sum + Number(s.total || 0), 0) / (report.subjects.length * 100)) * 100).toFixed(1) : 0}%</p>
              </div>
              <div>
                {/* You may need to calculate overall grade on backend or here */}
                <p><strong>Grade:</strong> <strong>F</strong></p>
                <p><strong>Remark:</strong> FAIL</p>
              </div>
              <div>
                <p><strong>No of Subjects Offered:</strong> {report.subjects.length}</p>
              </div>
            </div>
          </div>

         {/* Attendance + Affective + Psychomotor */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:grid-cols-3 print:gap-3 print:mb-4">
  <div className="border border-black p-3 print:p-2">
    <h4 className="font-bold text-center mb-1.5 print:text-[10.5pt] print:mb-1">
      ATTENDANCE SUMMARY
    </h4>
    <p className="text-xs print:text-[10pt]">
      No of Times School Opened: <strong>{report?.attendance?.timesSchoolOpened ?? "—"}</strong>
    </p>
    <p className="text-xs print:text-[10pt]">
      No of Times Present: <strong>{report?.attendance?.timesPresent ?? "—"}</strong> (
      {report?.attendance?.percentage?.toFixed(1) ?? "—"}%)
    </p>
  </div>

{/* Affective Domain */}
<div className="border border-black p-3 print:p-2">
  <h4 className="font-bold text-center mb-1.5 print:text-[10.5pt] print:mb-1">
    AFFECTIVE DOMAIN
  </h4>
  <div className="space-y-0.5 text-xs print:text-[10pt]">
    {report?.affective?.map((item, i) => (
  <div key={i} className="flex justify-between">
    <span>{item.name}</span>
    <span className="font-medium">{item.rating ?? "—"}</span>
  </div>
))}
  </div>
</div>

{/* Psychomotor Domain – same pattern */}
<div className="border border-black p-3 print:p-2">
  <h4 className="font-bold text-center mb-1.5 print:text-[10.5pt] print:mb-1">
    PSYCHOMOTOR DOMAIN
  </h4>
  <div className="space-y-0.5 text-xs print:text-[10pt]">
    
      {report.psychomotor.map((item, i) => (
        <div key={i} className="flex justify-between">
          <span>{item.name}</span>
          <span className="font-medium">{item.rating ?? "—"}</span>
        </div>
     ))}
  </div>
</div>
</div>
   
  {/* Grade Scale – dynamic from /grading */}
<div className="border border-black p-3 mb-6 print:p-2 print:mb-4 text-xs print:text-[9.5pt]">
  <h4 className="font-bold text-center mb-2 print:mb-1 print:text-[10.5pt]">
    GRADE SCALE
  </h4>
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
    {gradingScale.length > 0 ? (
      gradingScale.map((item, index) => (
        <div key={index} className="flex items-center gap-2 whitespace-nowrap">
          <span className="font-medium">{item.min}–{item.max}%</span>
          <span className="font-bold text-lg print:text-base">{item.grade}</span>
          <span className="text-gray-700 print:text-black">({item.remark})</span>
        </div>
      ))
    ) : (
      <div className="text-amber-700">Grade scale not available</div>
    )}
  </div>
</div>

        {/* Remarks – Teacher & Principal */}
<div className="space-y-7 print:space-y-5 mt-8 print:mt-5">
  {/* Class Teacher */}
  <div>
    <p className="font-medium mb-1.5 print:mb-1 print:text-[10.5pt]">
      Class Teacher's Comment:
    </p>
    <div className="border border-gray-400 rounded-sm min-h-[70px] px-4 py-3 italic text-xs print:text-[10pt] print:min-h-[55px] print:p-2.5 bg-white/50">
      {report.class_teacher_comment || "............................................................................................."}
    </div>

    <div className="mt-4 flex justify-end items-end gap-5 print:mt-3 print:gap-4">
      <div className="text-right">
        <p className="text-xs print:text-[10pt] font-medium mb-1.5">
          {report.teacher_name || "Class Teacher's Name"}
        </p>

        <div className="flex flex-col items-end">
          {report.teacher_signature ? (
            <div className="w-30 h-15 overflow-hidden bg-white  border-gray-300 rounded-sm print:w-36 print:h-18">
              <Image
                width={200}
                height={100}
                src={`${process.env.NEXT_PUBLIC_FILE_URL}${report.teacher_signature}`}
                alt="Class Teacher Signature"
                unoptimized
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-40 h-20 border border-dashed border-gray-400 rounded-sm flex items-center justify-center text-xs text-gray-500 print:w-36 print:h-18">
              Signature
            </div>
          )}
          <div className="border-b-2 border-black w-64 mt-2 print:w-56 print:mt-1.5"></div>
        </div>
      </div>
    </div>
  </div>

  {/* Principal */}
  <div>
    <p className="font-medium mb-1.5 print:mb-1 print:text-[10.5pt]">
      Principal's Remark:
    </p>
    <div className="border border-gray-400 rounded-sm min-h-[70px] px-4 py-3 italic text-xs print:text-[10pt] print:min-h-[55px] print:p-2.5 bg-white/50">
      {report.principal_comment || "........................................................................................."}
    </div>

    <div className="mt-4 flex justify-end items-end gap-5 print:mt-3 print:gap-4">
      <div className="text-right">
        <p className="text-xs print:text-[10pt] font-medium mb-1.5">
          Principal
        </p>

        <div className="flex flex-col items-end">
          {report.authorizedSignature ? (
            <div className="w-30 h-15 overflow-hidden bg-white border-gray-300 rounded-sm print:w-36 print:h-18">
              <Image
                width={200}
                height={100}
                src={`${process.env.NEXT_PUBLIC_FILE_URL}${report.authorizedSignature}`}
                alt="Principal Signature"
                unoptimized
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-40 h-20 border border-dashed border-gray-400 rounded-sm flex items-center justify-center text-xs text-gray-500 print:w-36 print:h-18">
              Signature
            </div>
          )}
          <div className="border-b-2 border-black w-64 mt-2 print:w-56 print:mt-1.5"></div>
        </div>
      </div>
    </div>
  </div>

  {/* Next Term Begins & Date */}
  <div className="text-center mt-10 print:mt-6 text-sm print:text-[10.5pt] font-medium">
    <p>
      <strong>Next Term Begins:</strong> {report.nextTermBegins || "To Be Announced"}
         
      <strong>Date:</strong> {format(new Date(), "do MMMM yyyy")}
    </p>
  </div>
{/* </div> */}


</div>
        </div>
      </div>
    </div>
  );
}