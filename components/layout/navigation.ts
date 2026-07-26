import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
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
    label: "Main",
    items: [{ label: "Dashboard", href: "/dashboard", icon: Home }],
  },
  {
    label: "Academic Management",
    items: [
      { label: "Academic Years", href: "/academics", icon: CalendarDays },
      { label: "Faculties", href: "/faculties", icon: Building2 },
      { label: "Departments", href: "/departments", icon: Layers },
      { label: "Semesters", href: "/semesters", icon: BookOpen },
      { label: "Courses", href: "/courses", icon: GraduationCap },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Students", href: "/students", icon: Users },
      { label: "Administrators", href: "/administrators", icon: Shield, roles: ["SUPER_ADMIN"] },
      { label: "Users", href: "/users", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    label: "Examination",
    items: [
      { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
      { label: "Assessments", href: "/assessments", icon: Activity },
      { label: "Exams", href: "/exams", icon: FileText },
      { label: "Student Exams", href: "/student-exams", icon: ClipboardCheck },
      { label: "Results", href: "/results", icon: BarChart3 },
      { label: "Publish Results", href: "/results/publish", icon: ScrollText, roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    label: "Transcripts",
    items: [
      { label: "All Transcripts", href: "/transcripts", icon: FileArchive },
      { label: "Search Transcript", href: "/transcripts/search", icon: ScrollText },
      { label: "Transcript Preview", href: "/transcripts/preview", icon: FileText },
      { label: "Download Transcript PDF", href: "/transcripts/download", icon: FileArchive },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Student Performance", href: "/reports/students", icon: BarChart3 },
      { label: "Course Performance", href: "/reports/courses", icon: BarChart3 },
      { label: "Faculty Performance", href: "/reports/faculties", icon: BarChart3 },
      { label: "Department Performance", href: "/reports/departments", icon: BarChart3 },
      { label: "Semester Performance", href: "/reports/semesters", icon: BarChart3 },
      { label: "Grade Distribution", href: "/reports/grades", icon: BarChart3 },
      { label: "Pass and Fail Report", href: "/reports/pass-fail", icon: BarChart3 },
      { label: "CGPA Ranking", href: "/reports/cgpa-ranking", icon: BarChart3 },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Bulk Upload", href: "/tools/bulk-upload", icon: Upload },
      { label: "Import Data", href: "/tools/import", icon: Upload },
      { label: "Export Data", href: "/tools/export", icon: FileArchive },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Profile", href: "/profile", icon: Users },
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Audit Logs", href: "/audit-logs", icon: Activity, roles: ["SUPER_ADMIN"] },
      { label: "Logout", href: "#logout", icon: LogOut },
    ],
  },
];
