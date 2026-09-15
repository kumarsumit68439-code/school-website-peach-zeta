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
  const [projectId, setProjectId] = useState("");
  const [cloudMsg, setCloudMsg] = useState("");
  const [keyStatus, setKeyStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [masked, setMasked] = useState("");

  useEffect(() => {
    fetch("/api/browserbase/key")
      .then((r) => r.json())
      .then((d) => {
        if (d.hasKey) {
          setHasKey(true);
          setMasked(d.masked || "••••");
          setKeyStatus("Supabase me key save hai ✓");
          if (d.projectId) setProjectId(d.projectId);
        } else {
          setKeyStatus("Abhi Supabase me key nahi — neeche paste karke Save karo");
        }
      })
      .catch(() => setKeyStatus(""));
  }, []);

  const saveKeyToSupabase = async () => {
    if (!apiKey.trim()) {
      setCloudMsg("Pehle Browserbase API key paste karo");
      return;
    }
    setSaving(true);
    setCloudMsg("");
    try {
      const res = await fetch("/api/browserbase/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), projectId: projectId.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setHasKey(true);
        setMasked(apiKey.trim().slice(0, 4) + "••••" + apiKey.trim().slice(-4));
        setKeyStatus("Supabase me save ho gayi ✓ (Vercel env ki zaroorat nahi)");
        setCloudMsg("Key saved in Supabase. Ab Start Cloud dabao.");
        setApiKey("");
      } else {
        setCloudMsg(data.error || "Save fail");
      }
    } catch (e) {
      setCloudMsg(String(e));
    } finally {
      setSaving(false);
    }
  };

  const doSearch = useCallback(async (query: string) => {
    const qq = query.trim();
    if (!qq) return;
    setLoading(true);
    setNote("");
    setMode("results");
    setViewUrl("");
    try {
      const res = await fetch("/api/search?q=" + encodeURIComponent(qq));
      const data = await res.json();
      const list = Array.isArray(data.results) ? data.results : [];
      setResults(list);
      setNote(list.length ? `${list.length} results` : "No results");
    } catch {
      setResults([
        {
          title: "RBSE Official",
          url: "https://rajeduboard.rajasthan.gov.in/main.asp",
          snippet: "Board home",
        },
        { title: "School Results", url: "/result", snippet: "This website" },
      ]);
      setNote("Fallback results");
    } finally {
      setLoading(false);
    }
  }, []);

  const openPage = (url: string) => {
    if (url.startsWith("/")) {
      window.location.href = url;
      return;
    }
    setViewUrl(url);
    setMode("page");
  };

  const startCloud = async () => {
    setCloudLoading(true);
    setCloudMsg("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // Optional one-time header if not yet in Supabase
      if (apiKey.trim()) headers["x-browserbase-key"] = apiKey.trim();

      const res = await fetch("/api/browserbase/session", {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: viewUrl || undefined,
          projectId: projectId.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        setCloudMsg(
          data.hint ||
            data.error ||
            "Key nahi mili — neeche API key Save to Supabase karo"
        );
        setMode("home");
        return;
      }
      setSession(data.session);
      setMode("cloud");
      if (data.keySource === "supabase") {
        setKeyStatus("Key Supabase se load hui ✓");
      }
    } catch {
      setCloudMsg("Network issue");
      setMode("home");
    } finally {
      setCloudLoading(false);
    }
  };

  const liveSrc =
    session?.debuggerFullscreenUrl || session?.debuggerUrl || session?.dashboard || "";

  return (
    <div className="mx-auto max-w-lg min-h-[100dvh] sm:min-h-[80vh] flex flex-col bg-[#202124] text-white sm:my-4 sm:rounded-2xl sm:overflow-hidden sm:border sm:border-slate-700 sm:shadow-2xl">
      <div className="bg-[#303134] px-3 pt-2 pb-2 shrink-0">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 py-1">
          <span className="font-medium text-slate-200">Chrome</span>
          <span className="flex-1 text-center truncate">School Browser</span>
          <Link href="/" className="text-blue-300">
            Home
          </Link>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            doSearch(q);
          }}
          className="flex items-center gap-2"
        >
          <button type="button" onClick={() => setMode("home")} className="text-lg px-1">
            🏠
          </button>
          <div className="flex-1 flex items-center gap-2 bg-[#3c4043] rounded-full px-3 py-2.5">
            <span className="text-slate-400">🔍</span>
            <input
              className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-slate-400 min-w-0"
              placeholder="Search or type URL"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="text-blue-300 text-sm font-semibold px-1">
            {loading ? "…" : "Go"}
          </button>
        </form>
        <div className="flex gap-2 mt-2 overflow-x-auto text-[11px] pb-1">
          {["RBSE result 2026", "Raj Shala Darpan", "Class 10 result"].map((s) => (
            <button
              key={s}
              type="button"
              className="shrink-0 px-2.5 py-1 rounded-full bg-[#3c4043]"
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

      <div className="flex-1 overflow-y-auto bg-white text-slate-900">
        {mode === "home" && (
          <div className="p-5 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🌐</div>
              <p className="font-medium">Search free · Cloud optional</p>
            </div>

            <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-xs text-green-900">
              <p className="font-semibold mb-1">API key → Supabase (Vercel nahi)</p>
              <p>{keyStatus || "Loading…"}</p>
              {hasKey && masked ? <p className="mt-1 font-mono">Saved: {masked}</p> : null}
            </div>

            {cloudMsg ? (
              <div className="rounded-xl bg-amber-50 text-amber-900 text-xs p-3">{cloudMsg}</div>
            ) : null}

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Browserbase API Key</label>
              <input
                className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono"
                type="password"
                placeholder="bb_... paste here"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
              <input
                className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono"
                placeholder="Project ID (optional)"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
              <button
                type="button"
                onClick={saveKeyToSupabase}
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {saving ? "Saving…" : "💾 Save key to Supabase"}
              </button>
              <button
                type="button"
                onClick={startCloud}
                disabled={cloudLoading}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold disabled:opacity-60"
              >
                {cloudLoading ? "Starting…" : "☁️ Start Cloud Chrome"}
              </button>
            </div>
          </div>
        )}

        {mode === "results" && (
          <div className="p-3">
            {loading && <p className="text-center text-slate-500 py-8 text-sm">Searching…</p>}
            {note && !loading ? <p className="text-xs text-slate-500 mb-3">{note}</p> : null}
            <ul className="space-y-4">
              {results.map((r, i) => (
                <li key={i} className="border-b border-slate-100 pb-3">
                  <button type="button" className="text-left w-full" onClick={() => openPage(r.url)}>
                    <div className="text-blue-700 font-medium text-[15px]">{r.title}</div>
                    <div className="text-[11px] text-green-700 truncate">{r.url}</div>
                    {r.snippet ? <p className="text-sm text-slate-600 mt-1 line-clamp-2">{r.snippet}</p> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {mode === "page" && viewUrl ? (
          <div className="flex flex-col min-h-[55vh]">
            <div className="flex gap-2 px-2 py-1.5 bg-slate-100 text-xs border-b">
              <button type="button" className="text-blue-600" onClick={() => setMode("results")}>
                ← Back
              </button>
              <span className="truncate flex-1">{viewUrl}</span>
            </div>
            <iframe title="p" src={viewUrl} className="w-full min-h-[55vh] border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
          </div>
        ) : null}

        {mode === "cloud" ? (
          <div className="flex flex-col min-h-[60vh]">
            <div className="flex gap-2 px-2 py-1.5 bg-slate-900 text-white text-xs">
              <button type="button" onClick={() => setMode("home")} className="text-blue-300">
                ← Exit
              </button>
              <span className="flex-1 truncate">{session?.id}</span>
              {liveSrc ? (
                <a href={liveSrc} target="_blank" rel="noreferrer" className="text-blue-300">
                  Full
                </a>
              ) : null}
            </div>
            {liveSrc ? (
              <iframe title="bb" src={liveSrc} className="w-full min-h-[65vh] border-0" allow="fullscreen" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" />
            ) : (
              <p className="p-4 text-sm">Session ready</p>
            )}
          </div>
        ) : null}
      </div>

      <div className="bg-[#303134] border-t border-[#3c4043] px-4 py-2 flex justify-around text-[10px] text-slate-300 shrink-0">
        <button type="button" onClick={() => setMode("home")} className="flex flex-col items-center">
          <span className="text-lg">🏠</span>Home
        </button>
        <button type="button" onClick={() => doSearch(q || "RBSE")} className="flex flex-col items-center">
          <span className="text-lg">🔍</span>Search
        </button>
        <button type="button" onClick={startCloud} className="flex flex-col items-center">
          <span className="text-lg">☁️</span>Cloud
        </button>
        <Link href="/browser" className="flex flex-col items-center text-slate-300">
          <span className="text-lg">📑</span>Tabs
        </Link>
      </div>
    </div>
  );
}
