import { useEffect, useState } from "react";
import { getDb } from "@core/database";
import { PanelSection, PanelDivider, PanelRow } from "@/components/ui/SectionHeader";
import { ProgressBar } from "@/components/ui/StatCard";

interface Stats {
  matriculasAtivas: number;
  turmasAtivas: number;
  concluidos: number;
  cancelados: number;
  catEucaristia: number;
  catCrisma: number;
  presencaPct: number;
}

const empty: Stats = { matriculasAtivas: 0, turmasAtivas: 0, concluidos: 0, cancelados: 0, catEucaristia: 0, catCrisma: 0, presencaPct: 0 };

interface CatequesePanelProps {
  comunidadeNome?: string | null;
}

export function CatequesePanel({ comunidadeNome = null }: CatequesePanelProps) {
  const [data, setData] = useState<Stats>(empty);
  const filtrado = comunidadeNome != null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getDb();
        const n = async (sql: string, p?: unknown[]) => {
          const r = await db.select<{ n: number }[]>(sql, p ?? []);
          return r[0]?.n ?? 0;
        };

        let matriculasAtivas: number, turmasAtivas: number, concluidos: number, cancelados: number, catEucaristia: number, catCrisma: number, presencaPct: number;

        if (filtrado) {
          const joinCom = "JOIN catequese_turmas t ON t.id=m.turma_id AND t.comunidade=?";
          [matriculasAtivas, turmasAtivas, concluidos, cancelados, catEucaristia, catCrisma, presencaPct] = await Promise.all([
            n(`SELECT COUNT(*) as n FROM catequese_matriculas m ${joinCom} WHERE m.situacao NOT IN ('CONCLUIDO','CANCELADO')`, [comunidadeNome]),
            n(`SELECT COUNT(DISTINCT m.turma_id) as n FROM catequese_matriculas m ${joinCom} WHERE m.situacao NOT IN ('CONCLUIDO','CANCELADO')`, [comunidadeNome]),
            n(`SELECT COUNT(*) as n FROM catequese_matriculas m ${joinCom} WHERE m.situacao='CONCLUIDO'`, [comunidadeNome]),
            n(`SELECT COUNT(*) as n FROM catequese_matriculas m ${joinCom} WHERE m.situacao='CANCELADO'`, [comunidadeNome]),
            n(`SELECT COUNT(*) as n FROM catequese_matriculas m JOIN catequese_turmas t ON t.id=m.turma_id WHERE m.situacao NOT IN ('CONCLUIDO','CANCELADO') AND t.etapa LIKE '%Eucaristia%' AND t.comunidade=?`, [comunidadeNome]),
            n(`SELECT COUNT(*) as n FROM catequese_matriculas m JOIN catequese_turmas t ON t.id=m.turma_id WHERE m.situacao NOT IN ('CONCLUIDO','CANCELADO') AND t.etapa LIKE '%Crisma%' AND t.comunidade=?`, [comunidadeNome]),
            n("SELECT COALESCE(ROUND(100.0 * SUM(CASE WHEN p.status='P' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0)),0) as n FROM catequese_presencas p"),
          ]);
        } else {
          [matriculasAtivas, turmasAtivas, concluidos, cancelados, catEucaristia, catCrisma, presencaPct] = await Promise.all([
            n("SELECT COUNT(*) as n FROM catequese_matriculas WHERE situacao NOT IN ('CONCLUIDO','CANCELADO')"),
            n("SELECT COUNT(DISTINCT turma_id) as n FROM catequese_matriculas WHERE situacao NOT IN ('CONCLUIDO','CANCELADO')"),
            n("SELECT COUNT(*) as n FROM catequese_matriculas WHERE situacao='CONCLUIDO'"),
            n("SELECT COUNT(*) as n FROM catequese_matriculas WHERE situacao='CANCELADO'"),
            n("SELECT COUNT(*) as n FROM catequese_matriculas m JOIN catequese_turmas t ON t.id=m.turma_id WHERE m.situacao NOT IN ('CONCLUIDO','CANCELADO') AND t.etapa LIKE '%Eucaristia%'"),
            n("SELECT COUNT(*) as n FROM catequese_matriculas m JOIN catequese_turmas t ON t.id=m.turma_id WHERE m.situacao NOT IN ('CONCLUIDO','CANCELADO') AND t.etapa LIKE '%Crisma%'"),
            n("SELECT COALESCE(ROUND(100.0 * SUM(CASE WHEN p.status='P' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0)),0) as n FROM catequese_presencas p"),
          ]);
        }

        if (cancelled) return;
        setData({ matriculasAtivas, turmasAtivas, concluidos, cancelados, catEucaristia, catCrisma, presencaPct });
      } catch (e) {
        console.error("CatequesePanel:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [comunidadeNome, filtrado]);

  const presencaMedia = data?.presencaPct ?? 0;

  return (
    <>
      <PanelSection title="Catequese Ativa">
        <div style={{
          borderRadius: 10,
          background: "rgba(0,122,255,0.07)",
          border: "1px solid rgba(0,122,255,0.14)",
          padding: "10px 12px",
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
            {data.matriculasAtivas}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>
            catequizandos ativos em {data.turmasAtivas} turma{data.turmasAtivas !== 1 ? "s" : ""}
          </div>
        </div>
      </PanelSection>

      <PanelDivider />

      <PanelSection title="Por Etapa">
        <PanelRow label="1ª Eucaristia" value={data.catEucaristia} valueColor="var(--accent-orange)" />
        <PanelRow label="Crisma" value={data.catCrisma} valueColor="var(--accent-purple)" />
      </PanelSection>

      <PanelDivider />

      <PanelSection title="Presença Média">
        <ProgressBar value={presencaMedia} max={100} />
      </PanelSection>

      <PanelDivider />

      <PanelSection title="Histórico">
        <PanelRow label="Concluídos" value={data.concluidos} valueColor="var(--accent-green)" />
        <PanelRow label="Cancelados" value={data.cancelados} valueColor="var(--accent-red)" />
      </PanelSection>
    </>
  );
}
