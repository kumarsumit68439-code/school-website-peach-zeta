"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StorageSelector from "@/components/StorageSelector";

type Mistake = {
  id: string;
  studentName: string;
  className: string;
  roll: string;
  description: string;
  photo: string;
  videoUrl: string;
  reportedBy: string;
  role: string;
  date: string;
};

const STORAGE = "schoolMistakes";

export default function MistakeUploadPage() {
  const [role, setRole] = useState<"Teacher" | "Principal">("Teacher");
  const [reportedBy, setReportedBy] = useState("");
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("5");
  const [roll, setRoll] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [list, setList] = useState<Mistake[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setList(JSON.parse(localStorage.getItem(STORAGE) || "[]"));
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !reportedBy.trim() || !description.trim()) return;
    const m: Mistake = {
      id: Date.now().toString(),
      studentName: studentName.trim(),
      className,
      roll: roll.trim() || "—",
      description: description.trim(),
      photo,
      videoUrl: videoUrl.trim(),
      reportedBy: reportedBy.trim(),
      role,
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = [m, ...list];
    setList(updated);
    localStorage.setItem(STORAGE, JSON.stringify(updated));
    setStudentName("");
    setRoll("");
    setDescription("");
    setPhoto("");
    setVideoUrl("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const remove = (id: string) => {
    if (!confirm("Delete this record?")) return;
    const updated = list.filter((m) => m.id !== id);
    setList(updated);
    localStorage.setItem(STORAGE, JSON.stringify(updated));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Upload Student Mistake</h1>
          <p className="text-sm text-slate-500">Teacher / Principal only</p>
        </div>
        <Link href="/mistakes/check" className="text-sm text-navy-600 underline">Check page →</Link>
      </div>

      <StorageSelector />

      <div className="flex gap-2 mb-6">
        {(["Teacher", "Principal"] as const).map((r) => (
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
          <label className="label">Your Name (Reporter) *</label>
          <input className="input" required value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="label">Student Name *</label>
            <input className="input" required value={studentName} onChange={(e) => setStudentName(e.target.value)} />
          </div>
          <div>
            <label className="label">Class *</label>
            <select className="input" value={className} onChange={(e) => setClassName(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                <option key={c} value={String(c)}>Class {c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Roll Number</label>
            <input className="input" value={roll} onChange={(e) => setRoll(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Mistake Description *</label>
          <textarea
            className="input"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened..."
          />
        </div>
        <div>
          <label className="label">Photo (optional)</label>
          <input type="file" accept="image/*" className="input" onChange={handlePhoto} />
          {photo && <img src={photo} alt="Evidence" className="mt-2 h-24 rounded-lg object-cover" />}
        </div>
        <div>
          <label className="label">Video link (optional)</label>
          <input
            className="input"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="YouTube / video URL"
          />
        </div>
        <button type="submit" className="btn btn-primary w-full py-3">Submit Record</button>
        {saved && <p className="text-center text-green-600 text-sm font-medium">✅ Saved!</p>}
      </form>

      <div className="card">
        <h2 className="font-bold text-navy-900 mb-4">Recent records ({list.length})</h2>
        {list.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No records yet.</p>
        ) : (
          <div className="space-y-2">
            {list.slice(0, 8).map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-sm">
                <div>
                  <span className="font-medium text-navy-900">{m.studentName}</span>
                  <span className="text-slate-400 mx-1">·</span>
                  <span className="text-slate-500">Class {m.className} · Roll {m.roll}</span>
                  <div className="text-[10px] text-slate-400">{m.date} · by {m.reportedBy}</div>
                </div>
                <button onClick={() => remove(m.id)} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
