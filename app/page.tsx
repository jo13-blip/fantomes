const exemples = [
  { nom: "Essai de musique jamais résilié", mois: "9,99 €", an: "120 €" },
  { nom: "Option activée une seule fois", mois: "4,99 €", an: "60 €" },
  { nom: "Service remplacé par un autre", mois: "2,49 €", an: "30 €" },
];

const benefices = [
  {
    titre: "Il retrouve les prélèvements oubliés",
    texte: "Tu déposes ton relevé, Fantômes repère ce qui revient chaque mois.",
  },
  {
    titre: "Il les classe par coût annuel",
    texte: "9,99 € par mois, ça semble peu. 120 € par an, ça se voit enfin.",
  },
  {
    titre: "Il écrit la lettre de résiliation",
    texte: "Une lettre prête à envoyer pour chaque abonnement. Tu n'as rien à rédiger.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pb-32 pt-10">
      <p className="font-titre text-xl font-extrabold tracking-tight">
        Fantômes
      </p>

      <h1 className="font-titre mt-10 text-[2.5rem] font-extrabold leading-[1.05]">
        Tu paies des abonnements que tu n&apos;utilises plus.
        <span className="text-tampon"> Fantômes les retrouve.</span>
      </h1>

      <p className="mt-5 text-lg leading-relaxed">
        Un essai jamais résilié, un service remplacé, une option activée une
        fois : ces petits prélèvements passent inaperçus et tournent pendant
        des années.
      </p>

      <a
        id="commencer"
        href="#bientot"
        className="mt-8 block rounded-xl bg-tampon px-6 py-4 text-center text-lg font-semibold text-papier"
      >
        Commencer, c&apos;est gratuit
      </a>

      <section className="mt-14" aria-labelledby="douleur">
        <h2 id="douleur" className="font-titre text-2xl font-extrabold">
          Petits par mois, lourds par an
        </h2>
        <p className="mt-2 text-sm uppercase tracking-widest opacity-70">
          Exemple
        </p>
        <ul className="mt-3 divide-y divide-encre/20 border-y border-encre/20">
          {exemples.map((e) => (
            <li key={e.nom} className="flex items-baseline justify-between gap-4 py-3">
              <span>
                {e.nom}
                <span className="block text-sm opacity-70">{e.mois} par mois</span>
              </span>
              <span className="font-titre text-xl font-extrabold tabular-nums text-tampon">
                {e.an}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right">
          Total : <strong className="tabular-nums">210 € par an</strong>
        </p>
      </section>

      <section className="mt-14" aria-labelledby="benefices">
        <h2 id="benefices" className="font-titre text-2xl font-extrabold">
          Ce que fait Fantômes pour toi
        </h2>
        <ol className="mt-5 space-y-6">
          {benefices.map((b, i) => (
            <li key={b.titre} className="flex gap-4">
              <span className="font-titre text-3xl font-extrabold text-tampon">
                {i + 1}
              </span>
              <span>
                <strong className="block">{b.titre}</strong>
                {b.texte}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section id="bientot" className="mt-14 border-t border-encre/20 pt-8">
        <p className="font-titre text-xl font-extrabold">
          Ouverture très bientôt.
        </p>
        <p className="mt-2">
          Le service est en cours de finalisation. Reviens dans quelques jours.
        </p>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-encre/20 bg-papier p-4">
        <a
          href="#bientot"
          className="mx-auto block max-w-md rounded-xl bg-tampon px-6 py-4 text-center text-lg font-semibold text-papier"
        >
          Commencer, c&apos;est gratuit
        </a>
      </div>
    </main>
  );
}
