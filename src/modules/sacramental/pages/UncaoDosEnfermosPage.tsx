import { useToast } from "@core/ui/Toast";
import type { DadosUncao } from '../types';
import { gerarPDFUncao } from "../utils/gerarPDFSacramental";
import { useState, useEffect, CSSProperties } from "react";
import { RegistrosList } from "../components/RegistrosList";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { SacramentalRepository } from '../repository/sacramental.repository';
import { PastoralRepository } from '../../pastoral/repository/pastoral.repository';
import { BuscarFielPastoral } from "../components/BuscarFielPastoral";

interface UncaoProps { paroquia: Paroquia; }

const styles: { [key: string]: CSSProperties } = {
  container: {
    padding: "30px",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
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
  select: {
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
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid #d0d5dd",
    background: "rgba(255,255,255,0.92)",
    fontSize: "14px",
    minHeight: "150px",
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
    background: "linear-gradient(135deg, #2b579a, #1d4ed8)",
    color: "white",
    padding: "14px 24px",
    borderRadius: "16px",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(43,87,154,0.25)",
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
    marginBottom: "0",
    boxSizing: "border-box",
    outline: "none",
    boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
  },
};

const DADOS_VAZIO: DadosUncao = {
  nome: "",
  endereco: "",
  telefone: "",
  comunidade: "",
  comunidadeManual: "",
  tipoComunidade: "existente",
  dataVisita: new Date().toISOString().split('T')[0],
  visitante: "",
  anotacoes: "",
  documentoRetirado: "Não"
};

export function UncaoDosEnfermosPage({ paroquia: paroquiaDados }: UncaoProps) {
  const { showToast } = useToast();
  const [fonteDocumento, setFonteDocumento] = useState("Arial");
  const [busca, setBusca] = useState("");
  const [buscaComunidade, setBuscaComunidade] = useState("");
  const [recarregarKey, setRecarregarKey] = useState(0);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [fielId, setFielId] = useState<number | null>(null);
  const [comunidades, setComunidades] = useState<string[]>([]);
  const [dados, setDados] = useState({ ...DADOS_VAZIO });

  useEffect(() => {
    carregarComunidades();
  }, []);

  const carregarComunidades = async () => {
    try {
      const res = await PastoralRepository.comunidades.findNomes();
      setComunidades(res.map(r => r.nome));
    } catch (e) {
      console.error("Erro ao carregar comunidades:", e);
    }
  };

  const atualizar = (campo: string, valor: string) => setDados(p => ({ ...p, [campo]: valor }));

  const comunidadeEfetiva = dados.tipoComunidade === "manual" ? dados.comunidadeManual : dados.comunidade;

  const handleSalvar = async () => {
    if (!dados.nome) { showToast("Preencha o nome do enfermo.", "error"); return; }
    if (!comunidadeEfetiva) { showToast("Informe a comunidade.", "error"); return; }
    try {
      const jsonDados = JSON.stringify({ ...dados, comunidade: comunidadeEfetiva });
      const result = await SacramentalRepository.registros.upsert(
        "UNCAO", dados.nome, dados.dataVisita, dados.visitante, comunidadeEfetiva, jsonDados,
        editandoId !== null ? editandoId : undefined,
        fielId ?? undefined
      );
      if (result.duplicado) {
        showToast("Este fiel já possui um registro ativo para este sacramento.", "error");
        return;
      }
      setRecarregarKey(k => k + 1);
      showToast(editandoId !== null ? "Registro atualizado com sucesso!" : "Registro de Unção dos Enfermos salvo com sucesso!", "success");
    } catch (e) {
      console.error("Erro ao salvar unção:", e);
      showToast("Erro ao salvar. Tente novamente.", "error");
    }
  };

  const novoRegistro = () => {
    setDados({ ...DADOS_VAZIO });
    setEditandoId(null);
  };

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

  const exportarArquivoEditavel = async () => {
    try {
      const comunidadeTexto = comunidadeEfetiva;
      const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 ${fonteDocumento};}}
{\\colortbl;\\red31\\green59\\blue115;}
\\viewkind4\\uc1\\pard\\cf1\\b\\f0\\fs40 RELATORIO DE ACOMPANHAMENTO DE ENFERMO\\cf0\\b0\\fs24\\par
\\par
\\b Comunidade:\\b0  ${formatRTF(comunidadeTexto)}\\par
\\b Nome do Enfermo(a):\\b0  ${formatRTF(dados.nome)}\\par
\\b Endereco:\\b0  ${formatRTF(dados.endereco)}\\par
\\b Telefone (Familia):\\b0  ${formatRTF(dados.telefone)}\\par
\\b Data da Visita:\\b0  ${dados.dataVisita}\\par
\\par
\\cf1\\b\\fs28 Anotacoes Pastorais e Historico\\cf0\\b0\\fs24\\par
${formatRTF(dados.anotacoes)}\\par
\\par\\par\\par
\\pard\\qc __________________________________________\\par
\\b Assinatura do Visitador / Sacerdote\\b0\\par
}`;
      const path = await save({
        title: "Salvar Relatório",
        defaultPath: `Relatorio_Enfermo_${dados.nome.replace(/\s/g, '_') || 'sem_nome'}.rtf`,
        filters: [{ name: "Documento Editável", extensions: ["rtf"] }]
      });
      if (path) {
        await writeTextFile(path, rtfContent);
        showToast("Documento criado com sucesso!", "success");
      }
    } catch (err) { showToast("Erro ao exportar.", "error"); }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @media screen { .area-impressao { display: none; } }
      `}</style>

      {/* TELA DE BUSCA E FORMULÁRIO */}
      <div className="no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h2 style={{ color: "#1f3b73", margin: 0 }}>Unção dos Enfermos</h2>
            {editandoId && <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 600 }}>✏️ Editando registro #{editandoId}</span>}
          </div>
          <FontSelector fonteAtual={fonteDocumento} onChange={setFonteDocumento} />
        </div>

        {/* Barra de busca por nome + comunidade */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          <input
            style={{ ...styles.searchBar, flex: 1 }}
            placeholder="🔍 Buscar enfermo por nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          <input
            style={{ ...styles.searchBar, flex: 1 }}
            placeholder="🏘️ Filtrar por comunidade..."
            value={buscaComunidade}
            onChange={e => setBuscaComunidade(e.target.value)}
          />
          <button
            onClick={novoRegistro}
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", padding: "14px 20px", borderRadius: "16px", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            + Novo
          </button>
        </div>

        <RegistrosList
          tipo="UNCAO"
          busca={busca}
          filtroComunidade={buscaComunidade}
          recarregarKey={recarregarKey}
          onExcluir={() => { setEditandoId(null); setDados({ ...DADOS_VAZIO }); }}
          onSelecionar={(d, registro) => {
            const data = d as Record<string, string>;
            setEditandoId(registro.id);
            const tipoComunidade = comunidades.includes(data.comunidade || "") ? "existente" : "manual";
            setDados({
              nome: data.nome || "",
              endereco: data.endereco || "",
              telefone: data.telefone || "",
              comunidade: tipoComunidade === "existente" ? (data.comunidade || "") : "",
              comunidadeManual: tipoComunidade === "manual" ? (data.comunidade || "") : "",
              tipoComunidade,
              dataVisita: data.dataVisita || "",
              visitante: data.visitante || "",
              anotacoes: data.anotacoes || "",
              documentoRetirado: data.documentoRetirado || "Não"
            });
          }}
        />

        <BuscarFielPastoral onSelecionar={f => { setDados(d => ({ ...d, nome: f.nome, endereco: f.endereco || d.endereco, telefone: f.telefone || d.telefone })); setFielId(f.id); }} label="Buscar Enfermo no Módulo Pastoral" />

        <div style={styles.formCard}>
          <h3 style={styles.sectionTitle}>Registro de Visita</h3>

          {/* Seleção de comunidade */}
          <div style={{ ...styles.fieldGroup, marginBottom: '20px' }}>
            <label style={styles.label}>Tipo de Comunidade</label>
            <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="radio"
                  name="tipoComunidade"
                  value="existente"
                  checked={dados.tipoComunidade === "existente"}
                  onChange={() => atualizar("tipoComunidade", "existente")}
                />
                Comunidade da Área (cadastrada)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="radio"
                  name="tipoComunidade"
                  value="manual"
                  checked={dados.tipoComunidade === "manual"}
                  onChange={() => atualizar("tipoComunidade", "manual")}
                />
                Fora da Área (digitar)
              </label>
            </div>

            {dados.tipoComunidade === "existente" ? (
              <select
                style={styles.select}
                value={dados.comunidade}
                onChange={e => atualizar('comunidade', e.target.value)}
              >
                <option value="">— Selecione a comunidade —</option>
                {comunidades.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input
                style={styles.input}
                value={dados.comunidadeManual}
                onChange={e => atualizar('comunidadeManual', e.target.value)}
                placeholder="Digite o nome da comunidade onde celebrou"
              />
            )}
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Nome do Enfermo</label>
              <input style={styles.input} value={dados.nome} onChange={e => atualizar('nome', e.target.value)} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Data da Visita</label>
              <input style={styles.input} type="date" value={dados.dataVisita} onChange={e => atualizar('dataVisita', e.target.value)} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Quem Fez a Visita (Padre / Diácono / Agente)</label>
              <input style={styles.input} placeholder="Nome do visitador" value={dados.visitante} onChange={e => atualizar('visitante', e.target.value)} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Endereço Completo</label>
              <input style={styles.input} value={dados.endereco} onChange={e => atualizar('endereco', e.target.value)} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Telefone / Contato</label>
              <input style={styles.input} value={dados.telefone} onChange={e => atualizar('telefone', e.target.value)} />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Relatório Pastoral</label>
            <textarea style={styles.textarea} value={dados.anotacoes} onChange={e => atualizar('anotacoes', e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Documento Retirado?</label>
            <select style={styles.input} value={dados.documentoRetirado || "Não"} onChange={e => atualizar('documentoRetirado', e.target.value)}><option value="Não">Não</option><option value="Sim">Sim</option></select>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button style={styles.btnRegistrar} onClick={handleSalvar}>
              {editandoId ? "💾 Atualizar" : "💾 Salvar"}
            </button>
            <button
              onClick={() => gerarPDFUncao(paroquiaDados, dados as Record<string, string>, comunidadeEfetiva, fonteDocumento)}
              style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(31,59,115,0.2)", color: "#1f3b73", borderRadius: "16px", cursor: "pointer", padding: "14px 24px", fontWeight: 700, backdropFilter: "blur(10px)", boxShadow: "0 8px 20px rgba(15,23,42,0.06)", transition: "all .2s ease" }}
            >
              🖨️ Imprimir
            </button>
            {editandoId && (
              <button
                onClick={novoRegistro}
                style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #d0d5dd", color: "#475467", borderRadius: "16px", cursor: "pointer", padding: "14px 24px", fontWeight: 700 }}
              >
                ✕ Cancelar Edição
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO */}
      <div id="area-uncao-print" className="area-impressao" style={{ fontFamily: fonteDocumento }}>
        <DocumentHeader paroquia={paroquiaDados} />

        <div style={{ width: '98%', margin: '20px auto' }}>
          <h1 style={{ fontSize: '20pt', textAlign: 'center', textDecoration: 'underline', textTransform: 'uppercase', marginBottom: '10px' }}>
            Relatório de Acompanhamento de Enfermo
          </h1>
          <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', marginBottom: '30px' }}>
            {comunidadeEfetiva || paroquiaDados.nome}
          </p>

          <table style={{ width: '100%', border: '1.5px solid #000', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '35%', fontWeight: 'bold', backgroundColor: '#f2f2f2', fontSize: '11pt', padding: '10px', border: '1px solid #000' }}>Comunidade / Local da Visita:</td>
                <td style={{ fontSize: '12pt', padding: '10px', border: '1px solid #000' }}>{comunidadeEfetiva}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', fontSize: '11pt', padding: '10px', border: '1px solid #000' }}>Nome do Enfermo(a):</td>
                <td style={{ fontSize: '12pt', padding: '10px', border: '1px solid #000' }}>{dados.nome}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', fontSize: '11pt', padding: '10px', border: '1px solid #000' }}>Endereço:</td>
                <td style={{ fontSize: '12pt', padding: '10px', border: '1px solid #000' }}>{dados.endereco}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', fontSize: '11pt', padding: '10px', border: '1px solid #000' }}>Telefone (Família):</td>
                <td style={{ fontSize: '12pt', padding: '10px', border: '1px solid #000' }}>{dados.telefone}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', fontSize: '11pt', padding: '10px', border: '1px solid #000' }}>Data da Visita:</td>
                <td style={{ fontSize: '12pt', padding: '10px', border: '1px solid #000' }}>{dados.dataVisita}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f2f2f2', fontSize: '11pt', padding: '10px', border: '1px solid #000' }}>Quem Fez a Visita:</td>
                <td style={{ fontSize: '12pt', padding: '10px', border: '1px solid #000' }}>{dados.visitante}</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ borderBottom: '2.5px solid #1f3b73', paddingBottom: '5px', marginTop: '30px', color: '#1f3b73', fontSize: '14pt' }}>
            Anotações Pastorais e Histórico de Visita
          </h3>
          <div style={{ marginTop: '15px', textAlign: 'justify', lineHeight: '1.8', fontSize: '11pt', minHeight: '100px', paddingBottom: '20px', whiteSpace: 'pre-wrap' }}>
            {dados.anotacoes}
          </div>

          <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12pt' }}>
            <p>_________________________________________________</p>
            {dados.visitante && <p style={{ fontWeight: 'bold', margin: '4px 0 0' }}>{dados.visitante}</p>}
            <p style={{ margin: '2px 0 0', color: '#555' }}>Padre / Diácono / Agente Pastoral</p>
          </div>
        </div>
      </div>
    </div>
  );
}
