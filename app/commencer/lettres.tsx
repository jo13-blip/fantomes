"use client";

import { useState } from "react";
import type { Abonnement } from "@/lib/detect";
import { construireLettre } from "@/lib/lettre";

type Retouche = { service?: string; reference?: string };

const champ =
  "mt-1 block w-full rounded-lg border-2 border-encre bg-white/60 px-3 py-3 text-base";

const euros = (n: number) =>
  n.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export default function Lettres({
  abonnements,
}: {
  abonnements: Abonnement[];
}) {
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [retouches, setRetouches] = useState<Record<string, Retouche>>({});
  const [copie, setCopie] = useState<string | null>(null);
  const aujourdhui = new Date();

  function modifier(cle: string, changement: Retouche) {
    setRetouches((avant) => ({
      ...avant,
      [cle]: { ...avant[cle], ...changement },
    }));
  }

  async function copier(cle: string, texte: string) {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(cle);
      setTimeout(() => setCopie(null), 2500);
    } catch {
      setCopie(null);
    }
  }

  return (
    <section className="mt-10" aria-labelledby="titre-lettres">
      <h2 id="titre-lettres" className="font-titre text-2xl font-extrabold">
        Tes lettres de résiliation
      </h2>
      <p className="mt-2">
        Remplis ces deux champs une seule fois : ils s&apos;ajoutent à toutes
        les lettres. Rien n&apos;est envoyé ni enregistré, tout reste sur ton
        appareil.
      </p>

      <label className="mt-5 block font-semibold">
        Ton prénom et ton nom
        <input
          type="text"
          autoComplete="name"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className={champ}
        />
      </label>

      <label className="mt-4 block font-semibold">
        Ton adresse postale
        <textarea
          autoComplete="street-address"
          rows={3}
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          className={champ}
        />
      </label>

      <div className="mt-6 border-t border-encre/20">
        {abonnements.map((a) => {
          const r = retouches[a.nom] ?? {};
          const lettre = construireLettre({
            nom,
            adresse,
            service: r.service ?? a.nom,
            reference: r.reference ?? "",
            montantMensuel: a.montantMensuel,
            date: aujourdhui,
          });
          return (
            <details key={a.nom} className="border-b border-encre/20 py-3">
              <summary className="cursor-pointer font-semibold">
                {a.nom} · {euros(a.montantAnnuel)} par an
              </summary>

              <label className="mt-4 block">
                Nom du service (corrige-le si besoin)
                <input
                  type="text"
                  value={r.service ?? a.nom}
                  onChange={(e) => modifier(a.nom, { service: e.target.value })}
                  className={champ}
                />
              </label>

              <label className="mt-3 block">
                Numéro client (facultatif)
                <input
                  type="text"
                  value={r.reference ?? ""}
                  onChange={(e) =>
                    modifier(a.nom, { reference: e.target.value })
                  }
                  className={champ}
                />
              </label>

              <textarea
                readOnly
                rows={16}
                value={lettre}
                onFocus={(e) => e.currentTarget.select()}
                aria-label={`Lettre de résiliation ${a.nom}`}
                className="mt-4 block w-full rounded-lg border-2 border-encre bg-white/60 p-3 font-mono text-sm"
              />

              <button
                type="button"
                onClick={() => copier(a.nom, lettre)}
                className="mt-3 block w-full rounded-xl bg-tampon px-6 py-4 text-center text-lg font-semibold text-papier"
              >
                Copier la lettre
              </button>
              {copie === a.nom && (
                <p role="status" className="mt-2 text-center">
                  Lettre copiée.
                </p>
              )}
            </details>
          );
        })}
      </div>

      <p className="mt-5 text-sm opacity-70">
        Envoie chaque lettre en recommandé, ou par le formulaire de contact du
        service (cherche « résilier » dans ton espace client). Garde une trace
        de l&apos;envoi.
      </p>
    </section>
  );
}
