import { createHash, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tztzvvefkvkxsvcnucui.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dHp2dmVma3ZreHN2Y251Y3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDA3MTcsImV4cCI6MjEwNDg3NjcxN30.DrkzoItEwCokAXVFWcOGdkx94hBw5gtGXWhsCCF9jBw";

export const adminDb = createClient(supabaseUrl, supabaseAnonKey);

export function hashKey(raw) {
  return createHash("sha256").update(raw).digest("hex");
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

/** Extract Bearer token from Request */
export function getBearer(req) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export async function verifyApiKey(req) {
  const raw = getBearer(req);
  if (!raw) return { ok: false, status: 401, error: "Missing Authorization: Bearer <api_key>" };
  const hash = hashKey(raw);
  const { data, error } = await adminDb
    .from("api_keys")
    .select("*")
    .eq("key_hash", hash)
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (error || !data) return { ok: false, status: 401, error: "Invalid or inactive API key" };
  // touch last_used
  await adminDb.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return { ok: true, key: data };
}

export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
  });
}
