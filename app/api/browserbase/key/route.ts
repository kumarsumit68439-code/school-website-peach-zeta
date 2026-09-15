import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sb() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://tztzvvefkvkxsvcnucui.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dHp2dmVma3ZreHN2Y251Y3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDA3MTcsImV4cCI6MjEwNDg3NjcxN30.DrkzoItEwCokAXVFWcOGdkx94hBw5gtGXWhsCCF9jBw";
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Check if key is saved in Supabase (masked) */
export async function GET() {
  try {
    const { data } = await sb()
      .from("site_secrets")
      .select("browserbase_api_key, browserbase_project_id, updated_at")
      .eq("id", "main")
      .maybeSingle();
    const raw = data?.browserbase_api_key || "";
    const masked =
      raw.length > 8 ? raw.slice(0, 4) + "••••" + raw.slice(-4) : raw ? "••••" : "";
    return Response.json({
      success: true,
      hasKey: Boolean(raw),
      masked,
      projectId: data?.browserbase_project_id || "",
      updated_at: data?.updated_at || null,
      source: "supabase",
    });
  } catch (e) {
    return Response.json({ success: false, hasKey: false, error: String(e) });
  }
}

/** Save Browserbase key into Supabase */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = String(body.apiKey || body.browserbase_api_key || "").trim();
    const projectId = String(body.projectId || body.browserbase_project_id || "").trim();

    if (!apiKey || apiKey.length < 10) {
      return Response.json({
        success: false,
        error: "Valid Browserbase API key chahiye",
      });
    }

    const { error } = await sb().from("site_secrets").upsert({
      id: "main",
      browserbase_api_key: apiKey,
      browserbase_project_id: projectId || null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return Response.json({ success: false, error: error.message });
    }

    return Response.json({
      success: true,
      message: "API key Supabase me save ho gayi",
      hasKey: true,
      source: "supabase",
    });
  } catch (e) {
    return Response.json({ success: false, error: String(e) });
  }
}
