import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const cle = process.env.STRIPE_SECRET_KEY?.trim();
  if (!cle) {
    return NextResponse.json(
      { erreur: "Le paiement n'est pas disponible pour le moment." },
      { status: 500 },
    );
  }

  const origine = new URL(req.url).origin;
  const corps = new URLSearchParams({
    mode: "payment",
    locale: "fr",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": "1900",
    "line_items[0][price_data][product_data][name]": "Fantômes : audit complet",
    success_url: `${origine}/commencer?paiement=ok&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origine}/commencer?paiement=annule`,
  });

  let reponse: Response;
  try {
    reponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: corps,
    });
  } catch {
    return NextResponse.json(
      { erreur: "Impossible de joindre Stripe. Réessaie dans un instant." },
      { status: 502 },
    );
  }

  const donnees = await reponse.json().catch(() => ({}));

  if (!reponse.ok || !donnees.url) {
    const detail: string =
      typeof donnees?.error?.message === "string"
        ? donnees.error.message.slice(0, 200)
        : `réponse ${reponse.status}`;
    return NextResponse.json(
      { erreur: `Impossible de lancer le paiement (${detail}).` },
      { status: 502 },
    );
  }
  return NextResponse.json({ url: donnees.url });
}
