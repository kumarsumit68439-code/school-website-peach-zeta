import { verifyApiKey, json, adminDb } from "@/lib/apiAuth";

export async function OPTIONS() {
  return json({ ok: true });
}

/** Full school data dump for authorized API key (no user login needed) */
export async function GET(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.ok) return json({ success: false, error: auth.error }, auth.status);

  const url = new URL(req.url);
  const resource = url.searchParams.get("resource") || "all";

  try {
    if (resource === "all") {
      const [notices, admissions, attendance, festivals, mistakes, locations, users] =
        await Promise.all([
          adminDb.from("notices").select("*").order("created_at", { ascending: false }).limit(100),
          adminDb.from("admissions").select("*").order("created_at", { ascending: false }).limit(100),
          adminDb.from("attendance").select("*").order("created_at", { ascending: false }).limit(100),
          adminDb.from("festivals").select("*").order("created_at", { ascending: false }).limit(50),
          adminDb.from("mistakes").select("*").order("created_at", { ascending: false }).limit(50),
          adminDb.from("locations").select("*").order("updated_at", { ascending: false }).limit(100),
          adminDb.from("chat_users").select("id,name,email,role,created_at").limit(200),
        ]);

      return json({
        success: true,
        source: "supabase",
        backends: ["supabase", "firebase"],
        key: { id: auth.key.id, name: auth.key.name, prefix: auth.key.key_prefix },
        data: {
          notices: notices.data || [],
          admissions: admissions.data || [],
          attendance: attendance.data || [],
          festivals: festivals.data || [],
          mistakes: mistakes.data || [],
          locations: locations.data || [],
          students: users.data || [],
        },
        counts: {
          notices: notices.data?.length || 0,
          admissions: admissions.data?.length || 0,
          attendance: attendance.data?.length || 0,
          festivals: festivals.data?.length || 0,
          mistakes: mistakes.data?.length || 0,
          locations: locations.data?.length || 0,
          students: users.data?.length || 0,
        },
        server_time: new Date().toISOString(),
      });
    }

    const tableMap: Record<string, string> = {
      notices: "notices",
      admissions: "admissions",
      attendance: "attendance",
      festivals: "festivals",
      mistakes: "mistakes",
      locations: "locations",
      students: "chat_users",
      users: "chat_users",
      docs: "staff_docs",
    };
    const table = tableMap[resource];
    if (!table) {
      return json(
        {
          success: false,
          error: "Unknown resource",
          allowed: Object.keys(tableMap).concat(["all"]),
        },
        400
      );
    }

    let q = adminDb.from(table).select("*").limit(200);
    if (table === "chat_users") {
      q = adminDb.from(table).select("id,name,email,role,created_at").limit(200);
    }
    const { data, error } = await q;
    if (error) return json({ success: false, error: error.message }, 500);
    return json({
      success: true,
      resource,
      count: data?.length || 0,
      data: data || [],
      server_time: new Date().toISOString(),
    });
  } catch (e) {
    return json({ success: false, error: String(e) }, 500);
  }
}
