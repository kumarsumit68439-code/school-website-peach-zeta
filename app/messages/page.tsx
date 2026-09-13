"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

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

export default function MessagesPage() {
  const { data: session, status: authStatus } = useSession();
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

  // Load users & messages (no demo accounts)
  useEffect(() => {
    const savedUsers: ChatUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    setUsers(savedUsers);
    setMessages(JSON.parse(localStorage.getItem(MSGS_KEY) || "[]"));

    const savedMe = JSON.parse(localStorage.getItem(ME_KEY) || "null");
    if (savedMe) {
      setMe(savedMe);
    }
  }, []);

  // When Google login available — auto register / use session user
  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.user) return;

    const email = (session.user.email || "").toLowerCase();
    const name = session.user.name || email.split("@")[0] || "User";
    if (!email) return;

    setUsers((prev) => {
      const existing = prev.find((u) => u.email.toLowerCase() === email);
      let user: ChatUser;

      if (existing) {
        user = { ...existing, name };
      } else {
        user = {
          id: "g_" + email.replace(/[^a-z0-9]/gi, "_"),
          name,
          email,
          role: "Student",
        };
      }

      const without = prev.filter((u) => u.email.toLowerCase() !== email);
      const updated = [...without, user];
      localStorage.setItem(USERS_KEY, JSON.stringify(updated));

      // Set as me if no identity yet, or if same email
      const savedMe = JSON.parse(localStorage.getItem(ME_KEY) || "null");
      if (!savedMe || savedMe.email?.toLowerCase() === email) {
        setMe(user);
        localStorage.setItem(ME_KEY, JSON.stringify(user));
        setShowSetup(false);
      }

      return updated;
    });
  }, [session, authStatus]);

  // If still no me after load — show setup
  useEffect(() => {
    if (authStatus === "loading") return;
    const savedMe = JSON.parse(localStorage.getItem(ME_KEY) || "null");
    if (!savedMe && !session?.user) {
      setShowSetup(true);
    }
  }, [authStatus, session]);

  // Simulated real-time poll
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(JSON.parse(localStorage.getItem(MSGS_KEY) || "[]"));
      const latestUsers = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      setUsers(latestUsers);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selected]);

  const registerUser = (user: ChatUser) => {
    setUsers((prev) => {
      const without = prev.filter((u) => u.email.toLowerCase() !== user.email.toLowerCase());
      const updated = [...without, user];
      localStorage.setItem(USERS_KEY, JSON.stringify(updated));
      return updated;
    });
    setMe(user);
    localStorage.setItem(ME_KEY, JSON.stringify(user));
    setShowSetup(false);
  };

  const saveMe = () => {
    if (!setupName.trim() || !setupEmail.trim()) return;
    const email = setupEmail.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === email);
    const user: ChatUser = existing
      ? { ...existing, name: setupName.trim(), role: setupRole }
      : {
          id: "u_" + Date.now(),
          name: setupName.trim(),
          email,
          role: setupRole,
        };
    registerUser(user);
  };

  const switchIdentity = () => {
    setShowSetup(true);
    setSetupName(me?.name || session?.user?.name || "");
    setSetupEmail(me?.email || session?.user?.email || "");
    setSetupRole(me?.role || "Student");
  };

  const useGoogleIdentity = () => {
    if (!session?.user?.email) return;
    const email = session.user.email.toLowerCase();
    const name = session.user.name || email.split("@")[0];
    const existing = users.find((u) => u.email.toLowerCase() === email);
    const user: ChatUser = existing
      ? { ...existing, name }
      : {
          id: "g_" + email.replace(/[^a-z0-9]/gi, "_"),
          name,
          email,
          role: setupRole,
        };
    registerUser({ ...user, role: setupRole });
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

  const conversation =
    selected && me
      ? messages
          .filter(
            (m) =>
              (m.fromId === me.id && m.toId === selected.id) ||
              (m.fromId === selected.id && m.toId === me.id)
          )
          .sort((a, b) => a.timestamp - b.timestamp)
      : [];

  const filteredUsers = users.filter((u) => {
    if (me && u.id === me.id) return false;
    if (me && u.email.toLowerCase() === me.email.toLowerCase()) return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

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
            Apna naam / Gmail daalo — dusre users aapko search karke message kar sakenge
          </p>

          {session?.user && (
            <div className="mb-5 p-3 rounded-lg bg-navy-50 border border-navy-100 text-left">
              <p className="text-xs text-navy-600 mb-2">Google account detected:</p>
              <p className="text-sm font-semibold text-navy-900">{session.user.name}</p>
              <p className="text-xs text-slate-500 mb-3">{session.user.email}</p>
              <div className="flex gap-2 mb-2">
                {(["Student", "Teacher", "Principal"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSetupRole(r)}
                    className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold border ${
                      setupRole === r
                        ? "bg-navy-800 text-white border-navy-800"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <button onClick={useGoogleIdentity} className="btn btn-primary w-full text-sm">
                Continue with Google account
              </button>
            </div>
          )}

          <div className="space-y-3 text-left">
            {session?.user && (
              <p className="text-xs text-center text-slate-400">— or enter manually —</p>
            )}
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
              <label className="label">Gmail / Email *</label>
              <input
                className="input"
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
                placeholder="e.g. you@gmail.com"
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
            Jo bhi login / register karega, uska Gmail search me dikhega aur message kar sakte ho.
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
            {session?.user && <span className="text-green-600"> · Google linked</span>}
          </p>
        </div>
        <button onClick={switchIdentity} className="text-xs text-navy-600 underline">
          Switch Identity
        </button>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100%-50px)]">
        <div className="card flex flex-col overflow-hidden p-0">
          <div className="p-3 border-b border-slate-100">
            <input
              className="input text-sm"
              placeholder="Search Gmail / name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {users.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8 px-4">
                Abhi koi user nahi. Google login karke ya setup se register karo — phir search me dikhenge.
              </p>
            )}
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
            {users.length > 0 && filteredUsers.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8 px-4">
                No match for &quot;{search}&quot;
              </p>
            )}
          </div>
        </div>

        <div className="card flex flex-col overflow-hidden p-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              <div className="text-center px-4">
                <div className="text-4xl mb-2">💬</div>
                <p>Gmail / name search karke person select karo</p>
                <p className="text-xs mt-2">
                  Google login users automatically list me aa jaate hain
                </p>
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
                  <p className="text-center text-slate-400 text-sm py-8">No messages yet. Say hello!</p>
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
                          <div className="text-[10px] font-semibold opacity-70 mb-0.5">{m.fromName}</div>
                        )}
                        <div>{m.text}</div>
                        <div className={`text-[10px] mt-1 ${isMe ? "text-navy-200" : "text-slate-400"}`}>
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
