"use client";

import { useEffect, useState } from "react";

export default function DataPersistBanner() {
  const [mode, setMode] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url =
          process.env.NEXT_PUBLIC_SUPABASE_URL ||
          "https://tztzvvefkvkxsvcnucui.supabase.co";
        const key =
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dHp2dmVma3ZreHN2Y251Y3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMDA3MTcsImV4cCI6MjEwNDg3NjcxN30.DrkzoItEwCokAXVFWcOGdkx94hBw5gtGXWhsCCF9jBw";
        const res = await fetch(`${url}/rest/v1/chat_users?select=id&limit=1`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        });
        if (!cancelled) setMode(res.ok ? "cloud" : "local");
      } catch {
        if (!cancelled) setMode("local");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (mode === "checking") return null;

  if (mode === "cloud") {
    return (
      <div className="bg-green-50 text-green-800 text-[11px] text-center px-3 py-1 border-b border-green-100">
        ☁️ Cloud database connected (Supabase) — data sab devices pe share hoga + refresh ke baad bhi save
      </div>
    );
  }

  return (
    <div className="bg-amber-50 text-amber-800 text-[11px] text-center px-3 py-1 border-b border-amber-100">
      💾 Local mode — isi browser pe save. Cloud ke liye Supabase env check karo.
    </div>
  );
}
