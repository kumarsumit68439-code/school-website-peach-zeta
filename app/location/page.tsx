"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type LocUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  lat: number;
  lng: number;
  accuracy?: number;
  updatedAt: number;
  address?: string;
};

const LOC_KEY = "schoolLocations";
const USERS_KEY = "schoolChatUsers";
const ME_KEY = "schoolChatMe";

export default function LocationPage() {
  const { data: session, status } = useSession();
  const [locations, setLocations] = useState<LocUser[]>([]);
  const [me, setMe] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [selected, setSelected] = useState<LocUser | null>(null);
  const [search, setSearch] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [watching, setWatching] = useState(false);
  const watchId = useRef<number | null>(null);

  const load = useCallback(() => {
    setLocations(JSON.parse(localStorage.getItem(LOC_KEY) || "[]"));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  // Resolve identity: Google session or chat account
  useEffect(() => {
    const chatMe = JSON.parse(localStorage.getItem(ME_KEY) || "null");
    if (session?.user?.email) {
      const email = session.user.email.toLowerCase();
      const name = session.user.name || email.split("@")[0];
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      const u = users.find((x: { email: string }) => x.email?.toLowerCase() === email);
      setMe({
        id: u?.id || "g_" + email.replace(/[^a-z0-9]/gi, "_"),
        name: u?.name || name,
        email,
        role: u?.role || "Student",
      });
    } else if (chatMe?.email) {
      setMe({
        id: chatMe.id,
        name: chatMe.name,
        email: chatMe.email,
        role: chatMe.role || "Student",
      });
    } else {
      setMe(null);
    }
  }, [session, status]);

  const saveLocation = useCallback(
    (lat: number, lng: number, accuracy?: number) => {
      if (!me) return;
      const entry: LocUser = {
        id: me.id,
        name: me.name,
        email: me.email.toLowerCase(),
        role: me.role,
        lat,
        lng,
        accuracy,
        updatedAt: Date.now(),
      };
      const list: LocUser[] = JSON.parse(localStorage.getItem(LOC_KEY) || "[]");
      const without = list.filter(
        (x) => x.email.toLowerCase() !== me.email.toLowerCase() && x.id !== me.id
      );
      const updated = [entry, ...without];
      localStorage.setItem(LOC_KEY, JSON.stringify(updated));
      setLocations(updated);
      setStatusMsg(`Location set · ${new Date().toLocaleTimeString()}`);
      setError("");
      // Keep selected in sync if viewing self
      setSelected((prev) =>
        prev && (prev.id === me.id || prev.email === me.email) ? entry : prev
      );
    },
    [me]
  );

  const requestLocation = useCallback(() => {
    if (!me) {
      setError("Pehle Google / Messages se login karo");
      return;
    }
    if (!navigator.geolocation) {
      setError("Browser location support nahi karta");
      return;
    }
    setStatusMsg("Location maang raha hai...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        saveLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Location permission deny — browser me Allow karo"
            : err.message || "Location nahi mili"
        );
        setStatusMsg("");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, [me, saveLocation]);

  // Auto-set on login
  useEffect(() => {
    if (!me) return;
    requestLocation();
  }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const startWatch = () => {
    if (!me || !navigator.geolocation) return;
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setWatching(false);
      setStatusMsg("Live tracking band");
      return;
    }
    setWatching(true);
    setStatusMsg("Live tracking on...");
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        saveLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => {
        setError(err.message);
        setWatching(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  useEffect(() => {
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = locations.filter((l) => {
    if (!q) return true;
    return (
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.role.toLowerCase().includes(q)
    );
  });

  const timeAgo = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  const mapSrc = (lat: number, lng: number) =>
    `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">📍 Live Location</h1>
          <p className="text-sm text-slate-500">
            Students · Teachers · Principal — real-time GPS
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={requestLocation} className="btn btn-primary text-sm">
            📍 Set My Location
          </button>
          <button
            onClick={startWatch}
            className={`btn text-sm ${watching ? "bg-green-600 text-white" : "btn-outline"}`}
          >
            {watching ? "● Live ON" : "▶ Live Track"}
          </button>
        </div>
      </div>

      {!me ? (
        <div className="card text-center py-8 mb-6">
          <p className="text-slate-600 mb-3">Location set karne ke liye login chahiye</p>
          <div className="flex justify-center gap-3">
            <Link href="/login" className="btn btn-primary text-sm">Google Login</Link>
            <Link href="/messages" className="btn btn-outline text-sm">Messages Sign Up</Link>
          </div>
        </div>
      ) : (
        <div className="card mb-6 py-3 px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm">
            <span className="font-semibold text-navy-900">{me.name}</span>
            <span className="text-slate-400 mx-1">·</span>
            <span className="text-slate-500">{me.email}</span>
            <span className="text-slate-400 mx-1">·</span>
            <span className="text-xs bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full">{me.role}</span>
          </div>
          <div className="text-xs text-slate-500">
            {statusMsg && <span className="text-green-600">{statusMsg}</span>}
            {error && <span className="text-red-600">{error}</span>}
          </div>
        </div>
      )}

      <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4">
        ✅ Login hote hi current location auto set hoti hai (permission Allow karna hoga). Search se kisi ka Gmail/username daal ke location dekh sakte ho — map is website ke andar khulega.
      </p>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <div className="card p-0 overflow-hidden flex flex-col" style={{ maxHeight: "520px" }}>
          <div className="p-3 border-b shrink-0">
            <input
              className="input text-sm"
              placeholder="Search Gmail / username / name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">{filtered.length} locations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10 px-4">
                Abhi koi location nahi. Login karke Set My Location dabao.
              </p>
            ) : (
              filtered.map((l) => (
                <button
                  key={l.id + l.email}
                  onClick={() => setSelected(l)}
                  className={`w-full text-left px-3 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${
                    selected?.email === l.email ? "bg-navy-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm text-navy-900">{l.name}</div>
                    <span className="text-[10px] text-slate-400">{timeAgo(l.updatedAt)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{l.email}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {l.role} · {l.lat.toFixed(5)}, {l.lng.toFixed(5)}
                    {l.accuracy != null && ` · ±${Math.round(l.accuracy)}m`}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="card p-0 overflow-hidden flex flex-col min-h-[320px]" style={{ height: "520px" }}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm p-6">
              <div className="text-center">
                <div className="text-4xl mb-2">🗺️</div>
                <p>List se naam pe click karo</p>
                <p className="text-xs mt-1">Map yahi website me khulega</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b shrink-0 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-navy-900 text-sm">{selected.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {selected.email} · {selected.role} · {timeAgo(selected.updatedAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-navy-600 underline"
                  >
                    Open in Google Maps
                  </a>
                  <button onClick={() => setSelected(null)} className="text-xs text-slate-500 underline">
                    Close
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 relative">
                <iframe
                  title="Location map"
                  className="absolute inset-0 w-full h-full border-0"
                  src={mapSrc(selected.lat, selected.lng)}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="px-4 py-2 border-t text-[11px] text-slate-500 shrink-0 bg-slate-50">
                Lat: {selected.lat.toFixed(6)} · Lng: {selected.lng.toFixed(6)}
                {selected.accuracy != null && ` · Accuracy ±${Math.round(selected.accuracy)}m`}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
