"use client";

import { useState } from "react";

type ResultData = { name: string; roll: string; class: string; percentage: number; division: string; subjects: { name: string; marks: number; max: number }[] };

const mockResults: Record<string, ResultData> = {
  "1001": { name: "Rahul Sharma", roll: "1001", class: "10", percentage: 78.5, division: "First Division", subjects: [{ name: "Hindi", marks: 82, max: 100 }, { name: "English", marks: 75, max: 100 }, { name: "Mathematics", marks: 88, max: 100 }, { name: "Science", marks: 72, max: 100 }, { name: "Social Science", marks: 76, max: 100 }] },
  "2001": { name: "Priya Verma", roll: "2001", class: "12", percentage: 85.2, division: "First Division with Distinction", subjects: [{ name: "English", marks: 88, max: 100 }, { name: "Physics", marks: 82, max: 100 }, { name: "Chemistry", marks: 90, max: 100 }, { name: "Mathematics", marks: 84, max: 100 }, { name: "Computer Science", marks: 82, max: 100 }] },
  "501": { name: "Aman Kumar", roll: "501", class: "5", percentage: 72.0, division: "First Division", subjects: [{ name: "Hindi", marks: 70, max: 100 }, { name: "English", marks: 68, max: 100 }, { name: "Maths", marks: 80, max: 100 }, { name: "EVS", marks: 70, max: 100 }] },
  "801": { name: "Sneha Patel", roll: "801", class: "8", percentage: 81.5, division: "First Division", subjects: [{ name: "Hindi", marks: 85, max: 100 }, { name: "English", marks: 78, max: 100 }, { name: "Maths", marks: 88, max: 100 }, { name: "Science", marks: 80, max: 100 }, { name: "Social Science", marks: 77, max: 100 }] },
};

export default function ResultPage() {
  const [roll, setRoll] = useState("");
  const [cls, setCls] = useState("10");
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState("");

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    const found = mockResults[roll.trim()];
    if (found && found.class === cls) setResult(found);
    else if (found) setError(`Roll found but for Class ${found.class}. Select correct class.`);
    else setError("No mock result. Try: 501 (5th), 801 (8th), 1001 (10th), 2001 (12th)");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900 text-center mb-2">RBSE Results Dashboard</h1>
      <p className="text-center text-slate-500 mb-8">Classes 5th, 8th, 10th & 12th · Mock + Official Links</p>
      <form onSubmit={search} className="card mb-8 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Class *</label>
            <select className="input" value={cls} onChange={(e) => setCls(e.target.value)}>
              <option value="5">Class 5</option><option value="8">Class 8</option><option value="10">Class 10</option><option value="12">Class 12</option>
            </select>
          </div>
          <div><label className="label">Roll Number *</label><input className="input" required value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="Enter roll number" /></div>
        </div>
        <button type="submit" className="btn btn-primary w-full">Check Result</button>
      </form>
      {error && <div className="bg-amber-50 text-amber-800 rounded-lg p-4 text-sm mb-6">{error}</div>}
      {result && (
        <div className="card mb-8">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
            <div><h2 className="text-xl font-bold text-navy-900">{result.name}</h2><p className="text-sm text-slate-500">Roll: {result.roll} · Class {result.class}</p></div>
            <div className="text-right"><div className="text-2xl font-bold text-navy-800">{result.percentage}%</div><div className="text-sm text-saffron-600 font-semibold">{result.division}</div></div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="py-2">Subject</th><th className="py-2">Marks</th><th className="py-2">Max</th></tr></thead>
            <tbody>{result.subjects.map((s) => (<tr key={s.name} className="border-b border-slate-50"><td className="py-2 font-medium">{s.name}</td><td className="py-2">{s.marks}</td><td className="py-2 text-slate-400">{s.max}</td></tr>))}</tbody>
          </table>
          <p className="text-xs text-slate-400 mt-4">* Mock result for demo. Verify on official portals.</p>
        </div>
      )}
      <div className="card">
        <h2 className="font-bold text-navy-900 mb-4">🔗 Official Government Portals</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <a href="https://rajshaladarpan.rajasthan.gov.in" target="_blank" rel="noopener noreferrer" className="btn btn-outline text-center">Raj Shala Darpan<span className="block text-[10px] font-normal text-slate-400">Class 5th & 8th</span></a>
          <a href="https://rajeduboard.rajasthan.gov.in" target="_blank" rel="noopener noreferrer" className="btn btn-outline text-center">RajEduBoard<span className="block text-[10px] font-normal text-slate-400">Class 10th & 12th</span></a>
        </div>
      </div>
    </div>
  );
}
