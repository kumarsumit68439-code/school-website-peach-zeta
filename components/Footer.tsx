import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <span>🏫</span> MGGEMS
            </h3>
            <p className="text-sm leading-relaxed">
              Mahatma Gandhi Government English Medium School<br />
              Chak Bawadi, Mansa Rampura<br />
              Lalchandpura, Jaipur – 302012
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[["/", "Home"], ["/about", "About"], ["/admission", "Admission"], ["/notice", "Notices"], ["/result", "Results"], ["/contact", "Contact"]].map(([href, label]) => (
                <li key={href}><Link href={href} className="hover:text-saffron-400 transition">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">School Info</h4>
            <ul className="space-y-2 text-sm">
              <li>Medium: English</li>
              <li>Board: RBSE (Rajasthan)</li>
              <li>Type: Government (MGGS)</li>
              <li>Timing: 8:00 AM onwards</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>📞 <a href="tel:7742936593" className="hover:text-saffron-400">7742936593</a></li>
              <li>📍 Lalchandpura, Jaipur</li>
              <li>🕐 Mon – Sat, 8:00 AM</li>
            </ul>
            <div className="mt-4 pt-3 border-t border-navy-800">
              <h4 className="text-white font-semibold mb-2 text-sm">Website Owner</h4>
              <ul className="space-y-1.5 text-sm">
                <li className="text-white font-medium">Sumit Jilowa</li>
                <li>📞 <a href="tel:7742936593" className="hover:text-saffron-400">7742936593</a></li>
                <li>✉️ <a href="mailto:sumitjilowa34@gmail.com" className="hover:text-saffron-400 break-all">sumitjilowa34@gmail.com</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-navy-800 mt-10 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Mahatma Gandhi Government English Medium School, Lalchandpura. All rights reserved.
          <br />
          <span className="text-slate-400">Website by Sumit Jilowa · 7742936593 · sumitjilowa34@gmail.com</span>
        </div>
      </div>
    </footer>
  );
}
