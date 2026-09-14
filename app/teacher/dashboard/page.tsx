"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StorageSelector from "@/components/StorageSelector";
import { supabase } from "@/lib/supabase";

type Doc = {
  id: string;
  name: string;
  type: string;
  uploadedBy: string;
  role: string;
  date: string;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [role, setRole] = useState<"Teacher" | "Principal">("Teacher");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [search, setSearch] = useState("");
  const [fileName, setFileName] = useState("");
  const [stats, setStats] = useState({ admissions: 0, pending: 0, notices: 0 });
  const [cloudNote, setCloudNote] = useState("");

  const loadData = useCallback(() => {
    setDocs(JSON.parse(localStorage.getItem("schoolDocs") || "[]"));
    const adm =
      JSON.parse(localStorage.getItem("schoolAdmissions") || "null") ||
      JSON.parse(localStorage.getItem("admissions") || "[]");
    const ntc = JSON.parse(localStorage.getItem("schoolNotices") || "[]");
    setStats({
      admissions: adm.length,
      pending: adm.filter((a: { status: string }) => a.status === "Pending" || a.status === "pending")
        .length,
      notices: ntc.length,
    });
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    loadData();
    const onSync = () => loadData();
    window.addEventListener("school-data-synced", onSync);
    const t = setInterval(loadData, 5000);
    return () => {
      window.removeEventListener("school-data-synced", onSync);
      clearInterval(t);
    };
  }, [loadData]);

  const upload = async () => {
    if (!fileName) return;
    const newDoc: Doc = {
      id: Date.now().toString(),
      name: fileName,
      type: fileName.split(".").pop()?.toUpperCase() || "FILE",
      uploadedBy: session?.user?.name || "Staff",
      role,
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = [newDoc, ...docs];
    setDocs(updated);
    localStorage.setItem("schoolDocs", JSON.stringify(updated));

    // Real cloud write
    try {
      await supabase.from("staff_docs").upsert({
        id: newDoc.id,
        name: newDoc.name,
        file_type: newDoc.type,
        uploaded_by: newDoc.uploadedBy,
        role: newDoc.role,
        doc_date: newDoc.date,
      });
      setCloudNote("✅ Saved to cloud (Supabase)");
    } catch {
      setCloudNote("Saved locally — cloud sync background me hoga");
    }
    setFileName("");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    const updated = docs.filter((d) => d.id !== id);
    setDocs(updated);
    localStorage.setItem("schoolDocs", JSON.stringify(updated));
    try {
      await supabase.from("staff_docs").delete().eq("id", id);
    } catch {
      /* ignore */
    }
  };

  const filtered = docs.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.uploadedBy.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading")
    return <div className="text-center py-20 text-slate-500">Loading...</div>;
  if (!session) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900 text-center mb-1">Staff Dashboard</h1>
      <p className="text-center text-slate-500 mb-6">Welcome, {session.user?.name}</p>

      <StorageSelector />

      <div className="flex justify-center gap-2 mb-8">
        {(["Teacher", "Principal"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              role === r ? "bg-navy-800 text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Applications", value: stats.admissions, color: "text-blue-600" },
          { label: "Pending", value: stats.pending, color: "text-amber-600" },
          { label: "Notices", value: stats.notices, color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Link href="/admission/check" className="card hover:shadow-md text-center py-6">
          <div className="text-3xl mb-2">📋</div>
          <div className="font-semibold text-navy-900">Admission Review</div>
        </Link>
        <Link href="/notice" className="card hover:shadow-md text-center py-6">
          <div className="text-3xl mb-2">📢</div>
          <div className="font-semibold text-navy-900">Manage Notices</div>
        </Link>
        <Link href="/messages" className="card hover:shadow-md text-center py-6">
          <div className="text-3xl mb-2">💬</div>
          <div className="font-semibold text-navy-900">Messages</div>
        </Link>
      </div>

      <div className="card mb-6">
        <h2 className="font-bold text-navy-900 mb-4">📁 Document Upload ({role})</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Select File</label>
            <input
              type="file"
              className="input"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
            />
          </div>
          <button onClick={upload} disabled={!fileName} className="btn btn-primary">
            Upload
          </button>
        </div>
        {cloudNote && <p className="text-xs text-green-700 mt-2">{cloudNote}</p>}
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-navy-900">Uploaded Documents</h2>
          <input
            className="input max-w-xs"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No documents yet.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50">
                <div>
                  <div className="font-medium text-sm text-navy-900">{d.name}</div>
                  <div className="text-xs text-slate-400">
                    {d.type} · {d.uploadedBy} ({d.role}) · {d.date}
                  </div>
                </div>
                <button
                  onClick={() => remove(d.id)}
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
