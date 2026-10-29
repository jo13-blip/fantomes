export type ParamsLettre = {
  nom: string;
  adresse: string;
  service: string;
  reference: string;
  montantMensuel: number;
  date: Date;
};

export function construireLettre(p: ParamsLettre): string {
  const nom = p.nom.trim() || "[Prénom Nom]";
  const adresse = p.adresse.trim() || "[Adresse postale]";
  const service = p.service.trim() || "[Nom du service]";
  const reference = p.reference.trim();
  const montant = p.montantMensuel.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
  const date = p.date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const lignes = [
    nom,
    adresse,
    "",
    `Service résiliation, ${service}`,
    "",
    `Le ${date}`,
    "",
    `Objet : résiliation de mon abonnement ${service}`,
  ];
  if (reference) lignes.push(`Référence client : ${reference}`);
  lignes.push(
    "",
    "Madame, Monsieur,",
    "",
    `Par la présente, je vous informe de ma décision de résilier mon abonnement « ${service} », prélevé chaque mois sur mon compte bancaire (environ ${montant} par mois).`,
    "",
    "Cette résiliation prend effet dès la réception de ce courrier, ou à la prochaine échéance si votre contrat l'impose. Je vous demande de cesser tout prélèvement à compter de cette date.",
    "",
    "Merci de me confirmer par écrit la prise en compte de cette résiliation, ainsi que sa date d'effet.",
    "",
    "Je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.",
    "",
    nom,
  );
  return lignes.join("\n");
}
