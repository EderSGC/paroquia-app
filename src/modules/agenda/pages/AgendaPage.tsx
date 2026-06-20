// src/modules/agenda/pages/AgendaPage.tsx
import { useState } from "react";
import type { Paroquia } from "../../../core/types/app.types";

import { CalendarioPage } from "./CalendarioPage";
import { ProgramaMissasPage } from "./ProgramaMissasPage";
import { EventosParoquiaisPage } from "./EventosParoquiaisPage";
import { EscalaMinistrosPage } from "./EscalaMinistrosPage";
import { ReunioesPage } from "./ReunioesPage";
import { ReservasPage } from "./ReservasPage";
import { FormacoesPage } from "./FormacoesPage";
import { VisitasPage } from "./VisitasPage";

type AgendaTab = "calendario" | "eventos" | "reunioes" | "reservas" | "formacoes" | "visitas" | "missas" | "escala";

interface Props {
  paroquia: Paroquia;
  abaPadrao?: string;
}

const TAB_LABELS: Record<AgendaTab, string> = {
  calendario: "📅 Calendário",
  eventos:    "Eventos Paroquiais",
  reunioes:   "Reuniões",
  reservas:   "Reservas de Espaços",
  formacoes:  "Formações",
  visitas:    "Visitas Pastorais",
  missas:     "Programa de Missas",
  escala:     "Escala de Ministros",
};

export function AgendaPage({ paroquia, abaPadrao }: Props) {
  const [tab, setTab] = useState<AgendaTab>((abaPadrao as AgendaTab) ?? "calendario");
  const [hoveredTab, setHoveredTab] = useState<AgendaTab | null>(null);

  function renderContent() {
    switch (tab) {
      case "calendario": return <CalendarioPage />;
      case "eventos":    return <EventosParoquiaisPage paroquia={paroquia} />;
      case "missas":     return <ProgramaMissasPage paroquia={paroquia} />;
      case "escala":     return <EscalaMinistrosPage paroquia={paroquia} />;
      case "reunioes":   return <ReunioesPage paroquia={paroquia} />;
      case "reservas":   return <ReservasPage paroquia={paroquia} />;
      case "formacoes":  return <FormacoesPage paroquia={paroquia} />;
      case "visitas":    return <VisitasPage paroquia={paroquia} />;
      default:           return <CalendarioPage />;
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section
        style={{
          background: "white",
          borderRadius: 18,
          border: "1px solid #e4e7ec",
          padding: 16,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {(Object.keys(TAB_LABELS) as AgendaTab[]).map((item) => {
          const isActive = tab === item;
          const isHovered = hoveredTab === item;

          return (
            <button
              key={item}
              onClick={() => setTab(item)}
              onMouseEnter={() => setHoveredTab(item)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "10px 20px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                transition: "all 0.2s ease",
                background: isActive ? "#1f3b73" : isHovered ? "#e2e8f0" : "#eef2f7",
                color: isActive ? "white" : "#344054",
                transform: isHovered && !isActive ? "translateY(-1px)" : "none",
              }}
            >
              {TAB_LABELS[item]}
            </button>
          );
        })}
      </section>

      {renderContent()}
    </div>
  );
}
