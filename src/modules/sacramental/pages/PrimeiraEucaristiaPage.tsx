import { useToast } from "@core/ui/Toast";
import type { DadosEucaristia } from '../types';
import { gerarPDFEucaristia } from "../utils/gerarPDFSacramental";
import { useState, CSSProperties } from "react";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { SacramentalRepository } from '../repository/sacramental.repository';
import { RegistrosList } from "../components/RegistrosList";
import { BuscarFielPastoral } from "../components/BuscarFielPastoral";
import { ComunidadeSelect } from "../components/ComunidadeSelect";

interface Props { paroquia: Paroquia; }

const styles: { [key: string]: CSSProperties } = {
  container: {
    padding: "30px",
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
  },

  formCard: {
    background: "rgba(255,255,255,0.88)",
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
    marginBottom: "22px",
    borderBottom: "1px solid rgba(203,213,225,0.5)",
    paddingBottom: "12px",
    letterSpacing: "-0.02em",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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

  searchBar: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(31,59,115,0.15)",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    fontSize: "14px",
    marginBottom: "20px",
    boxSizing: "border-box",
    outline: "none",
    boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
  },
};

export function PrimeiraEucaristiaPage({ paroquia: paroquiaDados }: Props) {
  const { showToast } = useToast();
  const [fonteDocumento, setFonteDocumento] = useState("Arial");
  const [busca, setBusca] = useState("");
  const [recarregarKey, setRecarregarKey] = useState(0);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [fielId, setFielId] = useState<number | null>(null);
  const [dados, setDados] = useState<DadosEucaristia>({
    nome: "", comunidade: "", turma: "", catequista: "", dataComunhao: "", local: "", obs: "", documentoRetirado: "Não"
  });

  const atualizar = (campo: string, valor: string) => setDados(p => ({ ...p, [campo]: valor }));

  const novoRegistro = () => { setDados({ nome: "", comunidade: "", turma: "", catequista: "", dataComunhao: "", local: "", obs: "", documentoRetirado: "Não" }); setEditandoId(null); };

  const handleRegistrar = async () => {
    if (!dados.nome) { showToast("Preencha o nome do catequizando.", "error"); return; }
    try {
      const jsonDados = JSON.stringify(dados);
      const result = await SacramentalRepository.registros.upsert(
        "EUCARISTIA", dados.nome, dados.dataComunhao, dados.catequista, dados.comunidade, jsonDados,
        editandoId !== null ? editandoId : undefined,
        fielId ?? undefined
      );
      if (result.duplicado) {
        showToast("Este fiel já possui um registro ativo para este sacramento.", "error");
        return;
      }
      setRecarregarKey(k => k + 1);
      showToast(editandoId !== null ? "1ª Eucaristia atualizada com sucesso!" : "1ª Eucaristia registrada com sucesso!", "success");
    } catch (e) {
      console.error("Erro ao salvar eucaristia:", e);
      showToast("Erro ao salvar. Tente novamente.", "error");
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @media screen { .area-impressao { display: none; } }
      `}</style>

      <div className="no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: "#1f3b73", margin: 0 }}>Primeira Eucaristia</h2>
          <FontSelector fonteAtual={fonteDocumento} onChange={setFonteDocumento} />
        </div>
        
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <input style={{ ...styles.searchBar, marginBottom: 0, flex: 1 }} placeholder="🔍 Buscar por nome..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button onClick={novoRegistro} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", padding: "14px 20px", borderRadius: "16px", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Novo</button>
        </div>

        <RegistrosList
          tipo="EUCARISTIA"
          busca={busca}
          recarregarKey={recarregarKey}
          onExcluir={() => { setEditandoId(null); novoRegistro(); }}
          onSelecionar={(d, registro) => { const data = d as Record<string, string>; setEditandoId(registro.id); setDados({ nome: data.nome || "", comunidade: data.comunidade || "", turma: data.turma || "", catequista: data.catequista || "", dataComunhao: data.dataComunhao || "", local: data.local || "", obs: data.obs || "", documentoRetirado: data.documentoRetirado || "Não" }); }}
        />
        <BuscarFielPastoral onSelecionar={f => { setDados(d => ({ ...d, nome: f.nome, comunidade: f.comunidade || d.comunidade })); setFielId(f.id); }} label="Buscar Comunicante no Módulo Pastoral" />

        <div style={styles.formCard}>
          <h3 style={styles.sectionTitle}>Dados da Primeira Comunhão</h3>
          <div style={{...styles.fieldGroup, marginBottom: '20px'}}>
            <label style={styles.label}>Nome do Comunicante (Criança/Jovem/Adulto)</label>
            <input style={styles.input} value={dados.nome} onChange={e => atualizar('nome', e.target.value)} />
          </div>
          <div style={styles.row}>
            <div style={styles.fieldGroup}><label style={styles.label}>Comunidade</label><ComunidadeSelect value={dados.comunidade} onChange={v => atualizar('comunidade', v)} style={styles.input} /></div>
            <div style={styles.fieldGroup}><label style={styles.label}>Turma de Catequese</label><input style={styles.input} value={dados.turma} onChange={e => atualizar('turma', e.target.value)} /></div>
          </div>
          <div style={styles.row}>
            <div style={styles.fieldGroup}><label style={styles.label}>Catequista Responsável</label><input style={styles.input} value={dados.catequista} onChange={e => atualizar('catequista', e.target.value)} /></div>
            <div style={styles.fieldGroup}><label style={styles.label}>Data da Celebração</label><input style={styles.input} type="date" value={dados.dataComunhao} onChange={e => atualizar('dataComunhao', e.target.value)} /></div>
          </div>
          <div style={{...styles.fieldGroup, marginBottom: '20px'}}>
            <label style={styles.label}>Local da Celebração (Igreja/Paróquia)</label>
            <input style={styles.input} value={dados.local} onChange={e => atualizar('local', e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Observações</label>
            <textarea style={styles.textarea} value={dados.obs} onChange={e => atualizar('obs', e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Documento Retirado?</label>
            <select style={styles.input} value={dados.documentoRetirado || "Não"} onChange={e => atualizar('documentoRetirado', e.target.value)}><option value="Não">Não</option><option value="Sim">Sim</option></select>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button style={styles.btnRegistrar} onClick={handleRegistrar}>{editandoId ? "💾 Atualizar" : "💾 Registrar"}</button>
            {editandoId && <button onClick={novoRegistro} style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #d0d5dd", color: "#475467", borderRadius: "16px", cursor: "pointer", padding: "14px 20px", fontWeight: 700 }}>✕ Cancelar Edição</button>}
            <button
  onClick={() => gerarPDFEucaristia(paroquiaDados, dados as Record<string, string>, fonteDocumento)}
  style={{
    background: "rgba(255,255,255,0.85)",
    border: "1px solid rgba(31,59,115,0.2)",
    color: "#1f3b73",
    borderRadius: "16px",
    cursor: "pointer",
    padding: "14px 24px",
    fontWeight: 700,
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
    transition: "all .2s ease",
  }}
>🖨️ Imprimir</button>
          </div>
        </div>
      </div>

      <div id="area-eucaristia-print" className="area-impressao" style={{ fontFamily: fonteDocumento }}>
        <DocumentHeader paroquia={paroquiaDados} />
        <div style={{ width: '94%', margin: '16px auto' }}>
          <h1 style={{ fontSize: '16pt', textAlign: 'center', textTransform: 'uppercase', color: '#1f3b73', borderBottom: '2.5px solid #1f3b73', paddingBottom: '10px', marginBottom: '22px', letterSpacing: '0.04em' }}>
            Ficha de Registro — Primeira Eucaristia
          </h1>

          {/* Seção 1 */}
          <p style={{ fontSize: '9pt', fontWeight: 700, color: '#475467', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>1. Dados do Comunicante</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', paddingRight: '14px', paddingBottom: '10px', verticalAlign: 'top' }}>
                  <span style={{ display: 'block', fontSize: '7.5pt', fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: '3px' }}>Nome Completo do Comunicante</span>
                  <span style={{ display: 'block', fontSize: '11pt', paddingBottom: '4px', minHeight: '18px' }}>{dados.nome}</span>
                </td>
                <td style={{ width: '50%', paddingBottom: '10px', verticalAlign: 'top' }}>
                  <span style={{ display: 'block', fontSize: '7.5pt', fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: '3px' }}>Comunidade / Paróquia</span>
                  <span style={{ display: 'block', fontSize: '11pt', paddingBottom: '4px', minHeight: '18px' }}>{dados.comunidade}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Seção 2 */}
          <hr style={{ border: 'none', borderTop: '1px solid #e4e7ec', marginBottom: '14px' }} />
          <p style={{ fontSize: '9pt', fontWeight: 700, color: '#475467', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>2. Dados da Formação e Celebração</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', paddingRight: '14px', paddingBottom: '10px', verticalAlign: 'top' }}>
                  <span style={{ display: 'block', fontSize: '7.5pt', fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: '3px' }}>Turma de Catequese</span>
                  <span style={{ display: 'block', fontSize: '11pt', paddingBottom: '4px', minHeight: '18px' }}>{dados.turma}</span>
                </td>
                <td style={{ width: '50%', paddingBottom: '10px', verticalAlign: 'top' }}>
                  <span style={{ display: 'block', fontSize: '7.5pt', fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: '3px' }}>Catequista Responsável</span>
                  <span style={{ display: 'block', fontSize: '11pt', paddingBottom: '4px', minHeight: '18px' }}>{dados.catequista}</span>
                </td>
              </tr>
              <tr>
                <td style={{ paddingRight: '14px', paddingBottom: '10px', verticalAlign: 'top' }}>
                  <span style={{ display: 'block', fontSize: '7.5pt', fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: '3px' }}>Data da Primeira Comunhão</span>
                  <span style={{ display: 'block', fontSize: '11pt', paddingBottom: '4px', minHeight: '18px' }}>{dados.dataComunhao}</span>
                </td>
                <td style={{ paddingBottom: '10px', verticalAlign: 'top' }}>
                  <span style={{ display: 'block', fontSize: '7.5pt', fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: '3px' }}>Local da Celebração</span>
                  <span style={{ display: 'block', fontSize: '11pt', paddingBottom: '4px', minHeight: '18px' }}>{dados.local}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Seção 3 */}
          <hr style={{ border: 'none', borderTop: '1px solid #e4e7ec', marginBottom: '14px' }} />
          <p style={{ fontSize: '9pt', fontWeight: 700, color: '#475467', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>3. Observações Pastorais</p>
          <div style={{ minHeight: '80px', fontSize: '11pt', textAlign: 'justify', paddingBottom: '8px', marginBottom: '24px' }}>{dados.obs}</div>

          {/* Citação */}
          <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '9.5pt', color: '#475467', margin: '18px 0 28px' }}>
            "Eu sou o pão da vida. Quem vem a mim não terá fome, e quem crê em mim nunca terá sede." — Jo 6,35
          </p>

          {/* Assinaturas */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '40px' }}>
            <tbody>
              <tr>
                <td style={{ width: '44%', textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #344054', paddingTop: '6px' }}>
                    <span style={{ display: 'block', fontSize: '9.5pt', fontWeight: 700 }}>{dados.catequista || '________________________________'}</span>
                    <span style={{ display: 'block', fontSize: '8.5pt', color: '#667085' }}>Catequista Responsável</span>
                  </div>
                </td>
                <td style={{ width: '12%' }} />
                <td style={{ width: '44%', textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #344054', paddingTop: '6px' }}>
                    <span style={{ display: 'block', fontSize: '9.5pt', fontWeight: 700 }}>________________________________</span>
                    <span style={{ display: 'block', fontSize: '8.5pt', color: '#667085' }}>Pároco / Vigário / Diácono</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}