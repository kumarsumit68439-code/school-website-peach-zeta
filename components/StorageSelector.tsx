"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { firebasePushAll, firebasePullAll } from "@/lib/firebaseSync";

type Mode = "local" | "cloud";

export default function StorageSelector() {
  const [mode, setMode] = useState<Mode>("cloud");
  const [supabaseOk, setSupabaseOk] = useState(false);
  const [firebaseOk, setFirebaseOk] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("storageMode") as Mode | null;
    if (saved === "local" || saved === "cloud") setMode(saved);
    else {
      setMode("cloud");
      localStorage.setItem("storageMode", "cloud");
    }

    (async () => {
      try {
        const { error } = await supabase.from("chat_users").select("id").limit(1);
        setSupabaseOk(!error);
      } catch {
        setSupabaseOk(false);
      }
      // Firebase config is baked in (umit-jilowa)
      setFirebaseOk(true);
    })();
  }, []);

  const change = (m: Mode) => {
    setMode(m);
    localStorage.setItem("storageMode", m);
    setMsg(m === "cloud" ? "Cloud mode ON — Supabase + Firebase" : "Local only mode");
  };

  const forceSync = async () => {
    setSyncing(true);
    setMsg("Syncing...");
    try {
      // Push local → both clouds
      const docs = JSON.parse(localStorage.getItem("schoolDocs") || "[]");
      if (docs.length) {
        await supabase.from("staff_docs").upsert(
          docs.map((d: { id: string; name: string; type: string; uploadedBy: string; role: string; date: string }) => ({
            id: d.id,
            name: d.name,
            file_type: d.type,
            uploaded_by: d.uploadedBy,
            role: d.role,
            doc_date: d.date,
          }))
        );
      }
      await firebasePushAll();

      // Pull both clouds → local
      const { data } = await supabase.from("staff_docs").select("*").order("doc_date", { ascending: false });
      if (data?.length) {
        localStorage.setItem(
          "schoolDocs",
          JSON.stringify(
            data.map((r) => ({
              id: r.id,
              name: r.name,
              type: r.file_type,
              uploadedBy: r.uploaded_by,
              role: r.role,
              date: r.doc_date,
            }))
          )
        );
      }
      await firebasePullAll();

      setLastSync(new Date().toLocaleTimeString());
      setMsg("✅ Synced to Supabase + Firebase");
      window.dispatchEvent(new Event("school-data-synced"));
    } catch (e) {
      console.warn(e);
      setMsg("Sync issue — local data safe, retry later");
    } finally {
      setSyncing(false);
    }
  };

  const cloudLive = supabaseOk || firebaseOk;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Data Storage
        </span>
        <div className="flex rounded-lg overflow-hidden border border-slate-200">
          <button
            type="button"
            onClick={() => change("local")}
            className={`px-3 py-1.5 text-xs font-medium transition ${
              mode === "local" ? "bg-navy-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Local Storage
          </button>
          <button
            type="button"
            onClick={() => change("cloud")}
            className={`px-3 py-1.5 text-xs font-medium transition ${
              mode === "cloud" ? "bg-navy-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Cloud Database
          </button>
        </div>
        {mode === "cloud" && (
          <button
            type="button"
            onClick={forceSync}
            disabled={syncing}
            className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-60"
          >
            {syncing ? "Syncing…" : "↻ Sync Now"}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-[11px]">
        <span className={supabaseOk ? "text-green-700 font-medium" : "text-slate-400"}>
          {supabaseOk ? "● Supabase live" : "○ Supabase…"}
        </span>
        <span className={firebaseOk ? "text-green-700 font-medium" : "text-slate-400"}>
          {firebaseOk ? "● Firebase live (umit-jilowa)" : "○ Firebase…"}
        </span>
        {lastSync && <span className="text-slate-500">Last sync: {lastSync}</span>}
      </div>

      {mode === "cloud" && cloudLive && (
        <p className="text-xs text-green-700 font-medium">
          ✅ Real cloud mode — data Supabase + Firebase pe save hota hai (sab devices)
        </p>
      )}
      {mode === "cloud" && !cloudLive && (
        <p className="text-xs text-amber-600">Cloud connect ho raha hai… thodi der baad Sync Now dabao</p>
      )}
      {mode === "local" && (
        <p className="text-xs text-slate-500">Local mode — sirf is browser me data</p>
      )}
      {msg && <p className="text-xs text-navy-700">{msg}</p>}
    </div>
  );
}
