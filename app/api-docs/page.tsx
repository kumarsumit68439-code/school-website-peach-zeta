"use client";

import Link from "next/link";

const PORTAL = "https://mggems-api-portal.vercel.app";
const base = "https://school-website-peach-zeta-psi.vercel.app";

function Block({ title, code }: { title: string; code: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-navy-900">{title}</h3>
        <button
          type="button"
          className="text-[10px] text-navy-600 underline"
          onClick={() => navigator.clipboard.writeText(code)}
        >
          Copy
        </button>
      </div>
      <pre className="text-xs bg-slate-900 text-green-300 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">📘 API Documentation</h1>
      <p className="text-sm text-slate-500 mb-2">
        Real backend · Supabase + Firebase · Bearer token · SHA-256 hashed keys
      </p>
      <div className="flex flex-wrap gap-3 text-sm mb-8">
        <a
          href={`${PORTAL}/keys`}
          target="_blank"
          rel="noreferrer"
          className="text-navy-700 font-semibold underline"
        >
          Generate key (API Portal only)
        </a>
        <Link href="/api-client" className="text-navy-700 font-semibold underline">
          API Client Test
        </Link>
        <a href={`${PORTAL}/client`} target="_blank" rel="noreferrer" className="text-navy-700 font-semibold underline">
          Portal Client
        </a>
        <Link href="/api-keys" className="text-navy-700 font-semibold underline">
          Key info
        </Link>
      </div>

      <div className="card mb-6 bg-amber-50 border border-amber-100 text-sm text-amber-900">
        <strong>Note:</strong> API key create/generate sirf{" "}
        <a href={`${PORTAL}/keys`} className="underline font-semibold" target="_blank" rel="noreferrer">
          mggems-api-portal.vercel.app/keys
        </a>{" "}
        pe. School website pe key form nahi hai — Docs + Client test yahan available hain.
      </div>

      <div className="card mb-8">
        <h2 className="font-bold text-navy-900 mb-3">Base URL & Auth</h2>
        <p className="text-sm text-slate-600 mb-2">
          Base: <code className="bg-slate-100 px-1 rounded">{base}</code>
        </p>
        <p className="text-sm text-slate-600 mb-2">
          Header: <code className="bg-slate-100 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
        </p>
        <p className="text-sm text-slate-600 mb-2">
          Portal:{" "}
          <a href={PORTAL} className="underline text-navy-700" target="_blank" rel="noreferrer">
            {PORTAL}
          </a>
        </p>
        <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
          <li>POST /api/v1/keys/create — called by Portal only (UI)</li>
          <li>GET /api/v1/auth/verify — validate key</li>
          <li>GET|POST /api/v1/notices</li>
          <li>GET /api/v1/admissions</li>
          <li>GET /api/v1/attendance</li>
          <li>GET /api/v1/data?resource=all</li>
        </ul>
      </div>

      <Block
        title="cURL"
        code={`# Verify (key from portal)
curl -s ${base}/api/v1/auth/verify \\
  -H "Authorization: Bearer mggems_YOUR_KEY"

# Notices
curl -s ${base}/api/v1/notices \\
  -H "Authorization: Bearer mggems_YOUR_KEY"`}
      />

      <Block
        title="JavaScript Fetch"
        code={`const API = "${base}";
const KEY = "mggems_YOUR_KEY"; // from portal

const res = await fetch(API + "/api/v1/notices", {
  headers: { Authorization: "Bearer " + KEY },
});
console.log(await res.json());`}
      />

      <div className="card text-sm text-slate-600">
        <h2 className="font-bold text-navy-900 mb-2">Connected products</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>School website (docs + client test): {base}</li>
          <li>API Portal (key generate): {PORTAL}</li>
        </ul>
      </div>
    </div>
  );
}
