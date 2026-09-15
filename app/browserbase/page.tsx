"use client";

import { useState } from "react";
import Link from "next/link";

type SessionInfo = {
  id: string;
  status?: string;
  connectUrl?: string;
  debuggerUrl?: string;
  debuggerFullscreenUrl?: string;
  dashboard?: string;
  startUrl?: string;
  region?: string;
  expiresAt?: string;
};

export default function BrowserbasePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [url, setUrl] = useState("https://rajeduboard.rajasthan.gov.in/main.asp");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const start = async () => {
    setLoading(true);
    setError("");
    setSession(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey.trim()) headers["x-browserbase-key"] = apiKey.trim();

      const res = await fetch("/api/browserbase/session", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: url.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to start session");
        return;
      }
      setSession(data.session);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const liveSrc =
    session?.debuggerFullscreenUrl || session?.debuggerUrl || session?.dashboard || "";

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Browserbase Cloud Browser</h1>
          <p className="text-sm text-slate-500">
            Real remote Chrome session · school website ke andar
          </p>
        </div>
        <Link href="/browser" className="text-sm text-navy-700 underline">
          ← Local Search Browser
        </Link>
      </div>

      <div className="card mb-6 space-y-4">
        <div>
          <label className="label">Start URL (optional hint)</label>
          <input
            className="input font-mono text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div>
          <button
            type="button"
            className="text-xs text-navy-600 underline mb-1"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? "Hide" : "Show"} API key field (optional if set on Vercel)
          </button>
          {showKey && (
            <input
              className="input font-mono text-sm"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="bb_... Browserbase API key"
              autoComplete="off"
            />
          )}
        </div>

        <button
          type="button"
          onClick={start}
          disabled={loading}
          className="btn btn-primary w-full sm:w-auto"
        >
          {loading ? "Starting cloud browser…" : "🚀 Start Browserbase Session"}
        </button>

        {error && (
          <div className="bg-amber-50 text-amber-900 text-sm rounded-lg p-3 space-y-2">
            <p className="font-semibold">{error}</p>
            <ol className="list-decimal pl-5 text-xs space-y-1">
              <li>
                <a
                  href="https://www.browserbase.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  browserbase.com
                </a>{" "}
                pe account banao
              </li>
              <li>Settings → copy API Key</li>
              <li>
                Vercel → Project → Settings → Environment Variables:
                <code className="bg-white px-1 rounded ml-1">BROWSERBASE_API_KEY</code>
              </li>
              <li>Optional: <code className="bg-white px-1 rounded">BROWSERBASE_PROJECT_ID</code></li>
              <li>Redeploy, ya upar API key field me paste karke Start dabao</li>
            </ol>
          </div>
        )}
      </div>

      {session && (
        <div className="space-y-4">
          <div className="card text-sm space-y-1">
            <p>
              <span className="text-slate-500">Session ID:</span>{" "}
              <code className="font-mono text-xs">{session.id}</code>
            </p>
            {session.region && (
              <p>
                <span className="text-slate-500">Region:</span> {session.region}
              </p>
            )}
            {session.status && (
              <p>
                <span className="text-slate-500">Status:</span> {session.status}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              {session.dashboard && (
                <a
                  href={session.dashboard}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy-700 underline text-xs"
                >
                  Open in Browserbase dashboard
                </a>
              )}
              {liveSrc && (
                <a
                  href={liveSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy-700 underline text-xs"
                >
                  Open live debugger
                </a>
              )}
            </div>
          </div>

          {liveSrc && (
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-lg bg-slate-50">
              <div className="bg-slate-800 text-white text-xs px-3 py-2 flex justify-between">
                <span>Browserbase Live View</span>
                <span className="text-slate-400">Cloud Chrome</span>
              </div>
              <iframe
                title="Browserbase session"
                src={liveSrc}
                className="w-full h-[70vh] border-0 bg-white"
                allow="clipboard-read; clipboard-write"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          )}

          <p className="text-xs text-slate-500">
            Live view Browserbase debugger se aata hai. Agar iframe blank ho (security policy), upar
            “Open live debugger” use karo — session phir bhi cloud pe chal raha hota hai.
          </p>
        </div>
      )}

      <div className="mt-8 card text-xs text-slate-600 space-y-2">
        <p className="font-semibold text-slate-800">Kya hai Browserbase?</p>
        <p>
          Cloud me real Chrome browser — automation, result check, official sites. Aapki school site
          session create karti hai; control Browserbase + CDP se hota hai.
        </p>
        <p>
          Docs:{" "}
          <a
            href="https://docs.browserbase.com/"
            className="underline text-navy-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.browserbase.com
          </a>
        </p>
      </div>
    </div>
  );
}
