import { useRef, type CSSProperties } from "react";
import { X, Printer, FileText } from "lucide-react";
import type { Paroquia } from "@core/types/app.types";
import {
  gerarPDFFichaBatizando, gerarPDFFichaPadrinhos,
  gerarPDFCrisma, gerarPDFEucaristia, gerarPDFMatrimonio,
  gerarPDFUncao, gerarPDFObito,
} from "../utils/gerarPDFSacramental";

interface Props {
  tipo: string;
  nomePrincipal: string;
  dataSacramento: string;
  celebrante: string;
  comunidade: string;
  jsonDados: string;
  paroquia: Paroquia;
  onClose: () => void;
}

const TIPO_LABEL: Record<string, string> = {
  BATISMO: "Batismo", EUCARISTIA: "Primeira Eucaristia", CRISMA: "Crisma",
  MATRIMONIO: "Matrimonio", UNCAO: "Uncao dos Enfermos",
  OBITOS: "Obito e Exequias", OBITOS_EXEQUIAS: "Obito e Exequias",
};

const ex = (v?: string) => v?.trim() || "—";

function fmtDate(s?: string) {
  if (!s) return "—";
  try { return new Date(s + "T12:00:00").toLocaleDateString("pt-BR"); } catch { return s; }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1f3b73", borderBottom: "2px solid #e5e7eb", paddingBottom: 6, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Campo({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", minWidth: 200, flex: 1, marginBottom: 10, paddingRight: 16 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{ex(value)}</span>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 0" }}>{children}</div>;
}

