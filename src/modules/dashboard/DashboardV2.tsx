import { useEffect, useState } from "react";
import { getDb } from "@core/database";
import { calcularRepasse, dbRowToPartilha } from "../financeiro/services/repasse.service";
import type { Paroquia, Usuario } from "@core/types/app.types";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useWorkspace } from "@/layouts/WorkspaceContext";

interface DashStats {
  totalFieis: number;
  totalFamilias: number;
  totalComunidades: number;
  dizimistas: number;
  novosMes: number;
  catequizandos: number;
  catEucaristia: number;
  catCrisma: number;
  batismosAno: number;
  eucaristiasAno: number;
  crismasAno: number;
  matrimoniosAno: number;
  saldo: number;
  receitaMes: number;
  despesaMes: number;
  comunidadesRanking: { nome: string; total: number }[];
  proximosEventos: { id: number; titulo: string; data: string; horario: string }[];
}

const EMPTY: DashStats = {
  totalFieis: 0, totalFamilias: 0, totalComunidades: 0, dizimistas: 0, novosMes: 0,
  catequizandos: 0, catEucaristia: 0, catCrisma: 0,
  batismosAno: 0, eucaristiasAno: 0, crismasAno: 0, matrimoniosAno: 0,
  saldo: 0, receitaMes: 0, despesaMes: 0,
  comunidadesRanking: [], proximosEventos: [],
};

interface Props { paroquia: Paroquia; usuario: Usuario; }

