import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface FitMedSession {
  role: "admin" | "doctor" | "user";
  name: string;
  email: string;
  expiresAt: number;
}

/**
 * Reads the fitmed_session from localStorage, validates expiry,
 * and redirects to /signin if the session is missing or expired.
 *
 * Expiry rules (set at login):
 *  - Admin  → 1 day
 *  - Doctor → 1 day
 *  - Applicant → 30 days
 */
export function useSession(requiredRole?: FitMedSession["role"]) {
  const router = useRouter();
  const [session, setSession] = useState<FitMedSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("fitmed_session");
    if (!raw) {
      router.replace("/signin");
      return;
    }

    let parsed: FitMedSession;
    try {
      parsed = JSON.parse(raw) as FitMedSession;
    } catch {
      localStorage.removeItem("fitmed_session");
      router.replace("/signin");
      return;
    }

    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem("fitmed_session");
      router.replace("/signin?expired=1");
      return;
    }

    if (requiredRole && parsed.role !== requiredRole) {
      router.replace("/signin?unauthorized=1");
      return;
    }

    setSession(parsed);
    setLoading(false);
  }, [router, requiredRole]);

  const logout = () => {
    localStorage.removeItem("fitmed_session");
    router.push("/signin");
  };

  return { session, loading, logout };
}
