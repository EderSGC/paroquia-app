import { useState, useEffect } from "react";
import { getDb } from "@core/database";
import { Printer } from "lucide-react";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MESES_CURTO = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const DIAS_SEMANA_FULL = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];

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
  descricao?: string;
}

type PrintMode = "dia" | "semana" | "mes";

function fmtData(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function miniCalHTML(ano: number, mes: number, mesLabel: string, highlightDays?: number[]): string {
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  let html = `<div style="font-size:9px;line-height:1.6;font-family:monospace;">`;
  html += `<div style="font-weight:700;text-align:center;margin-bottom:2px;">${mesLabel} de ${ano}</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-weight:700;color:#666;">`;
  html += "D S T Q Q S S".split(" ").map(d => `<span>${d}</span>`).join("");
  html += `</div><div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;">`;
  for (let i = 0; i < primeiroDia; i++) html += `<span></span>`;
  for (let d = 1; d <= diasNoMes; d++) {
    const hl = highlightDays?.includes(d);
    const style = hl ? "background:#ddd;border-radius:3px;font-weight:700;" : "";
    html += `<span style="${style}">${d}</span>`;
  }
  html += `</div></div>`;
  return html;
}

function buildPrintHTML(
  mode: PrintMode,
  ano: number,
  mes: number,
  diaSelecionado: number | null,
  compromissos: Compromisso[],
  paroquiaNome: string
): string {
  const mesLabel = MESES[mes];

  const eventosNoDia = (dataStr: string) =>
    compromissos.filter(c => c.data === dataStr).sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));

  const miniCals = () => {
    const prev = mes === 0 ? 11 : mes - 1;
    const prevAno = mes === 0 ? ano - 1 : ano;
    const next = mes === 11 ? 0 : mes + 1;
    const nextAno = mes === 11 ? ano + 1 : ano;
    return `<div style="display:flex;gap:16px;">${miniCalHTML(prevAno, prev, MESES_CURTO[prev])}${miniCalHTML(ano, mes, MESES_CURTO[mes])}${miniCalHTML(nextAno, next, MESES_CURTO[next])}</div>`;
  };

  const headerCSS = `
    * { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
    body { color: #111; font-size: 11px; }
    @page { size: A4 landscape; margin: 12mm; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 800; color: #000; }
    .subtitle { font-size: 11px; color: #666; margin-top: 2px; }
    .event-dot { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 5px; vertical-align: middle; flex-shrink: 0; }
    .footer { position: fixed; bottom: 8mm; left: 12mm; right: 12mm; display: flex; justify-content: space-between; font-size: 9px; color: #999; }
  `;

  if (mode === "dia") {
    const dia = diaSelecionado || new Date().getDate();
    const dateObj = new Date(ano, mes, dia);
    const diaSemana = DIAS_SEMANA_FULL[dateObj.getDay()];
    const dataStr = fmtData(dateObj);
    const evs = eventosNoDia(dataStr);

    const horasHTML = () => {
      let html = "";
      for (let h = 6; h <= 22; h++) {
        const label = h === 12 ? "Meio-dia" : `${String(h).padStart(2, "0")}`;
        const evsHora = evs.filter(e => {
          const hora = parseInt(e.horario?.split(":")[0] || "-1");
          return hora === h;
        });
        html += `<div style="display:flex;border-top:1px solid #e5e5e5;min-height:36px;">`;
        html += `<div style="width:50px;padding:4px 8px 4px 0;text-align:right;font-size:10px;color:#888;flex-shrink:0;">${label}</div>`;
        html += `<div style="flex:1;padding:2px 8px;">`;
        for (const ev of evsHora) {
          html += `<div style="display:flex;align-items:center;gap:4px;padding:2px 0;">`;
          html += `<span class="event-dot" style="background:${CATEGORIA_COR[ev.categoria] || "#999"}"></span>`;
          html += `<span style="font-size:10px;font-weight:600;">${ev.horario} ${ev.titulo}${ev.local ? " — " + ev.local : ""}</span>`;
          html += `</div>`;
        }
        html += `</div></div>`;
      }
      return html;
    };

    const eventosListHTML = evs.map(ev =>
      `<div style="margin-bottom:6px;display:flex;align-items:flex-start;gap:5px;">
        <span class="event-dot" style="background:${CATEGORIA_COR[ev.categoria] || "#999"};margin-top:3px;"></span>
        <div><strong>${ev.horario || ""} ${ev.titulo}</strong>${ev.local ? " — " + ev.local : ""}${ev.descricao ? "<br><span style='color:#666;font-size:10px;'>Notas: " + ev.descricao + "</span>" : ""}</div>
      </div>`
    ).join("");

    return `<!DOCTYPE html><html><head><style>${headerCSS}@page{size:A4 portrait;}</style></head><body>
      <div class="header">
        <div>
          <div class="title">${diaSemana}, ${dia} de ${mesLabel.toLowerCase()}</div>
          <div class="subtitle">Semana ${Math.ceil((dia + new Date(ano, mes, 1).getDay()) / 7)} de ${ano} — ${paroquiaNome}</div>
        </div>
        <div style="text-align:right;">${miniCalHTML(ano, mes, MESES_CURTO[mes], [dia])}${miniCalHTML(mes === 11 ? ano + 1 : ano, mes === 11 ? 0 : mes + 1, MESES_CURTO[mes === 11 ? 0 : mes + 1])}</div>
      </div>
      <div style="display:flex;gap:20px;">
        <div style="flex:2;">${horasHTML()}</div>
        <div style="flex:1;border-left:1px solid #e5e5e5;padding-left:16px;">
          <div style="font-weight:700;margin-bottom:8px;font-size:11px;">Eventos Programados</div>
          ${eventosListHTML || "<div style='color:#999;'>Nenhum evento.</div>"}
        </div>
      </div>
      <div class="footer"><span>${paroquiaNome}</span><span>Página 1/1</span></div>
    </body></html>`;
  }

  if (mode === "semana") {
    const dia = diaSelecionado || new Date().getDate();
    const dateObj = new Date(ano, mes, dia);
    const dow = dateObj.getDay();
    const domDate = new Date(dateObj); domDate.setDate(domDate.getDate() - dow);
    const sabDate = new Date(domDate); sabDate.setDate(sabDate.getDate() + 6);

    const fmtShort = (d: Date) => `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    const titulo = `De ${domDate.getDate()} de ${MESES[domDate.getMonth()].toLowerCase()} a ${sabDate.getDate()} de ${MESES[sabDate.getMonth()].toLowerCase()}, ${sabDate.getFullYear()}`;
    const semanaNum = Math.ceil((dia + new Date(ano, mes, 1).getDay()) / 7);

    const diasSemana: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(domDate);
      d.setDate(d.getDate() + i);
      diasSemana.push(d);
    }

    let gridHTML = `<table style="width:100%;border-collapse:collapse;table-layout:fixed;">`;
    gridHTML += `<thead><tr>`;
    for (const d of diasSemana) {
      gridHTML += `<th style="border:1px solid #ddd;padding:6px 4px;font-size:10px;font-weight:700;background:#f5f5f5;text-align:center;">${DIAS_SEMANA_FULL[d.getDay()]}, ${d.getDate()}</th>`;
    }
    gridHTML += `</tr></thead><tbody>`;

    for (let h = 6; h <= 21; h++) {
      gridHTML += `<tr>`;
      for (const d of diasSemana) {
        const ds = fmtData(d);
        const evsHora = compromissos.filter(c => c.data === ds && parseInt(c.horario?.split(":")[0] || "-1") === h);
        gridHTML += `<td style="border:1px solid #eee;padding:2px 3px;vertical-align:top;font-size:9px;height:28px;">`;
        for (const ev of evsHora) {
          gridHTML += `<div style="display:flex;align-items:center;gap:2px;"><span class="event-dot" style="background:${CATEGORIA_COR[ev.categoria] || "#999"};width:6px;height:6px;"></span><span>${ev.titulo.substring(0, 30)}</span></div>`;
        }
        gridHTML += `</td>`;
      }
      gridHTML += `</tr>`;
    }
    gridHTML += `</tbody></table>`;

    return `<!DOCTYPE html><html><head><style>${headerCSS}</style></head><body>
      <div class="header">
        <div>
          <div class="title">${titulo}</div>
          <div class="subtitle">Semana ${semanaNum} — ${paroquiaNome}</div>
        </div>
        <div style="text-align:right;">${miniCalHTML(ano, mes, MESES_CURTO[mes], diasSemana.filter(d => d.getMonth() === mes).map(d => d.getDate()))}${miniCalHTML(mes === 11 ? ano + 1 : ano, mes === 11 ? 0 : mes + 1, MESES_CURTO[mes === 11 ? 0 : mes + 1])}</div>
      </div>
      ${gridHTML}
      <div class="footer"><span>${paroquiaNome}</span><span>Página 1/1</span></div>
    </body></html>`;
  }

  // MÊS
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  let gridHTML = `<table style="width:100%;border-collapse:collapse;table-layout:fixed;">`;
  gridHTML += `<thead><tr>`;
  for (const d of DIAS_SEMANA_FULL) {
    gridHTML += `<th style="border:1px solid #ddd;padding:6px;font-size:10px;font-weight:700;background:#f5f5f5;text-align:center;">${d}</th>`;
  }
  gridHTML += `</tr></thead><tbody><tr>`;

  for (let i = 0; i < primeiroDia; i++) {
    gridHTML += `<td style="border:1px solid #eee;padding:3px;vertical-align:top;height:65px;"></td>`;
  }

  let cellCount = primeiroDia;
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const evs = eventosNoDia(dataStr);

    gridHTML += `<td style="border:1px solid #eee;padding:3px 4px;vertical-align:top;height:65px;font-size:9px;">`;
    gridHTML += `<div style="font-weight:700;font-size:10px;margin-bottom:2px;">${dia}</div>`;
    for (const ev of evs.slice(0, 4)) {
      gridHTML += `<div style="display:flex;align-items:center;gap:2px;margin-bottom:1px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">`;
      gridHTML += `<span class="event-dot" style="background:${CATEGORIA_COR[ev.categoria] || "#999"};width:6px;height:6px;"></span>`;
      gridHTML += `<span style="font-size:8px;">${ev.horario ? ev.horario + " " : ""}${ev.titulo}</span>`;
      gridHTML += `</div>`;
    }
    if (evs.length > 4) gridHTML += `<div style="font-size:8px;color:#999;">+${evs.length - 4} mais</div>`;
    gridHTML += `</td>`;

    cellCount++;
    if (cellCount % 7 === 0 && dia < diasNoMes) gridHTML += `</tr><tr>`;
  }

  while (cellCount % 7 !== 0) {
    gridHTML += `<td style="border:1px solid #eee;height:65px;"></td>`;
    cellCount++;
  }
  gridHTML += `</tr></tbody></table>`;

  return `<!DOCTYPE html><html><head><style>${headerCSS}</style></head><body>
    <div class="header">
      <div>
        <div class="title">${mesLabel.toLowerCase()} de ${ano}</div>
        <div class="subtitle">${compromissos.length} evento${compromissos.length !== 1 ? "s" : ""} — ${paroquiaNome}</div>
      </div>
      <div style="text-align:right;">${miniCals()}</div>
    </div>
    ${gridHTML}
    <div style="margin-top:10px;display:flex;gap:16px;flex-wrap:wrap;">
      ${Object.entries(CATEGORIA_LABEL).map(([k, l]) => `<div style="display:flex;align-items:center;gap:4px;"><span class="event-dot" style="background:${CATEGORIA_COR[k]}"></span><span style="font-size:9px;">${l}</span></div>`).join("")}
    </div>
    <div class="footer"><span>${paroquiaNome}</span><span>Página 1/1</span></div>
  </body></html>`;
}

