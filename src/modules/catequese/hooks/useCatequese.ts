import { useState, useEffect, useCallback } from "react";
import { CatequeseRepository } from '../repository/catequese.repository';
import { PastoralRepository } from '../../pastoral/repository/pastoral.repository';
import { CatequeseTurma, Catequista, CatequeseFicha, CatequeseMatricula, CatequeseEncontro, CatequesePresenca, Fiel, Comunidade } from '@core/types/entities';

interface PresencaPayload {
  turma_id: number;
  tema?: string;
  data: string;
  chamada: { matricula_id: number; status: string; justificativa?: string; observacao?: string }[];
}

export function useCatequese() {
  const [turmas, setTurmas] = useState<CatequeseTurma[]>([]);
  const [matriculas, setMatriculas] = useState<CatequeseMatricula[]>([]);
  const [fieis, setFieis] = useState<Fiel[]>([]);
  const [catequistas, setCatequistas] = useState<Catequista[]>([]);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [fichas, setFichas] = useState<CatequeseFicha[]>([]);
  const [encontros, setEncontros] = useState<CatequeseEncontro[]>([]);
  const [presencas, setPresencas] = useState<CatequesePresenca[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [resCom, resF, resC, resFichas, resT, resM, resEnc, resPres] = await Promise.all([
        PastoralRepository.comunidades.findAllOrdenadas().catch(() => [] as Comunidade[]),
        PastoralRepository.fieis.findAllOrdenados().catch(() => [] as Fiel[]),
        CatequeseRepository.catequistas.findComFiel().catch(() => [] as Catequista[]),
        CatequeseRepository.fichas.findAllOrdenadas().catch(() => [] as CatequeseFicha[]),
        CatequeseRepository.turmas.findAllOrdenadas().catch(() => [] as CatequeseTurma[]),
        CatequeseRepository.matriculas.findAll().catch(() => [] as CatequeseMatricula[]),
        CatequeseRepository.encontros.findAllOrdenados().catch(() => [] as CatequeseEncontro[]),
        CatequeseRepository.presencas.findAll().catch(() => [] as CatequesePresenca[]),
      ]);
      setTurmas(resT); setFieis(resF); setCatequistas(resC); setComunidades(resCom);
      setFichas(resFichas); setMatriculas(resM); setEncontros(resEnc); setPresencas(resPres);
    } catch (err) {
      console.error("Erro ao carregar banco de dados:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarPresenca = async (payload: PresencaPayload) => {
    try {
      const encAnteriores = await CatequeseRepository.encontros.findByTurmaData(payload.turma_id, payload.data);
      for (const enc of encAnteriores) {
        await CatequeseRepository.presencas.deleteByEncontro(enc.id);
        await CatequeseRepository.encontros.hardDelete(enc.id);
      }

      await CatequeseRepository.encontros.create({
        turma_id: payload.turma_id,
        tema: payload.tema ?? "Não especificado",
        data: payload.data,
      });

      const encontroId = await CatequeseRepository.encontros.findIdRecente(payload.turma_id, payload.data);
      if (!encontroId) throw new Error("Falha ao recuperar o ID do encontro.");

      await CatequeseRepository.presencas.registrarChamada(encontroId, payload.chamada);
      await carregarDados();
    } catch (e) {
      console.error("Erro real interno ao salvar diário de classe:", e);
      throw e;
    }
  };

  const salvarCatequista = async (c: { fiel_id: number | string; formacao: string; disponibilidade: string }) => {
    try {
      const fielId = Number(c.fiel_id);
      const fiel = await PastoralRepository.fieis.findById(fielId);
      if (!fiel) return;
      await CatequeseRepository.catequistas.createFromFiel(
        fielId, fiel.nome, c.formacao, c.disponibilidade,
        fiel.telefone ?? "", fiel.email ?? "", fiel.endereco ?? ""
      );
      await carregarDados();
    } catch (e) { console.error(e); }
  };

  const excluirCatequista = async (id: number) => {
    try {
      await CatequeseRepository.catequistas.softDelete(id);
      await carregarDados();
    } catch (e) { console.error(e); }
  };

  const salvarTurma = async (t: Partial<CatequeseTurma>) => {
    try {
      if (t.id) {
        await CatequeseRepository.turmas.update(t.id, {
          nome: t.nome, etapa: t.etapa, ano: t.ano,
          comunidade: t.comunidade, horario: t.horario,
          catequista_id: t.catequista_id ?? "", nome_catequista: t.nome_catequista ?? "",
        });
      } else {
        await CatequeseRepository.turmas.create({
          nome: t.nome!, etapa: t.etapa!, ano: t.ano!,
          comunidade: t.comunidade, horario: t.horario,
          catequista_id: t.catequista_id ?? "", nome_catequista: t.nome_catequista ?? "",
        });
      }
      await carregarDados();
    } catch (e) { console.error(e); }
  };

  const excluirTurma = async (id: number) => {
    try {
      await CatequeseRepository.turmas.softDelete(id);
      await CatequeseRepository.matriculas.softDeleteByTurma(id);
      await carregarDados();
    } catch (e) { console.error(e); }
  };

  const salvarMatricula = async (m: { turma_id: number; ficha_id: number; nome_catequizando?: string | null }) => {
    try {
      await CatequeseRepository.matriculas.create({
        turma_id: Number(m.turma_id),
        ficha_id: Number(m.ficha_id),
        nome_catequizando: m.nome_catequizando ?? "",
      });
      await carregarDados();
    } catch (e) { console.error(e); }
  };

  const excluirMatricula = async (id: number) => {
    try {
      await CatequeseRepository.matriculas.softDelete(id);
      await carregarDados();
    } catch (e) { console.error(e); }
  };

  const salvarFicha = async (f: { atividade: string; nome: string; nascimento: string; endereco: string; telefone: string; email: string; responsavel: string; observacoes: string }) => {
    try {
      await CatequeseRepository.fichas.create(f);
      await carregarDados();
    } catch (e) { console.error(e); }
  };

  const excluirFicha = async (id: number) => {
    try {
      await CatequeseRepository.fichas.softDelete(id);
      await carregarDados();
    } catch (e) { console.error(e); }
  };

  useEffect(() => { carregarDados(); }, [carregarDados]);

  return {
    turmas, matriculas, fieis, catequistas, comunidades, fichas,
    encontros, presencas, loading,
    salvarTurma, excluirTurma,
    salvarMatricula, excluirMatricula,
    salvarCatequista, excluirCatequista,
    salvarFicha, excluirFicha,
    registrarPresenca,
  };
}
