import { useState, CSSProperties } from "react";
import { PastoralRepository } from '../../pastoral/repository/pastoral.repository';

interface Fiel {
  id: number;
  nome: string;
  comunidade?: string;
  dataNasc?: string;
  telefone?: string;
  endereco?: string;
}

interface Props {
  onSelecionar: (fiel: Fiel) => void;
  label?: string;
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "12px",
  border: "1px solid #d0d5dd",
  background: "rgba(255,255,255,0.92)",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

export function BuscarFielPastoral({ onSelecionar, label = "Buscar Fiel no Módulo Pastoral" }: Props) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Fiel[]>([]);
  const [loading, setLoading] = useState(false);
  const [aberto, setAberto] = useState(false);

  const pesquisar = async (termo: string) => {
    setBusca(termo);
    if (termo.length < 2) { setResultados([]); return; }
    try {
      setLoading(true);
      const res = await PastoralRepository.fieis.findByNome(termo);
      setResultados(res as Fiel[]);
    } catch {
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <details style={{ marginBottom: "12px" }} open={aberto} onToggle={e => setAberto((e.target as HTMLDetailsElement).open)}>
      <summary style={{
        cursor: "pointer",
        padding: "10px 16px",
        background: "rgba(34,197,94,0.1)",
        borderRadius: "10px",
        fontWeight: 700,
        fontSize: "13px",
        color: "#15803d",
        border: "1px solid rgba(34,197,94,0.2)",
      }}>
        👥 {label}
      </summary>
      <div style={{ padding: "12px 0" }}>
        <input
          style={inputStyle}
          placeholder="Digite o nome do fiel para buscar..."
          value={busca}
          onChange={e => pesquisar(e.target.value)}
        />
        {loading && <div style={{ padding: "8px", fontSize: "13px", color: "#64748b" }}>Buscando...</div>}
        {!loading && busca.length >= 2 && resultados.length === 0 && (
          <div style={{ padding: "8px", fontSize: "13px", color: "#94a3b8" }}>Nenhum fiel encontrado com esse nome.</div>
        )}
        {resultados.length > 0 && (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", marginTop: "8px" }}>
            {resultados.map(f => (
              <div
                key={f.id}
                style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{f.nome}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{f.comunidade || "Sem comunidade"}{f.dataNasc ? ` • Nasc: ${f.dataNasc}` : ""}</div>
                </div>
                <button
                  onClick={() => { onSelecionar(f); setBusca(""); setResultados([]); setAberto(false); }}
                  style={{ background: "linear-gradient(135deg, #15803d, #16a34a)", color: "white", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  Usar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
