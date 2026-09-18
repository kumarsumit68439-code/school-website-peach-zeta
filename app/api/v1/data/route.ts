import { verifyApiKey, json, adminDb, corsPreflight } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsPreflight();
}

/** Full school data dump for authorized API key (portal live dashboard) */
export async function GET(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.ok) return json({ success: false, error: auth.error }, auth.status);

  const url = new URL(req.url);
  const resource = url.searchParams.get("resource") || "all";

  try {
    if (resource === "all" || resource === "dashboard") {
      const [
        notices,
        admissions,
        attendance,
        festivals,
        mistakes,
        locations,
        users,
        sessions,
        keys,
      ] = await Promise.all([
        adminDb.from("notices").select("*").order("created_at", { ascending: false }).limit(100),
        adminDb.from("admissions").select("*").order("created_at", { ascending: false }).limit(100),
        adminDb.from("attendance").select("*").order("created_at", { ascending: false }).limit(100),
        adminDb.from("festivals").select("*").order("created_at", { ascending: false }).limit(50),
        adminDb.from("mistakes").select("*").order("created_at", { ascending: false }).limit(50),
        adminDb.from("locations").select("*").order("updated_at", { ascending: false }).limit(100),
        adminDb.from("chat_users").select("id,name,email,role,created_at").limit(200),
        adminDb
          .from("student_sessions")
          .select("id,email,name,created_at,updated_at")
          .order("updated_at", { ascending: false })
          .limit(100),
        adminDb.from("api_keys").select("id,name,key_prefix,owner_email,active,created_at,last_used_at").limit(50),
      ]);

      const noticeList = notices.data || [];
      const admissionList = admissions.data || [];
      const attendanceList = attendance.data || [];
      const festivalList = festivals.data || [];
      const mistakeList = mistakes.data || [];
      const locationList = locations.data || [];
      const userList = users.data || [];
      const sessionList = sessions.data || [];
      const keyList = keys.data || [];

      // "Recently active" sessions (updated in last 24h) as logged-in proxy
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const activeSessions = sessionList.filter((s: { updated_at?: string; created_at?: string }) => {
        const t = new Date(s.updated_at || s.created_at || 0).getTime();
        return t >= dayAgo;
      });

      return json({
        success: true,
        source: "supabase",
        backends: ["supabase", "firebase"],
        realtime: true,
        key: { id: auth.key.id, name: auth.key.name, prefix: auth.key.key_prefix },
        data: {
          notices: noticeList,
          admissions: admissionList,
          attendance: attendanceList,
          festivals: festivalList,
          mistakes: mistakeList,
          locations: locationList,
          students: userList,
          users: userList,
          sessions: sessionList,
          api_keys_meta: keyList,
        },
        counts: {
          notices: noticeList.length,
          admissions: admissionList.length,
          attendance: attendanceList.length,
          festivals: festivalList.length,
          mistakes: mistakeList.length,
          locations: locationList.length,
          students: userList.length,
          users: userList.length,
          sessions: sessionList.length,
          logged_in_24h: activeSessions.length,
          api_keys: keyList.length,
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
      sessions: "student_sessions",
      docs: "staff_docs",
    };
    const table = tableMap[resource];
    if (!table) {
      return json(
        {
          success: false,
          error: "Unknown resource",
          allowed: Object.keys(tableMap).concat(["all", "dashboard"]),
        },
        400
      );
    }

    let q = adminDb.from(table).select("*").limit(200);
    if (table === "chat_users") {
      q = adminDb.from(table).select("id,name,email,role,created_at").limit(200);
    }
    if (table === "student_sessions") {
      q = adminDb
        .from(table)
        .select("id,email,name,created_at,updated_at")
        .order("updated_at", { ascending: false })
        .limit(100);
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
