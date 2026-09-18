import { verifyApiKey, json, adminDb, corsPreflight } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.ok) return json({ success: false, error: auth.error }, auth.status);
  const { data, error } = await adminDb
    .from("admissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return json({ success: false, error: error.message, data: [] }, 500);
  return json({ success: true, count: data?.length || 0, data: data || [] });
}