export function DashboardV2({ paroquia, usuario }: Props) {
  const [stats, setStats] = useState<DashStats>(EMPTY);
  const [loading, setLoading] = useState(true);
  const { navigate } = useWorkspace();

  const hoje = new Date();
  const anoAtual = String(hoje.getFullYear());
  const anoMes  = hoje.toISOString().slice(0, 7); // YYYY-MM

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

        const [
          totalFieis, totalFamilias, totalComunidades, dizimistas, novosMes,
          catequizandos, catEucaristia, catCrisma,
          batismosAno, eucaristiasAno, crismasAno, matrimoniosAno,
        ] = await Promise.all([
          n("SELECT COUNT(*) FROM fieis WHERE deleted_at IS NULL"),
          n("SELECT COUNT(*) FROM familias WHERE deleted_at IS NULL"),
          n("SELECT COUNT(*) FROM comunidades WHERE deleted_at IS NULL"),
          n("SELECT COUNT(*) FROM fieis WHERE deleted_at IS NULL AND isDizimista=1"),
          n("SELECT COUNT(*) FROM fieis WHERE deleted_at IS NULL AND substr(created_at,1,7)=?", [anoMes]),
          n("SELECT COUNT(*) FROM catequese_matriculas WHERE situacao NOT IN ('CONCLUIDO','CANCELADO')"),
          n("SELECT COUNT(*) FROM catequese_matriculas m JOIN catequese_turmas t ON t.id=m.turma_id WHERE m.situacao NOT IN ('CONCLUIDO','CANCELADO') AND t.etapa LIKE '%Eucaristia%'"),
          n("SELECT COUNT(*) FROM catequese_matriculas m JOIN catequese_turmas t ON t.id=m.turma_id WHERE m.situacao NOT IN ('CONCLUIDO','CANCELADO') AND t.etapa LIKE '%Crisma%'"),
          n("SELECT COUNT(*) FROM sacramentos_registros WHERE tipo='BATISMO' AND substr(data_sacramento,1,4)=? AND deleted_at IS NULL", [anoAtual]),
          n("SELECT COUNT(*) FROM sacramentos_registros WHERE tipo='EUCARISTIA' AND substr(data_sacramento,1,4)=? AND deleted_at IS NULL", [anoAtual]),
          n("SELECT COUNT(*) FROM sacramentos_registros WHERE tipo='CRISMA' AND substr(data_sacramento,1,4)=? AND deleted_at IS NULL", [anoAtual]),
          n("SELECT COUNT(*) FROM sacramentos_registros WHERE tipo='MATRIMONIO' AND substr(data_sacramento,1,4)=? AND deleted_at IS NULL", [anoAtual]),
        ]);

        const [receitaMes, despesaMes] = await Promise.all([
          n("SELECT COALESCE(SUM(valor),0) FROM lancamentos WHERE tipo='ENTRADA' AND substr(data,1,7)=? AND deleted_at IS NULL", [anoMes]),
          n("SELECT COALESCE(SUM(valor),0) FROM lancamentos WHERE tipo='SAIDA' AND substr(data,1,7)=? AND deleted_at IS NULL", [anoMes]),
        ]);

        // Saldo final disponível em tempo real (repasses aplicados por unidade)
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

        const comunidadesRanking = await db.select<{ nome: string; total: number }[]>(
          "SELECT comunidade as nome, COUNT(*) as total FROM fieis WHERE deleted_at IS NULL AND comunidade IS NOT NULL AND comunidade!='' GROUP BY comunidade ORDER BY total DESC LIMIT 5"
        ).catch(() => [] as { nome: string; total: number }[]);

        const proximosEventos = await db.select<{ id: number; titulo: string; data: string; horario: string }[]>(
          "SELECT id, titulo, data, horario FROM agenda_compromissos WHERE data >= date('now') ORDER BY data ASC, horario ASC LIMIT 4"
        ).catch(() => [] as { id: number; titulo: string; data: string; horario: string }[]);

        if (cancelled) return;
        setStats({
          totalFieis, totalFamilias, totalComunidades, dizimistas, novosMes,
          catequizandos, catEucaristia, catCrisma,
          batismosAno, eucaristiasAno, crismasAno, matrimoniosAno,
          saldo, receitaMes, despesaMes,
          comunidadesRanking,
          proximosEventos,
        });
      } catch (e) {
        console.error("DashboardV2:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [anoAtual, anoMes]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const saudacao = () => {
    const h = hoje.getHours();
    const periodo = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    const partes = usuario.nome.split(" ");
    const nome = partes.length > 1 && partes[0].endsWith(".") ? `${partes[0]} ${partes[1]}` : partes[0];
    return `${periodo}, ${nome}`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)", fontSize: 13 }}>
        Carregando dados...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto" }} className="mac-scrollbar">

      {/* Hero */}
      <div style={{
        padding: "18px 22px 16px",
        borderBottom: "1px solid var(--separator)",
        background: "var(--bg-header)",
        backdropFilter: "var(--blur-md)",
        WebkitBackdropFilter: "var(--blur-md)",
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{saudacao()}</div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>
          {paroquia.nome} · {hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      <div style={{ padding: "16px 18px" }}>

        {/* Vida Pastoral */}
        <SectionHeader>Vida Pastoral</SectionHeader>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, marginBottom: 20 }}>

          <StatCard
            label="Comunidade"
            value={stats.totalFieis.toLocaleString("pt-BR")}
            subtitle="fiéis cadastrados"
            rows={[
              { label: "Famílias",  value: stats.totalFamilias.toLocaleString("pt-BR") },
              { label: "Dizimistas", value: stats.dizimistas.toLocaleString("pt-BR") },
              { label: "Novos (mês)", value: `+${stats.novosMes}`, valueColor: "var(--accent-green)" },
            ]}
            onClick={() => navigate("fieis")}
          />

          <StatCard
            label="Catequese Ativa"
            value={stats.catequizandos.toLocaleString("pt-BR")}
            subtitle="catequizandos"
            rows={[
              { label: "1ª Eucaristia", value: stats.catEucaristia.toLocaleString("pt-BR") },
              { label: "Crisma",        value: stats.catCrisma.toLocaleString("pt-BR") },
            ]}
            onClick={() => navigate("catequese")}
          />

          <StatCard
            label={`Sacramentos ${anoAtual}`}
            rows={[
              { label: "Batismos",    value: stats.batismosAno.toLocaleString("pt-BR") },
              { label: "1ª Eucaristia", value: stats.eucaristiasAno.toLocaleString("pt-BR") },
              { label: "Crismas",     value: stats.crismasAno.toLocaleString("pt-BR") },
              { label: "Matrimônios", value: stats.matrimoniosAno.toLocaleString("pt-BR") },
            ]}
            onClick={() => navigate("batismo")}
          />

          <StatCard
            label="Financeiro"
            value={fmt(stats.saldo)}
            subtitle="saldo disponível"
            rows={[
              { label: "Receita mês",  value: fmt(stats.receitaMes),  valueColor: "var(--accent-green)" },
              { label: "Despesa mês",  value: fmt(stats.despesaMes),  valueColor: "var(--accent-red)"   },
            ]}
            onClick={() => navigate("financeiro")}
          />

        </div>

        {/* Ranking + Eventos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>

          <StatCard label="Comunidades Mais Ativas">
            {stats.comunidadesRanking.length === 0
              ? <div style={{ fontSize: 11, color: "var(--text-tertiary)", padding: "8px 0" }}>Nenhuma comunidade.</div>
              : stats.comunidadesRanking.map((c, i) => (
                <div key={c.nome} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "4px 0",
                  borderBottom: i < stats.comunidadesRanking.length - 1 ? "1px solid var(--separator)" : undefined,
                  fontSize: 11,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-tertiary)", width: 16 }}>{i + 1}</span>
                  <span style={{ flex: 1, color: "var(--text-secondary)" }}>{c.nome}</span>
                  <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>{c.total}</span>
                </div>
              ))}
          </StatCard>

          <StatCard label="Próximos Eventos">
            {stats.proximosEventos.length === 0
              ? <div style={{ fontSize: 11, color: "var(--text-tertiary)", padding: "8px 0" }}>Nenhum evento agendado.</div>
              : stats.proximosEventos.map(ev => {
                const [y, m, d] = ev.data.split("-");
                return (
                  <div key={ev.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--separator)" }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: "rgba(0,122,255,0.10)",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{d}</span>
                      <span style={{ fontSize: 9, color: "var(--accent)", fontWeight: 600 }}>
                        {new Date(Number(y), Number(m) - 1).toLocaleString("pt-BR", { month: "short" }).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ev.titulo}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>{ev.horario}</div>
                    </div>
                  </div>
                );
              })}
          </StatCard>

        </div>

        {/* Acesso rápido */}
        <SectionHeader>Acesso Rápido</SectionHeader>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(
            [
              { label: "Cadastrar Fiel",    mod: "fieis"      },
              { label: "Registrar Batismo", mod: "batismo"    },
              { label: "Nova Agenda",       mod: "agenda"     },
              { label: "Lançamento",        mod: "financeiro" },
              { label: "Catequese",         mod: "catequese"  },
            ] as const
          ).map(item => (
            <button
              key={item.mod}
              onClick={() => navigate(item.mod)}
              style={{
                padding: "7px 14px", fontSize: 12, fontWeight: 600,
                background: "var(--bg-surface)",
                backdropFilter: "var(--blur-sm)", WebkitBackdropFilter: "var(--blur-sm)",
                border: "1px solid var(--border-card)",
                borderRadius: 8, cursor: "pointer",
                color: "var(--text-primary)", fontFamily: "inherit",
                boxShadow: "var(--shadow-card)", transition: "box-shadow 100ms ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-hover)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)"; }}
            >
              {item.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
