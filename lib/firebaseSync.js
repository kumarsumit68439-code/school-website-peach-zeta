/**
 * Firebase Realtime Database push/pull
 * Path: school_data/{key}
 */
import { isFirebaseConfigured, rtdb } from "./firebase";
import { ref, set, get } from "firebase/database";

const KEY_MAP = {
  schoolChatUsers: "chat_users",
  schoolChatMessages: "chat_messages",
  schoolChatGroups: "chat_groups",
  schoolChatGroupMessages: "chat_group_messages",
  schoolLocations: "locations",
  schoolFestivals: "festivals",
  schoolMistakes: "mistakes",
  schoolAttendance: "attendance",
  schoolAdmissions: "admissions",
  schoolNotices: "notices",
};

function safeParse(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

function trimItems(items, maxUrl = 350000) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const copy = { ...item };
      if (typeof copy.url === "string" && copy.url.length > maxUrl) {
        copy.url = "";
        copy._truncated = true;
      }
      if (typeof copy.photo === "string" && copy.photo.length > maxUrl) {
        copy.photo = "";
        copy._truncated = true;
      }
      if (typeof copy.videoUrl === "string" && copy.videoUrl.length > maxUrl) {
        copy.videoUrl = "";
        copy._truncated = true;
      }
      return copy;
    })
    .slice(0, 120);
}

export async function firebasePushAll() {
  if (!isFirebaseConfigured || !rtdb) return false;
  try {
    for (const [localKey, pathKey] of Object.entries(KEY_MAP)) {
      const items = trimItems(safeParse(localKey, []));
      if (!items.length) continue;
      await set(ref(rtdb, `school_data/${pathKey}`), {
        items,
        updatedAt: Date.now(),
      });
    }
    return true;
  } catch (e) {
    console.warn("Firebase RTDB push", e);
    return false;
  }
}

export async function firebasePullAll() {
  if (!isFirebaseConfigured || !rtdb) return false;
  try {
    for (const [localKey, pathKey] of Object.entries(KEY_MAP)) {
      const snap = await get(ref(rtdb, `school_data/${pathKey}`));
      if (!snap.exists()) continue;
      const data = snap.val();
      if (Array.isArray(data?.items) && data.items.length) {
        const local = safeParse(localKey, []);
        const map = new Map();
        [...local, ...data.items].forEach((x) => {
          if (!x) return;
          if (x.id) map.set(String(x.id), x);
          else if (x.email) map.set(String(x.email).toLowerCase(), x);
        });
        setLocal(localKey, Array.from(map.values()));
      }
    }
    return true;
  } catch (e) {
    console.warn("Firebase RTDB pull", e);
    return false;
  }
}

export async function checkFirebase() {
  if (!isFirebaseConfigured || !rtdb) return false;
  try {
    await get(ref(rtdb, "school_data"));
    return true;
  } catch {
    return false;
  }
}