function renderBatismo(raw: Record<string, unknown>) {
  const bat = (raw.batizando || raw) as Record<string, string>;
  const pad = raw.padrinhos as Record<string, string> | undefined;
  return (
    <>
      <Section title="Dados do Batizando(a)">
        <Grid>
          <Campo label="Nome" value={bat.nomeBatizando} />
          <Campo label="Data de Nascimento" value={fmtDate(bat.dataNascimento)} />
          <Campo label="Comunidade" value={bat.comunidade} />
          <Campo label="Data do Batismo" value={fmtDate(bat.dataBatismo)} />
          <Campo label="Celebrante" value={bat.celebrante} />
          <Campo label="Transferencia" value={bat.transferencia} />
          <Campo label="Livro" value={bat.livro} />
          <Campo label="Numero" value={bat.numeroFicha} />
          <Campo label="Pagina" value={bat.pagina} />
          <Campo label="Inicio Formacao" value={fmtDate(bat.inicioFormacao)} />
          <Campo label="Termino Formacao" value={fmtDate(bat.terminoFormacao)} />
        </Grid>
      </Section>
      <Section title="Dados do Pai">
        <Grid>
          <Campo label="Nome" value={bat.paiNome} />
          <Campo label="Data Nascimento" value={fmtDate(bat.paiDataNasc)} />
          <Campo label="Nascido em" value={bat.paiNascidoEm} />
          <Campo label="Mae (Avo)" value={bat.paiMae} />
          <Campo label="Pai (Avo)" value={bat.paiPai} />
          <Campo label="Endereco" value={bat.paiEndereco} />
          <Campo label="Comunidade" value={bat.paiComunidade} />
          <Campo label="Telefone" value={bat.paiTelefone} />
        </Grid>
      </Section>
      <Section title="Dados da Mae">
        <Grid>
          <Campo label="Nome" value={bat.maeNome} />
          <Campo label="Data Nascimento" value={fmtDate(bat.maeDataNasc)} />
          <Campo label="Nascida em" value={bat.maeNascidoEm} />
          <Campo label="Mae (Avo)" value={bat.maeMae} />
          <Campo label="Pai (Avo)" value={bat.maePai} />
          <Campo label="Endereco" value={bat.maeEndereco} />
          <Campo label="Comunidade" value={bat.maeComunidade} />
          <Campo label="Telefone" value={bat.maeTelefone} />
        </Grid>
      </Section>
      <Section title="Participacao na Comunidade">
        <Grid>
          <Campo label="Frequenta celebracoes?" value={bat.frequentaAtividades} />
          <Campo label="Qual atividade?" value={bat.qualAtividade} />
          <Campo label="Membro de pastoral?" value={bat.membroPastoral} />
          <Campo label="Qual pastoral?" value={bat.qualPastoral} />
          <Campo label="Compromete-se a participar?" value={bat.seCompromete} />
          <Campo label="Contribui financeiramente?" value={bat.contribuiFinanceiramente} />
          <Campo label="Dizimista?" value={bat.eDizimista} />
          <Campo label="Razao do batismo" value={bat.razaoBatismo} />
        </Grid>
      </Section>
      {pad && (
        <>
          <Section title="Dados do Padrinho">
            <Grid>
              <Campo label="Nome" value={pad.padrinhoNome} />
              <Campo label="Data Nascimento" value={pad.padrinhoDataNasc} />
              <Campo label="Nascido em" value={pad.padrinhoNascidoEm} />
              <Campo label="Mae" value={pad.padrinhoMae} />
              <Campo label="Pai" value={pad.padrinhoPai} />
              <Campo label="Endereco" value={pad.padrinhoEnd} />
              <Campo label="Comunidade" value={pad.padrinhoComunidade} />
              <Campo label="Telefone" value={pad.padrinhoTel} />
              <Campo label="Batizado?" value={pad.padrinhoBatizado} />
              <Campo label="Eucaristia?" value={pad.padrinhoEucaristia} />
              <Campo label="Crisma?" value={pad.padrinhoCrisma} />
              <Campo label="Estado Civil" value={pad.padrinhoEstadoCivil} />
            </Grid>
          </Section>
          <Section title="Dados da Madrinha">
            <Grid>
              <Campo label="Nome" value={pad.madrinhaNome} />
              <Campo label="Data Nascimento" value={pad.madrinhaDataNasc} />
              <Campo label="Nascida em" value={pad.madrinhaNascidoEm} />
              <Campo label="Mae" value={pad.madrinhaMae} />
              <Campo label="Pai" value={pad.madrinhaPai} />
              <Campo label="Endereco" value={pad.madrinhaEnd} />
              <Campo label="Comunidade" value={pad.madrinhaComunidade} />
              <Campo label="Telefone" value={pad.madrinhaTel} />
              <Campo label="Batizada?" value={pad.madrinhaBatizado} />
              <Campo label="Eucaristia?" value={pad.madrinhaEucaristia} />
              <Campo label="Crisma?" value={pad.madrinhaCrisma} />
              <Campo label="Estado Civil" value={pad.madrinhaEstadoCivil} />
            </Grid>
          </Section>
        </>
      )}
    </>
  );
}

function renderCrisma(d: Record<string, string>) {
  return (
    <>
      <Section title="Dados Pessoais">
        <Grid>
          <Campo label="Nome" value={d.nome} />
          <Campo label="Data Nascimento" value={fmtDate(d.dataNasc)} />
          <Campo label="RG" value={d.rgCpf} />
          <Campo label="CPF" value={d.cpf} />
          <Campo label="Estado Civil" value={d.estadoCivilCrismando} />
          <Campo label="Escolaridade" value={d.escolaridade} />
          <Campo label="Paroquia" value={d.paroquiaAtual} />
          <Campo label="Endereco" value={d.endereco} />
          <Campo label="Telefone" value={d.tel} />
          <Campo label="E-mail" value={d.email} />
        </Grid>
      </Section>
      <Section title="Dados Sacramentais">
        <Grid>
          <Campo label="Data do Batismo" value={fmtDate(d.dataBatismo)} />
          <Campo label="Local do Batismo" value={d.localBatismo} />
          <Campo label="Data da Eucaristia" value={fmtDate(d.dataEucaristia)} />
          <Campo label="Local da Eucaristia" value={d.localEucaristia} />
          <Campo label="Certidao de Batismo" value={d.certidaoBatismo} />
          <Campo label="Certidao de Eucaristia" value={d.certidaoEucaristia} />
        </Grid>
      </Section>
      <Section title="Familia">
        <Grid>
          <Campo label="Mae" value={d.mae} />
          <Campo label="Pai" value={d.pai} />
          <Campo label="Responsavel" value={d.responsavel} />
          <Campo label="Estado Civil dos Pais" value={d.estadoCivilPais} />
        </Grid>
      </Section>
      <Section title="Padrinho / Madrinha">
        <Grid>
          <Campo label="Padrinho" value={d.padrinho} />
          <Campo label="Madrinha" value={d.madrinha} />
          <Campo label="Taxa (R$)" value={d.valorTaxa} />
        </Grid>
      </Section>
    </>
  );
}

