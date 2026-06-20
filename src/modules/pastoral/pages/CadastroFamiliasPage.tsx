import { useState } from "react";
import type { Paroquia } from "../../../core/types/app.types";
import { useFamilias } from "../hooks/useFamilias";
import { DocumentHeader } from "@core/components/DocumentHeader";
import type { Familia } from '../../../core/types/entities';

interface CadastroFamiliasPageProps {
  paroquia?: Paroquia;
  comunidadeFiltro?: string | null;
}

type ModoImpressao = "lista" | "ficha";

// Dispara window.print() com document.title temporário para nomear o arquivo
function imprimirCom(titulo: string) {
  const anterior = document.title;
  document.title = titulo;
  window.print();
  document.title = anterior;
}

export function CadastroFamiliasPage({ paroquia, comunidadeFiltro = null }: CadastroFamiliasPageProps) {
  const {
    familias, familiaDraft, setFamiliaDraft, editarFamilia, salvarFamilia,
    comunidades, membros, fieisDisponiveis, carregarMembros,
    vincularMembro, removerMembro, limparDraft,
    contagemMembros, carregarDados,
  } = useFamilias();

  const [busca, setBusca] = useState("");
  const [familiaSelecionada, setFamiliaSelecionada] = useState<Familia | null>(null);
  const [parentescoDraft, setParentescoDraft] = useState("Filho(a)");
  const [comunidadeImpressao, setComunidadeImpressao] = useState("__TODAS__");
  const [fichaAberta, setFichaAberta] = useState<Familia | null>(null);
  const [modoImpressao, setModoImpressao] = useState<ModoImpressao>("lista");

  const abrirMembros = (familia: Familia) => {
    setFamiliaSelecionada(familia);
    carregarMembros(familia.id);
  };

  const abrirFicha = async (familia: Familia) => {
    setFichaAberta(familia);
    await carregarMembros(familia.id);
  };

  const fecharFicha = () => setFichaAberta(null);

  const handleImprimirLista = () => {
    setModoImpressao("lista");
    const titulo = comunidadeImpressao === "__TODAS__"
      ? "Ficha de Família"
      : `Ficha de Família - ${comunidadeImpressao}`;
    setTimeout(() => imprimirCom(titulo), 80);
  };

  const handleImprimirFicha = async (familia: Familia) => {
    await carregarMembros(familia.id);
    setFichaAberta(familia);
    setModoImpressao("ficha");
    setTimeout(() => imprimirCom(`Ficha de Família - ${familia.sobrenome}`), 120);
  };

  const familiasFiltradas = familias.filter(f =>
    f.sobrenome.toLowerCase().includes(busca.toLowerCase()) &&
    (comunidadeFiltro == null || f.comunidade === comunidadeFiltro)
  );

  const familiasParaImprimir = familias.filter(f =>
    comunidadeImpressao === "__TODAS__" || f.comunidade === comunidadeImpressao
  );

  return (
    <div style={{ padding: "20px", fontFamily: "Inter, sans-serif" }}>

      <style>{`
        @page { size: A4; margin: 1.5cm; }

        @media screen {
          #area-impressao-familias { display: none !important; }
        }

        @media print {
          body * { visibility: hidden; background: transparent !important; }
          #area-impressao-familias,
          #area-impressao-familias * { visibility: visible; }
          #area-impressao-familias {
            position: absolute; left: 0; top: 0; width: 98%;
            display: block !important; padding: 0; margin: 0;
          }
          #area-impressao-familias h2 {
            text-align: center; font-size: 16pt !important; color: #1f3b73;
            margin-top: 20px !important; margin-bottom: 10px !important;
          }
          #area-impressao-familias table {
            width: 100%; border-collapse: collapse; margin-top: 8px;
            font-size: 10pt !important;
          }
          #area-impressao-familias th, #area-impressao-familias td {
            border: 1px solid #000; padding: 7px; text-align: left;
          }
          #area-impressao-familias th {
            background-color: #f0f0f0 !important;
            -webkit-print-color-adjust: exact; color-adjust: exact;
          }
          /* Ficha individual */
          .ficha-secao { margin-bottom: 18px; }
          .ficha-linha { display: flex; gap: 12px; margin-bottom: 6px; font-size: 10pt; }
          .ficha-campo-label { font-weight: bold; color: #1f3b73; min-width: 130px; }
          .ficha-destaque { background: #f0f4ff !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
        }
      `}</style>

      {/* ── INTERFACE ─────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>

        {/* Formulário */}
        <div style={formS}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ color: "#1f3b73", marginTop: 0 }}>Gestão de Família</h3>
            {familiaDraft.id && <button onClick={limparDraft} style={{ cursor: "pointer", fontSize: "10px" }}>Novo</button>}
          </div>

          <label style={labS}>SOBRENOME / IDENTIFICAÇÃO</label>
          <input placeholder="Ex: Família Silva" style={inS} value={familiaDraft.sobrenome}
            onChange={e => setFamiliaDraft({ ...familiaDraft, sobrenome: e.target.value })} />

          <label style={labS}>ENDEREÇO</label>
          <input style={inS} value={familiaDraft.endereco}
            onChange={e => setFamiliaDraft({ ...familiaDraft, endereco: e.target.value })} />

          <label style={labS}>COMUNIDADE</label>
          <select style={inS} value={familiaDraft.comunidade}
            onChange={e => setFamiliaDraft({ ...familiaDraft, comunidade: e.target.value })}>
            <option value="">Selecione...</option>
            {comunidades.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
          </select>

          <label style={labS}>OBSERVAÇÕES</label>
          <textarea style={{ ...inS, height: "60px", resize: "none" }} value={familiaDraft.observacoes}
            onChange={e => setFamiliaDraft({ ...familiaDraft, observacoes: e.target.value })} />

          <label style={labS}>RESPONSÁVEL</label>
          <select style={inS} value={familiaDraft.responsavel_id ?? ""}
            onChange={e => setFamiliaDraft({ ...familiaDraft, responsavel_id: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Selecione o responsável...</option>
            {fieisDisponiveis.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>

          <label style={{ display: "flex", gap: "8px", marginBottom: "15px", fontSize: "12px", fontWeight: "bold", color: "#d32f2f" }}>
            <input type="checkbox" checked={!!familiaDraft.recebe_caritas}
              onChange={e => setFamiliaDraft({ ...familiaDraft, recebe_caritas: e.target.checked })} />
            Assistida pela Cáritas
          </label>

          <button onClick={salvarFamilia} style={btnS}>Salvar Família</button>

          {/* Impressão por comunidade */}
          <div style={{ marginTop: 14, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
            <label style={labS}>IMPRIMIR POR COMUNIDADE</label>
            <select style={inS} value={comunidadeImpressao}
              onChange={e => setComunidadeImpressao(e.target.value)}>
              <option value="__TODAS__">Todas as Comunidades</option>
              {comunidades.map(c => (
                <option key={c.nome} value={c.nome}>{c.nome}</option>
              ))}
            </select>
            <button onClick={handleImprimirLista}
              style={{ ...btnS, background: "white", color: "#1f3b73", border: "1px solid #1f3b73" }}>
              🖨️ {comunidadeImpressao === "__TODAS__" ? "Imprimir Lista Geral" : `Imprimir — ${comunidadeImpressao}`}
            </button>
          </div>
        </div>

        {/* Lista de Famílias */}
        <div style={{ flex: 1 }}>
          <input placeholder="🔍 Buscar família por sobrenome..." style={inS} value={busca}
            onChange={e => setBusca(e.target.value)} />
          <div style={listCard}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={thS}>Família</th>
                  <th style={thS}>Responsável</th>
                  <th style={thS}>Comunidade</th>
                  <th style={{ ...thS, textAlign: "center" }}>Membros</th>
                  <th style={thS}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {familiasFiltradas.map(f => (
                  <tr key={f.id}
                    style={{ borderBottom: "1px solid #f1f5f9", background: familiaSelecionada?.id === f.id ? "#f0f4ff" : "transparent", cursor: "pointer" }}
                    onClick={() => abrirFicha(f)}
                  >
                    <td style={tdS}>
                      <strong style={{ color: "#1f3b73" }}>{f.sobrenome}</strong>
                      <br /><small style={{ color: "#94a3b8" }}>{f.endereco || "—"}</small>
                    </td>
                    <td style={tdS}>{fieisDisponiveis.find(fi => fi.id === f.responsavel_id)?.nome || "—"}</td>
                    <td style={tdS}>{f.comunidade || "—"}</td>
                    <td style={{ ...tdS, textAlign: "center" }}>
                      <span style={{ background: "#e0e7ff", color: "#3730a3", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                        {contagemMembros[f.id] ?? 0}
                      </span>
                    </td>
                    <td style={tdS} onClick={e => e.stopPropagation()}>
                      <button onClick={() => abrirFicha(f)} style={actBtn} title="Ver ficha">📋 Ficha</button>
                      <button onClick={() => { abrirMembros(f); }} style={actBtn} title="Gerenciar membros">👥</button>
                      <button onClick={() => editarFamilia(f)} style={actBtn} title="Editar">✏️</button>
                    </td>
                  </tr>
                ))}
                {familiasFiltradas.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>Nenhuma família encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Painel de Membros (gerenciar vínculos) */}
        {familiaSelecionada && !fichaAberta && (
          <div style={membrosPanel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ color: "#1f3b73", margin: 0 }}>Vincular Membros</h4>
              <button onClick={() => setFamiliaSelecionada(null)} style={{ border: "none", background: "none", cursor: "pointer" }}>✖</button>
            </div>
            <p style={{ fontSize: "11px", color: "#666" }}>Família: {familiaSelecionada.sobrenome}</p>

            <div style={{ background: "#f1f5f9", padding: "10px", borderRadius: "8px", marginTop: "10px" }}>
              <label style={labS}>SELECIONAR FIEL</label>
              <select style={inS} onChange={e => {
                const val = e.target.value;
                if (val) { vincularMembro(familiaSelecionada.id, Number(val), parentescoDraft); carregarDados(); }
              }}>
                <option value="">Buscar nome...</option>
                {fieisDisponiveis.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>

              <label style={labS}>PARENTESCO / PAPEL</label>
              <select style={inS} value={parentescoDraft} onChange={e => setParentescoDraft(e.target.value)}>
                <option>Pai</option>
                <option>Mãe</option>
                <option>Filho(a)</option>
                <option>Avô/Avó</option>
                <option>Responsável</option>
              </select>
            </div>

            <div style={{ marginTop: "15px" }}>
              <label style={labS}>MEMBROS VINCULADOS</label>
              {membros.length === 0 && <p style={{ fontSize: "12px", color: "#999" }}>Nenhum membro vinculado.</p>}
              {membros.map(m => (
                <div key={m.id} style={membroItem}>
                  <span><strong>{m.nome_fiel}</strong><br /><small>{m.parentesco}</small></span>
                  <button onClick={() => { removerMembro(m.id, familiaSelecionada.id); carregarDados(); }}
                    style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: FICHA INDIVIDUAL ─────────────────────────── */}
      {fichaAberta && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={fecharFicha}>
          <div style={{ background: "white", borderRadius: 16, padding: 32, width: 560, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, color: "#1f3b73", fontSize: 20 }}>{fichaAberta.sobrenome}</h2>
                <p style={{ margin: "4px 0 0", color: "#667085", fontSize: 13 }}>Ficha de Família</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleImprimirFicha(fichaAberta)}
                  style={{ ...actBtn, background: "#1f3b73", color: "white", border: "none" }}>
                  🖨️ Imprimir Ficha
                </button>
                <button onClick={fecharFicha} style={{ ...actBtn }}>✖ Fechar</button>
              </div>
            </div>

            {/* Dados da família */}
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 12px", color: "#1f3b73", fontSize: 13, textTransform: "uppercase" }}>Dados da Família</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                <div><span style={{ color: "#667085" }}>Responsável:</span><br /><strong>{fieisDisponiveis.find(f => f.id === fichaAberta.responsavel_id)?.nome || "—"}</strong></div>
                <div><span style={{ color: "#667085" }}>Comunidade:</span><br /><strong>{fichaAberta.comunidade || "—"}</strong></div>
                <div><span style={{ color: "#667085" }}>Assistida pela Cáritas:</span><br /><strong style={{ color: fichaAberta.recebe_caritas ? "#dc2626" : "#16a34a" }}>{fichaAberta.recebe_caritas ? "Sim" : "Não"}</strong></div>
                <div style={{ gridColumn: "1/-1" }}><span style={{ color: "#667085" }}>Endereço:</span><br /><strong>{fichaAberta.endereco || "—"}</strong></div>
                {fichaAberta.observacoes && (
                  <div style={{ gridColumn: "1/-1" }}><span style={{ color: "#667085" }}>Observações:</span><br /><strong>{fichaAberta.observacoes}</strong></div>
                )}
              </div>
            </div>

            {/* Membros */}
            <div>
              <h4 style={{ margin: "0 0 10px", color: "#1f3b73", fontSize: 13, textTransform: "uppercase" }}>
                Membros da Família ({membros.length})
              </h4>
              {membros.length === 0
                ? <p style={{ color: "#94a3b8", fontSize: 13 }}>Nenhum membro vinculado.</p>
                : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9" }}>
                        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "#64748b" }}>Nome</th>
                        <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "#64748b" }}>Parentesco</th>
                        <th style={{ padding: "8px 10px", fontSize: 11, color: "#64748b" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {membros.map(m => (
                        <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 10px", fontWeight: 600 }}>{m.nome_fiel}</td>
                          <td style={{ padding: "8px 10px", color: "#667085" }}>{m.parentesco}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }}>
                            <button onClick={() => { removerMembro(m.id, fichaAberta.id); carregarMembros(fichaAberta.id); carregarDados(); }}
                              style={{ color: "red", border: "none", background: "none", cursor: "pointer" }}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
              {/* Adicionar membro direto na ficha */}
              <div style={{ marginTop: 14, padding: 12, background: "#f8fafc", borderRadius: 8, display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labS, marginBottom: 4 }}>ADICIONAR MEMBRO</label>
                  <select style={{ ...inS, marginBottom: 0 }} onChange={e => {
                    const val = e.target.value;
                    if (val) { vincularMembro(fichaAberta.id, Number(val), parentescoDraft); carregarMembros(fichaAberta.id); carregarDados(); (e.target as HTMLSelectElement).value = ""; }
                  }}>
                    <option value="">Selecionar fiel...</option>
                    {fieisDisponiveis.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...labS, marginBottom: 4 }}>PARENTESCO</label>
                  <select style={{ ...inS, marginBottom: 0, width: 130 }} value={parentescoDraft} onChange={e => setParentescoDraft(e.target.value)}>
                    <option>Pai</option><option>Mãe</option><option>Filho(a)</option>
                    <option>Avô/Avó</option><option>Responsável</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ÁREA DE IMPRESSÃO (oculta na tela) ────────────── */}
      <div id="area-impressao-familias">
        {paroquia && <DocumentHeader paroquia={paroquia} />}

        {/* MODO LISTA */}
        {modoImpressao === "lista" && (<>
          <h2>
            {comunidadeImpressao === "__TODAS__"
              ? "LISTAGEM GERAL DE FAMÍLIAS"
              : `FAMÍLIAS — ${comunidadeImpressao.toUpperCase()}`}
          </h2>
          {comunidadeImpressao !== "__TODAS__" && (
            <p style={{ textAlign: "center", fontSize: "11pt", color: "#555", marginBottom: 14 }}>
              Comunidade: <strong>{comunidadeImpressao}</strong>
            </p>
          )}
          <table>
            <thead>
              <tr>
                <th>Família / Identificação</th>
                {comunidadeImpressao === "__TODAS__" && <th>Comunidade</th>}
                <th>Endereço</th>
                <th style={{ textAlign: "center" }}>Membros</th>
                <th style={{ textAlign: "center" }}>Cáritas</th>
              </tr>
            </thead>
            <tbody>
              {familiasParaImprimir.map(f => (
                <tr key={f.id}>
                  <td>{f.sobrenome}</td>
                  {comunidadeImpressao === "__TODAS__" && <td>{f.comunidade || "—"}</td>}
                  <td>{f.endereco || "—"}</td>
                  <td style={{ textAlign: "center" }}>{contagemMembros[f.id] ?? 0}</td>
                  <td style={{ textAlign: "center" }}>{f.recebe_caritas ? "Sim" : "Não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: "9pt", color: "#888", marginTop: 16, textAlign: "right" }}>
            Total: {familiasParaImprimir.length} família(s)
          </p>
        </>)}

        {/* MODO FICHA INDIVIDUAL */}
        {modoImpressao === "ficha" && fichaAberta && (
          <div style={{ fontFamily: "sans-serif" }}>
            <h2>FICHA DE FAMÍLIA</h2>

            {/* Identificação */}
            <div className="ficha-secao" style={{ border: "1.5px solid #1f3b73", borderRadius: 6, padding: "12px 16px", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "none" }}>
                <tbody>
                  <tr>
                    <td style={{ border: "none", padding: "4px 0", width: "50%" }}>
                      <span style={{ fontWeight: "bold", color: "#1f3b73" }}>FAMÍLIA:</span>{" "}
                      <span style={{ fontSize: "13pt", fontWeight: "bold" }}>{fichaAberta.sobrenome}</span>
                    </td>
                    <td style={{ border: "none", padding: "4px 0" }}>
                      <span style={{ fontWeight: "bold", color: "#1f3b73" }}>COMUNIDADE:</span>{" "}{fichaAberta.comunidade || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "none", padding: "4px 0" }} colSpan={2}>
                      <span style={{ fontWeight: "bold", color: "#1f3b73" }}>ENDEREÇO:</span>{" "}{fichaAberta.endereco || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: "none", padding: "4px 0" }}>
                      <span style={{ fontWeight: "bold", color: "#1f3b73" }}>ASSISTIDA PELA CÁRITAS:</span>{" "}
                      {fichaAberta.recebe_caritas ? "Sim" : "Não"}
                    </td>
                    <td style={{ border: "none", padding: "4px 0" }}>
                      <span style={{ fontWeight: "bold", color: "#1f3b73" }}>Nº DE MEMBROS:</span>{" "}
                      {membros.length}
                    </td>
                  </tr>
                  {fichaAberta.observacoes && (
                    <tr>
                      <td style={{ border: "none", padding: "4px 0" }} colSpan={2}>
                        <span style={{ fontWeight: "bold", color: "#1f3b73" }}>OBSERVAÇÕES:</span>{" "}{fichaAberta.observacoes}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Membros */}
            <h3 style={{ color: "#1f3b73", fontSize: "12pt", marginBottom: 8, textTransform: "uppercase" }}>
              Membros da Família
            </h3>
            {membros.length === 0
              ? <p style={{ color: "#888", fontSize: "10pt" }}>Nenhum membro vinculado.</p>
              : (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nome Completo</th>
                      <th>Parentesco / Papel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membros.map((m, i) => (
                      <tr key={m.id} className={i % 2 === 0 ? "ficha-destaque" : ""}>
                        <td style={{ textAlign: "center", width: 30 }}>{i + 1}</td>
                        <td>{m.nome_fiel}</td>
                        <td>{m.parentesco}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }

            <p style={{ fontSize: "8pt", color: "#aaa", marginTop: 24, borderTop: "1px solid #ccc", paddingTop: 8 }}>
              Emitido em: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Estilos
const formS: React.CSSProperties = { width: "320px", background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", height: "fit-content" };
const inS: React.CSSProperties = { width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "10px", boxSizing: "border-box", fontSize: "13px" };
const labS: React.CSSProperties = { fontSize: "11px", fontWeight: "bold", color: "#64748b", display: "block", marginBottom: "4px" };
const btnS: React.CSSProperties = { width: "100%", padding: "12px", background: "#1f3b73", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const listCard: React.CSSProperties = { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" };
const thS: React.CSSProperties = { padding: "12px", textAlign: "left", fontSize: "11px", color: "#64748b" };
const tdS: React.CSSProperties = { padding: "12px", fontSize: "13px" };
const actBtn: React.CSSProperties = { padding: "5px 10px", marginRight: "5px", cursor: "pointer", borderRadius: "4px", border: "1px solid #cbd5e1", background: "white", fontSize: "11px" };
const membrosPanel: React.CSSProperties = { width: "300px", background: "white", padding: "20px", borderRadius: "12px", border: "2px solid #1f3b73", height: "fit-content" };
const membroItem: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", borderBottom: "1px solid #f1f5f9" };
