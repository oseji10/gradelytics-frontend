"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Lock, Loader2, School, UserSquare2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface School {
  schoolId: number;
  schoolName: string;
}

export default function StudentSignInPage() {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [password, setPassword] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setSchoolsLoading(true);
        setSchoolsError(null);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error("Failed to load schools");
        }

        const data = await res.json();
        const schoolList = Array.isArray(data)
          ? data
          : data.schools || data.data || [];

        setSchools(schoolList);

        if (schoolList.length === 1) {
          setSelectedSchoolId(schoolList[0].schoolId.toString());
        }
      } catch (err) {
        console.error(err);
        setSchoolsError("Could not load school list. Please try again later.");
      } finally {
        setSchoolsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSchoolId || !admissionNumber.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const loginResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/student/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            schoolId: parseInt(selectedSchoolId, 10),
            admissionNumber: admissionNumber.trim().toUpperCase(),
            password,
          }),
        }
      );

      const responseData = await loginResponse.json().catch(() => ({}));

      if (!loginResponse.ok) {
        throw new Error(responseData.message || "Login failed");
      }

      if (responseData?.user?.mustChangePassword) {
        router.push("/student/change-password");
        return;
      }

      router.push("/student/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials or server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 lg:gap-12 overflow-hidden rounded-2xl shadow-2xl bg-white">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col bg-gradient-to-br from-[#1F6F43] to-[#14532d] text-white p-10 xl:p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-10">
              <Image
                width={231}
                height={48}
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                priority
              />
            </div>

            <div className="mt-auto mb-12">
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
                Student portal access made simple
              </h1>
              <p className="text-lg xl:text-xl text-green-100/90 max-w-md">
                Select your school, then enter your admission number and password to view your dashboard, results, attendance, and CBT activities.
              </p>
            </div>

            <div className="text-sm text-green-100/70">
              Powered by <span className="font-medium">Gradelytics</span>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile branding */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <Image
                  width={231}
                  height={48}
                  src="/images/logo/logo.svg"
                  alt="Logo"
                  priority
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Student Sign In</h2>
              <p className="text-gray-600 mt-2">
                Log in to access your student dashboard
              </p>
            </div>

            <Card className="border-none shadow-none lg:shadow-lg lg:border">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-bold text-center lg:text-left text-gray-900">
                  Login
                </CardTitle>
                <CardDescription className="text-center lg:text-left">
                  Select your school and enter your student credentials
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* School Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="school" className="text-gray-700 font-medium">
                      School
                    </Label>
                    {schoolsLoading ? (
                      <div className="flex items-center justify-center h-10">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                        <span className="ml-2 text-sm text-gray-500">
                          Loading schools...
                        </span>
                      </div>
                    ) : schoolsError ? (
                      <div className="text-sm text-red-600">{schoolsError}</div>
                    ) : (
                      <Select
                        value={selectedSchoolId}
                        onValueChange={setSelectedSchoolId}
                        disabled={schools.length === 0 || loading}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500">
                          <div className="flex items-center gap-2">
                            <School className="h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="Select your school" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {schools.map((school) => (
                            <SelectItem
                              key={school.schoolId}
                              value={school.schoolId.toString()}
                            >
                              {school.schoolName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Admission Number */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="admissionNumber"
                      className="text-gray-700 font-medium"
                    >
                      Admission Number
                    </Label>
                    <div className="relative">
                      <UserSquare2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="admissionNumber"
                        type="text"
                        placeholder="Enter your admission number"
                        className="pl-11 h-12 rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                        value={admissionNumber}
                        onChange={(e) =>
                          setAdmissionNumber(e.target.value.toUpperCase())
                        }
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-11 h-12 rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-800">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-[#1F6F43] hover:bg-[#1a5c38] text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                    disabled={loading || schoolsLoading || schools.length === 0}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Login to Portal"
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-2 text-center text-sm text-gray-600">
                <p className="text-gray-500">
                  Contact your school administrator if you do not have your login details.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}