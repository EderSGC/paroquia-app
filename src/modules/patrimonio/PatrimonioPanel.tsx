import { useEffect, useState } from "react";
import { getDb } from "@core/database";
import { PanelSection, PanelDivider, PanelRow } from "@/components/ui/SectionHeader";

interface Stats {
  totalBens: number;
  valorTotal: number;
  manutencoesPendentes: number;
  porCategoria: { categoria: string; total: number }[];
}

const empty: Stats = { totalBens: 0, valorTotal: 0, manutencoesPendentes: 0, porCategoria: [] };

export function PatrimonioPanel() {
  const [data, setData] = useState<Stats>(empty);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getDb();
        const n = async (sql: string) => {
          const r = await db.select<{ n: number }[]>(sql);
          return r[0]?.n ?? 0;
        };

        const [totalBens, valorTotal] = await Promise.all([
          n("SELECT COUNT(*) as n FROM patrimonio_bens WHERE deleted_at IS NULL"),
          (async () => {
            const r = await db.select<{ v: number }[]>(
              "SELECT COALESCE(SUM(valor_estimado),0) as v FROM patrimonio_bens WHERE deleted_at IS NULL"
            );
            return r[0]?.v ?? 0;
          })(),
        ]);

        const porCategoria = await db.select<{ categoria: string; total: number }[]>(
          "SELECT categoria, COUNT(*) as total FROM patrimonio_bens WHERE deleted_at IS NULL GROUP BY categoria ORDER BY total DESC LIMIT 6"
        ).catch(() => []);

        if (cancelled) return;
        setData({ totalBens, valorTotal, manutencoesPendentes: 0, porCategoria });
      } catch (e) {
        console.error("PatrimonioPanel:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <>
      <PanelSection title="Patrimônio">
        <div style={{
          borderRadius: 10,
          background: "rgba(88,86,214,0.07)",
          border: "1px solid rgba(88,86,214,0.14)",
          padding: "10px 12px",
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-purple)", lineHeight: 1 }}>
            {data.totalBens}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>
            ben{data.totalBens !== 1 ? "s" : ""} cadastrado{data.totalBens !== 1 ? "s" : ""}
          </div>
        </div>
      </PanelSection>

      <PanelDivider />

      <PanelSection title="Valor Estimado Total">
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
          {fmt(data.valorTotal)}
        </div>
      </PanelSection>

      {data.porCategoria.length > 0 && (
        <>
          <PanelDivider />
          <PanelSection title="Por Categoria">
            {data.porCategoria.map((c, i) => (
              <PanelRow key={i} label={c.categoria} value={c.total} />
            ))}
          </PanelSection>
        </>
      )}
    </>
  );
}
