"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import StorageSelector from "@/components/StorageSelector";

type Notice = { id: string; title: string; content: string; date: string; important?: boolean };

const defaults: Notice[] = [
  { id: "1", title: "Admission Open for Session 2026-27", content: "Online and offline admission has started. Parents can fill the form on this website or visit the school office.", date: "2026-03-14", important: true },
  { id: "2", title: "School Reopening Notice", content: "School will reopen on 1st July for the new session. Students must come in proper uniform.", date: "2026-06-20" },
  { id: "3", title: "Parent-Teacher Meeting", content: "PTM will be held on the last Saturday of every month from 9:00 AM to 12:00 PM.", date: "2026-07-01" },
];

export default function NoticePage() {
  const { data: session } = useSession();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", important: false });

  useEffect(() => {
    const saved = localStorage.getItem("schoolNotices");
    if (saved) setNotices(JSON.parse(saved));
    else { setNotices(defaults); localStorage.setItem("schoolNotices", JSON.stringify(defaults)); }
  }, []);

  const save = (list: Notice[]) => { setNotices(list); localStorage.setItem("schoolNotices", JSON.stringify(list)); };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n: Notice = { id: Date.now().toString(), title: form.title, content: form.content, date: new Date().toISOString().slice(0, 10), important: form.important };
    save([n, ...notices]);
    setForm({ title: "", content: "", important: false });
    setShowForm(false);
  };

  const remove = (id: string) => { if (confirm("Delete this notice?")) save(notices.filter((n) => n.id !== id)); };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900 text-center mb-2">Notice Board</h1>
      <p className="text-center text-slate-500 mb-8">Latest announcements from MGGEMS Lalchandpura</p>
      {session && (<><StorageSelector /><div className="flex justify-end mb-4"><button onClick={() => setShowForm(!showForm)} className="btn btn-primary text-sm">{showForm ? "Cancel" : "+ Add Notice"}</button></div></>)}
      {showForm && session && (
        <form onSubmit={add} className="card mb-6 space-y-3">
          <div><label className="label">Title *</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Content *</label><textarea className="input" required rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.important} onChange={(e) => setForm({ ...form, important: e.target.checked })} /> Mark as Important</label>
          <button type="submit" className="btn btn-primary">Publish</button>
        </form>
      )}
      <div className="space-y-4">
        {notices.map((n) => (
          <div key={n.id} className={`card border-l-4 ${n.important ? "border-l-saffron-500" : "border-l-navy-500"}`}>
            <div className="flex justify-between gap-3">
              <div>
                {n.important && <span className="text-[10px] font-bold text-saffron-700 bg-saffron-100 px-2 py-0.5 rounded">IMPORTANT</span>}
                <h3 className="font-bold text-navy-900 mt-1">{n.title}</h3>
                <p className="text-xs text-slate-400 mb-2">{n.date}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{n.content}</p>
              </div>
              {session && <button onClick={() => remove(n.id)} className="shrink-0 w-8 h-8 rounded-md bg-red-50 text-red-500 text-sm hover:bg-red-100">✕</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
