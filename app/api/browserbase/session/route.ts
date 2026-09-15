import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function getKey(req: NextRequest) {
  // Prefer server env; optional header for testing (never log key)
  return (
    process.env.BROWSERBASE_API_KEY ||
    process.env.NEXT_PUBLIC_BROWSERBASE_API_KEY ||
    req.headers.get("x-browserbase-key") ||
    ""
  ).trim();
}

/** Create Browserbase cloud browser session */
export async function POST(req: NextRequest) {
  const apiKey = getKey(req);
  if (!apiKey) {
    return json(
      {
        success: false,
        error:
          "BROWSERBASE_API_KEY missing. Add it in Vercel Environment Variables, or pass x-browserbase-key header.",
        setup: "https://www.browserbase.com/ → Settings → API Key",
      },
      400
    );
  }

  let body: { url?: string; projectId?: string; timeout?: number } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body ok */
  }

  const projectId =
    body.projectId || process.env.BROWSERBASE_PROJECT_ID || undefined;

  try {
    const createRes = await fetch("https://api.browserbase.com/v1/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bb-api-key": apiKey,
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

    const session = await createRes.json();
    if (!createRes.ok) {
      return json(
        {
          success: false,
          error: session?.message || session?.error || "Session create failed",
          details: session,
        },
        createRes.status
      );
    }

    // Live debugger / inspector URL
    let debuggerFullscreenUrl = "";
    let debuggerUrl = "";
    try {
      const debugRes = await fetch(
        `https://api.browserbase.com/v1/sessions/${session.id}/debug`,
        { headers: { "x-bb-api-key": apiKey } }
      );
      if (debugRes.ok) {
        const debug = await debugRes.json();
        debuggerUrl = debug.debuggerUrl || "";
        debuggerFullscreenUrl =
          debug.debuggerFullscreenUrl || debug.debuggerUrl || "";
      }
    } catch {
      /* optional */
    }

    return json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        connectUrl: session.connectUrl,
        region: session.region,
        expiresAt: session.expiresAt,
        debuggerUrl: debuggerUrl || `https://www.browserbase.com/sessions/${session.id}`,
        debuggerFullscreenUrl:
          debuggerFullscreenUrl ||
          `https://www.browserbase.com/sessions/${session.id}`,
        dashboard: `https://www.browserbase.com/sessions/${session.id}`,
        startUrl: body.url || "https://rajeduboard.rajasthan.gov.in/main.asp",
      },
      message: "Cloud browser session created",
    });
  } catch (e) {
    return json({ success: false, error: String(e) }, 500);
  }
}

/** List recent sessions */
export async function GET(req: NextRequest) {
  const apiKey = getKey(req);
  if (!apiKey) {
    return json({ success: false, error: "BROWSERBASE_API_KEY missing", sessions: [] }, 400);
  }
  try {
    const res = await fetch("https://api.browserbase.com/v1/sessions", {
      headers: { "x-bb-api-key": apiKey },
    });
    const data = await res.json();
    if (!res.ok) {
      return json({ success: false, error: data?.message || "Failed", sessions: [] }, res.status);
    }
    const list = Array.isArray(data) ? data : data.sessions || data.data || [];
    return json({ success: true, sessions: list.slice(0, 20) });
  } catch (e) {
    return json({ success: false, error: String(e), sessions: [] }, 500);
  }
}
