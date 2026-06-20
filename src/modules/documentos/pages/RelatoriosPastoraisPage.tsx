import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { useDocumentosRegistros } from "../hooks/useDocumentosRegistros";
import type { DocumentoRegistro } from "../hooks/useDocumentosRegistros";
import { useRelatorioData } from "../hooks/useRelatorioData";
import { RegistrosDocumentoPanel } from "../components/RegistrosDocumentoPanel";

interface RelatoriosPastoraisPageProps {
  paroquia: Paroquia;
}

interface RelatorioPastoralForm {
  numeroRelatorio: string;
  periodoReferencia: string;
  qtdBatizados: string;
  qtdPrimeiraComunhao: string;
  qtdCrismas: string;
  qtdCasamentos: string;
  qtdUncoes: string;
  qtdVisitas: string;
  qtdCatequizandos: string;
  novosDizimistas: string;
  observacoesPastorais: string;
  cidadeDataFechamento: string;
  secretarioNome: string;
}

const fieldStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d6dbe7",
  background: "#fff",
  color: "#1a1d2e",
  fontSize: 14,
  boxSizing: "border-box",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "#667085",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const sectionTitleStyle: CSSProperties = {
  gridColumn: "1 / -1",
  fontSize: 14,
  fontWeight: 700,
  color: "#1f3b73",
  borderBottom: "1px solid #e4e7ec",
  paddingBottom: 6,
  marginTop: 10,
  textTransform: "uppercase",
};

function anoAtual() {
  return new Date().getFullYear();
}

