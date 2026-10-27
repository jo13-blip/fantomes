export type Operation = { date: Date; libelle: string; montant: number };

export type Abonnement = {
  nom: string;
  montantMensuel: number;
  montantAnnuel: number;
  occurrences: number;
  derniere: string;
};

export type ResultatLecture =
  | { ok: true; operations: Operation[] }
  | { ok: false; erreur: string };

function sansAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function decouper(ligne: string, sep: string): string[] {
  const cellules: string[] = [];
  let courant = "";
  let entreGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') {
      if (entreGuillemets && ligne[i + 1] === '"') {
        courant += '"';
        i++;
      } else {
        entreGuillemets = !entreGuillemets;
      }
    } else if (c === sep && !entreGuillemets) {
      cellules.push(courant.trim());
      courant = "";
    } else {
      courant += c;
    }
  }
  cellules.push(courant.trim());
  return cellules;
}

function nombre(brut: string): number | null {
  let t = brut.replace(/[\s\u00a0€]|EUR/gi, "");
  if (t === "") return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  if (!/^[+-]?\d+(\.\d+)?$/.test(t)) return null;
  return parseFloat(t);
}

function dateValide(annee: number, mois: number, jour: number): Date | null {
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return null;
  return new Date(annee, mois - 1, jour);
}

function lireDate(brut: string): Date | null {
  const t = brut.trim();
  let m = t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4}|\d{2})/);
  if (m) {
    const annee = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return dateValide(annee, Number(m[2]), Number(m[1]));
  }
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return dateValide(Number(m[1]), Number(m[2]), Number(m[3]));
  return null;
}

export function lireReleve(texte: string): ResultatLecture {
  const lignes = texte
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  if (lignes.length < 2) {
    return { ok: false, erreur: "Le fichier semble vide." };
  }

  const echantillon = lignes.slice(0, 10).join("\n");
  const sep = [";", "\t", ","]
    .map((s) => ({ s, n: echantillon.split(s).length }))
    .sort((a, b) => b.n - a.n)[0].s;

  let indexEntete = -1;
  let cols = { date: -1, libelle: -1, montant: -1, debit: -1, credit: -1 };
  for (let i = 0; i < Math.min(lignes.length, 40); i++) {
    const cel = decouper(lignes[i], sep).map((c) =>
      sansAccents(c).toLowerCase(),
    );
    const d = cel.findIndex((c) => /date/.test(c));
    const l = cel.findIndex((c) =>
      /libelle|label|description|detail|intitule|objet|nature/.test(c),
    );
    const mo = cel.findIndex((c) => /montant|amount/.test(c));
    const de = cel.findIndex((c) => /debit/.test(c));
    const cr = cel.findIndex((c) => /credit/.test(c));
    if (d >= 0 && l >= 0 && (mo >= 0 || de >= 0)) {
      indexEntete = i;
      cols = { date: d, libelle: l, montant: mo, debit: de, credit: cr };
      break;
    }
  }
  if (indexEntete < 0) {
    return {
      ok: false,
      erreur:
        "Je n'ai pas reconnu les colonnes (date, libellé, montant). Vérifie que tu as exporté ton relevé au format CSV.",
    };
  }

  const operations: Operation[] = [];
  for (const ligne of lignes.slice(indexEntete + 1)) {
    const cel = decouper(ligne, sep);
    const d = lireDate(cel[cols.date] ?? "");
    const libelle = cel[cols.libelle] ?? "";
    if (!d || !libelle) continue;

    let montant: number | null = null;
    if (cols.montant >= 0) {
      montant = nombre(cel[cols.montant] ?? "");
    } else {
      const debit = cols.debit >= 0 ? nombre(cel[cols.debit] ?? "") : null;
      const credit = cols.credit >= 0 ? nombre(cel[cols.credit] ?? "") : null;
      if (debit !== null && debit !== 0) montant = -Math.abs(debit);
      else if (credit !== null) montant = Math.abs(credit);
    }
    if (montant === null) continue;
    operations.push({ date: d, libelle, montant });
  }

  if (operations.length === 0) {
    return { ok: false, erreur: "Aucune opération lisible dans ce fichier." };
  }
  return { ok: true, operations };
}

function cle(libelle: string): string {
  let t = sansAccents(libelle).toUpperCase();
  t = t.replace(
    /\b(PRLV|PRELEVEMENT|PRELEVT|SEPA|PAIEMENT|PAIEMT|CARTE|CB|VIR|VIREMENT|ECH|ECHEANCE|FACTURE|FACT|REF|MANDAT|DE|DU|LE|LA|PAR|PSC|PCE|NO|X\d+)\b/g,
    " ",
  );
  t = t.replace(/\d{1,2}[\/.\-]\d{1,2}([\/.\-]\d{2,4})?/g, " ");
  t = t.replace(/[0-9]+/g, " ").replace(/[^A-Z ]/g, " ");
  const mots = t.split(/\s+/).filter((m) => m.length > 1);
  return mots.slice(0, 2).join(" ");
}

function mediane(valeurs: number[]): number {
  const t = [...valeurs].sort((a, b) => a - b);
  return t[Math.floor(t.length / 2)];
}

function joli(nom: string): string {
  return nom
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

export function detecter(operations: Operation[]): Abonnement[] {
  const groupes = new Map<string, Operation[]>();
  for (const o of operations) {
    if (o.montant >= 0) continue;
    const k = cle(o.libelle);
    if (!k) continue;
    const liste = groupes.get(k);
    if (liste) liste.push(o);
    else groupes.set(k, [o]);
  }

  const resultats: Abonnement[] = [];
  for (const [k, liste] of groupes) {
    liste.sort((a, b) => a.date.getTime() - b.date.getTime());
    const mois = new Set(
      liste.map((o) => `${o.date.getFullYear()}-${o.date.getMonth()}`),
    );
    if (liste.length < 3 || mois.size < 3) continue;

    const montants = liste.map((o) => Math.abs(o.montant));
    const med = mediane(montants);
    const stables = montants.filter((m) => Math.abs(m - med) <= med * 0.1);
    if (stables.length / montants.length < 0.8) continue;

    const ecarts: number[] = [];
    for (let i = 1; i < liste.length; i++) {
      ecarts.push(
        (liste[i].date.getTime() - liste[i - 1].date.getTime()) / 86400000,
      );
    }
    const ecartMedian = mediane(ecarts);
    if (ecartMedian < 24 || ecartMedian > 38) continue;

    const derniere = liste[liste.length - 1].date;
    resultats.push({
      nom: joli(k),
      montantMensuel: Math.round(med * 100) / 100,
      montantAnnuel: Math.round(med * 12 * 100) / 100,
      occurrences: liste.length,
      derniere: derniere.toLocaleDateString("fr-FR"),
    });
  }

  return resultats.sort((a, b) => b.montantAnnuel - a.montantAnnuel);
}
