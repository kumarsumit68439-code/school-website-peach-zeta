"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const msgs = JSON.parse(localStorage.getItem("contactMessages") || "[]");
    msgs.push({ ...form, date: new Date().toISOString() });
    localStorage.setItem("contactMessages", JSON.stringify(msgs));
    setSent(true);
    setForm({ name: "", phone: "", message: "" });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900 text-center mb-2">Contact Us</h1>
      <p className="text-center text-slate-500 mb-10">Reach Mahatma Gandhi Government English Medium School</p>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className="card">
            <h2 className="font-bold text-navy-800 mb-3">📍 Address</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Mahatma Gandhi Government English Medium School<br />
              Chak Bawadi, Mansa Rampura<br />
              Lalchandpura, Jaipur – 302012<br />Rajasthan, India
            </p>
          </div>
          <div className="card">
            <h2 className="font-bold text-navy-800 mb-3">📞 Phone</h2>
            <a href="tel:7742936593" className="text-2xl font-bold text-navy-700 hover:text-saffron-600">7742936593</a>
            <p className="text-sm text-slate-500 mt-1">Mon – Sat, from 8:00 AM</p>
          </div>
          <div className="card">
            <h2 className="font-bold text-navy-800 mb-3">🗺️ Location Map</h2>
            <div className="rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
              <iframe title="School Location" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3557.5!2d75.7!3d26.95!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDU3JzAwLjAiTiA3NcKwNDInMDAuMCJF!5e0!3m2!1sen!2sin!4v1" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="font-bold text-navy-800 mb-4">Send a Message</h2>
          {sent ? (
            <div className="bg-green-50 text-green-800 rounded-lg p-4 text-sm">✅ Thank you! Your message has been saved.</div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div><label className="label">Full Name *</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Phone *</label><input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" /></div>
              <div><label className="label">Message *</label><textarea className="input" required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
              <button type="submit" className="btn btn-primary w-full">Send Message</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
