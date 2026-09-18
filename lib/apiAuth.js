import { createHash, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tztzvvefkvkxsvcnucui.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dHp2dmVma3ZreHN2Y251Y3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDA3MTcsImV4cCI6MjEwNDg3NjcxN30.DrkzoItEwCokAXVFWcOGdkx94hBw5gtGXWhsCCF9jBw";

export const adminDb = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export function hashKey(raw) {
  return createHash("sha256").update(String(raw).trim()).digest("hex");
}

export function generateApiKey() {
  const prefix = "mggems";
  const body = randomBytes(24).toString("base64url");
  const raw = `${prefix}_${body}`;
  return {
    raw,
    prefix: raw.slice(0, 12),
    hash: hashKey(raw),
    id: "key_" + Date.now() + "_" + randomBytes(4).toString("hex"),
  };
}

export function getBearer(req) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function verifyApiKey(req) {
  const raw = getBearer(req);
  if (!raw) {
    return { ok: false, status: 401, error: "Missing Authorization: Bearer <api_key>" };
  }
  const hash = hashKey(raw);
  const { data, error } = await adminDb
    .from("api_keys")
    .select("*")
    .eq("key_hash", hash)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, error: "Key lookup failed: " + error.message };
  }
  if (!data) {
    return { ok: false, status: 401, error: "Invalid or inactive API key" };
  }

  try {
    await adminDb
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);
  } catch {
    /* non-fatal */
  }

  return { ok: true, key: data };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Requested-With",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: CORS,
  });
}

export function corsPreflight() {
  return new Response(null, { status: 204, headers: CORS });
}
