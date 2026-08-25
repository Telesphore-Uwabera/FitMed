import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored?: string | null): boolean {
  if (!plain || !stored) return false;
  if (!stored.includes(":")) return stored === plain;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(plain, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

const PASSWORD_HISTORY_LIMIT = 5;

export function isReusedPassword(plain: string, currentHash?: string | null, previousHashes: string[] = []) {
  if (verifyPassword(plain, currentHash)) return true;
  return previousHashes.some((hash) => verifyPassword(plain, hash));
}

export function nextPasswordHistory(currentHash?: string | null, previousHashes: string[] = []) {
  const next = [...previousHashes];
  if (currentHash) next.unshift(currentHash);
  return next.slice(0, PASSWORD_HISTORY_LIMIT);
}

export function generateTempPassword(): string {
  return `FitMed#${Math.floor(1000 + Math.random() * 9000)}`;
}
