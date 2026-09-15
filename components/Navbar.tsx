"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { clearStudentMe, getStudentMe } from "@/components/StudentGate";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/admission", label: "Admission" },
  { href: "/notice", label: "Notices" },
  { href: "/attendance", label: "Attendance" },
  { href: "/festivals", label: "Festivals" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/location", label: "Location" },
  { href: "/gallery", label: "Gallery" },
  { href: "/result", label: "Results" },
  { href: "/messages", label: "Messages" },
  { href: "/browser", label: "Browser" },
  { href: "/browserbase", label: "Browserbase" },
  { href: "/api-keys", label: "API Keys" },
  { href: "/api-client", label: "API Client" },
  { href: "/api-docs", label: "API Docs" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [student, setStudent] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    setStudent(getStudentMe());
  }, [pathname]);

  const studentLogout = () => {
    clearStudentMe();
    setStudent(null);
    window.location.href = "/student-login";
  };

  return (
    <header className="sticky top-0 z-50 bg-navy-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="text-2xl">🏫</span>
            <div className="leading-tight">
              <div className="font-bold text-sm sm:text-base">MGGEMS</div>
              <div className="text-[10px] text-navy-200 hidden sm:block">Lalchandpura, Jaipur</div>
            </div>
          </Link>
          <nav className="hidden xl:flex items-center gap-0.5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2 py-1.5 rounded-md text-xs font-medium transition ${
                  pathname === l.href || pathname.startsWith(l.href + "/")
                    ? "bg-white/20"
                    : "hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden xl:flex items-center gap-2">
            {student?.name && (
              <span className="text-[11px] text-navy-100 max-w-[100px] truncate" title={student.email}>
                🎓 {student.name}
              </span>
            )}
            {student && (
              <button onClick={studentLogout} className="text-[11px] bg-white/10 px-2 py-1 rounded">
                Student Logout
              </button>
            )}
            {session ? (
              <>
                <Link href="/teacher/dashboard" className="text-sm font-medium hover:underline">
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md"
                >
                  Staff Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-saffron-500 hover:bg-saffron-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                Staff Login
              </Link>
            )}
          </div>
          <button className="xl:hidden p-2 text-xl" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? "✕" : "☰"}
          </button>
        </div>
        {open && (
          <div className="xl:hidden pb-4 border-t border-white/10 pt-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm ${
                  pathname === l.href || pathname.startsWith(l.href + "/")
                    ? "bg-white/20"
                    : "hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            ))}
            {student && (
              <button
                onClick={() => {
                  setOpen(false);
                  studentLogout();
                }}
                className="block w-full text-left px-3 py-2 text-sm text-amber-200"
              >
                Student Logout ({student.name})
              </button>
            )}
            {session ? (
              <>
                <Link
                  href="/teacher/dashboard"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm hover:bg-white/10"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-red-300"
                >
                  Staff Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block mx-3 mt-2 text-center bg-saffron-500 text-white font-semibold py-2 rounded-lg"
              >
                Staff Login
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
