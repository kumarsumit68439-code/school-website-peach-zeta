"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { setStudentMe, getStudentMe } from "@/components/StudentGate";
import { supabase } from "@/lib/supabase";

function StudentLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { data: session, status } = useSession();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const me = getStudentMe();
    if (me?.email) router.replace(next);
  }, [next, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;
    const already = getStudentMe();
    if (already?.email) {
      router.replace(next);
      return;
    }

    const em = session.user.email.toLowerCase();
    const nm = session.user.name || em.split("@")[0];
    const user = {
      id: "g_" + em.replace(/[^a-z0-9]/gi, "_"),
      name: nm,
      email: em,
      role: "Student",
    };

    try {
      const list = JSON.parse(localStorage.getItem("schoolChatUsers") || "[]");
      if (!list.find((u: { email: string }) => u.email?.toLowerCase() === em)) {
        list.push(user);
        localStorage.setItem("schoolChatUsers", JSON.stringify(list));
      }
    } catch {
      /* */
    }

    setStudentMe(user);
    localStorage.setItem("schoolChatMe", JSON.stringify(user));

    void (async () => {
      try {
        await supabase.from("chat_users").upsert({
          id: user.id,
          name: user.name,
          email: user.email,
          role: "Student",
          password: null,
        });
      } catch {
        /* ignore */
      }
    })();

    router.replace(next);
  }, [session, status, next, router]);

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const em = email.trim().toLowerCase();
    const nm = name.trim();
    if (!em || !nm) {
      setError("Name aur Gmail zaroori hain");
      return;
    }
    const user = {
      id: "st_" + Date.now(),
      name: nm,
      email: em,
      role: "Student",
      password: password || undefined,
    };
    const list = JSON.parse(localStorage.getItem("schoolChatUsers") || "[]");
    if (list.find((u: { email: string }) => u.email?.toLowerCase() === em)) {
      setError("Account pehle se hai — Login karo");
      setMode("login");
      return;
    }
    list.push(user);
    localStorage.setItem("schoolChatUsers", JSON.stringify(list));
    try {
      await supabase.from("chat_users").upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        role: "Student",
        password: password || null,
      });
    } catch {
      /* ok local */
    }
    setStudentMe(user);
    localStorage.setItem("schoolChatMe", JSON.stringify(user));
    router.replace(next);
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const em = email.trim().toLowerCase();
    const list = JSON.parse(localStorage.getItem("schoolChatUsers") || "[]");
    let user = list.find((u: { email: string }) => u.email?.toLowerCase() === em);

    if (!user) {
      try {
        const { data } = await supabase.from("chat_users").select("*").eq("email", em).maybeSingle();
        if (data) {
          user = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role || "Student",
            password: data.password,
          };
        }
      } catch {
        /* */
      }
    }

    if (!user) {
      setError("Account nahi mila — pehle Sign Up");
      setMode("signup");
      return;
    }
    if (user.password && password && user.password !== password) {
      setError("Galat password");
      return;
    }
    setStudentMe({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "Student",
    });
    localStorage.setItem("schoolChatMe", JSON.stringify(user));
    router.replace(next);
  };

  const googleLogin = () => {
    const callbackUrl = "/student-login?next=" + encodeURIComponent(next);
    signIn("google", { callbackUrl });
  };

  return (
    <div className="card shadow-lg">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🎓</div>
        <h1 className="text-xl font-bold text-navy-900">Student Login</h1>
        <p className="text-sm text-slate-500 mt-1">
          Website dekhne se pehle student account se login karo
        </p>
      </div>

      <button
        type="button"
        onClick={googleLogin}
        className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-lg py-3 px-4 text-sm font-medium hover:bg-slate-50 transition shadow-sm mb-4"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-slate-400">OR email / password</span>
        </div>
      </div>

      <div className="flex rounded-lg overflow-hidden border border-slate-200 mb-5">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 py-2.5 text-sm font-semibold ${
            mode === "login" ? "bg-navy-800 text-white" : "bg-white text-slate-600"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 py-2.5 text-sm font-semibold ${
            mode === "signup" ? "bg-navy-800 text-white" : "bg-white text-slate-600"
          }`}
        >
          Sign Up
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      {mode === "signup" ? (
        <form onSubmit={signup} className="space-y-3">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Gmail *</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Password (optional)</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full py-3">
            Create Student Account
          </button>
        </form>
      ) : (
        <form onSubmit={login} className="space-y-3">
          <div>
            <label className="label">Gmail *</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full py-3">
            Student Login
          </button>
        </form>
      )}

      <div className="mt-6 pt-4 border-t text-center text-sm text-slate-500">
        Staff / Teacher / Principal?{" "}
        <Link href="/login" className="text-navy-700 font-semibold underline">
          Staff Login
        </Link>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Suspense fallback={<div className="text-center text-slate-500">Loading…</div>}>
        <StudentLoginForm />
      </Suspense>
    </div>
  );
}
