import { generateApiKey, adminDb, json } from "@/lib/apiAuth";

export async function OPTIONS() {
  return json({ ok: true });
}

/** Create API key — public for school portal (stores hash only) */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body.name || "My Key").toString().slice(0, 80);
    const owner_email = (body.email || "").toString().toLowerCase().slice(0, 120);
    const owner_name = (body.owner_name || body.name || "User").toString().slice(0, 80);
    const scopes = Array.isArray(body.scopes) ? body.scopes : ["read", "write"];

    const gen = generateApiKey();
    const row = {
      id: gen.id,
      name,
      key_hash: gen.hash,
      key_prefix: gen.prefix,
      owner_email: owner_email || null,
      owner_name,
      scopes,
      active: true,
    };
    const { error } = await adminDb.from("api_keys").insert(row);
    if (error) return json({ success: false, error: error.message }, 500);

    return json({
      success: true,
      message: "Save this key now — it will not be shown again",
      api_key: gen.raw,
      key_id: gen.id,
      prefix: gen.prefix,
      name,
      scopes,
      usage: {
        header: "Authorization: Bearer " + gen.raw,
        verify: "/api/v1/auth/verify",
        notices: "/api/v1/notices",
        admissions: "/api/v1/admissions",
        attendance: "/api/v1/attendance",
      },
      backends: ["supabase", "firebase"],
    }, 201);
  } catch {
    return json({ success: false, error: "Invalid JSON" }, 400);
  }
}
