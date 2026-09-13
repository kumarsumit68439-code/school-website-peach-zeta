"use client";

import { useState, useEffect } from "react";

type Mode = "local" | "cloud";

export default function StorageSelector() {
  const [mode, setMode] = useState<Mode>("local");

  useEffect(() => {
    const saved = localStorage.getItem("storageMode") as Mode | null;
    if (saved === "local" || saved === "cloud") setMode(saved);
  }, []);

  const change = (m: Mode) => {
    setMode(m);
    localStorage.setItem("storageMode", m);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-100 rounded-lg px-4 py-2.5 mb-5">
      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        Data Storage
      </span>
      <div className="flex rounded-lg overflow-hidden border border-slate-200">
        <button
          onClick={() => change("local")}
          className={`px-3 py-1.5 text-xs font-medium transition ${
            mode === "local"
              ? "bg-navy-800 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Local Storage
        </button>
        <button
          onClick={() => change("cloud")}
          className={`px-3 py-1.5 text-xs font-medium transition ${
            mode === "cloud"
              ? "bg-navy-800 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
          title="Cloud database coming soon"
        >
          Cloud Database
        </button>
      </div>
      {mode === "cloud" && (
        <span className="text-xs text-amber-600 font-medium">
          (Cloud mode is simulated – data still uses Local Storage)
        </span>
      )}
    </div>
  );
}
