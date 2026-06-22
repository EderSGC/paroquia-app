import { useState, useEffect, useCallback } from "react";
import { PastoralRepository } from '../repository/pastoral.repository';
import { FielService } from '@core/services/fiel.service';
import { isValidCPF } from '@core/utils/validators';
import { ask } from '@tauri-apps/plugin-dialog';
import type { FielDraft } from '../types';

const estadoInicial: FielDraft = {
  nome: "",
  data_nascimento: "",
  telefone: "",
  email: "",
  endereco: "",
  cpf: "",
  comunidade: "",
  isDizimista: false,
};

export function usePastoral() {
  const [fieis, setFieis] = useState<{ id: number; nome: string; data_nascimento?: string | null; telefone?: string | null; email?: string | null; endereco?: string | null; cpf?: string | null; comunidade?: string | null; isDizimista?: number | null }[]>([]);
  const [comunidades, setComunidades] = useState<{ nome: string }[]>([]);
  const [fielDraft, setFielDraft] = useState<FielDraft>(estadoInicial);

  const limparDraft = () => setFielDraft(estadoInicial);

  const carregarDados = useCallback(async () => {
    try {
      const rawFieis = await PastoralRepository.fieis.findAllOrdenados();
      setFieis(rawFieis);

      const comuns = await PastoralRepository.comunidades.findNomes();
      setComunidades(comuns);
    } catch (err) {
      console.error("Erro ao carregar dados pastorais:", err);
    }
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const atualizarDraft = (campo: string, valor: unknown) => {
    setFielDraft(prev => ({ ...prev, [campo]: valor }));
  };

  const salvarFiel = async (): Promise<{ ok: boolean; duplicado?: boolean; cpfInvalido?: boolean }> => {
    if (!fielDraft.nome?.trim()) return { ok: false };
    if (fielDraft.cpf && !isValidCPF(fielDraft.cpf)) return { ok: false, cpfInvalido: true };
    try {
      const dizimista = fielDraft.isDizimista ? 1 : 0;
      const comunidades = await PastoralRepository.comunidades.findNomes();
      const comMatch = comunidades.find(c => c.nome === fielDraft.comunidade);
      if (fielDraft.id) {
        await PastoralRepository.fieis.update(fielDraft.id, {
          nome: fielDraft.nome,
          data_nascimento: fielDraft.data_nascimento,
          telefone: fielDraft.telefone || "",
          email: fielDraft.email || "",
          endereco: fielDraft.endereco || "",
          cpf: fielDraft.cpf || "",
          comunidade_id: comMatch?.id ?? null,
          comunidade: fielDraft.comunidade || "",
          isDizimista: dizimista,
        } as never);
      } else {
        const result = await FielService.createFiel({
          nome: fielDraft.nome,
          data_nascimento: fielDraft.data_nascimento || "",
          telefone: fielDraft.telefone || "",
          email: fielDraft.email || "",
          endereco: fielDraft.endereco || "",
          cpf: fielDraft.cpf || "",
          comunidade: fielDraft.comunidade || "",
          isDizimista: !!dizimista,
        });
        if (result.cpfInvalido) return { ok: false, cpfInvalido: true };
        if (!result.created) {
          limparDraft();
          await carregarDados();
          return { ok: false, duplicado: true };
        }
      }
      limparDraft();
      await carregarDados();
      return { ok: true };
    } catch (err) {
      console.error("Erro ao salvar:", err);
      return { ok: false };
    }
  };

  const excluirFiel = async (id: number) => {
    const ok = await ask("Deseja realmente excluir este fiel?", { title: "Confirmar exclusão", kind: "warning" });
    if (!ok) return;
    try {
      await PastoralRepository.fieis.softDelete(id);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const editarFiel = (fiel: { id: number; nome: string; data_nascimento?: string | null; telefone?: string | null; email?: string | null; endereco?: string | null; cpf?: string | null; comunidade?: string | null; isDizimista?: number | null }) => {
    setFielDraft({
      id: fiel.id,
      nome: fiel.nome,
      data_nascimento: fiel.data_nascimento ?? "",
      telefone: fiel.telefone ?? "",
      email: fiel.email ?? "",
      endereco: fiel.endereco ?? "",
      cpf: fiel.cpf ?? "",
      comunidade: fiel.comunidade ?? "",
      isDizimista: fiel.isDizimista === 1,
    });
  };

  return {
    fieis,
    fielDraft,
    atualizarDraft,
    salvarFiel,
    excluirFiel,
    editarFiel,
    comunidades,
    limparDraft,
    carregarDados,
  };
}
