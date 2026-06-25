import { useToast } from "@core/ui/Toast";
import { gerarPDFMatrimonio } from "../utils/gerarPDFSacramental";
/**
 * Localização: /src/modules/sacramental/pages/MatrimonioPage.tsx
 */
import { useState, type CSSProperties } from "react";
import { RegistrosList } from "../components/RegistrosList";
import { BuscarFielPastoral } from "../components/BuscarFielPastoral";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { SacramentalRepository } from '../repository/sacramental.repository';

interface MatrimonioPageProps {
  paroquia: Paroquia;
}

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
    marginTop: "36px",
    letterSpacing: "-0.02em",
  },

  subTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#475467",
    marginBottom: "16px",
    marginTop: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },

  row2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
  },

  buttonGroup: {
    display: "flex",
    gap: "14px",
    marginTop: "40px",
  },

  btnRegistrar: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white",
    padding: "14px 24px",
    borderRadius: "16px",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    flex: 1,
    boxShadow: "0 10px 25px rgba(34,197,94,0.25)",
    transition: "all .2s ease",
  },

  btnImprimir: {
    background: "linear-gradient(135deg, #1f3b73, #375dfb)",
    color: "white",
    padding: "14px 24px",
    borderRadius: "16px",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    flex: 1,
    boxShadow: "0 10px 25px rgba(31,59,115,0.22)",
    transition: "all .2s ease",
  },

  tabBtn: {
    background: "rgba(255,255,255,0.8)",
    color: "#1f3b73",
    padding: "12px 18px",
    borderRadius: "14px",
    border: "1px solid rgba(203,213,225,0.7)",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all .2s ease",
    boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
  },
};

