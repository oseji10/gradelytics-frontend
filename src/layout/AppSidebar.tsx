// components/sidebar/AppSidebar.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import Icon from "@/components/Icons";
import {
  GridIcon,
  GroupIcon,
  DocsIcon,
  PageIcon,
  UserCircleIcon,
  BoxIconLine,
  ChevronDownIcon,
  ChevronRightIcon,
  HorizontaLDots,
  ChatIcon,
  UserIcon,
  LockIcon,
  ClassRoomIcon,
  StudentsIcon,
  TeacherIcon,
  ParentIcon,
  SubjectIcon,
  SchoolIcon,
  AttendanceIcon,
  AssessmentIcon,
  ReportIcon,
  CBTIcon,
} from "../icons/index";
import SidebarWidget from "./SidebarWidget";

// ====== USER ROLE TYPE ======
type UserRole = "super_admin" | "admin" | "user" | "teacher" | null;

// ====== MENU ITEM TYPE ======
interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

// ====== GET CURRENT USER ROLE ======
const useUserRole = (): UserRole => {
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      setRole(parsed.role || "user");
    }
  }, []);

  return role;
};

// ====== MENU CONFIGURATION ======
const getMenuItems = (role: UserRole): MenuItem[] => {
  const baseItems: MenuItem[] = [
    {
      icon: <Icon src={GridIcon} />,
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: <Icon src={SchoolIcon} />,
      name: "Schools",
      path: "/dashboard/admin/schools",
    },
    {
      icon: <Icon src={ClassRoomIcon} />,
      name: "Classes",
      path: "/dashboard/admin/classes",
    },
    {
      icon: <Icon src={SubjectIcon} />,
      name: "Subjects",
      path: "/dashboard/admin/subjects",
    },
    {
      icon: <Icon src={TeacherIcon} />,
      name: "Teachers",
      path: "/dashboard/admin/teachers",
    },
    {
      icon: <Icon src={ParentIcon} />,
      name: "Parents",
      path: "/dashboard/admin/parents",
    },
    {
      icon: <Icon src={StudentsIcon} />,
      name: "Students",
      path: "/dashboard/admin/students",
    },
    {
      icon: <Icon src={AttendanceIcon} />,
      name: "Attendance",
      path: "/dashboard/admin/attendance",
    },

    // ── ASSESSMENT with submenu ──────────────────────────────
    {
      icon: <Icon src={AssessmentIcon} />,
      name: "Assessment",
      children: [
        {
          icon: <Icon src={StudentsIcon} />,
          name: "Continuous Assessment",
          path: "/dashboard/admin/continuous-assessment",
        },
        {
          icon: <Icon src={PageIcon} />,
          name: "Psychomotor",
          path: "/dashboard/admin/psychomotor-domain",
        },
        {
          icon: <Icon src={ReportIcon} />,
          name: "Affective",
          path: "/dashboard/admin/affective-domain",
        },
        // {
        //   icon: <Icon src={TeacherIcon} />,
        //   name: "Question Bank",
        //   path: "/dashboard/admin/assessment/questions",
        // },
      ],
    },

    // ── REPORTS with submenu ──────────────────────────────
    {
      icon: <Icon src={ReportIcon} />,
      name: "Reports",
      children: [
        // {
        //   icon: <Icon src={StudentsIcon} />,
        //   name: "Student Performance",
        //   path: "/dashboard/admin/student-performance",
        // },
        {
          icon: <Icon src={AttendanceIcon} />,
          name: "Broadsheet Report",
          path: "/dashboard/admin/broadsheet-report",
        },
        {
          icon: <Icon src={AttendanceIcon} />,
          name: "Attendance Report",
          path: "/dashboard/admin/reports/attendance",
        },
        {
          icon: <Icon src={AssessmentIcon} />,
          name: "Exam & Assessment Results",
          path: "/dashboard/admin/reports/exam-results",
        },
        {
          icon: <Icon src={ParentIcon} />,
          name: "Parent Feedback",
          path: "/dashboard/admin/reports/feedback",
        },
        {
          icon: <Icon src={TeacherIcon} />,
          name: "Teacher Performance",
          path: "/dashboard/admin/reports/teacher-performance",
        },
      ],
    },


    // CBT Management with submenus
    {
      icon: <Icon src={CBTIcon} />,
      name: "CBT & Exams",
      children: [
        {
          icon: <Icon src={CBTIcon} />,
          name: "CBTs",
          path: "/dashboard/admin/cbt",
        },
        {
          icon: <Icon src={AttendanceIcon} />,
          name: "Question Bank",
          path: "/dashboard/admin/cbt/questions",
        },
        // {
        //   icon: <Icon src={AttendanceIcon} />,
        //   name: "Exam Builder",
        //   path: "/dashboard/admin/cbt/exam-builder",
        // },
        // {
        //   icon: <Icon src={AssessmentIcon} />,
        //   name: "Exam & Assessment Results",
        //   path: "/dashboard/admin/reports/exam-results",
        // },
        // {
        //   icon: <Icon src={ParentIcon} />,
        //   name: "Parent Feedback",
        //   path: "/dashboard/admin/reports/feedback",
        // },
        // {
        //   icon: <Icon src={TeacherIcon} />,
        //   name: "Teacher Performance",
        //   path: "/dashboard/admin/reports/teacher-performance",
        // },
      ],
    },

      {
      icon: <Icon src={LockIcon} />,
      name: "Pin Management",
      path: "/dashboard/admin/pin-management",
    },

   
    {
      icon: <Icon src={LockIcon} />,
      name: "Settings",
      path: "/dashboard/admin/settings",
    },
    {
      icon: <Icon src={ChatIcon} />,
      name: "Support",
      path: "/dashboard/admin/support",
    },
    // {
    //   icon: <Icon src={UserCircleIcon} />,
    //   name: "Profile",
    //   path: "/dashboard/profile",
    // },
  ];

  // Super Admin sees Businesses (Tenants)
  if (role === "super_admin") {
    return [
      {
        icon: <Icon src={GroupIcon} />,
        name: "Businesses",
        path: "/dashboard/schools",
      },
      ...baseItems,
    ];
  }

  // Teacher sees limited menu
  if (role === "teacher") {
    return [
      { icon: <Icon src={GridIcon} />, name: "Dashboard", path: "/dashboard" },
      { icon: <Icon src={StudentsIcon} />, name: "My Students", path: "/dashboard/my-students" },
      { icon: <Icon src={ClassRoomIcon} />, name: "My Classes", path: "/dashboard/my-classes" },
      { icon: <Icon src={AssessmentIcon} />, name: "Assessments", path: "/dashboard/assessments" },
      { icon: <Icon src={ReportIcon} />, name: "Reports", path: "/dashboard/reports" },
      { icon: <Icon src={ChatIcon} />, name: "Support", path: "/dashboard/support" },
      { icon: <Icon src={UserCircleIcon} />, name: "Profile", path: "/dashboard/profile" },
    ];
  }

  // Default: admin sees full menu
  return baseItems;
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const userRole = useUserRole();

  const navItems = getMenuItems(userRole);

  // Track open/closed state of each submenu by name
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const isActive = useCallback(
    (path?: string) => {
      if (!path) return false;
      if (path === "/dashboard") return pathname === "/dashboard" || pathname === "/dashboard/";
      return pathname === path || pathname.startsWith(path + "/");
    },
    [pathname]
  );

  const isSubmenuActive = (children: MenuItem[] = []) =>
    children.some((item) => isActive(item.path));

  const renderMenuItems = () => (
    <ul className="flex flex-col gap-2">
      {navItems.map((item) => {
        const hasChildren = !!item.children?.length;
        const isOpen = !!openSubmenus[item.name];
        const active = hasChildren ? isSubmenuActive(item.children) : isActive(item.path);

        return (
          <li key={item.name}>
            {hasChildren ? (
              // Expandable parent item
              <button
                type="button"
                onClick={() => toggleSubmenu(item.name)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all
                  ${active ? "bg-[#1F6F43] text-white" : "hover:bg-[#1F6F43]/10 text-gray-700 dark:text-gray-300"}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-all ${
                      active ? "text-white" : "text-gray-500 group-hover:text-[#1F6F43]"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </div>

                {(isExpanded || isHovered || isMobileOpen) && (
                  <Icon
                    src={isOpen ? ChevronDownIcon : ChevronRightIcon}
                    className={`h-4 w-4 transition-transform ${active ? "text-white" : "text-gray-400"}`}
                  />
                )}
              </button>
            ) : (
              // Regular link
              <Link
                href={item.path || "#"}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all
                  ${active ? "bg-[#1F6F43] text-white" : "hover:bg-[#1F6F43]/10 text-gray-700 dark:text-gray-300"}`}
              >
                <span
                  className={`transition-all ${
                    active ? "text-white" : "text-gray-500 group-hover:text-[#1F6F43]"
                  }`}
                >
                  {item.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            )}

            {/* Submenu items */}
            {hasChildren && isOpen && (isExpanded || isHovered || isMobileOpen) && (
              <ul className="mt-1 space-y-1 pl-9">
                {item.children?.map((child) => (
                  <li key={child.name}>
                    <Link
                      href={child.path || "#"}
                      className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors
                        ${isActive(child.path) 
                          ? "text-[#1F6F43] font-medium bg-[#1F6F43]/5" 
                          : "text-gray-600 hover:text-[#1F6F43] hover:bg-[#1F6F43]/5 dark:text-gray-300 dark:hover:text-white"}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
                      <span>{child.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className="hidden lg:block py-8 flex items-center pt-5">
        <Link href="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={250}
                height={70}
                priority
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={250}
                height={70}
                priority
              />
            </>
          ) : (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo-icon.svg"
                alt="Logo Icon"
                width={32}
                height={32}
                priority
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-icon-dark.svg"
                alt="Logo Icon"
                width={32}
                height={32}
                priority
              />
            </>
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <Icon src={HorizontaLDots} />}
              </h2>

              {renderMenuItems()}
            </div>
          </div>
        </nav>

        {/* {(isExpanded || isHovered || isMobileOpen) && userRole !== "admin" && <SidebarWidget />} */}
      </div>
    </aside>
  );
};

export default AppSidebar;