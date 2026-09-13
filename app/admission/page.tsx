"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdmissionPage() {
  const [form, setForm] = useState({
    studentName: "", classApplying: "", fatherName: "", motherName: "",
    phone: "", address: "", gender: "", dob: "",
  });
  const [fileName, setFileName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = "ADM" + Date.now().toString().slice(-8);
    const list = JSON.parse(localStorage.getItem("admissions") || "[]");
    list.push({ ...form, id, documentName: fileName || "No file", status: "Pending", submittedAt: new Date().toISOString() });
    localStorage.setItem("admissions", JSON.stringify(list));
    setAppId(id);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-navy-900 mb-2">Application Submitted!</h2>
          <p className="text-sm text-slate-500 mb-1">Your Application ID</p>
          <p className="text-2xl font-bold text-saffron-600 mb-4">{appId}</p>
          <Link href="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900 text-center mb-2">Online Admission Form</h1>
      <p className="text-center text-slate-500 mb-8">Classes 1 to 12 · MGGEMS Lalchandpura</p>
      <form onSubmit={submit} className="card space-y-4">
        <h3 className="font-bold text-navy-800 border-b pb-2">Student Details</h3>
        <div><label className="label">Student Full Name *</label><input className="input" required value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Class Applying For *</label>
            <select className="input" required value={form.classApplying} onChange={(e) => setForm({ ...form, classApplying: e.target.value })}>
              <option value="">Select</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => <option key={c} value={String(c)}>Class {c}</option>)}
            </select>
          </div>
          <div><label className="label">Gender *</label>
            <select className="input" required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
        </div>
        <div><label className="label">Date of Birth *</label><input type="date" className="input" required value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></div>
        <h3 className="font-bold text-navy-800 border-b pb-2 pt-2">Parents&apos; Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Father&apos;s Name *</label><input className="input" required value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} /></div>
          <div><label className="label">Mother&apos;s Name</label><input className="input" value={form.motherName} onChange={(e) => setForm({ ...form, motherName: e.target.value })} /></div>
        </div>
        <div><label className="label">Contact Number *</label><input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" /></div>
        <div><label className="label">Full Address *</label><textarea className="input" required rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div><label className="label">Document Upload</label><input type="file" className="input" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} />{fileName && <p className="text-xs text-green-600 mt-1">Selected: {fileName}</p>}</div>
        <button type="submit" className="btn btn-primary w-full py-3">Submit Application</button>
      </form>
      <p className="text-center text-xs text-slate-400 mt-6">Staff review: <Link href="/admission/check" className="text-navy-600 underline">/admission/check</Link></p>
    </div>
  );
}
