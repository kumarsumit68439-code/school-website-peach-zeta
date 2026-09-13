/**
 * Cloud DB helpers (Supabase) with localStorage fallback.
 * When Supabase works, data is shared across all devices.
 */
import { supabase, isSupabaseConfigured } from "./supabase";

async function cloudReady() {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from("chat_users").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

// ---------- Chat users ----------
export async function upsertChatUser(user) {
  const row = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "Student",
    password: user.password || null,
  };
  if (await cloudReady()) {
    await supabase.from("chat_users").upsert(row);
  }
  const list = JSON.parse(localStorage.getItem("schoolChatUsers") || "[]");
  const next = [...list.filter((u) => u.email !== user.email), user];
  localStorage.setItem("schoolChatUsers", JSON.stringify(next));
  return user;
}

export async function listChatUsers() {
  if (await cloudReady()) {
    const { data } = await supabase.from("chat_users").select("*").order("created_at", { ascending: false });
    if (data) {
      const mapped = data.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        password: r.password || undefined,
        createdAt: r.created_at,
      }));
      localStorage.setItem("schoolChatUsers", JSON.stringify(mapped));
      return mapped;
    }
  }
  return JSON.parse(localStorage.getItem("schoolChatUsers") || "[]");
}

// ---------- Direct messages ----------
export async function insertChatMessage(msg) {
  const row = {
    id: msg.id,
    from_id: msg.fromId,
    from_name: msg.fromName,
    from_role: msg.fromRole,
    to_id: msg.toId,
    to_name: msg.toName,
    text: msg.text,
    msg_type: msg.type || "text",
    url: msg.url || null,
  };
  if (await cloudReady()) {
    await supabase.from("chat_messages").upsert(row);
  }
  const list = JSON.parse(localStorage.getItem("schoolChatMessages") || "[]");
  localStorage.setItem("schoolChatMessages", JSON.stringify([...list, msg]));
  return msg;
}

export async function listChatMessages() {
  if (await cloudReady()) {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(500);
    if (data) {
      const mapped = data.map((r) => ({
        id: r.id,
        fromId: r.from_id,
        fromName: r.from_name,
        fromRole: r.from_role,
        toId: r.to_id,
        toName: r.to_name,
        text: r.text,
        type: r.msg_type,
        url: r.url,
        time: r.created_at
          ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
        timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      }));
      localStorage.setItem("schoolChatMessages", JSON.stringify(mapped));
      return mapped;
    }
  }
  return JSON.parse(localStorage.getItem("schoolChatMessages") || "[]");
}

// ---------- Groups ----------
export async function upsertGroup(g) {
  const row = {
    id: g.id,
    name: g.name,
    created_by: g.createdBy,
    admins: g.admins || [],
    members: g.members || [],
  };
  if (await cloudReady()) {
    await supabase.from("chat_groups").upsert(row);
  }
  const list = JSON.parse(localStorage.getItem("schoolChatGroups") || "[]");
  const next = [...list.filter((x) => x.id !== g.id), g];
  localStorage.setItem("schoolChatGroups", JSON.stringify(next));
  return g;
}

export async function listGroups() {
  if (await cloudReady()) {
    const { data } = await supabase.from("chat_groups").select("*");
    if (data) {
      const mapped = data.map((r) => ({
        id: r.id,
        name: r.name,
        createdBy: r.created_by,
        admins: r.admins || [],
        members: r.members || [],
        createdAt: r.created_at,
      }));
      localStorage.setItem("schoolChatGroups", JSON.stringify(mapped));
      return mapped;
    }
  }
  return JSON.parse(localStorage.getItem("schoolChatGroups") || "[]");
}

export async function deleteGroupCloud(id) {
  if (await cloudReady()) {
    await supabase.from("chat_groups").delete().eq("id", id);
    await supabase.from("chat_group_messages").delete().eq("group_id", id);
  }
}

export async function insertGroupMessage(msg) {
  const row = {
    id: msg.id,
    group_id: msg.groupId,
    from_id: msg.fromId,
    from_name: msg.fromName,
    from_role: msg.fromRole,
    text: msg.text,
    msg_type: msg.type || "text",
    url: msg.url || null,
    file_name: msg.fileName || null,
  };
  if (await cloudReady()) {
    await supabase.from("chat_group_messages").upsert(row);
  }
  const list = JSON.parse(localStorage.getItem("schoolChatGroupMessages") || "[]");
  localStorage.setItem("schoolChatGroupMessages", JSON.stringify([...list, msg]));
  return msg;
}

