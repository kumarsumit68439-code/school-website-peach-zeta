"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StorageSelector from "@/components/StorageSelector";

type MediaItem = {
  id: string;
  title: string;
  type: "photo" | "video";
  url: string;
  festival: string;
  uploadedBy: string;
  role: string;
  date: string;
};

const STORAGE = "schoolFestivals";

export default function FestivalUploadPage() {
  const [role, setRole] = useState<"Teacher" | "Principal" | "Student">("Teacher");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [festival, setFestival] = useState("Independence Day");
  const [type, setType] = useState<"photo" | "video">("photo");
  const [url, setUrl] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem(STORAGE) || "[]"));
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !title.trim()) return;
    const finalUrl = type === "video" && videoLink.trim() ? videoLink.trim() : url;
    if (!finalUrl) {
      alert("Please upload a file or paste a video link");
      return;
    }
    const item: MediaItem = {
      id: Date.now().toString(),
      title: title.trim(),
      type,
      url: finalUrl,
      festival,
      uploadedBy: name.trim(),
      role,
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = [item, ...items];
    setItems(updated);
    localStorage.setItem(STORAGE, JSON.stringify(updated));
    setTitle("");
    setUrl("");
    setVideoLink("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const remove = (id: string) => {
    if (!confirm("Delete this media?")) return;
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    localStorage.setItem(STORAGE, JSON.stringify(updated));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Upload Festival Media</h1>
          <p className="text-sm text-slate-500">Photos & videos — Teacher / Principal / Student</p>
        </div>
        <Link href="/festivals" className="text-sm text-navy-600 underline">← View Gallery</Link>
      </div>

      <StorageSelector />

      <div className="flex gap-2 mb-6">
        {(["Teacher", "Principal", "Student"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              role === r ? "bg-navy-800 text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="card space-y-4 mb-8">
        <div>
          <label className="label">Your Name *</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Uploader name" />
        </div>
        <div>
          <label className="label">Title *</label>
          <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Flag Hoisting" />
        </div>
        <div>
          <label className="label">Festival / Event *</label>
          <select className="input" value={festival} onChange={(e) => setFestival(e.target.value)}>
            {["Independence Day", "Republic Day", "Holi", "Diwali", "Annual Day", "Sports Day", "Teachers Day", "Children Day", "Other"].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Type *</label>
          <div className="flex gap-2">
            {(["photo", "video"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border capitalize ${
                  type === t ? "bg-navy-800 text-white border-navy-800" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {t === "photo" ? "📷 Photo" : "🎬 Video"}
              </button>
            ))}
          </div>
        </div>
        {type === "photo" ? (
          <div>
            <label className="label">Upload Photo *</label>
            <input type="file" accept="image/*" className="input" onChange={handleFile} />
            {url && <img src={url} alt="Preview" className="mt-2 h-24 rounded-lg object-cover" />}
          </div>
        ) : (
          <>
            <div>
              <label className="label">Video file (optional)</label>
              <input type="file" accept="video/*" className="input" onChange={handleFile} />
            </div>
            <div>
              <label className="label">OR YouTube / Video Link</label>
              <input className="input" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </div>
          </>
        )}
        <button type="submit" className="btn btn-primary w-full py-3">Upload</button>
        {saved && <p className="text-center text-green-600 text-sm font-medium">✅ Uploaded!</p>}
      </form>

      <div className="card">
        <h2 className="font-bold text-navy-900 mb-4">Your recent uploads ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No media yet.</p>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 10).map((i) => (
              <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-sm">
                <div>
                  <span className="font-medium text-navy-900">{i.title}</span>
                  <span className="text-slate-400 mx-1">·</span>
                  <span className="text-slate-500">{i.type} · {i.festival}</span>
                </div>
                <button onClick={() => remove(i.id)} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
