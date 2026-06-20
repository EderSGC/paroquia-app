/**
 * Localização: /src/modules//pages/BatismoPage.tsx
 */
import { useState, CSSProperties } from "react";
import { RegistrosList } from "../components/RegistrosList";
import { BuscarFielPastoral } from "../components/BuscarFielPastoral";
import type { Paroquia } from "../../../core/types/app.types";
import { FontSelector } from "@core/components/FontSelector";
import type { DadosBatismo, DadosPadrinhos } from "../components/batismo.types";
import { gerarPDFFichaBatizando, gerarPDFFichaPadrinhos } from "../utils/gerarPDFSacramental";
import { SacramentalRepository } from '../repository/sacramental.repository';
import { useToast } from '@core/ui/Toast';
import { ComunidadeSelect } from "../components/ComunidadeSelect";

interface BatismoPageProps { paroquia: Paroquia; }

const styles: { [key: string]: CSSProperties } = {
  container: {
    minHeight: "100vh",
    padding: "32px",
    background:
      "linear-gradient(180deg, #f4f7fb 0%, #eef2f7 100%)",
  },

  formCard: {
    background: "rgba(255,255,255,0.88)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.5)",
    borderRadius: "28px",
    padding: "34px",
    boxShadow:
      "0 10px 40px rgba(15,23,42,0.08), 0 2px 10px rgba(15,23,42,0.04)",
    marginBottom: "30px",
  },

  sectionTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "22px",
    paddingBottom: "10px",
    marginTop: "34px",
    borderBottom: "1px solid #e5e7eb",
    letterSpacing: "0.3px",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
    marginBottom: "18px",
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
    letterSpacing: "0.8px",
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
    marginTop: "42px",
    flexWrap: "wrap",
  },

  tabBtn: {
    padding: "12px 22px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.4)",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all .2s ease",
    fontSize: "14px",
    backdropFilter: "blur(10px)",
  },

};

