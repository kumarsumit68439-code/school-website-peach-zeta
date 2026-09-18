"use client";

import Link from "next/link";

const PORTAL = "https://mggems-api-portal.vercel.app";
const SCHOOL = "https://school-website-peach-zeta-psi.vercel.app";

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
        School + Portal endpoints · Bearer token · real data
      </p>
      <div className="flex flex-wrap gap-3 text-sm mb-8">
        <a href={`${PORTAL}/keys`} target="_blank" rel="noreferrer" className="text-navy-700 font-semibold underline">
          Generate key (Portal)
        </a>
        <Link href="/api-client" className="text-navy-700 font-semibold underline">
          API Client
        </Link>
        <a href={`${PORTAL}/docs`} target="_blank" rel="noreferrer" className="text-navy-700 font-semibold underline">
          Portal Docs
        </a>
        <a href={`${PORTAL}/client`} target="_blank" rel="noreferrer" className="text-navy-700 font-semibold underline">
          Live Data
        </a>
      </div>

      <div className="card mb-6">
        <h2 className="font-bold text-navy-900 mb-3">Base URLs (dono kaam karte hain)</h2>
        <p className="text-sm text-slate-600 mb-1">
          <strong>School:</strong> <code className="bg-slate-100 px-1 rounded">{SCHOOL}/api/v1</code>
        </p>
        <p className="text-sm text-slate-600 mb-1">
          <strong>Portal proxy:</strong>{" "}
          <code className="bg-slate-100 px-1 rounded">{PORTAL}/api/v1</code>
        </p>
        <p className="text-sm text-slate-600">
          Header: <code className="bg-slate-100 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Portal <code>/api/v1/*</code> school API ko proxy karta hai — same paths, same key.
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="font-bold text-navy-900 mb-2">Endpoints</h2>
        <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
          <li>POST /api/v1/keys/create — create key (portal UI; no auth)</li>
          <li>GET /api/v1/auth/verify — validate key</li>
          <li>GET /api/v1/data?resource=all — full live dump</li>
          <li>GET|POST /api/v1/notices</li>
          <li>GET /api/v1/admissions</li>
          <li>GET /api/v1/attendance</li>
        </ul>
      </div>

      <Block
        title="cURL — School base"
        code={`# Create key
curl -s -X POST ${SCHOOL}/api/v1/keys/create \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My App","email":"you@gmail.com"}'

# Verify
curl -s ${SCHOOL}/api/v1/auth/verify \\
  -H "Authorization: Bearer mggems_YOUR_KEY"

# Live all data
curl -s "${SCHOOL}/api/v1/data?resource=all" \\
  -H "Authorization: Bearer mggems_YOUR_KEY"

# Notices / Admissions / Attendance
curl -s ${SCHOOL}/api/v1/notices -H "Authorization: Bearer mggems_YOUR_KEY"
curl -s ${SCHOOL}/api/v1/admissions -H "Authorization: Bearer mggems_YOUR_KEY"
curl -s ${SCHOOL}/api/v1/attendance -H "Authorization: Bearer mggems_YOUR_KEY"

# Create notice
curl -s -X POST ${SCHOOL}/api/v1/notices \\
  -H "Authorization: Bearer mggems_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Holiday","body":"School closed"}'`}
      />

      <Block
        title="cURL — Portal proxy base"
        code={`# Same endpoints on portal (proxied to school)
curl -s -X POST ${PORTAL}/api/v1/keys/create \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Via Portal","email":"you@gmail.com"}'

curl -s ${PORTAL}/api/v1/auth/verify \\
  -H "Authorization: Bearer mggems_YOUR_KEY"

curl -s "${PORTAL}/api/v1/data?resource=all" \\
  -H "Authorization: Bearer mggems_YOUR_KEY"

curl -s ${PORTAL}/api/v1/notices -H "Authorization: Bearer mggems_YOUR_KEY"
curl -s ${PORTAL}/api/v1/admissions -H "Authorization: Bearer mggems_YOUR_KEY"
curl -s ${PORTAL}/api/v1/attendance -H "Authorization: Bearer mggems_YOUR_KEY"`}
      />

      <Block
        title="JavaScript (school or portal)"
        code={`const SCHOOL = "${SCHOOL}";
const PORTAL = "${PORTAL}";
const KEY = "mggems_YOUR_KEY";

async function load(base) {
  const res = await fetch(base + "/api/v1/data?resource=all", {
    headers: { Authorization: "Bearer " + KEY },
  });
  return res.json();
}

load(SCHOOL).then(console.log);
load(PORTAL).then(console.log);`}
      />

      <div className="card text-sm text-slate-600">
        <h2 className="font-bold text-navy-900 mb-2">Connected products</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>School API + docs: {SCHOOL}</li>
          <li>Portal keys + proxy + live UI: {PORTAL}</li>
        </ul>
      </div>
    </div>
  );
}
