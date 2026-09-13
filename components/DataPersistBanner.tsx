"use client";

import { useEffect, useState } from "react";

export default function DataPersistBanner() {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    try {
      const t = "_school_persist_test_";
      localStorage.setItem(t, "1");
      const v = localStorage.getItem(t);
      localStorage.removeItem(t);
      setOk(v === "1");
    } catch {
      setOk(false);
    }
  }, []);

  if (!ok) {
    return (
      <div className="bg-amber-50 text-amber-800 text-xs text-center px-3 py-1.5 border-b border-amber-100">
        ⚠️ Browser storage band hai — data refresh ke baad save nahi hoga (Incognito / blocked).
      </div>
    );
  }

  return (
    <div className="bg-green-50 text-green-800 text-[11px] text-center px-3 py-1 border-b border-green-100">
      💾 Data is browser me save hota hai — refresh ke baad bhi uploads, messages, attendance, location safe rehte hain (isi device / browser pe).
    </div>
  );
}
