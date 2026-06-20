import { useState } from "react";
import type { Paroquia } from "../../core/types/app.types";
import { BatismoPage } from "./pages/BatismoPage";
import { CrismaPage } from "./pages/CrismaPage";
import { MatrimonioPage } from "./pages/MatrimonioPage";
import { UncaoDosEnfermosPage } from "./pages/UncaoDosEnfermosPage";
import { PrimeiraEucaristiaPage } from "./pages/PrimeiraEucaristiaPage";
import { ObitosExequiasPage } from "./pages/ObitosExequiasPage";
import { CertificadoBatismoPage } from "./pages/CertificadoBatismoPage";
import { CertificadoCrismaPage } from "./pages/CertificadoCrismaPage";
import { CertificadoEucaristiaPage } from "./pages/CertificadoEucaristiaPage";
import { CertificadoMatrimonioPage } from "./pages/CertificadoMatrimonioPage";

type SubTab = "FICHA" | "CERTIFICADO";

const TITULOS: Record<string, string> = {
  BATISMO:    "Batismo",
  EUCARISTIA: "1ª Eucaristia",
  CRISMA:     "Crisma",
  MATRIMONIO: "Matrimônio",
  UNCAO:      "Unção dos Enfermos",
  OBITOS:     "Óbitos / Exéquias",
};

const COM_CERTIFICADO = new Set(["BATISMO", "EUCARISTIA", "CRISMA", "MATRIMONIO"]);

export function SacramentalModule({ paroquia, abaPadrao }: { paroquia: Paroquia; abaPadrao?: string }) {
  const [subTab, setSubTab] = useState<SubTab>("FICHA");
  const sacramento = abaPadrao ?? "BATISMO";
  const titulo = TITULOS[sacramento] ?? sacramento;
  const temCertificado = COM_CERTIFICADO.has(sacramento);

  const renderFicha = () => {
    switch (sacramento) {
      case "BATISMO":    return <BatismoPage paroquia={paroquia} />;
      case "EUCARISTIA": return <PrimeiraEucaristiaPage paroquia={paroquia} />;
      case "CRISMA":     return <CrismaPage paroquia={paroquia} />;
      case "MATRIMONIO": return <MatrimonioPage paroquia={paroquia} />;
      case "UNCAO":      return <UncaoDosEnfermosPage paroquia={paroquia} />;
      case "OBITOS":     return <ObitosExequiasPage paroquia={paroquia} />;
      default:           return null;
    }
  };

  const renderCertificado = () => {
    switch (sacramento) {
      case "BATISMO":    return <CertificadoBatismoPage paroquia={paroquia} />;
      case "EUCARISTIA": return <CertificadoEucaristiaPage paroquia={paroquia} />;
      case "CRISMA":     return <CertificadoCrismaPage paroquia={paroquia} />;
      case "MATRIMONIO": return <CertificadoMatrimonioPage paroquia={paroquia} />;
      default:           return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-app)" }}>
      <style>{`
        .ui-fixa * { font-family: 'Inter', system-ui, sans-serif !important; }
        .sacr-tab {
          border: none; padding: 6px 18px; border-radius: 8px;
          cursor: pointer; font-size: 12px; font-weight: 600;
          transition: background 0.15s, color 0.15s; font-family: inherit;
        }
        .sacr-tab-ativo   { background: var(--dm-tab-active-bg) !important; color: #fff !important; }
        .sacr-tab-inativo { background: var(--dm-tab-bg) !important; color: var(--dm-tab-color) !important; }
      `}</style>

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
        <div>
          <h2 style={{ margin: 0, color: "var(--dm-badge-color)", fontSize: "18px" }}>{titulo}</h2>
          {temCertificado && (
            <nav style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                className={`sacr-tab ${subTab === "FICHA" ? "sacr-tab-ativo" : "sacr-tab-inativo"}`}
                onClick={() => setSubTab("FICHA")}
              >
                Ficha
              </button>
              <button
                className={`sacr-tab ${subTab === "CERTIFICADO" ? "sacr-tab-ativo" : "sacr-tab-inativo"}`}
                onClick={() => setSubTab("CERTIFICADO")}
              >
                Certificado
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="ui-fixa" style={{ flex: 1, overflow: "auto" }}>
        {subTab === "CERTIFICADO" && temCertificado ? renderCertificado() : renderFicha()}
      </main>
    </div>
  );
}
