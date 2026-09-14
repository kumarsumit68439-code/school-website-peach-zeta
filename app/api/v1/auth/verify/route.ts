import { verifyApiKey, json } from "@/lib/apiAuth";

export async function OPTIONS() {
  return json({ ok: true });
}

export async function GET(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.ok) return json({ success: false, error: auth.error }, auth.status);
  return json({
    success: true,
    message: "API key valid",
    key: {
      id: auth.key.id,
      name: auth.key.name,
      prefix: auth.key.key_prefix,
      scopes: auth.key.scopes,
      owner: auth.key.owner_email,
    },
    backends: ["supabase", "firebase"],
    server_time: new Date().toISOString(),
  });
}
