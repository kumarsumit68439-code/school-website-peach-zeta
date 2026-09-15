import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function supabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://tztzvvefkvkxsvcnucui.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dHp2dmVma3ZreHN2Y251Y3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDA3MTcsImV4cCI6MjEwNDg3NjcxN30.DrkzoItEwCokAXVFWcOGdkx94hBw5gtGXWhsCCF9jBw";
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getSecretsFromSupabase() {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("site_secrets")
      .select("browserbase_api_key, browserbase_project_id")
      .eq("id", "main")
      .maybeSingle();
    if (error || !data) return { apiKey: "", projectId: "" };
    return {
      apiKey: (data.browserbase_api_key || "").trim(),
      projectId: (data.browserbase_project_id || "").trim(),
    };
  } catch {
    return { apiKey: "", projectId: "" };
  }
}

async function resolveKey(req: NextRequest) {
  // 1) Header (page form)
  const headerKey = (req.headers.get("x-browserbase-key") || "").trim();
  if (headerKey) return { apiKey: headerKey, projectId: "", source: "header" };

  // 2) Supabase site_secrets (preferred)
  const fromSb = await getSecretsFromSupabase();
  if (fromSb.apiKey) return { ...fromSb, source: "supabase" };

  // 3) Vercel env fallback
  const envKey = (
    process.env.BROWSERBASE_API_KEY ||
    process.env.NEXT_PUBLIC_BROWSERBASE_API_KEY ||
    ""
  ).trim();
  if (envKey) {
    return {
      apiKey: envKey,
      projectId: (process.env.BROWSERBASE_PROJECT_ID || "").trim(),
      source: "vercel",
    };
  }

  return { apiKey: "", projectId: "", source: "none" };
}

export async function POST(req: NextRequest) {
  const resolved = await resolveKey(req);
  if (!resolved.apiKey) {
    return json({
      success: false,
      error: "BROWSERBASE_API_KEY missing",
      hint: "Browserbase page pe API key save karo — Supabase me store hoga (Vercel env zaroori nahi).",
    });
  }

  let body: { url?: string; projectId?: string; timeout?: number } = {};
  try {
    body = await req.json();
  } catch {
    /* */
  }

  const projectId =
    body.projectId || resolved.projectId || process.env.BROWSERBASE_PROJECT_ID || undefined;

  try {
    const createRes = await fetch("https://api.browserbase.com/v1/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bb-api-key": resolved.apiKey,
      },
      body: JSON.stringify({
        ...(projectId ? { projectId } : {}),
        timeout: body.timeout || 300,
        browserSettings: {
          blockAds: true,
          solveCaptchas: true,
          recordSession: true,
          logSession: true,
        },
      }),
    });

    const session = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      return json({
        success: false,
        error: session?.message || session?.error || "Session create failed",
      });
    }

    let debuggerFullscreenUrl = "";
    let debuggerUrl = "";
    try {
      const debugRes = await fetch(
        `https://api.browserbase.com/v1/sessions/${session.id}/debug`,
        { headers: { "x-bb-api-key": resolved.apiKey } }
      );
      if (debugRes.ok) {
        const debug = await debugRes.json();
        debuggerUrl = debug.debuggerUrl || "";
        debuggerFullscreenUrl = debug.debuggerFullscreenUrl || debug.debuggerUrl || "";
      }
    } catch {
      /* */
    }

    return json({
      success: true,
      keySource: resolved.source,
      session: {
        id: session.id,
        status: session.status,
        connectUrl: session.connectUrl,
        region: session.region,
        expiresAt: session.expiresAt,
        debuggerUrl: debuggerUrl || `https://www.browserbase.com/sessions/${session.id}`,
        debuggerFullscreenUrl:
          debuggerFullscreenUrl || `https://www.browserbase.com/sessions/${session.id}`,
        dashboard: `https://www.browserbase.com/sessions/${session.id}`,
        startUrl: body.url || "https://rajeduboard.rajasthan.gov.in/main.asp",
      },
    });
  } catch (e) {
    return json({ success: false, error: String(e) });
  }
}

export async function GET(req: NextRequest) {
  const resolved = await resolveKey(req);
  if (!resolved.apiKey) {
    return json({ success: false, sessions: [], error: "No key in Supabase" });
  }
  try {
    const res = await fetch("https://api.browserbase.com/v1/sessions", {
      headers: { "x-bb-api-key": resolved.apiKey },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return json({ success: false, sessions: [], error: data?.message || "Failed" });
    }
    const list = Array.isArray(data) ? data : data.sessions || data.data || [];
    return json({ success: true, keySource: resolved.source, sessions: list.slice(0, 20) });
  } catch (e) {
    return json({ success: false, sessions: [], error: String(e) });
  }
}
