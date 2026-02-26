"use client";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { useModal } from "../../context/ModalContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../lib/api";
import { useSchool } from "../context/SchoolContext";
import { getUserEmail, getUserName } from "../../lib/auth";

interface School {
  schoolId: number;
  schoolName: string;
  schoolLogo: string | null;
  isDefault: number;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

const AppHeader: React.FC = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { isAnyModalOpen } = useModal();
  const router = useRouter();

  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSchoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const [isMobileSchoolDropdownOpen, setMobileSchoolDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // NEW STATE

  const { schools, currentSchool, loading, switchSchool } = useSchool();
  
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const schoolDropdownRef = useRef<HTMLDivElement>(null);

  const userName = getUserName();
  const userEmail = getUserEmail();
  
  // Sidebar toggle
  const handleToggle = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  // School switch handler
  const handleSchoolSwitch = async (school: School) => {
    if (school.schoolId === currentSchool?.schoolId || loading) return;

    try {
      await switchSchool(school);

      setMobileMenuOpen(false);
      setSchoolDropdownOpen(false);
      setMobileSchoolDropdownOpen(false);

      // 🔄 HARD reload to refetch everything
      window.location.reload();
    } catch (error: any) {
      console.error("Switch failed:", error);
      alert(
        error.response?.data?.message ||
          "Failed to switch school. Please try again."
      );
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await api.post("/logout", {}, { withCredentials: true });
      setIsAuthenticated(false);
      setUserData(null);
      setIsAdmin(false);
      setMobileMenuOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect to login on error
      router.push("/");
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close mobile menu
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".mobile-menu-button")
      ) {
        setMobileMenuOpen(false);
      }
      
      // Close school dropdown
      if (
        schoolDropdownRef.current &&
        !schoolDropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".school-switcher-button")
      ) {
        setSchoolDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setSchoolDropdownOpen(false);
        setMobileSchoolDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, []);

