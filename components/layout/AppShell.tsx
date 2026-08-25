"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Expand,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import { navGroups } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ToastProvider, useToast } from "@/components/ui/ToastProvider";
import { clearUser, fetchCurrentUser, getStoredUser } from "@/lib/auth-client";
import { apiClient } from "@/lib/api-client";
import type { AuthUser, UserRole, Notification } from "@/types/api";

type AppShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
};

function canSee(role: UserRole, roles?: UserRole[]) {
  return !roles || roles.includes(role);
}

function ShellContent({ children, title, description }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(["Main", "Academic Management", "Examination"]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setAuthChecked(true);
        return;
      }

      const remoteUser = await fetchCurrentUser();
      if (remoteUser) {
        setUser(remoteUser);
      } else {
        router.replace("/login");
        return;
      }
      setAuthChecked(true);
    }

    void checkSession();
  }, [router]);

  useEffect(() => {
    localStorage.setItem("atu_sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    let cancelled = false;
    setNotifyLoading(true);
    apiClient
      .get<{ success: boolean; count: number; notifications: Notification[] }>("/api/notifications")
      .then((data) => {
        if (!cancelled) {
          setNotifications(data.notifications ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotifications([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setNotifyLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const role = user?.role ?? "SUPER_ADMIN";
  const visibleGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({ ...group, items: group.items.filter((item) => canSee(role, item.roles)) }))
        .filter((group) => group.items.length > 0),
    [role],
  );
  const breadcrumb = pathname.split("/").filter(Boolean).map((part) => part.replaceAll("-", " "));

  if (!authChecked) {
    return null;
  }

  async function handleLogout() {
    await clearUser();
    showToast("You have been logged out.");
    router.push("/login");
  }

  const sidebar = (
    <aside
      className={`flex h-full flex-col bg-[#200911] text-white transition-all print:hidden ${collapsed ? "w-[5.5rem]" : "w-[18rem]"}`}
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white">
          <Image src="/images/atu-logo.jpg" alt="ABAARSO TECH UNIVERSITY logo" fill className="object-contain p-1" priority />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-black">ATU</p>
            <p className="truncate text-xs text-white/60">Examination System</p>
          </div>
        ) : null}
      </div>
      <div className="atu-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {visibleGroups.map((group) => {
          const isOpen = openGroups.includes(group.label);
          return (
            <div key={group.label} className="mb-3">
              {!collapsed ? (
                <button
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[0.68rem] font-black uppercase tracking-wide text-white/45 hover:text-white"
                  type="button"
                  onClick={() =>
                    setOpenGroups((current) =>
                      current.includes(group.label) ? current.filter((label) => label !== group.label) : [...current, group.label],
                    )
                  }
                >
                  {group.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? "" : "-rotate-90"}`} aria-hidden="true" />
                </button>
              ) : null}
              {(collapsed || isOpen) && (
                <div className="grid gap-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    const isLogout = item.href === "#logout";
                    return isLogout ? (
                      <button
                        key={item.label}
                        className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
                        type="button"
                        title={collapsed ? item.label : undefined}
                        onClick={() => setConfirmLogout(true)}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {!collapsed ? item.label : null}
                      </button>
                    ) : (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
                          active ? "bg-[#B03060] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                        title={collapsed ? item.label : undefined}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {!collapsed ? item.label : null}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        className="m-3 hidden items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 lg:flex"
        type="button"
        onClick={() => setCollapsed((value) => !value)}
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        {!collapsed ? "Collapse" : null}
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/40" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[18rem] max-w-[85vw]">
            {sidebar}
            <button className="absolute right-3 top-3 rounded-lg bg-white/10 p-2 text-white" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
      <div className={`transition-all print:lg:pl-0 ${collapsed ? "lg:pl-[5.5rem]" : "lg:pl-[18rem]"}`}>
        <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 backdrop-blur print:hidden">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
            <button className="rounded-lg border border-[#E5E7EB] p-2 lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="hidden text-xs font-semibold capitalize text-[#6B7280] sm:block">
                {breadcrumb.length ? `ATU / ${breadcrumb.join(" / ")}` : "ATU"}
              </div>
              <div className="relative mt-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] pl-9 pr-3 text-sm" placeholder="Search students, courses, transcripts" />
              </div>
            </div>
            <select className="hidden h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold md:block" aria-label="Academic year">
              <option>2026 Academic Year</option>
              <option>2025 Academic Year</option>
            </select>
            <select className="hidden h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm font-semibold md:block" aria-label="Semester">
              <option>Semester 1</option>
              <option>Semester 2</option>
            </select>
            <button className="rounded-lg border border-[#E5E7EB] p-2" aria-label="Help">
              <CircleHelp className="h-5 w-5" />
            </button>
            <button className="hidden rounded-lg border border-[#E5E7EB] p-2 sm:block" aria-label="Fullscreen" onClick={() => document.documentElement.requestFullscreen?.()}>
              <Expand className="h-5 w-5" />
            </button>
            <div className="relative">
              <button className="rounded-lg border border-[#E5E7EB] p-2" aria-label="Notifications" onClick={() => setNotifyOpen((value) => !value)}>
                <Bell className="h-5 w-5" />
              </button>
              {notifyOpen ? (
                <div className="absolute right-0 mt-2 w-80 rounded-lg border border-[#E5E7EB] bg-white p-0 shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
                    <p className="text-sm font-bold">Notifications</p>
                    <Link href="/notifications" className="text-xs font-semibold text-[#B03060] hover:underline" onClick={() => setNotifyOpen(false)}>
                      View all
                    </Link>
                  </div>
                  {notifyLoading ? (
                    <div className="p-4">
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="h-10 animate-pulse rounded bg-gray-100" />
                        ))}
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="p-4 text-sm text-[#6B7280]">No notifications yet.</p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.slice(0, 5).map((notification) => (
                        <Link
                          key={notification.notification_id}
                          href="/notifications"
                          className="block border-b border-[#E5E7EB] px-4 py-3 last:border-b-0 hover:bg-[#F9FAFB]"
                          onClick={() => setNotifyOpen(false)}
                        >
                          <p className="text-sm font-bold text-[#111827]">{notification.title}</p>
                          <p className="mt-0.5 truncate text-xs text-[#6B7280]">{notification.message}</p>
                          <p className="mt-1 text-[0.65rem] text-[#9CA3AF]">
                            {new Date(notification.created_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <div className="relative">
              <button className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white p-1.5" onClick={() => setProfileOpen((value) => !value)}>
                <span className="grid h-8 w-8 place-items-center rounded-md bg-[#F5DBE5] text-sm font-black text-[#701F3D]">
                  {(user?.username ?? "ATU").slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden text-left md:block">
                  <span className="block text-xs font-bold">{user?.username ?? "ATU User"}</span>
                  <span className="block text-[0.68rem] text-[#6B7280]">{user?.email ?? "admin@atu.edu"}</span>
                </span>
              </button>
              {profileOpen ? (
                <div className="absolute right-0 mt-2 w-72 rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-xl">
                  <div className="flex gap-3 border-b border-[#E5E7EB] pb-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white">
                      <Image src="/images/atu-logo.jpg" alt="ATU profile logo" fill className="object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{user?.username ?? "ATU User"}</p>
                      <p className="truncate text-xs text-[#6B7280]">{user?.email ?? "admin@atu.edu"}</p>
                      <div className="mt-1"><Badge tone="maroon">{role}</Badge></div>
                    </div>
                  </div>
                  <Link className="mt-2 block rounded-md px-2 py-2 text-sm font-semibold hover:bg-gray-50" href="/profile">Profile</Link>
                  <Link className="block rounded-md px-2 py-2 text-sm font-semibold hover:bg-gray-50" href="/settings">Settings</Link>
                  <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold text-[#DC2626] hover:bg-red-50" onClick={() => setConfirmLogout(true)}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#90274F]">ABAARSO TECH UNIVERSITY</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#111827] sm:text-3xl">{title}</h1>
              {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7280]">{description}</p> : null}
            </div>
            <Badge tone="maroon">{role}</Badge>
          </div>
          {children}
        </main>
      </div>
      {confirmLogout ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="logout-title">
            <h2 id="logout-title" className="text-lg font-black">Confirm logout</h2>
            <p className="mt-2 text-sm text-[#6B7280]">You will need to sign in again to access protected examination records.</p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmLogout(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <ToastProvider>
      <ShellContent {...props} />
    </ToastProvider>
  );
}

