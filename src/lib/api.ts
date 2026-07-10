// Simple fetch-based API client with token interceptor and 401 handling.
// Base URL is configurable via VITE_API_BASE_URL (default: https://porto.apprentice.cyou/api).

export const API_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  "https://porto.apprentice.cyou/api";

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const USER_KEY = "user";

export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  get user(): any | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set(access: string, refresh: string, user: any) {
    window.localStorage.setItem(TOKEN_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Options = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export async function api<T = any>(path: string, opts: Options = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  const token = tokenStore.access;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  let data: any = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (res.status === 401) {
    tokenStore.clear();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Sesi berakhir, silakan login ulang.", data);
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Request gagal (${res.status})`;
    throw new ApiError(res.status, msg, data);
  }

  return data as T;
}
