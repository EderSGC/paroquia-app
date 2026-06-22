import { printWithTitle } from "@core/utils/pdfGenerator";
import { useState, CSSProperties } from "react";
import { useComunidades } from "../hooks/useComunidades";
import { DocumentHeader } from "@core/components/DocumentHeader";
import type { Paroquia } from '../../../core/types/app.types';

export function ComunidadesPage({ paroquia, fonte }: { paroquia?: Paroquia | null; fonte: string }) {
  const { 
    comunidades, 
    comunidadeDraft, 
    setComunidadeDraft, 
    salvarComunidade, 
    excluirComunidade,
    limparDraft 
  } = useComunidades();

  const [busca, setBusca] = useState("");

  const filtradas = comunidades.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 6) return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
    if (v.length > 2) return `(${v.substring(0, 2)}) ${v.substring(2)}`;
    return v;
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Inter, sans-serif" }}>
      
      {/* 🟢 CSS DE IMPRESSÃO PADRONIZADO - RESOLVE O ENQUADRAMENTO */}
      <style>{`
        @page {
          size: A4;
          margin: 1.5cm; /* Margens de respiro profissionais */
        }

        @media screen {
          #area-impressao-comunidades { display: none !important; }
        }

        @media print {
          /* 1. Oculta os elementos do sistema da tela */
          body * {
            visibility: hidden;
            background: transparent !important;
          }

          /* 2. Torna visível apenas o papel do relatório */
          #area-impressao-comunidades, #area-impressao-comunidades * {
            visibility: visible;
          }

          /* 3. Posiciona a folha no topo esquerdo do papel real */
          #area-impressao-comunidades {
            position: absolute;
            left: 0;
            top: 0;
            width: 98%;
            display: block !important;
            padding: 0;
            margin: 0;
          }

          /* Ajustes estéticos do cabeçalho oficial do sistema */
          #area-impressao-comunidades .cabecalho-impressao-oficial {
              border-bottom: 1.5px solid #1f3b73 !important;
              padding-bottom: 15px !important;
              margin-bottom: 25px !important;
          }
          #area-impressao-comunidades .cabecalho-impressao-oficial img {
              max-width: 65px !important;
              height: auto !important;
          }

          #area-impressao-comunidades h2 {
            text-align: center;
            font-size: 18pt !important;
            color: #1f3b73;
            margin-top: 25px !important;
            margin-bottom: 15px !important;
            font-family: "${fonte.replace(/[^a-zA-Z0-9\s\-_]/g, '')}", sans-serif;
          }

          /* Tabela impressa */
          #area-impressao-comunidades table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
            font-family: "${fonte.replace(/[^a-zA-Z0-9\s\-_]/g, '')}", sans-serif;
            font-size: 11pt !important;
          }
          #area-impressao-comunidades th, #area-impressao-comunidades td { 
            border: 1px solid #000; 
            padding: 8px; 
            text-align: left; 
          }
          #area-impressao-comunidades th {
              background-color: #f0f0f0 !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
          }
        }
      `}</style>

      {/* Interface do Sistema (Ocultada automaticamente no papel) */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={formCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: "#1f3b73", margin: 0 }}>Gestão de Unidade</h3>
            {comunidadeDraft.id && <button onClick={limparDraft} style={{ fontSize: '10px', cursor: 'pointer' }}>Novo</button>}
          </div>

          <label style={labelStyle}>NOME DA CAPELA/COMUNIDADE</label>
          <input style={inputStyle} value={comunidadeDraft.nome} onChange={e => setComunidadeDraft({...comunidadeDraft, nome: e.target.value})} />

          <label style={labelStyle}>CNPJ / ENDEREÇO</label>
          <input placeholder="CNPJ" style={inputStyle} value={comunidadeDraft.cnpj || ""} onChange={e => setComunidadeDraft({...comunidadeDraft, cnpj: e.target.value})} />
          <input placeholder="Endereço Completo" style={inputStyle} value={comunidadeDraft.endereco || ""} onChange={e => setComunidadeDraft({...comunidadeDraft, endereco: e.target.value})} />

          {['coordenador', 'tesoureiro', 'secretario'].map(cargo => (
            <div key={cargo} style={cargoBox}>
              <span style={labelCargo}>{cargo.toUpperCase()}</span>
              <input
                placeholder="Nome"
                style={inputStyle}
                value={(comunidadeDraft as unknown as Record<string, string>)[`${cargo}_nome`]}
                onChange={e => setComunidadeDraft({...comunidadeDraft, [`${cargo}_nome`]: e.target.value})}
              />
              <input
                placeholder="Telefone"
                style={inputStyle}
                value={(comunidadeDraft as unknown as Record<string, string>)[`${cargo}_tel`]}
                onChange={e => setComunidadeDraft({
                  ...comunidadeDraft,
                  [`${cargo}_tel`]: maskPhone(e.target.value)
                })}
              />
            </div>
          ))}

          <button onClick={salvarComunidade} style={btnPrimary}>Salvar Unidade</button>
          <button onClick={() => printWithTitle("Lista de Comunidades")} style={btnSecondary}>🖨️ Imprimir Lista Geral</button>
        </div>

        <div style={{ flex: 1 }}>
          <input placeholder="🔍 Buscar capela por nome..." style={searchStyle} value={busca} onChange={e => setBusca(e.target.value)} />
          <div style={tableWrapper}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={thStyle}>Comunidade</th>
                  <th style={thStyle}>Coordenação</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={tdStyle}><strong>{c.nome}</strong><br/><small>{c.cnpj || 'Sem CNPJ'}</small></td>
                    <td style={tdStyle}>{c.coordenador_nome || '---'}</td>
                    <td style={tdStyle}>
                      <button onClick={() => setComunidadeDraft(c)} style={actionBtn} title="Editar">✏️</button>
                      <button onClick={() => c.id && excluirComunidade(c.id)} style={{...actionBtn, color: 'red'}} title="Excluir">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* 2. PAPEL DA IMPRESSORA (Oculto no sistema) */}
      {/* ========================================= */}
      <div id="area-impressao-comunidades">
        {paroquia && <DocumentHeader paroquia={paroquia} />}
        <h2>RELATÓRIO DE COMUNIDADES</h2>
        <table>
          <thead>
            <tr>
              <th>Unidade / Comunidade</th>
              <th>Coordenador(a)</th>
              <th>Tesoureiro(a)</th>
              <th>Secretário(a)</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map(c => (
              <tr key={c.id}>
                <td>
                  <strong>{c.nome}</strong>
                  {c.cnpj && <><br/><small>CNPJ: {c.cnpj}</small></>}
                </td>
                <td>{c.coordenador_nome ? `${c.coordenador_nome} ${c.coordenador_tel ? `${c.coordenador_tel}` : ''}` : '---'}</td>
                <td>{c.tesoureiro_nome ? `${c.tesoureiro_nome} ${c.tesoureiro_tel ? `${c.tesoureiro_tel}` : ''}` : '---'}</td>
                <td>{c.secretario_nome ? `${c.secretario_nome} ${c.secretario_tel ? `${c.secretario_tel}` : ''}` : '---'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Estilos de tela preservados
const formCard: CSSProperties = { width: "350px", padding: "20px", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", height: "fit-content" };
const cargoBox: CSSProperties = { background: "#f8fafc", padding: "8px", borderRadius: "8px", marginBottom: "8px", border: "1px solid #eff2f5" };
const labelCargo: CSSProperties = { fontSize: "9px", fontWeight: "bold", color: "#1f3b73", display: "block", marginBottom: "4px" };
const inputStyle: CSSProperties = { width: "100%", padding: "7px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "4px", boxSizing: "border-box", fontSize: "12px" };
const labelStyle: CSSProperties = { fontSize: "11px", fontWeight: "bold", color: "#64748b", marginBottom: "5px", display: "block" };
const btnPrimary: CSSProperties = { width: "100%", padding: "12px", background: "#1f3b73", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const btnSecondary: CSSProperties = { width: "100%", padding: "10px", background: "white", color: "#1f3b73", border: "1px solid #1f3b73", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" };
const searchStyle: CSSProperties = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "15px" };
const tableWrapper: CSSProperties = { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" };
const thStyle: CSSProperties = { padding: "12px", textAlign: "left", fontSize: "11px", color: "#64748b" };
const tdStyle: CSSProperties = { padding: "12px", fontSize: "13px" };
const actionBtn: CSSProperties = { background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginRight: "8px" };