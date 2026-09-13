export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900 text-center mb-2">About Our School</h1>
      <p className="text-center text-slate-500 mb-10">Mahatma Gandhi Government English Medium School, Lalchandpura</p>
      <div className="card mb-8">
        <h2 className="text-lg font-bold text-navy-800 mb-3">🏫 School Overview</h2>
        <p className="text-slate-600 leading-relaxed mb-3">
          <strong>Mahatma Gandhi Government English Medium School (MGGEMS)</strong> is a government English medium school located at Chak Bawadi, Mansa Rampura, Lalchandpura, Jaipur – 302012, Rajasthan.
        </p>
        <p className="text-slate-600 leading-relaxed">
          It operates under the <strong>Mahatma Gandhi Government Schools (MGGS)</strong> scheme of the Rajasthan Education Department, providing quality English medium education to children from all sections of society.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-5 mb-8">
        <div className="card">
          <h3 className="font-bold text-navy-800 mb-2">👨‍💼 Principal</h3>
          <p className="text-slate-600">Principal, MGGEMS Lalchandpura<br /><span className="text-sm text-slate-400">(Default – update after confirmation)</span></p>
        </div>
        <div className="card">
          <h3 className="font-bold text-navy-800 mb-2">📞 Contact</h3>
          <p className="text-slate-600"><a href="tel:7742936593" className="text-navy-700 font-semibold hover:underline">7742936593</a><br />Mon – Sat, from 8:00 AM</p>
        </div>
        <div className="card">
          <h3 className="font-bold text-navy-800 mb-2">📍 Address</h3>
          <p className="text-slate-600 text-sm leading-relaxed">Chak Bawadi, Mansa Rampura<br />Lalchandpura, Jaipur – 302012<br />Rajasthan, India</p>
        </div>
        <div className="card">
          <h3 className="font-bold text-navy-800 mb-2">📖 Medium & Board</h3>
          <p className="text-slate-600 text-sm">Medium: <strong>English</strong><br />Board: <strong>RBSE</strong> (Rajasthan Board)<br />Type: Government School</p>
        </div>
      </div>
      <div className="card">
        <h2 className="text-lg font-bold text-navy-800 mb-3">🎯 Vision</h2>
        <p className="text-slate-600 leading-relaxed mb-4">To provide high-quality English medium education to every child, especially from socially and economically weaker sections, enabling them to compete with the best and become responsible citizens.</p>
        <h3 className="font-semibold text-navy-800 mb-2">Key Highlights</h3>
        <ul className="list-disc list-inside text-slate-600 space-y-1 text-sm">
          <li>English medium education under Government of Rajasthan</li>
          <li>Part of Mahatma Gandhi Government English Medium Schools (MGGS) network</li>
          <li>Focus on academics, values and holistic development</li>
          <li>Online admission, notice board, results & messaging portal</li>
        </ul>
      </div>
    </div>
  );
}
