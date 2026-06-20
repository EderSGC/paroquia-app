import { useEffect, useState } from "react";
import { PanelSection, PanelDivider, PanelRow } from "@/components/ui/SectionHeader";
import { SacramentalRepository } from './repository/sacramental.repository';

interface Stats {
  batismosAno: number;
  eucaristiasAno: number;
  crismasAno: number;
  matrimoniosAno: number;
  batismosTotal: number;
  proximoBatismo: string | null;
  proximoCrisma: string | null;
}

const empty: Stats = {
  batismosAno: 0, eucaristiasAno: 0, crismasAno: 0, matrimoniosAno: 0,
  batismosTotal: 0, proximoBatismo: null, proximoCrisma: null,
};

export function SacramentalPanel() {
  const [data, setData] = useState<Stats>(empty);

  useEffect(() => {
    let cancelled = false;
    const repo = SacramentalRepository.registros;
    (async () => {
      try {
        const ano = String(new Date().getFullYear());
        const [batismosAno, eucaristiasAno, crismasAno, matrimoniosAno, batismosTotal] = await Promise.all([
          repo.countByTipoAno('BATISMO', ano),
          repo.countByTipoAno('EUCARISTIA', ano),
          repo.countByTipoAno('CRISMA', ano),
          repo.countByTipoAno('MATRIMONIO', ano),
          repo.countByTipoAno('BATISMO'),
        ]);
        const [proximoBatismo, proximoCrisma] = await Promise.all([
          repo.proximaCelebracao('BATISMO'),
          repo.proximaCelebracao('CRISMA'),
        ]);
        if (cancelled) return;
        setData({ batismosAno, eucaristiasAno, crismasAno, matrimoniosAno, batismosTotal, proximoBatismo, proximoCrisma });
      } catch (e) {
        console.error("SacramentalPanel:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const ano = new Date().getFullYear();
  const fmtDate = (s: string) => new Date(s + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  const totalAno = data.batismosAno + data.eucaristiasAno + data.crismasAno + data.matrimoniosAno;

  return (
    <>
      <PanelSection title={`Sacramentos ${ano}`}>
        <div style={{
          borderRadius: 10,
          background: "rgba(0,122,255,0.07)",
          border: "1px solid rgba(0,122,255,0.14)",
          padding: "10px 12px", marginBottom: 4,
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{totalAno}</div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>sacramentos ministrados</div>
        </div>
        <PanelRow label="Batismos" value={data.batismosAno} />
        <PanelRow label="1ª Eucaristia" value={data.eucaristiasAno} />
        <PanelRow label="Crismas" value={data.crismasAno} />
        <PanelRow label="Matrimônios" value={data.matrimoniosAno} />
      </PanelSection>

      {(data.proximoBatismo || data.proximoCrisma) && (
        <>
          <PanelDivider />
          <PanelSection title="Próximas Celebrações">
            {data.proximoBatismo && (
              <div style={{
                padding: "6px 10px", marginBottom: 6,
                borderLeft: "3px solid var(--accent)",
                background: "rgba(0,122,255,0.05)",
                borderRadius: "0 6px 6px 0", fontSize: 11,
              }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Batismo</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 10, marginTop: 1 }}>{fmtDate(data.proximoBatismo)}</div>
              </div>
            )}
            {data.proximoCrisma && (
              <div style={{
                padding: "6px 10px",
                borderLeft: "3px solid var(--accent-purple)",
                background: "rgba(175,82,222,0.05)",
                borderRadius: "0 6px 6px 0", fontSize: 11,
              }}>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Crisma</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 10, marginTop: 1 }}>{fmtDate(data.proximoCrisma)}</div>
              </div>
            )}
          </PanelSection>
        </>
      )}

      <PanelDivider />
      <PanelSection title="Histórico">
        <PanelRow label="Batismos registrados" value={data.batismosTotal.toLocaleString("pt-BR")} />
      </PanelSection>
    </>
  );
}
