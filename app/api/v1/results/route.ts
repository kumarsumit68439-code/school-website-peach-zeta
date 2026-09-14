import { verifyApiKey, json } from "@/lib/apiAuth";

export async function OPTIONS() {
  return json({ ok: true });
}

/** Mock RBSE-style result lookup by roll (public school portal style) */
export async function GET(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.ok) return json({ success: false, error: auth.error }, auth.status);

  const url = new URL(req.url);
  const roll = url.searchParams.get("roll") || "0000";
  const cls = url.searchParams.get("class") || "10";

  // Deterministic mock from roll digits
  let seed = 0;
  for (let i = 0; i < roll.length; i++) seed += roll.charCodeAt(i);
  const pct = 40 + (seed % 55);
  const division =
    pct >= 75 ? "First Division" : pct >= 60 ? "Second Division" : pct >= 45 ? "Third Division" : "Pass";

  return json({
    success: true,
    type: "mock_rbse_sheet",
    class: cls,
    roll,
    percentage: pct,
    division,
    subjects: [
      { name: "Hindi", marks: 40 + (seed % 50) },
      { name: "English", marks: 35 + ((seed * 3) % 55) },
      { name: "Maths", marks: 30 + ((seed * 7) % 60) },
      { name: "Science", marks: 38 + ((seed * 5) % 52) },
      { name: "Social", marks: 42 + ((seed * 2) % 48) },
    ],
    official_links: {
      "5_8": "https://rajshaladarpan.nic.in",
      "10_12": "https://rajeduboard.rajasthan.gov.in",
    },
    note: "Mock result for API demo — verify on official board sites",
  });
}
