"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/StateBlocks";
import { ExportButton, ExportFormat } from "@/components/ui/ExportButton";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";

const PAGE_SIZES = [10, 25, 50];

// ======================================================
// TYPES (only fields returned by GET /api/reports/students)
// ======================================================

type StudentReportRow = {
  student_id: number;
  full_name: string;
  roll_no: string;
  gender: string;
  email: string;
  created_at: string;
  academic: { year: string };
  faculty: { faculty_name: string };
  department: { department_name: string };
  semester: { semester_name: string };
};

type StudentsReportResponse = {
  success: boolean;
  data: StudentReportRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

type FilterOption = { value: string; label: string };

function formatError(requestError: unknown): string {
  if (requestError instanceof ApiClientError) {
    return requestError.payload?.message ?? requestError.message;
  }
  return requestError instanceof Error ? requestError.message : "Something went wrong";
}

function genderTone(gender: string): "maroon" | "gray" | "amber" | "green" {
  return gender === "MALE" ? "maroon" : "amber";
}

// ======================================================
// STUDENT REPORT
// ======================================================

export function StudentsReport() {
  const user = useMemo(() => getStoredUser(), []);
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [rows, setRows] = useState<StudentReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [options, setOptions] = useState<Record<string, FilterOption[]>>({});

  // =========================================
  // DB-BACKED FILTER OPTIONS
  // =========================================

  const filterApis = useMemo(
    () => [
      { key: "academic_id", api: "/api/academics", recordsKey: "academics", valueKey: "academic_id", labelKey: "year" },
      { key: "faculty_id", api: "/api/faculties", recordsKey: "faculties", valueKey: "faculty_id", labelKey: "faculty_name" },
      { key: "department_id", api: "/api/departments", recordsKey: "departments", valueKey: "department_id", labelKey: "department_name" },
      { key: "semester_id", api: "/api/semesters", recordsKey: "semesters", valueKey: "semester_id", labelKey: "semester_name" },
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const responses = await Promise.all(filterApis.map((f) => apiClient.get<Record<string, unknown>>(f.api)));
        if (cancelled) return;

        const map: Record<string, FilterOption[]> = {};
        filterApis.forEach((filter, index) => {
          const response = responses[index];
          const direct = response?.[filter.recordsKey];
          const list = Array.isArray(direct) ? direct : (Object.values(response ?? {}).find((value) => Array.isArray(value)) as Record<string, unknown>[] | undefined) ?? [];
          map[filter.key] = list.map((row) => ({
            value: String(row[filter.valueKey]),
            label: String(row[filter.labelKey] ?? ""),
          }));
        });
        setOptions(map);
      } catch {
        // filter dropdowns render empty; the table surfaces real errors
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [filterApis]);

  // =========================================
  // SEARCH / FILTER / PAGINATION
  // =========================================

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  const load = useCallback(async () => {
    if (!isManager) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const data = await apiClient.get<StudentsReportResponse>(`/api/reports/students?${params.toString()}`);
      setRows(data.data ?? []);
      setTotal(Number(data.pagination?.total) || 0);
      setTotalPages(Math.max(1, Number(data.pagination?.totalPages) || 1));
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading(false);
    }
  }, [isManager, page, limit, search, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  function clearFilters() {
    setFilters({});
    setSearchInput("");
    setSearch("");
  }

  const hasFilters = Object.values(filters).some(Boolean);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  async function handleExport(format: ExportFormat) {
    if (format === "print") {
      window.print();
      return;
    }

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("format", format);

    const url = `/api/reports/students/export?${params.toString()}`;
    window.open(url, "_blank");
  }

  if (!isManager) {
    return (
      <AppShell title="Student Report" description="List of students with academic placement details.">
        <EmptyState title="Manager access required" message="Only Super Admins and Admins can view this report." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Student Report" description="List of students with academic placement details.">
      <div className="grid gap-6">
        {/* ============ TOOLBAR ============ */}
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                className="h-11 w-full rounded-lg border border-[#D1D5DB] pl-9 pr-3 text-sm"
                placeholder="Search students by name, roll number, or email…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ExportButton onExport={handleExport} />
              {filterApis.map((filter) => (
                <select
                  key={filter.key}
                  className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold"
                  aria-label={`Filter by ${filter.labelKey}`}
                  value={filters[filter.key] ?? ""}
                  onChange={(event) => setFilters((current) => ({ ...current, [filter.key]: event.target.value }))}
                >
                  <option value="">{filter.labelKey}: All</option>
                  {(options[filter.key] ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ))}

              {hasFilters ? (
                <Button variant="ghost" onClick={clearFilters}>
                  <Filter className="h-4 w-4" />
                  Clear filters
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        {/* ============ STATS ============ */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Students", value: total },
            { label: "Students on this page", value: rows.length },
            { label: "Page", value: `${page} / ${totalPages}` },
          ].map((stat) => (
            <article key={stat.label} className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-[#6B7280]">{stat.label}</p>
              <p className="mt-2 text-2xl font-black">{stat.value}</p>
            </article>
          ))}
        </section>

        {/* ============ TABLE ============ */}
        <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
          {error ? (
            <div className="p-4">
              <ErrorState title="Failed to load the student report" message={error} onRetry={() => void load()} />
            </div>
          ) : loading ? (
            <div className="divide-y divide-[#E5E7EB]">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-4 py-4">
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-8 w-16 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No students found"
                message={hasFilters || search ? "Try adjusting your search or filters." : "No students have been added yet."}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-4 py-3 font-black">#</th>
                    <th className="px-4 py-3 font-black">Full Name</th>
                    <th className="px-4 py-3 font-black">Roll No</th>
                    <th className="px-4 py-3 font-black">Gender</th>
                    <th className="px-4 py-3 font-black">Email</th>
                    <th className="px-4 py-3 font-black">Academic Year</th>
                    <th className="px-4 py-3 font-black">Faculty</th>
                    <th className="px-4 py-3 font-black">Department</th>
                    <th className="px-4 py-3 font-black">Semester</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {rows.map((row, index) => (
                    <tr key={row.student_id} className="hover:bg-[#F9FAFB]">
                      <td className="px-4 py-4 font-semibold text-[#6B7280]">{(page - 1) * limit + index + 1}</td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">{row.full_name}</td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">{row.roll_no}</td>
                      <td className="px-4 py-4">
                        <Badge tone={genderTone(row.gender)}>{row.gender}</Badge>
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">{row.email}</td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">{row.academic?.year ?? "—"}</td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">{row.faculty?.faculty_name ?? "—"}</td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">{row.department?.department_name ?? "—"}</td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">{row.semester?.semester_name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ============ PAGINATION ============ */}
          {!loading && !error && rows.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-[#E5E7EB] px-4 py-3 text-sm text-[#6B7280] sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong>{" "}
                {total === 1 ? "student" : "students"}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Rows</span>
                  <select
                    className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-2 text-sm"
                    value={limit}
                    onChange={(event) => {
                      setLimit(Number(event.target.value));
                      setPage(1);
                    }}
                  >
                    {PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex gap-2">
                  <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                    Previous
                  </Button>
                  <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
