"use client";

const items = [
  { title: "School Building", emoji: "🏫", bg: "bg-blue-100" },
  { title: "Classroom", emoji: "📚", bg: "bg-amber-100" },
  { title: "Morning Assembly", emoji: "🎖️", bg: "bg-green-100" },
  { title: "Sports Day", emoji: "⚽", bg: "bg-pink-100" },
  { title: "Independence Day", emoji: "🇮🇳", bg: "bg-indigo-100" },
  { title: "Science Lab", emoji: "🔬", bg: "bg-purple-100" },
  { title: "Library", emoji: "📖", bg: "bg-orange-100" },
  { title: "Cultural Program", emoji: "🎭", bg: "bg-teal-100" },
  { title: "Teachers & Staff", emoji: "👨‍🏫", bg: "bg-yellow-100" },
];

export default function GalleryPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-navy-900 text-center mb-2">
        Photo Gallery
      </h1>
      <p className="text-center text-slate-500 mb-10">
        Moments from MGGEMS Lalchandpura
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.title}
            className={`${item.bg} rounded-xl aspect-square flex flex-col items-center justify-center p-4 shadow-sm hover:shadow-md transition`}
          >
            <span className="text-5xl mb-3">{item.emoji}</span>
            <span className="text-sm font-semibold text-navy-800 text-center">
              {item.title}
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        * Real photos can be uploaded later from the staff dashboard.
      </p>
    </div>
  );
}
