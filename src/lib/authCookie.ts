const COOKIE_NAME = "fitmed_auth";

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

export function sessionTtlMs(role: SessionRole) {
  return role === "user" ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
}

export async function signSession(payload: Omit<SessionPayload, "exp">, ttlMs = sessionTtlMs(payload.role)) {
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

export function authCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function clearAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export async function attachAuthCookie(
  response: { cookies: { set: (name: string, value: string, options: ReturnType<typeof authCookieOptions>) => void } },
  payload: Omit<SessionPayload, "exp">
) {
  const ttlMs = sessionTtlMs(payload.role);
  const token = await signSession(payload, ttlMs);
  response.cookies.set(COOKIE_NAME, token, authCookieOptions(Math.floor(ttlMs / 1000)));
  return response;
}

export { COOKIE_NAME };
