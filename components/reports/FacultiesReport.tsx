"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/StateBlocks";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";

const PAGE_SIZES = [10, 25, 50];

// ======================================================
// TYPES — only fields returned by GET /api/reports/faculties
// ======================================================

type FacultyReportRow = {
  faculty_id: number;
  faculty_name: string;
  student_count: number;
  course_count: number;
  published_result_count: number;
  average_gpa: number;
  pass_count: number;
  fail_count: number;
};

type FacultiesReportResponse = {
  success: boolean;
  data: FacultyReportRow[];
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
  if (gpa >= 3.0) return "#15803d";  // green-700
  if (gpa >= 2.0) return "#b45309";  // amber-700
  if (gpa === 0) return "#6B7280";   // gray
  return "#b91c1c";                   // red-700
}

// Pass rate is safely derived: pass_count / (pass_count + fail_count)
function passRate(row: FacultyReportRow): string {
  const total = row.pass_count + row.fail_count;
  if (total === 0) return "—";
  return `${Math.round((row.pass_count / total) * 100)}%`;
}

// ======================================================
// FACULTIES REPORT
// ======================================================

export function FacultiesReport() {
  const user = useMemo(() => getStoredUser(), []);
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [rows, setRows] = useState<FacultyReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [facultyFilter, setFacultyFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [facultyOptions, setFacultyOptions] = useState<FilterOption[]>([]);

  // =========================================
  // DB-BACKED FILTER OPTIONS — faculties list
  // =========================================

  useEffect(() => {
    let cancelled = false;

    async function loadFaculties() {
      try {
        const response = await apiClient.get<Record<string, unknown>>("/api/faculties");
        if (cancelled) return;

        const direct = response?.["faculties"];
        const list = Array.isArray(direct)
          ? direct
          : (Object.values(response ?? {}).find((v) => Array.isArray(v)) as Record<string, unknown>[] | undefined) ?? [];

        setFacultyOptions(
          list.map((row) => ({
            value: String(row["faculty_id"]),
            label: String(row["faculty_name"] ?? ""),
          }))
        );
      } catch {
        // dropdown renders empty; the table surfaces real errors
      }
    }

    void loadFaculties();
    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================
  // FILTER / PAGINATION
  // =========================================

  useEffect(() => {
    setPage(1);
  }, [facultyFilter]);

  const load = useCallback(async () => {
    if (!isManager) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (facultyFilter) params.set("faculty_id", facultyFilter);

      const data = await apiClient.get<FacultiesReportResponse>(`/api/reports/faculties?${params.toString()}`);
      setRows(data.data ?? []);
      setTotal(Number(data.pagination?.total) || 0);
      setTotalPages(Math.max(1, Number(data.pagination?.totalPages) || 1));
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading(false);
    }
  }, [isManager, page, limit, facultyFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function clearFilters() {
    setFacultyFilter("");
  }

  const hasFilters = Boolean(facultyFilter);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (!isManager) {
    return (
      <AppShell title="Faculty Report" description="Faculty-level performance metrics.">
        <EmptyState title="Manager access required" message="Only Super Admins and Admins can view this report." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Faculty Report" description="Faculty-level performance metrics.">
      <div className="grid gap-6">
        {/* ============ TOOLBAR ============ */}
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
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

            {hasFilters ? (
              <Button variant="ghost" onClick={clearFilters}>
                Clear filter
              </Button>
            ) : null}
          </div>
        </section>

        {/* ============ STATS ============ */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Faculties", value: total },
            { label: "Faculties on this page", value: rows.length },
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
              <ErrorState
                title="Failed to load the faculty report"
                message={error}
                onRetry={() => void load()}
              />
            </div>
          ) : loading ? (
            <div className="divide-y divide-[#E5E7EB]">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-4 py-4">
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
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
                title="No faculties found"
                message={hasFilters ? "Try clearing the filter." : "No faculty records have been added yet."}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-4 py-3 font-black">#</th>
                    <th className="px-4 py-3 font-black">Faculty Name</th>
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
                    <tr key={row.faculty_id} className="hover:bg-[#F9FAFB]">
                      <td className="px-4 py-4 font-semibold text-[#6B7280]">
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className="px-4 py-4 font-bold text-[#800000]">
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
                          {row.published_result_count > 0 ? row.average_gpa.toFixed(2) : "—"}
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
                Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong>{" "}
                {total === 1 ? "faculty" : "faculties"}
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
                  <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((c) => c - 1)}>
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
