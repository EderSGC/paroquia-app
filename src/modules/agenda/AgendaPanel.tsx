import { useEffect, useState } from "react";
import { getDb } from "@core/database";
import { PanelSection, PanelDivider, PanelRow } from "@/components/ui/SectionHeader";

interface Stats {
  totalHoje: number;
  totalSemana: number;
  totalMes: number;
  proximos: { titulo: string; data: string; horario: string; categoria: string }[];
}

const empty: Stats = { totalHoje: 0, totalSemana: 0, totalMes: 0, proximos: [] };

export function AgendaPanel() {
  const [data, setData] = useState<Stats>(empty);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getDb();
        const n = async (sql: string, p?: unknown[]) => {
          const r = await db.select<{ n: number }[]>(sql, p ?? []);
          return r[0]?.n ?? 0;
        };

        const hoje = new Date().toISOString().slice(0, 10);
        const daqui7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
        const anoMes = hoje.slice(0, 7);

        const [totalHoje, totalSemana, totalMes] = await Promise.all([
          n("SELECT COUNT(*) as n FROM agenda_compromissos WHERE data=?", [hoje]),
          n("SELECT COUNT(*) as n FROM agenda_compromissos WHERE data BETWEEN ? AND ?", [hoje, daqui7]),
          n("SELECT COUNT(*) as n FROM agenda_compromissos WHERE substr(data,1,7)=?", [anoMes]),
        ]);

        const proximos = await db.select<{ titulo: string; data: string; horario: string; categoria: string }[]>(
          "SELECT titulo, data, horario, categoria FROM agenda_compromissos WHERE data >= ? ORDER BY data ASC, horario ASC LIMIT 5",
          [hoje]
        ).catch(() => []);

        if (cancelled) return;
        setData({ totalHoje, totalSemana, totalMes, proximos });
      } catch (e) {
        console.error("AgendaPanel:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const fmtDate = (s: string) => {
    try { return new Date(s + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }); }
    catch { return s; }
  };

  return (
    <>
      <PanelSection title="Resumo da Agenda">
        <div style={{
          borderRadius: 10,
          background: "rgba(0,122,255,0.07)",
          border: "1px solid rgba(0,122,255,0.14)",
          padding: "10px 12px",
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
            {data.totalHoje}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>
            compromisso{data.totalHoje !== 1 ? "s" : ""} hoje
          </div>
        </div>
      </PanelSection>

      <PanelDivider />

      <PanelSection title="Período">
        <PanelRow label="Esta semana" value={data.totalSemana} />
        <PanelRow label="Este mês" value={data.totalMes} />
      </PanelSection>

      {data.proximos.length > 0 && (
        <>
          <PanelDivider />
          <PanelSection title="Próximos Compromissos">
            {data.proximos.map((p, i) => (
              <div key={i} style={{
                padding: "5px 0",
                borderBottom: i < data.proximos.length - 1 ? "1px solid var(--separator)" : "none",
                fontSize: 11,
              }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.titulo}</div>
                <div style={{ color: "var(--text-tertiary)", fontSize: 10, marginTop: 1 }}>
                  {fmtDate(p.data)} · {p.horario} · {p.categoria}
                </div>
              </div>
            ))}
          </PanelSection>
        </>
      )}
    </>
  );
}
