export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  type: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  message: string;
  /** Token de réinitialisation (renvoyé en dev tant que l'envoi d'emails n'est pas implémenté). */
  resetToken: string | null;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "COLLABORATOR";
  bio: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
};