  // Fetch user data on auth check
  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        const response = await api.get("/user", { withCredentials: true });
        setIsAuthenticated(true);
        setUserData(response.data);
        // Check if user is admin
        setIsAdmin(response.data.role === 'ADMIN');
      } catch {
        setIsAuthenticated(false);
        setUserData(null);
        setIsAdmin(false);
      }
    };
    checkAuthAndFetchUser();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) router.push("/");
  }, [isAuthenticated, router]);

  // Token refresh interceptor
  const refreshToken = useCallback(async () => {
    try {
      await api.post("/refresh", {}, { withCredentials: true });
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (
          error.response?.status === 401 &&
          error.config &&
          !error.config.__isRetryRequest
        ) {
          error.config.__isRetryRequest = true;
          const refreshed = await refreshToken();
          if (refreshed) return api(error.config);
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [refreshToken]);

  // Show school switcher only if not admin and school exists
  // const showSchoolSwitcher = !isAdmin && schools.length > 0 && currentSchool;
  // Show school switcher only if user is NOT admin and school data exists
const showSchoolSwitcher = !isAdmin && schools.length > 0;

  return (
    <header
      className={`pb-1 sticky top-0 z-50 flex w-full border-b bg-white dark:border-gray-800 dark:bg-gray-900 ${
        isAnyModalOpen ? "blur-md pointer-events-none" : ""
      }`}
    >
      <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6">
        {/* LEFT: Hamburger toggle & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggle}
            className="flex h-10 w-10 items-center justify-center rounded-lg border text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          {/* <Link href="/" className="flex items-center">
            <Image
              width={160}
              height={40}
              src="/images/logo/logo.svg"
              alt="Logo"
              className="h-8 w-auto lg:h-10"
              priority
            />
          </Link> */}
        </div>

        {/* RIGHT: Desktop menu */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Desktop School Switcher - Only show for non-admin users */}
         {/* Desktop School Switcher - Only show for non-admin users */}
{showSchoolSwitcher && currentSchool && (
  <div className="relative school-switcher" ref={schoolDropdownRef}>
    <button
      onClick={() => setSchoolDropdownOpen(!isSchoolDropdownOpen)}
      className="school-switcher-button flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-900 transition-colors hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
      aria-label="Switch school"
    >
      <div className="flex items-center gap-2 truncate">
        {currentSchool.schoolLogo ? (
          <Image
            width={32}
            height={32}
            src={`${process.env.NEXT_PUBLIC_FILE_URL}${currentSchool.schoolLogo}`}
            alt={currentSchool.schoolName}
            className="h-8 w-8 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full !bg-[#1F6F43] text-xs font-medium text-white">
            {currentSchool.schoolName?.charAt(0)?.toUpperCase() || "T"}
          </div>
        )}
        <span className="truncate max-w-[1250px]">{currentSchool.schoolName}</span>
      </div>
      <svg
        className={`h-4 w-4 transition-transform ${isSchoolDropdownOpen ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {isSchoolDropdownOpen && (
      <div className="absolute right-0 mt-2 w-84 rounded-lg bg-white shadow-lg dark:bg-gray-800 z-50">
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Switch School
          </div>
          {schools.map((school) => (
            school.schoolId !== currentSchool.schoolId && (
              <button
                key={school.schoolId}
                onClick={() => handleSchoolSwitch(school)}
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 transition-colors"
              >
                {school.schoolLogo ? (
                  <Image
                    width={20}
                    height={20}
                    src={`${process.env.NEXT_PUBLIC_FILE_URL}${school.schoolLogo}`}
                    alt={school.schoolName}
                    className="h-5 w-5 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full !bg-gray-300 text-xs font-medium text-gray-700 dark:!bg-gray-600 dark:text-gray-300">
                    {school.schoolName?.charAt(0)?.toUpperCase() || "T"}
                  </div>
                )}
                <span className="flex-1 truncate">{school.schoolName}</span>
              </button>
            )
          ))}
        </div>
      </div>
    )}
  </div>
)}

          <ThemeToggleButton />
          {/* <NotificationDropdown /> */}
          <UserDropdown />
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 lg:hidden">
            <Link href="/" className="flex !items-left">
            <Image
              width={160}
              height={40}
              src="/images/logo/logo.svg"
              alt="Logo"
              className="h-8 w-auto lg:h-10"
              priority
            />
          </Link>
          <ThemeToggleButton mobile />
          
          {/* Mobile menu */}
          <div className="relative" ref={mobileMenuRef}>
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button flex h-10 w-10 items-center justify-center rounded-lg border text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              aria-label="Open menu"
            >
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              )}
            </button>

            {isMobileMenuOpen && (
              <div className="mobile-menu absolute right-0 mt-2 w-72 rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
                {/* User info section - Displayed directly instead of dropdown */}
                {userData && (
                  <div className="border-b dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {userData.avatar ? (
                        <Image
                          width={48}
                          height={48}
                          src={userData.avatar}
                          alt={userData.name}
                          className="h-12 w-12 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          <span className="text-lg font-semibold">
                            {userName?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {userName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {userEmail}
                        </p>
                        {userData.role && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                            {userData.role}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Logout button */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}

                {/* Current school info - Show for all users, but only if school exists */}
                {currentSchool && (
                  <div className="border-b dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {currentSchool.schoolLogo ? (
                        <Image
                          width={32}
                          height={32}
                          src={`${process.env.NEXT_PUBLIC_FILE_URL}${currentSchool.schoolLogo}`}
                          alt={currentSchool.schoolName}
                          className="h-8 w-8 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full !bg-[#1F6F43] text-xs font-medium text-white">
                          {currentSchool.schoolName?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current School</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {currentSchool.schoolName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* School switcher section - Only show for non-admin users */}
                {showSchoolSwitcher && (
                  <div className="border-b dark:border-gray-700">
                    <button
                      onClick={() => setMobileSchoolDropdownOpen(!isMobileSchoolDropdownOpen)}
                      className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Switch School
                      </span>
                      <svg
                        className={`h-4 w-4 transition-transform ${
                          isMobileSchoolDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isMobileSchoolDropdownOpen && (
                      <div className="px-4 pb-4">
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {schools.map((school) => (
                            school.schoolId !== currentSchool.schoolId && (
                              <button
                                key={school.schoolId}
                                onClick={() => handleSchoolSwitch(school)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                {school.schoolLogo ? (
                                  <Image
                                    width={32}
                                    height={32}
                                    src={`${process.env.NEXT_PUBLIC_FILE_URL}${school.schoolLogo}`}
                                    alt={school.schoolName}
                                    className="h-8 w-8 rounded-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full !bg-gray-300 text-sm font-medium text-gray-700 dark:!bg-gray-600 dark:text-gray-300">
                                    {school.schoolName?.charAt(0)?.toUpperCase() || "T"}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {school.schoolName}
                                  </div>
                                  {school.isDefault === 1 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Default
                                    </div>
                                  )}
                                </div>
                              </button>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Settings link (optional) - Commented out as requested */}
                {/* <div className="p-4">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push("/settings/profile");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                </div> */}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;