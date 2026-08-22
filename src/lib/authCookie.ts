const COOKIE_NAME = "fitmed_auth";
const UI_COOKIE_NAME = "fitmed_ui";

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

export const AUTH_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  Vary: "Cookie",
} as const;

export type SessionRole = "admin" | "doctor" | "user";

export type SessionPayload = {
  email: string;
  role: SessionRole;
  name: string;
  exp: number;
};

function getSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.MONGODB_URI ||
    "fitmed-dev-session-secret"
  );
}

function bytesToB64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64ToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bytesToB64(new Uint8Array(signature));
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function sessionTtlMs(_role?: SessionRole) {
  return SESSION_TTL_MS;
}

function cookieBase() {
  return {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function authCookieOptions(maxAgeSeconds = SESSION_TTL_SECONDS) {
  return {
    ...cookieBase(),
    httpOnly: true,
    maxAge: maxAgeSeconds,
    expires: new Date(Date.now() + maxAgeSeconds * 1000),
  };
}

export function uiCookieOptions(maxAgeSeconds = SESSION_TTL_SECONDS) {
  return {
    ...cookieBase(),
    httpOnly: false,
    maxAge: maxAgeSeconds,
    expires: new Date(Date.now() + maxAgeSeconds * 1000),
  };
}

export function clearAuthCookieOptions() {
  return {
    ...cookieBase(),
    httpOnly: true,
    maxAge: 0,
    expires: new Date(0),
  };
}

export function clearUiCookieOptions() {
  return {
    ...cookieBase(),
    httpOnly: false,
    maxAge: 0,
    expires: new Date(0),
  };
}

export async function signSession(payload: Omit<SessionPayload, "exp">, ttlMs = SESSION_TTL_MS) {
  const body: SessionPayload = { ...payload, exp: Date.now() + ttlMs };
  const data = bytesToB64(new TextEncoder().encode(JSON.stringify(body)));
  const signature = await hmac(data);
  return `${data}.${signature}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = await hmac(data);
  if (!timingSafeEqual(expected, signature)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64ToBytes(data))) as SessionPayload;
    if (!payload.email || !payload.role || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

type CookieResponse = {
  cookies: {
    set: (name: string, value: string, options: ReturnType<typeof authCookieOptions> | ReturnType<typeof uiCookieOptions>) => void;
  };
  headers?: { set: (name: string, value: string) => void };
};

export function applyNoStoreHeaders(response: { headers: { set: (name: string, value: string) => void } }) {
  Object.entries(AUTH_NO_STORE_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export function clearAuthCookies(response: CookieResponse) {
  response.cookies.set(COOKIE_NAME, "", clearAuthCookieOptions());
  response.cookies.set(UI_COOKIE_NAME, "", clearUiCookieOptions());
  return response;
}

export async function attachAuthCookie(
  response: CookieResponse,
  payload: Omit<SessionPayload, "exp">
) {
  const token = await signSession(payload, SESSION_TTL_MS);
  response.cookies.set(COOKIE_NAME, token, authCookieOptions(SESSION_TTL_SECONDS));
  response.cookies.set(UI_COOKIE_NAME, payload.role, uiCookieOptions(SESSION_TTL_SECONDS));
  if (response.headers) applyNoStoreHeaders(response as { headers: { set: (name: string, value: string) => void } });
  return response;
}

export { COOKIE_NAME, UI_COOKIE_NAME };
