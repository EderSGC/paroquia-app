import { printWithTitle } from "@core/utils/pdfGenerator";
import { useState, CSSProperties } from "react";
import { useGrupos } from "../hooks/useGrupos";
import { DocumentHeader } from "@core/components/DocumentHeader";
import type { Paroquia } from '../../../core/types/app.types';

interface GruposPageProps { paroquia?: Paroquia | null; fonte?: string; comunidadeFiltro?: string | null; }

export function GruposPage({ paroquia, fonte, comunidadeFiltro }: GruposPageProps) {
  void fonte;
  const {
    grupos, grupoDraft, setGrupoDraft, salvarGrupo, excluirGrupo, editarGrupo, limparDraft,
    membrosGrupo, carregarMembrosGrupo, vincularMembro, removerMembro,
    contagemMembros, pastorais, fieis,
  } = useGrupos();
  const [busca, setBusca] = useState("");
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | null>(null);
  const [fielIdAdd, setFielIdAdd] = useState("");
  const [cargoAdd, setCargoAdd] = useState("Membro");

  const filtrados = grupos
    .filter(g => !comunidadeFiltro || (g as Record<string, string | number | null>).comunidade === comunidadeFiltro)
    .filter(g => g.nome.toLowerCase().includes(busca.toLowerCase()));

  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 6) return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
    if (v.length > 2) return `(${v.substring(0, 2)}) ${v.substring(2)}`;
    return v;
  };

  function selecionarLider(cargo: string, fielId: string) {
    const fiel = fieis.find(f => f.id === Number(fielId));
    if (!fiel) return;
    setGrupoDraft(prev => ({
      ...prev,
      [`${cargo}_id`]: fiel.id,
      [`${cargo}_nome`]: fiel.nome,
      [`${cargo}_tel`]: fiel.telefone ?? "",
    }));
  }

  function abrirMembros(grupoId: number) {
    setGrupoSelecionado(grupoId);
    carregarMembrosGrupo(grupoId);
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @page { size: A4; margin: 1.5cm; }
        @media screen { #area-impressao-grupos { display: none !important; } }
        @media print {
          body * { visibility: hidden; background: transparent !important; }
          #area-impressao-grupos, #area-impressao-grupos * { visibility: visible; }
          #area-impressao-grupos { position: absolute; left: 0; top: 0; width: 98%; display: block !important; padding: 0; margin: 0; }
          #area-impressao-grupos h2 { text-align: center; font-size: 18pt !important; color: #1f3b73; margin: 25px 0 15px; }
          #area-impressao-grupos table { width: 100%; border-collapse: collapse; font-size: 11pt !important; }
          #area-impressao-grupos th, #area-impressao-grupos td { border: 1px solid #000; padding: 8px; text-align: left; }
          #area-impressao-grupos th { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
        }
      `}</style>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* ── Formulário ──────────────────────────────────────── */}
        <div style={formCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: "#1f3b73", margin: 0 }}>Gestão de Grupos</h3>
            {grupoDraft.id && <button onClick={limparDraft} style={{ fontSize: '10px', cursor: 'pointer' }}>Novo</button>}
          </div>

          <label style={labelStyle}>NOME DO GRUPO/MOVIMENTO</label>
          <input style={inputStyle} value={grupoDraft.nome} onChange={e => setGrupoDraft({...grupoDraft, nome: e.target.value})} />

          <label style={labelStyle}>PASTORAL VINCULADA</label>
          <select style={inputStyle} value={grupoDraft.pastoral_id ?? ""} onChange={e => setGrupoDraft({...grupoDraft, pastoral_id: e.target.value ? Number(e.target.value) : null})}>
            <option value="">Selecione a pastoral...</option>
            {pastorais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>

          <label style={labelStyle}>CATEGORIA</label>
          <input style={inputStyle} value={grupoDraft.categoria} onChange={e => setGrupoDraft({...grupoDraft, categoria: e.target.value})} placeholder="Ex: Oração, Serviço, Formação" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {(['coordenador', 'vice', 'secretario', 'tesoureiro'] as const).map(cargo => (
              <div key={cargo} style={cargoBox}>
                <span style={labelCargo}>{cargo.toUpperCase()}</span>
                <select style={inputStyle} value={(grupoDraft as Record<string, string | number | null>)[`${cargo}_id`] ?? ""} onChange={e => selecionarLider(cargo, e.target.value)}>
                  <option value="">Selecione um fiel...</option>
                  {fieis.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
                <input placeholder="Tel" style={inputStyle} value={(grupoDraft as Record<string, string | number | null>)[`${cargo}_tel`] || ""} onChange={e => setGrupoDraft({...grupoDraft, [`${cargo}_tel`]: maskPhone(e.target.value)})} readOnly />
              </div>
            ))}
          </div>

          <button onClick={salvarGrupo} style={btnPrimary}>Salvar no Banco</button>
          <button onClick={() => printWithTitle("Lista de Grupos")} style={btnSecondary}>Imprimir Lista Geral</button>
        </div>

        {/* ── Lista + Membros ─────────────────────────────────── */}
        <div style={{ flex: 1 }}>
          <input placeholder="Buscar grupo..." style={searchStyle} value={busca} onChange={e => setBusca(e.target.value)} />
          <div style={tableWrapper}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={thStyle}>Grupo</th>
                  <th style={thStyle}>Pastoral</th>
                  <th style={thStyle}>Coordenador</th>
                  <th style={thStyle}>Membros</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(g => (
                  <tr key={g.id} style={{ borderBottom: "1px solid #f1f5f9", background: grupoSelecionado === g.id ? "#eff6ff" : undefined }}>
                    <td style={tdStyle}><strong>{g.nome}</strong></td>
                    <td style={tdStyle}>{pastorais.find(p => p.id === g.pastoral_id)?.nome ?? "—"}</td>
                    <td style={tdStyle}>{g.coordenador_nome || '—'}</td>
                    <td style={tdStyle}>{contagemMembros[g.id!] ?? 0}</td>
                    <td style={tdStyle}>
                      <button onClick={() => editarGrupo(g)} style={actionBtn} title="Editar">✏️</button>
                      <button onClick={() => g.id && abrirMembros(g.id)} style={actionBtn} title="Membros">👥</button>
                      <button onClick={() => g.id && excluirGrupo(g.id)} style={{...actionBtn, color: 'red'}} title="Excluir">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Painel de Membros ─────────────────────────── */}
          {grupoSelecionado && (
            <div style={{ marginTop: 16, background: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ margin: 0, color: "#1f3b73" }}>
                  Membros — {grupos.find(g => g.id === grupoSelecionado)?.nome} ({membrosGrupo.length})
                </h4>
                <button onClick={() => setGrupoSelecionado(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <select style={{ ...inputStyle, flex: 1, marginBottom: 0 }} value={fielIdAdd} onChange={e => setFielIdAdd(e.target.value)}>
                  <option value="">Selecione um fiel...</option>
                  {fieis.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
                <select style={{ ...inputStyle, width: 140, marginBottom: 0 }} value={cargoAdd} onChange={e => setCargoAdd(e.target.value)}>
                  {["Membro", "Coordenador", "Vice", "Secretário", "Tesoureiro", "Conselheiro"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={() => { if (fielIdAdd) { vincularMembro(grupoSelecionado, Number(fielIdAdd), cargoAdd); setFielIdAdd(""); } }} style={{ ...btnPrimary, width: "auto", padding: "6px 16px", fontSize: 12 }}>Adicionar</button>
              </div>

              {membrosGrupo.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>Nenhum membro vinculado.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Telefone</th>
                    <th style={thStyle}>Cargo</th>
                    <th style={thStyle}>Ação</th>
                  </tr></thead>
                  <tbody>
                    {membrosGrupo.map(m => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={tdStyle}>{m.nome_fiel}</td>
                        <td style={tdStyle}>{m.telefone_fiel || "—"}</td>
                        <td style={tdStyle}>{m.cargo || "Membro"}</td>
                        <td style={tdStyle}>
                          <button onClick={() => removerMembro(m.id, grupoSelecionado)} style={{...actionBtn, color: 'red'}} title="Remover">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Área de impressão ──────────────────────────── */}
      <div id="area-impressao-grupos">
        {paroquia && <DocumentHeader paroquia={paroquia} />}
        <h2>RELATÓRIO DE GRUPOS E MOVIMENTOS</h2>
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Pastoral</th>
              <th>Coordenador</th>
              <th>Vice</th>
              <th>Tesoureiro</th>
              <th>Secretário</th>
              <th>Membros</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(g => (
              <tr key={g.id}>
                <td><strong>{g.nome}</strong></td>
                <td>{pastorais.find(p => p.id === g.pastoral_id)?.nome ?? "—"}</td>
                <td>{g.coordenador_nome || '—'}</td>
                <td>{g.vice_nome || '—'}</td>
                <td>{g.tesoureiro_nome || '—'}</td>
                <td>{g.secretario_nome || '—'}</td>
                <td>{contagemMembros[g.id!] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const formCard: CSSProperties = { width: "420px", padding: "20px", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", height: "fit-content" };
const cargoBox: CSSProperties = { background: "#f8fafc", padding: "8px", borderRadius: "8px", border: "1px solid #eff2f5", marginBottom: "4px" };
const labelCargo: CSSProperties = { fontSize: "9px", fontWeight: "bold", color: "#1f3b73", display: "block", marginBottom: "3px" };
const inputStyle: CSSProperties = { width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #cbd5e1", marginBottom: "4px", fontSize: '12px', boxSizing: 'border-box' };
const labelStyle: CSSProperties = { fontSize: "11px", fontWeight: "bold", color: "#64748b", marginBottom: "4px", display: "block" };
const btnPrimary: CSSProperties = { width: "100%", padding: "12px", background: "#1f3b73", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const btnSecondary: CSSProperties = { width: "100%", padding: "10px", background: "white", color: "#1f3b73", border: "1px solid #1f3b73", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" };
const searchStyle: CSSProperties = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "15px" };
const tableWrapper: CSSProperties = { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" };
const thStyle: CSSProperties = { padding: "12px", textAlign: "left", fontSize: "11px", color: "#64748b" };
const tdStyle: CSSProperties = { padding: "12px", fontSize: "13px" };
const actionBtn: CSSProperties = { background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginRight: "8px" };
