import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
// src/modules/documentos/pages/LicencasPage.tsx
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { useDocumentosRegistros } from "../hooks/useDocumentosRegistros";
import type { DocumentoRegistro } from "../hooks/useDocumentosRegistros";
import { RegistrosDocumentoPanel } from "../components/RegistrosDocumentoPanel";

interface LicencasPageProps {
  paroquia: Paroquia;
}

// 1. Definição da estrutura de dados com campos estruturados e livres
interface LicencaForm {
  numeroProtocolo: string;
  tituloDocumento: string;
  designacaoInstituicao: string; // ex: "Área Missionária Nossa Senhora da Esperança"
  beneficiarioDados: string;
  finalidadeLicenca: string;
  prazoVigencia: string;
  condicoesRestricoes: string;
  cidadeData: string;
  emissorNome: string;
  emissorCargo: string;
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

export function LicencasPage({ paroquia }: LicencasPageProps) {
  const printRef = useRef<HTMLElement | null>(null);
  const [fonteDocumento, setFonteDocumento] = useState("Arial");

  const [form, setForm] = useState<LicencaForm>({
    numeroProtocolo: "Licença nº 001/2026",
    tituloDocumento: "TERMO DE LICENÇA ECLESIASTICA",
    designacaoInstituicao: paroquia.nome || "",
    beneficiarioDados: "NOME DO BENEFICIÁRIO, (nacionalidade, estado civil, profissão), portador do RG nº _____ e inscrito no CPF sob o nº _____, residente e domiciliado nesta comarca.",
    finalidadeLicenca: "realização de matrimônio/evento eclesiástico fora dos limites territoriais desta Paróquia, a ser realizado na Capela/Igreja _____, sob a responsabilidade do ministro assistente.",
    prazoVigencia: "Esta licença é válida a partir da data de sua emissão até o dia __ de ____________ de 20__.",
    condicoesRestricoes: "O beneficiário assume a responsabilidade de cumprir todas as determinações do Direito Canônico e as orientações pastorais vigentes nesta circunscrição eclesiástica.",
    cidadeData: `${paroquia.cidade || "Manaus"}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    emissorNome: "",
    emissorCargo: "Pároco Administrador",
  });

  function updateField<K extends keyof LicencaForm>(key: K, value: LicencaForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("licenca");

  useEffect(() => {
    if (proximoNumero && !form.numeroProtocolo) updateField("numeroProtocolo", `Licença nº ${proximoNumero}`);
  }, [proximoNumero]);

  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numeroProtocolo,
      assunto: form.tituloDocumento,
      destinatario: form.beneficiarioDados.substring(0, 80),
      signatario: form.emissorNome,
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
    await gerarPDFDoPreview("papel-licenca", form.tituloDocumento || "Licença");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* FORMULÁRIO ADMINISTRATIVO */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, color: "#1a1d2e" }}>Emissor de Licenças</h2>
        <p style={{ margin: "0 0 24px", color: "#667085", fontSize: 14, lineHeight: 1.6, maxWidth: 820 }}>
          Preencha os campos estruturados abaixo. O sistema organizará e formatará os parágrafos automaticamente para a impressão.
        </p>

        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7" }}>
          <FontSelector fonteAtual={fonteDocumento} onChange={(novaFonte) => setFonteDocumento(novaFonte)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          <div>
            <label style={labelStyle}>Número de Controle / Protocolo</label>
            <input style={fieldStyle} value={form.numeroProtocolo} onChange={(e) => updateField("numeroProtocolo", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Título do Documento</label>
            <input style={fieldStyle} value={form.tituloDocumento} onChange={(e) => updateField("tituloDocumento", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Designação Institucional</label>
            <input
              style={fieldStyle}
              value={form.designacaoInstituicao}
              onChange={(e) => updateField("designacaoInstituicao", e.target.value)}
              placeholder='Ex: Área Missionária Nossa Senhora da Esperança'
            />
            <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, display: "block" }}>
              Aparece no texto: "a administração da <strong>DESIGNAÇÃO</strong> concede..."
            </span>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>1. Qualificação do Beneficiário (Quem recebe a licença)</label>
            <textarea style={{ ...fieldStyle, minHeight: 60 }} value={form.beneficiarioDados} onChange={(e) => updateField("beneficiarioDados", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>2. Finalidade da Licença (Para fins de...)</label>
            <textarea style={{ ...fieldStyle, minHeight: 60 }} value={form.finalidadeLicenca} onChange={(e) => updateField("finalidadeLicenca", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>3. Prazo de Validade / Vigência</label>
            <textarea style={{ ...fieldStyle, minHeight: 45 }} value={form.prazoVigencia} onChange={(e) => updateField("prazoVigencia", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>4. Condições, Restrições ou Observações Extras</label>
            <textarea style={{ ...fieldStyle, minHeight: 60 }} value={form.condicoesRestricoes} onChange={(e) => updateField("condicoesRestricoes", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Cidade, Localidade e Data</label>
            <input style={fieldStyle} value={form.cidadeData} onChange={(e) => updateField("cidadeData", e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Autoridade que assina (Nome)</label>
            <input style={fieldStyle} value={form.emissorNome} onChange={(e) => updateField("emissorNome", e.target.value)} placeholder="Ex: Pe. Éder de Souza" />
          </div>

          <div>
            <label style={labelStyle}>Cargo do Emissor</label>
            <input style={fieldStyle} value={form.emissorCargo} onChange={(e) => updateField("emissorCargo", e.target.value)} />
          </div>
        </div>
      </section>

      {/* ÁREA DE PRÉ-VISUALIZAÇÃO */}
      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1d2e" }}>Visualização da Licença Impressa</h3>
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
            id="papel-licenca"
            ref={printRef}
            style={{
              width: 794, minHeight: 1123, background: "white", boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
              borderRadius: 8, padding: "64px 64px 64px 76px", boxSizing: "border-box", color: "#111827",
              display: "flex", flexDirection: "column",
              fontFamily: `${fonteDocumento}, sans-serif`,
              fontSize: 15, lineHeight: 1.9
            }}
          >
            <DocumentHeader paroquia={paroquia} />

            <div style={{ marginTop: 40, display: "flex", flexDirection: "column", flexGrow: 1 }}>
              
              {/* Alinhamento simétrico padrão de Protocolo e Data no topo */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, fontSize: 14 }}>
                <strong>{form.numeroProtocolo}</strong>
                <span>{form.cidadeData}</span>
              </div>

              {/* Título solene centralizado */}
              <h3 style={{ textAlign: "center", fontSize: 16, marginBottom: 40, letterSpacing: "0.05em" }}>
                {form.tituloDocumento.toUpperCase()}
              </h3>

              {/* Parágrafo 1: Concessão e Qualificação do Beneficiário */}
              <p style={{ textAlign: "justify", textIndent: "50px", margin: "0 0 16px 0" }}>
                Pelo presente instrumento, a administração da <strong>{form.designacaoInstituicao ? form.designacaoInstituicao.toUpperCase() : "_____"}</strong> concede termo de licença formal a <span>{form.beneficiarioDados}</span>
              </p>

              {/* Parágrafo 2: Finalidade */}
              <p style={{ textAlign: "justify", textIndent: "50px", margin: "0 0 16px 0" }}>
                A presente licença destina-se especificamente para a <span>{form.finalidadeLicenca}</span>
              </p>

              {/* Parágrafo 3: Vigência */}
              <p style={{ textAlign: "justify", textIndent: "50px", margin: "0 0 16px 0" }}>
                {form.prazoVigencia}
              </p>

              {/* Parágrafo 4: Condições e Observações */}
              <p style={{ textAlign: "justify", textIndent: "50px", margin: "0 0 40px 0" }}>
                {form.condicoesRestricoes}
              </p>

              {/* signature spacer removed */}

              {/* Bloco de Assinatura Centralizado */}
              <div style={{ 
                margin: "0 auto", width: "fit-content", textAlign: "center", 
                display: "flex", flexDirection: "column", alignItems: "center"
              }}>
                <div style={{ borderTop: "1px solid #71717a", width: 320, marginBottom: 8 }} />
                <strong>{form.emissorNome || "Nome da Autoridade Paroquial"}</strong>
                <div style={{ fontSize: 14, color: "#4b5563" }}>{form.emissorCargo}</div>
              </div>

            </div>
          </article>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Licença"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}