export function MatrimonioPage({ paroquia }: MatrimonioPageProps) {
  const { showToast } = useToast();
  const [aba, setAba] = useState<'noivos' | 'entrevista' | 'processo' | 'ata'>('noivos');
  const [fonteDocumento, setFonteDocumento] = useState("Arial");
  const [busca, setBusca] = useState("");
  const [recarregarKey, setRecarregarKey] = useState(0);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [fielId, setFielId] = useState<number | null>(null);

  // ESTADO GIGANTE PARA ARMAZENAR TODOS OS CAMPOS DA FICHA
  const [dados, setDados] = useState({
    // --- NOIVO ---
    noivoNome: "", noivoPai: "", noivoMae: "", noivoDataNasc: "", noivoLocalNasc: "", noivoDataBatismo: "", noivoParoquiaBatismo: "",
    noivoLivroBat: "", noivoFolhaBat: "", noivoNumBat: "", noivoEstadoCivil: "Solteiro", noivoViuvoDe: "", noivoDataObitoViuvo: "",
    noivoCidadeCivil: "", noivoArqCivil: "", noivoEndRua: "", noivoEndNum: "", noivoEndBairro: "", noivoEndCidade: "", noivoFone: "",
    
    // --- NOIVA ---
    noivaNome: "", noivaPai: "", noivaMae: "", noivaDataNasc: "", noivaLocalNasc: "", noivaDataBatismo: "", noivaParoquiaBatismo: "",
    noivaLivroBat: "", noivaFolhaBat: "", noivaNumBat: "", noivaEstadoCivil: "Solteira", noivaViuvoDe: "", noivaDataObitoViuvo: "",
    noivaCidadeCivil: "", noivaArqCivil: "", noivaEndRua: "", noivaEndNum: "", noivaEndBairro: "", noivaEndCidade: "", noivaFone: "",
    
    // --- PROCLAMAS E CELEBRAÇÃO ---
    proc1: "", proc2: "", proc3: "",
    celDia: "", celHora: "", celLocal: "", efeitoCivil: "Não", celObservacoes: "",
    civilCartorio: "", civilOficio: "", civilData: "",

    // --- ENTREVISTA NOIVO ---
    entNoivo1: "Sim", entNoivo2: "Sim", entNoivo3: "Sim", entNoivo4: "Sim", entNoivo5: "Sim", entNoivo6: "Não", entNoivo7: "Não",
    // --- ENTREVISTA NOIVA ---
    entNoiva1: "Sim", entNoiva2: "Sim", entNoiva3: "Sim", entNoiva4: "Sim", entNoiva5: "Sim", entNoiva6: "Não", entNoiva7: "Não",
    
    // --- ENDEREÇO PÓS MATRIMÔNIO ---
    futRua: "", futNum: "", futBairro: "", futFone: "", futCidade: "",
    
    // --- OUTRAS INFORMAÇÕES (DISPENSAS E TRANSFERÊNCIA) ---
    autorizacaoPadre: "", transfParoquia: "", dispensasObtidas: "",
    docBatismo: "Não", docCurso: "Não", docOutros: "", documentoRetirado: "Não",
    
    // --- ATA DA CELEBRAÇÃO ---
    ataDia: "", ataMes: "", ataAno: "", ataHora: "", ataLocal: "", ataCelebrante: "",
    livroReg: "", folhaReg: "", numReg: "",
    test1Nome: "", test1End: "", test2Nome: "", test2End: "", test3Nome: "", test3End: "",
    test4Nome: "", test4End: "", test5Nome: "", test5End: "", test6Nome: "", test6End: ""
  });

  const atualizar = (campo: keyof typeof dados, valor: string) => {
    setDados(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSalvar = async () => {
    if (!dados.noivoNome && !dados.noivaNome) {
      showToast("Preencha o nome dos noivos.", "error"); return;
    }
    try {
      const jsonDados = JSON.stringify(dados);
      const result = await SacramentalRepository.registros.upsert(
        "MATRIMONIO",
        `${dados.noivoNome} & ${dados.noivaNome}`,
        dados.celDia, dados.ataCelebrante, dados.celLocal, jsonDados,
        editandoId !== null ? editandoId : undefined,
        fielId ?? undefined
      );
      if (result.duplicado) {
        showToast("Este fiel já possui um registro ativo para este sacramento.", "error");
        return;
      }
      setRecarregarKey(k => k + 1);
      showToast(editandoId !== null ? "Habilitação matrimonial atualizada com sucesso!" : "Habilitação matrimonial salva com sucesso!", "success");
    } catch (e) {
      console.error("Erro ao salvar matrimônio:", e);
      showToast("Erro ao salvar. Tente novamente.", "error");
    }
  };

  const renderInput = (label: string, campo: keyof typeof dados, placeholder = "", type = "text") => (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} type={type} placeholder={placeholder} value={dados[campo]} onChange={e => atualizar(campo, e.target.value)} autoComplete="off" />
    </div>
  );

  const renderSelect = (label: string, campo: keyof typeof dados, options: string[]) => (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <select style={styles.select} value={dados[campo]} onChange={e => atualizar(campo, e.target.value)}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  return (
    <div style={styles.container}>
      <style>{`
        @media screen { .area-impressao { display: none; } }
      `}</style>

      <div className="no-print">
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <input style={{ flex: 1, padding: "14px 16px", borderRadius: "16px", border: "1px solid rgba(31,59,115,0.15)", background: "rgba(255,255,255,0.85)", fontSize: "14px", outline: "none", boxSizing: "border-box" as const }} placeholder="🔍 Buscar noivos por nome..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button onClick={() => { setDados(d => ({ ...d, noivoNome: "", noivaNome: "" })); setEditandoId(null); }} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", padding: "14px 20px", borderRadius: "16px", border: "none", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>+ Novo</button>
        </div>

        <RegistrosList
          tipo="MATRIMONIO"
          busca={busca}
          recarregarKey={recarregarKey}
          onExcluir={() => { setEditandoId(null); }}
          onSelecionar={(d, registro) => { setEditandoId(registro.id); setDados(prev => ({ ...prev, ...(d as Record<string, string>) })); }}
        />
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <BuscarFielPastoral onSelecionar={f => { setDados(d => ({ ...d, noivoNome: f.nome, noivoEndRua: f.endereco || d.noivoEndRua, noivoFone: f.telefone || d.noivoFone })); setFielId(f.id); }} label="Buscar Noivo no Módulo Pastoral" />
          </div>
          <div style={{ flex: 1 }}>
            <BuscarFielPastoral onSelecionar={f => setDados(d => ({ ...d, noivaNome: f.nome, noivaEndRua: f.endereco || d.noivaEndRua, noivaFone: f.telefone || d.noivaFone }))} label="Buscar Noiva no Módulo Pastoral" />
          </div>
        </div>
      </div>

      <div style={styles.formCard}>
        <h2 style={{ color: "#1f3b73", marginBottom: "10px" }}>Ficha de Habilitação Matrimonial</h2>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => setAba('noivos')} style={{ ...styles.tabBtn, background: aba === 'noivos' ? '#1f3b73' : '#eee', color: aba === 'noivos' ? 'white' : '#000' }}>1. Dados dos Noivos</button>
          <button onClick={() => setAba('entrevista')} style={{ ...styles.tabBtn, background: aba === 'entrevista' ? '#1f3b73' : '#eee', color: aba === 'entrevista' ? 'white' : '#000' }}>2. Entrevista</button>
          <button onClick={() => setAba('processo')} style={{ ...styles.tabBtn, background: aba === 'processo' ? '#1f3b73' : '#eee', color: aba === 'processo' ? 'white' : '#000' }}>3. Processo / Dispensas</button>
          <button onClick={() => setAba('ata')} style={{ ...styles.tabBtn, background: aba === 'ata' ? '#1f3b73' : '#eee', color: aba === 'ata' ? 'white' : '#000' }}>4. Ata e Testemunhas</button>
        </div>
        
        <FontSelector fonteAtual={fonteDocumento} onChange={setFonteDocumento} />

        {/* ----------------- ABA 1: NOIVOS ----------------- */}
        {aba === 'noivos' && (
          <div>
            <h3 style={styles.sectionTitle}>Dados do Noivo (Ele)</h3>
            {renderInput("Nome Completo", "noivoNome")}
            <div style={styles.row2}>{renderInput("Nome do Pai", "noivoPai")} {
renderInput("Nome da Mãe", "noivoMae")}</div>
            <div style={styles.row2}>{renderInput("Data de Nascimento", "noivoDataNasc", "", "date")} {renderInput("Nascido em (Local)", "noivoLocalNasc")}</div>
            <div style={styles.row2}>{renderInput("Data do Batismo", "noivoDataBatismo", "", "date")} {renderInput("Paróquia de Batismo", "noivoParoquiaBatismo")}</div>
            <div style={styles.row}>{renderInput("Livro (Batismo)", "noivoLivroBat")} {renderInput("Folha", "noivoFolhaBat")} {renderInput("Número", "noivoNumBat")}</div>
            <div style={styles.row}>
              {renderSelect("Estado Civil", "noivoEstadoCivil", ["Solteiro", "Viúvo", "Divorciado"])}
              {renderInput("Se Viúvo, de quem?", "noivoViuvoDe")}
              {renderInput("Falecida aos", "noivoDataObitoViuvo", "", "date")}
            </div>
            <div style={styles.row2}>{renderInput("Cidade Atual", "noivoCidadeCivil")} {renderInput("Arquidiocese", "noivoArqCivil")}</div>
            <div style={styles.row2}>{renderInput("Endereço (Rua)", "noivoEndRua")} {renderInput("Número", "noivoEndNum")}</div>
            <div style={styles.row}>{renderInput("Bairro", "noivoEndBairro")} {renderInput("Cidade", "noivoEndCidade")} {renderInput("Telefone", "noivoFone")}</div>

            <h3 style={styles.sectionTitle}>Dados da Noiva (Ela)</h3>
            {renderInput("Nome Completo", "noivaNome")}
            <div style={styles.row2}>{renderInput("Nome do Pai", "noivaPai")} {renderInput("Nome da Mãe", "noivaMae")}</div>
            <div style={styles.row2}>{renderInput("Data de Nascimento", "noivaDataNasc", "", "date")} {renderInput("Nascida em (Local)", "noivaLocalNasc")}</div>
            <div style={styles.row2}>{renderInput("Data do Batismo", "noivaDataBatismo", "", "date")} {renderInput("Paróquia de Batismo", "noivaParoquiaBatismo")}</div>
            <div style={styles.row}>{renderInput("Livro (Batismo)", "noivaLivroBat")} {renderInput("Folha", "noivaFolhaBat")} {renderInput("Número", "noivaNumBat")}</div>
            <div style={styles.row}>
              {renderSelect("Estado Civil", "noivaEstadoCivil", ["Solteira", "Viúva", "Divorciada"])}
              {renderInput("Se Viúva, de quem?", "noivaViuvoDe")}
              {renderInput("Falecido aos", "noivaDataObitoViuvo", "", "date")}
            </div>
            <div style={styles.row2}>{renderInput("Cidade Atual", "noivaCidadeCivil")} {renderInput("Arquidiocese", "noivaArqCivil")}</div>
            <div style={styles.row2}>{renderInput("Endereço (Rua)", "noivaEndRua")} {renderInput("Número", "noivaEndNum")}</div>
            <div style={styles.row}>{renderInput("Bairro", "noivaEndBairro")} {renderInput("Cidade", "noivaEndCidade")} {renderInput("Telefone", "noivaFone")}</div>
          </div>
        )}

        {/* ----------------- ABA 2: ENTREVISTA ----------------- */}
        {aba === 'entrevista' && (
          <div>
            <div style={styles.row2}>
              {/* ENTREVISTA NOIVO */}
              <div style={{ padding: "15px", border: "1px solid #eaecf0", borderRadius: "8px" }}>
                <h3 style={styles.subTitle}>Entrevista do Noivo</h3>
                {renderSelect("1.1 Consciente da importância do sacramento?", "entNoivo1", ["Sim", "Não"])}
                {renderSelect("1.2 Aceita a indissolubilidade (para sempre)?", "entNoivo2", ["Sim", "Não"])}
                {renderSelect("1.3 Assume a educação dos filhos na fé?", "entNoivo3", ["Sim", "Não"])}
                {renderSelect("1.4 Fez a Primeira Eucaristia?", "entNoivo4", ["Sim", "Não"])}
                {renderSelect("1.5 É Crismado?", "entNoivo5", ["Sim", "Não"])}
                {renderSelect("1.6 Já houve anterior matrimônio religioso?", "entNoivo6", ["Não", "Sim"])}
                {renderSelect("1.7 Há algum impedimento Canônico?", "entNoivo7", ["Não", "Sim"])}
              </div>
              {/* ENTREVISTA NOIVA */}
              <div style={{ padding: "15px", border: "1px solid #eaecf0", borderRadius: "8px" }}>
                <h3 style={styles.subTitle}>Entrevista da Noiva</h3>
                {renderSelect("1.1 Consciente da importância do sacramento?", "entNoiva1", ["Sim", "Não"])}
                {renderSelect("1.2 Aceita a indissolubilidade (para sempre)?", "entNoiva2", ["Sim", "Não"])}
                {renderSelect("1.3 Assume a educação dos filhos na fé?", "entNoiva3", ["Sim", "Não"])}
                {renderSelect("1.4 Fez a Primeira Eucaristia?", "entNoiva4", ["Sim", "Não"])}
                {renderSelect("1.5 É Crismada?", "entNoiva5", ["Sim", "Não"])}
                {renderSelect("1.6 Já houve anterior matrimônio religioso?", "entNoiva6", ["Não", "Sim"])}
                {renderSelect("1.7 Há algum impedimento Canônico?", "entNoiva7", ["Não", "Sim"])}
              </div>
            </div>

            <h3 style={styles.sectionTitle}>Endereço dos Nubentes Após o Matrimônio</h3>
            <div style={styles.row2}>{renderInput("Rua", "futRua")} {renderInput("Número", "futNum")}</div>
            <div style={styles.row}>{renderInput("Bairro", "futBairro")} {renderInput("Cidade", "futCidade")} {renderInput("Telefone", "futFone")}</div>
          </div>
        )}

        {/* ----------------- ABA 3: PROCESSO ----------------- */}
        {aba === 'processo' && (
          <div>
            <h3 style={styles.sectionTitle}>Proclamas e Celebração</h3>
            <div style={styles.row}>{renderInput("1ª Publicação", "proc1", "", "date")} {renderInput("2ª Publicação", "proc2", "", "date")} {renderInput("3ª Publicação", "proc3", "", "date")}</div>
            <div style={styles.row}>{renderInput("Dia do Matrimônio", "celDia", "", "date")} {renderInput("Hora", "celHora", "Ex: 19:30")} {renderInput("Local", "celLocal")}</div>
            <div style={styles.row}>{renderSelect("Com Efeito Civil?", "efeitoCivil", ["Não", "Sim"])} {renderInput("Observações", "celObservacoes")}</div>
            
            <h3 style={styles.subTitle}>Habilitação Civil</h3>
            <div style={styles.row}>{renderInput("Cartório", "civilCartorio")} {renderInput("Ofício", "civilOficio")} {renderInput("Data", "civilData", "", "date")}</div>

            <h3 style={styles.sectionTitle}>Outras Informações (Dispensas e Documentos)</h3>
            <div style={styles.row2}>{renderInput("Autorização para outro Sacerdote (Nome Pe.)", "autorizacaoPadre")} {renderInput("Transferência para outra Paróquia (Nome Paróquia)", "transfParoquia")}</div>
            {renderInput("Dispensas Obtidas (Descreva)", "dispensasObtidas")}
            <div style={styles.row}>{renderSelect("Entregou Certidão Batismo?", "docBatismo", ["Não", "Sim"])} {renderSelect("Certificado Curso de Noivos?", "docCurso", ["Não", "Sim"])} {renderInput("Outros Documentos", "docOutros")}</div>
          </div>
        )}

        {/* ----------------- ABA 4: ATA E TESTEMUNHAS ----------------- */}
        {aba === 'ata' && (
          <div>
            <h3 style={styles.sectionTitle}>Ata da Celebração</h3>
            <div style={styles.row}>{renderInput("Dia (Ex: 15)", "ataDia")} {renderInput("Mês (Ex: Maio)", "ataMes")} {renderInput("Ano (Ex: 2026)", "ataAno")}</div>
            <div style={styles.row}>{renderInput("Hora (Ex: 19:00)", "ataHora")} {renderInput("Local da Celebração", "ataLocal")} {renderInput("Celebrante", "ataCelebrante")}</div>
            <div style={styles.row}>{renderInput("Registrado no Livro", "livroReg")} {renderInput("Folha", "folhaReg")} {renderInput("Número", "numReg")}</div>

            <h3 style={styles.sectionTitle}>Testemunhas (Até 6)</h3>
            <div style={styles.row2}>{renderInput("1. Nome", "test1Nome")} {renderInput("Endereço", "test1End")}</div>
            <div style={styles.row2}>{renderInput("2. Nome", "test2Nome")} {renderInput("Endereço", "test2End")}</div>
            <div style={styles.row2}>{renderInput("3. Nome", "test3Nome")} {renderInput("Endereço", "test3End")}</div>
            <div style={styles.row2}>{renderInput("4. Nome", "test4Nome")} {renderInput("Endereço", "test4End")}</div>
            <div style={styles.row2}>{renderInput("5. Nome", "test5Nome")} {renderInput("Endereço", "test5End")}</div>
            <div style={styles.row2}>{renderInput("6. Nome", "test6Nome")} {renderInput("Endereço", "test6End")}</div>
          </div>
        )}

        <div style={styles.row}>
          <div style={styles.fieldGroup}><label style={styles.label}>Documento Retirado?</label><select style={styles.input} value={dados.documentoRetirado || "Não"} onChange={e => atualizar('documentoRetirado', e.target.value)}><option value="Não">Não</option><option value="Sim">Sim</option></select></div>
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.btnRegistrar} onClick={handleSalvar}>{editandoId ? "💾 Atualizar" : "Salvar Matrimônio"}</button>
          {editandoId && <button onClick={() => setEditandoId(null)} style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #d0d5dd", color: "#475467", borderRadius: "16px", cursor: "pointer", padding: "14px 20px", fontWeight: 700 }}>✕ Cancelar Edição</button>}
          <button style={styles.btnImprimir} onClick={() => gerarPDFMatrimonio(paroquia, dados as Record<string, string>, fonteDocumento)}>Imprimir Ficha Completa</button>
        </div>
      </div>

      {/* =========================================================================
          ÁREA DE IMPRESSÃO (REPLICANDO O PDF FÍSICO COM ALTA FIDELIDADE)
          ========================================================================= */}
      <div id="area-matrimonio-print" className="area-impressao">
  <div style={{ fontFamily: fonteDocumento, lineHeight: '1.5' }}>
    
    {/* ---- PÁGINA 1: HABILITAÇÃO E PROCLAMAS ---- */}
    <div className="page-break">
      
      {/* AQUI ENTRA O HEADER COM A LOGO */}
      <DocumentHeader paroquia={paroquia} />

      {/* Título ajustado para não repetir o nome da paróquia que já está no header */}
      <h2 style={{ textAlign: 'center', margin: '20px 0 10px 0', textDecoration: 'underline' }}>
        HABILITAÇÃO MATRIMONIAL
      </h2>
      
      <h3 style={{ borderBottom: '2px solid #000', marginTop: '30px' }}>PROCLAMAS</h3>
      <p>Com o favor de Deus e da Santa Madre Igreja querem casar-se:</p>
      {/* ... restante do seu código de impressão ... */}

            {/* DADOS DO NOIVO (ELE) */}
            <div style={{ marginBottom: '20px' }}>
              <strong>Ele</strong> filho de <span className="print-line">{dados.noivoPai || "____________________________________"}</span> e <span className="print-line">{dados.noivoMae || "____________________________________"}</span><br/>
              nascido a <span className="print-line">{dados.noivoDataNasc || "____________"}</span> 
              em <span className="print-line">{dados.noivoLocalNasc || "__________________________________"}</span><br/> 
              e batizado a <span className="print-line">{dados.noivoDataBatismo || "____________"}</span> 
              na Paróquia de <span className="print-line">{dados.noivoParoquiaBatismo || "__________________________________________"}</span><br/>
              Liv. <span className="print-line">{dados.noivoLivroBat || "________"}</span> 
              Folha <span className="print-line">{dados.noivoFolhaBat || "________"}</span> 
              Nº <span className="print-line">{dados.noivoNumBat || "________"}</span><br/>
              estado civil: <span className="print-line">{dados.noivoEstadoCivil}</span> 
              {dados.noivoEstadoCivil === 'Viúvo' && ` de ${dados.noivoViuvoDe || "_____________________"}, falecida aos ${dados.noivoDataObitoViuvo || "___/___/___"}`}<br/>
              cidade <span className="print-line">{dados.noivoCidadeCivil || "_____________________"}</span> Arquidiocese <span className="print-line">{dados.noivoArqCivil || "_____________________"}</span><br/>
              Residente à <span className="print-line">{dados.noivoEndRua || "__________________________________________"}</span> 
              nº <span className="print-line">{dados.noivoEndNum || "____"}</span> 
              Bairro <span className="print-line">{dados.noivoEndBairro || "____________________"}</span><br/>
              Cidade <span className="print-line">{dados.noivoEndCidade || "_________________________"}</span> 
              Fone <span className="print-line">{dados.noivoFone || "___________________"}</span>
            </div>

            {/* DADOS DA NOIVA (ELA) */}
            <div style={{ marginBottom: '30px' }}>
              <strong>Ela</strong> filha de <span className="print-line">{dados.noivaPai || "____________________________________"}</span> e <span className="print-line">{dados.noivaMae || "____________________________________"}</span><br/>
              nascida a <span className="print-line">{dados.noivaDataNasc || "____________"}</span> 
              em <span className="print-line">{dados.noivaLocalNasc || "__________________________________"}</span><br/> 
              e batizada a <span className="print-line">{dados.noivaDataBatismo || "____________"}</span> 
              na Paróquia de <span className="print-line">{dados.noivaParoquiaBatismo || "__________________________________________"}</span><br/>
              Liv. <span className="print-line">{dados.noivaLivroBat || "________"}</span> 
              Folha <span className="print-line">{dados.noivaFolhaBat || "________"}</span> 
              Nº <span className="print-line">{dados.noivaNumBat || "________"}</span><br/>
              estado civil: <span className="print-line">{dados.noivaEstadoCivil}</span> 
              {dados.noivaEstadoCivil === 'Viúva' && ` de ${dados.noivaViuvoDe || "_____________________"}, falecido aos ${dados.noivaDataObitoViuvo || "___/___/___"}`}<br/>
              cidade <span className="print-line">{dados.noivaCidadeCivil || "_____________________"}</span> Arquidiocese <span className="print-line">{dados.noivaArqCivil || "_____________________"}</span><br/>
              Residente à <span className="print-line">{dados.noivaEndRua || "__________________________________________"}</span> 
              nº <span className="print-line">{dados.noivaEndNum || "____"}</span> 
              Bairro <span className="print-line">{dados.noivaEndBairro || "____________________"}</span><br/>
              Cidade <span className="print-line">{dados.noivaEndCidade || "_________________________"}</span> 
              Fone <span className="print-line">{dados.noivaFone || "___________________"}</span>
            </div>

            <h3 style={{ borderBottom: '2px solid #000' }}>PROCLAMAS E MATRIMÔNIO</h3>
            <p>
              1ª Publicação no dia <span className="print-line">{dados.proc1 || "___/___/___"}</span> &nbsp;&nbsp;&nbsp;
              2ª Publicação no dia <span className="print-line">{dados.proc2 || "___/___/___"}</span> &nbsp;&nbsp;&nbsp;
              3ª Publicação no dia <span className="print-line">{dados.proc3 || "___/___/___"}</span>
            </p>
            <p>
              <strong>MATRIMÔNIO</strong> Dia <span className="print-line">{dados.celDia || "_____________________"}</span> 
              Hora <span className="print-line">{dados.celHora || "_________"}</span><br/>
              Local <span className="print-line" style={{width: '80%'}}>{dados.celLocal || "________________________________________________________________"}</span><br/>
              Com efeito civil: [ {dados.efeitoCivil === 'Sim' ? 'X' : ' '} ] Sim &nbsp;&nbsp; [ {dados.efeitoCivil === 'Não' ? 'X' : ' '} ] Não<br/>
              Observações: <span className="print-line" style={{width: '70%'}}>{dados.celObservacoes || "______________________________________________________"}</span>
            </p>
            <p>
              Apresentaram Certidão de Habilitação civil do Cartório <span className="print-line">{dados.civilCartorio || "__________________________"}</span><br/>
              Ofício datada de <span className="print-line">{dados.civilData || "___/___/___"}</span>
            </p>
            <div style={{ border: '1px solid #000', padding: '15px', marginTop: '30px', textAlign: 'center' }}>
              <p>Feitos os proclamas e demais diligências,</p>
              <strong>CERTIFICO que os nubentes estão habilitados para receberem-se em matrimônio, em face da Igreja.</strong>
              <p style={{ marginTop: '40px' }}>
                <span className="print-line" style={{width: '200px'}}></span>, <span className="print-line">{new Date().toLocaleDateString()}</span><br/>
                <strong>Pároco</strong>
              </p>
            </div>
          </div>

          {/* ---- PÁGINA 2: ENTREVISTAS E OUTRAS INFORMAÇÕES ---- */}
          <div className="page-break">
            <h2 style={{ textAlign: 'center', borderBottom: '2px solid #000' }}>PREPARAÇÃO PARA O MATRIMÔNIO</h2>
            
            {/* ENTREVISTA NOIVO */}
            <div style={{ marginBottom: '20px' }}>
              <h3>1. Entrevista do Noivo</h3>
              <p>Nome: <span className="print-line" style={{width: '70%'}}>{dados.noivoNome || "______________________________________________________"}</span></p>
              <table className="print-table">
                <tbody>
                  <tr><td width="85%">1.1. O Matrimônio religioso é um sacramento instituído por Jesus Cristo... Você está consciente?</td><td align="center">{dados.entNoivo1}</td></tr>
                  <tr><td>1.2. Você aceita a indissolubilidade do matrimônio religioso (para sempre)?</td><td align="center">{dados.entNoivo2}</td></tr>
                  <tr><td>1.3. Você assume a educação dos filhos como principal educador na fé?</td><td align="center">{dados.entNoivo3}</td></tr>
                  <tr><td>1.4. Você fez a primeira Eucaristia?</td><td align="center">{dados.entNoivo4}</td></tr>
                  <tr><td>1.5. Você é crismado?</td><td align="center">{dados.entNoivo5}</td></tr>
                  <tr><td>1.6. Já houve anterior matrimônio religioso?</td><td align="center">{dados.entNoivo6}</td></tr>
                  <tr><td>1.7. Há algum impedimento Canônico?</td><td align="center">{dados.entNoivo7}</td></tr>
                </tbody>
              </table>
              <div style={{ textAlign: 'right', marginTop: '30px', paddingRight: '50px' }}>
                <span className="print-line" style={{width: '250px'}}></span><br/>Assinatura do noivo
              </div>
            </div>

            {/* ENTREVISTA NOIVA */}
            <div style={{ marginBottom: '30px' }}>
              <h3>2. Entrevista da Noiva</h3>
              <p>Nome: <span className="print-line" style={{width: '70%'}}>{dados.noivaNome || "______________________________________________________"}</span></p>
              <table className="print-table">
                <tbody>
                  <tr><td width="85%">1.1. O Matrimônio religioso é um sacramento instituído por Jesus Cristo... Você está consciente?</td><td align="center">{dados.entNoiva1}</td></tr>
                  <tr><td>1.2. Você aceita a indissolubilidade do matrimônio religioso (para sempre)?</td><td align="center">{dados.entNoiva2}</td></tr>
                  <tr><td>1.3. Você assume a educação dos filhos como principal educadora na fé?</td><td align="center">{dados.entNoiva3}</td></tr>
                  <tr><td>1.4. Você fez a primeira Eucaristia?</td><td align="center">{dados.entNoiva4}</td></tr>
                  <tr><td>1.5. Você é crismada?</td><td align="center">{dados.entNoiva5}</td></tr>
                  <tr><td>1.6. Já houve anterior matrimônio religioso?</td><td align="center">{dados.entNoiva6}</td></tr>
                  <tr><td>1.7. Há algum impedimento Canônico?</td><td align="center">{dados.entNoiva7}</td></tr>
                </tbody>
              </table>
              <div style={{ textAlign: 'right', marginTop: '30px', paddingRight: '50px' }}>
                <span className="print-line" style={{width: '250px'}}></span><br/>Assinatura da noiva
              </div>
            </div>

            <div style={{ border: '1px solid #000', padding: '10px' }}>
              <strong>Endereço dos Nubentes após o matrimônio:</strong><br/>
              Rua <span className="print-line" style={{width: '50%'}}>{dados.futRua}</span> nº <span className="print-line">{dados.futNum}</span><br/>
              Bairro: <span className="print-line" style={{width: '30%'}}>{dados.futBairro}</span> Telefone: <span className="print-line">{dados.futFone}</span><br/>
              Cidade: <span className="print-line" style={{width: '50%'}}>{dados.futCidade}</span>
            </div>

            <h3 style={{ borderBottom: '2px solid #000', marginTop: '30px' }}>OUTRAS INFORMAÇÕES</h3>
            <p><strong>1. AUTORIZAÇÃO PARA OUTRO SACERDOTE:</strong> Autorizo o Revdo. Pe. <span className="print-line" style={{width: '40%'}}>{dados.autorizacaoPadre}</span> para abençoar o matrimônio...</p>
            <p><strong>2. TRANSFERÊNCIA PARA OUTRA PARÓQUIA:</strong> Autorizo que o matrimônio seja realizado na(o) <span className="print-line" style={{width: '40%'}}>{dados.transfParoquia}</span>...</p>
            <p><strong>3. DISPENSAS OBTIDAS:</strong> <span className="print-line" style={{width: '70%'}}>{dados.dispensasObtidas}</span></p>
            <p><strong>4. DOCUMENTOS ANEXOS:</strong> Certidão de Batismo: [{dados.docBatismo === 'Sim' ? 'X' : ' '}] | Certificado do Curso de Noivos: [{dados.docCurso === 'Sim' ? 'X' : ' '}] | Outros: {dados.docOutros}</p>
          </div>

          {/* ---- PÁGINA 3: ATA DA CELEBRAÇÃO ---- */}
          <div className="page-break" style={{ padding: '20px', border: '2px solid #000', minHeight: '800px' }}>
            <h2 style={{ textAlign: 'center', textDecoration: 'underline' }}>ATA DA CELEBRAÇÃO DO MATRIMÔNIO</h2>
            <p style={{ textAlign: 'justify', lineHeight: '2.0', marginTop: '30px' }}>
              Aos <span className="print-line">{dados.ataDia || "_____"}</span> dias do mês de <span className="print-line">{dados.ataMes || "_____________________"}</span> 
              do ano de <span className="print-line">{dados.ataAno || "_____________________"}</span>, às <span className="print-line">{dados.ataHora || "_____"}</span> horas, 
              nesta <span className="print-line" style={{width: '40%'}}>{dados.ataLocal || "__________________________________________________"}</span>, 
              depois de satisfeitas as prescrições dos Sagrados Cânones e na forma do Ritual da Igreja, em presença do Revdo. Sr. <span className="print-line" style={{width: '50%'}}>{dados.ataCelebrante || "__________________________________________________"}</span> 
              e das testemunhas abaixo mencionadas, receberam-se em matrimônio:<br/><br/>
              <span className="print-line" style={{width: '100%', fontWeight: 'bold'}}>{dados.noivoNome || "__________________________________________________________________________________________"}</span><br/>
              e<br/>
              <span className="print-line" style={{width: '100%', fontWeight: 'bold'}}>{dados.noivaNome || "__________________________________________________________________________________________"}</span><br/>
            </p>
            <p>Foi dada a bênção nupcial. E, para constar, vai a presente ata assinada pelo celebrante, pelos nubentes e pelas testemunhas.</p>

            <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div>O CELEBRANTE: <span className="print-line" style={{width: '70%'}}></span></div>
              <div>O NUBENTE: <span className="print-line" style={{width: '70%'}}></span></div>
              <div>A NUBENTE: <span className="print-line" style={{width: '70%'}}></span></div>
            </div>

            <h3 style={{ marginTop: '40px' }}>TESTEMUNHAS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {[1, 2, 3, 4, 5, 6].map(i => {
                const nomeKey = `test${i}Nome` as keyof typeof dados;
                const endKey = `test${i}End` as keyof typeof dados;
                return (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <span className="print-line" style={{width: '100%'}}>{dados[nomeKey] || "__________________________________________________"}</span><br/>
                    <span style={{ fontSize: '10pt' }}>Endereço: {dados[endKey] || "___________________________________________"}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '40px', borderTop: '1px solid #000', paddingTop: '10px', textAlign: 'center', fontSize: '10pt' }}>
              Matrimônio registrado no Livro <span className="print-line">{dados.livroReg || "_______"}</span> 
              Folha <span className="print-line">{dados.folhaReg || "_______"}</span> 
              Número <span className="print-line">{dados.numReg || "_______"}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MatrimonioPage;