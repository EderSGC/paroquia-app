import { useState } from "react";
import { getDb } from "@core/database";

export interface DadosRelatorio {
  batismos: number;
  primeiraComunhao: number;
  crismas: number;
  casamentos: number;
  uncoes: number;
  visitasPastorais: number;
  catequizandos: number;
  novosDizimistas: number;
}

export function useRelatorioData() {
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function buscarDados(dataInicio: string, dataFim: string): Promise<DadosRelatorio | null> {
    if (!dataInicio || !dataFim) {
      setErro("Informe o período inicial e final.");
      return null;
    }
    if (dataInicio > dataFim) {
      setErro("A data inicial deve ser anterior à data final.");
      return null;
    }

    setCarregando(true);
    setErro(null);

    try {
      const db = await getDb();

      // Sacramentos por tipo filtrados por data_sacramento
      const contarSacramento = async (tipo: string): Promise<number> => {
        const r = await db.select<{ c: number }[]>(
          `SELECT COUNT(*) as c FROM sacramentos_registros
           WHERE tipo = $1 AND data_sacramento >= $2 AND data_sacramento <= $3 AND deleted_at IS NULL`,
          [tipo, dataInicio, dataFim]
        ).catch(() => [{ c: 0 }]);
        return r[0]?.c ?? 0;
      };

      // Catequizandos: conta matrículas de turmas cujo ano está dentro do período
      const anoInicio = Number(dataInicio.substring(0, 4));
      const anoFim = Number(dataFim.substring(0, 4));
      const rCateq = await db.select<{ c: number }[]>(
        `SELECT COUNT(*) as c
         FROM catequese_matriculas m
         LEFT JOIN catequese_turmas t ON m.turma_id = t.id
         WHERE (t.ano IS NULL OR (t.ano >= $1 AND t.ano <= $2))`,
        [anoInicio, anoFim]
      ).catch(() => [{ c: 0 }]);
      const catequizandos = rCateq[0]?.c ?? 0;

      // Dizimistas: todos os fiéis marcados como dizimistas
      const rDiz = await db.select<{ c: number }[]>(
        `SELECT COUNT(*) as c FROM fieis WHERE deleted_at IS NULL AND isDizimista = 1`
      ).catch(() => [{ c: 0 }]);
      const novosDizimistas = rDiz[0]?.c ?? 0;

      // Visitas pastorais: agenda com categoria visita no período
      const rVisitas = await db.select<{ c: number }[]>(
        `SELECT COUNT(*) as c FROM agenda_compromissos
         WHERE (categoria LIKE '%isita%' OR categoria LIKE '%astor%')
         AND data >= $1 AND data <= $2`,
        [dataInicio, dataFim]
      ).catch(() => [{ c: 0 }]);
      const visitasPastorais = rVisitas[0]?.c ?? 0;

      const resultado: DadosRelatorio = {
        batismos: await contarSacramento("BATISMO"),
        primeiraComunhao: await contarSacramento("EUCARISTIA"),
        crismas: await contarSacramento("CRISMA"),
        casamentos: await contarSacramento("MATRIMONIO"),
        uncoes: await contarSacramento("UNCAO"),
        visitasPastorais,
        catequizandos,
        novosDizimistas,
      };

      setDados(resultado);
      return resultado;
    } catch (e) {
      console.error("[useRelatorioData]", e);
      setErro("Erro ao consultar o banco de dados.");
      return null;
    } finally {
      setCarregando(false);
    }
  }

  return { dados, carregando, erro, buscarDados };
}
