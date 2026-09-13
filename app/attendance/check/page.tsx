"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type StudentRecord = {
  id: string;
  name: string;
  roll: string;
  className: string;
  photo: string;
  period: string;
  date: string;
  status: "Present" | "Absent";
  markedBy: string;
};

const STORAGE = "schoolAttendance";

export default function CheckAttendancePage() {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = () => setRecords(JSON.parse(localStorage.getItem(STORAGE) || "[]"));
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const q = query.trim().toLowerCase();
  const matched = showAll
    ? records
    : searched
    ? records.filter(
        (r) => r.name.toLowerCase().includes(q) || r.roll.toLowerCase().includes(q)
      )
    : [];

  const studentMap = new Map<
    string,
    {
      name: string;
      roll: string;
      className: string;
      photo: string;
      present: number;
      absent: number;
      total: number;
      periods: StudentRecord[];
    }
  >();

  matched.forEach((r) => {
    const key = `${r.name.toLowerCase()}|${r.roll}`;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        name: r.name,
        roll: r.roll,
        className: r.className,
        photo: r.photo,
        present: 0,
        absent: 0,
        total: 0,
        periods: [],
      });
    }
    const s = studentMap.get(key)!;
    s.total += 1;
    if (r.status === "Present") s.present += 1;
    else s.absent += 1;
    if (r.photo && !s.photo) s.photo = r.photo;
    s.periods.push(r);
  });

  const students = Array.from(studentMap.values()).map((s) => ({
    ...s,
    periods: s.periods.sort(
      (a, b) => b.date.localeCompare(a.date) || Number(b.period) - Number(a.period)
    ),
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Check Attendance</h1>
          <p className="text-sm text-slate-500">Visible to everyone — periods completed</p>
        </div>
        <Link href="/attendance" className="text-sm text-navy-600 underline">← Back</Link>
      </div>
      <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-6">
        ✅ Public — Students, Parents, Teachers sab bina login check kar sakte hain.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setShowAll(false);
          setSearched(true);
        }}
        className="card mb-4 space-y-3"
      >
        <label className="label">Student Name or Roll Number</label>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearched(false);
              setShowAll(false);
            }}
            placeholder="e.g. Rahul Sharma or 12"
          />
          <button type="submit" className="btn btn-primary px-6">Search</button>
        </div>
      </form>

      <button
        onClick={() => {
          setShowAll(true);
          setSearched(false);
        }}
        className="btn btn-outline w-full mb-6 text-sm"
      >
        Show all attendance ({records.length} entries)
      </button>

      {searched && students.length === 0 && !showAll && (
        <div className="card text-center py-10 text-slate-500">
          No attendance found for &quot;{query}&quot;.
        </div>
      )}

      {students.map((s) => (
        <div key={`${s.name}-${s.roll}`} className="card mb-6">
          <div className="flex items-center gap-4 mb-5">
            {s.photo ? (
              <img src={s.photo} alt={s.name} className="w-16 h-16 rounded-full object-cover border-2 border-navy-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-navy-100 flex items-center justify-center text-2xl font-bold text-navy-700">
                {s.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-navy-900">{s.name}</h2>
              <p className="text-sm text-slate-500">Roll: {s.roll} · Class {s.className}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-navy-800">{s.total}</div>
              <div className="text-[10px] text-slate-500 uppercase">Periods</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{s.present}</div>
              <div className="text-[10px] text-slate-500 uppercase">Present</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{s.absent}</div>
              <div className="text-[10px] text-slate-500 uppercase">Absent</div>
            </div>
          </div>

          {s.total > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Attendance %</span>
                <span>{Math.round((s.present / s.total) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${(s.present / s.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <h3 className="font-semibold text-navy-800 text-sm mb-3">Period-wise record</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {s.periods.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-slate-50">
                <div>
                  <span className="font-medium text-navy-900">{p.date}</span>
                  <span className="text-slate-400 mx-1">·</span>
                  <span className="text-slate-600">Period {p.period}</span>
                  <div className="text-[10px] text-slate-400">{p.markedBy}</div>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    p.status === "Present" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
