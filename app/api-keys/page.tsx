"use client";

import Link from "next/link";

const PORTAL = "https://mggems-api-portal.vercel.app";

export default function ApiKeysPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">🔑 API Keys</h1>
      <p className="text-sm text-slate-500 mb-6">
        Key generate sirf <strong>API Developer Portal</strong> pe hota hai — school site pe create nahi.
      </p>

      <div className="card mb-6 border-2 border-navy-200 bg-navy-50">
        <h2 className="font-bold text-navy-900 mb-2">Generate key → Portal only</h2>
        <p className="text-sm text-slate-600 mb-4">
          API keys portal pe banengi, school backend (Supabase) me SHA-256 hash save hoga. Raw key ek baar
          portal pe dikhegi.
        </p>
        <a
          href={`${PORTAL}/keys`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary inline-flex"
        >
          Open API Portal → Generate Key
        </a>
        <p className="text-xs text-slate-500 mt-3">
          Portal:{" "}
          <a href={PORTAL} className="underline text-navy-700" target="_blank" rel="noreferrer">
            {PORTAL}
          </a>
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="font-bold text-navy-900 mb-3">Key milne ke baad</h2>
        <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2">
          <li>
            <Link href="/api-client" className="text-navy-700 underline font-medium">
              API Client
            </Link>{" "}
            pe key paste karke data test karo
          </li>
          <li>
            <Link href="/api-docs" className="text-navy-700 underline font-medium">
              API Docs
            </Link>{" "}
            me endpoints / examples dekho
          </li>
          <li>
            Portal client:{" "}
            <a href={`${PORTAL}/client`} className="underline text-navy-700" target="_blank" rel="noreferrer">
              {PORTAL}/client
            </a>
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/api-docs" className="text-navy-700 font-semibold underline">
          → API Documentation
        </Link>
        <Link href="/api-client" className="text-navy-700 font-semibold underline">
          → API Client Test
        </Link>
        <a href={PORTAL} className="text-navy-700 font-semibold underline" target="_blank" rel="noreferrer">
          → Developer Portal
        </a>
      </div>
    </div>
  );
}