export function BatismoPage({ paroquia }: BatismoPageProps) {
  const { showToast } = useToast();
  const [aba, setAba] = useState<'batizando' | 'padrinhos'>('batizando');
  const [fonteDocumento, setFonteDocumento] = useState("Arial");
  
  const [dados, setDados] = useState<DadosBatismo>({
    nomeBatizando: "", dataNascimento: "", comunidade: "", dataBatismo: "", celebrante: "", transferencia: "",
    livro: "", numeroFicha: "", pagina: "", inicioFormacao: "", terminoFormacao: "",
    paiNome: "", paiDataNasc: "", paiNascidoEm: "", paiMae: "", paiPai: "", paiEndereco: "", paiComunidade: "", paiTelefone: "",
    maeNome: "", maeDataNasc: "", maeNascidoEm: "", maeMae: "", maePai: "", maeEndereco: "", maeComunidade: "", maeTelefone: "",
    frequentaAtividades: "", qualAtividade: "", membroPastoral: "", qualPastoral: "", seCompromete: "", contribuiFinanceiramente: "", eDizimista: "", razaoBatismo: ""
  });

  const [padrinhos, setPadrinhos] = useState<DadosPadrinhos>({
    nomeBatizando: "",
    padrinhoNome: "", padrinhoDataNasc: "", padrinhoNascidoEm: "", padrinhoMae: "", padrinhoPai: "", padrinhoEnd: "", padrinhoComunidade: "", padrinhoTel: "", padrinhoBatizado: "", padrinhoEucaristia: "", padrinhoCrisma: "", padrinhoEstadoCivil: "", padrinhoFrequentaMissa: "", padrinhoMotivoNaoFrequenta: "", padrinhoParticipaPastoral: "", padrinhoDizimista: "", padrinhoGostariaDizimista: "", padrinhoRazaoAceitou: "", padrinhoSabeSignificado: "", padrinhoCompromissoFe: "", padrinhoCompromissoAcompanhar: "",
    madrinhaNome: "", madrinhaDataNasc: "", madrinhaNascidoEm: "", madrinhaMae: "", madrinhaPai: "", madrinhaEnd: "", madrinhaComunidade: "", madrinhaTel: "", madrinhaBatizado: "", madrinhaEucaristia: "", madrinhaCrisma: "", madrinhaEstadoCivil: "", madrinhaFrequentaMissa: "", madrinhaMotivoNaoFrequenta: "", madrinhaParticipaPastoral: "", madrinhaDizimista: "", madrinhaGostariaDizimista: "", madrinhaRazaoAceitou: "", madrinhaSabeSignificado: "", madrinhaCompromissoFe: "", madrinhaCompromissoAcompanhar: "",
    casalMatrimonioIgreja: "", dataManaus: "", agenteAssinatura: "", padreAssinatura: ""
  });
  
const [termoBusca, setTermoBusca] = useState<string>("");
const [recarregarKey, setRecarregarKey] = useState(0);
const [editandoId, setEditandoId] = useState<number | null>(null);
const [fielId, setFielId] = useState<number | null>(null);

  const atualizar = (campo: keyof DadosBatismo, valor: string) => setDados(p => ({ ...p, [campo]: valor }));
  const atualizarPad = (campo: keyof DadosPadrinhos, valor: string) => setPadrinhos(p => ({ ...p, [campo]: valor }));

  const handleSave = async () => {
    if (!dados.nomeBatizando) { showToast("Preencha o nome do batizando.", "error"); return; }
    try {
      const jsonDados = JSON.stringify({ batizando: dados, padrinhos });
      const result = await SacramentalRepository.registros.upsert(
        "BATISMO",
        dados.nomeBatizando || "",
        dados.dataBatismo || "",
        dados.celebrante || "",
        dados.comunidade || "",
        jsonDados,
        editandoId !== null ? editandoId : undefined,
        fielId ?? undefined
      );
      if (result.duplicado) {
        showToast("Este fiel já possui um registro ativo para este sacramento.", "error");
        return;
      }
      setRecarregarKey(k => k + 1);
      showToast(editandoId !== null ? "Registro de batismo atualizado!" : "Registro de batismo salvo!", "success");
    } catch (error) {
      console.error("Erro ao salvar batismo:", error);
      showToast("Erro ao salvar o registro.", "error");
    }
  };

const formatarTelefone = (valor: string) => {
  // Remove tudo que não é número
  const apenasNumeros = valor.replace(/\D/g, "");
  
  // Formata como (92) 99999-9999
  return apenasNumeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2")
    .substring(0, 15); // Limita a 15 caracteres
};

return (
    <div style={styles.container}>
      <style>{`
  * {
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  }

  input:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 4px rgba(59,130,246,.12) !important;
    transform: translateY(-1px);
  }

  button:hover {
    transform: translateY(-1px);
    opacity: 0.96;
  }

  button {
    transition: all .2s ease;
  }

  ::-webkit-scrollbar {
    width: 10px;
  }

  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 20px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  @media (max-width: 900px) {
    .top-buttons {
      flex-direction: column;
    }
  }
`}</style>

      <div className="no-print" style={styles.formCard}>
        <div
  className="top-buttons"
  style={{
    display: 'flex',
    gap: '14px',
    marginBottom: '30px',
    background: 'rgba(255,255,255,0.55)',
    padding: '10px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.6)',
    backdropFilter: 'blur(14px)',
  }}
>
          <button onClick={() => setAba('batizando')} style={{ ...styles.tabBtn, background: aba === 'batizando' ? '#1f3b73' : '#eee', color: aba === 'batizando' ? 'white' : '#000' }}>1. Ficha Batizando</button>
          <button onClick={() => setAba('padrinhos')} style={{ ...styles.tabBtn, background: aba === 'padrinhos' ? '#1f3b73' : '#eee', color: aba === 'padrinhos' ? 'white' : '#000' }}>2. Ficha Padrinhos</button>
        </div>

        <FontSelector fonteAtual={fonteDocumento} onChange={setFonteDocumento} />
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", marginTop: "20px" }}>
          <input style={{ flex: 1, padding: "13px 14px", borderRadius: "14px", border: "1px solid #d0d5dd", background: "rgba(255,255,255,0.92)", fontSize: "14px", outline: "none", boxSizing: "border-box" as const }} placeholder="🔍 Pesquisar batizando por nome..." autoComplete="off" value={termoBusca} onChange={e => setTermoBusca(e.target.value)} />
          <button onClick={() => { setDados(d => ({ ...d, nomeBatizando: "" })); setEditandoId(null); }} style={{ ...styles.tabBtn, background: '#22c55e', color: 'white', padding: "10px 20px", fontWeight: 700 }}>+ Novo</button>
        </div>
        {editandoId && <div style={{ marginBottom: "10px", padding: "8px 16px", background: "#fef3c7", borderRadius: "10px", fontSize: "13px", color: "#92400e", fontWeight: 600 }}>✏️ Editando registro #{editandoId}</div>}
        <BuscarFielPastoral onSelecionar={f => { atualizar('nomeBatizando', f.nome); setFielId(f.id); }} label="Buscar Batizando no Módulo Pastoral" />
        <RegistrosList
          tipo="BATISMO"
          busca={termoBusca}
          recarregarKey={recarregarKey}
          onExcluir={() => { setEditandoId(null); }}
          onSelecionar={(d, registro) => {
            type BatismoJson = { batizando?: Record<string, string>; padrinhos?: Record<string, string> };
            const json = d as BatismoJson;
            setEditandoId(registro.id);
            if (json.batizando) setDados(prev => ({ ...prev, ...json.batizando }));
            if (json.padrinhos) setPadrinhos(prev => ({ ...prev, ...json.padrinhos }));
          }}
        />

        {aba === 'batizando' ? (
          <div>
            <h3 style={styles.sectionTitle}>Dados do(a) Batizando(a)</h3>
            <div style={{...styles.fieldGroup, marginBottom: "20px"}}>
              <label style={styles.label}>Nome Completo</label>
              <input style={styles.input} autoComplete="off" placeholder="Nome completo do(a) batizando(a)" value={dados.nomeBatizando} onChange={e => atualizar('nomeBatizando', e.target.value)} />
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Data Nascimento</label><input style={styles.input} type="date" autoComplete="off" value={dados.dataNascimento} onChange={e => atualizar('dataNascimento', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Comunidade</label><ComunidadeSelect value={dados.comunidade} onChange={v => atualizar('comunidade', v)} style={styles.input} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Data Batismo</label><input style={styles.input} type="date" autoComplete="off" value={dados.dataBatismo} onChange={e => atualizar('dataBatismo', e.target.value)} /></div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Celebrante</label><input style={styles.input} autoComplete="off" placeholder="Nome do Padre ou Diácono" value={dados.celebrante} onChange={e => atualizar('celebrante', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Transferência</label><input style={styles.input} autoComplete="off" placeholder="Se houver transferência..." value={dados.transferencia} onChange={e => atualizar('transferencia', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Livro / Nº / Página</label>
                <div style={{display: 'flex', gap: '5px'}}>
                   <input style={{...styles.input, width: '40px'}} autoComplete="off" placeholder="L" value={dados.livro} onChange={e => atualizar('livro', e.target.value)} />
                   <input style={{...styles.input, width: '60px'}} autoComplete="off" placeholder="Nº" value={dados.numeroFicha} onChange={e => atualizar('numeroFicha', e.target.value)} />
                   <input style={{...styles.input, width: '60px'}} autoComplete="off" placeholder="Pág" value={dados.pagina} onChange={e => atualizar('pagina', e.target.value)} />
                </div>
              </div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Início Formação</label><input style={styles.input} type="date" autoComplete="off" value={dados.inicioFormacao} onChange={e => atualizar('inicioFormacao', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Término Formação</label><input style={styles.input} type="date" autoComplete="off" value={dados.terminoFormacao} onChange={e => atualizar('terminoFormacao', e.target.value)} /></div>
            </div>

            <h3 style={styles.sectionTitle}>Dados do Pai</h3>
            <div style={styles.row}>
              <div style={{...styles.fieldGroup, gridColumn: "span 2"}}><label style={styles.label}>Nome</label><input style={styles.input} autoComplete="off" placeholder="Nome completo do pai" value={dados.paiNome} onChange={e => atualizar('paiNome', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Data Nasc.</label><input style={styles.input} type="date" autoComplete="off" value={dados.paiDataNasc} onChange={e => atualizar('paiDataNasc', e.target.value)} /></div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Nascido em</label><input style={styles.input} autoComplete="off" placeholder="Cidade/UF" value={dados.paiNascidoEm} onChange={e => atualizar('paiNascidoEm', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Mãe (Avó)</label><input style={styles.input} autoComplete="off" placeholder="Nome da avó paterna" value={dados.paiMae} onChange={e => atualizar('paiMae', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Pai (Avô)</label><input style={styles.input} autoComplete="off" placeholder="Nome do avô paterno" value={dados.paiPai} onChange={e => atualizar('paiPai', e.target.value)} /></div>
            </div>
            <div style={styles.row}>
              <div style={{...styles.fieldGroup, gridColumn: "span 1"}}><label style={styles.label}>Endereço</label><input style={styles.input} autoComplete="off" placeholder="Rua, Número, Bairro" value={dados.paiEndereco} onChange={e => atualizar('paiEndereco', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Comunidade</label><input style={styles.input} autoComplete="off" placeholder="Onde o pai frequenta" value={dados.paiComunidade} onChange={e => atualizar('paiComunidade', e.target.value)} /></div>
              <div style={styles.fieldGroup}>
  <label style={styles.label}>Tel</label>
  <input 
    style={styles.input} 
    autoComplete="off" 
    placeholder="(92) 99999-9999" 
    value={dados.paiTelefone} 
    onChange={e => atualizar('paiTelefone', formatarTelefone(e.target.value))} 
  />
</div>
            </div>

            <h3 style={styles.sectionTitle}>Dados da Mãe</h3>
            <div style={styles.row}>
              <div style={{...styles.fieldGroup, gridColumn: "span 2"}}><label style={styles.label}>Nome</label><input style={styles.input} autoComplete="off" placeholder="Nome completo da mãe" value={dados.maeNome} onChange={e => atualizar('maeNome', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Data Nasc.</label><input style={styles.input} type="date" autoComplete="off" value={dados.maeDataNasc} onChange={e => atualizar('maeDataNasc', e.target.value)} /></div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Nascida em</label><input style={styles.input} autoComplete="off" placeholder="Cidade/UF" value={dados.maeNascidoEm} onChange={e => atualizar('maeNascidoEm', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Mãe (Avó)</label><input style={styles.input} autoComplete="off" placeholder="Nome da avó materna" value={dados.maeMae} onChange={e => atualizar('maeMae', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Pai (Avô)</label><input style={styles.input} autoComplete="off" placeholder="Nome do avô materno" value={dados.maePai} onChange={e => atualizar('maePai', e.target.value)} /></div>
            </div>
            <div style={styles.row}>
              <div style={{...styles.fieldGroup, gridColumn: "span 1"}}><label style={styles.label}>Endereço</label><input style={styles.input} autoComplete="off" placeholder="Rua, Número, Bairro" value={dados.maeEndereco} onChange={e => atualizar('maeEndereco', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Comunidade</label><input style={styles.input} autoComplete="off" placeholder="Onde a mãe frequenta" value={dados.maeComunidade} onChange={e => atualizar('maeComunidade', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Tel</label><input style={styles.input} autoComplete="off" placeholder="(92) 99999-9999" value={dados.maeTelefone} onChange={e => atualizar('maeTelefone', formatarTelefone(e.target.value))} /></div>
            </div>

            <h3 style={styles.sectionTitle}>Participação na Comunidade</h3>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Frequenta às celebrações e atividades da Comunidade? Qual?</label><input style={styles.input} autoComplete="off" placeholder="Sim / Não / Às vezes" value={dados.frequentaAtividades} onChange={e => atualizar('frequentaAtividades', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>É membro de alguma Pastoral?</label><input style={styles.input} autoComplete="off" placeholder="Sim / Não" value={dados.membroPastoral} onChange={e => atualizar('membroPastoral', e.target.value)} /></div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Qual Pastoral?</label><input style={styles.input} autoComplete="off" placeholder="Ex: Catequese, Liturgia..." value={dados.qualPastoral} onChange={e => atualizar('qualPastoral', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Se compromete a participar?</label><input style={styles.input} autoComplete="off" placeholder="Sim / Não" value={dados.seCompromete} onChange={e => atualizar('seCompromete', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Você é Dizimista?</label><input style={styles.input} autoComplete="off" placeholder="Sim / Não" value={dados.eDizimista} onChange={e => atualizar('eDizimista', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Você contribui financeiramente?</label><input style={styles.input} autoComplete="off" placeholder="Sim / Não" value={dados.contribuiFinanceiramente} onChange={e => atualizar('contribuiFinanceiramente', e.target.value)} /></div>
            </div>
            <div style={styles.fieldGroup}><label style={styles.label}>Razão do Batismo</label><input style={styles.input} autoComplete="off" placeholder="Descreva brevemente o motivo" value={dados.razaoBatismo} onChange={e => atualizar('razaoBatismo', e.target.value)} /></div>
          </div>
        ) : (
          <div>
            <h3 style={styles.sectionTitle}>Inscrição Padrinhos</h3>
            <div style={styles.fieldGroup}><label style={styles.label}>Nome Batizando(a)</label><input style={styles.input} autoComplete="off" placeholder="Nome completo da criança" value={padrinhos.nomeBatizando} onChange={e => atualizarPad('nomeBatizando', e.target.value)} /></div>
            
            <h4 style={styles.sectionTitle}>Dados do Padrinho</h4>
            <div style={styles.row}>
              <div style={{...styles.fieldGroup, gridColumn: 'span 2'}}><label style={styles.label}>Nome</label><input style={styles.input} autoComplete="off" placeholder="Nome completo do padrinho" value={padrinhos.padrinhoNome} onChange={e => atualizarPad('padrinhoNome', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Data Nascimento</label><input style={styles.input} autoComplete="off" placeholder="dd/mm/aaaa" value={padrinhos.padrinhoDataNasc} onChange={e => atualizarPad('padrinhoDataNasc', e.target.value)} /></div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Nascido em</label><input style={styles.input} autoComplete="off" placeholder="Cidade/UF" value={padrinhos.padrinhoNascidoEm} onChange={e => atualizarPad('padrinhoNascidoEm', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Mãe</label><input style={styles.input} autoComplete="off" placeholder="Nome da mãe do padrinho" value={padrinhos.padrinhoMae} onChange={e => atualizarPad('padrinhoMae', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Pai</label><input style={styles.input} autoComplete="off" placeholder="Nome do pai do padrinho" value={padrinhos.padrinhoPai} onChange={e => atualizarPad('padrinhoPai', e.target.value)} /></div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Endereço</label><input style={styles.input} autoComplete="off" placeholder="Rua, Número, Bairro" value={padrinhos.padrinhoEnd} onChange={e => atualizarPad('padrinhoEnd', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Comunidade</label><input style={styles.input} autoComplete="off" placeholder="Onde frequenta" value={padrinhos.padrinhoComunidade} onChange={e => atualizarPad('padrinhoComunidade', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Tel</label><input style={styles.input} autoComplete="off" placeholder="(92) 99999-9999" value={padrinhos.padrinhoTel} onChange={e => atualizarPad('padrinhoTel', e.target.value)} /></div>
            </div>

            <h4 style={styles.sectionTitle}>Dados da Madrinha</h4>
            <div style={styles.row}>
              <div style={{...styles.fieldGroup, gridColumn: 'span 2'}}><label style={styles.label}>Nome</label><input style={styles.input} autoComplete="off" placeholder="Nome completo da madrinha" value={padrinhos.madrinhaNome} onChange={e => atualizarPad('madrinhaNome', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Data Nascimento</label><input style={styles.input} autoComplete="off" placeholder="dd/mm/aaaa" value={padrinhos.madrinhaDataNasc} onChange={e => atualizarPad('madrinhaDataNasc', e.target.value)} /></div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Nascida em</label><input style={styles.input} autoComplete="off" placeholder="Cidade/UF" value={padrinhos.madrinhaNascidoEm} onChange={e => atualizarPad('madrinhaNascidoEm', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Mãe</label><input style={styles.input} autoComplete="off" placeholder="Nome da mãe da madrinha" value={padrinhos.madrinhaMae} onChange={e => atualizarPad('madrinhaMae', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Pai</label><input style={styles.input} autoComplete="off" placeholder="Nome do pai da madrinha" value={padrinhos.madrinhaPai} onChange={e => atualizarPad('madrinhaPai', e.target.value)} /></div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Endereço</label><input style={styles.input} autoComplete="off" placeholder="Rua, Número, Bairro" value={padrinhos.madrinhaEnd} onChange={e => atualizarPad('madrinhaEnd', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Comunidade</label><input style={styles.input} autoComplete="off" placeholder="Onde frequenta" value={padrinhos.madrinhaComunidade} onChange={e => atualizarPad('madrinhaComunidade', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Tel</label><input style={styles.input} autoComplete="off" placeholder="(92) 99999-9999" value={padrinhos.madrinhaTel} onChange={e => atualizarPad('madrinhaTel', e.target.value)} /></div>
            </div>

            <h4 style={styles.sectionTitle}>Sobre os Sacramentos dos Padrinhos</h4>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Batizado (Padrinho)</label><input style={styles.input} autoComplete="off" placeholder="Sim / Não" value={padrinhos.padrinhoBatizado} onChange={e => atualizarPad('padrinhoBatizado', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Batizado (Madrinha)</label><input style={styles.input} autoComplete="off" placeholder="Sim / Não" value={padrinhos.madrinhaBatizado} onChange={e => atualizarPad('madrinhaBatizado', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Eucaristia (Padrinho)</label><input style={styles.input} autoComplete="off" placeholder="Sim / Não" value={padrinhos.padrinhoEucaristia} onChange={e => atualizarPad('padrinhoEucaristia', e.target.value)} /></div>
            </div>
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Eucaristia (Madrinha)</label><input style={styles.input} autoComplete="off" placeholder="Sim / Não" value={padrinhos.madrinhaEucaristia} onChange={e => atualizarPad('madrinhaEucaristia', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Crisma (Padrinho)</label><input style={styles.input} autoComplete="off" placeholder="Sim / Não" value={padrinhos.padrinhoCrisma} onChange={e => atualizarPad('padrinhoCrisma', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Crisma (Madrinha)</label><input style={styles.input} autoComplete="off" placeholder="Sim / Não" value={padrinhos.madrinhaCrisma} onChange={e => atualizarPad('madrinhaCrisma', e.target.value)} /></div>
            </div>

            {/* MATRIMÔNIO */}
            <div style={{ ...styles.row, gridTemplateColumns: "1fr", marginTop: "20px" }}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Matrimônio (Vocês vivem juntos?). Receberam o Sacramento do Matrimônio, na Igreja Católica? Casal:
                </label>
                </div>
            </div>

            {/* ESTADO CIVIL */}
            <div style={styles.row}>
              <div style={styles.fieldGroup}><label style={styles.label}>Estado Civil (Padrinho)</label><input style={styles.input} autoComplete="off" placeholder="Casado/Solteiro" value={padrinhos.padrinhoEstadoCivil} onChange={e => atualizarPad('padrinhoEstadoCivil', e.target.value)} /></div>
              <div style={styles.fieldGroup}><label style={styles.label}>Estado Civil (Madrinha)</label><input style={styles.input} autoComplete="off" placeholder="Casada/Solteira" value={padrinhos.madrinhaEstadoCivil} onChange={e => atualizarPad('madrinhaEstadoCivil', e.target.value)} /></div>
            </div>

            <h4 style={styles.sectionTitle}>Sobre a Participação na Comunidade Eclesial - Igreja</h4>
            <div style={{ display: "block", width: "100%", marginBottom: "15px" }}>
              <label style={styles.label}>
                Você frequenta a Celebração Dominical ou da Missa na Comunidade ou numa Igreja mais Próxima de sua casa?
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "6px" }}>
                <input style={styles.input} autoComplete="off" placeholder="Padrinho: Sim / Não / Qual comunidade?" value={padrinhos.padrinhoFrequentaMissa} onChange={e => atualizarPad('padrinhoFrequentaMissa', e.target.value)} />
                <input style={styles.input} autoComplete="off" placeholder="Madrinha: Sim / Não / Qual comunidade?" value={padrinhos.madrinhaFrequentaMissa} onChange={e => atualizarPad('madrinhaFrequentaMissa', e.target.value)} />
              </div>
            </div>

            {/* NOVOS CAMPOS ADICIONADOS COM QUEBRA DE LINHA CORRETA ABAIXO */}
            <div style={{ display: "block", width: "100%", marginTop: "20px" }}>
              <label style={styles.label}>Qual a razão para não frequentar a Celebração Dominical?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "6px" }}>
                <input style={styles.input} placeholder="Padrinho: ..." value={padrinhos.padrinhoMotivoNaoFrequenta} onChange={e => atualizarPad('padrinhoMotivoNaoFrequenta', e.target.value)} />
                <input style={styles.input} placeholder="Madrinha: ..." value={padrinhos.madrinhaMotivoNaoFrequenta} onChange={e => atualizarPad('madrinhaMotivoNaoFrequenta', e.target.value)} />
              </div>
            </div>

            <div style={{ display: "block", width: "100%", marginTop: "20px" }}>
              <label style={styles.label}>Você é membro ou participa de alguma atividade ou Pastoral, na sua Comunidade?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "6px" }}>
                <input style={styles.input} placeholder="Padrinho: ..." value={padrinhos.padrinhoParticipaPastoral} onChange={e => atualizarPad('padrinhoParticipaPastoral', e.target.value)} />
                <input style={styles.input} placeholder="Madrinha: ..." value={padrinhos.madrinhaParticipaPastoral} onChange={e => atualizarPad('madrinhaParticipaPastoral', e.target.value)} />
              </div>
            </div>

            <div style={{ display: "block", width: "100%", marginTop: "20px" }}>
              <label style={styles.label}>Vocês contribuem financeiramente com a Comunidade? Vocês são Dizimistas?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "6px" }}>
                <input style={styles.input} placeholder="Padrinho: Sim - Não" value={padrinhos.padrinhoDizimista} onChange={e => atualizarPad('padrinhoDizimista', e.target.value)} />
                <input style={styles.input} placeholder="Madrinha: Sim - Não" value={padrinhos.madrinhaDizimista} onChange={e => atualizarPad('madrinhaDizimista', e.target.value)} />
              </div>
            </div>

            <div style={{ display: "block", width: "100%", marginTop: "20px" }}>
              <label style={styles.label}>Gostaria de ser Dizimista?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "6px" }}>
                <input style={styles.input} placeholder="Padrinho: Sim - Não" value={padrinhos.padrinhoGostariaDizimista} onChange={e => atualizarPad('padrinhoGostariaDizimista', e.target.value)} />
                <input style={styles.input} placeholder="Madrinha: Sim - Não" value={padrinhos.madrinhaGostariaDizimista} onChange={e => atualizarPad('madrinhaGostariaDizimista', e.target.value)} />
              </div>
            </div>

            <div style={{ display: "block", width: "100%", marginTop: "20px" }}>
              <label style={styles.label}>Por que aceitou ser Padrinho?</label>
              <input style={{...styles.input, width: "100%", marginTop: "6px"}} value={padrinhos.padrinhoRazaoAceitou} onChange={e => atualizarPad('padrinhoRazaoAceitou', e.target.value)} />
            </div>

            <div style={{ display: "block", width: "100%", marginTop: "20px" }}>
              <label style={styles.label}>E você madrinha, por que aceitou?</label>
              <input style={{...styles.input, width: "100%", marginTop: "6px"}} value={padrinhos.madrinhaRazaoAceitou} onChange={e => atualizarPad('madrinhaRazaoAceitou', e.target.value)} />
            </div>

            <div style={{ display: "block", width: "100%", marginTop: "20px" }}>
              <label style={styles.label}>Vocês sabem o que significa ser Padrinho ou Madrinha de Batismo?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "6px" }}>
                <input style={styles.input} placeholder="Padrinho: ..." value={padrinhos.padrinhoSabeSignificado} onChange={e => atualizarPad('padrinhoSabeSignificado', e.target.value)} />
                <input style={styles.input} placeholder="Madrinha: ..." value={padrinhos.madrinhaSabeSignificado} onChange={e => atualizarPad('madrinhaSabeSignificado', e.target.value)} />
              </div>
            </div>

            {/* BLOCO DE TEXTO INFORMATIVO */}
            <div style={{ display: "block", width: "100%", marginTop: "25px", padding: "15px", background: "linear-gradient(135deg, rgba(240,253,244,1) 0%, rgba(220,252,231,1) 100%)", border: "1px solid #bbf7d0", borderRadius: "8px", boxShadow: "0 4px 20px rgba(34,197,94,0.08)" }}>
              <p style={{ fontSize: "12px", color: "#166534", margin: 0, lineHeight: "1.5", textAlign: "justify" }}>
                <strong>Na Igreja Católica, a tradição dos Padrinhos e Madrinhas de Batismo é muito antiga.</strong> As pessoas, em sua maioria eram pagãs. Eram adultos(as) que se convertiam à fé Cristã. Antes de serem batizadas, passavam por um longo processo de catequese e inserção na comunidade. Os candidatos(as) ao Batismo recebiam o nome de catecúmenos. Era comum, também, entregá-los aos cuidados de famílias, que iriam acompanhá-los(as) se tornava o Padrinho ou madrinha do convertido(a). A função dos padrinhos e madrinhas eram dar testemunho e acompanhar os seus afilhados(as), e ajudá-los(as) a crescer na fé.
              </p>
            </div>

            <div style={{ display: "block", width: "100%", marginTop: "25px" }}>
              <label style={styles.label}>Vocês estão dispostos, se comprometem a ajudá-los(as) e acompanhá-los(as) na caminhada de fé, com o testemunho e os exemplos de vida cristã?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "6px" }}>
                <input style={styles.input} placeholder="Padrinho: ..." value={padrinhos.padrinhoCompromissoFe} onChange={e => atualizarPad('padrinhoCompromissoFe', e.target.value)} />
                <input style={styles.input} placeholder="Madrinha: ..." value={padrinhos.madrinhaCompromissoFe} onChange={e => atualizarPad('madrinhaCompromissoFe', e.target.value)} />
              </div>
            </div>

            <div style={{ display: "block", width: "100%", marginTop: "20px" }}>
              <label style={styles.label}>Vocês se comprometem ajudar, acompanhar, incentivar o seu afilhado(a) no crescimento a fé Cristã e Católica?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "6px" }}>
                <input style={styles.input} placeholder="Padrinho: ..." value={padrinhos.padrinhoCompromissoAcompanhar} onChange={e => atualizarPad('padrinhoCompromissoAcompanhar', e.target.value)} />
                <input style={styles.input} placeholder="Madrinha: ..." value={padrinhos.madrinhaCompromissoAcompanhar} onChange={e => atualizarPad('madrinhaCompromissoAcompanhar', e.target.value)} />
              </div>
            </div>
            
            <div style={{ display: "block", width: "100%", marginTop: "30px" }}>
              <label style={styles.label}>Data e Assinaturas (Manaus, Agente, Padre)</label>
              <input style={{...styles.input, width: "100%", marginTop: "6px"}} autoComplete="off" placeholder="Manaus, 07 de Maio de 2026" value={padrinhos.dataManaus} onChange={e => atualizarPad('dataManaus', e.target.value)} />
            </div>
          </div>
        )}

        <div style={styles.buttonGroup}>
          <button style={{ ...styles.tabBtn, background: '#1f3b73', color: 'white', padding: '14px 22px', fontWeight: 700 }} onClick={handleSave}>{editandoId ? "💾 Atualizar" : "Registrar"}</button>
          <button
            style={{ ...styles.tabBtn, background: '#1f3b73', color: 'white', padding: '14px 22px', fontWeight: 700 }}
            onClick={() => gerarPDFFichaBatizando(paroquia, dados, fonteDocumento)}
          >
            🖨️ Imprimir Ficha Batizando
          </button>
          <button
            style={{ ...styles.tabBtn, background: '#0f5132', color: 'white', padding: '14px 22px', fontWeight: 700 }}
            onClick={() => gerarPDFFichaPadrinhos(paroquia, padrinhos, fonteDocumento)}
          >
            🖨️ Imprimir Ficha Padrinhos
          </button>
          {editandoId && <button onClick={() => { setEditandoId(null); }} style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #d0d5dd", color: "#475467", borderRadius: "14px", cursor: "pointer", padding: "14px 20px", fontWeight: 700 }}>✕ Cancelar Edição</button>}
        </div>
      </div>


</div>
  );
}

export default BatismoPage;