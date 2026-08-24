"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Send, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/StateBlocks";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";

type ResultRow = {
  result_id: number;
  total_marks: number;
  grade: string | null;
  gpa: number;
  status: "DRAFT" | "PUBLISHED";
  student: { full_name: string; roll_no: string };
  course: { course_name: string; course_code: string };
  semester: { semester_name: string };
};

type StatusFilter = "ALL" | "DRAFT" | "PUBLISHED";

const PAGE_SIZE = 10;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
];

function statusTone(status: ResultRow["status"]) {
  return status === "PUBLISHED" ? "green" : "amber";
}

function formatError(requestError: unknown): string {
  if (requestError instanceof ApiClientError) {
    return requestError.payload?.message ?? requestError.message;
  }
  return requestError instanceof Error ? requestError.message : "Something went wrong";
}

export function PublishResults() {
  const user = useMemo(() => getStoredUser(), []);
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [rows, setRows] = useState<ResultRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<StatusFilter>("DRAFT");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (filter !== "ALL") params.set("status", filter);

      const data = await apiClient.get<{
        results: ResultRow[];
        total?: number;
        totalRecords?: number;
        totalPages?: number;
      }>(`/api/results/pagination?${params.toString()}`);

      setRows(data.results ?? []);
      setTotal(Number(data.total ?? data.totalRecords ?? 0));
      setTotalPages(Math.max(1, Number(data.totalPages ?? 1)));
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  function switchFilter(next: StatusFilter) {
    setFilter(next);
    setPage(1);
  }

  async function updateStatus(row: ResultRow, next: "DRAFT" | "PUBLISHED") {
    setPendingId(row.result_id);

    try {
      await apiClient.put(`/api/results/${row.result_id}`, { status: next });
      toast.success(next === "PUBLISHED" ? "Result published successfully" : "Result reverted to draft");

      if (rows.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        void load();
      }
    } catch (requestError) {
      toast.error(formatError(requestError));
    } finally {
      setPendingId(null);
    }
  }

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <AppShell
      title="Publish Results"
      description="Review computed results, publish them to students, or revert published results to draft."
    >
      <div className="grid gap-6">
        {error ? (
          <ErrorState title="Unable to load results" message={error} onRetry={() => void load()} />
        ) : null}

        <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => switchFilter(option.value)}
                  className={`inline-flex h-10 items-center rounded-lg border px-4 text-sm font-semibold transition ${
                    filter === option.value
                      ? "border-[#B03060] bg-[#F5DBE5] text-[#701F3D]"
                      : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#B03060]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#6B7280]">
                {total} {total === 1 ? "result" : "results"}
              </span>
              <Button variant="secondary" onClick={() => void load()} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
          {loading ? (
            <div className="divide-y divide-[#E5E7EB]">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-4 py-4">
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-8 w-28 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={filter === "DRAFT" ? "No draft results" : "No results found"}
                message={
                  filter === "DRAFT"
                    ? "Generate results first — published results will move out of this view."
                    : "Try a different status filter."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-4 py-3 font-black">Student</th>
                    <th className="px-4 py-3 font-black">Course</th>
                    <th className="px-4 py-3 font-black">Semester</th>
                    <th className="px-4 py-3 font-black">Total</th>
                    <th className="px-4 py-3 font-black">Grade</th>
                    <th className="px-4 py-3 font-black">GPA</th>
                    <th className="px-4 py-3 font-black">Status</th>
                    <th className="px-4 py-3 text-right font-black">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {rows.map((row) => (
                    <tr key={row.result_id} className="hover:bg-[#F9FAFB]">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#111827]">{row.student.full_name}</p>
                        <p className="text-xs text-[#6B7280]">{row.student.roll_no}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#111827]">{row.course.course_name}</p>
                        <p className="text-xs text-[#6B7280]">{row.course.course_code}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">{row.semester.semester_name}</td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">{row.total_marks}</td>
                      <td className="px-4 py-4">
                        <Badge tone="maroon">{row.grade ?? "—"}</Badge>
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#111827]">{Number(row.gpa).toFixed(2)}</td>
                      <td className="px-4 py-4">
                        <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          {isManager ? (
                            row.status === "DRAFT" ? (
                              <Button
                                onClick={() => void updateStatus(row, "PUBLISHED")}
                                disabled={pendingId !== null}
                              >
                                {pendingId === row.result_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                                Publish
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                onClick={() => void updateStatus(row, "DRAFT")}
                                disabled={pendingId !== null}
                              >
                                {pendingId === row.result_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Undo2 className="h-4 w-4" />
                                )}
                                Unpublish
                              </Button>
                            )
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && rows.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-[#E5E7EB] px-4 py-3 text-sm text-[#6B7280] sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong>{" "}
                {total === 1 ? "result" : "results"}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
