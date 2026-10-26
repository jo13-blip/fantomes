import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fantômes — Débusque les abonnements que tu paies sans t'en servir",
  description:
    "Dépose ton relevé bancaire : Fantômes repère les prélèvements oubliés et te dit combien ils te coûtent par an.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
