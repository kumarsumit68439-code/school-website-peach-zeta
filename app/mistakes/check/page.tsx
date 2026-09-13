"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function MistakeCheckPage() {
  const [list, setList] = useState<Mistake[]>([]);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = () => setList(JSON.parse(localStorage.getItem(STORAGE) || "[]"));
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const q = query.trim().toLowerCase();
  const matched = showAll
    ? list
    : searched
    ? list.filter(
        (m) =>
          m.studentName.toLowerCase().includes(q) ||
          m.roll.toLowerCase().includes(q) ||
          m.className === q
      )
    : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Check Student Mistakes</h1>
          <p className="text-sm text-slate-500">Visible to Students, Parents, Teachers, Principal</p>
        </div>
        <Link href="/mistakes" className="text-sm text-navy-600 underline">← Back</Link>
      </div>
      <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-6">
        ✅ Public records — koi bhi (bina login) search karke dekh sakta hai.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setShowAll(false);
          setSearched(true);
        }}
        className="card mb-4 space-y-3"
      >
        <label className="label">Student Name / Roll / Class</label>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearched(false);
              setShowAll(false);
            }}
            placeholder="e.g. Rahul or 12"
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
        Show all records ({list.length})
      </button>

      {searched && matched.length === 0 && !showAll && (
        <div className="card text-center py-10 text-slate-500">
          No mistake records found for &quot;{query}&quot;.
        </div>
      )}

      {showAll && list.length === 0 && (
        <div className="card text-center py-10 text-slate-500">No records yet.</div>
      )}

      <div className="space-y-4">
        {matched.map((m) => (
          <div key={m.id} className="card border-l-4 border-l-red-400">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <h2 className="font-bold text-navy-900">{m.studentName}</h2>
                <p className="text-sm text-slate-500">
                  Class {m.className} · Roll {m.roll} · {m.date}
                </p>
              </div>
              <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full font-semibold">
                by {m.reportedBy} ({m.role})
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap">{m.description}</p>
            {m.photo && (
              <img src={m.photo} alt="Evidence" className="rounded-lg max-h-48 object-cover mb-3 border" />
            )}
            {m.videoUrl && (
              <a href={m.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-navy-600 underline">
                🎬 Watch video evidence
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
