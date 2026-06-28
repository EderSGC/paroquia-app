import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { gerarPDFDoPreview } from "@core/utils/pdfGenerator";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { PagedPreview } from "@core/components/PagedPreview";
import { RichTextEditor, plainTextToHtml } from "@core/components/RichTextEditor";
import { useDocumentosRegistros } from "../hooks/useDocumentosRegistros";
import type { DocumentoRegistro } from "../hooks/useDocumentosRegistros";
import { RegistrosDocumentoPanel } from "../components/RegistrosDocumentoPanel";

interface Props { paroquia: Paroquia; }

const fieldStyle: CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #d6dbe7",
  background: "#fff", color: "#1a1d2e", fontSize: 14, boxSizing: "border-box", marginBottom: 12
};

const labelStyle: CSSProperties = {
  display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#667085", textTransform: "uppercase"
};

export function AtaPage({ paroquia }: Props) {
  const [fonte, setFonte] = useState("Times New Roman");
  const [espacamento, setEspacamento] = useState(1.6);

  const [form, setForm] = useState({
    numeroProtocolo: "",
    titulo: "ATA DA ___ª REUNIÃO DO CONSELHO PASTORAL",
    abertura: `Aos ___ dias do mês de ___________ de 2026, às ___:___ horas, na ${paroquia.nome}...`,
    participantes: "",
    ordemDia: "1. Oração Inicial; 2. Leitura da Ata Anterior; 3. pauta...",
    decisoes: "",
    horarioEncerramento: "",
    secretario: "",
    presidente: ""
  });

  const aberturaHtml = useMemo(() => plainTextToHtml(form.abertura), [form.abertura]);
  const participantesHtml = useMemo(() => plainTextToHtml(form.participantes), [form.participantes]);
  const ordemDiaHtml = useMemo(() => plainTextToHtml(form.ordemDia), [form.ordemDia]);
  const decisoesHtml = useMemo(() => plainTextToHtml(form.decisoes), [form.decisoes]);

  const { registros, loading: loadingReg, proximoNumero, salvar, excluir, editandoId, iniciarEdicao } = useDocumentosRegistros("ata");

  useEffect(() => {
    if (proximoNumero && !form.numeroProtocolo) setForm(f => ({ ...f, numeroProtocolo: proximoNumero }));
  }, [proximoNumero]);

  // Função para lidar com a nova lógica de impressão
  function handleRegistrar() {
    salvar({
      numero_protocolo: form.numeroProtocolo,
      assunto: form.titulo,
      destinatario: "",
      signatario: form.presidente,
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

  async function tratarImpressao() {
    await gerarPDFDoPreview("papel-ata", form.titulo || "Ata Paroquial");
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>

<section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <h2 style={{ marginBottom: 20 }}>Nova Ata Paroquial</h2>
        
        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f2f4f7", display: "flex", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
          <FontSelector fonteAtual={fonte} onChange={setFonte} />
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Espaçamento entre linhas</label>
            <div style={{ display: "flex", gap: 4 }}>
              {[{ label: "1.0", value: 1 }, { label: "1.5", value: 1.5 }, { label: "1.6", value: 1.6 }, { label: "2.0", value: 2 }].map((opt) => (
                <button key={opt.value} type="button" onClick={() => setEspacamento(opt.value)} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: espacamento === opt.value ? "1px solid #1f3b73" : "1px solid #d6dbe7", background: espacamento === opt.value ? "#1f3b73" : "#fff", color: espacamento === opt.value ? "#fff" : "#475467" }}>{opt.label}</button>
              ))}
            </div>
          </div>
        </div>

        <label style={labelStyle}>Número de Protocolo</label>
        <input style={fieldStyle} value={form.numeroProtocolo} onChange={e => setForm({...form, numeroProtocolo: e.target.value})} placeholder={proximoNumero || "Ex: 001/2026"} />

        <label style={labelStyle}>Título e Contexto</label>
        <input style={fieldStyle} value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />

        <label style={labelStyle}>Abertura (Data, Hora e Local)</label>
        <RichTextEditor value={aberturaHtml} onChange={(html) => setForm(f => ({...f, abertura: html}))} minHeight={80} lineHeight={espacamento} />

        <label style={labelStyle}>Participantes</label>
        <RichTextEditor value={participantesHtml} onChange={(html) => setForm(f => ({...f, participantes: html}))} minHeight={80} lineHeight={espacamento} />

        <label style={labelStyle}>Ordem do Dia (Pauta)</label>
        <RichTextEditor value={ordemDiaHtml} onChange={(html) => setForm(f => ({...f, ordemDia: html}))} minHeight={100} lineHeight={espacamento} />

        <label style={labelStyle}>Discussões e Decisões</label>
        <RichTextEditor value={decisoesHtml} onChange={(html) => setForm(f => ({...f, decisoes: html}))} minHeight={200} lineHeight={espacamento} />

        <label style={labelStyle}>Horário de Encerramento</label>
        <input
          style={fieldStyle}
          placeholder="Ex: 20:30"
          value={form.horarioEncerramento}
          onChange={e => setForm({...form, horarioEncerramento: e.target.value})}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={labelStyle}>Presidente da Reunião</label>
            <input style={fieldStyle} value={form.presidente} onChange={e => setForm({...form, presidente: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Secretário(a)</label>
            <input style={fieldStyle} value={form.secretario} onChange={e => setForm({...form, secretario: e.target.value})} />
          </div>
        </div>
      </section>

      <section style={{ background: "white", borderRadius: 18, border: "1px solid #e4e7ec", padding: 28 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <button
            onClick={handleRegistrar}
            style={{ background: "#0e9f6e", color: "white", border: "none", borderRadius: 10, padding: "12px 18px", cursor: "pointer", fontWeight: 700 }}
          >
            {editandoId !== null ? "💾 Salvar Edição" : "✓ Registrar Documento"}
          </button>
          <button
            onClick={tratarImpressao}
          style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "12px 20px", cursor: "pointer", fontWeight: 700, marginBottom: 20 }}
        >
          🖨 Imprimir / PDF
        </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#f8fafc", padding: 40, borderRadius: 16 }}>
          <PagedPreview
            id="papel-ata"
            style={{
              width: 794,
              background: "white",
              padding: "60px",
              boxSizing: "border-box",
              fontFamily: `"${fonte}", serif`,
              fontSize: "14px",
              lineHeight: espacamento,
              textAlign: "justify",
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
              borderRadius: 8,
            }}
          >
            <DocumentHeader paroquia={paroquia} />
            
            <h2 style={{ textAlign: "center", textTransform: "uppercase", marginTop: 40, fontSize: 18 }}>{form.titulo}</h2>

            <div style={{ marginTop: 30 }}><strong>ABERTURA:</strong> <span dangerouslySetInnerHTML={{ __html: form.abertura }} /></div>
            <div style={{ marginTop: 10 }}><strong>PARTICIPANTES:</strong> <span dangerouslySetInnerHTML={{ __html: form.participantes || "________________________________" }} /></div>
            <div style={{ marginTop: 10 }}><strong>ORDEM DO DIA:</strong> <span dangerouslySetInnerHTML={{ __html: form.ordemDia }} /></div>

            <div style={{ marginTop: 20 }}>
              <strong>DISCUSSÕES E DELIBERAÇÕES:</strong>
              <div style={{ marginTop: 10 }} dangerouslySetInnerHTML={{ __html: form.decisoes || "<p>&nbsp;</p>" }} />
            </div>

            <p style={{ marginTop: 30 }}>
              Nada mais havendo a tratar, encerrou-se a reunião às{" "}
              <strong>{form.horarioEncerramento || "____:____"}</strong> horas.
            </p>

            <div style={{ marginTop: "80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "50px", textAlign: "center" }}>
              <div>
                <div style={{ borderTop: "1px solid #000", marginBottom: 5 }} />
                <strong>{form.presidente}</strong><br/>Presidente
              </div>
              <div>
                <div style={{ borderTop: "1px solid #000", marginBottom: 5 }} />
                <strong>{form.secretario || "________________"}</strong><br/>Secretário(a)
              </div>
            </div>
          </PagedPreview>
        </div>
      </section>

      <RegistrosDocumentoPanel
        registros={registros}
        loading={loadingReg}
        tipoLabel="Ata"
        onExcluir={excluir}
        onEditar={handleEditar}
      />
    </div>
  );
}