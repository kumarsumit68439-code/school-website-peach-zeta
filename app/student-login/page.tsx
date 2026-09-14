"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { setStudentMe, getStudentMe } from "@/components/StudentGate";
import { supabase } from "@/lib/supabase";

export default function StudentLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const me = getStudentMe();
    if (me?.email) router.replace(next);
  }, [next, router]);

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
    // save to chat users too so messages work
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
      // try supabase
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

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="card shadow-lg">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎓</div>
          <h1 className="text-xl font-bold text-navy-900">Student Login</h1>
          <p className="text-sm text-slate-500 mt-1">
            Website dekhne se pehle student account se login karo
          </p>
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

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>
        )}

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
    </div>
  );
}
