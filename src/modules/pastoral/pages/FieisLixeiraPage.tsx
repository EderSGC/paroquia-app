import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { getDb } from "@core/database";
import { FielService } from "@core/services/fiel.service";
import { useToast } from "@core/ui/Toast";

interface FielExcluido {
  id: number;
  nome: string;
  comunidade?: string | null;
  deleted_at?: string | null;
}

export function FieisLixeiraPage() {
  const [fieis, setFieis] = useState<FielExcluido[]>([]);
  const [restaurando, setRestaurando] = useState<number | null>(null);
  const { showToast } = useToast();

  const carregar = useCallback(async () => {
    const db = await getDb();
    const rows = await db.select<FielExcluido[]>(
      "SELECT id, nome, comunidade, deleted_at FROM fieis WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC"
    );
    setFieis(rows);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const restaurar = async (id: number, nome: string) => {
    setRestaurando(id);
    try {
      await FielService.restore(id);
      showToast(`"${nome}" restaurado com sucesso!`, "success");
      await carregar();
    } catch {
      showToast("Erro ao restaurar registro.", "error");
    } finally {
      setRestaurando(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-app)", overflow: "hidden" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }`}</style>
      <div style={{
        padding: "16px 16px 12px",
        background: "var(--bg-header)", borderBottom: "1px solid var(--separator)", flexShrink: 0,
      }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
          <Trash2 size={15} />
          Registros Excluídos ({fieis.length})
        </h3>
        <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--text-tertiary)" }}>
          Fiéis removidos podem ser restaurados a qualquer momento.
        </p>
      </div>

      <div className="mac-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {fieis.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 8 }}>
            <div style={{ fontSize: 28, opacity: 0.2 }}>🗑️</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Nenhum registro na lixeira</div>
          </div>
        ) : fieis.map(f => (
          <div key={f.id} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 9, marginBottom: 2,
            transition: "background 80ms",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "")}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{f.nome}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>
                {f.comunidade || "Sem comunidade"}
                {f.deleted_at && ` · Excluído em ${f.deleted_at.slice(0, 10).split("-").reverse().join("/")}`}
              </div>
            </div>
            <button
              onClick={() => restaurar(f.id, f.nome)}
              disabled={restaurando === f.id}
              title="Restaurar"
              style={{
                height: 30, padding: "0 12px", display: "flex", alignItems: "center", gap: 5,
                background: restaurando === f.id ? "var(--text-tertiary)" : "var(--accent)",
                color: "#fff", border: "none", borderRadius: 8,
                fontSize: 11.5, fontWeight: 600,
                cursor: restaurando === f.id ? "wait" : "pointer",
                fontFamily: "inherit", opacity: restaurando === f.id ? 0.7 : 1,
              }}
            >
              <RotateCcw size={12} style={restaurando === f.id ? { animation: "spin 1s linear infinite" } : undefined} />
              {restaurando === f.id ? "Restaurando..." : "Restaurar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