function renderEucaristia(d: Record<string, string>) {
  return (
    <Section title="Dados da Primeira Eucaristia">
      <Grid>
        <Campo label="Nome" value={d.nome} />
        <Campo label="Comunidade" value={d.comunidade} />
        <Campo label="Turma" value={d.turma} />
        <Campo label="Catequista" value={d.catequista} />
        <Campo label="Data da Comunhao" value={fmtDate(d.dataComunhao)} />
        <Campo label="Local" value={d.local} />
        <Campo label="Observacoes" value={d.obs} />
      </Grid>
    </Section>
  );
}

function renderMatrimonio(d: Record<string, string>) {
  return (
    <>
      <Section title="Dados do Noivo">
        <Grid>
          <Campo label="Nome" value={d.noivoNome} />
          <Campo label="Pai" value={d.noivoPai} />
          <Campo label="Mae" value={d.noivoMae} />
          <Campo label="Data Nascimento" value={fmtDate(d.noivoDataNasc)} />
          <Campo label="Local Nascimento" value={d.noivoLocalNasc} />
          <Campo label="Data Batismo" value={fmtDate(d.noivoDataBatismo)} />
          <Campo label="Paroquia Batismo" value={d.noivoParoquiaBatismo} />
          <Campo label="Livro/Folha/Num" value={[d.noivoLivroBat, d.noivoFolhaBat, d.noivoNumBat].filter(Boolean).join(" / ")} />
          <Campo label="Estado Civil" value={d.noivoEstadoCivil} />
          <Campo label="Endereco" value={[d.noivoEndRua, d.noivoEndNum, d.noivoEndBairro, d.noivoEndCidade].filter(Boolean).join(", ")} />
          <Campo label="Telefone" value={d.noivoFone} />
        </Grid>
      </Section>
      <Section title="Dados da Noiva">
        <Grid>
          <Campo label="Nome" value={d.noivaNome} />
          <Campo label="Pai" value={d.noivaPai} />
          <Campo label="Mae" value={d.noivaMae} />
          <Campo label="Data Nascimento" value={fmtDate(d.noivaDataNasc)} />
          <Campo label="Local Nascimento" value={d.noivaLocalNasc} />
          <Campo label="Data Batismo" value={fmtDate(d.noivaDataBatismo)} />
          <Campo label="Paroquia Batismo" value={d.noivaParoquiaBatismo} />
          <Campo label="Livro/Folha/Num" value={[d.noivaLivroBat, d.noivaFolhaBat, d.noivaNumBat].filter(Boolean).join(" / ")} />
          <Campo label="Estado Civil" value={d.noivaEstadoCivil} />
          <Campo label="Endereco" value={[d.noivaEndRua, d.noivaEndNum, d.noivaEndBairro, d.noivaEndCidade].filter(Boolean).join(", ")} />
          <Campo label="Telefone" value={d.noivaFone} />
        </Grid>
      </Section>
      <Section title="Celebracao e Registro">
        <Grid>
          <Campo label="Dia" value={d.celDia || d.ataDia} />
          <Campo label="Hora" value={d.celHora || d.ataHora} />
          <Campo label="Local" value={d.celLocal || d.ataLocal} />
          <Campo label="Celebrante" value={d.ataCelebrante} />
          <Campo label="Livro" value={d.livroReg} />
          <Campo label="Folha" value={d.folhaReg} />
          <Campo label="Numero" value={d.numReg} />
          <Campo label="Observacoes" value={d.celObservacoes} />
        </Grid>
      </Section>
      {(d.test1Nome || d.test2Nome) && (
        <Section title="Testemunhas">
          <Grid>
            {[1,2,3,4,5,6].map(i => d[`test${i}Nome`] && (
              <Campo key={i} label={`${i}a Testemunha`} value={d[`test${i}Nome`]} />
            ))}
          </Grid>
        </Section>
      )}
    </>
  );
}

