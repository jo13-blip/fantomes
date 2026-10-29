import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function signatureValide(corps: string, entete: string, secret: string) {
  const parties = Object.fromEntries(
    entete.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i), p.slice(i + 1)];
    }),
  );
  const t = parties["t"];
  const v1 = parties["v1"];
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;

  const attendue = createHmac("sha256", secret)
    .update(`${t}.${corps}`)
    .digest("hex");
  const a = Buffer.from(attendue);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const urlBase = process.env.SUPABASE_URL;
  const cleBase = process.env.SUPABASE_SECRET_KEY;
  if (!secret || !urlBase || !cleBase) {
    return new Response("Configuration manquante", { status: 500 });
  }

  const corps = await req.text();
  const entete = req.headers.get("stripe-signature") ?? "";
  if (!signatureValide(corps, entete, secret)) {
    return new Response("Signature invalide", { status: 400 });
  }

  let evenement: {
    type?: string;
    data?: { object?: { id?: string; payment_status?: string } };
  };
  try {
    evenement = JSON.parse(corps);
  } catch {
    return new Response("Corps illisible", { status: 400 });
  }

  const session = evenement.data?.object;
  if (
    evenement.type === "checkout.session.completed" &&
    session?.id &&
    session.payment_status === "paid"
  ) {
    let reponse: Response;
    try {
      reponse = await fetch(
        `${urlBase.trim().replace(/\/+$/, "")}/rest/v1/paiements?on_conflict=session_id`,
        {
          method: "POST",
          headers: {
            apikey: cleBase.trim(),
            "Content-Type": "application/json",
            Prefer: "resolution=ignore-duplicates",
          },
          body: JSON.stringify({ session_id: session.id }),
        },
      );
    } catch (e) {
      return new Response(
        `Enregistrement impossible : base injoignable (${e instanceof Error ? e.message : "erreur"})`,
        { status: 500 },
      );
    }
    if (!reponse.ok) {
      const detail = (await reponse.text()).slice(0, 300);
      return new Response(
        `Enregistrement impossible : Supabase a répondu ${reponse.status} ${detail}`,
        { status: 500 },
      );
    }
  }

  return new Response("ok", { status: 200 });
}
