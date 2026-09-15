import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Hit = { title: string; url: string; snippet: string };

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function fetchText(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MGGEMS-SchoolBot/1.0; +https://school-website-peach-zeta-psi.vercel.app)",
        Accept: "text/html,application/json",
      },
      cache: "no-store",
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function ddgInstant(q: string): Promise<Hit[]> {
  const url =
    "https://api.duckduckgo.com/?q=" +
    encodeURIComponent(q) +
    "&format=json&no_html=1&skip_disambig=1";
  const text = await fetchText(url);
  if (!text) return [];
  try {
    const data = JSON.parse(text);
    const hits: Hit[] = [];
    if (data.AbstractText && data.AbstractURL) {
      hits.push({
        title: data.Heading || q,
        url: data.AbstractURL,
        snippet: data.AbstractText,
      });
    }
    const topics = data.RelatedTopics || [];
    for (const t of topics) {
      if (t.FirstURL && t.Text) {
        hits.push({ title: t.Text.slice(0, 80), url: t.FirstURL, snippet: t.Text });
      }
      if (Array.isArray(t.Topics)) {
        for (const sub of t.Topics) {
          if (sub.FirstURL && sub.Text) {
            hits.push({
              title: sub.Text.slice(0, 80),
              url: sub.FirstURL,
              snippet: sub.Text,
            });
          }
        }
      }
      if (hits.length >= 10) break;
    }
    if (data.Results) {
      for (const r of data.Results) {
        if (r.FirstURL && r.Text) {
          hits.push({ title: r.Text.slice(0, 80), url: r.FirstURL, snippet: r.Text });
        }
      }
    }
    return hits.slice(0, 12);
  } catch {
    return [];
  }
}

async function wikipediaSearch(q: string): Promise<Hit[]> {
  const url =
    "https://en.wikipedia.org/w/api.php?action=opensearch&search=" +
    encodeURIComponent(q) +
    "&limit=8&namespace=0&format=json&origin=*";
  const text = await fetchText(url);
  if (!text) return [];
  try {
    const data = JSON.parse(text);
    // [query, titles[], descriptions[], urls[]]
    const titles: string[] = data[1] || [];
    const descs: string[] = data[2] || [];
    const urls: string[] = data[3] || [];
    return titles.map((title, i) => ({
      title,
      url: urls[i] || "",
      snippet: descs[i] || "",
    })).filter((h) => h.url);
  } catch {
    return [];
  }
}

async function wikiHindi(q: string): Promise<Hit[]> {
  const url =
    "https://hi.wikipedia.org/w/api.php?action=opensearch&search=" +
    encodeURIComponent(q) +
    "&limit=5&namespace=0&format=json&origin=*";
  const text = await fetchText(url);
  if (!text) return [];
  try {
    const data = JSON.parse(text);
    const titles: string[] = data[1] || [];
    const descs: string[] = data[2] || [];
    const urls: string[] = data[3] || [];
    return titles.map((title, i) => ({
      title: title + " (हिंदी)",
      url: urls[i] || "",
      snippet: descs[i] || "",
    })).filter((h) => h.url);
  } catch {
    return [];
  }
}

function parseDdgHtml(html: string): Hit[] {
  const hits: Hit[] = [];
  const re =
    /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|div)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && hits.length < 10) {
    let href = m[1] || "";
    try {
      if (href.includes("uddg=")) {
        const u = new URL(href.startsWith("http") ? href : "https:" + href);
        const real = u.searchParams.get("uddg");
        if (real) href = decodeURIComponent(real);
      }
    } catch {
      /* */
    }
    const title = (m[2] || "").replace(/<[^>]+>/g, "").trim();
    const snippet = (m[3] || "").replace(/<[^>]+>/g, "").trim();
    if (title && href.startsWith("http")) hits.push({ title, url: href, snippet });
  }
  return hits;
}

async function ddgHtml(q: string): Promise<Hit[]> {
  const url = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q);
  const html = await fetchText(url, 10000);
  if (!html) return [];
  return parseDdgHtml(html);
}

