import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["600", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const titre = "Fantômes — Débusque les abonnements que tu paies sans t'en servir";
const description =
  "Dépose ton relevé bancaire : Fantômes repère les prélèvements oubliés et te dit combien ils te coûtent par an.";

export const metadata: Metadata = {
  title: titre,
  description,
  openGraph: {
    title: titre,
    description,
    locale: "fr_FR",
    type: "website",
    siteName: "Fantômes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
