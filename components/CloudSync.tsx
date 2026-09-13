"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Background sync: localStorage <-> Supabase
 * All existing pages keep using localStorage;
 * this component mirrors data to cloud so every device sees the same data.
 */

function safeParse(key: string, fallback: unknown = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function setLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

async function pullAll() {
  // Users
  {
    const { data } = await supabase.from("chat_users").select("*");
    if (data?.length) {
      setLocal(
        "schoolChatUsers",
        data.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          password: r.password || undefined,
          createdAt: r.created_at,
        }))
      );
    }
  }
  // Messages
  {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(800);
    if (data?.length) {
      setLocal(
        "schoolChatMessages",
        data.map((r) => ({
          id: r.id,
          fromId: r.from_id,
          fromName: r.from_name,
          fromRole: r.from_role,
          toId: r.to_id,
          toName: r.to_name,
          text: r.text,
          type: r.msg_type || "text",
          url: r.url,
          time: r.created_at
            ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "",
          timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
        }))
      );
    }
  }
  // Groups
  {
    const { data } = await supabase.from("chat_groups").select("*");
    if (data?.length) {
      setLocal(
        "schoolChatGroups",
        data.map((r) => ({
          id: r.id,
          name: r.name,
          createdBy: r.created_by,
          admins: r.admins || [],
          members: r.members || [],
          createdAt: r.created_at,
        }))
      );
    }
  }
  // Group messages
  {
    const { data } = await supabase
      .from("chat_group_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(800);
    if (data?.length) {
      setLocal(
        "schoolChatGroupMessages",
        data.map((r) => ({
          id: r.id,
          groupId: r.group_id,
          fromId: r.from_id,
          fromName: r.from_name,
          fromRole: r.from_role,
          text: r.text,
          type: r.msg_type || "text",
          url: r.url,
          fileName: r.file_name,
          time: r.created_at
            ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "",
          timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
        }))
      );
    }
  }
  // Locations
  {
    const { data } = await supabase.from("locations").select("*").order("updated_at", { ascending: false });
    if (data?.length) {
      setLocal(
        "schoolLocations",
        data.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          lat: r.lat,
          lng: r.lng,
          accuracy: r.accuracy,
          updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : Date.now(),
        }))
      );
    }
  }
  // Festivals
  {
    const { data } = await supabase.from("festivals").select("*").order("created_at", { ascending: false });
    if (data?.length) {
      setLocal(
        "schoolFestivals",
        data.map((r) => ({
          id: r.id,
          title: r.title,
          type: r.media_type,
          url: r.url,
          festival: r.festival,
          uploadedBy: r.uploaded_by,
          role: r.role,
          date: r.created_at?.slice?.(0, 10),
        }))
      );
    }
  }
  // Mistakes
  {
    const { data } = await supabase.from("mistakes").select("*").order("created_at", { ascending: false });
    if (data?.length) {
      setLocal(
        "schoolMistakes",
        data.map((r) => ({
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
        }))
      );
    }
  }
  // Attendance
  {
    const { data } = await supabase.from("attendance").select("*").order("created_at", { ascending: false });
    if (data?.length) {
      setLocal(
        "schoolAttendance",
        data.map((r) => ({
          id: r.id,
          name: r.student_name,
          roll: r.roll,
          className: r.class_name,
          photo: r.photo,
          period: r.period,
          status: r.status,
          markedBy: r.marked_by,
          date: r.attendance_date,
        }))
      );
    }
  }
  // Admissions
  {
    const { data } = await supabase.from("admissions").select("*").order("created_at", { ascending: false });
    if (data?.length) {
      setLocal(
        "schoolAdmissions",
        data.map((r) => ({
          id: r.id,
          studentName: r.student_name,
          className: r.class_name,
          parentName: r.parent_name,
          contact: r.contact,
          documentUrl: r.document_url,
          status: r.status,
          date: r.created_at,
        }))
      );
    }
  }
  // Notices
  {
    const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    if (data?.length) {
      setLocal(
        "schoolNotices",
        data.map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          createdBy: r.created_by,
          date: r.created_at,
        }))
      );
    }
  }
}

