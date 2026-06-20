// src/modules/documentos/pages/DocumentosPage.tsx
import type { Paroquia } from "../../../core/types/app.types";

import { MemorandoPage } from "./MemorandoPage";
import { FichaInscricaoPage } from "./FichaInscricaoPage";
import { AtaPage } from "./AtaPage";
import { CartasPage } from "./CartasPage";
import { OficiosPage } from "./OficiosPage";
import { ContratosPage } from "./ContratosPage";
import { RecibosPage } from "./RecibosPage";
import { LicencasPage } from "./LicencasPage";
import { AutorizacoesPage } from "./AutorizacoesPage";
import { DocumentosDiocesePage } from "./DocumentosDiocesePage";
import { DocumentosComunidadesPage } from "./DocumentosComunidadesPage";
import { RelatoriosPastoraisPage } from "./RelatoriosPastoraisPage";

type DocumentoTab =
  | "memorando"
  | "ficha"
  | "ata"
  | "cartas"
  | "oficios"
  | "contratos"
  | "recibos"
  | "licencas"
  | "autorizacoes"
  | "diocese"
  | "comunidades"
  | "relatorios_pastorais";

interface DocumentosPageProps {
  paroquia: Paroquia;
  abaPadrao?: string;
}

const TITULOS: Record<DocumentoTab, string> = {
  memorando:            "Memorando",
  ficha:                "Ficha de Inscrição",
  ata:                  "Ata Paroquial",
  cartas:               "Cartas",
  oficios:              "Ofícios",
  contratos:            "Contratos",
  recibos:              "Recibos",
  licencas:             "Licenças",
  autorizacoes:         "Autorizações",
  diocese:              "Documentos da Diocese",
  comunidades:          "Documentos de Comunidades",
  relatorios_pastorais: "Relatórios Pastorais",
};

export function DocumentosPage({ paroquia, abaPadrao }: DocumentosPageProps) {
  const tab = (abaPadrao as DocumentoTab) ?? "memorando";
  const titulo = TITULOS[tab] ?? tab;

  const renderTab = () => {
    switch (tab) {
      case "ata":                  return <AtaPage paroquia={paroquia} />;
      case "ficha":                return <FichaInscricaoPage paroquia={paroquia} />;
      case "cartas":               return <CartasPage paroquia={paroquia} />;
      case "oficios":              return <OficiosPage paroquia={paroquia} />;
      case "contratos":            return <ContratosPage paroquia={paroquia} />;
      case "recibos":              return <RecibosPage paroquia={paroquia} />;
      case "licencas":             return <LicencasPage paroquia={paroquia} />;
      case "autorizacoes":         return <AutorizacoesPage paroquia={paroquia} />;
      case "diocese":              return <DocumentosDiocesePage paroquia={paroquia} />;
      case "comunidades":          return <DocumentosComunidadesPage paroquia={paroquia} />;
      case "relatorios_pastorais": return <RelatoriosPastoraisPage paroquia={paroquia} />;
      case "memorando":
      default:                     return <MemorandoPage paroquia={paroquia} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-app)" }}>
      <header style={{ padding: "10px 25px", background: "var(--dm-card-bg)", borderBottom: "1px solid var(--dm-card-border)" }}>
        <h2 style={{ margin: 0, color: "var(--dm-badge-color)", fontSize: "18px" }}>{titulo}</h2>
      </header>
      <main style={{ flex: 1, padding: "25px", overflow: "auto" }}>
        {renderTab()}
      </main>
    </div>
  );
}
