"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../../lib/api";

export interface School {
  schoolId: number;
  schoolName: string;
  schoolLogo: string | null;
  isDefault: number;
}

interface SchoolContextType {
  schools: School[];
  currentSchool: School | null;
  loading: boolean;
  switchSchool: (school: School) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider = ({ children }: { children: React.ReactNode }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/user", { withCredentials: true });
      const data = res.data;

      const fetchedSchools: School[] =
        (data.user?.default_school || []).map((t: any) => ({
          schoolId: t.schoolId,
          schoolName: t.schoolName,
          schoolLogo: t.schoolLogo,
          isDefault: Number(t.isDefault),
        }));

      const defaultSchool =
        fetchedSchools.find((t) => t.isDefault === 1) ||
        fetchedSchools[0] ||
        null;

//       const defaultSchoolData = data.user?.default_school;

// const fetchedSchools: School[] = defaultSchoolData
//   ? [{
//       schoolId: defaultSchoolData.schoolId,
//       schoolName: defaultSchoolData.schoolName,
//       schoolLogo: defaultSchoolData.schoolLogo,
//       isDefault: 1,
//     }]
//   : [];

// const defaultSchool = fetchedSchools[0] || null;

      setSchools(fetchedSchools);
      setCurrentSchool(defaultSchool);

      console.log("Current school:", defaultSchool);

      // ← ONLY IN BROWSER
      if (typeof window !== "undefined" && defaultSchool) {
        localStorage.setItem("currentSchoolId", String(defaultSchool.schoolId));
        localStorage.setItem("currentSchool", JSON.stringify(defaultSchool));
      }
    } catch (err) {
      console.error("Failed to fetch school data:", err);
      setSchools([]);
      setCurrentSchool(null);

      // ← ONLY IN BROWSER
      if (typeof window !== "undefined") {
        localStorage.removeItem("currentSchoolId");
        localStorage.removeItem("currentSchool");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const switchSchool = async (school: School) => {
    if (school.schoolId === currentSchool?.schoolId) return;

    setLoading(true);
    try {
      await api.patch(`/schools/${school.schoolId}/set-default`, {});

      setCurrentSchool(school);
      setSchools((prev) =>
        prev.map((t) => ({
          ...t,
          isDefault: t.schoolId === school.schoolId ? 1 : 0,
        }))
      );

      // ← ONLY IN BROWSER
      if (typeof window !== "undefined") {
        localStorage.setItem("currentSchool", JSON.stringify(school));
        localStorage.setItem("currentSchoolId", String(school.schoolId));
      }
    } catch (err) {
      console.error("Failed to switch school:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  return (
    <SchoolContext.Provider
      value={{
        schools,
        currentSchool,
        loading,
        switchSchool,
        refreshUserData,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used inside SchoolProvider");
  return ctx;
};