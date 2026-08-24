import type { UploadKind } from "@/types/upload";

export type ModuleField = {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  options?: string[];
  optionsApi?: string;
  optionValue?: string;
  optionLabel?: string;
  dependsOn?: { field: string; optionKey: string }[];
};

export type ModuleConfig = {
  title: string;
  description: string;
  entity: string;
  apiPath?: string;
  recordsKey?: string;
  columns: string[];
  fields: ModuleField[];
  uploads?: UploadKind[];
  filters: string[];
};

export const moduleConfigs: Record<string, ModuleConfig> = {
  administrators: {
    title: "Administrators",
    description: "Manage system administrators and role-based staff access.",
    entity: "Administrator",
    apiPath: "/api/admins",
    recordsKey: "admins",
    columns: ["Username", "Email", "Role", "Created"],
    fields: [
      { name: "username", label: "Username", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "role", label: "Role", type: "select", options: ["SUPER_ADMIN", "ADMIN", "STUDENT"], required: true },
    ],
    uploads: ["image", "document"],
    filters: ["Role", "Status"],
  },
  users: {
    title: "Users",
    description: "Review system users, authentication roles, and account status.",
    entity: "User",
    columns: ["Username", "Email", "Role", "Created"],
    fields: [
      { name: "username", label: "Username", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "role", label: "Role", type: "select", options: ["SUPER_ADMIN", "ADMIN", "STUDENT"], required: true },
    ],
    filters: ["Role", "Status"],
  },
  transcripts: {
    title: "All Transcripts",
    description: "Search, preview, print, and download verified student transcripts.",
    entity: "Transcript",
    apiPath: "/api/transcripts",
    recordsKey: "transcripts",
    columns: ["Student ID", "Full Name", "Roll Number", "CGPA", "Actions"],
    fields: [
      { name: "student_id", label: "Student", type: "select", required: true, optionsApi: "/api/students", optionValue: "student_id", optionLabel: "full_name" },
      { name: "verification_note", label: "Verification note", type: "textarea" },
    ],
    uploads: ["document"],
    filters: ["Faculty", "Department", "Academic Year"],
  },
  reports: {
    title: "Reports",
    description: "Create filtered printable academic and examination reports.",
    entity: "Report",
    columns: ["Report", "Scope", "Updated", "Export"],
    fields: [
      { name: "report_name", label: "Report name", type: "text", required: true },
      { name: "date_range", label: "Date range", type: "text" },
    ],
    filters: ["Academic Year", "Semester", "Faculty", "Department"],
  },
  tools: {
    title: "Data Tools",
    description: "Import, export, and validate university records with clear review steps.",
    entity: "Data Job",
    columns: ["Job", "Type", "Rows", "Status"],
    fields: [
      { name: "job_name", label: "Job name", type: "text", required: true },
      { name: "job_type", label: "Job type", type: "select", options: ["Import", "Export", "Bulk Upload"], required: true },
    ],
    uploads: ["spreadsheet"],
    filters: ["Type", "Status"],
  },
  profile: {
    title: "Profile",
    description: "Update profile details, avatar, identity information, and account preferences.",
    entity: "Profile",
    columns: ["Setting", "Value", "Status"],
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "text" },
    ],
    uploads: ["image", "document"],
    filters: ["Status"],
  },
  settings: {
    title: "Settings",
    description: "Maintain ATU branding, report headers, security preferences, and system defaults.",
    entity: "Setting",
    columns: ["Setting", "Area", "Updated", "Status"],
    fields: [
      { name: "university_name", label: "University name", type: "text", required: true },
      { name: "system_title", label: "System title", type: "text", required: true },
    ],
    uploads: ["image", "document"],
    filters: ["Area", "Status"],
  },
  "audit-logs": {
    title: "Audit Logs",
    description: "Review important system activity, record changes, and access events.",
    entity: "Audit Entry",
    columns: ["User", "Action", "Module", "Time"],
    fields: [
      { name: "keyword", label: "Audit keyword", type: "text" },
      { name: "date", label: "Date", type: "date" },
    ],
    filters: ["Module", "Role", "Date"],
  },
};

export function getModuleConfig(key: string) {
  return moduleConfigs[key] ?? moduleConfigs.reports;
}
