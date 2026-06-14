const BASE = "http://localhost:4000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") ?? sessionStorage.getItem("token") ?? null;
}

export function getCurrentUserId(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id ?? payload.sub ?? null;
  } catch {
    return null;
  }
}

export function getCurrentUser(): { id: string; username: string; email: string } | null {
  if (typeof window === "undefined") return null;
  const token = getToken();
  if (!token) return null;

  // id and email are always in the JWT payload — decode them directly
  let jwtId = "";
  let jwtEmail = "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    jwtId    = payload.id ?? payload.sub ?? "";
    jwtEmail = payload.email ?? "";
  } catch { /* invalid token */ }

  if (!jwtId) return null;

  // username is only saved to storage after the updated login flow
  const store    = localStorage.getItem("token") ? localStorage : sessionStorage;
  const username = store.getItem("username") ?? "";
  const email    = store.getItem("email") || jwtEmail;
  const id       = store.getItem("userId") || jwtId;

  return { id, username, email };
}

function getStore(): Storage | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") ? localStorage : sessionStorage.getItem("token") ? sessionStorage : null;
}

export function saveProfileImages(avatarUrl: string, bannerUrl: string) {
  const store = getStore();
  if (!store) return;
  if (avatarUrl) store.setItem("avatarUrl", avatarUrl);
  if (bannerUrl) store.setItem("bannerUrl", bannerUrl);
}

export function getProfileImages(): { avatarUrl: string; bannerUrl: string } {
  if (typeof window === "undefined") return { avatarUrl: "", bannerUrl: "" };
  const store = getStore();
  return {
    avatarUrl: store?.getItem("avatarUrl") ?? "",
    bannerUrl: store?.getItem("bannerUrl") ?? "",
  };
}

function buildHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...buildHeaders(), ...(init.headers as Record<string, string> ?? {}) },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? "Request failed");
  return json as T;
}