async function pushAll() {
  // Users
  {
    const users = safeParse("schoolChatUsers", []) as Array<Record<string, string>>;
    if (users.length) {
      await supabase.from("chat_users").upsert(
        users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role || "Student",
          password: u.password || null,
        }))
      );
    }
  }
  // Messages (last 200)
  {
    const msgs = (safeParse("schoolChatMessages", []) as Array<Record<string, string>>).slice(-200);
    if (msgs.length) {
      await supabase.from("chat_messages").upsert(
        msgs.map((m) => ({
          id: m.id,
          from_id: m.fromId,
          from_name: m.fromName,
          from_role: m.fromRole,
          to_id: m.toId,
          to_name: m.toName,
          text: m.text,
          msg_type: m.type || "text",
          url: m.url || null,
        }))
      );
    }
  }
  // Groups
  {
    const groups = safeParse("schoolChatGroups", []) as Array<Record<string, unknown>>;
    if (groups.length) {
      await supabase.from("chat_groups").upsert(
        groups.map((g) => ({
          id: g.id as string,
          name: g.name as string,
          created_by: g.createdBy as string,
          admins: (g.admins as string[]) || [],
          members: (g.members as string[]) || [],
        }))
      );
    }
  }
  // Group messages
  {
    const msgs = (safeParse("schoolChatGroupMessages", []) as Array<Record<string, string>>).slice(-200);
    if (msgs.length) {
      await supabase.from("chat_group_messages").upsert(
        msgs.map((m) => ({
          id: m.id,
          group_id: m.groupId,
          from_id: m.fromId,
          from_name: m.fromName,
          from_role: m.fromRole,
          text: m.text,
          msg_type: m.type || "text",
          url: m.url || null,
          file_name: m.fileName || null,
        }))
      );
    }
  }
  // Locations
  {
    const locs = safeParse("schoolLocations", []) as Array<Record<string, unknown>>;
    if (locs.length) {
      await supabase.from("locations").upsert(
        locs.map((l) => ({
          id: l.id as string,
          name: l.name as string,
          email: l.email as string,
          role: l.role as string,
          lat: l.lat as number,
          lng: l.lng as number,
          accuracy: (l.accuracy as number) ?? null,
          updated_at: new Date((l.updatedAt as number) || Date.now()).toISOString(),
        }))
      );
    }
  }
  // Festivals — skip huge base64 if over ~800kb
  {
    const items = safeParse("schoolFestivals", []) as Array<Record<string, string>>;
    const small = items.filter((i) => !i.url || i.url.length < 800000).slice(0, 50);
    if (small.length) {
      await supabase.from("festivals").upsert(
        small.map((i) => ({
          id: i.id,
          title: i.title,
          media_type: i.type,
          url: i.url,
          festival: i.festival,
          uploaded_by: i.uploadedBy,
          role: i.role,
        }))
      );
    }
  }
  // Mistakes
  {
    const items = safeParse("schoolMistakes", []) as Array<Record<string, string>>;
    const small = items
      .filter((i) => (!i.photo || i.photo.length < 500000) && (!i.videoUrl || i.videoUrl.length < 500000))
      .slice(0, 50);
    if (small.length) {
      await supabase.from("mistakes").upsert(
        small.map((m) => ({
          id: m.id,
          student_name: m.studentName,
          class_name: m.className,
          roll: m.roll,
          description: m.description,
          photo: m.photo || null,
          video_url: m.videoUrl || null,
          reported_by: m.reportedBy,
          role: m.role,
        }))
      );
    }
  }
  // Attendance
  {
    const items = safeParse("schoolAttendance", []) as Array<Record<string, string>>;
    const small = items.filter((i) => !i.photo || i.photo.length < 500000).slice(0, 100);
    if (small.length) {
      await supabase.from("attendance").upsert(
        small.map((r) => ({
          id: r.id,
          student_name: r.name,
          roll: r.roll,
          class_name: r.className,
          photo: r.photo || null,
          period: r.period,
          status: r.status,
          marked_by: r.markedBy,
          attendance_date: r.date,
        }))
      );
    }
  }
  // Admissions
  {
    const items = safeParse("schoolAdmissions", []) as Array<Record<string, string>>;
    if (items.length) {
      await supabase.from("admissions").upsert(
        items.slice(0, 100).map((a) => ({
          id: a.id,
          student_name: a.studentName,
          class_name: a.className,
          parent_name: a.parentName,
          contact: a.contact,
          document_url: a.documentUrl || null,
          status: a.status || "pending",
        }))
      );
    }
  }
  // Notices
  {
    const items = safeParse("schoolNotices", []) as Array<Record<string, string>>;
    if (items.length) {
      await supabase.from("notices").upsert(
        items.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          created_by: n.createdBy,
        }))
      );
    }
  }
}

export default function CloudSync() {
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (busy.current || cancelled) return;
      busy.current = true;
      try {
        await pushAll();
        if (!cancelled) await pullAll();
      } catch (e) {
        console.warn("CloudSync", e);
      } finally {
        busy.current = false;
      }
    };

    // First sync soon after load
    const t0 = setTimeout(tick, 1500);
    const interval = setInterval(tick, 8000);

    // Sync when tab becomes visible again
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      clearTimeout(t0);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
