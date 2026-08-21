import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface FitMedSession {
  role: "admin" | "doctor" | "user";
  name: string;
  email: string;
  expiresAt: number;
}

export function useSession(requiredRole?: FitMedSession["role"]) {
  const router = useRouter();
  const [session, setSession] = useState<FitMedSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        const data = await res.json().catch(() => ({ success: false }));

        if (cancelled) return;

        if (res.status === 403) {
          localStorage.removeItem("fitmed_session");
          router.replace("/signin?pending=1");
          return;
        }

        if (!res.ok || !data.success || !data.user) {
          localStorage.removeItem("fitmed_session");
          router.replace("/signin");
          return;
        }

        if (requiredRole && data.user.role !== requiredRole) {
          router.replace("/signin?unauthorized=1");
          return;
        }

        const ttlMs = data.user.role === "user" ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const nextSession: FitMedSession = {
          role: data.user.role,
          name: data.user.name,
          email: data.user.email,
          expiresAt: Date.now() + ttlMs,
        };
        localStorage.setItem("fitmed_session", JSON.stringify(nextSession));
        setSession(nextSession);
        setLoading(false);
      } catch {
        if (cancelled) return;
        localStorage.removeItem("fitmed_session");
        router.replace("/signin");
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [router, requiredRole]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Cookie clearing is best-effort; local session is always removed.
    }
    localStorage.removeItem("fitmed_session");
    router.push("/signin");
  };

  return { session, loading, logout };
}
