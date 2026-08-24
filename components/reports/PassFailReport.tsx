"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/StateBlocks";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";

// ======================================================
// TYPES — only fields returned by GET /api/reports/pass-fail
// ======================================================

type PassFailData = {
  total_published_results: number;
  passed: number;
  failed: number;
  pass_percentage: number;
  fail_percentage: number;
};

type PassFailResponse = {
  success: boolean;
  data: PassFailData;
};

type FilterOption = { value: string; label: string };

// ATU maroon for pass, muted red for fail
const CHART_COLORS = {
  pass: "#800000",  // ATU maroon
  fail: "#b91c1c",  // red-700
};

function formatError(requestError: unknown): string {
  if (requestError instanceof ApiClientError) {
    return requestError.payload?.message ?? requestError.message;
  }
  return requestError instanceof Error ? requestError.message : "Something went wrong";
}

// ======================================================
// PASS / FAIL REPORT
// ======================================================

export function PassFailReport() {
  const user = useMemo(() => getStoredUser(), []);
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [data, setData] = useState<PassFailData | null>(null);
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
        // filter dropdowns render empty; the main section surfaces real errors
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [filterApis]);

  // =========================================
  // LOAD PASS / FAIL DATA
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

      const url = `/api/reports/pass-fail${params.size ? `?${params.toString()}` : ""}`;
      const response = await apiClient.get<PassFailResponse>(url);
      setData(response.data ?? null);
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

  // Pie chart data built from real API response only
  const pieData = data && data.total_published_results > 0
    ? [
        { name: "Passed", value: data.passed },
        { name: "Failed", value: data.failed },
      ]
    : [];

  if (!isManager) {
    return (
      <AppShell title="Pass / Fail Report" description="Published result pass and fail breakdown.">
        <EmptyState
          title="Manager access required"
          message="Only Super Admins and Admins can view this report."
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Pass / Fail Report" description="Published result pass and fail breakdown.">
      <div className="grid gap-6">
        {/* ============ TOOLBAR ============ */}
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
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

        {/* ============ MAIN CONTENT ============ */}
        {error ? (
          <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <ErrorState
              title="Failed to load pass/fail report"
              message={error}
              onRetry={() => void load()}
            />
          </section>
        ) : loading ? (
          <section className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-lg border border-[#E5E7EB] bg-gray-100"
              />
            ))}
          </section>
        ) : data === null || data.total_published_results === 0 ? (
          <section className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <EmptyState
              title="No published results found"
              message={
                hasFilters
                  ? "Try clearing the filters."
                  : "No published results exist yet."
              }
            />
          </section>
        ) : (
          <>
            {/* ============ SUMMARY CARDS ============ */}
            <section className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
              {[
                {
                  label: "Total Published",
                  value: data.total_published_results.toLocaleString(),
                  color: "#111827",
                },
                {
                  label: "Passed",
                  value: data.passed.toLocaleString(),
                  color: CHART_COLORS.pass,
                },
                {
                  label: "Failed",
                  value: data.failed.toLocaleString(),
                  color: CHART_COLORS.fail,
                },
                {
                  label: "Pass Rate",
                  value: `${data.pass_percentage}%`,
                  color: CHART_COLORS.pass,
                },
                {
                  label: "Fail Rate",
                  value: `${data.fail_percentage}%`,
                  color: CHART_COLORS.fail,
                },
              ].map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-bold text-[#6B7280]">{stat.label}</p>
                  <p
                    className="mt-2 text-2xl font-black"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                </article>
              ))}
            </section>

            {/* ============ CHART + TABLE ============ */}
            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              {/* PIE CHART */}
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <h2 className="text-base font-black text-[#111827]">Pass / Fail Distribution</h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Published results split by outcome
                </p>
                <div className="mt-6 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              entry.name === "Passed"
                                ? CHART_COLORS.pass
                                : CHART_COLORS.fail
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* TABLE */}
              <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                      <tr>
                        <th className="px-4 py-3 font-black">Outcome</th>
                        <th className="px-4 py-3 font-black">Count</th>
                        <th className="px-4 py-3 font-black">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-4 py-4">
                          <span
                            className="inline-block rounded-full px-3 py-0.5 text-xs font-black text-white"
                            style={{ backgroundColor: CHART_COLORS.pass }}
                          >
                            Passed
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">
                          {data.passed.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">
                          {data.pass_percentage}%
                        </td>
                      </tr>
                      <tr className="hover:bg-[#F9FAFB]">
                        <td className="px-4 py-4">
                          <span
                            className="inline-block rounded-full px-3 py-0.5 text-xs font-black text-white"
                            style={{ backgroundColor: CHART_COLORS.fail }}
                          >
                            Failed
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">
                          {data.failed.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">
                          {data.fail_percentage}%
                        </td>
                      </tr>
                      <tr className="bg-[#F9FAFB]">
                        <td className="px-4 py-4 font-black text-[#111827]">Total</td>
                        <td className="px-4 py-4 font-black text-[#111827]">
                          {data.total_published_results.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 font-black text-[#111827]">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
