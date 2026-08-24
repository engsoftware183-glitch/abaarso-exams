"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonLoader } from "@/components/ui/StateBlocks";
import { apiClient } from "@/lib/api-client";

type Result = {
  result_id: number;
  total_marks: number;
  grade: string | null;
  gpa: number;
  remarks: string | null;
  status: string;
  student: { full_name: string; roll_no: string };
  course: { course_name: string; course_code: string; credit_hours: number };
  semester: { semester_id: number; semester_name: string };
};

export default function StudentResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string>("");

  async function loadResults() {
    setLoading(true);
    setError("");

    try {
      // Backend enforces PUBLISHED-only results for students at the database
      // query level. No client-supplied status parameter is needed or trusted.
      const response = await apiClient.get<{ success: boolean; count: number; results: Result[] }>("/api/results");
      setResults(response.results ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load results.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadResults();
  }, []);

  const semesters = useMemo(() => {
    const map = new Map<number, string>();
    results.forEach((r) => map.set(r.semester.semester_id, r.semester.semester_name));
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!semesterFilter) return results;
    return results.filter((r) => String(r.semester.semester_id) === semesterFilter);
  }, [results, semesterFilter]);

  return (
    <AppShell title="My Results" description="Published examination results">
      <div className="grid gap-6">
        {error ? (
          <ErrorState title="Unable to load results" message={error} onRetry={loadResults} />
        ) : null}

        {loading ? (
          <SkeletonLoader rows={5} />
        ) : filteredResults.length ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-[#111827]">Semester:</label>
                <select
                  className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold"
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                >
                  <option value="">All Semesters</option>
                  {semesters.map(([id, name]) => (
                    <option key={id} value={String(id)}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="secondary" onClick={loadResults} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                    <tr>
                      <th className="px-4 py-3 font-black">Course</th>
                      <th className="px-4 py-3 font-black">Semester</th>
                      <th className="px-4 py-3 font-black text-right">Total</th>
                      <th className="px-4 py-3 font-black text-center">Grade</th>
                      <th className="px-4 py-3 font-black text-right">GPA</th>
                      <th className="px-4 py-3 font-black text-right">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredResults.map((result) => (
                      <tr key={result.result_id} className="hover:bg-[#F9FAFB]">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-[#111827]">{result.course.course_name}</p>
                          <p className="text-xs text-[#6B7280]">{result.course.course_code}</p>
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">{result.semester.semester_name}</td>
                        <td className="px-4 py-4 text-right font-semibold text-[#111827]">{result.total_marks}</td>
                        <td className="px-4 py-4 text-center">
                          <Badge tone="maroon">{result.grade ?? "—"}</Badge>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-[#111827]">{Number(result.gpa).toFixed(2)}</td>
                        <td className="px-4 py-4 text-right font-semibold text-[#111827]">{result.remarks ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <EmptyState title="No published results" message="Published results will appear here once available." />
        )}
      </div>
    </AppShell>
  );
}