function renderUncao(d: Record<string, string>) {
  return (
    <Section title="Dados da Uncao dos Enfermos">
      <Grid>
        <Campo label="Nome" value={d.nome} />
        <Campo label="Endereco" value={d.endereco} />
        <Campo label="Telefone" value={d.telefone} />
        <Campo label="Comunidade" value={d.comunidade || d.comunidadeManual} />
        <Campo label="Data da Visita" value={fmtDate(d.dataVisita)} />
        <Campo label="Visitante" value={d.visitante} />
        <Campo label="Anotacoes" value={d.anotacoes} />
      </Grid>
    </Section>
  );
}

function renderObito(d: Record<string, string>) {
  return (
    <Section title="Dados do Obito e Exequias">
      <Grid>
        <Campo label="Nome" value={d.nome} />
        <Campo label="Data Nascimento" value={fmtDate(d.dataNasc)} />
        <Campo label="Data Falecimento" value={fmtDate(d.dataFalecimento)} />
        <Campo label="Data Exequias" value={fmtDate(d.dataExequias)} />
        <Campo label="Local" value={d.local} />
        <Campo label="Ministro" value={d.ministro} />
        <Campo label="Cemiterio" value={d.cemiterio} />
        <Campo label="Comunidade" value={d.comunidade} />
        <Campo label="Observacoes" value={d.observacoes || d.obs} />
      </Grid>
    </Section>
  );
}

function renderGeneric(d: Record<string, unknown>) {
  const entries = Object.entries(d).filter(([, v]) => typeof v === "string" && (v as string).trim());
  return (
    <Section title="Dados do Sacramento">
      <Grid>
        {entries.map(([k, v]) => (
          <Campo key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())} value={v as string} />
        ))}
      </Grid>
    </Section>
  );
}

const overlay: CSSProperties = {
  position: "fixed", inset: 0, zIndex: 9999,
  background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const modal: CSSProperties = {
  background: "#fff", borderRadius: 20, width: "90vw", maxWidth: 900,
  maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
  boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
};

const header: CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "18px 24px", borderBottom: "1px solid #e5e7eb",
  background: "linear-gradient(135deg, #1f3b73 0%, #2d4a8c 100%)", color: "#fff",
};

const btnAction: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 16px", borderRadius: 10, border: "none",
  fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all .15s ease",
  fontFamily: "inherit",
};

