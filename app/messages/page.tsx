"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

type Role = "Student" | "Teacher" | "Principal";

type ChatUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastSeen?: number;
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

export default function MessagesPage() {
  const { data: session, status: authStatus } = useSession();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [me, setMe] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);

  const [tab, setTab] = useState<"direct" | "groups" | "online">("direct");
  const [selected, setSelected] = useState<ChatUser | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [attachType, setAttachType] = useState<"text" | "link" | "photo" | "video" | "file">("text");
  const [attachUrl, setAttachUrl] = useState("");
  const [attachFileName, setAttachFileName] = useState("");

  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupRole, setSetupRole] = useState<Role>("Student");
  const [showSetup, setShowSetup] = useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [addMemberQuery, setAddMemberQuery] = useState("");
  const [showMembers, setShowMembers] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const loadAll = () => {
    setUsers(JSON.parse(localStorage.getItem(USERS_KEY) || "[]"));
    setMessages(JSON.parse(localStorage.getItem(MSGS_KEY) || "[]"));
    setGroups(JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]"));
    setGroupMessages(JSON.parse(localStorage.getItem(GMSGS_KEY) || "[]"));
    setOnlineIds(JSON.parse(localStorage.getItem(ONLINE_KEY) || "[]"));
  };

  useEffect(() => {
    loadAll();
    const savedMe = JSON.parse(localStorage.getItem(ME_KEY) || "null");
    if (savedMe) setMe(savedMe);
  }, []);

  // Heartbeat: mark me online
  useEffect(() => {
    if (!me) return;
    const beat = () => {
      const online: { id: string; at: number }[] = JSON.parse(localStorage.getItem(ONLINE_KEY + "_raw") || "[]");
      const filtered = online.filter((o) => Date.now() - o.at < 15000 && o.id !== me.id);
      filtered.push({ id: me.id, at: Date.now() });
      localStorage.setItem(ONLINE_KEY + "_raw", JSON.stringify(filtered));
      localStorage.setItem(ONLINE_KEY, JSON.stringify(filtered.map((o) => o.id)));
      setOnlineIds(filtered.map((o) => o.id));
    };
    beat();
    const t = setInterval(beat, 5000);
    return () => clearInterval(t);
  }, [me]);

  // Real-time poll
  useEffect(() => {
    const t = setInterval(loadAll, 2000);
    return () => clearInterval(t);
  }, []);

  // Google session → register
  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.user?.email) return;
    const email = session.user.email.toLowerCase();
    const name = session.user.name || email.split("@")[0];
    setUsers((prev) => {
      const existing = prev.find((u) => u.email.toLowerCase() === email);
      const user: ChatUser = existing
        ? { ...existing, name, lastSeen: Date.now() }
        : { id: "g_" + email.replace(/[^a-z0-9]/gi, "_"), name, email, role: "Student", lastSeen: Date.now() };
      const updated = [...prev.filter((u) => u.email.toLowerCase() !== email), user];
      localStorage.setItem(USERS_KEY, JSON.stringify(updated));
      const savedMe = JSON.parse(localStorage.getItem(ME_KEY) || "null");
      if (!savedMe || savedMe.email?.toLowerCase() === email) {
        setMe(user);
        localStorage.setItem(ME_KEY, JSON.stringify(user));
        setShowSetup(false);
      }
      return updated;
    });
  }, [session, authStatus]);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (!JSON.parse(localStorage.getItem(ME_KEY) || "null") && !session?.user) setShowSetup(true);
  }, [authStatus, session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, groupMessages, selected, selectedGroup]);

  const registerUser = (user: ChatUser) => {
    setUsers((prev) => {
      const updated = [...prev.filter((u) => u.email.toLowerCase() !== user.email.toLowerCase()), user];
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
    registerUser(
      existing
        ? { ...existing, name: setupName.trim(), role: setupRole }
        : { id: "u_" + Date.now(), name: setupName.trim(), email, role: setupRole }
    );
  };

  const useGoogleIdentity = () => {
    if (!session?.user?.email) return;
    const email = session.user.email.toLowerCase();
    const name = session.user.name || email.split("@")[0];
    const existing = users.find((u) => u.email.toLowerCase() === email);
    registerUser(
      existing
        ? { ...existing, name, role: setupRole }
        : { id: "g_" + email.replace(/[^a-z0-9]/gi, "_"), name, email, role: setupRole }
    );
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
    if (attachType !== "text" && !attachUrl && !text.trim()) return;

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
    if (!g || !g.admins.includes(me.id)) {
      alert("Only group admin can delete");
      return;
    }
    if (!confirm("Delete this group and all messages?")) return;
    const updated = groups.filter((x) => x.id !== gid);
    setGroups(updated);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(updated));
    const msgs = groupMessages.filter((m) => m.groupId !== gid);
    setGroupMessages(msgs);
    localStorage.setItem(GMSGS_KEY, JSON.stringify(msgs));
    if (selectedGroup?.id === gid) setSelectedGroup(null);
  };

  const addToGroup = (userId: string) => {
    if (!me || !selectedGroup) return;
    if (!selectedGroup.admins.includes(me.id)) {
      alert("Only admin can add members");
      return;
    }
    if (selectedGroup.members.includes(userId)) return;
    const updated = groups.map((g) =>
      g.id === selectedGroup.id ? { ...g, members: [...g.members, userId] } : g
    );
    setGroups(updated);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(updated));
    const fresh = updated.find((g) => g.id === selectedGroup.id)!;
    setSelectedGroup(fresh);
    setAddMemberQuery("");
  };

  const makeAdmin = (userId: string) => {
    if (!me || !selectedGroup) return;
    if (!selectedGroup.admins.includes(me.id)) {
      alert("Only admin can promote");
      return;
    }
    if (selectedGroup.admins.includes(userId)) return;
    const updated = groups.map((g) =>
      g.id === selectedGroup.id ? { ...g, admins: [...g.admins, userId] } : g
    );
    setGroups(updated);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(updated));
    setSelectedGroup(updated.find((g) => g.id === selectedGroup.id)!);
  };

  const removeMember = (userId: string) => {
    if (!me || !selectedGroup) return;
    if (!selectedGroup.admins.includes(me.id)) return;
    if (userId === selectedGroup.createdBy) {
      alert("Cannot remove group creator");
      return;
    }
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
    if (type === "photo")
      return <img src={url} alt="" className="max-h-40 rounded-lg mt-1 border" />;
    if (type === "video")
      return url.includes("youtube") || url.includes("youtu.be") ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline block mt-1">
          🎬 Open video
        </a>
      ) : (
        <video src={url} controls className="max-h-40 rounded-lg mt-1 w-full" />
      );
    if (type === "link")
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline break-all block mt-1">
          🔗 {url}
        </a>
      );
    if (type === "file")
      return (
        <a href={url} download={label} className="text-xs underline block mt-1">
          📎 {label || "Download file"}
        </a>
      );
    return null;
  };

  const myGroups = me ? groups.filter((g) => g.members.includes(me.id)) : [];
  const onlineUsers = users.filter((u) => onlineIds.includes(u.id) && u.id !== me?.id);

  const filteredUsers = users.filter((u) => {
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

  const gConversation = selectedGroup
    ? groupMessages
        .filter((m) => m.groupId === selectedGroup.id)
        .sort((a, b) => a.timestamp - b.timestamp)
    : [];

  const addCandidates = selectedGroup
    ? users.filter(
        (u) =>
          !selectedGroup.members.includes(u.id) &&
          (u.name.toLowerCase().includes(addMemberQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(addMemberQuery.toLowerCase()))
      )
    : [];

  if (showSetup || !me) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="card shadow-lg text-center">
          <div className="text-4xl mb-3">💬</div>
          <h1 className="text-xl font-bold text-navy-900 mb-1">School Messenger</h1>
          <p className="text-sm text-slate-500 mb-6">Register to chat, join groups & see online users</p>
          {session?.user && (
            <div className="mb-5 p-3 rounded-lg bg-navy-50 border border-navy-100 text-left">
              <p className="text-xs text-navy-600 mb-1">Google:</p>
              <p className="text-sm font-semibold">{session.user.name}</p>
              <p className="text-xs text-slate-500 mb-3">{session.user.email}</p>
              <div className="flex gap-2 mb-2">
                {(["Student", "Teacher", "Principal"] as Role[]).map((r) => (
                  <button key={r} type="button" onClick={() => setSetupRole(r)} className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold border ${setupRole === r ? "bg-navy-800 text-white border-navy-800" : "bg-white border-slate-200"}`}>{r}</button>
                ))}
              </div>
              <button onClick={useGoogleIdentity} className="btn btn-primary w-full text-sm">Continue with Google</button>
            </div>
          )}
          <div className="space-y-3 text-left">
            <div><label className="label">Name *</label><input className="input" value={setupName} onChange={(e) => setSetupName(e.target.value)} /></div>
            <div><label className="label">Gmail *</label><input className="input" value={setupEmail} onChange={(e) => setSetupEmail(e.target.value)} /></div>
            <div className="flex gap-2">
              {(["Student", "Teacher", "Principal"] as Role[]).map((r) => (
                <button key={r} type="button" onClick={() => setSetupRole(r)} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${setupRole === r ? "bg-navy-800 text-white border-navy-800" : "bg-white border-slate-200"}`}>{r}</button>
              ))}
            </div>
            <button onClick={saveMe} className="btn btn-primary w-full">Continue</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4" style={{ height: "calc(100vh - 100px)" }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h1 className="text-lg font-bold text-navy-900">💬 Messenger</h1>
          <p className="text-xs text-slate-500">{me.name} ({me.role}) · {me.email}</p>
        </div>
        <div className="flex gap-2">
          {(["direct", "groups", "online"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelected(null); setSelectedGroup(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                tab === t ? "bg-navy-800 text-white" : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              {t === "direct" ? "Chat" : t === "groups" ? "Groups" : `Online (${onlineUsers.length})`}
            </button>
          ))}
          <button onClick={() => setShowSetup(true)} className="text-xs text-navy-600 underline">Switch</button>
        </div>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-3 h-[calc(100%-48px)]">
        {/* LEFT PANEL */}
        <div className="card flex flex-col overflow-hidden p-0">
          {tab === "online" && (
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-2 text-[10px] font-bold text-green-700 bg-green-50 uppercase">
                Online now ({onlineUsers.length + 1} including you)
              </div>
              <div className="px-3 py-2 border-b border-slate-50 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <div>
                  <div className="text-sm font-medium">{me.name} (You)</div>
                  <div className="text-[10px] text-slate-400">{me.email}</div>
                </div>
              </div>
              {onlineUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setSelected(u); setTab("direct"); }}
                  className="w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <div className="text-sm font-medium text-navy-900">{u.name}</div>
                    <div className="text-[10px] text-slate-400">{u.email} · {u.role}</div>
                  </div>
                </button>
              ))}
              {onlineUsers.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">Only you are online right now</p>
              )}
              <div className="px-3 py-2 text-[10px] font-bold text-slate-500 bg-slate-50 uppercase mt-2">
                All registered ({users.length})
              </div>
              {users.filter((u) => u.id !== me.id).map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setSelected(u); setTab("direct"); }}
                  className="w-full text-left px-3 py-2 border-b border-slate-50 hover:bg-slate-50"
                >
                  <div className="text-sm font-medium">{u.name}</div>
                  <div className="text-[10px] text-slate-400">{u.email}</div>
                </button>
              ))}
            </div>
          )}

          {tab === "direct" && (
            <>
              <div className="p-2 border-b">
                <input className="input text-sm" placeholder="Search Gmail / name..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 ${selected?.id === u.id ? "bg-navy-50" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {onlineIds.includes(u.id) && <span className="w-2 h-2 rounded-full bg-green-500" />}
                      <div>
                        <div className="text-sm font-medium text-navy-900">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8">No users yet. Others must register / Google login.</p>
                )}
              </div>
            </>
          )}

          {tab === "groups" && (
            <>
              <div className="p-2 border-b flex gap-2">
                <button onClick={() => setShowCreateGroup(true)} className="btn btn-primary text-xs flex-1">+ Create Group</button>
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
                  <button
                    key={g.id}
                    onClick={() => { setSelectedGroup(g); setShowMembers(false); }}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 ${selectedGroup?.id === g.id ? "bg-navy-50" : ""}`}
                  >
                    <div className="text-sm font-medium text-navy-900">{g.name}</div>
                    <div className="text-[10px] text-slate-400">{g.members.length} members · {g.admins.includes(me.id) ? "Admin" : "Member"}</div>
                  </button>
                ))}
                {myGroups.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8">No groups. Create one!</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="card flex flex-col overflow-hidden p-0">
          {/* DIRECT CHAT */}
          {tab === "direct" && selected && (
            <>
              <div className="px-4 py-3 border-b flex items-center gap-2">
                {onlineIds.includes(selected.id) && <span className="w-2 h-2 rounded-full bg-green-500" />}
                <div>
                  <div className="font-semibold text-sm text-navy-900">{selected.name}</div>
                  <div className="text-[10px] text-slate-400">{selected.email}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

          {/* GROUP CHAT */}
          {tab === "groups" && selectedGroup && (
            <>
              <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-navy-900">{selectedGroup.name}</div>
                    <div className="text-[10px] text-slate-400">{selectedGroup.members.length} members</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowMembers(!showMembers)} className="text-xs text-navy-600 underline">
                      Members
                    </button>
                    {selectedGroup.admins.includes(me.id) && (
                      <button onClick={() => deleteGroup(selectedGroup.id)} className="text-xs text-red-500 underline">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {showMembers && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase">Members ({selectedGroup.members.length})</p>
                    {selectedGroup.members.map((mid) => {
                      const u = users.find((x) => x.id === mid);
                      const isAdmin = selectedGroup.admins.includes(mid);
                      return (
                        <div key={mid} className="flex items-center justify-between">
                          <span>
                            {u?.name || mid} {isAdmin && <span className="text-[10px] text-purple-600 font-bold">ADMIN</span>}
                            <span className="text-[10px] text-slate-400 block">{u?.email}</span>
                          </span>
                          {selectedGroup.admins.includes(me.id) && mid !== me.id && (
                            <div className="flex gap-1">
                              {!isAdmin && (
                                <button onClick={() => makeAdmin(mid)} className="text-[10px] text-navy-600 underline">Make admin</button>
                              )}
                              <button onClick={() => removeMember(mid)} className="text-[10px] text-red-500 underline">Remove</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {selectedGroup.admins.includes(me.id) && (
                      <div className="pt-2 border-t">
                        <input
                          className="input text-xs mb-1"
                          placeholder="Add by Gmail / name..."
                          value={addMemberQuery}
                          onChange={(e) => setAddMemberQuery(e.target.value)}
                        />
                        {addMemberQuery && addCandidates.slice(0, 5).map((u) => (
                          <button key={u.id} onClick={() => addToGroup(u.id)} className="block w-full text-left text-xs py-1 hover:bg-white px-2 rounded">
                            + {u.name} ({u.email})
                          </button>
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
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p>{tab === "online" ? "Select a user to chat" : tab === "groups" ? "Select or create a group" : "Search & select a person"}</p>
              </div>
            </div>
          )}

          {/* INPUT BAR */}
          {((tab === "direct" && selected) || (tab === "groups" && selectedGroup)) && (
            <div className="p-3 border-t space-y-2">
              <div className="flex flex-wrap gap-1">
                {(["text", "link", "photo", "video", "file"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAttachType(t)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${attachType === t ? "bg-navy-800 text-white" : "bg-slate-100 text-slate-600"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {attachType === "link" && (
                <input className="input text-xs" placeholder="Paste link URL..." value={attachUrl} onChange={(e) => setAttachUrl(e.target.value)} />
              )}
              {(attachType === "photo" || attachType === "video" || attachType === "file") && (
                <input type="file" className="input text-xs" accept={attachType === "photo" ? "image/*" : attachType === "video" ? "video/*" : "*/*"} onChange={handleFileAttach} />
              )}
              {attachFileName && <p className="text-[10px] text-green-600">Attached: {attachFileName}</p>}
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder={attachType === "text" ? "Type message..." : "Caption (optional)..."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (tab === "groups" ? sendGroup() : sendDirect())}
                />
                <button onClick={tab === "groups" ? sendGroup : sendDirect} className="btn btn-primary px-5">Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
