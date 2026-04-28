import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "FlowBot — Painel de Controle",
  description: "Automatize vendas via Telegram com pagamento Pix",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full dark">
      <body className={`${spaceGrotesk.variable} min-h-full antialiased`}
        style={{ fontFamily: "var(--font-sans), system-ui, sans-serif", background: "var(--background)", color: "var(--foreground)" }}>
        {children}
      </body>
    </html>
  );
}
