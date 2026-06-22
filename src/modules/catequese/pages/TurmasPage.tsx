import { printWithTitle } from "@core/utils/pdfGenerator";
import { useState, useRef, CSSProperties } from "react";
import { useCatequese } from "../hooks/useCatequese";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { logger } from "@core/utils/logger";
import type { EtapaCatequese } from "../types";
import type { Paroquia } from "../../../core/types/app.types";
import type { CatequeseTurma } from "../../../core/types/entities";

interface TurmasPageProps {
  paroquia: Paroquia;
  comunidadeNome?: string | null;
}

export function TurmasPage({ paroquia, comunidadeNome }: TurmasPageProps) {

  const { turmas, salvarTurma, excluirTurma, comunidades, catequistas, fichas, matriculas, salvarMatricula, excluirMatricula } = useCatequese();

  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [turmaSelecionada, setTurmaSelecionada] = useState<CatequeseTurma | null>(null);
  const [novoCatequizandoId, setNovoCatequizandoId] = useState("");
  const [fonteDocumento, setFonteDocumento] = useState("Arial");
  const printRef = useRef<HTMLElement | null>(null);
  const filtradoPorComunidade = comunidadeNome != null;

  const [draft, setDraft] = useState({
    nome: "", etapa: "Primeira Eucaristia" as EtapaCatequese, ano: 2026, comunidade: comunidadeNome ?? "", horario: "", catequista_id: ""
  });

  const turmasFiltradas = (turmas || [])
    .filter(t => !filtradoPorComunidade || t.comunidade === comunidadeNome)
    .filter(t =>
      t.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      t.comunidade?.toLowerCase().includes(busca.toLowerCase()) ||
      t.nome_catequista?.toLowerCase().includes(busca.toLowerCase())
    );

  const alunosDaTurma = turmaSelecionada ? (matriculas || []).filter(m => m.turma_id === turmaSelecionada.id) : [];

  const handleSalvarTurma = async () => {
    if (!draft.nome) return alert("Por favor, informe o nome da turma.");
    try {
      const catSelecionado = catequistas?.find(c => c.id.toString() === draft.catequista_id.toString());
      const dadosParaSalvar = {
        ...draft,
        nome_catequista: catSelecionado ? catSelecionado.nome_fiel : "Não definido"
      };

      await salvarTurma(editando ? { ...dadosParaSalvar, id: editando } : dadosParaSalvar);
      setDraft({ nome: "", etapa: "Primeira Eucaristia", ano: 2026, comunidade: "", horario: "", catequista_id: "" });
      setEditando(null);
      alert("Turma salva com sucesso!");
    } catch (e) {
      alert("Erro ao salvar turma.");
    }
  };

  const prepararEdicao = (t: CatequeseTurma) => {
    setEditando(t.id);
    setDraft({ 
      nome: t.nome, etapa: t.etapa as EtapaCatequese, ano: t.ano, comunidade: t.comunidade ?? "",
      horario: t.horario ?? "", catequista_id: t.catequista_id ? t.catequista_id.toString() : ""
    });
  };

 const handleAdicionarAluno = async () => {
  logger.log("DEBUG: Iniciando clique...");
  
  if (!turmaSelecionada || !turmaSelecionada.id) {
    console.error("DEBUG: Turma não selecionada!");
    return alert("Selecione uma turma primeiro.");
  }
  
  if (!novoCatequizandoId) {
    console.error("DEBUG: Catequizando não selecionado!");
    return alert("Selecione um catequizando.");
  }

  const ficha = fichas?.find(f => f.id.toString() === novoCatequizandoId.toString());
  
  const payload = {
    turma_id: Number(turmaSelecionada.id),
    ficha_id: Number(ficha?.id),
    nome_catequizando: ficha?.nome
  };

  logger.log("DEBUG: Dados que vou enviar para salvar:", payload);

  try {
    await salvarMatricula(payload);
    logger.log("DEBUG: Função salvarMatricula executada.");
    alert("Aluno adicionado!");
  } catch (err) {
    console.error("DEBUG: Erro na execução:", err);
  }
};

  return (
    <div style={{ display: "flex", gap: "20px", flexDirection: 'column' }}>
      
      <style>{`
        @media print {
          body > *:not(#root) { display: none !important; }
          #root > *:not(div) { display: none !important; }
          .no-print { display: none !important; }
          .print-area { display: block !important; visibility: visible !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 98% !important; background: white !important; }
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>

      <div className="no-print toolbar-area" style={toolbarS}>
        <div style={{ position: 'relative', width: '300px' }}>
          <input style={searchS} placeholder="🔍 Filtrar turmas..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div className="form-container no-print" style={cardS}>
          <h3 style={{ color: "#1f3b73", marginTop: 0, fontSize: '16px' }}>{editando ? "📝 Editar Turma" : "✨ Nova Turma"}</h3>

          <label style={labS}>NOME DA TURMA</label>
          <input style={inS} value={draft.nome} onChange={e => setDraft({...draft, nome: e.target.value})} />

          <label style={labS}>ETAPA</label>
          <select style={inS} value={draft.etapa} onChange={e => setDraft({...draft, etapa: e.target.value as EtapaCatequese})}>
            {["Batismo", "Primeira Eucaristia", "Crisma", "Adultos", "Catecumenato", "Perseverança", "Formação Bíblica"].map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}><label style={labS}>ANO</label><input type="number" style={inS} value={draft.ano} onChange={e => setDraft({...draft, ano: Number(e.target.value)})} /></div>
            <div style={{ flex: 1 }}><label style={labS}>HORÁRIO</label><input style={inS} placeholder="Sáb 16h" value={draft.horario} onChange={e => setDraft({...draft, horario: e.target.value})} /></div>
          </div>

          <label style={labS}>COMUNIDADE / CAPELA</label>
          <select style={inS} value={draft.comunidade} onChange={e => setDraft({...draft, comunidade: e.target.value})}>
            <option value="">Selecione...</option>
            {comunidades?.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>

          <label style={labS}>CATEQUISTA RESPONSÁVEL</label>
          <select style={inS} value={draft.catequista_id} onChange={e => setDraft({...draft, catequista_id: e.target.value})}>
            <option value="">Nenhum catequista vinculado...</option>
            {catequistas?.map(c => <option key={c.id} value={c.id}>{c.nome_fiel}</option>)}
          </select>

          <button onClick={handleSalvarTurma} style={btnS}>{editando ? "Salvar Alterações" : "Criar Turma"}</button>

          <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #e2e8f0' }}/>

          <label style={{...labS, color: '#22c55e'}}>+ ADICIONAR ALUNO À TURMA SELECIONADA</label>
          <select style={inS} value={novoCatequizandoId} onChange={e => setNovoCatequizandoId(e.target.value)}>
            <option value="">Selecione uma ficha...</option>
            {fichas?.filter(f => !alunosDaTurma.some(a => a.ficha_id === f.id)).map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
          <button onClick={handleAdicionarAluno} style={{...btnS, background: '#22c55e'}}>Adicionar à Turma</button>

          {editando && <button onClick={() => {setEditando(null); setDraft({ nome: "", etapa: "Primeira Eucaristia", ano: 2026, comunidade: "", horario: "", catequista_id: "" })}} style={{...btnS, background: 'transparent', color: '#64748b', marginTop: 10}}>Cancelar Edição</button>}
        </div>

        <div className="no-print" style={{ flex: 1, background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: '20px' }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th style={thS}>Turma / Comunidade</th>
                <th style={thS}>Catequista</th>
                <th style={thS}>Etapa</th>
                <th style={thS}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {turmasFiltradas.map(t => {
                const totalAlunos = (matriculas || []).filter(m => m.turma_id === t.id).length;
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9", cursor: 'pointer', background: turmaSelecionada?.id === t.id ? '#f0fdf4' : 'transparent' }} onClick={() => setTurmaSelecionada(t)}>
                    <td style={tdS}><strong>{t.nome}</strong><br/><small>📍 {t.comunidade || "Sem Comunidade"}</small></td>
                    <td style={tdS}>👤 {t.nome_catequista || "Não definido"}</td>
                    <td style={tdS}><span>{t.etapa}</span><br/><small style={{color: '#1f3b73'}}>{t.horario} ({t.ano})</small><br/><span style={badgeS}>{totalAlunos} alunos</span></td>
                    <td style={tdS}>
                      <button title="Abrir Ficha" onClick={(e) => { e.stopPropagation(); setTurmaSelecionada(t); }} style={iconBtnS}>📄</button>
                      <button title="Editar" onClick={(e) => { e.stopPropagation(); prepararEdicao(t); }} style={iconBtnS}>✏️</button>
                      <button title="Excluir" style={{...iconBtnS, color: '#ef4444'}} onClick={(e) => { e.stopPropagation(); if(window.confirm(`Excluir a turma ${t.nome}?`)) excluirTurma(t.id!); }}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ÁREA INFERIOR: Apenas Visualização */}
      {turmaSelecionada && (
        <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28, marginTop: 10 }}>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ margin: 0, color: '#1f3b73' }}>Diário: {turmaSelecionada.nome}</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <FontSelector fonteAtual={fonteDocumento} onChange={setFonteDocumento} />
              <button onClick={() => printWithTitle("Lista de Turmas - Catequese")} style={{...btnAcaoS, padding: '10px 15px'}}>🖨️ Imprimir</button>
            </div>
          </div>

          <div className="print-area" style={{ display: "flex", justifyContent: "center", padding: 20, background: "#f8fafc", borderRadius: 16 }}>
            <article ref={printRef} style={{ width: 794, background: "white", padding: "48px 54px", boxSizing: "border-box", fontFamily: `${fonteDocumento}, sans-serif`, minHeight: 1123 }}>
              <DocumentHeader paroquia={paroquia} />
              <h1 style={{ textAlign: "center", fontSize: 24, marginTop: 28 }}>Diário de Classe Catequética</h1>
              
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 30 }}>
                <thead>
                  <tr>
                    <th style={{...thS, borderBottom: '2px solid #cbd5e1', padding: '10px 5px'}}>Nº</th>
                    <th style={{...thS, borderBottom: '2px solid #cbd5e1', padding: '10px 5px'}}>Nome do Catequizando</th>
                    <th style={{...thS, borderBottom: '2px solid #cbd5e1', padding: '10px 5px'}}>Presença</th>
                    <th className="no-print" style={{...thS, borderBottom: '2px solid #cbd5e1', padding: '10px 5px'}}>Remover</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosDaTurma.map((m, i) => (
                    <tr key={m.id}>
                      <td style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 5px' }}>{i + 1}</td>
                      <td style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 5px' }}>{m.nome_catequizando}</td>
                      <td style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 5px' }}></td>
                      <td className="no-print" style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 5px' }}>
                        <button onClick={() => excluirMatricula(m.id)} style={{...iconBtnS, color: '#ef4444'}}>❌</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </div>
        </section>
      )}
    </div>
  );
}

const toolbarS: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' };
const searchS: CSSProperties = { width: "100%", padding: "10px 15px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" };
const btnAcaoS: CSSProperties = { padding: '8px 16px', background: '#f8fafc', color: '#1f3b73', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' };
const iconBtnS: CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', marginRight: '5px' };
const cardS: CSSProperties = { width: "320px", background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", height: "fit-content", position: 'sticky', top: '20px' };
const inS: CSSProperties = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "12px", fontSize: "13px", boxSizing: 'border-box' };
const labS: CSSProperties = { fontSize: "10px", fontWeight: "bold", color: "#64748b", display: "block", marginBottom: "4px", textTransform: 'uppercase' };
const btnS: CSSProperties = { width: "100%", padding: "14px", background: "#1f3b73", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const thS: CSSProperties = { padding: "12px", textAlign: "left", fontSize: "11px", color: "#64748b", textTransform: "uppercase" };
const tdS: CSSProperties = { padding: "12px", fontSize: "13px" };
const badgeS: CSSProperties = { display: 'inline-block', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', marginTop: '4px' };
