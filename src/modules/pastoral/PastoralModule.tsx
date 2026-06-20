import { useState } from "react";
import type { Paroquia } from "../../core/types/app.types";
import { FontSelector } from "@core/components/FontSelector";
import { CadastroFieisPage } from "./pages/CadastroFieisPage";
import { ComunidadesPage } from "./pages/ComunidadesPage";
import { GruposPage } from "./pages/GruposPage";
import { PastoralPage } from "./pages/PastoralPage";
import { CadastroFamiliasPage } from "./pages/CadastroFamiliasPage";
import { FieisLixeiraPage } from "./pages/FieisLixeiraPage";

interface PastoralModuleProps {
  paroquia?: Paroquia;
  abaPadrao?: string;
  comunidadeId?: number | null;
  comunidadeNome?: string | null;
}

const TITULOS: Record<string, string> = {
  "FIÉIS":       "Fiéis",
  "FAMÍLIAS":    "Famílias",
  "COMUNIDADES": "Comunidades",
  "GRUPOS":      "Grupos e Movimentos",
  "PASTORAIS":   "Pastorais",
  "LIXEIRA":     "Registros Excluídos",
};

export function PastoralModule({
  paroquia,
  abaPadrao = "FIÉIS",
  comunidadeId = null,
  comunidadeNome = null,
}: PastoralModuleProps) {
  const [fonteGlobal, setFonteGlobal] = useState("Arial");
  const isMembro = comunidadeId != null;
  const titulo = TITULOS[abaPadrao] ?? abaPadrao;

  const pagina = (() => {
    switch (abaPadrao) {
      case "FIÉIS":       return <CadastroFieisPage paroquia={paroquia} comunidadeFiltro={comunidadeNome} />;
      case "FAMÍLIAS":    return <CadastroFamiliasPage paroquia={paroquia} comunidadeFiltro={comunidadeNome} />;
      case "COMUNIDADES": return <ComunidadesPage paroquia={paroquia} fonte={fonteGlobal} />;
      case "GRUPOS":      return <GruposPage paroquia={paroquia} fonte={fonteGlobal} comunidadeFiltro={comunidadeNome} />;
      case "PASTORAIS":   return <PastoralPage paroquia={paroquia} fonte={fonteGlobal} comunidadeFiltro={comunidadeNome} />;
      case "LIXEIRA":     return <FieisLixeiraPage />;
      default:            return null;
    }
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-app)" }}>
      <style>{`.ui-fixa * { font-family: 'Inter', system-ui, sans-serif !important; }`}</style>

      <header
        className="ui-fixa"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 25px",
          background: "var(--dm-card-bg)",
          borderBottom: "1px solid var(--dm-card-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0, color: "var(--dm-badge-color)", fontSize: "18px" }}>{titulo}</h2>
          {isMembro && (
            <span style={{
              background: "var(--dm-badge-bg)", color: "var(--dm-badge-color)",
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
            }}>
              🔒 {comunidadeNome}
            </span>
          )}
        </div>
        <FontSelector fonteAtual={fonteGlobal} onChange={setFonteGlobal} />
      </header>

      <main className="ui-fixa" style={{ flex: 1, overflow: "auto" }}>
        {pagina}
      </main>
    </div>
  );
}
