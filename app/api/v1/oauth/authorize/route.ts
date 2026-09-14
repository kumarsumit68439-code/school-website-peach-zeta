import { hashKey, adminDb, json } from "@/lib/apiAuth";

export async function OPTIONS() {
  return json({ ok: true });
}

/**
 * Server callback flow:
 * GET /api/v1/oauth/authorize?api_key=KEY&redirect_uri=https://client.com/callback&state=xyz
 * Validates key → redirects to redirect_uri?access_token=KEY&state=xyz&token_type=Bearer
 * Client then calls school APIs with Bearer token (no website login needed).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const apiKey = url.searchParams.get("api_key") || url.searchParams.get("client_secret") || "";
  const redirectUri = url.searchParams.get("redirect_uri") || "";
  const state = url.searchParams.get("state") || "";
  const responseType = url.searchParams.get("response_type") || "token";

  if (!apiKey) {
    return json({ success: false, error: "api_key required" }, 400);
  }
  if (!redirectUri) {
    return json(
      {
        success: false,
        error: "redirect_uri required",
        example:
          "/api/v1/oauth/authorize?api_key=mggems_xxx&redirect_uri=https://yoursite.com/callback&state=abc",
      },
      400
    );
  }

  // Validate key against Supabase
  const hash = hashKey(apiKey);
  const { data, error } = await adminDb
    .from("api_keys")
    .select("*")
    .eq("key_hash", hash)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return json({ success: false, error: "Invalid API key" }, 401);
  }

  await adminDb
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  // Build callback URL
  let target: URL;
  try {
    target = new URL(redirectUri);
  } catch {
    return json({ success: false, error: "Invalid redirect_uri" }, 400);
  }

  if (responseType === "code") {
    // Simple code = base64 of key id + timestamp (demo)
    const code = Buffer.from(`${data.id}:${Date.now()}`).toString("base64url");
    target.searchParams.set("code", code);
  } else {
    // Implicit: return access_token (same API key for school portal simplicity)
    target.searchParams.set("access_token", apiKey);
    target.searchParams.set("token_type", "Bearer");
    target.searchParams.set("expires_in", "86400");
  }
  if (state) target.searchParams.set("state", state);
  target.searchParams.set("key_id", data.id);
  target.searchParams.set("key_name", data.name || "");

  return Response.redirect(target.toString(), 302);
}

export async function POST(req: Request) {
  // token exchange style
  try {
    const body = await req.json();
    const apiKey = body.api_key || body.client_secret || "";
    const redirectUri = body.redirect_uri || "";
    if (!apiKey) return json({ success: false, error: "api_key required" }, 400);

    const hash = hashKey(apiKey);
    const { data, error } = await adminDb
      .from("api_keys")
      .select("*")
      .eq("key_hash", hash)
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    if (error || !data) return json({ success: false, error: "Invalid API key" }, 401);

    return json({
      success: true,
      access_token: apiKey,
      token_type: "Bearer",
      expires_in: 86400,
      key_id: data.id,
      scopes: data.scopes || ["read", "write"],
      redirect_uri: redirectUri || null,
      endpoints: {
        data: "/api/v1/data?resource=all",
        notices: "/api/v1/notices",
        students: "/api/v1/students",
        attendance: "/api/v1/attendance",
        festivals: "/api/v1/festivals",
        results: "/api/v1/results?roll=1234&class=10",
      },
    });
  } catch {
    return json({ success: false, error: "Invalid JSON" }, 400);
  }
}
