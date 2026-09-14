import { verifyApiKey, json, adminDb } from "@/lib/apiAuth";

export async function OPTIONS() {
  return json({ ok: true });
}

export async function GET(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.ok) return json({ success: false, error: auth.error }, auth.status);
  const { data, error } = await adminDb
    .from("admissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return json({ success: false, error: error.message }, 500);
  return json({ success: true, count: data?.length || 0, data: data || [] });
}
