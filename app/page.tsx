"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Notice = { id: string; title: string; date: string; important?: boolean };

export default function HomePage() {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("schoolNotices");
    if (saved) {
      setNotices(JSON.parse(saved).slice(0, 3));
    } else {
      const defaults: Notice[] = [
        { id: "1", title: "Admission Open for Session 2026-27", date: "2026-03-14", important: true },
        { id: "2", title: "School Reopens on 1st July", date: "2026-06-20" },
        { id: "3", title: "Parent-Teacher Meeting – Last Saturday", date: "2026-07-01" },
      ];
      localStorage.setItem("schoolNotices", JSON.stringify(defaults));
      setNotices(defaults);
    }
  }, []);

  return (
    <>
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <span className="inline-block bg-white/15 text-xs font-semibold tracking-wide px-4 py-1.5 rounded-full mb-5">
            Government English Medium School · MGGS Scheme
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Mahatma Gandhi Government
            <br />
            English Medium School
          </h1>
          <p className="text-navy-100 text-base md:text-lg mb-2">
            Chak Bawadi, Mansa Rampura, Lalchandpura, Jaipur – 302012
          </p>
          <p className="text-saffron-300 font-medium mb-8">📞 7742936593</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/admission" className="btn btn-saffron text-base px-7 py-3">
              Apply for Admission
            </Link>
            <Link href="/about" className="btn border-2 border-white text-white hover:bg-white hover:text-navy-900 text-base px-7 py-3">
              About School
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Medium", value: "English" },
            { label: "Board", value: "RBSE" },
            { label: "Starts At", value: "8:00 AM" },
            { label: "Type", value: "Government" },
          ].map((s) => (
            <div key={s.label} className="card text-center py-5 shadow-md">
              <div className="text-xl md:text-2xl font-bold text-navy-800">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-navy-900">📢 Notice Board</h2>
              <Link href="/notice" className="text-sm text-navy-600 hover:underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className={`card border-l-4 ${n.important ? "border-l-saffron-500" : "border-l-navy-500"}`}>
                  {n.important && (
                    <span className="text-[10px] font-bold text-saffron-700 bg-saffron-100 px-2 py-0.5 rounded">IMPORTANT</span>
                  )}
                  <h3 className="font-semibold text-navy-900 mt-1">{n.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{n.date}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-900 mb-4">⚡ Quick Access</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/admission", icon: "📝", title: "Admission", desc: "Apply online" },
                { href: "/result", icon: "📊", title: "Results", desc: "RBSE lookup" },
                { href: "/messages", icon: "💬", title: "Messages", desc: "Chat portal" },
                { href: "/gallery", icon: "🖼️", title: "Gallery", desc: "School photos" },
                { href: "/teacher/dashboard", icon: "👨‍🏫", title: "Dashboard", desc: "Staff panel" },
                { href: "/contact", icon: "📍", title: "Contact", desc: "Reach us" },
              ].map((q) => (
                <Link key={q.href} href={q.href} className="card hover:shadow-md hover:border-navy-200 transition text-center py-5">
                  <div className="text-2xl mb-2">{q.icon}</div>
                  <div className="font-semibold text-navy-900 text-sm">{q.title}</div>
                  <div className="text-xs text-slate-500">{q.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-navy-900 text-white py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Admission Open for 2026-27</h2>
          <p className="text-navy-200 mb-6">
            Fill the online form or visit the school. For queries call{" "}
            <a href="tel:7742936593" className="text-saffron-400 font-semibold">7742936593</a>
          </p>
          <Link href="/admission" className="btn btn-saffron text-base px-8 py-3">
            Fill Admission Form →
          </Link>
        </div>
      </section>
    </>
  );
}
