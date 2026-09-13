"use client";

import Link from "next/link";

export default function MistakesHome() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900 text-center mb-2">
        ⚠️ Student Mistakes / Discipline
      </h1>
      <p className="text-center text-slate-500 mb-10">
        Record & review student discipline issues
      </p>

      <div className="grid sm:grid-cols-2 gap-5">
        <Link
          href="/mistakes/upload"
          className="card hover:shadow-md transition text-center py-10 border-2 border-transparent hover:border-red-200"
        >
          <div className="text-4xl mb-3">📝</div>
          <h2 className="font-bold text-navy-900 text-lg">Upload Mistake</h2>
          <p className="text-sm text-slate-500 mt-1">
            Teacher / Principal — name, class, roll, photo, video, text
          </p>
        </Link>

        <Link
          href="/mistakes/check"
          className="card hover:shadow-md transition text-center py-10 border-2 border-transparent hover:border-navy-200"
        >
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="font-bold text-navy-900 text-lg">Check Mistakes</h2>
          <p className="text-sm text-slate-500 mt-1">
            Students / Parents / Teachers — search & review
          </p>
        </Link>
      </div>
    </div>
  );
}
