import type { Paroquia } from "../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";

import { TurmasPage } from "./pages/TurmasPage";
import { CatequistasPage } from "./pages/CatequistasPage";
import { PresencaPage } from "./pages/PresencaPage";
import { FichaInscricaoPage } from "./pages/FichaInscricaoPage";

interface CatequeseModuleProps {
  paroquia: Paroquia;
  comunidadeId?: number | null;
  comunidadeNome?: string | null;
  abaPadrao?: string;
}

const TITULOS: Record<string, string> = {
  "MATRÍCULAS":  "Matrículas",
  "TURMAS":      "Turmas",
  "PRESENÇA":    "Presença",
  "CATEQUISTAS": "Catequistas",
};

export function CatequeseModule({ paroquia, comunidadeId: _comunidadeId, comunidadeNome: _comunidadeNome, abaPadrao }: CatequeseModuleProps) {
  void _comunidadeId;
  void _comunidadeNome;

  const aba = abaPadrao ?? "TURMAS";
  const titulo = TITULOS[aba] ?? aba;

  const renderAba = () => {
    switch (aba) {
      case "MATRÍCULAS":  return <FichaInscricaoPage paroquia={paroquia} />;
      case "PRESENÇA":    return <PresencaPage paroquia={paroquia} />;
      case "CATEQUISTAS": return <CatequistasPage paroquia={paroquia} />;
      case "TURMAS":
      default:            return <TurmasPage paroquia={paroquia} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-app)" }}>
      <style>{`
        @media print {
          header, nav, .no-print, button, aside, .toolbar-area, .form-container { display: none !important; }
          #print-header, .print-area { display: block !important; }
          @page { size: A4 portrait; margin: 15mm; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #000 !important; padding: 10px !important; font-size: 11pt !important; }
          .only-print { display: block !important; text-align: center; margin-bottom: 20px; font-size: 16pt; font-weight: bold; }
        }
      `}</style>

      <header className="no-print" style={{ padding: "10px 25px", background: "var(--dm-card-bg)", borderBottom: "1px solid var(--dm-card-border)" }}>
        <h2 style={{ margin: 0, color: "var(--dm-badge-color)", fontSize: "18px" }}>{titulo}</h2>
      </header>

      <main style={{ flex: 1, padding: "25px", overflow: "auto" }}>
        <div id="print-header" style={{ display: "none" }}>
          <DocumentHeader paroquia={paroquia} />
        </div>
        <div className="content-wrapper">
          {renderAba()}
        </div>
      </main>
    </div>
  );
}
