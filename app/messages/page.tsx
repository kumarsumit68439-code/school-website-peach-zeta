"use client";

import { useState, useEffect, useRef } from "react";

type Role = "Student" | "Teacher" | "Principal";
type Message = { id: string; role: Role; text: string; time: string; isImage?: boolean; isFile?: boolean };

const STORAGE_KEY = "schoolMessages";

export default function MessagesPage() {
  const [role, setRole] = useState<Role>("Student");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setMessages(JSON.parse(saved));
    else {
      const welcome: Message[] = [{ id: "1", role: "Principal", text: "Welcome to the school messaging portal. Students, teachers and principal can communicate here.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }];
      setMessages(welcome);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(welcome));
    }
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    const isImage = text.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) !== null;
    const isFile = !isImage && (text.match(/\.(pdf|doc|docx)(\?|$)/i) !== null || text.toLowerCase().includes("document"));
    const msg: Message = { id: Date.now().toString(), role, text: text.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), isImage, isFile };
    const updated = [...messages, msg];
    setMessages(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setText("");
  };

  const roleColor: Record<Role, string> = { Student: "bg-blue-100 text-blue-800", Teacher: "bg-green-100 text-green-800", Principal: "bg-purple-100 text-purple-800" };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      <h1 className="text-2xl font-bold text-navy-900 text-center mb-1">💬 School Messenger</h1>
      <p className="text-center text-slate-500 text-sm mb-4">Students · Teachers · Principal</p>
      <div className="flex justify-center gap-2 mb-4">
        {(["Student", "Teacher", "Principal"] as Role[]).map((r) => (
          <button key={r} onClick={() => setRole(r)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${role === r ? "bg-navy-800 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>{r}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto card space-y-3 mb-4">
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColor[m.role]}`}>{m.role}</span>
              <span className="text-[10px] text-slate-400">{m.time}</span>
            </div>
            <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700 max-w-[90%]">
              {m.isImage ? <div><p className="text-xs text-slate-400 mb-1">📷 Image</p><a href={m.text} target="_blank" rel="noopener noreferrer" className="text-navy-600 underline break-all">{m.text}</a></div>
              : m.isFile ? <div><p className="text-xs text-slate-400 mb-1">📎 Document</p><span className="break-all">{m.text}</span></div>
              : m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input className="input flex-1" placeholder={`Message as ${role}...`} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <button onClick={send} className="btn btn-primary px-5">Send</button>
      </div>
    </div>
  );
}
