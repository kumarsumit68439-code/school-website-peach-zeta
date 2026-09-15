"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

type Hit = { title: string; url: string; snippet: string };

export default function BrowserPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Hit[]>([]);
  const [note, setNote] = useState("");
  const [viewUrl, setViewUrl] = useState("");
  const [viewMode, setViewMode] = useState<"search" | "page">("search");
  const [iframeOk, setIframeOk] = useState(true);

  const search = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const query = q.trim();
      if (!query) return;
      setLoading(true);
      setNote("");
      setViewMode("search");
      setViewUrl("");
      try {
        const res = await fetch("/api/search?q=" + encodeURIComponent(query));
        const data = await res.json();
        setResults(Array.isArray(data.results) ? data.results : []);
        setNote(
          data.note ||
            (data.count
              ? `${data.count} results · same page pe (naya tab nahi)`
              : "Koi result nahi mila — dusra keyword try karo")
        );
      } catch {
        setResults([]);
        setNote("Search fail — thodi der baad try karo (error hide)");
      } finally {
        setLoading(false);
      }
    },
    [q]
  );

  const openInApp = (url: string) => {
    setViewUrl(url);
    setViewMode("page");
    setIframeOk(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-6">
      <div className="rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white">
        {/* Chrome-like toolbar */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex gap-1.5 pl-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </span>
            <span className="font-medium text-slate-700">School Browser</span>
            <span className="hidden sm:inline">· search is site pe · no new tab</span>
          </div>

          <form onSubmit={search} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white border border-slate-300 rounded-full px-3 py-2 shadow-sm">
              <span className="text-slate-400 text-sm">🔍</span>
              <input
                className="flex-1 outline-none text-sm bg-transparent"
                placeholder="Search the web (RBSE, school, news…)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-navy-800 hover:bg-navy-900 text-white text-sm font-semibold px-4 rounded-full disabled:opacity-60"
            >
              {loading ? "…" : "Search"}
            </button>
          </form>

          {viewMode === "page" && viewUrl && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("search")}
                className="px-2 py-1 rounded bg-white border text-navy-800 font-medium"
              >
                ← Results
              </button>
              <span className="truncate text-slate-500 font-mono flex-1">{viewUrl}</span>
            </div>
          )}
        </div>

        {/* Content area — same page only */}
        <div className="min-h-[60vh] bg-white">
          {viewMode === "page" && viewUrl ? (
            <div className="relative h-[70vh]">
              {iframeOk ? (
                <iframe
                  title="In-site viewer"
                  src={viewUrl}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  referrerPolicy="no-referrer"
                  onError={() => setIframeOk(false)}
                />
              ) : null}
              {/* Many sites block iframe — soft message, still stay on our site */}
              <div className="absolute bottom-0 left-0 right-0 bg-amber-50 border-t border-amber-100 px-3 py-2 text-[11px] text-amber-900">
                Kuch websites (Google, banks, etc.) security ke liye iframe block karti hain — ye
                error nahi, unki policy hai. Result list se title / link yahin padh sakte ho.{" "}
                <button
                  type="button"
                  className="underline font-semibold"
                  onClick={() => setViewMode("search")}
                >
                  Back to results
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {!results.length && !loading && (
                <div className="text-center text-slate-400 py-16">
                  <div className="text-4xl mb-3">🌐</div>
                  <p className="text-sm">Search box me type karo — results is page pe dikhenge</p>
                  <p className="text-xs mt-1">Naya tab / window nahi khulega</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {["RBSE result 2026", "Raj Shala Darpan", "Rajasthan board", "Jaipur schools"].map(
                      (s) => (
                        <button
                          key={s}
                          type="button"
                          className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                          onClick={() => {
                            setQ(s);
                            setTimeout(() => {
                              setQ(s);
                            }, 0);
                            // trigger search with value
                            (async () => {
                              setQ(s);
                              setLoading(true);
                              try {
                                const res = await fetch(
                                  "/api/search?q=" + encodeURIComponent(s)
                                );
                                const data = await res.json();
                                setResults(data.results || []);
                                setNote(data.note || `${data.count || 0} results`);
                              } finally {
                                setLoading(false);
                              }
                            })();
                          }}
                        >
                          {s}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {loading && (
                <p className="text-center text-slate-500 py-12 text-sm">Searching…</p>
              )}

              {note && !loading && (
                <p className="text-xs text-slate-500 mb-4">{note}</p>
              )}

              <ul className="space-y-4">
                {results.map((r, i) => (
                  <li key={i} className="border-b border-slate-50 pb-3">
                    <button
                      type="button"
                      onClick={() => openInApp(r.url)}
                      className="text-left w-full group"
                    >
                      <div className="text-navy-800 font-semibold group-hover:underline text-base">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-green-700 truncate mt-0.5">{r.url}</div>
                      {r.snippet && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{r.snippet}</p>
                      )}
                    </button>
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => openInApp(r.url)}
                        className="text-[11px] text-navy-600 underline"
                      >
                        Is page pe dekho (no new tab)
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        School portal browser · results via secure server search ·{" "}
        <Link href="/" className="underline">
          Home
        </Link>
      </p>
    </div>
  );
}
