"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ClientInner() {
  const params = useSearchParams();
  const [key, setKey] = useState("");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("all");

  // OAuth-style callback: ?access_token=... from redirect
  useEffect(() => {
    const t =
      params.get("access_token") ||
      params.get("api_key") ||
      localStorage.getItem("schoolClientApiKey") ||
      "";
    if (t) {
      setKey(t);
      localStorage.setItem("schoolClientApiKey", t);
    }
  }, [params]);

  const load = async (resource = "all") => {
    if (!key.trim()) {
      setError("API key likho");
      return;
    }
    setLoading(true);
    setError("");
    try {
      localStorage.setItem("schoolClientApiKey", key.trim());
      const res = await fetch(`/api/v1/data?resource=${resource}`, {
        headers: { Authorization: `Bearer ${key.trim()}` },
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed");
        setData(null);
      } else {
        setData(json);
        setTab(resource);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const sections =
    data && (data as { data?: Record<string, unknown[]> }).data
      ? Object.keys((data as { data: Record<string, unknown[]> }).data)
      : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">🔌 API Client Access</h1>
      <p className="text-sm text-slate-500 mb-4">
        Bina student/staff login — sirf API key se saara school data screen pe
      </p>

      <div className="card mb-6 space-y-3">
        <label className="label">API Key (Bearer)</label>
        <input
          className="input font-mono text-sm"
          placeholder="mggems_..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => load("all")} disabled={loading} className="btn btn-primary">
            {loading ? "Loading…" : "Load All Data"}
          </button>
          {["notices", "students", "attendance", "festivals", "admissions", "locations", "mistakes"].map(
            (r) => (
              <button
                key={r}
                type="button"
                onClick={() => load(r)}
                className="btn btn-outline text-xs capitalize"
              >
                {r}
              </button>
            )
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-slate-500">
          Key nahi hai?{" "}
          <Link href="/api-keys" className="underline text-navy-700">
            Generate API Key
          </Link>
          {" · "}
          <Link href="/api-docs" className="underline text-navy-700">
            Docs
          </Link>
        </p>
      </div>

      {data && (
        <>
          {(data as { counts?: Record<string, number> }).counts && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {Object.entries((data as { counts: Record<string, number> }).counts).map(([k, v]) => (
                <div key={k} className="card text-center py-3">
                  <div className="text-xl font-bold text-navy-800">{v}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{k}</div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h2 className="font-bold text-navy-900 mb-3">
              Data preview {tab !== "all" ? `(${tab})` : ""}
            </h2>
            {tab === "all" && sections.length > 0 ? (
              sections.map((sec) => {
                const arr =
                  ((data as { data: Record<string, unknown[]> }).data[sec] as unknown[]) || [];
                return (
                  <div key={sec} className="mb-4">
                    <h3 className="text-sm font-semibold capitalize text-navy-800 mb-1">
                      {sec} ({arr.length})
                    </h3>
                    <pre className="text-[10px] bg-slate-900 text-green-300 p-2 rounded max-h-40 overflow-auto">
                      {JSON.stringify(arr.slice(0, 5), null, 2)}
                      {arr.length > 5 ? "\n…" : ""}
                    </pre>
                  </div>
                );
              })
            ) : (
              <pre className="text-xs bg-slate-900 text-green-300 p-3 rounded max-h-96 overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ApiClientPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-500">Loading…</div>}>
      <ClientInner />
    </Suspense>
  );
}
