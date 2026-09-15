"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Hit = { title: string; url: string; snippet: string };
type SessionInfo = {
  id: string;
  status?: string;
  debuggerUrl?: string;
  debuggerFullscreenUrl?: string;
  dashboard?: string;
  region?: string;
};

export default function BrowserbasePage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Hit[]>([]);
  const [note, setNote] = useState("");
  const [viewUrl, setViewUrl] = useState("");
  const [mode, setMode] = useState<"home" | "results" | "page" | "cloud">("home");
  const [cloudLoading, setCloudLoading] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  // Mobile: lock visual viewport feel
  useEffect(() => {
    document.body.classList.add("overflow-x-hidden");
    return () => document.body.classList.remove("overflow-x-hidden");
  }, []);

  const doSearch = useCallback(async (query: string) => {
    const qq = query.trim();
    if (!qq) return;
    setLoading(true);
    setNote("");
    setError("");
    setMode("results");
    setViewUrl("");
    try {
      const res = await fetch("/api/search?q=" + encodeURIComponent(qq));
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
      setNote(
        data.count
          ? `${data.count} results`
          : data.note || "Results loaded"
      );
    } catch {
      setResults([]);
      setNote("Try again");
    } finally {
      setLoading(false);
    }
  }, []);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(q);
  };

  const openPage = (url: string) => {
    setViewUrl(url);
    setMode("page");
  };

  const startCloud = async () => {
    setCloudLoading(true);
    setError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey.trim()) headers["x-browserbase-key"] = apiKey.trim();
      const res = await fetch("/api/browserbase/session", {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: viewUrl || q || "https://rajeduboard.rajasthan.gov.in/main.asp",
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Cloud session failed");
        return;
      }
      setSession(data.session);
      setMode("cloud");
    } catch (e) {
      setError(String(e));
    } finally {
      setCloudLoading(false);
    }
  };

  const liveSrc =
    session?.debuggerFullscreenUrl || session?.debuggerUrl || session?.dashboard || "";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#202124] text-white sm:static sm:min-h-[85vh] sm:rounded-2xl sm:overflow-hidden sm:max-w-lg sm:mx-auto sm:my-4 sm:border sm:border-slate-700 sm:shadow-2xl">
      {/* Mobile Chrome status-ish bar */}
      <div className="bg-[#303134] px-3 pt-[env(safe-area-inset-top)] pb-2 safe-top">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 py-1">
          <span className="font-medium text-slate-200">Chrome</span>
          <span className="flex-1 text-center truncate">School Browser</span>
          <Link href="/" className="text-blue-300">
            Home
          </Link>
        </div>

        {/* Address / search bar — mobile keyboard friendly */}
        <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("home");
              setViewUrl("");
            }}
            className="text-lg px-1 text-slate-300"
            aria-label="Home"
          >
            🏠
          </button>
          <div className="flex-1 flex items-center gap-2 bg-[#3c4043] rounded-full px-3 py-2.5">
            <span className="text-slate-400 text-sm">🔒</span>
            <input
              className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-slate-400 min-w-0"
              placeholder="Search or type URL"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              inputMode="search"
              enterKeyHint="search"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
            />
            {q && (
              <button
                type="button"
                className="text-slate-400 text-sm"
                onClick={() => setQ("")}
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="text-blue-300 text-sm font-semibold px-1 disabled:opacity-50"
          >
            {loading ? "…" : "Go"}
          </button>
        </form>

        <div className="flex gap-2 mt-2 overflow-x-auto text-[11px] pb-1">
          {["RBSE result", "Raj Shala Darpan", "Rajasthan board", "Jaipur"].map((s) => (
            <button
              key={s}
              type="button"
              className="shrink-0 px-2.5 py-1 rounded-full bg-[#3c4043] text-slate-200"
              onClick={() => {
                setQ(s);
                doSearch(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white text-slate-900 overscroll-contain">
        {mode === "home" && (
          <div className="p-6 text-center">
            <div className="text-5xl mb-3">🌐</div>
            <p className="text-lg font-medium text-slate-800">Search</p>
            <p className="text-sm text-slate-500 mt-1">
              Mobile keyboard se type karo · results is screen pe
            </p>
            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={startCloud}
                disabled={cloudLoading}
                className="w-full py-3 rounded-xl bg-navy-800 text-white font-semibold text-sm disabled:opacity-60"
              >
                {cloudLoading ? "Starting…" : "☁️ Start Browserbase Cloud Chrome"}
              </button>
              <input
                className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono"
                type="password"
                placeholder="Browserbase API key (if not on Vercel)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                inputMode="text"
                autoComplete="off"
              />
              {error && <p className="text-xs text-amber-700 text-left">{error}</p>}
            </div>
            <p className="text-[11px] text-slate-400 mt-4">
              Search ke liye API key zaroori nahi · Cloud Chrome ke liye key chahiye
            </p>
          </div>
        )}

        {mode === "results" && (
          <div className="p-3">
            {loading && <p className="text-center text-slate-500 py-8 text-sm">Searching…</p>}
            {note && !loading && <p className="text-xs text-slate-500 mb-3">{note}</p>}
            <ul className="space-y-4">
              {results.map((r, i) => (
                <li key={i} className="border-b border-slate-100 pb-3">
                  <button type="button" className="text-left w-full" onClick={() => openPage(r.url)}>
                    <div className="text-blue-700 font-medium text-[15px] leading-snug">{r.title}</div>
                    <div className="text-[11px] text-green-700 truncate mt-0.5">{r.url}</div>
                    {r.snippet && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-3">{r.snippet}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {!loading && results.length === 0 && (
              <p className="text-center text-slate-400 py-10 text-sm">No results</p>
            )}
          </div>
        )}

        {mode === "page" && viewUrl && (
          <div className="flex flex-col h-full min-h-[60vh]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-100 text-xs border-b">
              <button type="button" className="text-blue-600 font-medium" onClick={() => setMode("results")}>
                ← Back
              </button>
              <span className="truncate flex-1 text-slate-500">{viewUrl}</span>
              <button
                type="button"
                className="text-navy-800 font-semibold"
                onClick={startCloud}
                disabled={cloudLoading}
              >
                Cloud
              </button>
            </div>
            <iframe
              title="page"
              src={viewUrl}
              className="w-full flex-1 min-h-[55vh] border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              referrerPolicy="no-referrer"
            />
            <p className="text-[10px] text-slate-500 p-2 bg-amber-50">
              Kuch sites iframe block karti hain. Cloud Chrome use karo for full browser.
            </p>
          </div>
        )}

        {mode === "cloud" && (
          <div className="flex flex-col h-full min-h-[60vh]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-900 text-white text-xs">
              <button type="button" onClick={() => setMode("home")} className="text-blue-300">
                ← Exit
              </button>
              <span className="flex-1 truncate">Browserbase · {session?.id?.slice(0, 8)}…</span>
              {liveSrc && (
                <a href={liveSrc} target="_blank" rel="noopener noreferrer" className="text-blue-300">
                  Full
                </a>
              )}
            </div>
            {liveSrc ? (
              <iframe
                title="browserbase"
                src={liveSrc}
                className="w-full flex-1 min-h-[65vh] border-0"
                allow="clipboard-read; clipboard-write; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            ) : (
              <p className="p-4 text-sm text-slate-600">Session started — open Full for debugger.</p>
            )}
            {error && <p className="text-xs text-red-600 p-2">{error}</p>}
          </div>
        )}
      </div>

      {/* Mobile Chrome bottom bar */}
      <div className="bg-[#303134] border-t border-[#3c4043] px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-around text-slate-300 text-[10px]">
        <button type="button" className="flex flex-col items-center gap-0.5" onClick={() => setMode("home")}>
          <span className="text-lg">🏠</span>
          Home
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-0.5"
          onClick={() => {
            const el = document.querySelector<HTMLInputElement>("input[inputmode=search]");
            el?.focus();
          }}
        >
          <span className="text-lg">🔍</span>
          Search
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-0.5"
          onClick={startCloud}
          disabled={cloudLoading}
        >
          <span className="text-lg">☁️</span>
          Cloud
        </button>
        <Link href="/browser" className="flex flex-col items-center gap-0.5 text-slate-300">
          <span className="text-lg">📑</span>
          Tabs
        </Link>
      </div>
    </div>
  );
}
