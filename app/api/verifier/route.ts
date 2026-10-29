import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const urlBase = process.env.SUPABASE_URL;
  const cleBrute = process.env.SUPABASE_SECRET_KEY;
  if (!urlBase || !cleBrute) {
    return NextResponse.json({ paye: false }, { status: 500 });
  }
  const cleBase = cleBrute.trim();

  const id = new URL(req.url).searchParams.get("session_id") ?? "";
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(id)) {
    return NextResponse.json({ paye: false }, { status: 400 });
  }

  const enTetes: Record<string, string> = { apikey: cleBase };
  if (cleBase.startsWith("eyJ")) {
    enTetes.Authorization = `Bearer ${cleBase}`;
  }

  const reponse = await fetch(
    `${urlBase.trim().replace(/\/+$/, "")}/rest/v1/paiements?session_id=eq.${encodeURIComponent(id)}&select=session_id`,
    { headers: enTetes, cache: "no-store" },
  );
  if (!reponse.ok) {
    return NextResponse.json({ paye: false }, { status: 502 });
  }
  const lignes: unknown = await reponse.json();
  return NextResponse.json({ paye: Array.isArray(lignes) && lignes.length > 0 });
}
