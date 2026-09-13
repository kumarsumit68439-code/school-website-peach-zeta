"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";

type Role = "Student" | "Teacher" | "Principal";

type ChatUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
  createdAt: string;
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
  type?: "text" | "link" | "photo" | "video" | "file";
  url?: string;
};

type Group = {
  id: string;
  name: string;
  createdBy: string;
  admins: string[];
  members: string[];
  createdAt: string;
};

type GroupMessage = {
  id: string;
  groupId: string;
  fromId: string;
  fromName: string;
  fromRole: Role;
  text: string;
  time: string;
  timestamp: number;
  type: "text" | "link" | "photo" | "video" | "file";
  url?: string;
  fileName?: string;
};

const USERS_KEY = "schoolChatUsers";
const MSGS_KEY = "schoolChatMessages";
const ME_KEY = "schoolChatMe";
const GROUPS_KEY = "schoolChatGroups";
const GMSGS_KEY = "schoolChatGroupMessages";
const ONLINE_KEY = "schoolChatOnline";

const DEMO_EMAILS = [
  "rahul.student@gmail.com",
  "priya.student@gmail.com",
  "aman.student@gmail.com",
  "sneha.student@gmail.com",
  "sunita.teacher@gmail.com",
  "ramesh.teacher@gmail.com",
  "principal.mggems@gmail.com",
];

function cleanUsers(list: ChatUser[]): ChatUser[] {
  return list.filter(
    (u) => u.email && !DEMO_EMAILS.includes(u.email.toLowerCase())
  );
}