export function FichaCompletaModal({ tipo, nomePrincipal, dataSacramento, celebrante, comunidade, jsonDados, paroquia, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  let raw: Record<string, unknown> = {};
  try { raw = JSON.parse(jsonDados || "{}"); } catch {}

  const tipoUpper = tipo.toUpperCase();

  const renderConteudo = () => {
    switch (tipoUpper) {
      case "BATISMO": return renderBatismo(raw);
      case "CRISMA": return renderCrisma(raw as Record<string, string>);
      case "EUCARISTIA": return renderEucaristia(raw as Record<string, string>);
      case "MATRIMONIO": return renderMatrimonio(raw as Record<string, string>);
      case "UNCAO": case "UNCAO_ENFERMOS": return renderUncao(raw as Record<string, string>);
      case "OBITOS": case "OBITOS_EXEQUIAS": return renderObito(raw as Record<string, string>);
      default: return renderGeneric(raw);
    }
  };

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Ficha - ${nomePrincipal}</title>
      <style>
        * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        body { padding: 32px; color: #111827; }
        h2 { font-size: 16px; color: #1f3b73; margin-bottom: 4px; }
        h3 { font-size: 12px; font-weight: 700; color: #1f3b73; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .campo { display: inline-flex; flex-direction: column; min-width: 200px; flex: 1; margin-bottom: 8px; padding-right: 12px; }
        .campo-label { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px; }
        .campo-value { font-size: 12px; color: #111827; font-weight: 500; }
        .grid { display: flex; flex-wrap: wrap; }
        .header-info { margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #1f3b73; }
        .header-info p { font-size: 11px; color: #6b7280; }
        @media print { body { padding: 16px; } }
      </style></head><body>
      <div class="header-info">
        <h2>${paroquia.nome}</h2>
        <p>${TIPO_LABEL[tipoUpper] || tipo} &mdash; ${nomePrincipal}</p>
        <p>Data: ${fmtDate(dataSacramento)} &bull; Celebrante: ${ex(celebrante)} &bull; Comunidade: ${ex(comunidade)}</p>
        <p style="margin-top:4px;font-size:10px;">Emitido em: ${new Date().toLocaleDateString("pt-BR")}</p>
      </div>
      ${el.innerHTML}
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  };

  const handlePDF = async () => {
    const fonte = "Arial";
    const d = raw as Record<string, string>;
    const comunidadeEfetiva = comunidade || d.comunidade || d.comunidadeManual || "";
    try {
      switch (tipoUpper) {
        case "BATISMO": {
          const bat = (raw.batizando || raw) as Record<string, string>;
          const pad = raw.padrinhos as Record<string, string> | undefined;
          await gerarPDFFichaBatizando(paroquia, bat as never, fonte);
          if (pad) await gerarPDFFichaPadrinhos(paroquia, pad as never, fonte);
          break;
        }
        case "CRISMA": await gerarPDFCrisma(paroquia, d, fonte); break;
        case "EUCARISTIA": await gerarPDFEucaristia(paroquia, d, fonte); break;
        case "MATRIMONIO": await gerarPDFMatrimonio(paroquia, d, fonte); break;
        case "UNCAO": case "UNCAO_ENFERMOS": await gerarPDFUncao(paroquia, d, comunidadeEfetiva, fonte); break;
        case "OBITOS": case "OBITOS_EXEQUIAS": await gerarPDFObito(paroquia, d, comunidadeEfetiva, fonte); break;
      }
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
    }
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={header}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{TIPO_LABEL[tipoUpper] || tipo}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{nomePrincipal} &mdash; {fmtDate(dataSacramento)}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button data-action="print-ficha" onClick={handlePrint} style={{ ...btnAction, background: "rgba(255,255,255,0.15)", color: "#fff" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}>
              <Printer size={14} /> Imprimir
            </button>
            <button data-action="pdf-ficha" onClick={handlePDF} style={{ ...btnAction, background: "#22c55e", color: "#fff" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#16a34a")}
              onMouseLeave={e => (e.currentTarget.style.background = "#22c55e")}>
              <FileText size={14} /> Gerar PDF
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
          {/* Info do registro */}
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", fontSize: 12 }}>
              <div><span style={{ color: "#6b7280", fontWeight: 600 }}>Paroquia:</span> {paroquia.nome}</div>
              <div><span style={{ color: "#6b7280", fontWeight: 600 }}>Comunidade:</span> {ex(comunidade)}</div>
              <div><span style={{ color: "#6b7280", fontWeight: 600 }}>Data:</span> {fmtDate(dataSacramento)}</div>
              <div><span style={{ color: "#6b7280", fontWeight: 600 }}>Celebrante:</span> {ex(celebrante)}</div>
              <div><span style={{ color: "#6b7280", fontWeight: 600 }}>Emissao:</span> {new Date().toLocaleDateString("pt-BR")}</div>
            </div>
          </div>

          <div ref={printRef}>
            {renderConteudo()}
          </div>
        </div>
      </div>
    </div>
  );
}
