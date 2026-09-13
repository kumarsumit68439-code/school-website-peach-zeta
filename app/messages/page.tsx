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
  return list.filter((u) => u.email && !DEMO_EMAILS.includes(u.email.toLowerCase()));
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);
  const prevGroupMsgCount = useRef(0);
  const shouldStickBottom = useRef(true);

  const loadAll = () => {
    const raw: ChatUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const cleaned = cleanUsers(raw);
    if (cleaned.length !== raw.length) {
      localStorage.setItem(USERS_KEY, JSON.stringify(cleaned));
    }
    setUsers(cleaned);
    setMessages(JSON.parse(localStorage.getItem(MSGS_KEY) || "[]"));
    const gList: Group[] = JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]");
    setGroups(gList);
    setGroupMessages(JSON.parse(localStorage.getItem(GMSGS_KEY) || "[]"));
    setOnlineIds(JSON.parse(localStorage.getItem(ONLINE_KEY) || "[]"));
    setSelectedGroup((prev) => {
      if (!prev) return prev;
      return gList.find((g) => g.id === prev.id) || prev;
    });
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

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const t = setInterval(loadAll, 2000);
    return () => clearInterval(t);
  }, []);

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
    const t = setInterval(beat, 5000);
    return () => clearInterval(t);
  }, [me]);

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
    if (!chatBoxRef.current) return;
    const box = chatBoxRef.current;
    const count = selected
      ? messages.filter(
          (m) =>
            me &&
            ((m.fromId === me.id && m.toId === selected.id) ||
              (m.fromId === selected.id && m.toId === me.id))
        ).length
      : selectedGroup
      ? groupMessages.filter((m) => m.groupId === selectedGroup.id).length
      : 0;
    const prev = selected ? prevMsgCount.current : prevGroupMsgCount.current;
    if (count > prev && shouldStickBottom.current) box.scrollTop = box.scrollHeight;
    if (selected) prevMsgCount.current = count;
    else if (selectedGroup) prevGroupMsgCount.current = count;
  }, [messages, groupMessages, selected, selectedGroup, me]);

  useEffect(() => {
    shouldStickBottom.current = true;
    if (selected) prevMsgCount.current = 0;
    if (selectedGroup) prevGroupMsgCount.current = 0;
    requestAnimationFrame(() => {
      if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    });
  }, [selected?.id, selectedGroup?.id]);

  const onChatScroll = () => {
    const box = chatBoxRef.current;
    if (!box) return;
    shouldStickBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  };

  const openInNewTab = () => window.open("/messages", "_blank", "noopener,noreferrer");

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((v) => !v);
    }
  };

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

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
      setAuthError("Ye demo email block hai");
      return;
    }
    if (users.find((u) => u.email.toLowerCase() === email)) {
      setAuthError("Account pehle se hai — Login use karo");
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
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const email = formEmail.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      setAuthError("Account nahi mila — pehle Sign Up");
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
    shouldStickBottom.current = true;
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
    shouldStickBottom.current = true;
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

  const persistGroups = (updated: Group[]) => {
    setGroups(updated);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(updated));
    if (selectedGroup) {
      const fresh = updated.find((g) => g.id === selectedGroup.id);
      if (fresh) setSelectedGroup(fresh);
    }
  };

  const addToGroup = (userId: string) => {
    if (!me || !selectedGroup) return;
    if (!selectedGroup.admins.includes(me.id)) {
      alert("Sirf group admin member add kar sakta hai");
      return;
    }
    if (selectedGroup.members.includes(userId)) {
      alert("Ye member pehle se group me hai");
      return;
    }
    const updated = groups.map((g) =>
      g.id === selectedGroup.id ? { ...g, members: [...g.members, userId] } : g
    );
    persistGroups(updated);
    setAddMemberQuery("");
  };

  const addMemberByQuery = () => {
    if (!me || !selectedGroup) return;
    if (!selectedGroup.admins.includes(me.id)) {
      alert("Sirf group admin member add kar sakta hai");
      return;
    }
    const q = addMemberQuery.trim().toLowerCase();
    if (!q) {
      alert("Gmail ya username likho");
      return;
    }

    let user = users.find(
      (u) =>
        u.email.toLowerCase() === q ||
        u.name.toLowerCase() === q ||
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
    );

    if (!user) {
      const email = q.includes("@") ? q : q + "@user.local";
      user = {
        id: "m_" + email.replace(/[^a-z0-9]/gi, "_"),
        name: q.includes("@") ? q.split("@")[0] : q,
        email,
        role: "Student",
        createdAt: new Date().toISOString(),
      };
      const nextUsers = [...users.filter((u) => u.email.toLowerCase() !== email), user];
      setUsers(nextUsers);
      localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
    }

    if (selectedGroup.members.includes(user.id)) {
      alert("Ye member pehle se group me hai");
      return;
    }

    const updated = groups.map((g) =>
      g.id === selectedGroup.id ? { ...g, members: [...g.members, user!.id] } : g
    );
    persistGroups(updated);
    setAddMemberQuery("");
  };

  const makeAdmin = (userId: string) => {
    if (!me || !selectedGroup || !selectedGroup.admins.includes(me.id)) return;
    if (selectedGroup.admins.includes(userId)) return;
    const updated = groups.map((g) =>
      g.id === selectedGroup.id ? { ...g, admins: [...g.admins, userId] } : g
    );
    persistGroups(updated);
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
    persistGroups(updated);
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

  const searchResults = users.filter((u) => {
    if (!me) return false;
    if (u.id === me.id || u.email.toLowerCase() === me.email.toLowerCase()) return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

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
          addMemberQuery.trim() !== "" &&
          (u.name.toLowerCase().includes(addMemberQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(addMemberQuery.toLowerCase()))
      )
    : [];

  if (showAuth || !me) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
        <div className="card shadow-lg">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">💬</div>
            <h1 className="text-xl font-bold text-navy-900">School Messenger</h1>
            <p className="text-sm text-slate-500 mt-1">Pehle account banao / login karo</p>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-slate-200 mb-5">
            <button onClick={() => { setAuthMode("signup"); setAuthError(""); }} className={`flex-1 py-2.5 text-sm font-semibold ${authMode === "signup" ? "bg-navy-800 text-white" : "bg-white text-slate-600"}`}>Sign Up</button>
            <button onClick={() => { setAuthMode("login"); setAuthError(""); }} className={`flex-1 py-2.5 text-sm font-semibold ${authMode === "login" ? "bg-navy-800 text-white" : "bg-white text-slate-600"}`}>Login</button>
          </div>
          {authError && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{authError}</div>}
          {authMode === "signup" ? (
            <form onSubmit={handleSignup} className="space-y-3">
              <div><label className="label">Full Name *</label><input className="input" required value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
              <div><label className="label">Gmail *</label><input className="input" type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} /></div>
              <div><label className="label">Password (optional)</label><input className="input" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} /></div>
              <div className="flex gap-2">
                {(["Student", "Teacher", "Principal"] as Role[]).map((r) => (
                  <button key={r} type="button" onClick={() => setFormRole(r)} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${formRole === r ? "bg-navy-800 text-white border-navy-800" : "bg-white border-slate-200"}`}>{r}</button>
                ))}
              </div>
              <button type="submit" className="btn btn-primary w-full py-3">Create Account</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <div><label className="label">Gmail *</label><input className="input" type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} /></div>
              <div><label className="label">Password</label><input className="input" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} /></div>
              <button type="submit" className="btn btn-primary w-full py-3">Login</button>
            </form>
          )}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-slate-400">OR</span></div>
          </div>
          <button onClick={() => signIn("google", { callbackUrl: "/messages" })} className="w-full border border-slate-200 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50">Continue with Google Gmail</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={isFullscreen ? "fixed inset-0 z-[100] bg-slate-100 px-3 flex flex-col" : "max-w-6xl mx-auto px-3 flex flex-col"}
      style={{ height: isFullscreen ? "100dvh" : "calc(100dvh - 64px)", overflow: "hidden" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 py-2 shrink-0">
        <div>
          <h1 className="text-base font-bold text-navy-900">💬 Messenger</h1>
          <p className="text-[11px] text-slate-500">{me.name} · {me.email}</p>
        </div>
        <div className="flex gap-1.5 items-center flex-wrap">
          {(["direct", "groups", "online"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setSelected(null); setSelectedGroup(null); }} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${tab === t ? "bg-navy-800 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
              {t === "direct" ? "Chat" : t === "groups" ? "Groups" : `Online (${onlineUsers.length})`}
            </button>
          ))}
          <button onClick={openInNewTab} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200">↗ New Tab</button>
          <button onClick={toggleFullscreen} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200">{isFullscreen ? "✕ Exit Full" : "⛶ Full Screen"}</button>
          <button onClick={logout} className="text-[11px] text-red-500 underline ml-1">Logout</button>
        </div>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-2 flex-1 min-h-0 overflow-hidden">
        <div className="card flex flex-col overflow-hidden p-0 min-h-0">
          {tab === "online" && (
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-3 py-2 text-[10px] font-bold text-green-700 bg-green-50 uppercase sticky top-0">Online</div>
              <div className="px-3 py-2 border-b flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <div><div className="text-sm font-medium">{me.name} (You)</div><div className="text-[10px] text-slate-400">{me.email}</div></div>
              </div>
              {onlineUsers.map((u) => (
                <button key={u.id} onClick={() => { setSelected(u); setTab("direct"); }} className="w-full text-left px-3 py-2.5 border-b hover:bg-slate-50 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <div><div className="text-sm font-medium">{u.name}</div><div className="text-[10px] text-slate-400">{u.email}</div></div>
                </button>
              ))}
              <div className="px-3 py-2 text-[10px] font-bold text-slate-500 bg-slate-50 uppercase sticky top-0">All ({users.length})</div>
              {users.filter((u) => u.id !== me.id).map((u) => (
                <button key={u.id} onClick={() => { setSelected(u); setTab("direct"); }} className="w-full text-left px-3 py-2 border-b hover:bg-slate-50">
                  <div className="text-sm font-medium">{u.name}</div>
                  <div className="text-[10px] text-slate-400">{u.email}</div>
                </button>
              ))}
            </div>
          )}

          {tab === "direct" && (
            <>
              <div className="p-2 border-b shrink-0">
                <input className="input text-sm" placeholder="Search Gmail / name..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
                {searchResults.map((u) => (
                  <button key={u.id} onClick={() => setSelected(u)} className={`w-full text-left px-3 py-2.5 border-b hover:bg-slate-50 ${selected?.id === u.id ? "bg-navy-50" : ""}`}>
                    <div className="flex items-center gap-2">
                      {onlineIds.includes(u.id) && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                      <div>
                        <div className="text-sm font-medium text-navy-900">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </button>
                ))}
                {searchResults.length === 0 && <p className="text-xs text-slate-400 text-center py-8 px-3">Koi registered account nahi</p>}
              </div>
            </>
          )}

          {tab === "groups" && (
            <>
              <div className="p-2 border-b shrink-0">
                <button onClick={() => setShowCreateGroup(true)} className="btn btn-primary text-xs w-full">+ Create Group</button>
              </div>
              {showCreateGroup && (
                <div className="p-3 border-b bg-slate-50 space-y-2 shrink-0">
                  <input className="input text-sm" placeholder="Group name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={createGroup} className="btn btn-primary text-xs flex-1">Create</button>
                    <button onClick={() => setShowCreateGroup(false)} className="btn btn-outline text-xs">Cancel</button>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
                {myGroups.map((g) => (
                  <button key={g.id} onClick={() => { setSelectedGroup(g); setShowMembers(false); }} className={`w-full text-left px-3 py-2.5 border-b hover:bg-slate-50 ${selectedGroup?.id === g.id ? "bg-navy-50" : ""}`}>
                    <div className="text-sm font-medium">{g.name}</div>
                    <div className="text-[10px] text-slate-400">{g.members.length} members</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card flex flex-col overflow-hidden p-0 min-h-0">
          {tab === "direct" && selected && (
            <>
              <div className="px-4 py-2.5 border-b shrink-0">
                <div className="font-semibold text-sm text-navy-900">{selected.name}</div>
                <div className="text-[10px] text-slate-400">{selected.email} · Private</div>
              </div>
              <div ref={chatBoxRef} onScroll={onChatScroll} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 min-h-0">
                {conversation.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No messages yet</p>}
                {conversation.map((m) => (
                  <div key={m.id} className={`flex ${m.fromId === me.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.fromId === me.id ? "bg-navy-800 text-white" : "bg-slate-100"}`}>
                      <div>{m.text}</div>
                      {renderMedia(m.type || "text", m.url, m.text)}
                      <div className={`text-[10px] mt-1 ${m.fromId === me.id ? "text-navy-200" : "text-slate-400"}`}>{m.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "groups" && selectedGroup && (
            <>
              <div className="px-4 py-2.5 border-b shrink-0">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold text-sm">{selectedGroup.name}</div>
                    <div className="text-[10px] text-slate-400">{selectedGroup.members.length} members</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowMembers(!showMembers)} className="text-xs text-navy-600 underline">Members</button>
                    {selectedGroup.admins.includes(me.id) && (
                      <button onClick={() => deleteGroup(selectedGroup.id)} className="text-xs text-red-500 underline">Delete</button>
                    )}
                  </div>
                </div>
                {showMembers && (
                  <div className="mt-2 p-2 bg-slate-50 rounded-lg text-sm space-y-2 max-h-48 overflow-y-auto">
                    {selectedGroup.members.map((mid) => {
                      const u = users.find((x) => x.id === mid);
                      const isAdmin = selectedGroup.admins.includes(mid);
                      return (
                        <div key={mid} className="flex justify-between items-center gap-2">
                          <span>
                            {u?.name || mid}{" "}
                            {isAdmin && <span className="text-[10px] text-purple-600 font-bold">ADMIN</span>}
                            <span className="text-[10px] text-slate-400 block">{u?.email}</span>
                          </span>
                          {selectedGroup.admins.includes(me.id) && mid !== me.id && (
                            <div className="flex gap-1 shrink-0">
                              {!isAdmin && (
                                <button type="button" onClick={() => makeAdmin(mid)} className="text-[10px] text-navy-600 underline">Admin</button>
                              )}
                              <button type="button" onClick={() => removeMember(mid)} className="text-[10px] text-red-500 underline">Remove</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {selectedGroup.admins.includes(me.id) && (
                      <div className="pt-2 border-t space-y-1.5">
                        <div className="flex gap-1">
                          <input
                            className="input text-xs flex-1"
                            placeholder="Gmail / username likho..."
                            value={addMemberQuery}
                            onChange={(e) => setAddMemberQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addMemberByQuery()}
                          />
                          <button type="button" onClick={addMemberByQuery} className="btn btn-primary text-xs px-3 shrink-0">
                            Add
                          </button>
                        </div>
                        {addCandidates.slice(0, 5).map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => addToGroup(u.id)}
                            className="block w-full text-left text-xs py-1.5 hover:bg-white px-2 rounded border border-slate-100"
                          >
                            + {u.name} <span className="text-slate-400">({u.email})</span>
                          </button>
                        ))}
                        {addMemberQuery.trim() && addCandidates.length === 0 && (
                          <p className="text-[10px] text-slate-400">Registered nahi — Add dabao, localStorage me save hoga</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div ref={chatBoxRef} onScroll={onChatScroll} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 min-h-0">
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
              </div>
            </>
          )}

          {((tab === "direct" && !selected) || (tab === "groups" && !selectedGroup) || tab === "online") && (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              <div className="text-center px-4">
                <div className="text-4xl mb-2">💬</div>
                <p>Account select karke chat shuru karo</p>
              </div>
            </div>
          )}

          {((tab === "direct" && selected) || (tab === "groups" && selectedGroup)) && (
            <div className="p-2.5 border-t shrink-0 space-y-1.5 bg-white">
              <div className="flex flex-wrap gap-1">
                {(["text", "link", "photo", "video", "file"] as const).map((t) => (
                  <button key={t} onClick={() => setAttachType(t)} className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${attachType === t ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-600"}`}>{t}</button>
                ))}
              </div>
              {attachType === "link" && <input className="input text-xs" placeholder="Paste link..." value={attachUrl} onChange={(e) => setAttachUrl(e.target.value)} />}
              {(attachType === "photo" || attachType === "video" || attachType === "file") && (
                <input type="file" className="input text-xs" accept={attachType === "photo" ? "image/*" : attachType === "video" ? "video/*" : "*/*"} onChange={handleFileAttach} />
              )}
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Message..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (tab === "groups" ? sendGroup() : sendDirect())} />
                <button onClick={tab === "groups" ? sendGroup : sendDirect} className="btn btn-primary px-4">Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
