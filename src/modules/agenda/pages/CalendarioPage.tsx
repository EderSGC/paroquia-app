import { useState, useEffect } from "react";
import { getDb } from "@core/database";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const CATEGORIA_COR: Record<string, string> = {
  evento:   "#f59e0b",
  reuniao:  "#3b82f6",
  reserva:  "#8b5cf6",
  formacao: "#10b981",
  visita:   "#ec4899",
  missa:    "#1f3b73",
  escala:   "#64748b",
};

const CATEGORIA_LABEL: Record<string, string> = {
  evento:   "Evento",
  reuniao:  "Reunião",
  reserva:  "Reserva",
  formacao: "Formação",
  visita:   "Visita",
  missa:    "Missa",
  escala:   "Escala",
};

interface Compromisso {
  id: number;
  titulo: string;
  data: string;
  horario: string;
  local: string;
  categoria: string;
}

export function CalendarioPage() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);

  useEffect(() => {
    carregarMes();
  }, [ano, mes]);

  async function carregarMes() {
    try {
      const db = await getDb();
      const inicio = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
      const fim = `${ano}-${String(mes + 1).padStart(2, "0")}-31`;
      const rows = await db.select<Compromisso[]>(
        "SELECT id, titulo, data, horario, local, categoria FROM agenda_compromissos WHERE data >= ? AND data <= ? ORDER BY data ASC, horario ASC",
        [inicio, fim]
      );
      setCompromissos(rows);
    } catch {
      setCompromissos([]);
    }
  }

  function navMes(delta: number) {
    let nm = mes + delta;
    let na = ano;
    if (nm < 0) { nm = 11; na--; }
    if (nm > 11) { nm = 0; na++; }
    setMes(nm); setAno(na); setDiaSelecionado(null);
  }

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  const celulas: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];
  // Completar até múltiplo de 7
  while (celulas.length % 7 !== 0) celulas.push(null);

  function eventosNoDia(dia: number) {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return compromissos.filter(c => c.data === dataStr);
  }

  const eventosDiaSelecionado = diaSelecionado ? eventosNoDia(diaSelecionado) : [];

  const isHoje = (dia: number) =>
    dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Cabeçalho de navegação */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => navMes(-1)} style={{ background: "#f5f7fa", border: "none", borderRadius: 10, padding: "8px 18px", cursor: "pointer", fontSize: 18, color: "#1f3b73", fontWeight: 700 }}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1f3b73" }}>{MESES[mes]} {ano}</div>
          <div style={{ fontSize: 12, color: "#98a2b3", marginTop: 2 }}>{compromissos.length} evento{compromissos.length !== 1 ? "s" : ""} neste mês</div>
        </div>
        <button onClick={() => navMes(1)} style={{ background: "#f5f7fa", border: "none", borderRadius: 10, padding: "8px 18px", cursor: "pointer", fontSize: 18, color: "#1f3b73", fontWeight: 700 }}>›</button>
      </section>

      {/* Grade do calendário */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 20 }}>
        {/* Dias da semana */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
          {DIAS_SEMANA.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: "#667085", padding: "6px 0", textTransform: "uppercase" }}>{d}</div>
          ))}
        </div>
        {/* Células */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {celulas.map((dia, idx) => {
            if (!dia) return <div key={`empty-${idx}`} />;
            const evs = eventosNoDia(dia);
            const selecionado = diaSelecionado === dia;
            const hoje_ = isHoje(dia);
            return (
              <div
                key={dia}
                onClick={() => setDiaSelecionado(selecionado ? null : dia)}
                style={{
                  minHeight: 72,
                  borderRadius: 10,
                  border: selecionado ? "2px solid #1f3b73" : hoje_ ? "2px solid #3b82f6" : "1px solid #eaecf0",
                  background: selecionado ? "#eef2f7" : hoje_ ? "#eff6ff" : evs.length > 0 ? "#fafbff" : "#fff",
                  padding: "6px 8px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: hoje_ || selecionado ? 800 : 600, color: hoje_ ? "#1d4ed8" : selecionado ? "#1f3b73" : "#344054", marginBottom: 4 }}>{dia}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {evs.slice(0, 3).map(ev => (
                    <div key={ev.id} style={{ fontSize: 9, fontWeight: 700, borderRadius: 4, padding: "1px 4px", background: CATEGORIA_COR[ev.categoria] + "22", color: CATEGORIA_COR[ev.categoria], overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {ev.titulo}
                    </div>
                  ))}
                  {evs.length > 3 && <div style={{ fontSize: 9, color: "#98a2b3", fontWeight: 700 }}>+{evs.length - 3} mais</div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Legenda de categorias */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: "12px 20px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>CATEGORIAS:</span>
        {Object.entries(CATEGORIA_LABEL).map(([key, label]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: CATEGORIA_COR[key] }} />
            <span style={{ fontSize: 11, color: "#344054" }}>{label}</span>
          </div>
        ))}
      </section>

      {/* Detalhes do dia selecionado */}
      {diaSelecionado && (
        <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1f3b73" }}>
            {String(diaSelecionado).padStart(2,"0")}/{String(mes+1).padStart(2,"0")}/{ano}
          </h3>
          {eventosDiaSelecionado.length === 0 ? (
            <p style={{ color: "#98a2b3", fontSize: 13 }}>Nenhum evento neste dia.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {eventosDiaSelecionado.map(ev => (
                <div key={ev.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", borderRadius: 10, background: "#f9fafb", border: `2px solid ${CATEGORIA_COR[ev.categoria]}33` }}>
                  <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: CATEGORIA_COR[ev.categoria], flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1d2e" }}>{ev.titulo}</div>
                    <div style={{ fontSize: 12, color: "#667085", marginTop: 3 }}>
                      <span style={{ background: CATEGORIA_COR[ev.categoria] + "22", color: CATEGORIA_COR[ev.categoria], fontWeight: 700, borderRadius: 4, padding: "1px 6px", fontSize: 10, marginRight: 8 }}>{CATEGORIA_LABEL[ev.categoria]}</span>
                      {ev.horario && `⏰ ${ev.horario}`}
                      {ev.local && ` · 📍 ${ev.local}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
