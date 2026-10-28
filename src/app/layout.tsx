import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Imposto Fronteira PB",
  description: "Simulador do ICMS de fronteira em compras interestaduais com destino à Paraíba.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-line">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <Link href="/" className="font-semibold">
              Imposto Fronteira PB
              <span className="block text-xs font-normal text-muted">Marconi Pinto Metalúrgica · Simples Nacional</span>
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="hover:text-accent">Simulador</Link>
              <Link href="/historico" className="hover:text-accent">Histórico</Link>
              <Link href="/como-calcular" className="hover:text-accent">Como é calculado</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-muted">
          Simulação de apoio à compra. Confirme valores com a contabilidade e a legislação vigente da SEFAZ-PB.
        </footer>
      </body>
    </html>
  );
}
