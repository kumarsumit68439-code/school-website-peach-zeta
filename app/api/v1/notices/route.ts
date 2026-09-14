import { verifyApiKey, json, adminDb } from "@/lib/apiAuth";

export async function OPTIONS() {
  return json({ ok: true });
}

export async function GET(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.ok) return json({ success: false, error: auth.error }, auth.status);
  const { data, error } = await adminDb
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return json({ success: false, error: error.message }, 500);
  return json({ success: true, count: data?.length || 0, data: data || [] });
}

export async function POST(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.ok) return json({ success: false, error: auth.error }, auth.status);
  try {
    const body = await req.json();
    const row = {
      id: "n_" + Date.now(),
      title: body.title || "Untitled",
      body: body.body || body.content || "",
      created_by: auth.key.owner_name || auth.key.owner_email || "api",
    };
    const { data, error } = await adminDb.from("notices").upsert(row).select().single();
    if (error) return json({ success: false, error: error.message }, 500);
    return json({ success: true, data }, 201);
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400);
  }
}
