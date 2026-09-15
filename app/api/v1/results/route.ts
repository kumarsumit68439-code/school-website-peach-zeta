import { verifyApiKey, json } from "@/lib/apiAuth";

/**
 * Real RBSE results are only on official board portals.
 * This API returns official URLs — never mock marks.
 */
export async function OPTIONS() {
  return json({ ok: true });
}

export async function GET(req: Request) {
  const auth = await verifyApiKey(req);
  if (!auth.ok) return json({ success: false, error: auth.error }, auth.status);

  const url = new URL(req.url);
  const cls = (url.searchParams.get("class") || "10").toLowerCase();
  const stream = (url.searchParams.get("stream") || "").toLowerCase();
  const roll = url.searchParams.get("roll") || "";

  const BOARD = "https://rajeduboard.rajasthan.gov.in/RESULT2026";

  const portals: Record<string, { label: string; url: string }> = {
    "5": {
      label: "Class 5 Shala Darpan",
      url: "https://rajshaladarpan.rajasthan.gov.in/",
    },
    "8": {
      label: "Class 8 Shala Darpan",
      url: "https://rajshaladarpan.rajasthan.gov.in/",
    },
    "10": {
      label: "Secondary & Vocational 2026",
      url: `${BOARD}/SEV/Roll_Input.htm`,
    },
    "12": {
      label:
        stream === "commerce"
          ? "Senior Secondary Commerce 2026"
          : stream === "arts"
          ? "Senior Secondary Arts 2026"
          : "Senior Secondary Science 2026",
      url:
        stream === "commerce"
          ? `${BOARD}/COMM/Roll_Input.htm`
          : stream === "arts"
          ? `${BOARD}/ARTS/Roll_Input.htm`
          : `${BOARD}/SCIENCE/Roll_Input.htm`,
    },
    hub: {
      label: "All Results 2026",
      url: `${BOARD}/Result2026.htm`,
    },
  };

  const selected = portals[cls] || portals["10"];

  return json({
    success: true,
    message:
      "RBSE does not publish a public bulk API for marksheets. Use official portal with roll number.",
    mock: false,
    demo: false,
    roll_hint: roll || null,
    class: cls,
    stream: stream || null,
    official: selected,
    all_portals: portals,
    instructions: [
      "Open official.url in browser",
      "Enter roll number from admit card",
      "Submit to view real board marksheet",
    ],
    server_time: new Date().toISOString(),
  });
}