export default function MessagesPage() {
  const { data: session, status: authStatus } = useSession();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [me, setMe] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);

  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [showAuth, setShowAuth] = useState(true);

  const [tab, setTab] = useState<"direct" | "groups" | "online">("direct");
  const [selected, setSelected] = useState<ChatUser | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [attachType, setAttachType] = useState<"text" | "link" | "photo" | "video" | "file">("text");
  const [attachUrl, setAttachUrl] = useState("");
  const [attachFileName, setAttachFileName] = useState("");

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<Role>("Student");
  const [authError, setAuthError] = useState("");

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [addMemberQuery, setAddMemberQuery] = useState("");
  const [showMembers, setShowMembers] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const loadAll = () => {
    const raw: ChatUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const cleaned = cleanUsers(raw);
    if (cleaned.length !== raw.length) {
      localStorage.setItem(USERS_KEY, JSON.stringify(cleaned));
    }
    setUsers(cleaned);
    setMessages(JSON.parse(localStorage.getItem(MSGS_KEY) || "[]"));
    setGroups(JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]"));
    setGroupMessages(JSON.parse(localStorage.getItem(GMSGS_KEY) || "[]"));
    setOnlineIds(JSON.parse(localStorage.getItem(ONLINE_KEY) || "[]"));
  };

  useEffect(() => {
    loadAll();
    const saved = JSON.parse(localStorage.getItem(ME_KEY) || "null");
    if (saved && !DEMO_EMAILS.includes((saved.email || "").toLowerCase())) {
      setMe(saved);
      setShowAuth(false);
    } else {
      localStorage.removeItem(ME_KEY);
      setShowAuth(true);
    }
  }, []);

  // Real-time sync every 1.5s
  useEffect(() => {
    const t = setInterval(loadAll, 1500);
    return () => clearInterval(t);
  }, []);

  // Online heartbeat
  useEffect(() => {
    if (!me) return;
    const beat = () => {
      const online: { id: string; at: number }[] = JSON.parse(
        localStorage.getItem(ONLINE_KEY + "_raw") || "[]"
      );
      const filtered = online.filter((o) => Date.now() - o.at < 12000 && o.id !== me.id);
      filtered.push({ id: me.id, at: Date.now() });
      localStorage.setItem(ONLINE_KEY + "_raw", JSON.stringify(filtered));
      localStorage.setItem(ONLINE_KEY, JSON.stringify(filtered.map((o) => o.id)));
      setOnlineIds(filtered.map((o) => o.id));
    };
    beat();
    const t = setInterval(beat, 4000);
    return () => clearInterval(t);
  }, [me]);

  // Google OAuth → auto login/signup chat account
  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.user?.email) return;
    const email = session.user.email.toLowerCase();
    const name = session.user.name || email.split("@")[0];
    const raw: ChatUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    let list = cleanUsers(raw);
    let user = list.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      user = {
        id: "g_" + email.replace(/[^a-z0-9]/gi, "_"),
        name,
        email,
        role: "Student",
        createdAt: new Date().toISOString(),
      };
      list = [...list, user];
      localStorage.setItem(USERS_KEY, JSON.stringify(list));
    } else {
      user = { ...user, name };
      list = list.map((u) => (u.email === email ? user! : u));
      localStorage.setItem(USERS_KEY, JSON.stringify(list));
    }
    setUsers(list);
    setMe(user);
    localStorage.setItem(ME_KEY, JSON.stringify(user));
    setShowAuth(false);
  }, [session, authStatus]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, groupMessages, selected, selectedGroup]);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const email = formEmail.trim().toLowerCase();
    const name = formName.trim();
    if (!email || !name) {
      setAuthError("Name aur Gmail zaroori hain");
      return;
    }
    if (DEMO_EMAILS.includes(email)) {
      setAuthError("Ye demo email block hai — apna real Gmail use karo");
      return;
    }
    const existing = users.find((u) => u.email.toLowerCase() === email);
    if (existing) {
      setAuthError("Account pehle se hai — Login tab use karo");
      setAuthMode("login");
      return;
    }
    const user: ChatUser = {
      id: "u_" + Date.now(),
      name,
      email,
      role: formRole,
      password: formPassword || undefined,
      createdAt: new Date().toISOString(),
    };
    const updated = [...users, user];
    setUsers(updated);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    setMe(user);
    localStorage.setItem(ME_KEY, JSON.stringify(user));
    setShowAuth(false);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const email = formEmail.trim().toLowerCase();
    if (!email) {
      setAuthError("Gmail daalo");
      return;
    }
    const user = users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      setAuthError("Account nahi mila — pehle Sign Up karo");
      setAuthMode("signup");
      return;
    }
    if (user.password && formPassword && user.password !== formPassword) {
      setAuthError("Galat password");
      return;
    }
    setMe(user);
    localStorage.setItem(ME_KEY, JSON.stringify(user));
    setShowAuth(false);
    setFormEmail("");
    setFormPassword("");
  };

  const logout = () => {
    localStorage.removeItem(ME_KEY);
    setMe(null);
    setSelected(null);
    setSelectedGroup(null);
    setShowAuth(true);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachUrl(reader.result as string);
      setAttachFileName(file.name);
      if (file.type.startsWith("image/")) setAttachType("photo");
      else if (file.type.startsWith("video/")) setAttachType("video");
      else setAttachType("file");
    };
    reader.readAsDataURL(file);
  };

  const sendDirect = () => {
    if (!me || !selected) return;
    if (attachType === "text" && !text.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      fromId: me.id,
      fromName: me.name,
      fromRole: me.role,
      toId: selected.id,
      toName: selected.name,
      text: text.trim() || attachFileName || attachUrl,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      type: attachType,
      url: attachType !== "text" ? attachUrl || text.trim() : undefined,
    };
    const updated = [...messages, msg];
    setMessages(updated);
    localStorage.setItem(MSGS_KEY, JSON.stringify(updated));
    setText("");
    setAttachUrl("");
    setAttachFileName("");
    setAttachType("text");
  };

  const sendGroup = () => {
    if (!me || !selectedGroup) return;
    if (attachType === "text" && !text.trim()) return;
    const msg: GroupMessage = {
      id: Date.now().toString(),
      groupId: selectedGroup.id,
      fromId: me.id,
      fromName: me.name,
      fromRole: me.role,
      text: text.trim() || attachFileName || attachUrl,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      type: attachType,
      url: attachType !== "text" ? attachUrl || text.trim() : undefined,
      fileName: attachFileName || undefined,
    };
    const updated = [...groupMessages, msg];
    setGroupMessages(updated);
    localStorage.setItem(GMSGS_KEY, JSON.stringify(updated));
    setText("");
    setAttachUrl("");
    setAttachFileName("");
    setAttachType("text");
  };

  const createGroup = () => {
    if (!me || !newGroupName.trim()) return;
    const g: Group = {
      id: "grp_" + Date.now(),
      name: newGroupName.trim(),
      createdBy: me.id,
      admins: [me.id],
      members: [me.id],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const updated = [...groups, g];
    setGroups(updated);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(updated));
    setNewGroupName("");
    setShowCreateGroup(false);
    setSelectedGroup(g);
    setTab("groups");
  };

  const deleteGroup = (gid: string) => {
    if (!me) return;
    const g = groups.find((x) => x.id === gid);
    if (!g || !g.admins.includes(me.id)) return;
    if (!confirm("Delete group?")) return;
    const updated = groups.filter((x) => x.id !== gid);
    setGroups(updated);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(updated));
    const msgs = groupMessages.filter((m) => m.groupId !== gid);
    setGroupMessages(msgs);
    localStorage.setItem(GMSGS_KEY, JSON.stringify(msgs));
    if (selectedGroup?.id === gid) setSelectedGroup(null);
  };

  const addToGroup = (userId: string) => {
    if (!me || !selectedGroup || !selectedGroup.admins.includes(me.id)) return;
    const updated = groups.map((g) =>
      g.id === selectedGroup.id && !g.members.includes(userId)
        ? { ...g, members: [...g.members, userId] }
        : g
    );
    setGroups(updated);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(updated));
    setSelectedGroup(updated.find((g) => g.id === selectedGroup.id)!);
    setAddMemberQuery("");
  };

  const makeAdmin = (userId: string) => {
    if (!me || !selectedGroup || !selectedGroup.admins.includes(me.id)) return;
    const updated = groups.map((g) =>
      g.id === selectedGroup.id && !g.admins.includes(userId)
        ? { ...g, admins: [...g.admins, userId] }
        : g
    );
    setGroups(updated);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(updated));
    setSelectedGroup(updated.find((g) => g.id === selectedGroup.id)!);
  };

  const removeMember = (userId: string) => {
    if (!me || !selectedGroup || !selectedGroup.admins.includes(me.id)) return;
    if (userId === selectedGroup.createdBy) return;
    const updated = groups.map((g) =>
      g.id === selectedGroup.id
        ? {
            ...g,
            members: g.members.filter((id) => id !== userId),
            admins: g.admins.filter((id) => id !== userId),
          }
        : g
    );
    setGroups(updated);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(updated));
    setSelectedGroup(updated.find((g) => g.id === selectedGroup.id)!);
  };

  const renderMedia = (type: string, url?: string, label?: string) => {
    if (!url) return null;
    if (type === "photo") return <img src={url} alt="" className="max-h-40 rounded-lg mt-1 border" />;
    if (type === "video")
      return url.includes("youtube") || url.includes("youtu.be") ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline block mt-1">🎬 Open video</a>
      ) : (
        <video src={url} controls className="max-h-40 rounded-lg mt-1 w-full" />
      );
    if (type === "link")
      return <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline break-all block mt-1">🔗 {url}</a>;
    if (type === "file")
      return <a href={url} download={label} className="text-xs underline block mt-1">📎 {label || "File"}</a>;
    return null;
  };

  // Only OTHER registered accounts in search (real-time from users state)
  const searchResults = users.filter((u) => {
    if (!me) return false;
    if (u.id === me.id || u.email.toLowerCase() === me.email.toLowerCase()) return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  // PRIVATE: only messages between me and selected person
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

  const myGroups = me ? groups.filter((g) => g.members.includes(me.id)) : [];
  const onlineUsers = users.filter((u) => onlineIds.includes(u.id) && u.id !== me?.id);
  const gConversation = selectedGroup
    ? groupMessages.filter((m) => m.groupId === selectedGroup.id).sort((a, b) => a.timestamp - b.timestamp)
    : [];
  const addCandidates = selectedGroup
    ? users.filter(
        (u) =>
          !selectedGroup.members.includes(u.id) &&
          (u.name.toLowerCase().includes(addMemberQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(addMemberQuery.toLowerCase()))
      )
    : [];

  // ========== AUTH SCREEN ==========
  if (showAuth || !me) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="card shadow-lg">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">💬</div>
            <h1 className="text-xl font-bold text-navy-900">School Messenger</h1>
            <p className="text-sm text-slate-500 mt-1">Pehle account banao / login karo, phir message karo</p>
          </div>

          <div className="flex rounded-lg overflow-hidden border border-slate-200 mb-5">
            <button
              onClick={() => { setAuthMode("signup"); setAuthError(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold ${authMode === "signup" ? "bg-navy-800 text-white" : "bg-white text-slate-600"}`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold ${authMode === "login" ? "bg-navy-800 text-white" : "bg-white text-slate-600"}`}
            >
              Login
            </button>
          </div>

          {authError && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{authError}</div>
          )}

          {authMode === "signup" ? (
            <form onSubmit={handleSignup} className="space-y-3">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Rahul Sharma" />
              </div>
              <div>
                <label className="label">Gmail *</label>
                <input className="input" type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="you@gmail.com" />
              </div>
              <div>
                <label className="label">Password (optional)</label>
                <input className="input" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className="label">Role *</label>
                <div className="flex gap-2">
                  {(["Student", "Teacher", "Principal"] as Role[]).map((r) => (
                    <button key={r} type="button" onClick={() => setFormRole(r)} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${formRole === r ? "bg-navy-800 text-white border-navy-800" : "bg-white border-slate-200"}`}>{r}</button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full py-3">Create Account</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="label">Gmail *</label>
                <input className="input" type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="you@gmail.com" />
              </div>
              <div>
                <label className="label">Password (agar set kiya tha)</label>
                <input className="input" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary w-full py-3">Login</button>
            </form>
          )}

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-slate-400">OR</span></div>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/messages" })}
            className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google Gmail
          </button>

          <p className="text-[11px] text-slate-400 text-center mt-4">
            Sign up ke baad aapka Gmail search me dikhega. Messages sirf aap aur jis se baat kar rahe ho unko dikhenge.
          </p>
        </div>
      </div>
    );
  }

  // ========== CHAT UI ==========
  return (
    <div className="max-w-6xl mx-auto px-4 py-4" style={{ height: "calc(100vh - 100px)" }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h1 className="text-lg font-bold text-navy-900">💬 Messenger</h1>
          <p className="text-xs text-slate-500">
            {me.name} ({me.role}) · {me.email}
            {onlineIds.includes(me.id) && <span className="text-green-600"> · Online</span>}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {(["direct", "groups", "online"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setSelected(null); setSelectedGroup(null); }} className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${tab === t ? "bg-navy-800 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
              {t === "direct" ? "Chat" : t === "groups" ? "Groups" : `Online (${onlineUsers.length})`}
            </button>
          ))}
          <button onClick={logout} className="text-xs text-red-500 underline">Logout</button>
        </div>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-3 h-[calc(100%-48px)]">
        <div className="card flex flex-col overflow-hidden p-0">
          {tab === "online" && (
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-2 text-[10px] font-bold text-green-700 bg-green-50 uppercase">Online now</div>
              <div className="px-3 py-2 border-b flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <div><div className="text-sm font-medium">{me.name} (You)</div><div className="text-[10px] text-slate-400">{me.email}</div></div>
              </div>
              {onlineUsers.map((u) => (
                <button key={u.id} onClick={() => { setSelected(u); setTab("direct"); }} className="w-full text-left px-3 py-2.5 border-b hover:bg-slate-50 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <div><div className="text-sm font-medium">{u.name}</div><div className="text-[10px] text-slate-400">{u.email} · {u.role}</div></div>
                </button>
              ))}
              <div className="px-3 py-2 text-[10px] font-bold text-slate-500 bg-slate-50 uppercase mt-2">All registered ({users.length})</div>
              {users.filter((u) => u.id !== me.id).map((u) => (
                <button key={u.id} onClick={() => { setSelected(u); setTab("direct"); }} className="w-full text-left px-3 py-2 border-b hover:bg-slate-50">
                  <div className="text-sm font-medium">{u.name}</div>
                  <div className="text-[10px] text-slate-400">{u.email}</div>
                </button>
              ))}
              {users.length <= 1 && (
                <p className="text-xs text-slate-400 text-center py-6 px-3">Sirf aap registered ho. Dusra person Sign Up kare — real-time search me aa jayega.</p>
              )}
            </div>
          )}

          {tab === "direct" && (
            <>
              <div className="p-2 border-b">
                <input
                  className="input text-sm"
                  placeholder="Search registered Gmail / name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1 px-1">Sirf Sign Up / Login wale accounts dikhte hain</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {searchResults.map((u) => (
                  <button key={u.id} onClick={() => setSelected(u)} className={`w-full text-left px-3 py-2.5 border-b hover:bg-slate-50 ${selected?.id === u.id ? "bg-navy-50" : ""}`}>
                    <div className="flex items-center gap-2">
                      {onlineIds.includes(u.id) && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                      <div>
                        <div className="text-sm font-medium text-navy-900">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.email} · {u.role}</div>
                      </div>
                    </div>
                  </button>
                ))}
                {searchResults.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8 px-3">
                    {search ? `"${search}" se koi registered account nahi` : "Abhi koi aur account nahi. Jab koi Sign Up karega, yahan real-time dikhega."}
                  </p>
                )}
              </div>
            </>
          )}

          {tab === "groups" && (
            <>
              <div className="p-2 border-b">
                <button onClick={() => setShowCreateGroup(true)} className="btn btn-primary text-xs w-full">+ Create Group</button>
              </div>
              {showCreateGroup && (
                <div className="p-3 border-b bg-slate-50 space-y-2">
                  <input className="input text-sm" placeholder="Group name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={createGroup} className="btn btn-primary text-xs flex-1">Create</button>
                    <button onClick={() => setShowCreateGroup(false)} className="btn btn-outline text-xs">Cancel</button>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                {myGroups.map((g) => (
                  <button key={g.id} onClick={() => { setSelectedGroup(g); setShowMembers(false); }} className={`w-full text-left px-3 py-2.5 border-b hover:bg-slate-50 ${selectedGroup?.id === g.id ? "bg-navy-50" : ""}`}>
                    <div className="text-sm font-medium">{g.name}</div>
                    <div className="text-[10px] text-slate-400">{g.members.length} members</div>
                  </button>
                ))}
                {myGroups.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No groups</p>}
              </div>
            </>
          )}
        </div>

        <div className="card flex flex-col overflow-hidden p-0">
          {tab === "direct" && selected && (
            <>
              <div className="px-4 py-3 border-b">
                <div className="font-semibold text-sm text-navy-900">{selected.name}</div>
                <div className="text-[10px] text-slate-400">{selected.email} · Private chat (sirf aap dono)</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {conversation.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8">No messages yet. Private — sirf aap aur {selected.name} dekh sakenge.</p>
                )}
                {conversation.map((m) => (
                  <div key={m.id} className={`flex ${m.fromId === me.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.fromId === me.id ? "bg-navy-800 text-white" : "bg-slate-100"}`}>
                      <div>{m.text}</div>
                      {renderMedia(m.type || "text", m.url, m.text)}
                      <div className={`text-[10px] mt-1 ${m.fromId === me.id ? "text-navy-200" : "text-slate-400"}`}>{m.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </>
          )}

          {tab === "groups" && selectedGroup && (
            <>
              <div className="px-4 py-3 border-b">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold text-sm">{selectedGroup.name}</div>
                    <div className="text-[10px] text-slate-400">{selectedGroup.members.length} members · group chat</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowMembers(!showMembers)} className="text-xs text-navy-600 underline">Members</button>
                    {selectedGroup.admins.includes(me.id) && (
                      <button onClick={() => deleteGroup(selectedGroup.id)} className="text-xs text-red-500 underline">Delete</button>
                    )}
                  </div>
                </div>
                {showMembers && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm space-y-2">
                    {selectedGroup.members.map((mid) => {
                      const u = users.find((x) => x.id === mid);
                      const isAdmin = selectedGroup.admins.includes(mid);
                      return (
                        <div key={mid} className="flex justify-between items-center">
                          <span>{u?.name || mid} {isAdmin && <span className="text-[10px] text-purple-600 font-bold">ADMIN</span>}<span className="text-[10px] text-slate-400 block">{u?.email}</span></span>
                          {selectedGroup.admins.includes(me.id) && mid !== me.id && (
                            <div className="flex gap-1">
                              {!isAdmin && <button onClick={() => makeAdmin(mid)} className="text-[10px] text-navy-600 underline">Make admin</button>}
                              <button onClick={() => removeMember(mid)} className="text-[10px] text-red-500 underline">Remove</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {selectedGroup.admins.includes(me.id) && (
                      <div className="pt-2 border-t">
                        <input className="input text-xs mb-1" placeholder="Add registered Gmail / name..." value={addMemberQuery} onChange={(e) => setAddMemberQuery(e.target.value)} />
                        {addCandidates.slice(0, 5).map((u) => (
                          <button key={u.id} onClick={() => addToGroup(u.id)} className="block w-full text-left text-xs py-1 hover:bg-white px-2 rounded">+ {u.name} ({u.email})</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {gConversation.map((m) => (
                  <div key={m.id} className={`flex ${m.fromId === me.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.fromId === me.id ? "bg-navy-800 text-white" : "bg-slate-100"}`}>
                      {m.fromId !== me.id && <div className="text-[10px] font-semibold opacity-70">{m.fromName}</div>}
                      <div>{m.text}</div>
                      {renderMedia(m.type, m.url, m.fileName || m.text)}
                      <div className={`text-[10px] mt-1 ${m.fromId === me.id ? "text-navy-200" : "text-slate-400"}`}>{m.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </>
          )}

          {((tab === "direct" && !selected) || (tab === "groups" && !selectedGroup) || tab === "online") && (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              <div className="text-center px-4">
                <div className="text-4xl mb-2">💬</div>
                <p>Registered account search karke private chat shuru karo</p>
                <p className="text-xs mt-2">Messages sirf aap dono ko dikhenge · Real-time update</p>
              </div>
            </div>
          )}

          {((tab === "direct" && selected) || (tab === "groups" && selectedGroup)) && (
            <div className="p-3 border-t space-y-2">
              <div className="flex flex-wrap gap-1">
                {(["text", "link", "photo", "video", "file"] as const).map((t) => (
                  <button key={t} onClick={() => setAttachType(t)} className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${attachType === t ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-600"}`}>{t}</button>
                ))}
              </div>
              {attachType === "link" && <input className="input text-xs" placeholder="Paste link..." value={attachUrl} onChange={(e) => setAttachUrl(e.target.value)} />}
              {(attachType === "photo" || attachType === "video" || attachType === "file") && (
                <input type="file" className="input text-xs" accept={attachType === "photo" ? "image/*" : attachType === "video" ? "video/*" : "*/*"} onChange={handleFileAttach} />
              )}
              {attachFileName && <p className="text-[10px] text-green-600">Attached: {attachFileName}</p>}
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Message..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (tab === "groups" ? sendGroup() : sendDirect())} />
                <button onClick={tab === "groups" ? sendGroup : sendDirect} className="btn btn-primary px-5">Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
