"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonLoader } from "@/components/ui/StateBlocks";
import { apiClient } from "@/lib/api-client";

type ActivityLog = {
  activity_id: number;
  action: string;
  description: string;
  created_at: string;
};

type ActivityLogsResponse = {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  activityLogs: ActivityLog[];
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search.trim()) params.set("search", search.trim());

      const data = await apiClient.get<ActivityLogsResponse>(`/api/activity-logs?${params.toString()}`);
      setLogs(data.activityLogs);
      setTotalPages(data.totalPages);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load audit logs.");
      setLogs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <AppShell title="Audit Logs" description="Review important system activity, record changes, and access events.">
      <div className="grid gap-6">
        {error ? (
          <ErrorState title="Unable to load audit logs" message={error} onRetry={loadLogs} />
        ) : null}

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 text-sm focus:border-[#B03060]"
              placeholder="Search by action or description..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button variant="secondary" onClick={loadLogs} disabled={loading}>
            Refresh
          </Button>
        </section>

        {loading ? (
          <SkeletonLoader rows={8} />
        ) : logs.length === 0 ? (
          <EmptyState title="No audit logs" message="Activity records will appear here as administrative actions are performed." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB]">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#6B7280]">ID</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#6B7280]">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#6B7280]">Description</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[#6B7280]">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {logs.map((log) => (
                    <tr key={log.activity_id} className="hover:bg-[#F9FAFB]">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-[#6B7280]">#{log.activity_id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-[#111827]">
                        <span className="inline-flex rounded-md bg-[#F5DBE5] px-2 py-1 text-xs font-black text-[#701F3D]">{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#374151]">{log.description}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-[#6B7280]">{formatDate(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-[#E5E7EB] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#6B7280]">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, logs.length > 0 ? (page - 1) * limit + logs.length : 0)} of{" "}
                  {logs.length > 0 ? (page - 1) * limit + logs.length : 0} (total from API)
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  {pageNumbers.map((pageNum, index) =>
                    pageNum === "..." ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-sm text-[#6B7280]">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    ),
                  )}
                  <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
