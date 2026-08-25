"use client";

import { apiClient } from "@/lib/api-client";
import type { AuthUser } from "@/types/api";

const USER_KEY = "atu_user";

export function saveUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}

export async function login(email: string, password: string) {
  const response = await apiClient.post<{ success: boolean; user: AuthUser }>("/api/auth/login", { email, password });
  saveUser(response.user);
  return response;
}

export async function logout() {
  try {
    await apiClient.post("/api/auth/logout");
  } catch {
    // ignore logout errors
  }

  clearUser();
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiClient.get<{ success: boolean; user: AuthUser }>("/api/auth/me");
    saveUser(response.user);
    return response.user;
  } catch {
    clearUser();
    return null;
  }
}
