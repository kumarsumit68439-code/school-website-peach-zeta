"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StorageSelector from "@/components/StorageSelector";
import Link from "next/link";

type App = {
  id: string;
  studentName: string;
  fatherName: string;
  classApplying: string;
  phone: string;
  status: string;
  documentName?: string;
  submittedAt: string;
};

export default function AdmissionCheckPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("admissions") || "[]");
    setApps([...data].reverse());
  }, []);

  const update = (id: string, newStatus: string) => {
    const all = JSON.parse(localStorage.getItem("admissions") || "[]");
    const updated = all.map((a: App) =>
      a.id === id ? { ...a, status: newStatus } : a
    );
    localStorage.setItem("admissions", JSON.stringify(updated));
    setApps([...updated].reverse());
  };

  const remove = (id: string) => {
    if (!confirm("Delete this application permanently?")) return;
    const all = JSON.parse(localStorage.getItem("admissions") || "[]");
    const updated = all.filter((a: App) => a.id !== id);
    localStorage.setItem("admissions", JSON.stringify(updated));
    setApps([...updated].reverse());
  };

  if (status === "loading")
    return <div className="text-center py-20 text-slate-500">Loading...</div>;
  if (!session) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900 text-center mb-2">
        Admission Review Panel
      </h1>
      <p className="text-center text-slate-500 mb-6">
        Approve, Reject or Delete applications
      </p>
      <StorageSelector />

      {apps.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500 mb-4">No applications yet.</p>
          <Link href="/admission" className="btn btn-primary">
            Go to Admission Form
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-xl shadow-sm overflow-hidden">
            <thead>
              <tr className="bg-navy-900 text-white text-left">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Father</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">
                    {a.id}
                  </td>
                  <td className="px-4 py-3">{a.studentName}</td>
                  <td className="px-4 py-3">{a.fatherName}</td>
                  <td className="px-4 py-3">{a.classApplying}</td>
                  <td className="px-4 py-3">{a.phone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        a.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : a.status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => update(a.id, "Approved")}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => update(a.id, "Rejected")}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => remove(a.id)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
