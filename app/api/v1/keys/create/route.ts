import { generateApiKey, adminDb, json, corsPreflight } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsPreflight();
}

/** Create API key — public for portal + school site (stores SHA-256 hash only) */
export async function POST(req: Request) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" }, 400);
    }

    const name = String(body.name || "My Key").slice(0, 80);
    const owner_email = String(body.email || body.owner_email || "")
      .toLowerCase()
      .slice(0, 120);
    const owner_name = String(body.owner_name || body.name || "User").slice(0, 80);
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
    if (error) {
      return json(
        {
          success: false,
          error: error.message,
          hint: "Supabase api_keys insert failed — check RLS policies",
        },
        500
      );
    }

    // Raw key only once
    return json(
      {
        success: true,
        message: "Save this key now — it will not be shown again",
        api_key: gen.raw,
        key: gen.raw,
        apiKey: gen.raw,
        key_id: gen.id,
        id: gen.id,
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
        portal: "https://mggems-api-portal.vercel.app",
      },
      201
    );
  } catch (e) {
    return json({ success: false, error: String(e) }, 500);
  }
}
