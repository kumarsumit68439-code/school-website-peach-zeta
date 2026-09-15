"use client";

import { useMemo, useState } from "react";

/**
 * Real RBSE results live only on official Board / Shala Darpan servers.
 * This page never shows mock/demo marks — it opens the official roll-number result pages.
 */

const BOARD_BASE = "https://rajeduboard.rajasthan.gov.in";
const RESULT_2026 = `${BOARD_BASE}/RESULT2026`;
const RESULT_REV = `${BOARD_BASE}/RESULT2026/RL-RWH`;
const RESULT_SUPP = `${BOARD_BASE}/RESULTSUPP2026`;

type ExamOption = {
  id: string;
  label: string;
  group: string;
  /** Official roll-input page (real board data) */
  url: string;
  note?: string;
};

const EXAMS: ExamOption[] = [
  // Class 5 & 8 — Shala Darpan
  {
    id: "5",
    label: "Class 5 (Shala Darpan)",
    group: "Primary / Upper Primary",
    url: "https://rajshaladarpan.rajasthan.gov.in/",
    note: "Raj Shala Darpan pe Class 5 result — roll number se check",
  },
  {
    id: "8",
    label: "Class 8 (Shala Darpan)",
    group: "Primary / Upper Primary",
    url: "https://rajshaladarpan.rajasthan.gov.in/",
    note: "Raj Shala Darpan pe Class 8 result — roll number se check",
  },
  {
    id: "5-nic",
    label: "Class 5 / 8 (Shala Darpan NIC)",
    group: "Primary / Upper Primary",
    url: "https://rajshaladarpan.nic.in/",
    note: "Alternate official portal",
  },
  // Class 10 — Secondary 2026
  {
    id: "10",
    label: "Class 10 — Secondary & Vocational 2026",
    group: "Secondary (10th)",
    url: `${RESULT_2026}/SEV/Roll_Input.htm`,
    note: "Main Exam 2026 — enter roll number on board site",
  },
  {
    id: "10-rev",
    label: "Class 10 — RL / RWH / Revised 2026",
    group: "Secondary (10th)",
    url: `${RESULT_REV}/SEV/Roll_Input.htm`,
    note: "Revised / withheld results",
  },
  // Class 12 streams
  {
    id: "12-sci",
    label: "Class 12 — Science 2026",
    group: "Senior Secondary (12th)",
    url: `${RESULT_2026}/SCIENCE/Roll_Input.htm`,
    note: "Senior Secondary Science — roll number",
  },
  {
    id: "12-com",
    label: "Class 12 — Commerce 2026",
    group: "Senior Secondary (12th)",
    url: `${RESULT_2026}/COMM/Roll_Input.htm`,
    note: "Senior Secondary Commerce — roll number",
  },
  {
    id: "12-arts",
    label: "Class 12 — Arts 2026",
    group: "Senior Secondary (12th)",
    url: `${RESULT_2026}/ARTS/Roll_Input.htm`,
    note: "Senior Secondary Arts — roll number",
  },
  {
    id: "12-rev",
    label: "Class 12 — RL / RWH / Revised 2026",
    group: "Senior Secondary (12th)",
    url: `${RESULT_REV}/SRS/Roll_Input.htm`,
    note: "Revised senior secondary results",
  },
  // Other board exams
  {
    id: "prav",
    label: "Praveshika & Vocational 2026",
    group: "Other Board Exams",
    url: `${RESULT_2026}/PRAV/Roll_Input.htm`,
  },
  {
    id: "upd",
    label: "Varishtha Upadhyaya 2026",
    group: "Other Board Exams",
    url: `${RESULT_2026}/UPD/Roll_Input.htm`,
  },
  {
    id: "deaf-12",
    label: "Sr. Sec Deaf & Dumb / CWSN 2026",
    group: "Other Board Exams",
    url: `${RESULT_2026}/DEAFSRS/Roll_Input.htm`,
  },
  {
    id: "deaf-10",
    label: "Secondary Deaf & Dumb / CWSN 2026",
    group: "Other Board Exams",
    url: `${RESULT_2026}/DEAFSEC/Roll_Input.htm`,
  },
  // Hub pages
  {
    id: "hub-2026",
    label: "All Main Results 2026 (Board hub)",
    group: "Official Hubs",
    url: `${RESULT_2026}/Result2026.htm`,
    note: "Complete list of 2026 result links",
  },
  {
    id: "hub-main",
    label: "RBSE Board Home",
    group: "Official Hubs",
    url: `${BOARD_BASE}/main.asp`,
  },
  {
    id: "digilocker",
    label: "DigiLocker (digital marksheet)",
    group: "Official Hubs",
    url: "https://www.digilocker.gov.in/",
    note: "Board certificates also on DigiLocker / Raj eVault",
  },
];

