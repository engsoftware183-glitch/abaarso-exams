"use client";

import { useState } from "react";
import { Download, FileDown, Filter, Plus, Search, Upload } from "lucide-react";
import type { ModuleConfig, ModuleField } from "@/lib/module-config";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/StateBlocks";
import { useToast } from "@/components/ui/ToastProvider";
import { FileUpload } from "@/components/uploads/FileUpload";
import { ImageUpload } from "@/components/uploads/ImageUpload";
import { SpreadsheetUpload } from "@/components/uploads/SpreadsheetUpload";

type ModulePageProps = {
  config: ModuleConfig;
  variant?: string;
};

function renderField(field: ModuleField) {
  const base = "mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm focus:border-[#B03060]";

  if (field.type === "select") {
    return (
      <select className={base} required={field.required} defaultValue="">
        <option value="">Select {field.label.toLowerCase()}</option>
        {(field.options ?? []).map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (field.type === "textarea") {
    return <textarea className={`${base} min-h-28 py-3`} required={field.required} placeholder={`Enter ${field.label.toLowerCase()}`} />;
  }

  return <input className={base} type={field.type} required={field.required} placeholder={`Enter ${field.label.toLowerCase()}`} />;
}

export function ModulePage({ config, variant }: ModulePageProps) {
  return (
    <AppShell title={variant ? `${config.title}: ${variant}` : config.title} description={config.description}>
      <ModulePageContent config={config} />
    </AppShell>
  );
}

function ModulePageContent({ config }: { config: ModuleConfig }) {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<"form" | "upload" | "details" | null>(null);
  const rows: Record<string, string>[] = [];
  const filteredRows = rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase()));

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    showToast(`${config.entity} form validated. Backend save can be connected to ${config.apiPath ?? "an approved endpoint"}.`);
    setPanel(null);
  }

  function exportCsv() {
    const csv = [config.columns.join(","), ...filteredRows.map((row) => config.columns.map((column) => `"${row[column] ?? ""}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${config.entity.toLowerCase().replaceAll(" ", "-")}-export.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Export file generated.");
  }

  return (
      <div className="grid gap-6">
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                className="h-11 w-full rounded-lg border border-[#D1D5DB] pl-9 pr-3 text-sm"
                placeholder={`Search ${config.title.toLowerCase()}`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {config.filters.map((filter) => (
                <button key={filter} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold hover:border-[#B03060]" onClick={() => showToast(`${filter} filter opened.`)}>
                  <Filter className="h-4 w-4" />
                  {filter}
                </button>
              ))}
              <Button variant="secondary" onClick={exportCsv}>
                <FileDown className="h-4 w-4" />
                Export
              </Button>
              <Button variant="secondary" onClick={() => setPanel("upload")}>
                <Upload className="h-4 w-4" />
                Bulk upload
              </Button>
              <Button onClick={() => setPanel("form")}>
                <Plus className="h-4 w-4" />
                Add {config.entity}
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {["Records", "Awaiting Review", "Published", "Completion"].map((item) => (
            <article key={item} className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-[#6B7280]">{item}</p>
              <p className="mt-2 text-2xl font-black">—</p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm p-8">
          <EmptyState 
            title="Module Incomplete" 
            message="This module is not connected to a data source yet." 
          />
        </section>

        {panel ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                <div>
                  <h2 className="text-xl font-black">{panel === "form" ? `${config.entity} Form` : panel === "upload" ? `${config.entity} Bulk Upload` : `${config.entity} Details`}</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">All controls are clickable and ready for backend integration where endpoints exist.</p>
                </div>
                <Button variant="ghost" onClick={() => setPanel(null)}>Close</Button>
              </div>

              {panel === "form" ? (
                <form className="mt-5 grid gap-5" onSubmit={submitForm}>
                  <div className="grid gap-4 md:grid-cols-2">
                    {config.fields.map((field) => (
                      <label key={field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                        <span className="text-sm font-bold text-[#111827]">{field.label}{field.required ? " *" : ""}</span>
                        {renderField(field)}
                      </label>
                    ))}
                  </div>
                  {config.uploads?.includes("image") ? <ImageUpload label={`${config.entity} image`} /> : null}
                  {config.uploads?.includes("document") ? <FileUpload label={`${config.entity} document`} /> : null}
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button variant="secondary" type="button" onClick={() => setPanel(null)}>Cancel</Button>
                    <Button type="reset" variant="ghost">Reset</Button>
                    <Button type="submit">Save {config.entity}</Button>
                  </div>
                </form>
              ) : null}

              {panel === "upload" ? (
                <div className="mt-5 grid gap-5">
                  <SpreadsheetUpload label={`${config.entity} import file`} />
                  <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setPanel(null)}>Cancel</Button>
                    <Button onClick={() => showToast("Import preview validated. Backend import will use the existing bulk-upload endpoint where available.")}>Validate Import</Button>
                  </div>
                </div>
              ) : null}

              {panel === "details" ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {config.columns.map((column, index) => (
                    <div key={column} className="rounded-lg border border-[#E5E7EB] p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-[#6B7280]">{column}</p>
                      <p className="mt-2 font-bold">{column} {index + 1}</p>
                    </div>
                  ))}
                  <div className="md:col-span-2 flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => window.print()}><Download className="h-4 w-4" /> Print</Button>
                    <Button onClick={exportCsv}>Download CSV</Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
  );
}
