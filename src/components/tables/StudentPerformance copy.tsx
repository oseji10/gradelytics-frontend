"use client";

import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PrinterIcon } from "lucide-react";
import { useReactToPrint } from "react-to-print";

// ── Interfaces ──────────────────────────────────────────────────────────────
interface SubjectResult {
  subjectName: string;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  position: string;
  remark: string;
}

interface AffectiveItem {
  domainName: string;
  rating: string | number;
}

interface PsychomotorItem {
  domainName: string;
  rating: string | number;
}

interface StudentReport {
  fullName: string;
  className: string;
  session: string;
  gender: string;
  admissionNo: string;
  dob: string;
  age: number;
  house?: string;
  club?: string;
  passportUrl?: string;
  subjects: SubjectResult[];
  totalObtained: number;
  totalPossible: number;
  percentage: number;
  overallGrade: string;
  overallRemark: string;
  attendance: {
    schoolOpened: number;
    present: number;
    percentage: number;
  };
  affective: AffectiveItem[];
  psychomotor: PsychomotorItem[];
  teacherComment: string;
  principalComment: string;
  nextTermBegins: string;
}

// ── Mock Data ───────────────────────────────────────────────────────────────
const mockReport: StudentReport = {
  fullName: "ADELEKE, FOLASHADE ESTHER",
  className: "S.S.2 B",
  session: "2025/2026",
  gender: "FEMALE",
  admissionNo: "0311640",
  dob: "Thu, 12-Aug-2009",
  age: 16,
  house: "ULAG",
  club: "CULTURAL",
  passportUrl: "/placeholder-passport.jpg",
  subjects: [
    { subjectName: "Agricultural Science", ca: 33, exam: 67, total: 100, grade: "A", position: "1st", remark: "EXCELLENT" },
    { subjectName: "Biology", ca: 29, exam: 48, total: 77, grade: "A", position: "4", remark: "EXCELLENT" },
    { subjectName: "Chemistry", ca: 31, exam: 49, total: 80, grade: "A", position: "2nd", remark: "EXCELLENT" },
    // Add more subjects as needed
  ],
  totalObtained: 1066,
  totalPossible: 1400,
  percentage: 76.1,
  overallGrade: "A",
  overallRemark: "EXCELLENT",
  attendance: { schoolOpened: 150, present: 150, percentage: 100 },
  affective: [
    { domainName: "Honesty", rating: "5" },
    { domainName: "Neatness", rating: "4" },
    { domainName: "Politeness", rating: "✓" },
  ],
  psychomotor: [
    { domainName: "Painting", rating: "4" },
    { domainName: "Handwriting", rating: "3" },
    { domainName: "Sports & Games", rating: "✓" },
  ],
  teacherComment: "Esther is a bright, diligent and studious student. Always inquisitive and ready to learn.",
  principalComment: "An outstanding result! You should keep it up.",
  nextTermBegins: "Mon, 07-January-2026",
};

