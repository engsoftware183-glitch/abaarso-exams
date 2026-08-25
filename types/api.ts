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
  user: AuthUser;
}>;

export type ApiErrorPayload = {
  success?: boolean;
  message?: string;
  recoveryAvailable?: boolean;
};

export type Notification = {
  notification_id: number;
  title: string;
  message: string;
  created_at: string;
};
