import { useToast } from "@core/ui/Toast";
import { gerarPDFObito } from "../utils/gerarPDFSacramental";
import { useState, useEffect, CSSProperties } from "react";
import { save, ask } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import type { Paroquia } from "../../../core/types/app.types";
import type { ObitoExequia } from "../../../core/types/entities";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { SacramentalRepository } from '../repository/sacramental.repository';
import { PastoralRepository } from '../../pastoral/repository/pastoral.repository';
import { BuscarFielPastoral } from "../components/BuscarFielPastoral";

interface Props { paroquia: Paroquia; }

const styles: { [key: string]: CSSProperties } = {
  container: {
    padding: "30px",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
  },
  formCard: {
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderRadius: "28px",
    border: "1px solid rgba(255,255,255,0.6)",
    padding: "32px",
    marginBottom: "30px",
    boxShadow: "0 10px 40px rgba(15,23,42,0.08)",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1f3b73",
    marginBottom: "24px",
    borderBottom: "1px solid rgba(203,213,225,0.5)",
    paddingBottom: "12px",
    letterSpacing: "-0.02em",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#475467",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    paddingLeft: "4px",
  },
  input: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "14px",
    border: "1px solid #d0d5dd",
    background: "rgba(255,255,255,0.92)",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    transition: "all .2s ease",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
  },
  select: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "14px",
    border: "1px solid #d0d5dd",
    background: "rgba(255,255,255,0.92)",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid #d0d5dd",
    background: "rgba(255,255,255,0.92)",
    fontSize: "14px",
    minHeight: "120px",
    resize: "vertical",
    outline: "none",
    transition: "all .2s ease",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
  },
  btnRegistrar: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    padding: "14px 24px",
    borderRadius: "16px",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(34,197,94,0.25)",
    transition: "all .2s ease",
  },
  btnWord: {
    background: "linear-gradient(135deg, #2b579a, #2563eb)",
    color: "white",
    padding: "14px 24px",
    borderRadius: "16px",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(37,99,235,0.22)",
    transition: "all .2s ease",
  },
  searchBar: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(31,59,115,0.18)",
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "0 4px 20px rgba(15,23,42,0.05)",
  },
};

const DADOS_VAZIO = {
  nome: "", dataNasc: "", dataFalecimento: "", dataExequias: "",
  local: "", ministro: "", cemiterio: "", obs: "",
  comunidade: "", comunidadeManual: "", tipoComunidade: "existente" as "existente" | "manual",
  documentoRetirado: "Não",
};

