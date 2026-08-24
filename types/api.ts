export type UserRole = "SUPER_ADMIN" | "ADMIN" | "STUDENT";

export type ApiEnvelope<T> = T & {
  success: boolean;
  message?: string;
};

export type AuthUser = {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
};

export type LoginResponse = ApiEnvelope<{
  token: string;
  user: AuthUser;
}>;

export type ApiErrorPayload = {
  success?: boolean;
  message?: string;
  recoveryAvailable?: boolean;
};
