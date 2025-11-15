// frontend/src/auth.ts

import type { LoginResponse } from "./types";

const TOKEN_KEY = "session_token";
const USERNAME_KEY = "session_username";

export interface SessionData {
  token: string;
  username: string;
}

export function saveSession(login: LoginResponse) {
  localStorage.setItem(TOKEN_KEY, login.access_token);
  localStorage.setItem(USERNAME_KEY, login.username);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("session-changed"));
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("session-changed"));
  }
}

export function getSession(): SessionData | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

 
  const username = localStorage.getItem(USERNAME_KEY) || "";

  if (!username) return null;

  return {
    token,
    username,
  };
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
