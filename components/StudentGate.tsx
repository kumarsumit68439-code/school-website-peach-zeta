"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const STUDENT_KEY = "schoolStudentMe";

const PUBLIC = [
  "/student-login",
  "/login",
  "/api-docs",
  "/api-keys",
];

export default function StudentGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // API routes not handled here (server)
    if (pathname?.startsWith("/api")) {
      setOk(true);
      setChecking(false);
      return;
    }
    const isPublic = PUBLIC.some(
      (p) => pathname === p || pathname?.startsWith(p + "/")
    );
    // Staff login & teacher area allowed without student session
    if (isPublic || pathname?.startsWith("/teacher") || pathname?.startsWith("/login")) {
      setOk(true);
      setChecking(false);
      return;
    }

    try {
      const raw = localStorage.getItem(STUDENT_KEY);
      const me = raw ? JSON.parse(raw) : null;
      if (me?.email) {
        setOk(true);
      } else {
        setOk(false);
        router.replace("/student-login?next=" + encodeURIComponent(pathname || "/"));
      }
    } catch {
      setOk(false);
      router.replace("/student-login");
    }
    setChecking(false);
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 text-slate-500 text-sm">
        Loading…
      </div>
    );
  }
  if (!ok) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 text-slate-500 text-sm">
        Redirecting to Student Login…
      </div>
    );
  }
  return <>{children}</>;
}

export function getStudentMe() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(STUDENT_KEY) || "null");
  } catch {
    return null;
  }
}

export function setStudentMe(user: { id: string; name: string; email: string; role?: string }) {
  localStorage.setItem(STUDENT_KEY, JSON.stringify(user));
}

export function clearStudentMe() {
  localStorage.removeItem(STUDENT_KEY);
}