export async function listGroupMessages() {
  if (await cloudReady()) {
    const { data } = await supabase
      .from("chat_group_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(500);
    if (data) {
      const mapped = data.map((r) => ({
        id: r.id,
        groupId: r.group_id,
        fromId: r.from_id,
        fromName: r.from_name,
        fromRole: r.from_role,
        text: r.text,
        type: r.msg_type,
        url: r.url,
        fileName: r.file_name,
        time: r.created_at
          ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
        timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      }));
      localStorage.setItem("schoolChatGroupMessages", JSON.stringify(mapped));
      return mapped;
    }
  }
  return JSON.parse(localStorage.getItem("schoolChatGroupMessages") || "[]");
}

// ---------- Locations ----------
export async function upsertLocation(loc) {
  const row = {
    id: loc.id,
    name: loc.name,
    email: loc.email,
    role: loc.role,
    lat: loc.lat,
    lng: loc.lng,
    accuracy: loc.accuracy ?? null,
    updated_at: new Date().toISOString(),
  };
  if (await cloudReady()) {
    await supabase.from("locations").upsert(row);
  }
  const list = JSON.parse(localStorage.getItem("schoolLocations") || "[]");
  const next = [...list.filter((x) => x.email !== loc.email), { ...loc, updatedAt: Date.now() }];
  localStorage.setItem("schoolLocations", JSON.stringify(next));
  return loc;
}

export async function listLocations() {
  if (await cloudReady()) {
    const { data } = await supabase.from("locations").select("*").order("updated_at", { ascending: false });
    if (data) {
      const mapped = data.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        lat: r.lat,
        lng: r.lng,
        accuracy: r.accuracy,
        updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
      }));
      localStorage.setItem("schoolLocations", JSON.stringify(mapped));
      return mapped;
    }
  }
  return JSON.parse(localStorage.getItem("schoolLocations") || "[]");
}

// ---------- Festivals / mistakes / attendance (generic) ----------
export async function insertFestival(item) {
  const row = {
    id: item.id,
    title: item.title,
    media_type: item.type,
    url: item.url,
    festival: item.festival,
    uploaded_by: item.uploadedBy,
    role: item.role,
  };
  if (await cloudReady()) await supabase.from("festivals").upsert(row);
  const list = JSON.parse(localStorage.getItem("schoolFestivals") || "[]");
  localStorage.setItem("schoolFestivals", JSON.stringify([item, ...list]));
}

export async function listFestivals() {
  if (await cloudReady()) {
    const { data } = await supabase.from("festivals").select("*").order("created_at", { ascending: false });
    if (data) {
      const mapped = data.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.media_type,
        url: r.url,
        festival: r.festival,
        uploadedBy: r.uploaded_by,
        role: r.role,
        date: r.created_at?.slice?.(0, 10),
      }));
      localStorage.setItem("schoolFestivals", JSON.stringify(mapped));
      return mapped;
    }
  }
  return JSON.parse(localStorage.getItem("schoolFestivals") || "[]");
}

export async function insertMistake(m) {
  const row = {
    id: m.id,
    student_name: m.studentName,
    class_name: m.className,
    roll: m.roll,
    description: m.description,
    photo: m.photo || null,
    video_url: m.videoUrl || null,
    reported_by: m.reportedBy,
    role: m.role,
  };
  if (await cloudReady()) await supabase.from("mistakes").upsert(row);
  const list = JSON.parse(localStorage.getItem("schoolMistakes") || "[]");
  localStorage.setItem("schoolMistakes", JSON.stringify([m, ...list]));
}

export async function listMistakes() {
  if (await cloudReady()) {
    const { data } = await supabase.from("mistakes").select("*").order("created_at", { ascending: false });
    if (data) {
      const mapped = data.map((r) => ({
        id: r.id,
        studentName: r.student_name,
        className: r.class_name,
        roll: r.roll,
        description: r.description,
        photo: r.photo,
        videoUrl: r.video_url,
        reportedBy: r.reported_by,
        role: r.role,
        date: r.created_at?.slice?.(0, 10),
      }));
      localStorage.setItem("schoolMistakes", JSON.stringify(mapped));
      return mapped;
    }
  }
  return JSON.parse(localStorage.getItem("schoolMistakes") || "[]");
}

export async function insertAttendance(r) {
  const row = {
    id: r.id,
    student_name: r.name,
    roll: r.roll,
    class_name: r.className,
    photo: r.photo || null,
    period: r.period,
    status: r.status,
    marked_by: r.markedBy,
    attendance_date: r.date,
  };
  if (await cloudReady()) await supabase.from("attendance").upsert(row);
  const list = JSON.parse(localStorage.getItem("schoolAttendance") || "[]");
  localStorage.setItem("schoolAttendance", JSON.stringify([r, ...list]));
}

export async function listAttendance() {
  if (await cloudReady()) {
    const { data } = await supabase.from("attendance").select("*").order("created_at", { ascending: false });
    if (data) {
      const mapped = data.map((r) => ({
        id: r.id,
        name: r.student_name,
        roll: r.roll,
        className: r.class_name,
        photo: r.photo,
        period: r.period,
        status: r.status,
        markedBy: r.marked_by,
        date: r.attendance_date,
      }));
      localStorage.setItem("schoolAttendance", JSON.stringify(mapped));
      return mapped;
    }
  }
  return JSON.parse(localStorage.getItem("schoolAttendance") || "[]");
}
