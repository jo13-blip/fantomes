import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const cle = process.env.STRIPE_SECRET_KEY;
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

  const reponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cle}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: corps,
  });
  const donnees = await reponse.json();

  if (!reponse.ok || !donnees.url) {
    return NextResponse.json(
      { erreur: "Impossible de lancer le paiement. Réessaie dans un instant." },
      { status: 502 },
    );
  }
  return NextResponse.json({ url: donnees.url });
}
