import { useEffect, useState } from "react";
import { getDb } from "@core/database";
import { calcularRepasse, dbRowToPartilha } from "../financeiro/services/repasse.service";
import { PanelSection, PanelDivider, PanelRow } from "@/components/ui/SectionHeader";
import { ProgressBar } from "@/components/ui/StatCard";

interface PanelData {
  saldo: number;
  catequizandos: number;
  presencaMedia: number;
  dizimistas: number;
  totalFieis: number;
  proximaEucaristia: string | null;
  proximoCrisma: string | null;
  aniversariantesHoje: { nome: string; comunidade: string }[];
  novosMes: number;
}

const empty: PanelData = {
  saldo: 0, catequizandos: 0, presencaMedia: 0,
  dizimistas: 0, totalFieis: 0,
  proximaEucaristia: null, proximoCrisma: null,
  aniversariantesHoje: [], novosMes: 0,
};

export function DashboardPanel() {
  const [data, setData] = useState<PanelData>(empty);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getDb();
        const toN = (v: unknown) => { const x = Number(v); return isNaN(x) ? 0 : x; };
        const n = async (sql: string, p: unknown[] = []) => {
          const r = await db.select<Record<string, unknown>[]>(sql, p).catch(() => [] as Record<string, unknown>[]);
          return toN(r[0] ? Object.values(r[0])[0] : 0);
        };

        const hoje = new Date();
        const mmdd = String(hoje.getMonth() + 1).padStart(2, "0") + "-" + String(hoje.getDate()).padStart(2, "0");
        const anoMes = hoje.toISOString().slice(0, 7);

        const [catequizandos, dizimistas, totalFieis, novosMes, presencaMedia] = await Promise.all([
          n("SELECT COUNT(*) FROM catequese_matriculas WHERE situacao NOT IN ('CONCLUIDO','CANCELADO')"),
          n("SELECT COUNT(*) FROM fieis WHERE deleted_at IS NULL AND isDizimista=1"),
          n("SELECT COUNT(*) FROM fieis WHERE deleted_at IS NULL"),
          n("SELECT COUNT(*) FROM fieis WHERE deleted_at IS NULL AND substr(created_at,1,7)=?", [anoMes]),
          n("SELECT COALESCE(ROUND(CAST(SUM(CASE WHEN presente=1 THEN 1 ELSE 0 END) AS REAL) * 100.0 / NULLIF(COUNT(*),0), 0), 0) FROM catequese_presencas"),
        ]);

        // Saldo final disponível em tempo real (último fechamento + movimentos pós-fechamento com repasse)
        const cfgRows = await db.select<Record<string, unknown>[]>(
          "SELECT * FROM configuracoes_partilha WHERE id=1 LIMIT 1"
        ).catch(() => [] as Record<string, unknown>[]);
        const cfg = cfgRows[0] ?? { comunidade: 30, area_missionaria: 40, arquidiocese: 29, fundo_missionario: 1 };


        const unitsResult = await db.select<{ origem: string }[]>(
          "SELECT DISTINCT origem FROM lancamentos WHERE origem IS NOT NULL AND origem!='' AND deleted_at IS NULL ORDER BY origem"
        ).catch(() => [] as { origem: string }[]);

        let saldo = 0;
        for (const { origem: unit } of unitsResult) {
          const closeRows = await db.select<Record<string, unknown>[]>(
            "SELECT COALESCE(saldo_disponivel,0) as sd, data FROM caixa_fechamento WHERE unidade=? ORDER BY data DESC LIMIT 1",
            [unit]
          ).catch(() => [] as Record<string, unknown>[]);
          const lastClose = closeRows[0];
          const saldoAnterior = toN(lastClose?.sd);
          const lastDate = String(lastClose?.data ?? "1900-01-01");
          const movRows = await db.select<Record<string, unknown>[]>(
            `SELECT COALESCE(SUM(CASE WHEN tipo='ENTRADA' THEN valor ELSE 0 END),0) as ent,
                    COALESCE(SUM(CASE WHEN tipo='SAIDA'   THEN valor ELSE 0 END),0) as sai
             FROM lancamentos WHERE origem=? AND data > ? AND deleted_at IS NULL`,
            [unit, lastDate]
          ).catch(() => [] as Record<string, unknown>[]);
          const mov = movRows[0] ?? {};
          saldo += saldoAnterior + calcularRepasse(toN(mov.ent) - toN(mov.sai), dbRowToPartilha(cfg)).saldoDisponivel;
        }

        const anivs = await db.select<{ nome: string; comunidade: string }[]>(
          "SELECT nome, COALESCE(comunidade,'') as comunidade FROM fieis WHERE deleted_at IS NULL AND substr(COALESCE(data_nascimento,''),6,5)=? LIMIT 5",
          [mmdd]
        ).catch(() => [] as { nome: string; comunidade: string }[]);

        const proxEucaristia = await db.select<{ data_sacramento: string }[]>(
          "SELECT data_sacramento FROM sacramentos_registros WHERE tipo='EUCARISTIA' AND data_sacramento >= date('now') AND deleted_at IS NULL ORDER BY data_sacramento ASC LIMIT 1"
        ).catch(() => [] as { data_sacramento: string }[]);
        const proxCrisma = await db.select<{ data_sacramento: string }[]>(
          "SELECT data_sacramento FROM sacramentos_registros WHERE tipo='CRISMA' AND data_sacramento >= date('now') AND deleted_at IS NULL ORDER BY data_sacramento ASC LIMIT 1"
        ).catch(() => [] as { data_sacramento: string }[]);

        if (cancelled) return;
        setData({
          saldo,
          catequizandos,
          presencaMedia,
          dizimistas,
          totalFieis,
          proximaEucaristia: proxEucaristia[0]?.data_sacramento ?? null,
          proximoCrisma: proxCrisma[0]?.data_sacramento ?? null,
          aniversariantesHoje: anivs,
          novosMes,
        });
      } catch (e) {
        console.error("DashboardPanel error:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const fmtDate = (s: string) => new Date(s + "T12:00:00").toLocaleDateString("pt-BR");

  return (
    <>
      {/* Saldo */}
      <PanelSection title="Saldo Financeiro">
        <div style={{
          borderRadius: 10,
          background: data.saldo >= 0 ? "rgba(52,199,89,0.09)" : "rgba(255,59,48,0.09)",
          border: `1px solid ${data.saldo >= 0 ? "rgba(52,199,89,0.18)" : "rgba(255,59,48,0.18)"}`,
          padding: "10px 12px",
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: data.saldo >= 0 ? "var(--accent-green)" : "var(--accent-red)", lineHeight: 1 }}>
            {fmt(data.saldo)}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>Saldo final disponível · tempo real</div>
        </div>
      </PanelSection>

      <PanelDivider />

      {/* Catequese */}
      <PanelSection title="Catequese Ativa">
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
          {data.catequizandos}
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginLeft: 4 }}>catequizandos</span>
        </div>
        <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 2 }}>Presença média</div>
        <ProgressBar value={data.presencaMedia} max={100} />
      </PanelSection>

      <PanelDivider />

      {/* Indicadores */}
      <PanelSection title="Indicadores">
        <PanelRow label="Fiéis Cadastrados" value={data.totalFieis.toLocaleString("pt-BR")} />
        <PanelRow label="Dizimistas Ativos" value={data.dizimistas.toLocaleString("pt-BR")} />
        <PanelRow
          label="Novos (mês)"
          value={`+${data.novosMes}`}
          valueColor={data.novosMes > 0 ? "var(--accent-green)" : "var(--text-primary)"}
        />
      </PanelSection>

      {/* Próximas celebrações */}
      {(data.proximaEucaristia || data.proximoCrisma) && (
        <>
          <PanelDivider />
          <PanelSection title="Próximas Celebrações">
            {data.proximaEucaristia && (
              <div style={{
                padding: "6px 10px", marginBottom: 6,
                borderLeft: "3px solid var(--accent-orange)",
                background: "rgba(255,159,10,0.06)",
                borderRadius: "0 5px 5px 0", fontSize: 11,
              }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>1ª Eucaristia</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 10, marginTop: 1 }}>{fmtDate(data.proximaEucaristia)}</div>
              </div>
            )}
            {data.proximoCrisma && (
              <div style={{
                padding: "6px 10px",
                borderLeft: "3px solid var(--accent-purple)",
                background: "rgba(175,82,222,0.06)",
                borderRadius: "0 5px 5px 0", fontSize: 11,
              }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Crisma</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 10, marginTop: 1 }}>{fmtDate(data.proximoCrisma)}</div>
              </div>
            )}
          </PanelSection>
        </>
      )}

      {/* Aniversariantes */}
      {data.aniversariantesHoje.length > 0 && (
        <>
          <PanelDivider />
          <PanelSection title="Aniversariantes Hoje">
            {data.aniversariantesHoje.map((a, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, alignItems: "center",
                padding: "4px 0", borderBottom: "1px solid var(--separator)", fontSize: 11,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "var(--bg-elevated)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: "var(--text-secondary)",
                  flexShrink: 0,
                }}>
                  {a.nome[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nome}</div>
                  <div style={{ color: "var(--text-tertiary)", fontSize: 10 }}>{a.comunidade}</div>
                </div>
              </div>
            ))}
          </PanelSection>
        </>
      )}

      {data.aniversariantesHoje.length === 0 && (
        <>
          <PanelDivider />
          <PanelSection title="Aniversariantes Hoje">
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", padding: "4px 0" }}>
              Nenhum aniversariante hoje.
            </div>
          </PanelSection>
        </>
      )}
    </>
  );
}