export function RelatoriosPastoraisPage({ paroquia }: RelatoriosPastoraisPageProps) {
  const printRef = useRef<HTMLElement | null>(null);
  const [fonteDocumento, setFonteDocumento] = useState("Arial");

  // Período de busca
  const [dataInicio, setDataInicio] = useState(`${anoAtual()}-01-01`);
  const [dataFim, setDataFim] = useState(`${anoAtual()}-12-31`);

  const { carregando, erro, buscarDados } = useRelatorioData();

  const [form, setForm] = useState<RelatorioPastoralForm>({
    numeroRelatorio: "",
    periodoReferencia: `Janeiro a Dezembro de ${anoAtual()}`,
    qtdBatizados: "0",
    qtdPrimeiraComunhao: "0",
    qtdCrismas: "0",
    qtdCasamentos: "0",
    qtdUncoes: "0",
    qtdVisitas: "0",
    qtdCatequizandos: "0",
    novosDizimistas: "0",
    observacoesPastorais: "",
    cidadeDataFechamento: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`,
    secretarioNome: "Nome do Secretário(a) Paroquial",
  });

  function updateField<K extends keyof RelatorioPastoralForm>(key: K, value: RelatorioPastoralForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("relatorio_pastoral");

  useEffect(() => {
    if (proximoNumero && !form.numeroRelatorio) {
      updateField("numeroRelatorio", `Relatório Pastoral nº ${proximoNumero}`);
    }
  }, [proximoNumero]);

  async function handleGerarRelatorio() {
    const dados = await buscarDados(dataInicio, dataFim);
    if (!dados) return;

    // Formata o rótulo do período para exibição no documento
    const fmtData = (d: string) =>
      new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    setForm((f) => ({
      ...f,
      periodoReferencia: `${fmtData(dataInicio)} a ${fmtData(dataFim)}`,
      qtdBatizados: String(dados.batismos),
      qtdPrimeiraComunhao: String(dados.primeiraComunhao),
      qtdCrismas: String(dados.crismas),
      qtdCasamentos: String(dados.casamentos),
      qtdUncoes: String(dados.uncoes),
      qtdVisitas: String(dados.visitasPastorais),
      qtdCatequizandos: String(dados.catequizandos),
      novosDizimistas: String(dados.novosDizimistas),
    }));
  }

  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numeroRelatorio,
      assunto: `Relatório: ${form.periodoReferencia}`,
      destinatario: "",
      signatario: form.secretarioNome,
      data_emissao: new Date().toISOString().split("T")[0],
      json_dados: JSON.stringify(form),
    });
  }

  function handleEditar(reg: DocumentoRegistro) {
    try {
      const dados = JSON.parse(reg.json_dados || "{}");
      if (Object.keys(dados).length > 0) {
        setForm(dados);
        iniciarEdicao(reg.id);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { /* json inválido */ }
  }

  async function imprimir() {
    await gerarPDFDoPreview("papel-pastoral", `Relatório Pastoral - ${form.periodoReferencia || "2026"}`);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* BLOCO: SELEÇÃO DE PERÍODO */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, color: "#1a1d2e" }}>Relatórios Pastorais e Estatísticos</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6 }}>
          Selecione o período desejado e clique em <strong>Gerar Relatório</strong> para buscar os dados registrados no sistema.
          Os campos ficam editáveis para ajustes manuais antes da impressão.
        </p>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={labelStyle}>Data Inicial</label>
            <input
              type="date"
              style={fieldStyle}
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={labelStyle}>Data Final</label>
            <input
              type="date"
              style={fieldStyle}
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          <button
            onClick={handleGerarRelatorio}
            disabled={carregando}
            style={{
              padding: "12px 28px",
              background: carregando ? "#94a3b8" : "#1f3b73",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: carregando ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {carregando ? "⏳ Buscando..." : "🔍 Gerar Relatório"}
          </button>
        </div>

        {erro && (
          <div style={{ marginTop: 12, padding: "10px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
            ⚠️ {erro}
          </div>
        )}

        {/* Legenda das origens dos dados */}
        <div style={{ marginTop: 16, padding: "12px 16px", background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 10, fontSize: 12, color: "#1e40af", lineHeight: 1.8 }}>
          <strong>Origem dos dados:</strong><br />
          🔵 <strong>Sacramentos</strong> (Batismo, 1ª Comunhão, Crisma, Matrimônio, Unção) → Módulo Sacramental<br />
          🟢 <strong>Visitas Pastorais</strong> → Módulo Agenda (compromissos categoria Visita/Pastoral)<br />
          🟡 <strong>Catequizandos Matriculados</strong> → Módulo Catequese (turmas do período)<br />
          🟠 <strong>Novos Dizimistas</strong> → Módulo Pastoral (fiéis marcados como dizimistas no período)
        </div>
      </section>

      {/* FORMULÁRIO DE EDIÇÃO */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, color: "#1a1d2e" }}>Conferência e Ajuste dos Dados</h3>

        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7" }}>
          <FontSelector fonteAtual={fonteDocumento} onChange={(novaFonte) => setFonteDocumento(novaFonte)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>

          <div style={sectionTitleStyle}>1. Identificação Geral</div>
          <div>
            <label style={labelStyle}>Número do Relatório</label>
            <input style={fieldStyle} value={form.numeroRelatorio} onChange={(e) => updateField("numeroRelatorio", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Período de Referência</label>
            <input style={fieldStyle} value={form.periodoReferencia} onChange={(e) => updateField("periodoReferencia", e.target.value)} placeholder="Ex: Janeiro a Dezembro de 2026" />
          </div>

          <div style={sectionTitleStyle}>2. Movimento Sacramental</div>
          <div>
            <label style={labelStyle}>Sacramento do Batismo</label>
            <input type="number" style={fieldStyle} value={form.qtdBatizados} onChange={(e) => updateField("qtdBatizados", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Primeira Comunhão (Eucaristia)</label>
            <input type="number" style={fieldStyle} value={form.qtdPrimeiraComunhao} onChange={(e) => updateField("qtdPrimeiraComunhao", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Sacramento da Confirmação (Crisma)</label>
            <input type="number" style={fieldStyle} value={form.qtdCrismas} onChange={(e) => updateField("qtdCrismas", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Sacramento do Matrimônio</label>
            <input type="number" style={fieldStyle} value={form.qtdCasamentos} onChange={(e) => updateField("qtdCasamentos", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Unção dos Enfermos</label>
            <input type="number" style={fieldStyle} value={form.qtdUncoes} onChange={(e) => updateField("qtdUncoes", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Visitas Pastorais (Agenda)</label>
            <input type="number" style={fieldStyle} value={form.qtdVisitas} onChange={(e) => updateField("qtdVisitas", e.target.value)} />
          </div>

          <div style={sectionTitleStyle}>3. Catequese e Dízimo</div>
          <div>
            <label style={labelStyle}>Catequizandos Matriculados</label>
            <input type="number" style={fieldStyle} value={form.qtdCatequizandos} onChange={(e) => updateField("qtdCatequizandos", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Novos Dizimistas no Período</label>
            <input type="number" style={fieldStyle} value={form.novosDizimistas} onChange={(e) => updateField("novosDizimistas", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Observações / Atividades Pastorais Relevantes</label>
            <textarea style={{ ...fieldStyle, minHeight: 70 }} value={form.observacoesPastorais} onChange={(e) => updateField("observacoesPastorais", e.target.value)} />
          </div>

          <div style={sectionTitleStyle}>4. Validação</div>
          <div>
            <label style={labelStyle}>Cidade e Data de Fechamento</label>
            <input style={fieldStyle} value={form.cidadeDataFechamento} onChange={(e) => updateField("cidadeDataFechamento", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Nome do Secretário(a)</label>
            <input style={fieldStyle} value={form.secretarioNome} onChange={(e) => updateField("secretarioNome", e.target.value)} />
          </div>
        </div>
      </section>

      {/* PRÉ-VISUALIZAÇÃO EM FOLHA A4 */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Visualização do Relatório Oficial</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleRegistrar}
              type="button"
              style={{ background: "#0e9f6e", color: "white", border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              {editandoId !== null ? "💾 Salvar Edição" : "✓ Registrar Documento"}
            </button>
            <button
              onClick={imprimir}
              type="button"
              style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              🖨 Imprimir / PDF
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: 20, background: "#f8fafc", borderRadius: 16 }}>
          <article
            id="papel-pastoral"
            ref={printRef}
            style={{
              width: 794, minHeight: 1123, background: "white",
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
              borderRadius: 8, padding: "64px 64px 64px 76px",
              boxSizing: "border-box", color: "#111827",
              display: "flex", flexDirection: "column",
              fontFamily: `${fonteDocumento}, sans-serif`,
              fontSize: 15, lineHeight: 1.8,
            }}
          >
            <DocumentHeader paroquia={paroquia} />

            <div style={{ marginTop: 35, display: "flex", flexDirection: "column", flexGrow: 1 }}>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30, fontSize: 14, borderBottom: "1px solid #e5e7eb", paddingBottom: 6 }}>
                <strong>{form.numeroRelatorio}</strong>
                <span>Período: {form.periodoReferencia}</span>
              </div>

              <h3 style={{ textAlign: "center", fontSize: 16, marginBottom: 25, letterSpacing: "0.03em", fontWeight: "bold" }}>
                RELATÓRIO PASTORAL E ESTATÍSTICO
              </h3>

              <p style={{ textAlign: "justify", textIndent: "40px", margin: "0 0 24px 0" }}>
                Apresentamos à Cúria Diocesana e aos conselhos paroquiais o balanço consolidado dos indicadores de
                evangelização, sacramentos e movimentos pastorais desta circunscrição eclesiástica, conforme os
                registros efetuados na secretaria paroquial no período de <strong>{form.periodoReferencia}</strong>.
              </p>

              {/* TABELA DE SACRAMENTOS */}
              <p style={{ fontWeight: 700, fontSize: 13, color: "#1f3b73", textTransform: "uppercase", margin: "0 0 6px 0", borderLeft: "3px solid #1f3b73", paddingLeft: 8 }}>
                Movimento Sacramental
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f0f4ff", borderBottom: "2px solid #c7d7fa" }}>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: "bold", color: "#1f3b73" }}>Sacramento</th>
                    <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: "bold", color: "#1f3b73", width: 130 }}>Total no Período</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Sacramento do Batismo (Crianças e Adultos)", form.qtdBatizados],
                    ["Primeira Eucaristia (Iniciação Cristã)", form.qtdPrimeiraComunhao],
                    ["Sacramento da Confirmação (Crisma)", form.qtdCrismas],
                    ["Sacramento do Matrimônio", form.qtdCasamentos],
                    ["Unção dos Enfermos", form.qtdUncoes],
                    ["Visitas Pastorais", form.qtdVisitas],
                  ].map(([label, val], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #edf2f7", background: i % 2 === 1 ? "#fafbff" : "white" }}>
                      <td style={{ padding: "8px 10px" }}>{label}</td>
                      <td style={{ textAlign: "center", padding: "8px 10px", fontWeight: 700 }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TABELA DE CATEQUESE E DÍZIMO */}
              <p style={{ fontWeight: 700, fontSize: 13, color: "#1f3b73", textTransform: "uppercase", margin: "0 0 6px 0", borderLeft: "3px solid #1f3b73", paddingLeft: 8 }}>
                Catequese e Dízimo
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f0f4ff", borderBottom: "2px solid #c7d7fa" }}>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: "bold", color: "#1f3b73" }}>Indicador</th>
                    <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: "bold", color: "#1f3b73", width: 130 }}>Total no Período</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Catequizandos Matriculados (Infantil / Adultos)", form.qtdCatequizandos],
                    ["Novos Dizimistas Inscritos no Período", form.novosDizimistas],
                  ].map(([label, val], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #edf2f7", background: i % 2 === 1 ? "#fafbff" : "white" }}>
                      <td style={{ padding: "8px 10px" }}>{label}</td>
                      <td style={{ textAlign: "center", padding: "8px 10px", fontWeight: 700 }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {form.observacoesPastorais && (
                <div style={{ marginBottom: 30, padding: "12px 16px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6 }}>
                  <strong style={{ fontSize: 12, textTransform: "uppercase", color: "#4b5563", display: "block", marginBottom: 6 }}>
                    Observações Complementares:
                  </strong>
                  <p style={{ textAlign: "justify", margin: 0, fontSize: 13, fontStyle: "italic", lineHeight: 1.7 }}>
                    "{form.observacoesPastorais}"
                  </p>
                </div>
              )}

              <div style={{ textAlign: "right", fontSize: 13, marginBottom: 50 }}>
                {form.cidadeDataFechamento}
              </div>

              {/* Assinaturas */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 50, marginTop: "auto" }}>
                <div style={{ textAlign: "center", width: "46%" }}>
                  <div style={{ borderTop: "1px solid #71717a", paddingTop: 6, fontWeight: "bold", fontSize: 13 }}>
                    PÁROCO / VIGÁRIO
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>Representante Legal</div>
                </div>
                <div style={{ textAlign: "center", width: "46%" }}>
                  <div style={{ borderTop: "1px solid #71717a", paddingTop: 6, fontWeight: "bold", fontSize: 13, textTransform: "uppercase" }}>
                    {form.secretarioNome || "Secretário(a) Paroquial"}
                  </div>
                  <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2 }}>Responsável pela Digitação</div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Relatório Pastoral"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}
