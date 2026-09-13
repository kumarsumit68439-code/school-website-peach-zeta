"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type MediaItem = {
  id: string;
  title: string;
  type: "photo" | "video";
  url: string; // data URL for photo or video link
  festival: string;
  uploadedBy: string;
  role: string;
  date: string;
};

const STORAGE = "schoolFestivals";

export default function FestivalsPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<"all" | "photo" | "video">("all");
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem(STORAGE) || "[]"));
  }, []);

  const filtered =
    filter === "all" ? items : items.filter((i) => i.type === filter);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">🎉 School Festivals</h1>
          <p className="text-sm text-slate-500">Photos & videos from school events</p>
        </div>
        <Link href="/festivals/upload" className="btn btn-primary text-sm">
          + Upload Media
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {(["all", "photo", "video"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize ${
              filter === f ? "bg-navy-800 text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {f === "all" ? "All" : f === "photo" ? "📷 Photos" : "🎬 Videos"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">🎊</div>
          <p>No festival media yet.</p>
          <p className="text-xs mt-1">Teachers / Principal can upload from Upload page.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="card p-0 overflow-hidden">
              {item.type === "photo" ? (
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="relative aspect-video bg-slate-900">
                  {playing === item.id ? (
                    item.url.includes("youtube") || item.url.includes("youtu.be") ? (
                      <iframe
                        className="w-full h-full"
                        src={item.url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                        allowFullScreen
                        title={item.title}
                      />
                    ) : (
                      <video src={item.url} controls autoPlay className="w-full h-full object-contain" />
                    )
                  ) : (
                    <button
                      onClick={() => setPlaying(item.id)}
                      className="absolute inset-0 flex items-center justify-center text-white text-5xl hover:bg-black/20"
                    >
                      ▶
                    </button>
                  )}
                </div>
              )}
              <div className="p-3">
                <h3 className="font-semibold text-navy-900 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.festival} · {item.date}
                </p>
                <p className="text-[10px] text-slate-400">
                  by {item.uploadedBy} ({item.role})
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
