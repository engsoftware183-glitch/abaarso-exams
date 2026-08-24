"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/StateBlocks";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";

const PAGE_SIZES = [10, 25, 50];

// ======================================================
// TYPES — only fields returned by GET /api/reports/semesters
// ======================================================

type SemesterReportRow = {
  semester_id: number;
  semester_name: string;
  academic_year: string;
  faculty_id: number;
  faculty_name: string;
  student_count: number;
  course_count: number;
  published_result_count: number;
  average_gpa: number;
  pass_count: number;
  fail_count: number;
};

type SemestersReportResponse = {
  success: boolean;
  data: SemesterReportRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

type FilterOption = { value: string; label: string };

function formatError(requestError: unknown): string {
  if (requestError instanceof ApiClientError) {
    return requestError.payload?.message ?? requestError.message;
  }
  return requestError instanceof Error ? requestError.message : "Something went wrong";
}

function gpaColor(gpa: number): string {
  if (gpa >= 3.0) return "#15803d";
  if (gpa >= 2.0) return "#b45309";
  if (gpa === 0) return "#6B7280";
  return "#b91c1c";
}

// Safely derived from returned fields only
function passRate(row: SemesterReportRow): string {
  const total = row.pass_count + row.fail_count;
  if (total === 0) return "—";
  return `${Math.round((row.pass_count / total) * 100)}%`;
}

// ======================================================
// SEMESTERS REPORT
// ======================================================

export function SemestersReport() {
  const user = useMemo(() => getStoredUser(), []);
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [rows, setRows] = useState<SemesterReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [academicFilter, setAcademicFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [academicOptions, setAcademicOptions] = useState<FilterOption[]>([]);
  const [facultyOptions, setFacultyOptions] = useState<FilterOption[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<FilterOption[]>([]);

  // =========================================
  // DB-BACKED FILTER OPTIONS
  // =========================================

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const [academicRes, facultyRes, semesterRes] = await Promise.all([
          apiClient.get<Record<string, unknown>>("/api/academics"),
          apiClient.get<Record<string, unknown>>("/api/faculties"),
          apiClient.get<Record<string, unknown>>("/api/semesters"),
        ]);
        if (cancelled) return;

        function toOptions(
          res: Record<string, unknown>,
          recordsKey: string,
          valueKey: string,
          labelKey: string
        ): FilterOption[] {
          const direct = res?.[recordsKey];
          const list = Array.isArray(direct)
            ? direct
            : (Object.values(res ?? {}).find((v) => Array.isArray(v)) as
                | Record<string, unknown>[]
                | undefined) ?? [];
          return list.map((row) => ({
            value: String(row[valueKey]),
            label: String(row[labelKey] ?? ""),
          }));
        }

        setAcademicOptions(toOptions(academicRes, "academics", "academic_id", "year"));
        setFacultyOptions(toOptions(facultyRes, "faculties", "faculty_id", "faculty_name"));
        setSemesterOptions(toOptions(semesterRes, "semesters", "semester_id", "semester_name"));
      } catch {
        // dropdowns render empty; the table surfaces real errors
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================
  // FILTER / PAGINATION
  // =========================================

  useEffect(() => {
    setPage(1);
  }, [academicFilter, facultyFilter, semesterFilter]);

  const load = useCallback(async () => {
    if (!isManager) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (academicFilter) params.set("academic_id", academicFilter);
      if (facultyFilter) params.set("faculty_id", facultyFilter);
      if (semesterFilter) params.set("semester_id", semesterFilter);

      const data = await apiClient.get<SemestersReportResponse>(
        `/api/reports/semesters?${params.toString()}`
      );
      setRows(data.data ?? []);
      setTotal(Number(data.pagination?.total) || 0);
      setTotalPages(Math.max(1, Number(data.pagination?.totalPages) || 1));
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading(false);
    }
  }, [isManager, page, limit, academicFilter, facultyFilter, semesterFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function clearFilters() {
    setAcademicFilter("");
    setFacultyFilter("");
    setSemesterFilter("");
  }

  const hasFilters =
    Boolean(academicFilter) || Boolean(facultyFilter) || Boolean(semesterFilter);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (!isManager) {
    return (
      <AppShell title="Semester Report" description="Semester-level performance metrics.">
        <EmptyState
          title="Manager access required"
          message="Only Super Admins and Admins can view this report."
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Semester Report" description="Semester-level performance metrics.">
      <div className="grid gap-6">
        {/* ============ TOOLBAR ============ */}
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold"
              aria-label="Filter by academic year"
              value={academicFilter}
              onChange={(event) => setAcademicFilter(event.target.value)}
            >
              <option value="">year: All</option>
              {academicOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold"
              aria-label="Filter by faculty"
              value={facultyFilter}
              onChange={(event) => setFacultyFilter(event.target.value)}
            >
              <option value="">faculty_name: All</option>
              {facultyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold"
              aria-label="Filter by semester"
              value={semesterFilter}
              onChange={(event) => setSemesterFilter(event.target.value)}
            >
              <option value="">semester_name: All</option>
              {semesterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {hasFilters ? (
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        </section>

        {/* ============ STATS ============ */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Semesters", value: total },
            { label: "Semesters on this page", value: rows.length },
            { label: "Page", value: `${page} / ${totalPages}` },
          ].map((stat) => (
            <article
              key={stat.label}
              className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-bold text-[#6B7280]">{stat.label}</p>
              <p className="mt-2 text-2xl font-black">{stat.value}</p>
            </article>
          ))}
        </section>

        {/* ============ TABLE ============ */}
        <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
          {error ? (
            <div className="p-4">
              <ErrorState
                title="Failed to load the semester report"
                message={error}
                onRetry={() => void load()}
              />
            </div>
          ) : loading ? (
            <div className="divide-y divide-[#E5E7EB]">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-4 py-4">
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No semesters found"
                message={
                  hasFilters
                    ? "Try clearing the filters."
                    : "No semester records have been added yet."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-4 py-3 font-black">#</th>
                    <th className="px-4 py-3 font-black">Semester</th>
                    <th className="px-4 py-3 font-black">Academic Year</th>
                    <th className="px-4 py-3 font-black">Faculty</th>
                    <th className="px-4 py-3 font-black">Students</th>
                    <th className="px-4 py-3 font-black">Courses</th>
                    <th className="px-4 py-3 font-black">Published Results</th>
                    <th className="px-4 py-3 font-black">Avg GPA</th>
                    <th className="px-4 py-3 font-black">Pass</th>
                    <th className="px-4 py-3 font-black">Fail</th>
                    <th className="px-4 py-3 font-black">Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {rows.map((row, index) => (
                    <tr key={row.semester_id} className="hover:bg-[#F9FAFB]">
                      <td className="px-4 py-4 font-semibold text-[#6B7280]">
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className="px-4 py-4 font-bold text-[#800000]">
                        {row.semester_name}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">
                        {row.academic_year}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">
                        {row.faculty_name}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">
                        {row.student_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">
                        {row.course_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">
                        {row.published_result_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="font-bold"
                          style={{ color: gpaColor(row.average_gpa) }}
                        >
                          {row.published_result_count > 0
                            ? row.average_gpa.toFixed(2)
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#15803d]">
                        {row.pass_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#b91c1c]">
                        {row.fail_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">
                        {passRate(row)}
                      </td>
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
                Showing <strong>{from}</strong>–<strong>{to}</strong> of{" "}
                <strong>{total}</strong>{" "}
                {total === 1 ? "semester" : "semesters"}
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
                  <Button
                    variant="secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((c) => c - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage((c) => c + 1)}
                  >
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
