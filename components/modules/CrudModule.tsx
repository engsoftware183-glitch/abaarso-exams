"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Eye,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExportButton, type ExportFormat } from "@/components/ui/ExportButton";
import { EmptyState, ErrorState } from "@/components/ui/StateBlocks";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";
import type {
  CrudConfig,
  CrudDetail,
  CrudField,
  CrudOption,
} from "@/lib/crud-config";

const PAGE_SIZES = [10, 25, 50];

// ======================================================
// HELPERS
// ======================================================

function resolvePath(row: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, row);
}

function formatDate(value: unknown): string {
  if (value == null) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function cellValue(row: Record<string, unknown>, detail: { key: string; type?: string }): unknown {
  if (detail.type === "count") return resolvePath(row, `_count.${detail.key}`);
  return resolvePath(row, detail.key);
}

function renderValue(row: Record<string, unknown>, detail: { key: string; type?: string }): ReactNode {
  const value = cellValue(row, detail);

  if (value == null || value === "") {
    return <span className="text-[#9CA3AF]">—</span>;
  }

  if (detail.type === "date") return formatDate(value);
  if (detail.type === "badge") return <Badge tone="maroon">{String(value)}</Badge>;
  return <span>{String(value)}</span>;
}

function formatError(requestError: unknown): string {
  if (requestError instanceof ApiClientError) {
    return requestError.payload?.message ?? requestError.message;
  }
  return requestError instanceof Error ? requestError.message : "Something went wrong";
}

// ======================================================
// ZOD SCHEMA (built from the field config)
// ======================================================

function buildSchema(fields: CrudField[], mode: "create" | "edit") {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (field.store === false) continue;
    if (field.showOn && field.showOn !== mode) continue;

    const label = field.label;

    if (field.type === "email") {
      shape[field.name] = field.required
        ? z.string().min(1, `${label} is required`).email("Enter a valid email address")
        : z.string().optional();
    } else if (field.type === "number") {
      shape[field.name] = field.required
        ? z
            .string()
            .min(1, `${label} is required`)
            .transform((value) => Number(value))
        : z.string().optional();
    } else if (field.type === "date") {
      shape[field.name] = field.required
        ? z.string().min(1, `${label} is required`)
        : z.string().optional();
    } else if (field.type === "password") {
      shape[field.name] = z.string().min(field.min ?? 6, `${label} must be at least ${field.min ?? 6} characters`);
    } else if (field.type === "select" && field.optionsApi) {
      shape[field.name] = field.required
        ? z
            .string()
            .min(1, `${label} is required`)
            .transform((value) => Number(value))
        : z.string().optional();
    } else {
      shape[field.name] = field.required
        ? z.string().min(1, `${label} is required`)
        : z.string().optional();
    }
  }

  return z.object(shape);
}

/** Empty optional strings are sent as null so nullable DB columns stay clean. */
function normalizeValues(values: Record<string, unknown>, fields: CrudField[], mode: "create" | "edit") {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.store === false) continue;
    if (field.showOn && field.showOn !== mode) continue;

    let value = values[field.name];
    if (field.type === "date" && typeof value === "string" && value.trim() !== "") {
      value = new Date(value).toISOString();
    } else if (typeof value === "string" && value.trim() === "" && !field.required) {
      value = null;
    }
    payload[field.name] = value;
  }

  return payload;
}

// ======================================================
// FORM DIALOG (mounted per mode so the zod schema matches)
// ======================================================

