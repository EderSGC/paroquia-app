import { printWithTitle } from "@core/utils/pdfGenerator";
import { useState, CSSProperties } from "react";
import { useCatequese } from "../hooks/useCatequese";
import { ModeToggle, type ModoPagina } from "@core/components/ModeToggle";
import type { Paroquia } from "../../../core/types/app.types";

type StatusPresenca = "P" | "F" | "J" | "A";

interface ChamadaItem {
  matricula_id: number;
  nome: string;
  status: StatusPresenca;
  justificativa: string;
}

export function PresencaPage({ paroquia: _paroquia, fonte: _fonte }: { paroquia?: Paroquia; fonte?: string } = {}) {
  const { turmas, matriculas, encontros, presencas, catequistas, comunidades, registrarPresenca } = useCatequese();
  
  // Controle de Abas
  const [abaAtiva, setAbaAtiva] = useState<"diario" | "ficha" | "geral">("diario");
  const [modo, setModo] = useState<ModoPagina>('registrar');

  // --- ESTADOS DA ABA 1: DIÁRIO DE CLASSE (COM FILTRO DE COMUNIDADE E HISTÓRICO) ---
  const [comunidadeSel, setComunidadeSel] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [encontroIdSel, setEncontroIdSel] = useState(""); // "" = não carregado | "novo" = Novo Diário | número = ID do encontro salvo
  const [busca, setBusca] = useState(""); 
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [temaEncontro, setTemaEncontro] = useState(""); 
  const [listaChamada, setListaChamada] = useState<ChamadaItem[]>([]);

  // Filtragem dinâmica de turmas baseada na comunidade selecionada
  const turmasFiltradas = (turmas || []).filter(t => !comunidadeSel || t.comunidade === comunidadeSel);
  
  // Histórico de encontros salvos especificamente para a turma selecionada
  const encontrosDaTurmaAtiva = (encontros || []).filter(e => e.turma_id === Number(turmaId));

  const nomeTurmaAtiva = turmas?.find(t => t.id === Number(turmaId))?.nome || "";

  // --- MUDANÇAS DE FILTROS ---
  const handleComunidadeChange = (comunidade: string) => {
    setComunidadeSel(comunidade);
    setTurmaId("");
    setEncontroIdSel("");
    setListaChamada([]);
  };

  const handleTurmaChange = (id: string) => {
    setTurmaId(id);
    setEncontroIdSel("");
    setListaChamada([]);
  };

  // --- LÓGICA DE CARREGAMENTO (NOVO OU HISTÓRICO SALVO) ---
  const handleCarregarDiario = (tipoSelecao: string) => {
    if (!turmaId) return alert("Por favor, selecione a turma primeiro!");
    const alunosDaTurma = (matriculas || []).filter(m => m.turma_id === Number(turmaId));
    if (alunosDaTurma.length === 0) return alert("Nenhum aluno matriculado nesta turma.");

    if (tipoSelecao === "novo") {
      setEncontroIdSel("novo");
      setTemaEncontro("");
      setData(new Date().toISOString().split('T')[0]);
      setListaChamada(alunosDaTurma.map(m => ({ 
        matricula_id: m.id, 
        nome: m.nome_catequizando || "Sem nome", 
        status: "P" as StatusPresenca, 
        justificativa: ""
      })));
    } else {
      const encSalvo = encontrosDaTurmaAtiva.find(e => e.id === Number(tipoSelecao));
      if (!encSalvo) return;

      setEncontroIdSel(tipoSelecao);
      setTemaEncontro(encSalvo.tema != null && encSalvo.tema !== "Não especificado" ? encSalvo.tema : "");
      setData(encSalvo.data ?? "");

      const historico = alunosDaTurma.map(m => {
        const presencaSalva = (presencas || []).find(p => p.encontro_id === encSalvo.id && p.matricula_id === m.id);
        return {
          matricula_id: m.id,
          nome: m.nome_catequizando || "Sem nome",
          status: (presencaSalva ? presencaSalva.status : "P") as StatusPresenca,
          justificativa: presencaSalva ? (presencaSalva.justificativa ?? "") : "",
        };
      });
      setListaChamada(historico);
    }
  };

  const handleSalvar = async () => {
    try {
      await registrarPresenca({
        turma_id: Number(turmaId),
        tema: temaEncontro, 
        data: data,
        chamada: listaChamada 
      });
      alert("Diário de Encontro salvo com sucesso!");
    } catch (e) {
      alert("Erro ao salvar diário.");
    }
  };

  // --- ESTADOS DA ABA 2: FICHA ACUMULADA ---
  const [turmaIdRelatorio, setTurmaIdRelatorio] = useState("");
  const nomeTurmaRelatorio = turmas?.find(t => t.id === Number(turmaIdRelatorio))?.nome || "";
  const encontrosDaTurmaRelatorio = (encontros || []).filter(e => e.turma_id === Number(turmaIdRelatorio));
  const alunosDaTurmaRelatorio = (matriculas || []).filter(m => m.turma_id === Number(turmaIdRelatorio));
  
  const fichaClasseDados = alunosDaTurmaRelatorio.map(aluno => {
    let pCount = 0; let fCount = 0; let jCount = 0; let aCount = 0;
    encontrosDaTurmaRelatorio.forEach(enc => {
      const p = (presencas || []).find(pres => pres.encontro_id === enc.id && pres.matricula_id === aluno.id);
      if (p?.status === "P") pCount++; if (p?.status === "F") fCount++; if (p?.status === "J") jCount++; if (p?.status === "A") aCount++;
    });
    const totalAulas = encontrosDaTurmaRelatorio.length;
    return {
      nome: aluno.nome_catequizando, P: pCount, F: fCount, J: jCount, A: aCount,
      freq: totalAulas > 0 ? Math.round(((pCount + aCount) / totalAulas) * 100) : 100
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`
        @media print {
          .no-print, nav, header, aside, .tab-menu, button, select, input { display: none !important; }
          .print-area { display: block !important; width: 98% !important; border: none !important; margin: 0 !important; padding: 0 !important; }
          .only-print { display: inline !important; font-size: 14px !important; }
          table { width: 100% !important; border-collapse: collapse !important; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 8px !important; font-size: 14px !important; }
        }
        .only-print { display: none; }
      `}</style>
      
      {/* SELEÇÃO DE MODO */}
      <ModeToggle
        modo={modo}
        onChange={(m) => {
          setModo(m);
          if (m === 'registrar') setAbaAtiva("diario");
          else setAbaAtiva("ficha");
        }}
        labelRegistrar="+ Novo Diário"
        labelBuscar="🔍 Histórico"
      />

      {/* SELEÇÃO DE ABAS (apenas no modo buscar) */}
      {modo === 'buscar' && (
        <div className="no-print" style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
          <button onClick={() => setAbaAtiva("ficha")} style={{...tabBtnS, borderBottom: abaAtiva === "ficha" ? "3px solid #1f3b73" : "none", color: abaAtiva === "ficha" ? "#1f3b73" : "#64748b"}}>
            📊 Ficha de Classe Acumulada
          </button>
          <button onClick={() => setAbaAtiva("geral")} style={{...tabBtnS, borderBottom: abaAtiva === "geral" ? "3px solid #1f3b73" : "none", color: abaAtiva === "geral" ? "#1f3b73" : "#64748b"}}>
            🏛️ Relatório Geral da Catequese
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODO REGISTRAR: CHAMADA DIÁRIA + FICHAS SALVAS */}
      {/* ========================================================= */}
      {modo === 'registrar' && (
        <>
          <div className="no-print" style={{...toolbarS, flexDirection: 'column', alignItems: 'stretch', gap: '15px'}}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ width: '220px' }}>
                <label style={labS}>⛪ COMUNIDADE / CAPELA</label>
                <select style={inS} value={comunidadeSel} onChange={e => handleComunidadeChange(e.target.value)}>
                  <option value="">Todas as Comunidades...</option>
                  {comunidades?.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>

              <div style={{ width: '220px' }}>
                <label style={labS}>👥 TURMA</label>
                <select style={inS} value={turmaId} onChange={e => handleTurmaChange(e.target.value)}>
                  <option value="">Escolha a Turma...</option>
                  {turmasFiltradas.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} ({t.comunidade})</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: '250px' }}>
                <label style={labS}>📂 DIÁRIOS E FICHAS SALVAS DESTA TURMA</label>
                <select 
                  style={{...inS, borderColor: '#1f3b73', background: '#f0f4f8', fontWeight: 'bold'}} 
                  value={encontroIdSel} 
                  onChange={e => {
                    if(e.target.value) handleCarregarDiario(e.target.value);
                  }}
                  disabled={!turmaId}
                >
                  <option value="">-- Selecione para Imprimir/Ver ficha antiga ou Criar Nova --</option>
                  {turmaId && <option value="novo" style={{fontWeight: 'bold', color: '#16a34a'}}>[ + ] Iniciar Novo Diário de Hoje</option>}
                  {encontrosDaTurmaAtiva.map(e => (
                    <option key={e.id} value={e.id}>
                      📅 {(e.data ?? "").split('-').reverse().join('/')} | Tema: {e.tema || "Sem Tema"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {encontroIdSel && (
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '150px' }}>
                  <label style={labS}>DATA DO ENCONTRO</label>
                  <input type="date" style={inS} value={data} onChange={e => setData(e.target.value)} disabled={encontroIdSel !== 'novo'} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labS}>TEMA DO ENCONTRO (OPCIONAL)</label>
                  <input style={inS} placeholder="Ex: Aprendendo sobre a Eucaristia" value={temaEncontro} onChange={e => setTemaEncontro(e.target.value)} />
                </div>
                <div style={{ width: '200px' }}>
                  <label style={labS}>FILTRAR ALUNO NA LISTA</label>
                  <input style={inS} placeholder="Buscar nome..." value={busca} onChange={e => setBusca(e.target.value)} />
                </div>
                <button style={{...btnActionS, background: '#1f3b73', color: 'white'}} onClick={() => printWithTitle("Ficha de Presença - Catequese")}>🖨️ Imprimir Esta Ficha</button>
              </div>
            )}
          </div>

          <div className="print-area" style={containerCardS}>
            {listaChamada.length > 0 ? (
              <>
                <div style={headerPrintS}>
                  <h2 style={{ textAlign: 'center', margin: '0', color: '#1f3b73', letterSpacing: '1px' }}>DIÁRIO DE CLASSE E ENCONTROS</h2>
                  <p style={{ textAlign: 'center', margin: '8px 0 0 0', fontSize: '14px' }}>
                    <strong>Comunidade:</strong> {comunidadeSel || "Geral"} | <strong>Turma:</strong> {nomeTurmaAtiva}
                  </p>
                  <p style={{ textAlign: 'center', margin: '4px 0 0 0', fontSize: '14px' }}>
                    <strong>Data do Encontro:</strong> {data.split('-').reverse().join('/')} {temaEncontro && <>| <strong>Tema:</strong> {temaEncontro}</>}
                  </p>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={thS}>Nome do Catequizando</th>
                      <th style={thS}>Frequência / Status</th>
                      <th style={thS} className="no-print">Justificativa / Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaChamada.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase())).map((aluno) => {
                      const conf = (() => {
                        if (aluno.status === "P") return { bg: "#16a34a", text: "🟢 P - Presente" };
                        if (aluno.status === "F") return { bg: "#dc2626", text: "🔴 F - Falta" };
                        if (aluno.status === "J") return { bg: "#eab308", text: "🟡 J - Justificada" };
                        return { bg: "#f97316", text: "🟠 A - Atraso" };
                      })();
                      return (
                        <tr key={aluno.matricula_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={tdS}><strong>{aluno.nome}</strong></td>
                          <td style={tdS}>
                            <button className="no-print" onClick={() => {
                              setListaChamada(prev => prev.map(a => a.matricula_id === aluno.matricula_id ? { ...a, status: a.status === "P" ? "F" : a.status === "F" ? "J" : a.status === "J" ? "A" : "P" } : a));
                            }} style={{ background: conf.bg, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '135px', textAlign: 'left' }}>
                              {conf.text}
                            </button>
                            <span className="only-print" style={{ fontWeight: 'bold' }}>
                              {aluno.status === "P" && "PRESENTE"}
                              {aluno.status === "F" && "FALTA"}
                              {aluno.status === "J" && "JUSTIFICADA"}
                              {aluno.status === "A" && "ATRASO"}
                            </span>
                          </td>
                          <td style={tdS} className="no-print">
                             <input style={inS} disabled={aluno.status === 'P'} placeholder={aluno.status !== 'P' ? "Digite uma observação..." : ""} value={aluno.justificativa} onChange={e => {
                                  setListaChamada(prev => prev.map(a =>
                                    a.matricula_id === aluno.matricula_id ? { ...a, justificativa: e.target.value } : a
                                  ));
                             }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button className="no-print" onClick={handleSalvar} style={{ ...btnS, marginTop: '20px' }}>
                  💾 Confirmar e Salvar Alterações desta Ficha
                </button>
              </>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <span style={{fontSize: '40px', display: 'block', marginBottom: '10px'}}>📂</span>
                Selecione uma <strong>Comunidade</strong>, uma <strong>Turma</strong> e, em seguida, escolha uma <strong>Ficha Salva</strong> ou clique em <strong>[ + ] Iniciar Novo Diário</strong>.
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* MODO BUSCAR: FICHA DE CLASSE ACUMULADA */}
      {/* ========================================================= */}
      {modo === 'buscar' && abaAtiva === "ficha" && (
        <>
          <div className="no-print" style={toolbarS}>
            <div style={{ width: '300px' }}>
              <label style={labS}>SELECIONE A TURMA PARA ANÁLISE</label>
              <select style={inS} value={turmaIdRelatorio} onChange={e => setTurmaIdRelatorio(e.target.value)}>
                <option value="">Escolha uma Turma...</option>
                {turmas?.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.comunidade})</option>)}
              </select>
            </div>
            {turmaIdRelatorio && <button style={btnActionS} onClick={() => printWithTitle("Ficha de Presença - Catequese")}>🖨️ Imprimir Ficha Acumulada</button>}
          </div>

          <div className="print-area" style={containerCardS}>
            <div style={headerPrintS}>
              <h2 style={{ textAlign: 'center', margin: '0', color: '#1f3b73' }}>FICHA DE ACOMPANHAMENTO DA CLASSE</h2>
              <p style={{ textAlign: 'center', margin: '5px 0 0 0', fontSize: '14px' }}>
                <strong>Turma:</strong> {nomeTurmaRelatorio || "Não selecionada"} | <strong>Encontros Realizados:</strong> {encontrosDaTurmaRelatorio.length}
              </p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={thS}>Nome do Catequizando</th>
                  <th style={thS}>Presenças (P)</th>
                  <th style={thS}>Atrasos (A)</th>
                  <th style={thS}>Faltas (F)</th>
                  <th style={thS}>Justificadas (J)</th>
                  <th style={thS}>% Frequência</th>
                </tr>
              </thead>
              <tbody>
                {fichaClasseDados.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: row.freq < 75 ? '#fff1f2' : 'transparent' }}>
                    <td style={tdS}><strong>{row.nome}</strong></td>
                    <td style={{...tdS, color: '#16a34a'}}><strong>{row.P}</strong></td>
                    <td style={{...tdS, color: '#f97316'}}>{row.A}</td>
                    <td style={{...tdS, color: '#dc2626'}}>{row.F}</td>
                    <td style={{...tdS, color: '#eab308'}}>{row.J}</td>
                    <td style={tdS}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', background: row.freq >= 75 ? '#dcfce7' : '#fee2e2', color: row.freq >= 75 ? '#15803d' : '#991b1b' }}>{row.freq}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* MODO BUSCAR: RELATÓRIO GERAL */}
      {/* ========================================================= */}
      {modo === 'buscar' && abaAtiva === "geral" && (
        <div className="print-area" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={headerPrintS}>
            <h2 style={{ textAlign: 'center', margin: '0', color: '#1f3b73' }}>RELATÓRIO GERENCIAL DA CATEQUESE</h2>
            <p style={{ textAlign: 'center', margin: '5px 0 0 0', fontSize: '13px', textTransform: 'uppercase', color: '#64748b' }}>Área Missionária Nossa Senhora da Esperança</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={kpiS}><h3>{turmas?.length || 0}</h3><p>Turmas</p></div>
            <div style={kpiS}><h3>{catequistas?.length || 0}</h3><p>Catequistas</p></div>
            <div style={kpiS}><h3>{matriculas?.length || 0}</h3><p>Catequizandos</p></div>
            <div style={kpiS}><h3>{encontros?.length || 0}</h3><p>Aulas Dadas</p></div>
          </div>
          <div style={containerCardS}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={thS}>Turma</th>
                  <th style={thS}>Comunidade</th>
                  <th style={thS}>Etapa</th>
                  <th style={thS}>Alunos</th>
                  <th style={thS}>Encontros</th>
                </tr>
              </thead>
              <tbody>
                {turmas?.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdS}><strong>{t.nome}</strong></td>
                    <td style={tdS}>{t.comunidade}</td>
                    <td style={tdS}>{t.etapa}</td>
                    <td style={tdS}>{(matriculas || []).filter(m => m.turma_id === t.id).length}</td>
                    <td style={tdS}>{(encontros || []).filter(e => e.turma_id === t.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos
const toolbarS: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' };
const labS: CSSProperties = { fontSize: "10px", fontWeight: "bold", color: "#64748b", display: "block", marginBottom: "6px", textTransform: 'uppercase' };
const inS: CSSProperties = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: 'border-box', height: '40px' };
const btnActionS: CSSProperties = { padding: '0 20px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#1f3b73', fontSize: '13px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const btnS: CSSProperties = { width: "100%", padding: "14px", background: "#1f3b73", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const thS: CSSProperties = { padding: "12px", textAlign: "left", fontSize: "11px", color: "#64748b", textTransform: "uppercase" };
const tdS: CSSProperties = { padding: "12px", fontSize: "14px" };
const tabBtnS: CSSProperties = { padding: '10px 20px', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' };
const kpiS: CSSProperties = { flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' };
const containerCardS: CSSProperties = { background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" };
const headerPrintS: CSSProperties = { marginBottom: '20px', borderBottom: '2px solid #1f3b73', paddingBottom: '12px' };