"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { detecter, lireReleve, type Abonnement } from "@/lib/detect";
import Lettres from "./lettres";

const CLE_STOCKAGE = "fantomes:abonnements";

type Statut = "aucun" | "verification" | "paye" | "echec";

const euros = (n: number) =>
  n.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

function decoder(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

function restaurer(): Abonnement[] | null {
  try {
    const brut = window.sessionStorage.getItem(CLE_STOCKAGE);
    const liste: unknown = brut ? JSON.parse(brut) : null;
    return Array.isArray(liste) ? (liste as Abonnement[]) : null;
  } catch {
    return null;
  }
}

export default function Commencer() {
  const [abonnements, setAbonnements] = useState<Abonnement[] | null>(null);
  const [erreur, setErreur] = useState("");
  const [annule, setAnnule] = useState(false);
  const [statut, setStatut] = useState<Statut>("aucun");
  const [enCours, setEnCours] = useState(false);
  const [erreurPaiement, setErreurPaiement] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const retour = params.get("paiement");

    if (retour === "annule") {
      setAnnule(true);
      const liste = restaurer();
      if (liste) setAbonnements(liste);
      return;
    }

    if (retour === "ok") {
      const liste = restaurer();
      if (liste) setAbonnements(liste);
      const id = params.get("session_id");
      if (!id) {
        setStatut("echec");
        return;
      }
      setStatut("verification");
      let arret = false;
      (async () => {
        for (let i = 0; i < 10 && !arret; i++) {
          try {
            const reponse = await fetch(
              `/api/verifier?session_id=${encodeURIComponent(id)}`,
              { cache: "no-store" },
            );
            const donnees: { paye?: boolean } = await reponse.json();
            if (donnees.paye) {
              if (!arret) setStatut("paye");
              return;
            }
          } catch {
            /* on réessaie */
          }
          await new Promise((fin) => setTimeout(fin, 1500));
        }
        if (!arret) setStatut("echec");
      })();
      return () => {
        arret = true;
      };
    }
  }, []);

  async function surFichier(e: ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setErreur("");
    setAbonnements(null);
    if (fichier.size > 5_000_000) {
      setErreur("Ce fichier est trop gros. Exporte moins de mois et réessaie.");
      return;
    }
    const lecture = lireReleve(decoder(await fichier.arrayBuffer()));
    if (!lecture.ok) {
      setErreur(lecture.erreur);
      return;
    }
    setAbonnements(detecter(lecture.operations));
  }

  async function payer() {
    if (!abonnements) return;
    setEnCours(true);
    setErreurPaiement("");
    try {
      try {
        window.sessionStorage.setItem(
          CLE_STOCKAGE,
          JSON.stringify(abonnements),
        );
      } catch {
        /* le paiement reste possible sans sauvegarde */
      }
      const reponse = await fetch("/api/checkout", { method: "POST" });
      const donnees: { url?: string; erreur?: string } = await reponse.json();
      if (!reponse.ok || !donnees.url) {
        setErreurPaiement(
          donnees.erreur ?? "Le paiement n'a pas pu démarrer. Réessaie.",
        );
        setEnCours(false);
        return;
      }
      window.location.href = donnees.url;
    } catch {
      setErreurPaiement("Connexion impossible. Vérifie ton réseau et réessaie.");
      setEnCours(false);
    }
  }

  const paye = statut === "paye";
  const total = abonnements
    ? abonnements.reduce((somme, a) => somme + a.montantAnnuel, 0)
    : 0;
  const visibles = abonnements ? (paye ? abonnements : abonnements.slice(0, 2)) : [];
  const verrouilles = abonnements && !paye ? abonnements.slice(2) : [];

  const entete = (
    <a href="/" className="font-titre text-xl font-extrabold tracking-tight">
      Fantômes
    </a>
  );

  if (statut === "verification") {
    return (
      <main className="mx-auto w-full max-w-md px-6 pb-16 pt-10">
        {entete}
        <h1 className="font-titre mt-10 text-[2rem] font-extrabold leading-[1.1]">
          Vérification de ton paiement…
        </h1>
        <p className="mt-4 text-lg leading-relaxed">
          Ça prend quelques secondes. Ne ferme pas cette page.
        </p>
      </main>
    );
  }

  if (statut === "echec") {
    return (
      <main className="mx-auto w-full max-w-md px-6 pb-16 pt-10">
        {entete}
        <h1 className="font-titre mt-10 text-[2rem] font-extrabold leading-[1.1]">
          Paiement pas encore confirmé.
        </h1>
        <p className="mt-4 text-lg leading-relaxed">
          Nous n&apos;avons pas encore reçu la confirmation de ta banque. Recharge
          la page dans une minute. Si le problème continue, ne paie pas une
          deuxième fois : reviens nous voir plus tard.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 block w-full rounded-xl bg-tampon px-6 py-4 text-center text-lg font-semibold text-papier"
        >
          Recharger la page
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 pb-16 pt-10">
      {entete}

      {annule && (
        <p className="mt-6 border-l-4 border-tampon pl-3">
          Paiement annulé. Tu n&apos;as pas été débité.
        </p>
      )}

      {paye && (
        <p className="mt-6 border-l-4 border-tampon pl-3">
          Paiement confirmé. Merci. Ton audit complet est débloqué.
        </p>
      )}

      {abonnements === null && (
        <section className="mt-10">
          <h1 className="font-titre text-[2rem] font-extrabold leading-[1.1]">
            {paye
              ? "Redépose ton relevé pour voir l'audit complet."
              : "Dépose ton relevé bancaire."}
          </h1>
          <p className="mt-4 text-lg leading-relaxed">
            Choisis le fichier CSV de ton compte principal, sur 3 à 12 mois.
            Tu le trouves dans ton espace bancaire, rubrique « Exporter » ou
            « Télécharger mes opérations ».
          </p>
          <p className="mt-3 text-sm opacity-70">
            Ton fichier est lu sur ton appareil. Il n&apos;est envoyé à aucun
            serveur.
          </p>

          <label className="mt-8 block cursor-pointer rounded-xl bg-tampon px-6 py-4 text-center text-lg font-semibold text-papier">
            Choisir mon relevé
            <input
              type="file"
              accept=".csv,.txt,text/csv"
              className="sr-only"
              onChange={surFichier}
            />
          </label>

          {erreur && (
            <p role="alert" className="mt-4 border-l-4 border-tampon pl-3">
              {erreur}
            </p>
          )}
        </section>
      )}

      {abonnements !== null && abonnements.length === 0 && (
        <section className="mt-10">
          <h1 className="font-titre text-[2rem] font-extrabold leading-[1.1]">
            Aucun prélèvement régulier trouvé.
          </h1>
          <p className="mt-4 text-lg leading-relaxed">
            Il faut au moins 3 mois d&apos;opérations pour repérer un
            prélèvement qui revient. Exporte une période plus longue et
            réessaie.
          </p>
          <button
            type="button"
            onClick={() => setAbonnements(null)}
            className="mt-6 block w-full rounded-xl border-2 border-encre px-6 py-4 text-center text-lg font-semibold"
          >
            Essayer avec un autre fichier
          </button>
        </section>
      )}

      {abonnements !== null && abonnements.length > 0 && (
        <section className="mt-10">
          <h1 className="font-titre text-[2rem] font-extrabold leading-[1.1]">
            {abonnements.length} prélèvements réguliers.
            <span className="text-tampon"> {euros(total)} par an.</span>
          </h1>

          <ul className="mt-6 divide-y divide-encre/20 border-y border-encre/20">
            {visibles.map((a) => (
              <li
                key={a.nom}
                className="flex items-baseline justify-between gap-4 py-3"
              >
                <span>
                  {a.nom}
                  <span className="block text-sm opacity-70">
                    {euros(a.montantMensuel)} par mois · dernier le {a.derniere}
                  </span>
                </span>
                <span className="font-titre text-xl font-extrabold tabular-nums text-tampon">
                  {euros(a.montantAnnuel)}
                </span>
              </li>
            ))}
            {verrouilles.map((a) => (
              <li
                key={a.nom}
                className="flex items-baseline justify-between gap-4 py-3"
              >
                <span>
                  {a.nom}
                  <span className="block text-sm opacity-70">Verrouillé</span>
                </span>
                <span
                  aria-hidden="true"
                  className="select-none font-titre text-xl font-extrabold tabular-nums text-tampon blur-sm"
                >
                  {euros(a.montantAnnuel)}
                </span>
              </li>
            ))}</ul>

          {!paye && (
            <div className="mt-8 border-2 border-encre p-5">
              <p className="font-titre text-xl font-extrabold">
                {verrouilles.length > 0
                  ? `Il en reste ${verrouilles.length} à découvrir.`
                  : "Ton audit complet."}
              </p>
              <p className="mt-2">
                L&apos;audit complet affiche tous les montants et prépare une
                lettre de résiliation pour chaque abonnement.
              </p>
              <button
                type="button"
                onClick={payer}
                disabled={enCours}
                className="mt-4 block w-full rounded-xl bg-tampon px-6 py-4 text-center text-lg font-semibold text-papier disabled:opacity-60"
              >
                {enCours ? "Redirection…" : "Débloquer l'audit complet · 19 €"}
              </button>
              <p className="mt-2 text-center text-sm opacity-70">
                Paiement unique. Aucun abonnement.
              </p>
              {erreurPaiement && (
                <p role="alert" className="mt-3 border-l-4 border-tampon pl-3">
                  {erreurPaiement}
                </p>
              )}
            </div>
          )}

          {paye && <Lettres abonnements={abonnements} />}

          <button
            type="button"
            onClick={() => setAbonnements(null)}
            className="mt-6 block w-full text-center underline"
          >
            Essayer avec un autre fichier
          </button>
        </section>
      )}
    </main>
  );
}

          
