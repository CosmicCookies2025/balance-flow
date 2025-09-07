import { apiRequest } from "./queryClient";

export interface AuthStatus {
  authenticated: boolean;
}

export const authService = {
  async login(password: string): Promise<void> {
    await apiRequest("POST", "/api/auth/login", { password });
  },

  async logout(): Promise<void> {
    await apiRequest("POST", "/api/auth/logout");
  },

  async getStatus(): Promise<AuthStatus> {
    const response = await apiRequest("GET", "/api/auth/status");
    return response.json();
  }
};