export default function StudentReportPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setReport(mockReport);
      setLoading(false);
    }, 800);
  }, []);

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
        <span className="ml-4 text-gray-600">Loading report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600">
        Report not found
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

      {/* Printable report content */}
      <div
        ref={printRef}
        className="mx-auto w-full max-w-[210mm] bg-white print:max-w-none print:shadow-none"
      >
        <div className="p-6 md:p-10 print:p-[10mm] print:text-[11pt] print:leading-tight text-black font-serif">
          {/* Header */}
          <div className="text-center mb-5 print:mb-4">
            <div className="flex justify-center items-center gap-4 mb-2 print:gap-3">
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold print:w-12 print:h-12">
                LOGO
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide print:text-2xl print:tracking-normal">
                  BAILEY'S BOWEN COLLEGE
                </h1>
                <p className="text-xs print:text-[9pt] mt-0.5">
                  No 14 Davis Cole Crescent, PrimeVille Estate, Surulere, Lagos State
                </p>
                <p className="text-xs print:text-[9pt]">
                  TEL: 0704615419495 | Email: baileysbowenmed@gmail.com
                </p>
              </div>
            </div>

            <h2 className="text-lg md:text-xl font-bold uppercase mt-3 print:text-lg print:mt-2">
              FIRST TERM {report.session} ACADEMIC SESSION STUDENT'S REPORT
            </h2>
          </div>

          {/* Student Info + Photo */}
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-6 mb-6 print:gap-4 print:grid-cols-[100px_1fr]">
            <div className="flex justify-center md:justify-start print:justify-start">
              <div className="w-28 h-36 border-2 border-black overflow-hidden bg-gray-100 print:w-24 print:h-32">
                <img
                  src={report.passportUrl}
                  alt="Student"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-1 text-sm print:text-[10.5pt] print:space-y-0.5">
              <p><strong>NAME:</strong> {report.fullName}</p>
              <p><strong>CLASS:</strong> {report.className}</p>
              <p><strong>SESSION:</strong> {report.session}</p>
              <p><strong>GENDER:</strong> {report.gender}</p>
              <p><strong>ADMISSION NO:</strong> {report.admissionNo}</p>
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
                    <th className="border px-2 py-1 w-[8%]">CA</th>
                    <th className="border px-2 py-1 w-[8%]">EXAM</th>
                    <th className="border px-2 py-1 w-[8%]">TOTAL</th>
                    <th className="border px-2 py-1 w-[7%]">GRADE</th>
                    <th className="border px-2 py-1 w-[8%]">POSITION</th>
                    <th className="border px-2 py-1 w-[33%]">REMARKS</th>
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
                <p><strong>Total Obtained:</strong> {report.totalObtained}</p>
                <p><strong>Total Obtainable:</strong> {report.totalPossible}</p>
                <p><strong>Percentage:</strong> {report.percentage.toFixed(1)}%</p>
              </div>
              <div>
                <p><strong>Grade:</strong> <strong>{report.overallGrade}</strong></p>
                <p><strong>Remark:</strong> {report.overallRemark}</p>
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
                No of Times School Opened: <strong>{report.attendance.schoolOpened}</strong>
              </p>
              <p className="text-xs print:text-[10pt]">
                No of Times Present: <strong>{report.attendance.present}</strong> (
                {report.attendance.percentage.toFixed(1)}%)
              </p>
            </div>

            <div className="border border-black p-3 print:p-2">
              <h4 className="font-bold text-center mb-1.5 print:text-[10.5pt] print:mb-1">
                AFFECTIVE DOMAIN
              </h4>
              <div className="space-y-0.5 text-xs print:text-[10pt]">
                {report.affective.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.domainName}</span>
                    <span className="font-medium">{item.rating}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-black p-3 print:p-2">
              <h4 className="font-bold text-center mb-1.5 print:text-[10.5pt] print:mb-1">
                PSYCHOMOTOR DOMAIN
              </h4>
              <div className="space-y-0.5 text-xs print:text-[10pt]">
                {report.psychomotor.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.domainName}</span>
                    <span className="font-medium">{item.rating}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grade Scale */}
          <div className="border border-black p-3 mb-6 print:p-2 print:mb-4">
            <h4 className="font-bold text-center mb-1.5 print:text-[10.5pt] print:mb-1">
              GRADE SCALE
            </h4>
            <div className="grid grid-cols-2 gap-1 text-xs print:text-[9.5pt] print:gap-0.5">
              <div>70 – 100% → A → EXCELLENT</div>
              <div>60 – 69% → B → VERY GOOD</div>
              <div>50 – 59% → C → GOOD</div>
              <div>45 – 49% → D → PASS</div>
              <div>40 – 44% → E → FAIR</div>
              <div>0 – 39% → F → FAIL</div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-5 print:space-y-4">
            <div>
              <p className="font-medium mb-1 print:mb-0.5 print:text-[10.5pt]">Teacher's Comment:</p>
              <div className="border-b border-dashed border-gray-700 min-h-[50px] px-2 py-1 italic text-xs print:text-[10pt] print:min-h-[40px]">
                {report.teacherComment}
              </div>
              <p className="text-right mt-1.5 text-xs print:mt-1 print:text-[10pt]">
                Teacher's Name & Signature: ________________________
              </p>
            </div>

            <div>
              <p className="font-medium mb-1 print:mb-0.5 print:text-[10.5pt]">Principal's Remark:</p>
              <div className="border-b border-dashed border-gray-700 min-h-[50px] px-2 py-1 italic text-xs print:text-[10pt] print:min-h-[40px]">
                {report.principalComment}
              </div>
              <p className="text-right mt-1.5 text-xs print:mt-1 print:text-[10pt]">
                Principal's Name & Signature: ________________________
              </p>
            </div>

            <p className="text-center mt-6 font-medium print:mt-4 print:text-[10pt]">
              Next Term Begins: <strong>{report.nextTermBegins}</strong>   
              Date: {format(new Date(), "do-MMM-yyyy")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}