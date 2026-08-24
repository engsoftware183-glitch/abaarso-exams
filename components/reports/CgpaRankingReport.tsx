"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/StateBlocks";
import { ExportButton, ExportFormat } from "@/components/ui/ExportButton";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";

const PAGE_SIZES = [10, 25, 50];

// ======================================================
// TYPES — only fields returned by GET /api/reports/cgpa-ranking
// ======================================================

type CgpaRankRow = {
  rank: number;
  student_id: number;
  roll_no: string;
  full_name: string;
  faculty_id: number;
  faculty_name: string;
  department_id: number;
  department_name: string;
  total_credit_hours: number;
  cgpa: number;
};

type CgpaRankingResponse = {
  success: boolean;
  data: CgpaRankRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

type FilterOption = { value: string; label: string };

function formatError(requestError: unknown): string {
  if (requestError instanceof ApiClientError) {
    return requestError.payload?.message ?? requestError.message;
  }
  return requestError instanceof Error ? requestError.message : "Something went wrong";
}

// Subtle academic rank indicators for top 3 — text only, no icons
// to keep the design professional and not gaming-style
function rankBadge(rank: number): { label: string; style: React.CSSProperties } | null {
  if (rank === 1) return { label: "1st", style: { backgroundColor: "#92400e", color: "#fff" } }; // dark amber (gold-ish)
  if (rank === 2) return { label: "2nd", style: { backgroundColor: "#475569", color: "#fff" } }; // slate (silver-ish)
  if (rank === 3) return { label: "3rd", style: { backgroundColor: "#7c3d12", color: "#fff" } }; // copper/bronze
  return null;
}

function cgpaColor(cgpa: number): string {
  if (cgpa >= 3.5) return "#15803d";
  if (cgpa >= 2.5) return "#b45309";
  if (cgpa === 0) return "#6B7280";
  return "#b91c1c";
}

// ======================================================
// CGPA RANKING REPORT
// ======================================================

export function CgpaRankingReport() {
  const user = useMemo(() => getStoredUser(), []);
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [rows, setRows] = useState<CgpaRankRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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
        const responses = await Promise.all(
          filterApis.map((f) => apiClient.get<Record<string, unknown>>(f.api))
        );
        if (cancelled) return;

        const map: Record<string, FilterOption[]> = {};
        filterApis.forEach((filter, index) => {
          const response = responses[index];
          const direct = response?.[filter.recordsKey];
          const list = Array.isArray(direct)
            ? direct
            : (Object.values(response ?? {}).find((v) => Array.isArray(v)) as
                | Record<string, unknown>[]
                | undefined) ?? [];
          map[filter.key] = list.map((row) => ({
            value: String(row[filter.valueKey]),
            label: String(row[filter.labelKey] ?? ""),
          }));
        });
        setOptions(map);
      } catch {
        // dropdowns render empty; the table surfaces real errors
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [filterApis]);

  // =========================================
  // FILTER / PAGINATION
  // =========================================

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const load = useCallback(async () => {
    if (!isManager) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const data = await apiClient.get<CgpaRankingResponse>(
        `/api/reports/cgpa-ranking?${params.toString()}`
      );
      setRows(data.data ?? []);
      setTotal(Number(data.pagination?.total) || 0);
      setTotalPages(Math.max(1, Number(data.pagination?.totalPages) || 1));
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading(false);
    }
  }, [isManager, page, limit, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  function clearFilters() {
    setFilters({});
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
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("format", format);

    const url = `/api/reports/cgpa-ranking/export?${params.toString()}`;
    window.open(url, "_blank");
  }

  if (!isManager) {
    return (
      <AppShell title="CGPA Ranking Report" description="Student CGPA ranking based on published results.">
        <EmptyState
          title="Manager access required"
          message="Only Super Admins and Admins can view this report."
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="CGPA Ranking Report" description="Student CGPA ranking based on published results.">
      <div className="grid gap-6">
        {/* ============ TOOLBAR ============ */}
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <ExportButton onExport={handleExport} />
            {filterApis.map((filter) => (
              <select
                key={filter.key}
                className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold"
                aria-label={`Filter by ${filter.labelKey}`}
                value={filters[filter.key] ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, [filter.key]: event.target.value }))
                }
              >
                <option value="">{filter.labelKey}: All</option>
                {(options[filter.key] ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}

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
            { label: "Total Students Ranked", value: total },
            { label: "Students on this page", value: rows.length },
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
                title="Failed to load CGPA ranking"
                message={error}
                onRetry={() => void load()}
              />
            </div>
          ) : loading ? (
            <div className="divide-y divide-[#E5E7EB]">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-4 py-4">
                  <div className="h-6 w-10 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No students ranked"
                message={
                  hasFilters
                    ? "Try clearing the filters."
                    : "No students with published results found."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-4 py-3 font-black">Rank</th>
                    <th className="px-4 py-3 font-black">Roll No</th>
                    <th className="px-4 py-3 font-black">Student Name</th>
                    <th className="px-4 py-3 font-black">Faculty</th>
                    <th className="px-4 py-3 font-black">Department</th>
                    <th className="px-4 py-3 font-black">Credit Hours</th>
                    <th className="px-4 py-3 font-black">CGPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {rows.map((row) => {
                    const badge = rankBadge(row.rank);
                    return (
                      <tr
                        key={row.student_id}
                        className={row.rank <= 3 ? "bg-[#FAFAF9] hover:bg-[#F5F5F4]" : "hover:bg-[#F9FAFB]"}
                      >
                        <td className="px-4 py-4">
                          {badge ? (
                            <span
                              className="inline-block rounded px-2 py-0.5 text-xs font-black tracking-wide"
                              style={badge.style}
                            >
                              {badge.label}
                            </span>
                          ) : (
                            <span className="font-semibold text-[#6B7280]">
                              {row.rank}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">
                          {row.roll_no}
                        </td>
                        <td className="px-4 py-4 font-bold text-[#111827]">
                          {row.full_name}
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">
                          {row.faculty_name}
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">
                          {row.department_name}
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">
                          {row.total_credit_hours}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className="font-black text-base"
                            style={{ color: cgpaColor(row.cgpa) }}
                          >
                            {row.cgpa > 0 ? row.cgpa.toFixed(2) : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