export function ObitosExequiasPage({ paroquia: paroquiaDados }: Props) {
  const { showToast } = useToast();
  const [fonteDocumento, setFonteDocumento] = useState("Arial");
  const [busca, setBusca] = useState("");
  const [buscaComunidade, setBuscaComunidade] = useState("");
  const [registros, setRegistros] = useState<ObitoExequia[]>([]);
  const [listaAberta, setListaAberta] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [fielId, setFielId] = useState<number | null>(null);
  const [comunidades, setComunidades] = useState<string[]>([]);
  const [dados, setDados] = useState({ ...DADOS_VAZIO });

  const atualizar = (campo: string, valor: string) => setDados(p => ({ ...p, [campo]: valor }));
  const comunidadeEfetiva = dados.tipoComunidade === "manual" ? dados.comunidadeManual : dados.comunidade;

  const carregarComunidades = async () => {
    try {
      const res = await PastoralRepository.comunidades.findNomes();
      setComunidades(res.map(r => r.nome));
    } catch (e) { console.error(e); }
  };

  const carregarRegistros = async () => {
    try {
      const res = await SacramentalRepository.obitos.findAllOrdenados();
      setRegistros(res);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    carregarRegistros();
    carregarComunidades();
  }, []);

  const formatRTF = (text: string) => {
    if (!text) return "";
    return text
      .replace(/[áàâã]/g, "\\'e1").replace(/[ÁÀÂÃ]/g, "\\'c1")
      .replace(/[éèê]/g, "\\'e9").replace(/[ÉÈÊ]/g, "\\'c9")
      .replace(/[íìî]/g, "\\'ed").replace(/[ÍÌÎ]/g, "\\'cd")
      .replace(/[óòôõ]/g, "\\'f3").replace(/[ÓÒÔÕ]/g, "\\'d3")
      .replace(/[úùû]/g, "\\'fa").replace(/[ÚÙÛ]/g, "\\'da")
      .replace(/[ç]/g, "\\'e7").replace(/[Ç]/g, "\\'c7")
      .replace(/\n/g, "\\par ");
  };

  const exportarWord = async () => {
    try {
      const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 ${fonteDocumento};}}{\\colortbl;\\red31\\green59\\blue115;}\\viewkind4\\uc1\\pard\\cf1\\b\\f0\\fs40 REGISTRO DE OBITO E EXEQUIA\\cf0\\b0\\fs24\\par\\par\\b Comunidade:\\b0  ${formatRTF(comunidadeEfetiva)}\\par\\b Falecido:\\b0  ${formatRTF(dados.nome)}\\par\\b Nascimento:\\b0  ${dados.dataNasc}\\par\\b Falecimento:\\b0  ${dados.dataFalecimento}\\par\\b Exequias:\\b0  ${dados.dataExequias}\\par\\b Local:\\b0  ${formatRTF(dados.local)}\\par\\b Ministro:\\b0  ${formatRTF(dados.ministro)}\\par\\b Cemiterio:\\b0  ${formatRTF(dados.cemiterio)}\\par\\par\\b Observacoes:\\b0\\par ${formatRTF(dados.obs)}}`;
      const path = await save({ defaultPath: `Obito_${dados.nome}.rtf` });
      if (path) await writeTextFile(path, rtf);
    } catch (err) { showToast("Erro ao exportar", "error"); }
  };

  const salvar = async () => {
    if (!dados.nome) { showToast("Informe o nome do falecido.", "error"); return; }
    try {
      if (editandoId !== null) {
        await SacramentalRepository.obitos.update(editandoId, {
          nome: dados.nome, dataNasc: dados.dataNasc, dataFalecimento: dados.dataFalecimento,
          dataExequias: dados.dataExequias, local: dados.local, ministro: dados.ministro,
          cemiterio: dados.cemiterio, obs: dados.obs, comunidade: comunidadeEfetiva,
          fiel_id: fielId,
        });
        showToast("Registro atualizado!", "success");
      } else {
        await SacramentalRepository.obitos.create({
          nome: dados.nome, dataNasc: dados.dataNasc, dataFalecimento: dados.dataFalecimento,
          dataExequias: dados.dataExequias, local: dados.local, ministro: dados.ministro,
          cemiterio: dados.cemiterio, obs: dados.obs, comunidade: comunidadeEfetiva,
          fiel_id: fielId,
        });
        showToast("Registro salvo no sistema!", "success");
      }
      await carregarRegistros();
    } catch (err) { showToast("Erro ao salvar no banco", "error"); console.error(err); }
  };

  const excluir = async (id: number, nome: string) => {
    const ok = await ask(`Deseja excluir o registro de "${nome}"? Esta ação não pode ser desfeita.`, { title: "Confirmar exclusão", kind: "warning" });
    if (!ok) return;
    try {
      await SacramentalRepository.obitos.softDelete(id);
      if (editandoId === id) { setDados({ ...DADOS_VAZIO }); setEditandoId(null); }
      await carregarRegistros();
    } catch (e) { showToast("Erro ao excluir.", "error"); }
  };

  const novoRegistro = () => { setDados({ ...DADOS_VAZIO }); setEditandoId(null); };

  const filtrados = registros.filter(r => {
    const nomeBusca = !busca || r.nome?.toLowerCase().includes(busca.toLowerCase());
    const comunidadeBusca = !buscaComunidade || r.comunidade?.toLowerCase().includes(buscaComunidade.toLowerCase());
    return nomeBusca && comunidadeBusca;
  });

  const thS: CSSProperties = { padding: "10px 16px", fontSize: "11px", fontWeight: 700, color: "#475467", textTransform: "uppercase", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" };
  const tdS: CSSProperties = { padding: "12px 16px", fontSize: "13px", color: "#1e293b", borderBottom: "1px solid rgba(203,213,225,0.4)" };

  return (
    <div style={styles.container}>
      <style>{`
        @media screen { .area-impressao { display: none; } }
      `}</style>

      <div className="no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h2 style={{ color: "#1f3b73", margin: 0 }}>Óbitos e Exéquias</h2>
            {editandoId && <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 600 }}>✏️ Editando registro #{editandoId}</span>}
          </div>
          <FontSelector fonteAtual={fonteDocumento} onChange={setFonteDocumento} />
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <input style={{ ...styles.searchBar, flex: 1 }} placeholder="🔍 Buscar falecido por nome..." value={busca} onChange={e => setBusca(e.target.value)} />
          <input style={{ ...styles.searchBar, flex: 1 }} placeholder="🏘️ Filtrar por comunidade..." value={buscaComunidade} onChange={e => setBuscaComunidade(e.target.value)} />
          <button onClick={novoRegistro} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", padding: "14px 20px", borderRadius: "16px", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Novo</button>
        </div>

        {/* Lista de registros */}
        <div style={{ background: "rgba(255,255,255,0.88)", borderRadius: "20px", border: "1px solid rgba(31,59,115,0.12)", marginBottom: "24px", boxShadow: "0 6px 24px rgba(15,23,42,0.07)", overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", background: "linear-gradient(135deg, #1f3b73 0%, #2563eb 100%)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "15px" }}>📋 Registros de Óbitos ({filtrados.length})</span>
            <button onClick={() => setListaAberta(a => !a)} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>{listaAberta ? "▲ Ocultar" : "▼ Mostrar"}</button>
          </div>
          {listaAberta && (filtrados.length === 0 ? (
            <div style={{ padding: "20px 24px", color: "#94a3b8", fontSize: "14px" }}>{busca || buscaComunidade ? "Nenhum registro encontrado." : "Nenhum registro cadastrado ainda."}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={thS}>Nome</th>
                  <th style={thS}>Falecimento</th>
                  <th style={thS}>Comunidade</th>
                  <th style={thS}>Local</th>
                  <th style={{ ...thS, textAlign: "center" }}>Ações</th>
                </tr></thead>
                <tbody>
                  {filtrados.map((r) => (
                    <tr key={r.id} onMouseEnter={e => (e.currentTarget.style.background = "#f0f7ff")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                      <td style={tdS}>{r.nome || "—"}</td>
                      <td style={tdS}>{r.dataFalecimento || "—"}</td>
                      <td style={tdS}>{r.comunidade || "—"}</td>
                      <td style={tdS}>{r.local || "—"}</td>
                      <td style={{ ...tdS, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            onClick={() => {
                              setEditandoId(r.id);
                              const tipoComunidade = comunidades.includes(r.comunidade || "") ? "existente" : "manual";
                              setDados({
                                nome: r.nome || "", dataNasc: r.dataNasc || "",
                                dataFalecimento: r.dataFalecimento || "", dataExequias: r.dataExequias || "",
                                local: r.local || "", ministro: r.ministro || "",
                                cemiterio: r.cemiterio || "", obs: r.obs || "",
                                comunidade: tipoComunidade === "existente" ? (r.comunidade || "") : "",
                                comunidadeManual: tipoComunidade === "manual" ? (r.comunidade || "") : "",
                                tipoComunidade,
                                documentoRetirado: (r as any).documentoRetirado || "Não",
                              });
                            }}
                            style={{ background: "linear-gradient(135deg, #1f3b73, #2563eb)", color: "white", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => excluir(r.id, r.nome || "sem nome")}
                            style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "white", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                          >
                            🗑️ Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <BuscarFielPastoral onSelecionar={f => { setDados(d => ({ ...d, nome: f.nome })); setFielId(f.id); }} label="Buscar Falecido no Módulo Pastoral" />

        <div style={styles.formCard}>
          <h3 style={styles.sectionTitle}>Registro de Falecimento e Exéquias</h3>

          {/* Seleção de comunidade */}
          <div style={{ ...styles.fieldGroup, marginBottom: '20px' }}>
            <label style={styles.label}>Tipo de Comunidade</label>
            <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
                <input type="radio" name="tipoComunidadeObito" value="existente" checked={dados.tipoComunidade === "existente"} onChange={() => atualizar("tipoComunidade", "existente")} />
                Comunidade da Área (cadastrada)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
                <input type="radio" name="tipoComunidadeObito" value="manual" checked={dados.tipoComunidade === "manual"} onChange={() => atualizar("tipoComunidade", "manual")} />
                Fora da Área (digitar)
              </label>
            </div>
            {dados.tipoComunidade === "existente" ? (
              <select style={styles.select} value={dados.comunidade} onChange={e => atualizar('comunidade', e.target.value)}>
                <option value="">— Selecione a comunidade —</option>
                {comunidades.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input style={styles.input} value={dados.comunidadeManual} onChange={e => atualizar('comunidadeManual', e.target.value)} placeholder="Digite o nome da comunidade onde celebrou" />
            )}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Nome do Falecido(a)</label>
            <input style={styles.input} value={dados.nome} onChange={e => atualizar('nome', e.target.value)} />
          </div>
          <div style={{ ...styles.row, marginTop: "20px" }}>
            <div style={styles.fieldGroup}><label style={styles.label}>Data de Nascimento</label><input style={styles.input} type="date" value={dados.dataNasc} onChange={e => atualizar('dataNasc', e.target.value)} /></div>
            <div style={styles.fieldGroup}><label style={styles.label}>Data do Falecimento</label><input style={styles.input} type="date" value={dados.dataFalecimento} onChange={e => atualizar('dataFalecimento', e.target.value)} /></div>
            <div style={styles.fieldGroup}><label style={styles.label}>Data das Exéquias</label><input style={styles.input} type="date" value={dados.dataExequias} onChange={e => atualizar('dataExequias', e.target.value)} /></div>
          </div>
          <div style={styles.row}>
            <div style={styles.fieldGroup}><label style={styles.label}>Local das Exéquias</label><input style={styles.input} value={dados.local} onChange={e => atualizar('local', e.target.value)} /></div>
            <div style={styles.fieldGroup}><label style={styles.label}>Ministro Celebrante</label><input style={styles.input} value={dados.ministro} onChange={e => atualizar('ministro', e.target.value)} /></div>
            <div style={styles.fieldGroup}><label style={styles.label}>Cemitério / Jazigo</label><input style={styles.input} value={dados.cemiterio} onChange={e => atualizar('cemiterio', e.target.value)} /></div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Observações / Causa (Opcional)</label>
            <textarea style={styles.textarea} value={dados.obs} onChange={e => atualizar('obs', e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Documento Retirado?</label>
            <select style={styles.input} value={dados.documentoRetirado || "Não"} onChange={e => atualizar('documentoRetirado', e.target.value)}><option value="Não">Não</option><option value="Sim">Sim</option></select>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button style={styles.btnRegistrar} onClick={salvar}>{editandoId ? "💾 Atualizar" : "💾 Registrar"}</button>

            <button onClick={() => gerarPDFObito(paroquiaDados, dados as Record<string, string>, comunidadeEfetiva, fonteDocumento)} style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(31,59,115,0.18)", color: "#1f3b73", borderRadius: "16px", cursor: "pointer", padding: "14px 24px", fontWeight: 700, backdropFilter: "blur(12px)", boxShadow: "0 8px 20px rgba(15,23,42,0.05)", transition: "all .2s ease" }}>🖨️ Imprimir</button>
            {editandoId && (
              <button onClick={novoRegistro} style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #d0d5dd", color: "#475467", borderRadius: "16px", cursor: "pointer", padding: "14px 24px", fontWeight: 700 }}>✕ Cancelar Edição</button>
            )}
          </div>
        </div>
      </div>

      <div id="area-obitos-print" className="area-impressao" style={{ fontFamily: fonteDocumento }}>
        <DocumentHeader paroquia={paroquiaDados} />
        <div style={{ width: '98%', margin: '20px auto' }}>
          <h1 style={{ fontSize: '20pt', textAlign: 'center', textDecoration: 'underline', textTransform: 'uppercase' }}>Registro de Óbito e Exéquias</h1>
          <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', padding: '10px', border: '1px solid #000', width: '35%' }}>Comunidade / Local:</td><td style={{ padding: '10px', border: '1px solid #000' }}>{comunidadeEfetiva}</td></tr>
              <tr><td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', padding: '10px', border: '1px solid #000' }}>Nome do Falecido:</td><td style={{ padding: '10px', border: '1px solid #000' }}>{dados.nome}</td></tr>
              <tr><td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', padding: '10px', border: '1px solid #000' }}>Data de Nascimento:</td><td style={{ padding: '10px', border: '1px solid #000' }}>{dados.dataNasc}</td></tr>
              <tr><td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', padding: '10px', border: '1px solid #000' }}>Data de Falecimento:</td><td style={{ padding: '10px', border: '1px solid #000' }}>{dados.dataFalecimento}</td></tr>
              <tr><td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', padding: '10px', border: '1px solid #000' }}>Data das Exéquias:</td><td style={{ padding: '10px', border: '1px solid #000' }}>{dados.dataExequias}</td></tr>
              <tr><td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', padding: '10px', border: '1px solid #000' }}>Local das Exéquias:</td><td style={{ padding: '10px', border: '1px solid #000' }}>{dados.local}</td></tr>
              <tr><td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', padding: '10px', border: '1px solid #000' }}>Ministro Celebrante:</td><td style={{ padding: '10px', border: '1px solid #000' }}>{dados.ministro}</td></tr>
              <tr><td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', padding: '10px', border: '1px solid #000' }}>Cemitério / Jazigo:</td><td style={{ padding: '10px', border: '1px solid #000' }}>{dados.cemiterio}</td></tr>
            </tbody>
          </table>
          <h3 style={{ borderBottom: '2px solid #1f3b73', marginTop: '30px', color: '#1f3b73' }}>Observações Adicionais</h3>
          <div style={{ textAlign: 'justify', minHeight: '100px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '11pt', paddingBottom: '20px' }}>{dados.obs}</div>
          <div style={{ marginTop: '60px', textAlign: 'center' }}>
            <p>_________________________________________________</p>
            <p style={{ fontWeight: 'bold' }}>Secretaria Paroquial / Ministro Celebrante</p>
          </div>
        </div>
      </div>
    </div>
  );
}
