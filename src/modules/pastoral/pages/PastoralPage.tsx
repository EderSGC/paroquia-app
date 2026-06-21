import { printWithTitle } from "@core/utils/pdfGenerator";
import { useState, CSSProperties } from "react";
import { usePastorais } from "../hooks/usePastorais";
import { DocumentHeader } from "@core/components/DocumentHeader";
import type { Paroquia } from '../../../core/types/app.types';

interface PastoralPageProps { paroquia?: Paroquia | null; fonte?: string; comunidadeFiltro?: string | null; }

export function PastoralPage({ paroquia, fonte, comunidadeFiltro }: PastoralPageProps) {
  void paroquia; void fonte;
  const { pastorais, pastoralDraft, setPastoralDraft, salvarPastoral, excluirPastoral, fieis, selecionarFiel } = usePastorais();
  const [busca, setBusca] = useState("");

  const pastoraisFiltradas = pastorais
    .filter(p => !comunidadeFiltro || p.comunidade === comunidadeFiltro)
    .filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 6) return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
    if (v.length > 2) return `(${v.substring(0, 2)}) ${v.substring(2)}`;
    return v;
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @page { size: A4; margin: 1.5cm; }
        @media screen { #area-impressao-pastoral { display: none !important; } }
        @media print {
          body * { visibility: hidden; background: transparent !important; }
          #area-impressao-pastoral, #area-impressao-pastoral * { visibility: visible; }
          #area-impressao-pastoral { position: absolute; left: 0; top: 0; width: 98%; display: block !important; padding: 0; margin: 0; }
          #area-impressao-pastoral .cabecalho-impressao-oficial { border-bottom: 1.5px solid #1f3b73 !important; padding-bottom: 15px !important; margin-bottom: 25px !important; }
          #area-impressao-pastoral h2 { text-align: center; font-size: 18pt !important; color: #1f3b73; margin-top: 25px !important; margin-bottom: 15px !important; }
          #area-impressao-pastoral table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11pt !important; }
          #area-impressao-pastoral th, #area-impressao-pastoral td { border: 1px solid #000; padding: 8px; text-align: left; }
          #area-impressao-pastoral th { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={formS}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: "#1f3b73", margin: 0 }}>Gestão de Pastoral</h3>
            {pastoralDraft.id && <button onClick={() => setPastoralDraft({ nome: "", descricao: "", carisma: "", comunidade: "", coordenador_id: null, coordenador_nome: "", coordenador_tel: "", vice_id: null, vice_nome: "", vice_tel: "", secretario_id: null, secretario_nome: "", secretario_tel: "", tesoureiro_id: null, tesoureiro_nome: "", tesoureiro_tel: "" })} style={{ fontSize: '10px', cursor: 'pointer' }}>Novo</button>}
          </div>

          <label style={labS}>NOME DA PASTORAL</label>
          <input style={inS} value={pastoralDraft.nome || ""} onChange={e => setPastoralDraft({...pastoralDraft, nome: e.target.value})} placeholder="Ex: Pastoral do Dízimo"/>

          <label style={labS}>CARISMA</label>
          <textarea style={{...inS, height: "60px", resize: "none"}} value={pastoralDraft.carisma || ""} onChange={e => setPastoralDraft({...pastoralDraft, carisma: e.target.value})} placeholder="Descreva o carisma desta pastoral..." />

          {(['coordenador', 'vice', 'secretario', 'tesoureiro'] as const).map(cargo => (
            <div key={cargo} style={cargoBox}>
              <span style={labelCargo}>{cargo.toUpperCase()}</span>
              <select style={inS_compact} value={(pastoralDraft as any)[`${cargo}_id`] ?? ""} onChange={e => selecionarFiel(cargo, Number(e.target.value))}>
                <option value="">Selecione um fiel...</option>
                {fieis.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              <input placeholder="Tel" style={inS_compact} value={(pastoralDraft as any)[`${cargo}_tel`] || ""} readOnly />
            </div>
          ))}

          <button onClick={salvarPastoral} style={{...btnS, marginTop: "10px"}}>Salvar Pastoral</button>
          <button onClick={() => printWithTitle("Relatório de Pastorais")} style={{...btnS, background: "white", color: "#1f3b73", border: "1px solid #1f3b73", marginTop: "10px"}}>🖨️ Imprimir Relatório</button>
        </div>

        <div style={{ flex: 1 }}>
          <input placeholder="🔍 Filtrar pastoral por nome..." style={inS} value={busca} onChange={e => setBusca(e.target.value)} />
          <div style={listCard}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr><th style={thS}>Pastoral</th><th style={thS}>Coordenação</th><th style={thS}>Ações</th></tr>
              </thead>
              <tbody>
                {pastoraisFiltradas.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={tdS}><strong>{p.nome}</strong></td>
                    <td style={tdS}>{p.coordenador_nome || '---'}</td>
                    <td style={tdS}>
                      <button onClick={() => setPastoralDraft(p as any)} style={actionBtn}>✏️</button>
                      {p.id !== undefined && <button onClick={() => excluirPastoral(p.id!)} style={{...actionBtn, color: 'red'}}>🗑️</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO - COM TELEFONES */}
      <div id="area-impressao-pastoral">
        {paroquia && <DocumentHeader paroquia={paroquia} />}
        <h2>RELATÓRIO DE PASTORAIS ATIVAS</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #000", padding: "8px" }}>Pastoral</th>
              <th style={{ border: "1px solid #000", padding: "8px" }}>Carisma</th>
              <th style={{ border: "1px solid #000", padding: "8px" }}>Coordenação</th>
              <th style={{ border: "1px solid #000", padding: "8px" }}>Tesouraria</th>
              <th style={{ border: "1px solid #000", padding: "8px" }}>Secretaria</th>
            </tr>
          </thead>
          <tbody>
            {pastoraisFiltradas.map((p) => (
              <tr key={p.id}>
                <td style={{ border: "1px solid #000", padding: "8px", fontWeight: "bold" }}>{p.nome}</td>
                <td style={{ border: "1px solid #000", padding: "8px" }}>{p.carisma || '---'}</td>
                <td style={{ border: "1px solid #000", padding: "8px" }}>
                  {p.coordenador_nome || '---'}<br/>
                  <small style={{ color: '#555' }}>{p.coordenador_tel}</small>
                </td>
                <td style={{ border: "1px solid #000", padding: "8px" }}>
                  {p.tesoureiro_nome || '---'}<br/>
                  <small style={{ color: '#555' }}>{p.tesoureiro_tel}</small>
                </td>
                <td style={{ border: "1px solid #000", padding: "8px" }}>
                  {p.secretario_nome || '---'}<br/>
                  <small style={{ color: '#555' }}>{p.secretario_tel}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const formS: CSSProperties = { width: "350px", background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", height: "fit-content" };
const labS: CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' };
const inS: CSSProperties = { width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "10px", boxSizing: "border-box", fontSize: "13px" };
const inS_compact: CSSProperties = { width: "100%", padding: "7px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "4px", boxSizing: "border-box", fontSize: "12px" };
const btnS: CSSProperties = { width: "100%", padding: "12px", background: "#1f3b73", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const listCard: CSSProperties = { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" };
const thS: CSSProperties = { padding: "12px", textAlign: "left", fontSize: "11px", color: "#64748b" };
const tdS: CSSProperties = { padding: "12px", fontSize: "13px" };
const cargoBox: CSSProperties = { background: "#f8fafc", padding: "8px", borderRadius: "8px", marginBottom: "8px", border: "1px solid #eff2f5" };
const labelCargo: CSSProperties = { fontSize: "9px", fontWeight: "bold", color: "#1f3b73", display: "block", marginBottom: "4px" };
const actionBtn: CSSProperties = { background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginRight: "8px" };