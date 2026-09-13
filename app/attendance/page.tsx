"use client";

import Link from "next/link";

export default function AttendanceHome() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900 text-center mb-2">
        📋 Online Attendance
      </h1>
      <p className="text-center text-slate-500 mb-10">
        MGGEMS Lalchandpura · Period-wise attendance
      </p>

      <div className="grid sm:grid-cols-2 gap-5">
        <Link
          href="/attendance/mark"
          className="card hover:shadow-md transition text-center py-10 border-2 border-transparent hover:border-navy-200"
        >
          <div className="text-4xl mb-3">👨‍🏫</div>
          <h2 className="font-bold text-navy-900 text-lg">Mark Attendance</h2>
          <p className="text-sm text-slate-500 mt-1">
            Teachers / Principal — name, photo & period
          </p>
        </Link>

        <Link
          href="/attendance/check"
          className="card hover:shadow-md transition text-center py-10 border-2 border-transparent hover:border-saffron-300"
        >
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="font-bold text-navy-900 text-lg">Check Attendance</h2>
          <p className="text-sm text-slate-500 mt-1">
            Students — view periods completed
          </p>
        </Link>
      </div>

      <div className="card mt-8 text-sm text-slate-600">
        <h3 className="font-semibold text-navy-800 mb-2">How it works</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Teacher/Principal opens <strong>Mark Attendance</strong>, selects class & period, adds student name + photo</li>
          <li>Student opens <strong>Check Attendance</strong>, searches by name / roll number</li>
          <li>Shows total periods marked present and date-wise list</li>
        </ul>
      </div>
    </div>
  );
}
