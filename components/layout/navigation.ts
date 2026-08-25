import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calculator,
  CalendarDays,
  ClipboardCheck,
  FileArchive,
  FileText,
  GraduationCap,
  Home,
  Layers,
  LogOut,
  ScrollText,
  Settings,
  Shield,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/types/api";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Student Portal",
    items: [
      { label: "Dashboard", href: "/student/dashboard", icon: Home, roles: ["STUDENT"] },
      { label: "My Profile", href: "/student/profile", icon: Users, roles: ["STUDENT"] },
      { label: "My Courses", href: "/student/courses", icon: BookOpen, roles: ["STUDENT"] },
      { label: "My Attendance", href: "/student/attendance", icon: ClipboardCheck, roles: ["STUDENT"] },
      { label: "My Assessments", href: "/student/assessments", icon: Activity, roles: ["STUDENT"] },
      { label: "My Exams", href: "/student/exams", icon: FileText, roles: ["STUDENT"] },
      { label: "My Results", href: "/student/results", icon: BarChart3, roles: ["STUDENT"] },
      { label: "My Transcript", href: "/student/transcript", icon: FileArchive, roles: ["STUDENT"] },
    ],
  },
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Notifications", href: "/notifications", icon: Bell, roles: ["SUPER_ADMIN", "ADMIN", "STUDENT"] },
    ],
  },
  {
    label: "Academic Management",
    items: [
      { label: "Academic Years", href: "/academics", icon: CalendarDays, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Faculties", href: "/faculties", icon: Building2, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Departments", href: "/departments", icon: Layers, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Semesters", href: "/semesters", icon: BookOpen, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Courses", href: "/courses", icon: GraduationCap, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Students", href: "/students", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Administrators", href: "/administrators", icon: Shield, roles: ["SUPER_ADMIN"] },
      { label: "Users", href: "/users", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    label: "Examination",
    items: [
      { label: "Attendance", href: "/attendance", icon: ClipboardCheck, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Assessments", href: "/assessments", icon: Activity, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Exams", href: "/exams", icon: FileText, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Student Exams", href: "/student-exams", icon: ClipboardCheck, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Results", href: "/results", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Generate Results", href: "/results/generate", icon: Calculator, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Publish Results", href: "/results/publish", icon: ScrollText, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    label: "Transcripts",
    items: [
      { label: "All Transcripts", href: "/transcripts", icon: FileArchive, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Search Transcript", href: "/transcripts/search", icon: ScrollText, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Transcript Preview", href: "/transcripts/preview", icon: FileText, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Download Transcript PDF", href: "/transcripts/download", icon: FileArchive, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Student Performance", href: "/reports/students", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Course Performance", href: "/reports/courses", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Faculty Performance", href: "/reports/faculties", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Department Performance", href: "/reports/departments", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Semester Performance", href: "/reports/semesters", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Grade Distribution", href: "/reports/grades", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Pass and Fail Report", href: "/reports/pass-fail", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "CGPA Ranking", href: "/reports/cgpa-ranking", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Bulk Upload", href: "/tools/bulk-upload", icon: Upload, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Import Data", href: "/tools/import", icon: Upload, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Export Data", href: "/tools/export", icon: FileArchive, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Profile", href: "/profile", icon: Users },
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Audit Logs", href: "/audit-logs", icon: Activity, roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Logout", href: "#logout", icon: LogOut },
    ],
  },
];
