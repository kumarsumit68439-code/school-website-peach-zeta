"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type SavedKey = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  raw?: string;
};

const PORTAL = "https://mggems-api-portal.vercel.app";

export default function ApiKeysPage() {
  const [name, setName] = useState("School App Key");
  const [email, setEmail] = useState("");
  const [keys, setKeys] = useState<SavedKey[]>([]);
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    setKeys(JSON.parse(localStorage.getItem("schoolApiKeysMeta") || "[]"));
  }, []);

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNewKey("");
    try {
      const res = await fetch("/api/v1/keys/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, owner_name: name }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed");
        return;
      }
      const raw = data.api_key || data.key || data.apiKey;
      setNewKey(raw);
      const meta: SavedKey = {
        id: data.key_id || data.id,
        name,
        prefix: data.prefix || raw?.slice(0, 12),
        createdAt: new Date().toISOString(),
        raw,
      };
      const next = [meta, ...keys];
      setKeys(next);
      localStorage.setItem("schoolApiKeysMeta", JSON.stringify(next));
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const testKey = async (raw: string) => {
    setTestResult("Testing...");
    try {
      const res = await fetch("/api/v1/auth/verify", {
        headers: { Authorization: `Bearer ${raw}` },
      });
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setTestResult(String(e));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">🔑 API Keys</h1>
      <p className="text-sm text-slate-500 mb-2">
        Bearer token · SHA-256 hash in Supabase · raw key only once
      </p>
      <p className="text-sm mb-6">
        Full developer portal:{" "}
        <a href={PORTAL} target="_blank" rel="noreferrer" className="text-navy-700 font-semibold underline">
          mggems-api-portal.vercel.app
        </a>
      </p>

      <div className="card mb-6 bg-navy-50 border border-navy-100">
        <p className="text-sm text-navy-900">
          Keys generate yahan ya{" "}
          <a href={`${PORTAL}/keys`} className="underline font-semibold" target="_blank" rel="noreferrer">
            API Portal → Generate Key
          </a>{" "}
          se kar sakte ho — dono same school backend use karte hain.
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="font-bold text-navy-900 mb-3">Create new key</h2>
        <form onSubmit={createKey} className="space-y-3">
          <div>
            <label className="label">Key name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Your email (optional)</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Generating…" : "Generate API Key"}
          </button>
        </form>

        {newKey && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-800 font-semibold mb-1">Copy now — shown once:</p>
            <code className="text-xs break-all block bg-white p-2 rounded border">{newKey}</code>
            <button
              type="button"
              className="mt-2 text-xs underline text-navy-700"
              onClick={() => navigator.clipboard.writeText(newKey)}
            >
              Copy to clipboard
            </button>
            <button
              type="button"
              className="mt-2 ml-3 text-xs underline text-green-700"
              onClick={() => testKey(newKey)}
            >
              Test key
            </button>
            <a
              href={`${PORTAL}/client`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 ml-3 text-xs underline text-navy-700"
            >
              Open API Client
            </a>
          </div>
        )}
      </div>

      {testResult && (
        <pre className="card text-xs overflow-auto max-h-48 mb-6 bg-slate-900 text-green-300 p-4">
          {testResult}
        </pre>
      )}

      <div className="card">
        <h2 className="font-bold text-navy-900 mb-3">Your keys (this browser)</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-slate-400">No keys yet</p>
        ) : (
          <ul className="space-y-2">
            {keys.map((k) => (
              <li key={k.id} className="flex justify-between gap-2 text-sm border-b pb-2">
                <div>
                  <div className="font-medium">{k.name}</div>
                  <div className="text-xs text-slate-400">
                    {k.prefix}… · {k.createdAt.slice(0, 10)}
                  </div>
                </div>
                {k.raw && (
                  <button type="button" className="text-xs text-navy-600 underline" onClick={() => testKey(k.raw!)}>
                    Test
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-sm mt-6 space-x-4">
        <Link href="/api-docs" className="text-navy-700 font-semibold underline">
          API Docs
        </Link>
        <a href={PORTAL} className="text-navy-700 font-semibold underline" target="_blank" rel="noreferrer">
          Developer Portal
        </a>
      </p>
    </div>
  );
}
