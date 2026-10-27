"use client";

import { useState, type ChangeEvent } from "react";
import { detecter, lireReleve, type Abonnement } from "@/lib/detect";

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

export default function Commencer() {
  const [abonnements, setAbonnements] = useState<Abonnement[] | null>(null);
  const [erreur, setErreur] = useState("");

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

  const total = abonnements
    ? abonnements.reduce((somme, a) => somme + a.montantAnnuel, 0)
    : 0;
  const visibles = abonnements ? abonnements.slice(0, 2) : [];
  const verrouilles = abonnements ? abonnements.slice(2) : [];

  return (
    <main className="mx-auto w-full max-w-md px-6 pb-16 pt-10">
      <a href="/" className="font-titre text-xl font-extrabold tracking-tight">
        Fantômes
      </a>

      {abonnements === null && (
        <section className="mt-10">
          <h1 className="font-titre text-[2rem] font-extrabold leading-[1.1]">
            Dépose ton relevé bancaire.
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
            <span className="text-tampon">
              {" "}
              {euros(total)} par an.
            </span>
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
                  <span className="block text-sm opacity-70">
                    Verrouillé
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="select-none font-titre text-xl font-extrabold tabular-nums text-tampon blur-sm"
                >
                  {euros(a.montantAnnuel)}
                </span>
              </li>
            ))}
          </ul>

          {verrouilles.length > 0 && (
            <div className="mt-8 border-2 border-encre p-5">
              <p className="font-titre text-xl font-extrabold">
                Il en reste {verrouilles.length} à découvrir.
              </p>
              <p className="mt-2">
                L&apos;audit complet affiche tous les montants et prépare une
                lettre de résiliation pour chaque abonnement.
              </p>
              <button
                type="button"
                disabled
                className="mt-4 block w-full rounded-xl bg-encre/30 px-6 py-4 text-center text-lg font-semibold text-encre"
              >
                Bientôt disponible
              </button>
            </div>
          )}

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
