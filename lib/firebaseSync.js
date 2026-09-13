/**
 * Firebase Firestore push/pull for school portal collections.
 * Document shape: { items: [...] } under collection school_data / doc <key>
 */
import { isFirebaseConfigured, firestore } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

const COLLECTION = "school_data";

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

/** Strip huge base64 to avoid Firestore 1MB doc limit */
function trimItems(items, maxUrl = 400000) {
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
    .slice(0, 150);
}

export async function firebasePushAll() {
  if (!isFirebaseConfigured || !firestore) return false;
  try {
    for (const [localKey, docId] of Object.entries(KEY_MAP)) {
      const items = trimItems(safeParse(localKey, []));
      if (!items.length) continue;
      await setDoc(
        doc(firestore, COLLECTION, docId),
        {
          items,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }
    return true;
  } catch (e) {
    console.warn("Firebase push", e);
    return false;
  }
}

export async function firebasePullAll() {
  if (!isFirebaseConfigured || !firestore) return false;
  try {
    for (const [localKey, docId] of Object.entries(KEY_MAP)) {
      const snap = await getDoc(doc(firestore, COLLECTION, docId));
      if (!snap.exists()) continue;
      const data = snap.data();
      if (Array.isArray(data?.items) && data.items.length) {
        // Merge with local by id when possible
        const local = safeParse(localKey, []);
        const map = new Map();
        [...local, ...data.items].forEach((x) => {
          if (x && x.id) map.set(String(x.id), x);
          else if (x && x.email) map.set(String(x.email).toLowerCase(), x);
        });
        setLocal(localKey, Array.from(map.values()));
      }
    }
    return true;
  } catch (e) {
    console.warn("Firebase pull", e);
    return false;
  }
}

export async function checkFirebase() {
  if (!isFirebaseConfigured || !firestore) return false;
  try {
    await getDoc(doc(firestore, COLLECTION, "_ping"));
    return true;
  } catch {
    return false;
  }
}