const GROUPS = Array.from(new Set(EXAMS.map((e) => e.group)));

export default function ResultPage() {
  const [examId, setExamId] = useState("10");
  const [roll, setRoll] = useState("");
  const [opened, setOpened] = useState(false);

  const exam = useMemo(
    () => EXAMS.find((e) => e.id === examId) || EXAMS[0],
    [examId]
  );

  const openOfficial = () => {
    // Real results only on board server — open official roll-input page
    window.open(exam.url, "_blank", "noopener,noreferrer");
    setOpened(true);
  };

  const openWithHint = (e: React.FormEvent) => {
    e.preventDefault();
    openOfficial();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900 text-center mb-2">
        RBSE Real Results
      </h1>
      <p className="text-center text-slate-500 mb-2">
        Rajasthan Board (BSER Ajmer) · Class 5, 8, 10, 12 · Official data only
      </p>
      <p className="text-center text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-8">
        ✅ No mock / demo / fake marks on this site. Results open on{" "}
        <strong>rajeduboard.rajasthan.gov.in</strong> /{" "}
        <strong>rajshaladarpan</strong> — enter your real roll number there.
      </p>

      <form onSubmit={openWithHint} className="card mb-8 space-y-4">
        <div>
          <label className="label">Exam / Class *</label>
          <select
            className="input"
            value={examId}
            onChange={(e) => {
              setExamId(e.target.value);
              setOpened(false);
            }}
          >
            {GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {EXAMS.filter((ex) => ex.group === g).map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Roll Number (admit card pe likha hua)</label>
          <input
            className="input"
            value={roll}
            onChange={(e) => setRoll(e.target.value.replace(/\s/g, ""))}
            placeholder="e.g. 1234567"
            inputMode="numeric"
            autoComplete="off"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Roll number board site pe type karna hoga (security / captcha ke liye). Yahan
            sirf reminder ke liye save ho sakta hai.
          </p>
        </div>

        {exam.note && (
          <p className="text-xs text-navy-700 bg-navy-50 rounded-lg px-3 py-2">{exam.note}</p>
        )}

        {roll && (
          <p className="text-sm text-slate-600">
            Aapka roll: <span className="font-mono font-semibold text-navy-900">{roll}</span>{" "}
            — board page khulne ke baad yahi number enter karo.
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full py-3">
          Open Official Result Page → Enter Roll Number
        </button>
      </form>

      {opened && (
        <div className="bg-blue-50 text-blue-900 rounded-lg p-4 text-sm mb-8 space-y-2">
          <p className="font-semibold">Board page new tab me khulni chahiye.</p>
          <ol className="list-decimal pl-5 space-y-1 text-xs">
            <li>Nayi tab me official form dikhega</li>
            <li>
              Roll number box me{" "}
              {roll ? (
                <>
                  <strong className="font-mono">{roll}</strong> type karo
                </>
              ) : (
                "apna roll number type karo"
              )}
            </li>
            <li>Submit dabao — real marksheet board server se aayegi</li>
          </ol>
          <button type="button" onClick={openOfficial} className="text-xs underline font-semibold">
            Phir se official page kholo
          </button>
        </div>
      )}

      <div className="card mb-6">
        <h2 className="font-bold text-navy-900 mb-3">📋 Quick official links (2026)</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { label: "10th Secondary", href: `${RESULT_2026}/SEV/Roll_Input.htm` },
            { label: "12th Science", href: `${RESULT_2026}/SCIENCE/Roll_Input.htm` },
            { label: "12th Commerce", href: `${RESULT_2026}/COMM/Roll_Input.htm` },
            { label: "12th Arts", href: `${RESULT_2026}/ARTS/Roll_Input.htm` },
            { label: "All Results Hub 2026", href: `${RESULT_2026}/Result2026.htm` },
            { label: "Shala Darpan (5th/8th)", href: "https://rajshaladarpan.rajasthan.gov.in/" },
            { label: "Board Home", href: `${BOARD_BASE}/main.asp` },
            { label: "DigiLocker", href: "https://www.digilocker.gov.in/" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline text-center text-sm py-2.5"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <div className="card text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-700">Important</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            Real result data sirf Rajasthan Board / Shala Darpan ke servers pe hai — koi private
            website poora board database legally host nahi karti.
          </li>
          <li>Online result immediate information ke liye hai; original marksheet board se alag aati hai.</li>
          <li>Wrong roll / captcha fail hone par board page pe hi error dikhega.</li>
          <li>School: Mahatma Gandhi Government English Medium School, Lalchandpura, Jaipur</li>
        </ul>
      </div>
    </div>
  );
}
