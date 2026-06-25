import { useToast } from "@core/ui/Toast";
import type { DadosCrisma } from '../types';
import { gerarPDFCrisma } from "../utils/gerarPDFSacramental";
/**
 * Localização: /src/modules/sacramental/pages/CrismaPage.tsx
 */
import { useState, CSSProperties } from "react";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { SacramentalRepository } from '../repository/sacramental.repository';
import { RegistrosList } from "../components/RegistrosList";
import { BuscarFielPastoral } from "../components/BuscarFielPastoral";
import { ComunidadeSelect } from "../components/ComunidadeSelect";

interface CrismaPageProps { paroquia: Paroquia; }

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

  row: {
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

  obsBox: {
    background: "rgba(255,248,220,0.85)",
    border: "1px solid rgba(255,204,0,0.45)",
    padding: "18px",
    borderRadius: "18px",
    marginTop: "14px",
    fontSize: "13px",
    backdropFilter: "blur(10px)",
    color: "#7a5d00",
    lineHeight: 1.6,
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

  searchBox: {
  marginBottom: "24px",
  padding: "18px",
  background: "rgba(255,255,255,0.7)",
  borderRadius: "20px",
  border: "1px solid rgba(203,213,225,0.5)",
  display: "flex",
  gap: "12px",
  alignItems: "center",
  marginTop: "24px",
  backdropFilter: "blur(14px)",
  boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
},
};

const dadosVazios: DadosCrisma = {
  nome: "", dataNasc: "", rgCpf: "", cpf: "", endereco: "", tel: "", email: "", escolaridade: "", paroquiaAtual: "",
  dataBatismo: "", localBatismo: "", dataEucaristia: "", localEucaristia: "",
  mae: "", pai: "", responsavel: "", estadoCivilPais: "",
  padrinho: "", madrinha: "", estadoCivilCrismando: "", valorTaxa: "", certidaoBatismo: "", certidaoEucaristia: "", documentoRetirado: "Não"
};

export function CrismaPage({ paroquia }: CrismaPageProps) {
  const { showToast } = useToast();
  const [fonteDocumento, setFonteDocumento] = useState("Arial");
  const [busca, setBusca] = useState("");
  const [recarregarKey, setRecarregarKey] = useState(0);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [fielId, setFielId] = useState<number | null>(null);
  const [dados, setDados] = useState<DadosCrisma>({ ...dadosVazios });

  const atualizar = (campo: string, valor: string) => setDados(p => ({ ...p, [campo]: valor }));

  const handleRegistrar = async () => {
    if (!dados.nome) { showToast("Preencha o nome do crismando.", "error"); return; }
    try {
      const jsonDados = JSON.stringify(dados);
      const result = await SacramentalRepository.registros.upsert(
        "CRISMA", dados.nome, dados.dataBatismo, "", dados.paroquiaAtual, jsonDados,
        editandoId !== null ? editandoId : undefined,
        fielId ?? undefined
      );
      if (result.duplicado) {
        showToast("Este fiel já possui um registro ativo para este sacramento.", "error");
        return;
      }
      setRecarregarKey(k => k + 1);
      showToast(editandoId !== null ? "Inscrição de Crisma atualizada com sucesso!" : "Inscrição de Crisma registrada com sucesso!", "success");
    } catch (e) {
      console.error("Erro ao salvar crisma:", e);
      showToast("Erro ao salvar. Tente novamente.", "error");
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @media screen { .area-impressao { display: none; } }
      `}</style>

      <div className="no-print" style={styles.formCard}>
        <h2 style={{ color: "#1f3b73", marginBottom: "10px" }}>Ficha de Inscrição: Sacramento do Crisma</h2>
        <FontSelector fonteAtual={fonteDocumento} onChange={setFonteDocumento} />

        {/* CAMPO DE BUSCA */}
        <div style={{ ...styles.searchBox }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: "#344054" }}>BUSCAR:</span>
          <input style={{ ...styles.input, flex: 1, marginBottom: 0 }} placeholder="Pesquisar crismando por nome..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button onClick={() => { setDados({ ...dadosVazios }); setEditandoId(null); }} style={{ ...styles.tabBtn, background: '#22c55e', color: 'white', padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+ Novo</button>
        </div>

        <BuscarFielPastoral onSelecionar={f => { setDados(d => ({ ...d, nome: f.nome, endereco: f.endereco || d.endereco, tel: f.telefone || d.tel, paroquiaAtual: f.comunidade || d.paroquiaAtual })); setFielId(f.id); }} label="Buscar Crismando no Módulo Pastoral" />
        <RegistrosList
          tipo="CRISMA"
          busca={busca}
          recarregarKey={recarregarKey}
          onExcluir={() => { setEditandoId(null); setDados({ ...dadosVazios }); }}
          onSelecionar={(d, registro) => { const data = d as Record<string, string>; setEditandoId(registro.id); setDados({ nome: data.nome||"", dataNasc: data.dataNasc||"", rgCpf: data.rgCpf||"", cpf: data.cpf||"", endereco: data.endereco||"", tel: data.tel||"", email: data.email||"", escolaridade: data.escolaridade||"", paroquiaAtual: data.paroquiaAtual||"", dataBatismo: data.dataBatismo||"", localBatismo: data.localBatismo||"", dataEucaristia: data.dataEucaristia||"", localEucaristia: data.localEucaristia||"", mae: data.mae||"", pai: data.pai||"", responsavel: data.responsavel||"", estadoCivilPais: data.estadoCivilPais||"", padrinho: data.padrinho||"", madrinha: data.madrinha||"", estadoCivilCrismando: data.estadoCivilCrismando||"", valorTaxa: data.valorTaxa||"", certidaoBatismo: data.certidaoBatismo||"", certidaoEucaristia: data.certidaoEucaristia||"", documentoRetirado: data.documentoRetirado||"Não" }); }}
        />

        {/* 1. DADOS PESSOAIS */}
        <h3 style={styles.sectionTitle}>1. Dados Pessoais do Crismando</h3>
        <div style={{...styles.fieldGroup, marginBottom: '20px'}}>
          <label style={styles.label}>Nome Completo (sem abreviações)</label>
          <input style={styles.input} value={dados.nome} onChange={e => atualizar('nome', e.target.value)} />
        </div>
        <div style={styles.row}>
          <div style={styles.fieldGroup}><label style={styles.label}>Data de Nascimento</label><input style={styles.input} type="date" value={dados.dataNasc} onChange={e => atualizar('dataNasc', e.target.value)} /></div>
          <div style={styles.fieldGroup}><label style={styles.label}>RG</label><input style={styles.input} value={dados.rgCpf} onChange={e => atualizar('rgCpf', e.target.value)} /></div>
          <div style={styles.fieldGroup}><label style={styles.label}>CPF</label><input style={styles.input} value={dados.cpf} onChange={e => atualizar('cpf', e.target.value)} /></div>
          <div style={styles.fieldGroup}><label style={styles.label}>Escolaridade (Série/Turma)</label><input style={styles.input} value={dados.escolaridade} onChange={e => atualizar('escolaridade', e.target.value)} /></div>
        </div>
        <div style={styles.fieldGroup}><label style={styles.label}>Endereço Completo (Rua, nº, Bairro, Cidade, Estado)</label><input style={styles.input} value={dados.endereco} onChange={e => atualizar('endereco', e.target.value)} /></div>
        <div style={styles.row}>
          <div style={styles.fieldGroup}><label style={styles.label}>Telefone Celular / WhatsApp</label><input style={styles.input} value={dados.tel} onChange={e => atualizar('tel', e.target.value)} /></div>
          <div style={styles.fieldGroup}><label style={styles.label}>E-mail</label><input style={styles.input} value={dados.email} onChange={e => atualizar('email', e.target.value)} /></div>
          <div style={styles.fieldGroup}><label style={styles.label}>Paróquia que frequenta</label><ComunidadeSelect value={dados.paroquiaAtual} onChange={v => atualizar('paroquiaAtual', v)} style={styles.input} /></div>
        </div>

        {/* 2. DADOS SACRAMENTAIS */}
        <h3 style={styles.sectionTitle}>2. Dados Sacramentais</h3>
        <div style={styles.row}>
          <div style={styles.fieldGroup}><label style={styles.label}>Data do Batismo</label><input style={styles.input} type="date" value={dados.dataBatismo} onChange={e => atualizar('dataBatismo', e.target.value)} /></div>
          <div style={{...styles.fieldGroup, gridColumn: 'span 2'}}><label style={styles.label}>Local (Paróquia/Cidade) do Batismo</label><input style={styles.input} value={dados.localBatismo} onChange={e => atualizar('localBatismo', e.target.value)} /></div>
        </div>
        <div style={styles.row}>
          <div style={styles.fieldGroup}><label style={styles.label}>Data 1ª Eucaristia</label><input style={styles.input} type="date" value={dados.dataEucaristia} onChange={e => atualizar('dataEucaristia', e.target.value)} /></div>
          <div style={{...styles.fieldGroup, gridColumn: 'span 2'}}><label style={styles.label}>Local (Paróquia/Cidade) da Eucaristia</label><input style={styles.input} value={dados.localEucaristia} onChange={e => atualizar('localEucaristia', e.target.value)} /></div>
        </div>

        {/* 3. DADOS DA FAMÍLIA */}
        <h3 style={styles.sectionTitle}>3. Dados da Família</h3>
        <div style={styles.row}>
          <div style={styles.fieldGroup}><label style={styles.label}>Nome da Mãe</label><input style={styles.input} value={dados.mae} onChange={e => atualizar('mae', e.target.value)} /></div>
          <div style={styles.fieldGroup}><label style={styles.label}>Nome do Pai</label><input style={styles.input} value={dados.pai} onChange={e => atualizar('pai', e.target.value)} /></div>
          <div style={styles.fieldGroup}><label style={styles.label}>Estado Civil dos Pais</label><input style={styles.input} value={dados.estadoCivilPais} onChange={e => atualizar('estadoCivilPais', e.target.value)} /></div>
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Responsável (Caso menor de idade)</label>
          <input style={styles.input} value={dados.responsavel} onChange={e => atualizar('responsavel', e.target.value)} />
        </div>

        {/* 4. PADRINHO/MADRINHA E ADICIONAIS */}
        <h3 style={styles.sectionTitle}>4. Padrinho/Madrinha e Informações Adicionais</h3>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Nome Completo do Padrinho</label>
          <input style={styles.input} value={dados.padrinho} onChange={e => atualizar('padrinho', e.target.value)} />
          <label style={styles.label}>Nome Completo da Madrinha</label>
          <input style={styles.input} value={dados.madrinha} onChange={e => atualizar('madrinha', e.target.value)} />
        </div>
        <div style={styles.row}>
          <div style={styles.fieldGroup}><label style={styles.label}>Estado Civil Crismando</label><input style={styles.input} placeholder="Solteiro, Casado, Amasiado..." value={dados.estadoCivilCrismando} onChange={e => atualizar('estadoCivilCrismando', e.target.value)} /></div>
          <div style={styles.fieldGroup}><label style={styles.label}>Valor da Taxa (R$)</label><input style={styles.input} value={dados.valorTaxa} onChange={e => atualizar('valorTaxa', e.target.value)} /></div>
          <div style={styles.fieldGroup}><label style={styles.label}>Documento Retirado?</label><select style={styles.input} value={dados.documentoRetirado || "Não"} onChange={e => atualizar('documentoRetirado', e.target.value)}><option value="Não">Não</option><option value="Sim">Sim</option></select></div>
        </div>

        <div style={styles.obsBox}>
          <strong>Observação sobre a Taxa:</strong> A taxa de inscrição pode ser fixada pela cúria diocesana ou paróquia conforme normas vigentes.
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.btnRegistrar} onClick={handleRegistrar}>{editandoId ? "💾 Atualizar" : "Registrar Inscrição"}</button>
          {editandoId && <button onClick={() => { setEditandoId(null); setDados({ ...dadosVazios }); }} style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #d0d5dd", color: "#475467", borderRadius: "16px", cursor: "pointer", padding: "14px 20px", fontWeight: 700 }}>✕ Cancelar Edição</button>}
          <button style={styles.btnImprimir} onClick={() => gerarPDFCrisma(paroquia, dados as unknown as Record<string, string>, fonteDocumento)}>Imprimir Ficha</button>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO (2 PÁGINAS) */}
      <div id="area-crisma-print" className="area-impressao">
        <div style={{ fontFamily: fonteDocumento, width: '100%', maxWidth: '19cm', margin: '0 auto' }}>
          
          <div className="page-break" style={{ minHeight: '26cm' }}>
            <DocumentHeader paroquia={paroquia} />
            <h2 style={{ textAlign: 'center', textDecoration: 'underline', margin: '20px 0' }}>FICHA DE INSCRIÇÃO: SACRAMENTO DO CRISMA</h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <tbody>
                <tr><td colSpan={2} style={{ border: '1px solid #000', padding: '8px' }}><strong>NOME:</strong> {dados.nome}</td></tr>
                <tr>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '8px' }}><strong>NASCIMENTO:</strong> {dados.dataNasc}</td>
                  
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>RG:</strong> {dados.rgCpf}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>CPF:</strong> {dados.cpf}</td>
                </tr>  
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>ESCOLARIDADE:</strong> {dados.escolaridade}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>ENDEREÇO:</strong> {dados.endereco}</td>
                </tr>
                <tr><td colSpan={2} style={{ border: '1px solid #000', padding: '8px' }}><strong>PARÓQUIA ATUAL:</strong> {dados.paroquiaAtual}</td></tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>TEL:</strong> {dados.tel}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>E-MAIL:</strong> {dados.email}</td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '8px' }}><strong>MÃE:</strong> {dados.mae}</td></tr> 
                <tr>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '8px' }}><strong>PAI:</strong> {dados.pai}</td></tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>BATISMO:</strong> {dados.dataBatismo} - {dados.localBatismo}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>EUCARISTIA:</strong> {dados.dataEucaristia} - {dados.localEucaristia}</td>
                </tr>
                <tr><td colSpan={2} style={{ border: '1px solid #000', padding: '8px' }}><strong>PADRINHO:</strong> {dados.padrinho}</td></tr>
                <tr><td colSpan={2} style={{ border: '1px solid #000', padding: '8px' }}><strong>MADRINHA:</strong> {dados.madrinha}</td></tr>
              </tbody>
            </table>

            <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed #000', fontSize: '10pt' }}>
              <strong>DOCUMENTOS OBRIGATÓRIOS (CHECKLIST SECRETARIA):</strong><br/>
              ( ) Cópia RG/Certidão Nasc | ( ) Comprovante Residência | ( ) Cópia Batismo (Obrigatório)<br/>
              ( ) Cópia 1ª Eucaristia | ( ) Certidão Casamento Religioso (Se casado) | ( ) Taxa: R$ {dados.valorTaxa}
            </div>

            <div style={{ marginTop: '20px', fontSize: '9pt', fontStyle: 'italic', textAlign: 'center' }}>
              <em>Importante: A inscrição só será confirmada após a entrega de toda a documentação exigida.</em>
            </div>
          </div>

          <div style={{ minHeight: '27cm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ borderBottom: '2px solid #1f3b73', paddingBottom: '5px' }}>TERMO DE COMPROMISSO E CIÊNCIA</h3>
              <p style={{ textAlign: 'justify', lineHeight: '1.8', fontSize: '11pt' }}>
                Eu, <strong>{dados.nome || "____________________________________"}</strong>, declaro meu desejo de iniciar a preparação para o Sacramento do Crisma. 
                Estou ciente de que o crisma é a confirmação do meu batismo e exige maturidade e participação ativa. 
                Comprometo-me com a assiduidade nos encontros e celebrações desta Paróquia.
                <br/><br/>
                <em>Nota: Padrinhos de crisma devem ser católicos, ter no mínimo 16 anos e já terem recebido o Batismo, Eucaristia e Crisma.</em>
              </p>
            </div>

            <div style={{ marginBottom: '2cm' }}>
              <p style={{ textAlign: 'right', marginBottom: '60px' }}>Manaus - AM, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ borderTop: '1px solid #000', width: '250px', textAlign: 'center', paddingTop: '5px' }}>Assinatura Crismando/Responsável</div>
                <div style={{ borderTop: '1px solid #000', width: '250px', textAlign: 'center', paddingTop: '5px' }}>Secretaria / Agente</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CrismaPage;