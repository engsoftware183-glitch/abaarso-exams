"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Search, ShieldCheck, Trash2, UserSearch, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/StateBlocks";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";

const PAGE_SIZES = [10, 25, 50];

type AdminUser = {
  user_id: number;
  username: string;
  email: string;
  role: string;
  created_at?: string;
  updated_at?: string;
};

type AdminRow = {
  admin_id: number;
  user_id: number;
  user: AdminUser;
  created_at: string;
  updated_at: string;
};

type EligibleUser = {
  user_id: number;
  username: string;
  email: string;
  role: string;
};

function formatError(requestError: unknown): string {
  if (requestError instanceof ApiClientError) {
    return requestError.payload?.message ?? requestError.message;
  }
  return requestError instanceof Error ? requestError.message : "Something went wrong";
}

function formatDate(value: unknown): string {
  if (value == null) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function roleTone(role: string): "maroon" | "gray" {
  return role === "SUPER_ADMIN" ? "maroon" : "gray";
}

const createSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type CreateFormValues = z.infer<typeof createSchema>;

// ======================================================
// ADD ADMINISTRATOR DIALOG
// ======================================================

function AddAdministratorDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [submitting, setSubmitting] = useState(false);

  // ---- existing-user combobox state ----
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EligibleUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EligibleUser | null>(null);
  const [comboOpen, setComboOpen] = useState(false);

  // ---- new-account form ----
  const form = useForm<CreateFormValues>({ resolver: zodResolver(createSchema) });

  useEffect(() => {
    if (mode !== "existing" || selectedUser) return;

    let cancelled = false;
    setSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("search", query.trim());
        const data = await apiClient.get<{ users: EligibleUser[] }>(`/api/admins/eligible-users?${params.toString()}`);
        if (!cancelled) setResults(data.users ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, mode, selectedUser]);

  function pickUser(user: EligibleUser) {
    setSelectedUser(user);
    setQuery(`${user.username} · ${user.email}`);
    setComboOpen(false);
  }

  function clearSelectedUser() {
    setSelectedUser(null);
    setQuery("");
    setComboOpen(true);
  }

  async function submitExistingUser() {
    if (!selectedUser) {
      toast.error("Select an existing user to promote");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/api/admins", { user_id: selectedUser.user_id });
      toast.success("User promoted to administrator successfully");
      onSaved();
    } catch (requestError) {
      toast.error(formatError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNewAccount(values: CreateFormValues) {
    setSubmitting(true);
    try {
      await apiClient.post("/api/admins", values);
      toast.success("Administrator created successfully");
      onSaved();
    } catch (requestError) {
      toast.error(formatError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="add-admin-title">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4">
          <div>
            <h2 id="add-admin-title" className="text-lg font-black">
              Add Administrator
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">Promote an existing user or create a new administrator account.</p>
          </div>
          <button className="rounded-lg border border-[#E5E7EB] p-2 hover:border-[#B03060]" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#F9FAFB] p-1">
            <button
              type="button"
              className={`rounded-md py-2 text-sm font-bold transition ${
                mode === "existing" ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280]"
              }`}
              onClick={() => setMode("existing")}
            >
              Select existing user
            </button>
            <button
              type="button"
              className={`rounded-md py-2 text-sm font-bold transition ${
                mode === "new" ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280]"
              }`}
              onClick={() => setMode("new")}
            >
              Create new account
            </button>
          </div>
        </div>

        {mode === "existing" ? (
          <div className="px-5 py-5">
            <label className="relative block">
              <span className="text-sm font-bold text-[#111827]">Existing user</span>
              <div className="relative mt-1.5">
                <UserSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  className="h-11 w-full rounded-lg border border-[#D1D5DB] pl-9 pr-9 text-sm focus:border-[#B03060]"
                  placeholder="Search by username or email…"
                  value={query}
                  onFocus={() => setComboOpen(true)}
                  onChange={(event) => {
                    setSelectedUser(null);
                    setQuery(event.target.value);
                    setComboOpen(true);
                  }}
                />
                {selectedUser ? (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#DC2626]"
                    aria-label="Clear selected user"
                    onClick={clearSelectedUser}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {comboOpen && !selectedUser ? (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-lg">
                  {searching ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-[#6B7280]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching…
                    </div>
                  ) : results.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[#6B7280]">
                      No eligible users found{query.trim() ? " for this search" : ""}.
                    </div>
                  ) : (
                    <ul className="max-h-56 overflow-y-auto">
                      {results.map((candidate) => (
                        <li key={candidate.user_id}>
                          <button
                            type="button"
                            className="flex w-full flex-col items-start px-4 py-2.5 text-left text-sm hover:bg-[#F9FAFB]"
                            onClick={() => pickUser(candidate)}
                          >
                            <span className="font-bold text-[#111827]">{candidate.username}</span>
                            <span className="text-xs text-[#6B7280]">
                              {candidate.email} · {candidate.role}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </label>
            <p className="mt-2 text-xs text-[#6B7280]">
              Only users who are not already administrators are shown. Selecting a user submits their account ID -
              no user information is typed manually.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="button" disabled={submitting || !selectedUser} onClick={() => void submitExistingUser()}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Promoting…
                  </>
                ) : (
                  "Promote to Administrator"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <form className="px-5 py-5" onSubmit={form.handleSubmit(submitNewAccount)} noValidate>
            <div className="grid gap-4">
              <label>
                <span className="text-sm font-bold text-[#111827]">
                  Username<span className="text-[#DC2626]"> *</span>
                </span>
                <input
                  className="mt-1.5 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm focus:border-[#B03060]"
                  placeholder="e.g. jsmith"
                  {...form.register("username")}
                />
                {form.formState.errors.username ? (
                  <span className="mt-1 block text-xs font-semibold text-[#DC2626]">{form.formState.errors.username.message}</span>
                ) : null}
              </label>
              <label>
                <span className="text-sm font-bold text-[#111827]">
                  Email<span className="text-[#DC2626]"> *</span>
                </span>
                <input
                  className="mt-1.5 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm focus:border-[#B03060]"
                  type="email"
                  placeholder="e.g. jsmith@abaarso.edu"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <span className="mt-1 block text-xs font-semibold text-[#DC2626]">{form.formState.errors.email.message}</span>
                ) : null}
              </label>
              <label>
                <span className="text-sm font-bold text-[#111827]">
                  Password<span className="text-[#DC2626]"> *</span>
                </span>
                <input
                  className="mt-1.5 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm focus:border-[#B03060]"
                  type="password"
                  placeholder="Minimum 6 characters"
                  {...form.register("password")}
                />
                {form.formState.errors.password ? (
                  <span className="mt-1 block text-xs font-semibold text-[#DC2626]">{form.formState.errors.password.message}</span>
                ) : null}
              </label>
            </div>

            <p className="mt-3 text-xs text-[#6B7280]">
              This creates a brand-new user account with the ADMIN role. Role is always assigned by the server and
              cannot be escalated to Super Admin from this form.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Administrator"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ======================================================
// ADMINISTRATORS MANAGER
// ======================================================

export function AdministratorsManager() {
  const user = useMemo(() => getStoredUser(), []);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [rows, setRows] = useState<AdminRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<AdminRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const load = useCallback(async () => {
    if (!isSuperAdmin) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);

      const data = await apiClient.get<{ admins: AdminRow[]; total: number; totalPages: number }>(
        `/api/admins/pagination?${params.toString()}`
      );
      setRows(data.admins ?? []);
      setTotal(Number(data.total) || 0);
      setTotalPages(Math.max(1, Number(data.totalPages) || 1));
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, page, limit, search]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  function handleSaved() {
    setAddOpen(false);
    setReloadKey((key) => key + 1);
  }

  async function confirmDelete() {
    if (!deleteRow) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/api/admins/${deleteRow.admin_id}`);
      toast.success("Administrator removed successfully");
      setDeleteRow(null);

      if (rows.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        setReloadKey((key) => key + 1);
      }
    } catch (requestError) {
      toast.error(formatError(requestError));
    } finally {
      setDeleting(false);
    }
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (!isSuperAdmin) {
    return (
      <AppShell title="Administrators" description="Manage system administrators and role-based staff access.">
        <EmptyState
          title="Super Admin access required"
          message="Only Super Admins can view or manage administrator accounts."
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Administrators" description="Manage system administrators and role-based staff access.">
      <div className="grid gap-6">
        {/* ============ TOOLBAR ============ */}
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                className="h-11 w-full rounded-lg border border-[#D1D5DB] pl-9 pr-3 text-sm"
                placeholder="Search administrators by username or email…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Administrator
            </Button>
          </div>
        </section>

        {/* ============ STATS ============ */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Administrators", value: total },
            { label: "Records on this page", value: rows.length },
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
              <ErrorState title="Failed to load administrators" message={error} onRetry={() => void load()} />
            </div>
          ) : loading ? (
            <div className="divide-y divide-[#E5E7EB]">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-4 py-4">
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
                title="No administrators found"
                message={search ? "Try adjusting your search." : "No administrators have been added yet."}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-4 py-3 font-black">#</th>
                    <th className="px-4 py-3 font-black">Username</th>
                    <th className="px-4 py-3 font-black">Email</th>
                    <th className="px-4 py-3 font-black">Role</th>
                    <th className="px-4 py-3 font-black">Created</th>
                    <th className="px-4 py-3 text-right font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {rows.map((row, index) => {
                    const isSelf = row.user.user_id === user?.user_id;
                    return (
                      <tr key={row.admin_id} className="hover:bg-[#F9FAFB]">
                        <td className="px-4 py-4 font-semibold text-[#6B7280]">{(page - 1) * limit + index + 1}</td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">
                          <span className="inline-flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-[#B03060]" />
                            {row.user.username}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">{row.user.email}</td>
                        <td className="px-4 py-4">
                          <Badge tone={roleTone(row.user.role)}>{row.user.role}</Badge>
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#111827]">{formatDate(row.created_at)}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              className="rounded-lg border border-red-100 p-2 text-[#DC2626] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Remove administrator"
                              title={isSelf ? "You cannot remove your own administrator account" : "Remove administrator"}
                              disabled={isSelf}
                              onClick={() => setDeleteRow(row)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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
                Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong>{" "}
                {total === 1 ? "administrator" : "administrators"}
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

      {/* ============ ADD DIALOG ============ */}
      {addOpen ? <AddAdministratorDialog onClose={() => setAddOpen(false)} onSaved={handleSaved} /> : null}

      {/* ============ DELETE CONFIRM ============ */}
      {deleteRow ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-admin-title">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 id="delete-admin-title" className="text-lg font-black">
              Remove Administrator
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Are you sure you want to remove <strong>{deleteRow.user.username}</strong> ({deleteRow.user.email}) as
              an administrator? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" disabled={deleting} onClick={() => setDeleteRow(null)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={deleting} onClick={() => void confirmDelete()}>
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Removing…
                  </>
                ) : (
                  "Remove"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
