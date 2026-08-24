"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/StateBlocks";
import { ExportButton, ExportFormat } from "@/components/ui/ExportButton";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";

// ======================================================
// TYPES — only fields returned by GET /api/reports/grade-distribution
// ======================================================

type GradeRow = {
  grade: string;
  count: number;
  percentage: number;
};

type GradeDistributionResponse = {
  success: boolean;
  data: GradeRow[];
  total: number;
};

type FilterOption = { value: string; label: string };

// ATU maroon palette — one shade per bar, cycling if more grades than shades
const BAR_COLORS = [
  "#800000", // ATU maroon
  "#B03060",
  "#D05382",
  "#701F3D",
  "#90274F",
  "#C04070",
  "#501030",
  "#B45309",
];

function formatError(requestError: unknown): string {
  if (requestError instanceof ApiClientError) {
    return requestError.payload?.message ?? requestError.message;
  }
  return requestError instanceof Error ? requestError.message : "Something went wrong";
}

// ======================================================
// GRADE DISTRIBUTION REPORT
// ======================================================

export function GradeDistributionReport() {
  const user = useMemo(() => getStoredUser(), []);
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [rows, setRows] = useState<GradeRow[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState<Record<string, string>>({});
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
        // filter dropdowns render empty; the table surfaces real errors
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [filterApis]);

  // =========================================
  // LOAD GRADE DISTRIBUTION
  // =========================================

  const load = useCallback(async () => {
    if (!isManager) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const url = `/api/reports/grade-distribution${params.size ? `?${params.toString()}` : ""}`;
      const data = await apiClient.get<GradeDistributionResponse>(url);
      setRows(data.data ?? []);
      setGrandTotal(Number(data.total) || 0);
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading(false);
    }
  }, [isManager, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  function clearFilters() {
    setFilters({});
  }

  const hasFilters = Object.values(filters).some(Boolean);

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

    const url = `/api/reports/grade-distribution/export?${params.toString()}`;
    window.open(url, "_blank");
  }

  if (!isManager) {
    return (
      <AppShell
        title="Grade Distribution Report"
        description="Grade breakdown across all published results."
      >
        <EmptyState
          title="Manager access required"
          message="Only Super Admins and Admins can view this report."
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Grade Distribution Report"
      description="Grade breakdown across all published results."
    >
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

        {/* ============ SUMMARY STAT ============ */}
        {!loading && !error && grandTotal > 0 ? (
          <section className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-[#6B7280]">Total Graded Results</p>
              <p className="mt-2 text-2xl font-black">{grandTotal.toLocaleString()}</p>
            </article>
            <article className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-[#6B7280]">Distinct Grades</p>
              <p className="mt-2 text-2xl font-black">{rows.length}</p>
            </article>
          </section>
        ) : null}

        {/* ============ CHART + TABLE ============ */}
        {error ? (
          <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <ErrorState
              title="Failed to load grade distribution"
              message={error}
              onRetry={() => void load()}
            />
          </section>
        ) : loading ? (
          <section className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="mb-6 h-72 animate-pulse rounded-lg bg-gray-100" />
            <div className="divide-y divide-[#E5E7EB]">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 py-3">
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </section>
        ) : rows.length === 0 ? (
          <section className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <EmptyState
              title="No grade data found"
              message={
                hasFilters
                  ? "Try clearing the filters."
                  : "No published results with grades exist yet."
              }
            />
          </section>
        ) : (
          <>
            {/* CHART */}
            <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-[#111827]">Grade Distribution Chart</h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Published results grouped by grade — counts on Y-axis
              </p>
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="grade" tick={{ fontSize: 13, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {rows.map((row, index) => (
                        <Cell
                          key={row.grade}
                          fill={BAR_COLORS[index % BAR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* TABLE */}
            <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-left text-sm">
                  <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                    <tr>
                      <th className="px-4 py-3 font-black">#</th>
                      <th className="px-4 py-3 font-black">Grade</th>
                      <th className="px-4 py-3 font-black">Count</th>
                      <th className="px-4 py-3 font-black">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {rows.map((row, index) => (
                      <tr key={row.grade} className="hover:bg-[#F9FAFB]">
                        <td className="px-4 py-4 font-semibold text-[#6B7280]">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className="inline-block min-w-[2.5rem] rounded-full px-3 py-0.5 text-center text-xs font-black text-white"
                            style={{
                              backgroundColor:
                                BAR_COLORS[index % BAR_COLORS.length],
                            }}
                          >
                            {row.grade}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">
                          {row.count.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">
                          {row.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
