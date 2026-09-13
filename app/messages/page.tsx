"use client";

import { useState, useEffect, useRef } from "react";

type Role = "Student" | "Teacher" | "Principal";

type ChatUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Message = {
  id: string;
  fromId: string;
  fromName: string;
  fromRole: Role;
  toId: string;
  toName: string;
  text: string;
  time: string;
  timestamp: number;
};

const USERS_KEY = "schoolChatUsers";
const MSGS_KEY = "schoolChatMessages";
const ME_KEY = "schoolChatMe";

const defaultUsers: ChatUser[] = [
  { id: "u1", name: "Rahul Sharma", email: "rahul.student@gmail.com", role: "Student" },
  { id: "u2", name: "Priya Verma", email: "priya.student@gmail.com", role: "Student" },
  { id: "u3", name: "Aman Kumar", email: "aman.student@gmail.com", role: "Student" },
  { id: "u4", name: "Sneha Patel", email: "sneha.student@gmail.com", role: "Student" },
  { id: "t1", name: "Mrs. Sunita Sharma", email: "sunita.teacher@gmail.com", role: "Teacher" },
  { id: "t2", name: "Mr. Ramesh Yadav", email: "ramesh.teacher@gmail.com", role: "Teacher" },
  { id: "p1", name: "Principal Sir", email: "principal.mggems@gmail.com", role: "Principal" },
];

