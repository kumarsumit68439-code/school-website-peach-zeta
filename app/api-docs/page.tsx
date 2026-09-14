"use client";

import Link from "next/link";

const BASE =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://school-website-peach-zeta-psi.vercel.app";

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
  const base = "https://school-website-peach-zeta-psi.vercel.app";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">📘 API Documentation</h1>
      <p className="text-sm text-slate-500 mb-2">
        Real backend · Supabase + Firebase · JWT-style API keys · Bearer token
      </p>
      <p className="text-sm mb-8">
        <Link href="/api-keys" className="text-navy-700 font-semibold underline">
          Generate API Key →
        </Link>
      </p>

      <div className="card mb-8">
        <h2 className="font-bold text-navy-900 mb-3">Base URL & Auth</h2>
        <p className="text-sm text-slate-600 mb-2">
          Base: <code className="bg-slate-100 px-1 rounded">{base}</code>
        </p>
        <p className="text-sm text-slate-600 mb-2">
          Header: <code className="bg-slate-100 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
        </p>
        <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
          <li>GET /api/v1/auth/verify — validate key</li>
          <li>GET|POST /api/v1/notices — notices</li>
          <li>GET /api/v1/admissions — admissions</li>
          <li>GET /api/v1/attendance — attendance</li>
          <li>POST /api/v1/keys/create — create key (JSON body)</li>
        </ul>
        <p className="text-xs text-green-700 mt-3">Backends: Supabase Postgres + Firebase RTDB (umit-jilowa)</p>
      </div>

      <Block
        title="cURL / Bash"
        code={`# Verify
curl -s ${base}/api/v1/auth/verify \\
  -H "Authorization: Bearer mggems_YOUR_KEY"

# List notices
curl -s ${base}/api/v1/notices \\
  -H "Authorization: Bearer mggems_YOUR_KEY"

# Create notice
curl -s -X POST ${base}/api/v1/notices \\
  -H "Authorization: Bearer mggems_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Holiday","body":"School closed Monday"}'

# Create API key
curl -s -X POST ${base}/api/v1/keys/create \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My App","email":"you@gmail.com"}'`}
      />

      <Block
        title="JavaScript / Fetch (React, Next.js, Vite)"
        code={`const API = "${base}";
const KEY = "mggems_YOUR_KEY";

async function getNotices() {
  const res = await fetch(API + "/api/v1/notices", {
    headers: { Authorization: "Bearer " + KEY },
  });
  return res.json();
}

// React example
useEffect(() => {
  getNotices().then(console.log);
}, []);`}
      />

      <Block
        title="Node.js"
        code={`const API = "${base}";
const KEY = process.env.MGGEMS_API_KEY;

async function main() {
  const res = await fetch(API + "/api/v1/auth/verify", {
    headers: { Authorization: "Bearer " + KEY },
  });
  console.log(await res.json());
}
main();`}
      />

      <Block
        title="Python (requests)"
        code={`import requests

BASE = "${base}"
KEY = "mggems_YOUR_KEY"
headers = {"Authorization": f"Bearer {KEY}"}

r = requests.get(f"{BASE}/api/v1/notices", headers=headers)
print(r.json())

r = requests.post(
    f"{BASE}/api/v1/notices",
    headers={**headers, "Content-Type": "application/json"},
    json={"title": "Exam", "body": "Class 10 exam tomorrow"},
)
print(r.json())`}
      />

      <Block
        title="Python Flask client / SaaS BaaS style"
        code={`from flask import Flask, jsonify
import requests

app = Flask(__name__)
BASE = "${base}"
KEY = "mggems_YOUR_KEY"

@app.get("/proxy/notices")
def notices():
    r = requests.get(
        f"{BASE}/api/v1/notices",
        headers={"Authorization": f"Bearer {KEY}"},
    )
    return jsonify(r.json())

if __name__ == "__main__":
    app.run(port=5000)`}
      />

      <Block
        title="FastAPI"
        code={`import httpx
from fastapi import FastAPI

app = FastAPI()
BASE = "${base}"
KEY = "mggems_YOUR_KEY"

@app.get("/school/notices")
async def school_notices():
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{BASE}/api/v1/notices",
            headers={"Authorization": f"Bearer {KEY}"},
        )
        return r.json()`}
      />

      <Block
        title="JSON response example"
        code={`{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "n_123",
      "title": "Holiday",
      "body": "School closed",
      "created_by": "Principal"
    }
  ]
}`}
      />

      <div className="card text-sm text-slate-600">
        <h2 className="font-bold text-navy-900 mb-2">Server callback / client connect</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>/api-keys pe key generate karo</li>
          <li>Client me Authorization: Bearer KEY set karo</li>
          <li>/api/v1/auth/verify se auto-validate</li>
          <li>Data Supabase tables se aata hai (Firebase sync background)</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          OpenAI / Slack style: same Bearer header pattern. Keys hashed (SHA-256) in Supabase — raw key only once at create.
        </p>
      </div>
    </div>
  );
}
