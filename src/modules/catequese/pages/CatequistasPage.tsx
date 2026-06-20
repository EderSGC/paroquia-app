import { printWithTitle } from "@core/utils/pdfGenerator";
import { useState, CSSProperties, useMemo } from "react";
import { useCatequese } from "../hooks/useCatequese";
import { FielSelector } from "@core/components/FielSelector";
import type { Paroquia } from "../../../core/types/app.types";

interface Catequista {
  id: number;
  nome_fiel?: string | null;
  formacao?: string | null;
  disponibilidade?: string | null;
  tel_fiel?: string | null;
  email_fiel?: string | null;
  endereco_fiel?: string | null;
}

export function CatequistasPage({ paroquia }: { paroquia: Paroquia }) {
  void paroquia;
  const { fieis, catequistas, salvarCatequista, excluirCatequista } = useCatequese();

  const [busca, setBusca] = useState("");
  const [draft, setDraft] = useState({ fiel_id: "", formacao: "", disponibilidade: "" });

  // Busca o objeto fiel completo para exibir os dados automaticamente
  const fielSelecionado = useMemo(() => 
    fieis?.find(f => f.id.toString() === draft.fiel_id.toString()),
  [draft.fiel_id, fieis]);

  const filtrados = (catequistas || []).filter((c: Catequista) => 
    c.nome_fiel?.toLowerCase().includes(busca.toLowerCase()) ||
    c.formacao?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSalvar = async () => {
    if (!draft.fiel_id) return alert("Selecione um Fiel para ser catequista!");
    if (typeof salvarCatequista === 'function') {
      await salvarCatequista(draft);
      setDraft({ fiel_id: "", formacao: "", disponibilidade: "" });
      alert("Catequista registrado com sucesso!");
    }
  };

  return (
    <div style={{ display: "flex", gap: "20px", flexDirection: 'column' }}>
      <div className="no-print" style={toolbarS}>
        <input style={searchS} placeholder="🔍 Buscar catequista..." value={busca} onChange={e => setBusca(e.target.value)} />
        <button style={btnAcaoS} onClick={() => printWithTitle("Lista de Catequistas")}>🖨️ Imprimir Lista</button>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div className="no-print" style={cardS}>
          <h3 style={{ color: "#1f3b73", marginTop: 0, fontSize: '16px' }}>Novo Catequista</h3>
          <FielSelector fieis={fieis || []} value={draft.fiel_id} onChange={v => setDraft({ ...draft, fiel_id: v })} placeholder="Selecione o fiel..." style={{ marginBottom: 16 }} />

          {fielSelecionado && (
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#475569' }}>
              <div><strong>Tel:</strong> {fielSelecionado.telefone || 'Não informado'}</div>
              <div><strong>Email:</strong> {fielSelecionado.email || 'Não informado'}</div>
              <div><strong>End:</strong> {fielSelecionado.endereco || 'Não informado'}</div>
            </div>
          )}

          <label style={labS}>FORMAÇÃO</label>
          <textarea style={{...inS, height: '60px'}} value={draft.formacao} onChange={e => setDraft({...draft, formacao: e.target.value})} />
          <label style={labS}>DISPONIBILIDADE</label>
          <input style={inS} value={draft.disponibilidade} onChange={e => setDraft({...draft, disponibilidade: e.target.value})} />
          <button onClick={handleSalvar} style={btnS}>Registrar</button>
        </div>

        <div className="print-area" style={{ flex: 1, background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th style={thS}>Dados do Catequista</th>
                <th style={thS}>Contato</th>
                <th className="no-print" style={thS}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={tdS}><strong>{c.nome_fiel}</strong><br/><small>{c.formacao}</small></td>
                  <td style={tdS}>{c.tel_fiel}<br/><small>{c.email_fiel}</small><br/><small style={{ color: '#1f3b73' }}>{c.disponibilidade}</small></td>
                  <td className="no-print" style={tdS}>
                    <button style={iconBtnS} onClick={() => excluirCatequista(c.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Estilos mantidos conforme padrão solicitado
const toolbarS: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' };
const searchS: CSSProperties = { width: "300px", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" };
const btnAcaoS: CSSProperties = { padding: '8px 15px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#1f3b73' };
const cardS: CSSProperties = { width: "350px", background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", height: "fit-content" };
const inS: CSSProperties = { width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "10px", boxSizing: "border-box", fontSize: "13px" };
const labS: CSSProperties = { fontSize: "11px", fontWeight: "bold", color: "#64748b", display: "block", marginBottom: "4px" };
const btnS: CSSProperties = { width: "100%", padding: "12px", background: "#1f3b73", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const thS: CSSProperties = { padding: "12px", textAlign: "left", fontSize: "11px", color: "#64748b", textTransform: "uppercase" };
const tdS: CSSProperties = { padding: "12px", fontSize: "13px" };
const iconBtnS: CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' };