"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/admission", label: "Admission" },
  { href: "/notice", label: "Notices" },
  { href: "/attendance", label: "Attendance" },
  { href: "/gallery", label: "Gallery" },
  { href: "/result", label: "Results" },
  { href: "/messages", label: "Messages" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

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
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition ${
                  pathname === l.href || pathname.startsWith(l.href + "/")
                    ? "bg-white/20"
                    : "hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            {session ? (
              <>
                <Link href="/teacher/dashboard" className="text-sm font-medium hover:underline">
                  Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-8 h-8 rounded-full border-2 border-white/30"
                    />
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md"
                  >
                    Logout
                  </button>
                </div>
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
          <button
            className="lg:hidden p-2 text-xl"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
        {open && (
          <div className="lg:hidden pb-4 border-t border-white/10 pt-3 space-y-1">
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
                  Logout
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
