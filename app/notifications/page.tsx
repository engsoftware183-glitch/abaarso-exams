"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/StateBlocks";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";
import type { Notification } from "@/types/api";

// ======================================================
// TYPES
// ======================================================

type NotificationsResponse = {
  success: boolean;
  count: number;
  notifications: Notification[];
};

// ======================================================
// NOTIFICATIONS PAGE
// ======================================================

export default function NotificationsPage() {
  const user = useMemo(() => getStoredUser(), []);
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiClient.get<NotificationsResponse>("/api/notifications");
      setNotifications(data.notifications ?? []);
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.payload?.message ?? requestError.message : requestError instanceof Error ? requestError.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!createTitle.trim() || !createMessage.trim()) return;

    setCreating(true);
    try {
      await apiClient.post("/api/notifications", {
        title: createTitle.trim(),
        message: createMessage.trim(),
      });
      setCreateTitle("");
      setCreateMessage("");
      setShowCreate(false);
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.payload?.message ?? requestError.message : requestError instanceof Error ? requestError.message : "Failed to create notification");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;

    setDeletingId(id);
    try {
      await apiClient.delete(`/api/notifications/${id}`);
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.payload?.message ?? requestError.message : requestError instanceof Error ? requestError.message : "Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <AppShell title="Notifications" description="System notifications and announcements.">
      <div className="grid gap-6">
        {/* ============ TOOLBAR ============ */}
        {isManager && (
          <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
            {!showCreate ? (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" />
                New Notification
              </Button>
            ) : (
              <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-[1fr_2fr_auto]">
                <input
                  className="h-10 rounded-lg border border-[#D1D5DB] px-3 text-sm"
                  placeholder="Title"
                  value={createTitle}
                  onChange={(event) => setCreateTitle(event.target.value)}
                  required
                />
                <input
                  className="h-10 rounded-lg border border-[#D1D5DB] px-3 text-sm"
                  placeholder="Message"
                  value={createMessage}
                  onChange={(event) => setCreateMessage(event.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setCreateTitle(""); setCreateMessage(""); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* ============ NOTIFICATIONS LIST ============ */}
        <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
          {error ? (
            <div className="p-4">
              <ErrorState title="Failed to load notifications" message={error} onRetry={() => void load()} />
            </div>
          ) : loading ? (
            <div className="divide-y divide-[#E5E7EB]">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-start gap-4 px-4 py-4">
                  <div className="mt-1 h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
                    <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-100" />
                    <div className="mt-1 h-3 w-24 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No notifications"
                message="There are no system notifications at this time."
              />
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {notifications.map((notification) => (
                <div key={notification.notification_id} className="flex items-start gap-4 px-4 py-4 hover:bg-[#F9FAFB]">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5DBE5]">
                    <Bell className="h-5 w-5 text-[#90274F]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#111827]">{notification.title}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">{notification.message}</p>
                    <p className="mt-2 text-xs text-[#9CA3AF]">{formatDate(notification.created_at)}</p>
                  </div>
                  {isManager && (
                    <button
                      type="button"
                      className="shrink-0 rounded-lg p-2 text-[#6B7280] hover:bg-red-50 hover:text-[#DC2626]"
                      onClick={() => handleDelete(notification.notification_id)}
                      disabled={deletingId === notification.notification_id}
                      aria-label="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
