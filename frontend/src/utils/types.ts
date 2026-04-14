export type UserRole = "ADMIN" | "LOCAL" | "USER";

export interface User {
  id: number;
  username: string;
  role: UserRole;
}