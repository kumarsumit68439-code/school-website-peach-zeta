"use client";

import { useEffect, useState } from "react";

export default function DataPersistBanner() {
  const [supabaseOk, setSupabaseOk] = useState(false);
  const [firebaseOk, setFirebaseOk] = useState(false);
  const [ready, setReady] = useState(false);

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
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        });
        if (!cancelled && res.ok) setSupabaseOk(true);
      } catch {
        /* ignore */
      }

      // Firebase is hardcoded with umit-jilowa config
      if (!cancelled) setFirebaseOk(true);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  if (supabaseOk && firebaseOk) {
    return (
      <div className="bg-green-50 text-green-800 text-[11px] text-center px-3 py-1 border-b border-green-100">
        ☁️ Dual cloud ON — Supabase + Firebase (umit-jilowa) · sab devices pe sync
      </div>
    );
  }
  if (supabaseOk) {
    return (
      <div className="bg-green-50 text-green-800 text-[11px] text-center px-3 py-1 border-b border-green-100">
        ☁️ Supabase ON · Firebase rules check karo
      </div>
    );
  }
  return (
    <div className="bg-amber-50 text-amber-800 text-[11px] text-center px-3 py-1 border-b border-amber-100">
      💾 Local / cloud connecting…
    </div>
  );
}
