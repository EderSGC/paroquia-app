import { useState, useEffect, useCallback } from "react";
import { PastoralRepository } from '../repository/pastoral.repository';
import { useToast } from '@core/ui/Toast';
import { ask } from '@tauri-apps/plugin-dialog';
import { getDb } from '@core/database';
import { normalizeText } from '@core/utils/validators';
import type { ComunidadeDraft } from '../types';

const estadoInicial: ComunidadeDraft = {
  nome: "",
  cnpj: "",
  endereco: "",
  coordenador_nome: "",
  coordenador_tel: "",
  tesoureiro_nome: "",
  tesoureiro_tel: "",
  secretario_nome: "",
  secretario_tel: "",
};

export const useComunidades = () => {
  const { showToast } = useToast();
  const [comunidades, setComunidades] = useState<ComunidadeDraft[]>([]);
  const [comunidadeDraft, setComunidadeDraft] = useState<ComunidadeDraft>(estadoInicial);

  const limparDraft = () => setComunidadeDraft(estadoInicial);

  const carregarComunidades = useCallback(async () => {
    try {
      const result = await PastoralRepository.comunidades.findAllOrdenadas();
      setComunidades(result.map(c => ({
        id: c.id,
        nome: c.nome,
        cnpj: c.cnpj ?? "",
        endereco: c.endereco ?? "",
        coordenador_nome: c.coordenador_nome ?? "",
        coordenador_tel: c.coordenador_tel ?? "",
        tesoureiro_nome: c.tesoureiro_nome ?? "",
        tesoureiro_tel: c.tesoureiro_tel ?? "",
        secretario_nome: c.secretario_nome ?? "",
        secretario_tel: c.secretario_tel ?? "",
      })));
    } catch (error) {
      console.error("Erro ao carregar comunidades:", error);
    }
  }, []);

  const salvarComunidade = async () => {
    if (!comunidadeDraft.nome?.trim()) { showToast("O nome da comunidade é obrigatório!", "error"); return; }
    const db = await getDb();
    const nomeNorm = normalizeText(comunidadeDraft.nome);
    const existentes = await db.select<{ id: number; nome: string }[]>(
      "SELECT id, nome FROM comunidades WHERE deleted_at IS NULL AND id != $1", [comunidadeDraft.id ?? -1]
    );
    if (existentes.some(e => normalizeText(e.nome) === nomeNorm)) {
      showToast("Já existe uma comunidade com este nome.", "error"); return;
    }
    try {
      const campos = {
        nome: comunidadeDraft.nome.trim(),
        cnpj: comunidadeDraft.cnpj,
        endereco: comunidadeDraft.endereco,
        coordenador_nome: comunidadeDraft.coordenador_nome,
        coordenador_tel: comunidadeDraft.coordenador_tel,
        tesoureiro_nome: comunidadeDraft.tesoureiro_nome,
        tesoureiro_tel: comunidadeDraft.tesoureiro_tel,
        secretario_nome: comunidadeDraft.secretario_nome,
        secretario_tel: comunidadeDraft.secretario_tel,
      };
      if (comunidadeDraft.id) {
        await PastoralRepository.comunidades.update(comunidadeDraft.id, campos);
      } else {
        await PastoralRepository.comunidades.create(campos);
      }
      showToast("Comunidade salva com sucesso!", "success");
      limparDraft();
      await carregarComunidades();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showToast("Erro ao salvar comunidade.", "error");
    }
  };

  const excluirComunidade = async (id: number) => {
    const ok = await ask("Deseja realmente remover esta comunidade?", { title: "Confirmar exclusão", kind: "warning" });
    if (!ok) return;
    try {
      await PastoralRepository.comunidades.softDelete(id);
      await carregarComunidades();
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  useEffect(() => { carregarComunidades(); }, [carregarComunidades]);

  return {
    comunidades,
    comunidadeDraft,
    setComunidadeDraft,
    salvarComunidade,
    excluirComunidade,
    limparDraft,
    carregarComunidades,
  };
};
