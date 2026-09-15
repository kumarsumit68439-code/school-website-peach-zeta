import { NextRequest } from "next/server";

export const runtime = "nodejs";

type Hit = { title: string; url: string; snippet: string };

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "public, max-age=60",
    },
  });
}

/** Parse DuckDuckGo HTML results (server-side — no CORS, works in our site only) */
function parseDdg(html: string): Hit[] {
  const hits: Hit[] = [];
  // result blocks
  const re =
    /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:class="result__snippet"[^>]*>([\s\S]*?)<\/a>|class="result__snippet"[^>]*>([\s\S]*?)<\/div>)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && hits.length < 12) {
    let href = m[1] || "";
    // DDG redirect links: //duckduckgo.com/l/?uddg=ENCODED
    try {
      if (href.includes("uddg=")) {
        const u = new URL(href.startsWith("http") ? href : "https:" + href);
        const real = u.searchParams.get("uddg");
        if (real) href = decodeURIComponent(real);
      }
    } catch {
      /* keep */
    }
    const title = (m[2] || "").replace(/<[^>]+>/g, "").trim();
    const snippet = (m[3] || m[4] || "").replace(/<[^>]+>/g, "").trim();
    if (title && href.startsWith("http")) {
      hits.push({ title, url: href, snippet });
    }
  }

  // fallback simpler pattern
  if (hits.length === 0) {
    const re2 = /href="(https?:\/\/[^"]+)"[^>]*class="result__a"[^>]*>([^<]+)/gi;
    let m2: RegExpExecArray | null;
    while ((m2 = re2.exec(html)) !== null && hits.length < 12) {
      hits.push({ title: m2[2].trim(), url: m2[1], snippet: "" });
    }
  }
  return hits;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q || q.length > 200) {
    return json({ success: false, error: "Query required (max 200 chars)" }, 400);
  }

  try {
    const ddgUrl =
      "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q);
    const res = await fetch(ddgUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return json({
        success: true,
        query: q,
        results: [],
        note: "Search provider temporarily unavailable — try again",
        source: "none",
      });
    }

    const html = await res.text();
    const results = parseDdg(html);

    return json({
      success: true,
      query: q,
      count: results.length,
      results,
      source: "duckduckgo",
      message: "Results loaded inside school website (no new tab)",
    });
  } catch (e) {
    return json({
      success: true,
      query: q,
      results: [],
      note: "Network issue — " + String(e),
      source: "error",
    });
  }
}
