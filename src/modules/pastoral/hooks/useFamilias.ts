import { useState, useEffect, useCallback } from "react";
import { PastoralRepository } from '../repository/pastoral.repository';
import { useToast } from '@core/ui/Toast';
import { getDb } from '@core/database';
import { normalizeText } from '@core/utils/validators';
import type { Familia } from '../../../core/types/entities';

interface FamiliaDraft {
  id?: number;
  sobrenome: string;
  endereco: string;
  comunidade: string;
  responsavel_id: number | null;
  recebe_caritas: boolean;
  observacoes: string;
}

const estadoInicial: FamiliaDraft = {
  sobrenome: "",
  endereco: "",
  comunidade: "",
  responsavel_id: null,
  recebe_caritas: false,
  observacoes: "",
};

export function useFamilias() {
  const { showToast } = useToast();
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [comunidades, setComunidades] = useState<{ id: number; nome: string }[]>([]);
  const [membros, setMembros] = useState<{ id: number; familia_id?: number | null; fiel_id?: number | null; parentesco?: string | null; nome_fiel?: string | null }[]>([]);
  const [fieisDisponiveis, setFieisDisponiveis] = useState<{ id: number; nome: string }[]>([]);
  const [familiaDraft, setFamiliaDraft] = useState<FamiliaDraft>(estadoInicial);
  const [contagemMembros, setContagemMembros] = useState<Record<number, number>>({});

  const carregarDados = useCallback(async () => {
    try {
      const [resFamilias, resComuns, resFieis, contagem] = await Promise.all([
        PastoralRepository.familias.findAllOrdenadas(),
        PastoralRepository.comunidades.findNomes(),
        PastoralRepository.fieis.findAllOrdenados(),
        PastoralRepository.familias.contagemPorFamilia(),
      ]);
      setFamilias(resFamilias);
      setComunidades(resComuns);
      setFieisDisponiveis(resFieis.map(f => ({ id: f.id, nome: f.nome })));
      setContagemMembros(contagem);
    } catch (err) {
      console.error("Erro ao carregar famílias:", err);
    }
  }, []);

  const carregarMembros = async (familiaId: number) => {
    try {
      const res = await PastoralRepository.membros.findByFamilia(familiaId);
      setMembros(res);
    } catch (err) { console.error(err); }
  };

  const salvarFamilia = async () => {
    if (!familiaDraft.sobrenome?.trim()) { showToast("O sobrenome é obrigatório!", "error"); return; }
    const db = await getDb();
    const nomeNorm = normalizeText(familiaDraft.sobrenome);
    const comNorm = normalizeText(familiaDraft.comunidade ?? "");
    const existentes = await db.select<{ id: number; sobrenome: string; comunidade: string | null }[]>(
      "SELECT id, sobrenome, comunidade FROM familias WHERE deleted_at IS NULL AND id != $1", [familiaDraft.id ?? -1]
    );
    if (existentes.some(e => normalizeText(e.sobrenome) === nomeNorm && normalizeText(e.comunidade ?? "") === comNorm)) {
      showToast("Já existe uma família com este sobrenome nesta comunidade.", "error"); return;
    }
    try {
      const comMatch = comunidades.find(c => c.nome === familiaDraft.comunidade);
      const campos = {
        sobrenome: familiaDraft.sobrenome.trim(),
        endereco: familiaDraft.endereco ?? "",
        comunidade_id: comMatch ? Number(comMatch.id) : null,
        comunidade: familiaDraft.comunidade ?? "",
        responsavel_id: familiaDraft.responsavel_id,
        recebe_caritas: familiaDraft.recebe_caritas ? 1 : 0,
        observacoes: familiaDraft.observacoes ?? "",
      };
      if (familiaDraft.id) {
        await PastoralRepository.familias.update(familiaDraft.id, campos);
      } else {
        await PastoralRepository.familias.create(campos);
      }
      setFamiliaDraft(estadoInicial);
      await carregarDados();
      showToast("Família salva com sucesso!", "success");
    } catch (err) { console.error(err); }
  };

  const vincularMembro = async (familiaId: number, fielId: number, parentesco: string) => {
    try {
      await PastoralRepository.membros.vincular(familiaId, fielId, parentesco);
      await carregarMembros(familiaId);
    } catch (err) { console.error(err); }
  };

  const removerMembro = async (id: number, familiaId: number) => {
    try {
      await PastoralRepository.membros.hardDelete(id);
      await carregarMembros(familiaId);
    } catch (err) { console.error(err); }
  };

  const editarFamilia = (f: Familia) => {
    setFamiliaDraft({
      id: f.id,
      sobrenome: f.sobrenome,
      endereco: f.endereco ?? "",
      comunidade: f.comunidade ?? "",
      responsavel_id: f.responsavel_id ?? null,
      recebe_caritas: Boolean(f.recebe_caritas),
      observacoes: f.observacoes ?? "",
    });
  };

  useEffect(() => { carregarDados(); }, [carregarDados]);

  return {
    familias,
    familiaDraft,
    setFamiliaDraft,
    editarFamilia,
    salvarFamilia,
    comunidades,
    membros,
    fieisDisponiveis,
    carregarMembros,
    vincularMembro,
    removerMembro,
    limparDraft: () => setFamiliaDraft(estadoInicial),
    contagemMembros,
    carregarDados,
  };
}
