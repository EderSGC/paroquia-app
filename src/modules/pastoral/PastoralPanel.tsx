import { useEffect, useState } from "react";
import { getDb } from "@core/database";
import { PanelSection, PanelDivider, PanelRow } from "@/components/ui/SectionHeader";
import { useWorkspace } from "@/layouts/WorkspaceContext";

interface Stats {
  totalFieis: number;
  dizimistas: number;
  totalFamilias: number;
  totalComunidades: number;
  novosEsseMes: number;
  aniversariantesHoje: { nome: string }[];
  nomeComunidade: string | null;
}

const empty: Stats = { totalFieis: 0, dizimistas: 0, totalFamilias: 0, totalComunidades: 0, novosEsseMes: 0, aniversariantesHoje: [], nomeComunidade: null };

interface PastoralPanelProps {
  comunidadeNome?: string | null;
}

export function PastoralPanel({ comunidadeNome = null }: PastoralPanelProps) {
  const [data, setData] = useState<Stats>(empty);
  const { navigate } = useWorkspace();
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
        const hoje = new Date();
        const anoMes = hoje.toISOString().slice(0, 7);
        const mmdd = String(hoje.getMonth() + 1).padStart(2, "0") + "-" + String(hoje.getDate()).padStart(2, "0");

        let totalFieis: number, dizimistas: number, totalFamilias: number, totalComunidades: number, novosEsseMes: number;
        let anivs: { nome: string }[];

        if (filtrado) {
          [totalFieis, dizimistas, totalFamilias, totalComunidades, novosEsseMes] = await Promise.all([
            n("SELECT COUNT(*) as n FROM fieis WHERE deleted_at IS NULL AND comunidade=?", [comunidadeNome]),
            n("SELECT COUNT(*) as n FROM fieis WHERE deleted_at IS NULL AND isDizimista=1 AND comunidade=?", [comunidadeNome]),
            n("SELECT COUNT(*) as n FROM familias WHERE deleted_at IS NULL AND comunidade=?", [comunidadeNome]),
            n("SELECT 1 as n"),
            n("SELECT COUNT(*) as n FROM fieis WHERE deleted_at IS NULL AND comunidade=? AND substr(created_at,1,7)=?", [comunidadeNome, anoMes]),
          ]);
          anivs = await db.select<{ nome: string }[]>(
            "SELECT nome FROM fieis WHERE deleted_at IS NULL AND comunidade=? AND substr(COALESCE(data_nascimento,''),6,5)=? LIMIT 4",
            [comunidadeNome, mmdd]
          );
        } else {
          [totalFieis, dizimistas, totalFamilias, totalComunidades, novosEsseMes] = await Promise.all([
            n("SELECT COUNT(*) as n FROM fieis WHERE deleted_at IS NULL"),
            n("SELECT COUNT(*) as n FROM fieis WHERE deleted_at IS NULL AND isDizimista=1"),
            n("SELECT COUNT(*) as n FROM familias WHERE deleted_at IS NULL"),
            n("SELECT COUNT(*) as n FROM comunidades WHERE deleted_at IS NULL"),
            n("SELECT COUNT(*) as n FROM fieis WHERE deleted_at IS NULL AND substr(created_at,1,7)=?", [anoMes]),
          ]);
          anivs = await db.select<{ nome: string }[]>(
            "SELECT nome FROM fieis WHERE deleted_at IS NULL AND substr(COALESCE(data_nascimento,''),6,5)=? LIMIT 4",
            [mmdd]
          );
        }

        if (cancelled) return;
        setData({ totalFieis, dizimistas, totalFamilias, totalComunidades, novosEsseMes, aniversariantesHoje: anivs, nomeComunidade: comunidadeNome });
      } catch (e) {
        console.error("PastoralPanel:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [comunidadeNome, filtrado]);

  return (
    <>
      <PanelSection title={filtrado ? data.nomeComunidade ?? "Comunidade" : "Comunidade"}>
        <div style={{
          borderRadius: 10,
          background: "rgba(0,122,255,0.07)",
          border: "1px solid rgba(0,122,255,0.14)",
          padding: "10px 12px",
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
            {data.totalFieis.toLocaleString("pt-BR")}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <span>fiéis cadastrados</span>
            {data.novosEsseMes > 0 && (
              <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>+{data.novosEsseMes} este mês</span>
            )}
          </div>
        </div>
      </PanelSection>

      <PanelDivider />

      <PanelSection title="Dados Pastorais">
        <PanelRow label="Famílias" value={data.totalFamilias.toLocaleString("pt-BR")} />
        {!filtrado && <PanelRow label="Comunidades" value={data.totalComunidades} />}
        <PanelRow label="Dizimistas" value={data.dizimistas.toLocaleString("pt-BR")} valueColor="var(--accent-orange)" />
      </PanelSection>

      {data.aniversariantesHoje.length > 0 && (
        <>
          <PanelDivider />
          <PanelSection title="Aniversariantes Hoje">
            {data.aniversariantesHoje.map((a, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, alignItems: "center",
                padding: "5px 0", borderBottom: "1px solid var(--separator)", fontSize: 11,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: `hsl(${(i * 67 + 200) % 360}, 55%, 60%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0,
                }}>
                  {a.nome[0]?.toUpperCase()}
                </div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.nome}
                </div>
              </div>
            ))}
          </PanelSection>
        </>
      )}

      <PanelDivider />
      <PanelSection title="Gerenciar">
        <button
          onClick={() => navigate("fieis", "LIXEIRA")}
          style={{
            width: "100%", padding: "8px 10px", borderRadius: 8,
            border: "1px solid var(--separator)", background: "var(--bg-surface)",
            color: "var(--text-secondary)", fontSize: 11.5, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            display: "flex", alignItems: "center", gap: 6,
            transition: "background 120ms",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-surface)")}
        >
          🗑️ Ver registros excluídos
        </button>
      </PanelSection>
    </>
  );
}
