/**
 * Central localStorage helpers — data survives page refresh on same browser.
 * Keys used across the school site.
 */

export const KEYS = {
  chatUsers: "schoolChatUsers",
  chatMessages: "schoolChatMessages",
  chatMe: "schoolChatMe",
  chatGroups: "schoolChatGroups",
  chatGroupMessages: "schoolChatGroupMessages",
  chatOnline: "schoolChatOnline",
  festivals: "schoolFestivals",
  mistakes: "schoolMistakes",
  attendance: "schoolAttendance",
  locations: "schoolLocations",
  admissions: "schoolAdmissions",
  notices: "schoolNotices",
  storageMode: "schoolStorageMode",
};

export function loadJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === "") return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // Quota exceeded (large photos/videos) — try without heavy fields
    console.warn("localStorage save failed", key, e);
    try {
      alert("Storage full — kuch purani photos/videos hatao, phir try karo.");
    } catch {}
    return false;
  }
}

/** Quick check used on home/dashboard */
export function getStorageSummary() {
  if (typeof window === "undefined") return {};
  return {
    users: loadJSON(KEYS.chatUsers, []).length,
    messages: loadJSON(KEYS.chatMessages, []).length,
    groups: loadJSON(KEYS.chatGroups, []).length,
    festivals: loadJSON(KEYS.festivals, []).length,
    mistakes: loadJSON(KEYS.mistakes, []).length,
    attendance: loadJSON(KEYS.attendance, []).length,
    locations: loadJSON(KEYS.locations, []).length,
    admissions: loadJSON(KEYS.admissions, []).length,
  };
}