export default function MessagesPage() {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [me, setMe] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<ChatUser | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupRole, setSetupRole] = useState<Role>("Student");
  const [showSetup, setShowSetup] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
    let savedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || "null");
    if (!savedUsers || savedUsers.length === 0) {
      savedUsers = defaultUsers;
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
    setUsers(savedUsers);

    const savedMe = JSON.parse(localStorage.getItem(ME_KEY) || "null");
    if (savedMe) setMe(savedMe);
    else setShowSetup(true);

    setMessages(JSON.parse(localStorage.getItem(MSGS_KEY) || "[]"));
  }, []);

  // Simulated real-time: poll every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      const latest = JSON.parse(localStorage.getItem(MSGS_KEY) || "[]");
      setMessages(latest);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selected]);

  const saveMe = () => {
    if (!setupName.trim() || !setupEmail.trim()) return;
    const existing = users.find(
      (u) => u.email.toLowerCase() === setupEmail.trim().toLowerCase()
    );
    let user: ChatUser;
    if (existing) {
      user = { ...existing, name: setupName.trim(), role: setupRole };
    } else {
      user = {
        id: "u" + Date.now(),
        name: setupName.trim(),
        email: setupEmail.trim().toLowerCase(),
        role: setupRole,
      };
      const updated = [...users, user];
      setUsers(updated);
      localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    }
    setMe(user);
    localStorage.setItem(ME_KEY, JSON.stringify(user));
    setShowSetup(false);
  };

  const switchIdentity = () => {
    setShowSetup(true);
    setSetupName(me?.name || "");
    setSetupEmail(me?.email || "");
    setSetupRole(me?.role || "Student");
  };

  const send = () => {
    if (!text.trim() || !me || !selected) return;
    const msg: Message = {
      id: Date.now().toString(),
      fromId: me.id,
      fromName: me.name,
      fromRole: me.role,
      toId: selected.id,
      toName: selected.name,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
    };
    const updated = [...messages, msg];
    setMessages(updated);
    localStorage.setItem(MSGS_KEY, JSON.stringify(updated));
    setText("");
  };

  // Conversation with selected user
  const conversation = selected && me
    ? messages
        .filter(
          (m) =>
            (m.fromId === me.id && m.toId === selected.id) ||
            (m.fromId === selected.id && m.toId === me.id)
        )
        .sort((a, b) => a.timestamp - b.timestamp)
    : [];

  // Search filter
  const filteredUsers = users.filter((u) => {
    if (me && u.id === me.id) return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  // Group by role for display
  const students = filteredUsers.filter((u) => u.role === "Student");
  const teachers = filteredUsers.filter((u) => u.role === "Teacher");
  const principals = filteredUsers.filter((u) => u.role === "Principal");

  const roleBadge = (role: Role) => {
    const colors: Record<Role, string> = {
      Student: "bg-blue-100 text-blue-800",
      Teacher: "bg-green-100 text-green-800",
      Principal: "bg-purple-100 text-purple-800",
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[role]}`}>
        {role}
      </span>
    );
  };

  // Setup screen
  if (showSetup || !me) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="card shadow-lg text-center">
          <div className="text-4xl mb-3">💬</div>
          <h1 className="text-xl font-bold text-navy-900 mb-1">School Messenger</h1>
          <p className="text-sm text-slate-500 mb-6">
            Apna naam, Gmail / username aur role select karo
          </p>
          <div className="space-y-3 text-left">
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input"
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
              />
            </div>
            <div>
              <label className="label">Gmail / Username *</label>
              <input
                className="input"
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
                placeholder="e.g. rahul.student@gmail.com"
              />
            </div>
            <div>
              <label className="label">Role *</label>
              <div className="flex gap-2">
                {(["Student", "Teacher", "Principal"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSetupRole(r)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                      setupRole === r
                        ? "bg-navy-800 text-white border-navy-800"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveMe} className="btn btn-primary w-full mt-2">
              Continue to Chat
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Demo users already exist — search by Gmail to message them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" style={{ height: "calc(100vh - 120px)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900">💬 School Messenger</h1>
          <p className="text-xs text-slate-500">
            You: <strong>{me.name}</strong> ({me.role}) · {me.email}
          </p>
        </div>
        <button onClick={switchIdentity} className="text-xs text-navy-600 underline">
          Switch Identity
        </button>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100%-50px)]">
        {/* Left: User list + Search */}
        <div className="card flex flex-col overflow-hidden p-0">
          <div className="p-3 border-b border-slate-100">
            <input
              ref={searchRef}
              className="input text-sm"
              placeholder="Search Gmail / username / name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {principals.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-bold text-purple-600 uppercase bg-purple-50">
                  Principal
                </div>
                {principals.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition ${
                      selected?.id === u.id ? "bg-navy-50" : ""
                    }`}
                  >
                    <div className="font-medium text-sm text-navy-900">{u.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                  </button>
                ))}
              </div>
            )}
            {teachers.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-bold text-green-600 uppercase bg-green-50">
                  Teachers
                </div>
                {teachers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition ${
                      selected?.id === u.id ? "bg-navy-50" : ""
                    }`}
                  >
                    <div className="font-medium text-sm text-navy-900">{u.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                  </button>
                ))}
              </div>
            )}
            {students.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-bold text-blue-600 uppercase bg-blue-50">
                  Students
                </div>
                {students.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition ${
                      selected?.id === u.id ? "bg-navy-50" : ""
                    }`}
                  >
                    <div className="font-medium text-sm text-navy-900">{u.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                  </button>
                ))}
              </div>
            )}
            {filteredUsers.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8 px-4">
                No user found. Try another Gmail / name.
              </p>
            )}
          </div>
        </div>

        {/* Right: Chat window */}
        <div className="card flex flex-col overflow-hidden p-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p>Search Gmail / username and select a person to message</p>
                <p className="text-xs mt-2">Student ↔ Student · Student ↔ Teacher · Teacher ↔ Principal</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-800 font-bold text-sm">
                  {selected.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-navy-900 text-sm flex items-center gap-2">
                    {selected.name} {roleBadge(selected.role)}
                  </div>
                  <div className="text-[11px] text-slate-400">{selected.email}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {conversation.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8">
                    No messages yet. Say hello!
                  </p>
                )}
                {conversation.map((m) => {
                  const isMe = m.fromId === me.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                          isMe
                            ? "bg-navy-800 text-white rounded-br-md"
                            : "bg-slate-100 text-slate-800 rounded-bl-md"
                        }`}
                      >
                        {!isMe && (
                          <div className="text-[10px] font-semibold opacity-70 mb-0.5">
                            {m.fromName}
                          </div>
                        )}
                        <div>{m.text}</div>
                        <div
                          className={`text-[10px] mt-1 ${
                            isMe ? "text-navy-200" : "text-slate-400"
                          }`}
                        >
                          {m.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t border-slate-100 flex gap-2">
                <input
                  className="input flex-1"
                  placeholder={`Message ${selected.name}...`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <button onClick={send} className="btn btn-primary px-5">
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