/** Always-useful school / board links when query matches */
function schoolFallbacks(q: string): Hit[] {
  const lower = q.toLowerCase();
  const all: Hit[] = [
    {
      title: "RBSE Board — Official Results 2026",
      url: "https://rajeduboard.rajasthan.gov.in/RESULT2026/Result2026.htm",
      snippet: "Rajasthan Board of Secondary Education official result portal",
    },
    {
      title: "Class 10 Secondary Result 2026 (Roll Number)",
      url: "https://rajeduboard.rajasthan.gov.in/RESULT2026/SEV/Roll_Input.htm",
      snippet: "Enter roll number on official board site",
    },
    {
      title: "Class 12 Science Result 2026",
      url: "https://rajeduboard.rajasthan.gov.in/RESULT2026/SCIENCE/Roll_Input.htm",
      snippet: "Senior Secondary Science — official",
    },
    {
      title: "Class 12 Commerce Result 2026",
      url: "https://rajeduboard.rajasthan.gov.in/RESULT2026/COMM/Roll_Input.htm",
      snippet: "Senior Secondary Commerce — official",
    },
    {
      title: "Class 12 Arts Result 2026",
      url: "https://rajeduboard.rajasthan.gov.in/RESULT2026/ARTS/Roll_Input.htm",
      snippet: "Senior Secondary Arts — official",
    },
    {
      title: "Raj Shala Darpan (Class 5 & 8)",
      url: "https://rajshaladarpan.rajasthan.gov.in/",
      snippet: "Official portal for Class 5th and 8th results",
    },
    {
      title: "RBSE Board Home",
      url: "https://rajeduboard.rajasthan.gov.in/main.asp",
      snippet: "Board of Secondary Education, Rajasthan, Ajmer",
    },
    {
      title: "DigiLocker — Digital Marksheet",
      url: "https://www.digilocker.gov.in/",
      snippet: "Download board certificates digitally",
    },
    {
      title: "School Result Page (this website)",
      url: "https://school-website-peach-zeta-psi.vercel.app/result",
      snippet: "MGGEMS — official board links by class",
    },
  ];

  if (
    /rbse|board|result|roll|class\s*10|class\s*12|10th|12th|5th|8th|shala|darpan|rajasthan|marksheet|exam/i.test(
      lower
    )
  ) {
    return all;
  }
  if (/school|mggems|jaipur|lalchand|gandhi/i.test(lower)) {
    return [
      {
        title: "MGGEMS School Website Home",
        url: "https://school-website-peach-zeta-psi.vercel.app/",
        snippet: "Mahatma Gandhi Government English Medium School, Lalchandpura",
      },
      {
        title: "About School",
        url: "https://school-website-peach-zeta-psi.vercel.app/about",
        snippet: "School history and details",
      },
      {
        title: "Admission",
        url: "https://school-website-peach-zeta-psi.vercel.app/admission",
        snippet: "Online admission form",
      },
      ...all.slice(0, 3),
    ];
  }
  return [];
}

function dedupe(hits: Hit[]): Hit[] {
  const seen = new Set<string>();
  const out: Hit[] = [];
  for (const h of hits) {
    const key = h.url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  return out;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q || q.length > 200) {
    return json({ success: false, error: "Query required", results: [] }, 400);
  }

  // Run sources in parallel — never throw to client as "unavailable"
  const [instant, wikiEn, wikiHi, htmlHits] = await Promise.all([
    ddgInstant(q),
    wikipediaSearch(q),
    wikiHindi(q),
    ddgHtml(q),
  ]);

  let results = dedupe([
    ...htmlHits,
    ...instant,
    ...wikiEn,
    ...wikiHi,
    ...schoolFallbacks(q),
  ]).slice(0, 15);

  // Absolute last resort — always return something useful
  if (results.length === 0) {
    results = [
      {
        title: `Search: ${q} on Wikipedia`,
        url: "https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(q),
        snippet: "Open Wikipedia search for this query",
      },
      {
        title: `Search: ${q} on DuckDuckGo`,
        url: "https://duckduckgo.com/?q=" + encodeURIComponent(q),
        snippet: "Web search (open in viewer if allowed)",
      },
      ...schoolFallbacks("rbse result"),
    ];
  }

  return json({
    success: true,
    query: q,
    count: results.length,
    results,
    source: "multi",
    message: "OK",
  });
}