function CrudFormDialog({
  config,
  editing,
  options,
  onClose,
  onSaved,
}: {
  config: CrudConfig;
  editing: Record<string, unknown> | null;
  options: Record<string, unknown[]>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const mode: "create" | "edit" = editing ? "edit" : "create";
  const schema = useMemo(() => buildSchema(config.fields, mode), [config, mode]);
  const form = useForm<Record<string, unknown>>({ resolver: zodResolver(schema) });
  const [submitting, setSubmitting] = useState(false);

  // fields that depend on each parent field (for dependent dropdowns)
  const dependents = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const field of config.fields) {
      for (const dep of field.dependsOn ?? []) {
        (map[dep.field] ??= []).push(field.name);
      }
    }
    return map;
  }, [config]);

  // build defaults (edit prefills real values)
  const defaults = useMemo(() => {
    const values: Record<string, unknown> = {};
    for (const field of config.fields) {
      if (field.store === false) continue;
      if (field.showOn && field.showOn !== mode) continue;
      const current = editing?.[field.name];
      values[field.name] =
        current == null
          ? ""
          : field.type === "date" && typeof current === "string"
            ? current.slice(0, 10)
            : String(current);
    }
    return values;
  }, [config, editing, mode]);

  useEffect(() => {
    form.reset(defaults);
  }, [form, defaults]);

  function fieldOptions(field: CrudField): CrudOption[] {
    if (field.options) return field.options;

    const all = (options[field.optionsApi ?? ""] ?? []) as Record<string, unknown>[];
    let list = all;

    if (field.dependsOn) {
      const watched = form.watch();
      for (const dep of field.dependsOn) {
        const parent = watched[dep.field];
        if (parent != null && parent !== "") {
          list = list.filter((option) => String(option[dep.optionKey]) === String(parent));
        }
      }
    }

    const valueKey = field.optionValue ?? field.name;
    const labelKey = field.optionLabel ?? "name";

    return list.map((option) => ({
      value: option[valueKey] as string | number,
      label: String(resolvePath(option, labelKey) ?? option[valueKey] ?? ""),
    }));
  }

  function handleParentChange(field: CrudField, value: string) {
    form.setValue(field.name, value, { shouldDirty: true });
    // reset dependent selects when the parent changes
    for (const dependent of dependents[field.name] ?? []) {
      form.setValue(dependent, "", { shouldDirty: true });
    }
  }

  async function onSubmit(values: Record<string, unknown>) {
    setSubmitting(true);
    try {
      const payload = normalizeValues(values, config.fields, mode);

      if (editing) {
        await apiClient.put(`${config.apiPath}/${editing[config.idKey]}`, payload);
        toast.success(`${config.entity} updated successfully`);
      } else {
        await apiClient.post(config.apiPath, payload);
        toast.success(`${config.entity} created successfully`);
      }

      onSaved();
    } catch (requestError) {
      toast.error(formatError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  const watched = form.watch();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="crud-form-title">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4">
          <div>
            <h2 id="crud-form-title" className="text-lg font-black">
              {mode === "create" ? `Add ${config.entity}` : `Edit ${config.entity}`}
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">{config.description}</p>
          </div>
          <button className="rounded-lg border border-[#E5E7EB] p-2 hover:border-[#B03060]" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="px-5 py-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {editing ? (() => {
            // Create-only fields (showOn: "create") are not editable on
            // update - surface their current values as read-only context
            // so the edit form never feels like it lost data.
            const locked = config.fields.filter(
              (field) => field.store !== false && field.showOn === "create" && editing[field.name] != null
            );

            if (locked.length === 0) return null;

            return (
              <div className="mb-4 grid gap-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4 sm:grid-cols-2">
                {locked.map((field) => {
                  const current = editing[field.name];
                  let display = String(current);

                  if (field.type === "password") {
                    display = "••••••••";
                  } else if (field.type === "date" && typeof current === "string") {
                    display = formatDate(current);
                  } else if (field.type === "select") {
                    const match = fieldOptions(field).find(
                      (option) => String(option.value) === String(current)
                    );
                    if (match) display = match.label;
                  }

                  return (
                    <div key={field.name}>
                      <p className="text-xs font-black uppercase tracking-wide text-[#6B7280]">{field.label}</p>
                      <p className="mt-1 text-sm font-semibold text-[#111827]">{display}</p>
                    </div>
                  );
                })}
              </div>
            );
          })() : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {config.fields.map((field) => {
              if (field.store === false) return null;
              if (field.showOn && field.showOn !== mode) return null;

              const error = form.formState.errors[field.name]?.message as string | undefined;
              const parentMissing = field.dependsOn?.some((dep) => !watched[dep.field]);
              const parentLabel = config.fields.find((f) => f.name === field.dependsOn?.[0]?.field)?.label;

              const baseClass =
                "mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#111827] focus:border-[#B03060] disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]";
              const borderClass = error ? "border-red-400" : "border-[#D1D5DB]";

              return (
                <label key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <span className="text-sm font-bold text-[#111827]">
                    {field.label}
                    {field.required ? <span className="text-[#DC2626]"> *</span> : null}
                  </span>

                  {field.type === "select" ? (
                    <select
                      className={`${baseClass} ${borderClass}`}
                      value={String(watched[field.name] ?? "")}
                      disabled={parentMissing}
                      onChange={(event) => handleParentChange(field, event.target.value)}
                    >
                      <option value="">
                        {parentMissing
                          ? `Select ${parentLabel ?? "a parent"} first`
                          : field.optionsApi && (options[field.optionsApi] ?? []).length === 0
                            ? "Loading options…"
                            : `Select ${field.label.toLowerCase()}`}
                      </option>
                      {fieldOptions(field).map((option) => (
                        <option key={String(option.value)} value={String(option.value)}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      className={`${baseClass} ${borderClass} min-h-24`}
                      placeholder={field.placeholder}
                      {...form.register(field.name)}
                    />
                  ) : (
                    <input
                      className={`${baseClass} ${borderClass}`}
                      type={field.type}
                      placeholder={field.placeholder}
                      {...form.register(field.name)}
                    />
                  )}

                  {error ? <span className="mt-1 block text-xs font-semibold text-[#DC2626]">{error}</span> : null}
                </label>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : mode === "create" ? (
                `Add ${config.entity}`
              ) : (
                `Save Changes`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ======================================================
// CRUD MODULE
// ======================================================

export function CrudModule({ config }: { config: CrudConfig }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [options, setOptions] = useState<Record<string, unknown[]>>({});

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [viewRow, setViewRow] = useState<Record<string, unknown> | null>(null);
  const [deleteRow, setDeleteRow] = useState<Record<string, unknown> | null>(null);
  const [deleting, setDeleting] = useState(false);

  const user = useMemo(() => getStoredUser(), []);
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  // all relationship option APIs referenced by filters and form fields
  const optionApis = useMemo(() => {
    const set = new Set<string>();
    config.filters?.forEach((filter) => filter.optionsApi && set.add(filter.optionsApi));
    config.fields.forEach((field) => field.optionsApi && set.add(field.optionsApi));
    return [...set];
  }, [config]);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const responses = await Promise.all(optionApis.map((api) => apiClient.get<Record<string, unknown>>(api)));
        if (cancelled) return;

        const map: Record<string, unknown[]> = {};
        optionApis.forEach((api, index) => {
          const response = responses[index];
          const key = api.split("/").filter(Boolean).pop() ?? "";
          const direct = response?.[key];
          if (Array.isArray(direct)) {
            map[api] = direct;
          } else {
            const list = Object.values(response ?? {}).find((value) => Array.isArray(value));
            map[api] = Array.isArray(list) ? list : [];
          }
        });
        setOptions(map);
      } catch {
        // dropdowns render empty; the list itself surfaces real errors
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [optionApis]);

  // debounce text search
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // any new search/filter resets to page 1
  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      config.filters?.forEach((filter) => {
        const value = filters[filter.name];
        if (value) params.set(filter.name, value);
      });

      const data = await apiClient.get<Record<string, unknown>>(`${config.apiPath}/pagination?${params.toString()}`);
      setRows((data[config.recordsKey] as Record<string, unknown>[]) ?? []);
      setTotal(Number(data.total) || 0);
      setTotalPages(Math.max(1, Number(data.totalPages) || 1));
    } catch (requestError) {
      setError(formatError(requestError));
    } finally {
      setLoading(false);
    }
  }, [config, page, limit, search, filters]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function handleSaved() {
    closeForm();
    setReloadKey((key) => key + 1);
  }

  async function confirmDelete() {
    if (!deleteRow) return;

    setDeleting(true);
    try {
      await apiClient.delete(`${config.apiPath}/${deleteRow[config.idKey]}`);
      toast.success(`${config.entity} deleted successfully`);
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

  function clearFilters() {
    setFilters({});
    setSearchInput("");
    setSearch("");
  }

  // ============================================================
  // EXPORT HANDLER
  // ============================================================
  //
  // Builds the same query params the pagination endpoint uses so
  // the export always reflects the active search/filter state.
  // The token is read from localStorage (same mechanism as
  // apiClient.get) so the server-side export route can authorize
  // the request.

  async function handleExport(format: ExportFormat) {
    if (!config.exportPath) return;

    const params = new URLSearchParams({ format });
    if (search) params.set("search", search);
    config.filters?.forEach((filter) => {
      const value = filters[filter.name];
      if (value) params.set(filter.name, value);
    });

    const token =
      typeof window !== "undefined" ? localStorage.getItem("atu_token") : null;

    const response = await fetch(
      `${config.exportPath}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      const payload = await response
        .json()
        .catch(() => ({ message: "Export failed" })) as { message?: string };
      throw new Error(payload?.message ?? `Export failed (${response.status})`);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition") ?? "";
    const nameMatch = contentDisposition.match(/filename="([^"]+)"/);
    const filename =
      nameMatch?.[1] ??
      `${config.entityPlural.toLowerCase()}-export.${format}`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    toast.success(`${config.entityPlural} exported successfully`);
  }

  const hasFilters = Object.values(filters).some(Boolean);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const stats = [
    { label: `Total ${config.entityPlural}`, value: total },
    { label: "Records on this page", value: rows.length },
    { label: "Page", value: `${page} / ${totalPages}` },
  ];

  return (
    <AppShell title={config.title} description={config.description}>
      <div className="grid gap-6">
        {/* ============ TOOLBAR ============ */}
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                className="h-11 w-full rounded-lg border border-[#D1D5DB] pl-9 pr-3 text-sm"
                placeholder={config.searchPlaceholder}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {config.filters?.map((filter) => (
                <select
                  key={filter.name}
                  className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold"
                  aria-label={`Filter by ${filter.label}`}
                  value={filters[filter.name] ?? ""}
                  onChange={(event) => setFilters((current) => ({ ...current, [filter.name]: event.target.value }))}
                >
                  <option value="">{filter.label}: All</option>
                  {filter.options
                    ? filter.options.map((option) => (
                        <option key={String(option.value)} value={String(option.value)}>
                          {option.label}
                        </option>
                      ))
                    : (options[filter.optionsApi ?? ""] ?? []).map((option) => {
                        const row = option as Record<string, unknown>;
                        const valueKey = filter.optionValue ?? "";
                        const labelKey = filter.optionLabel ?? "name";
                        return (
                          <option key={String(row[valueKey])} value={String(row[valueKey])}>
                            {String(resolvePath(row, labelKey) ?? "")}
                          </option>
                        );
                      })}
                </select>
              ))}

              {hasFilters ? (
                <Button variant="ghost" onClick={clearFilters}>
                  <Filter className="h-4 w-4" />
                  Clear filters
                </Button>
              ) : null}

              {isManager && config.exportPath ? (
                <ExportButton
                  onExport={async (format) => {
                    try {
                      await handleExport(format);
                    } catch (exportError) {
                      toast.error(
                        exportError instanceof Error
                          ? exportError.message
                          : "Export failed"
                      );
                    }
                  }}
                />
              ) : null}

              {isManager ? (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Add {config.entity}
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        {/* ============ STATS (real data only) ============ */}
        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
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
              <ErrorState title="Failed to load data" message={error} onRetry={() => void load()} />
            </div>
          ) : loading ? (
            <div className="divide-y divide-[#E5E7EB]">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-4 py-4">
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                  <div className="h-8 w-24 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={`No ${config.entityPlural.toLowerCase()} found`}
                message={hasFilters || search ? "Try adjusting your search or filters." : `No ${config.entityPlural.toLowerCase()} have been added yet.`}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#F9FAFB] text-xs uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-4 py-3 font-black">#</th>
                    {config.columns.map((column) => (
                      <th key={column.key} className="px-4 py-3 font-black">
                        {column.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {rows.map((row, index) => (
                    <tr key={String(row[config.idKey])} className="hover:bg-[#F9FAFB]">
                      <td className="px-4 py-4 font-semibold text-[#6B7280]">{(page - 1) * limit + index + 1}</td>
                      {config.columns.map((column) => (
                        <td key={column.key} className="px-4 py-4 font-semibold text-[#111827]">
                          {renderValue(row, column)}
                        </td>
                      ))}
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-lg border border-[#E5E7EB] p-2 hover:border-[#B03060]"
                            aria-label="View details"
                            onClick={() => setViewRow(row)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isManager ? (
                            <>
                              <button
                                className="rounded-lg border border-[#E5E7EB] p-2 hover:border-[#B03060]"
                                aria-label="Edit"
                                onClick={() => openEdit(row)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                className="rounded-lg border border-red-100 p-2 text-[#DC2626] hover:bg-red-50"
                                aria-label="Delete"
                                onClick={() => setDeleteRow(row)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : null}
                        </div>
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
                {total === 1 ? "record" : "records"}
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

      {/* ============ VIEW DIALOG ============ */}
      {viewRow ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="crud-view-title">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4">
              <div>
                <h2 id="crud-view-title" className="text-lg font-black">
                  {config.entity} Details
                </h2>
                <p className="mt-1 text-sm text-[#6B7280]">Record #{String(viewRow[config.idKey])}</p>
              </div>
              <button className="rounded-lg border border-[#E5E7EB] p-2 hover:border-[#B03060]" aria-label="Close" onClick={() => setViewRow(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              {config.details.map((detail: CrudDetail) => (
                <div key={detail.key} className="rounded-lg border border-[#E5E7EB] p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[#6B7280]">{detail.label}</p>
                  <div className="mt-2 font-bold text-[#111827]">{renderValue(viewRow, detail)}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-[#E5E7EB] px-5 py-4">
              <Button variant="secondary" onClick={() => setViewRow(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ============ DELETE CONFIRM ============ */}
      {deleteRow ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="crud-delete-title">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 id="crud-delete-title" className="text-lg font-black">
              Delete {config.entity}
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Are you sure you want to delete{" "}
              <strong>{String(resolvePath(deleteRow, config.columns[0]?.key ?? config.idKey) ?? deleteRow[config.idKey])}</strong>?
              This action cannot be undone. If other records reference it, the deletion will be blocked.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" disabled={deleting} onClick={() => setDeleteRow(null)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={deleting} onClick={() => void confirmDelete()}>
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ============ FORM DIALOG ============ */}
      {formOpen ? (
        <CrudFormDialog
          key={editing ? `edit-${String(editing[config.idKey])}` : "create"}
          config={config}
          editing={editing}
          options={options}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      ) : null}
    </AppShell>
  );
}
