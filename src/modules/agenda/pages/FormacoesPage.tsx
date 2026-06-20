// src/modules/agenda/pages/FormacoesPage.tsx
import { useState, useEffect } from "react";
import { getDb } from "@core/database";
import { FielSelector } from "@core/components/FielSelector";
import type { Paroquia } from "../../../core/types/app.types";
import { DocumentHeader } from "@core/components/DocumentHeader";
import { FontSelector } from "@core/components/FontSelector";
import { ModeToggle, type ModoPagina } from "@core/components/ModeToggle";

// Importações das funções utilitárias centralizadas
import { formatarDataBR } from "../utils/dateFormats";
import { dispararImpressaoA4 } from "../utils/printHelper";

interface FormacaoRow {
  id: number;
  titulo: string;
  descricao?: string | null;
  data: string;
  horario: string;
  local: string;
  nome_palestrante?: string | null;
}

interface Props {
  paroquia: Paroquia;
}

export function FormacoesPage({ paroquia }: Props) {
  const [modo, setModo] = useState<ModoPagina>("registrar");
  const [formacoes, setFormacoes] = useState<FormacaoRow[]>([]);
  const [fonte, setFonte] = useState("Times New Roman");

  const [formacaoSelecionada, setFormacaoSelecionada] = useState<FormacaoRow | null>(null);

  const [curso, setCurso] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [local, setLocal] = useState("");
  const [fielId, setFielId] = useState<number | null>(null);

  async function carregarFormacoes() {
    try {
      const db = await getDb();
      const dados = await db.select<FormacaoRow[]>(`
        SELECT f.*, fi.nome as nome_palestrante
        FROM agenda_compromissos f
        LEFT JOIN fieis fi ON f.fiel_id = fi.id
        WHERE f.categoria = 'formacao'
        ORDER BY f.data DESC, f.horario DESC
      `);
      setFormacoes(dados || []);
      
      if (dados && dados.length > 0) {
        setFormacaoSelecionada(dados[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar formações:", error);
    }
  }

  useEffect(() => {
    carregarFormacoes();
  }, []);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!curso || !data || !horario || !local) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    try {
      const db = await getDb();
      await db.execute(`
        INSERT INTO agenda_compromissos (titulo, descricao, data, horario, local, categoria, fiel_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [curso, descricao, data, horario, local, "formacao", fielId]);

      setCurso("");
      setDescricao("");
      setData("");
      setHorario("");
      setLocal("");
      setFielId(null);
      
      alert("Formação agendada com sucesso!");
      await carregarFormacoes();
    } catch (error) {
      console.error("Erro ao salvar formação:", error);
    }
  }

  // CHAMADA DO ACIONADOR DE IMPRESSÃO COMPARTILHADO
  const handlePrint = () => {
    dispararImpressaoA4("papel-formacao", fonte);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <ModeToggle modo={modo} onChange={setModo} />

      {/* FORMULÁRIO (modo registrar) */}
      {modo === "registrar" && (
      <form onSubmit={handleSalvar} style={{ background: "white", padding: 24, borderRadius: 18, border: "1px solid #e4e7ec", display: "grid", gap: 14 }}>
        <h3 style={{ color: "#1f3b73", margin: 0, fontSize: 16, fontWeight: 700 }}>Nova Formação / Curso</h3>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
          Nome do Curso / Encontro *
          <input type="text" value={curso} onChange={(e) => setCurso(e.target.value)} placeholder="Ex: Curso de Noivos, Formação de Catequistas" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }} />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#344054" }}>
            Data *
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }} />
          </label>
          <label style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#344054" }}>
            Horário *
            <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }} />
          </label>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
          Local de Realização *
          <input type="text" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Auditório, Comunidade São José" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontSize: 13 }} />
        </label>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
          Palestrante / Assessor Responsável
          <div style={{ marginTop: 4 }}>
            <FielSelector value={fielId ?? ""} onChange={(id) => setFielId(id ? Number(id) : null)} label="Selecione o palestrante" placeholder="Selecione um fiel..." />
          </div>
        </label>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#344054" }}>
          Descrição / Detalhes do Conteúdo
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Digite os temas ou cronograma da formação..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d0d5dd", marginTop: 4, boxSizing: "border-box", fontFamily: "inherit", fontSize: 13, resize: "vertical" }} />
        </label>

        <button type="submit" style={{ background: "#1f3b73", color: "white", border: "none", padding: "12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, marginTop: 4 }}>
          Cadastrar Formação
        </button>
      </form>
      )}

      {/* LISTA (modo buscar) */}
      {modo === "buscar" && (
      <div style={{ background: "white", padding: 20, borderRadius: 18, border: "1px solid #e4e7ec", display: "grid", gap: 10 }}>
        <h3 style={{ color: "#1f3b73", margin: 0, fontSize: 14, fontWeight: 700 }}>Cursos e Formações Registrados</h3>
        {formacoes.length === 0 ? (
          <p style={{ color: "#667085", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhuma formação agendada.</p>
        ) : formacoes.map((item) => (
          <div key={item.id} onClick={() => setFormacaoSelecionada(item)} style={{ padding: 12, border: "1px solid #eaecf0", borderRadius: 10, cursor: "pointer", background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s ease" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: 0, color: "#101828", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.titulo}</h4>
              <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#475467" }}>📅 {formatarDataBR(item.data)} às {item.horario}h</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#1f3b73", padding: "4px 8px", background: "white", borderRadius: 6, border: "1px solid #d0d5dd" }}>Ver 👁️</span>
          </div>
        ))}
      </div>
      )}

      {/* MODAL DE PRÉ-VISUALIZAÇÃO A4 */}
      {formacaoSelecionada && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setFormacaoSelecionada(null)}>
        <div style={{ background: "white", borderRadius: 18, padding: 24, maxWidth: 860, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <FontSelector fonteAtual={fonte} onChange={setFonte} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handlePrint} style={{ background: "#1f3b73", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 700 }}>Imprimir Cartaz / Ficha</button>
              <button onClick={() => setFormacaoSelecionada(null)} style={{ background: "#f1f5f9", color: "#475467", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 700 }}>✕ Fechar</button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", background: "#f2f4f7", padding: 20, borderRadius: 14 }}>
            <article id="papel-formacao" style={{ width: "210mm", minHeight: "297mm", background: "white", padding: "40px", boxSizing: "border-box", fontFamily: `"${fonte}", serif`, boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>
              <DocumentHeader paroquia={paroquia} />
              <h2 style={{ textAlign: "center", textTransform: "uppercase", marginTop: 40, borderBottom: "2px solid #1f3b73", paddingBottom: 10, fontSize: 18, fontWeight: 800, color: "#1f3b73" }}>
                CARTAZ / PROGRAMAÇÃO DE ENCONTRO
              </h2>
              <div style={{ marginTop: 30, fontSize: "16px", display: "grid", gap: "14px", lineHeight: "1.6" }}>
                <p style={{ fontSize: "20px", color: "#1f3b73", margin: "0 0 10px 0" }}>
                  <strong>Tema: {formacaoSelecionada.titulo ? formacaoSelecionada.titulo.toUpperCase() : ""}</strong>
                </p>
                <p style={{ margin: 0 }}><strong>Data:</strong> {formatarDataBR(formacaoSelecionada.data)}</p>
                <p style={{ margin: 0 }}><strong>Horário de Início:</strong> {formacaoSelecionada.horario}h</p>
                <p style={{ margin: 0 }}><strong>Local do Encontro:</strong> {formacaoSelecionada.local}</p>
                <p style={{ margin: 0 }}><strong>Assessor / Palestrante:</strong> {formacaoSelecionada.nome_palestrante || "Equipe Paroquial Interna"}</p>
                <hr style={{ border: 0, borderTop: "1px solid #e4e7ec", margin: "10px 0" }} />
                <div style={{ fontSize: "15px", lineHeight: "1.8" }}>
                  <p style={{ margin: "0 0 6px 0" }}><strong>Ementa / Conteúdo Programático:</strong></p>
                  <div style={{ background: "#fcfcfd", padding: "15px", borderRadius: "8px", border: "1px solid #eaecf0", whiteSpace: "pre-wrap", textAlign: "justify" }}>
                    {formacaoSelecionada.descricao || "Nenhum detalhe adicional cadastrado para esta formação."}
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
      )}

    </div>
  );
}