function imprimirCalendario(mode: PrintMode, ano: number, mes: number, diaSelecionado: number | null, compromissos: Compromisso[], paroquiaNome: string) {
  const html = buildPrintHTML(mode, ano, mes, diaSelecionado, compromissos, paroquiaNome);
  const w = window.open("", "_blank", "width=1000,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

export function CalendarioPage() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [paroquiaNome, setParoquiaNome] = useState("Paróquia");

  useEffect(() => {
    carregarMes();
  }, [ano, mes]);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        const rows = await db.select<{ nome: string }[]>("SELECT nome FROM paroquia LIMIT 1");
        if (rows[0]?.nome) setParoquiaNome(rows[0].nome);
      } catch {}
    })();
  }, []);

  async function carregarMes() {
    try {
      const db = await getDb();
      const inicio = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
      const fim = `${ano}-${String(mes + 1).padStart(2, "0")}-31`;
      const rows = await db.select<Compromisso[]>(
        "SELECT id, titulo, descricao, data, horario, local, categoria FROM agenda_compromissos WHERE data >= ? AND data <= ? AND deleted_at IS NULL ORDER BY data ASC, horario ASC",
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
  while (celulas.length % 7 !== 0) celulas.push(null);

  function eventosNoDia(dia: number) {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return compromissos.filter(c => c.data === dataStr);
  }

  const eventosDiaSelecionado = diaSelecionado ? eventosNoDia(diaSelecionado) : [];

  const isHoje = (dia: number) =>
    dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();

  const handlePrint = (mode: PrintMode) => {
    setShowPrintMenu(false);
    imprimirCalendario(mode, ano, mes, diaSelecionado, compromissos, paroquiaNome);
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Cabeçalho de navegação */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => navMes(-1)} style={{ background: "#f5f7fa", border: "none", borderRadius: 10, padding: "8px 18px", cursor: "pointer", fontSize: 18, color: "#1f3b73", fontWeight: 700 }}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1f3b73" }}>{MESES[mes]} {ano}</div>
          <div style={{ fontSize: 12, color: "#98a2b3", marginTop: 2 }}>{compromissos.length} evento{compromissos.length !== 1 ? "s" : ""} neste mês</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Botão Imprimir com dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#1f3b73", color: "#fff", border: "none", borderRadius: 10,
                padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700,
                fontFamily: "inherit", transition: "all .15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#2d4a8c")}
              onMouseLeave={e => (e.currentTarget.style.background = "#1f3b73")}
            >
              <Printer size={14} /> Imprimir
            </button>
            {showPrintMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => setShowPrintMenu(false)} />
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 999,
                  background: "#fff", borderRadius: 12, border: "1px solid #e4e7ec",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 6, minWidth: 180,
                }}>
                  <button onClick={() => handlePrint("dia")} style={menuItemStyle}>
                    📋 Visão do Dia
                    <span style={{ fontSize: 10, color: "#98a2b3" }}>{diaSelecionado ? `Dia ${diaSelecionado}` : "Hoje"}</span>
                  </button>
                  <button onClick={() => handlePrint("semana")} style={menuItemStyle}>
                    📅 Visão da Semana
                    <span style={{ fontSize: 10, color: "#98a2b3" }}>7 dias</span>
                  </button>
                  <button onClick={() => handlePrint("mes")} style={menuItemStyle}>
                    🗓️ Visão do Mês
                    <span style={{ fontSize: 10, color: "#98a2b3" }}>{MESES[mes]}</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <button onClick={() => navMes(1)} style={{ background: "#f5f7fa", border: "none", borderRadius: 10, padding: "8px 18px", cursor: "pointer", fontSize: 18, color: "#1f3b73", fontWeight: 700 }}>›</button>
        </div>
      </section>

      {/* Grade do calendário */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
          {DIAS_SEMANA.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: "#667085", padding: "6px 0", textTransform: "uppercase" }}>{d}</div>
          ))}
        </div>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1f3b73" }}>
              {String(diaSelecionado).padStart(2,"0")}/{String(mes+1).padStart(2,"0")}/{ano}
            </h3>
            <button
              onClick={() => handlePrint("dia")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "#f5f7fa", border: "1px solid #e4e7ec", borderRadius: 8,
                padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600,
                color: "#1f3b73", fontFamily: "inherit",
              }}
            >
              <Printer size={12} /> Imprimir dia
            </button>
          </div>
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
                      {ev.horario && `${ev.horario}`}
                      {ev.local && ` · ${ev.local}`}
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

const menuItemStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
  padding: "10px 14px", background: "none", border: "none", borderRadius: 8,
  cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#344054",
  fontFamily: "inherit", transition: "background .1s",
};
