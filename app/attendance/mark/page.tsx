"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StorageSelector from "@/components/StorageSelector";

type StudentRecord = {
  id: string;
  name: string;
  roll: string;
  className: string;
  photo: string; // data URL or empty
  period: string;
  date: string;
  status: "Present" | "Absent";
  markedBy: string;
};

const STORAGE = "schoolAttendance";

export default function MarkAttendancePage() {
  const [role, setRole] = useState<"Teacher" | "Principal">("Teacher");
  const [markerName, setMarkerName] = useState("");
  const [className, setClassName] = useState("5");
  const [period, setPeriod] = useState("1");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [status, setStatus] = useState<"Present" | "Absent">("Present");
  const [photo, setPhoto] = useState("");
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRecords(JSON.parse(localStorage.getItem(STORAGE) || "[]"));
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
    if (!name.trim() || !markerName.trim()) return;

    const rec: StudentRecord = {
      id: Date.now().toString(),
      name: name.trim(),
      roll: roll.trim() || "—",
      className,
      photo,
      period,
      date,
      status,
      markedBy: `${markerName} (${role})`,
    };

    const updated = [rec, ...records];
    setRecords(updated);
    localStorage.setItem(STORAGE, JSON.stringify(updated));
    setName("");
    setRoll("");
    setPhoto("");
    setStatus("Present");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const remove = (id: string) => {
    if (!confirm("Delete this attendance entry?")) return;
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem(STORAGE, JSON.stringify(updated));
  };

  const todayRecords = records.filter((r) => r.date === date && r.className === className);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Mark Attendance</h1>
          <p className="text-sm text-slate-500">Teachers & Principal</p>
        </div>
        <Link href="/attendance" className="text-sm text-navy-600 underline">
          ← Back
        </Link>
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
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Your Name *</label>
            <input
              className="input"
              required
              value={markerName}
              onChange={(e) => setMarkerName(e.target.value)}
              placeholder="Teacher / Principal name"
            />
          </div>
          <div>
            <label className="label">Date *</label>
            <input
              type="date"
              className="input"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Class *</label>
            <select className="input" value={className} onChange={(e) => setClassName(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                <option key={c} value={String(c)}>
                  Class {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Period *</label>
            <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                <option key={p} value={String(p)}>
                  Period {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <hr className="border-slate-100" />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Student Name *</label>
            <input
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Student full name"
            />
          </div>
          <div>
            <label className="label">Roll Number</label>
            <input
              className="input"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Status *</label>
            <div className="flex gap-2">
              {(["Present", "Absent"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${
                    status === s
                      ? s === "Present"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-red-600 text-white border-red-600"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Student Photo</label>
            <input type="file" accept="image/*" className="input" onChange={handlePhoto} />
            {photo && (
              <img
                src={photo}
                alt="Preview"
                className="mt-2 w-16 h-16 rounded-full object-cover border-2 border-navy-200"
              />
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full py-3">
          Save Attendance
        </button>
        {saved && (
          <p className="text-center text-green-600 text-sm font-medium">✅ Saved!</p>
        )}
      </form>

      <div className="card">
        <h2 className="font-bold text-navy-900 mb-4">
          Today&apos;s entries — Class {className} ({todayRecords.length})
        </h2>
        {todayRecords.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No entries for this class/date yet.</p>
        ) : (
          <div className="space-y-3">
            {todayRecords.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
              >
                {r.photo ? (
                  <img
                    src={r.photo}
                    alt={r.name}
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold">
                    {r.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy-900 text-sm">{r.name}</div>
                  <div className="text-xs text-slate-500">
                    Roll: {r.roll} · Period {r.period} · {r.markedBy}
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    r.status === "Present"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {r.status}
                </span>
                <button
                  onClick={() => remove(r.id)}
                  className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
