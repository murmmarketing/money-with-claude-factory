import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { buildFile } from "@/lib/kit";

export const runtime = "nodejs";

// Token-gated file delivery. The token encodes which product was purchased.
//   - product "all" (vault) unlocks every industry file.
//   - product "<slug>" unlocks that industry's files only.
// The shared ATS checklist (file=checklist) is available to any valid token.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const file = searchParams.get("file") || "";
  const industry = searchParams.get("industry") || "";

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired download link" }, { status: 403 });
  }

  // Access check
  if (file !== "checklist") {
    const allowed = payload.product === "all" || payload.product === industry;
    if (!allowed) {
      return NextResponse.json({ error: "This link does not unlock that industry" }, { status: 403 });
    }
  }

  const built = buildFile(file, industry);
  if (!built) {
    return NextResponse.json({ error: "Unknown file" }, { status: 404 });
  }

  return new NextResponse(built.body, {
    status: 200,
    headers: {
      "Content-Type": built.type,
      "Content-Disposition": `attachment; filename="${built.name}"`,
      "Cache-Control": "no-store"
    }
  });
}
