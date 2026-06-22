import { useState, useEffect, useCallback } from "react";
import { PastoralRepository } from '../repository/pastoral.repository';
import { useToast } from '@core/ui/Toast';
import { ask } from '@tauri-apps/plugin-dialog';
import { getDb } from '@core/database';
import { normalizeText } from '@core/utils/validators';

interface PastoralDraft {
  [key: string]: string | number | null | undefined;
  id?: number;
  nome: string;
  descricao: string;
  carisma: string;
  comunidade: string;
  coordenador_id: number | null;
  coordenador_nome: string;
  coordenador_tel: string;
  vice_id: number | null;
  vice_nome: string;
  vice_tel: string;
  secretario_id: number | null;
  secretario_nome: string;
  secretario_tel: string;
  tesoureiro_id: number | null;
  tesoureiro_nome: string;
  tesoureiro_tel: string;
}

const estadoInicial: PastoralDraft = {
  nome: "", descricao: "", carisma: "", comunidade: "",
  coordenador_id: null, coordenador_nome: "", coordenador_tel: "",
  vice_id: null, vice_nome: "", vice_tel: "",
  secretario_id: null, secretario_nome: "", secretario_tel: "",
  tesoureiro_id: null, tesoureiro_nome: "", tesoureiro_tel: "",
};

export function usePastorais() {
  const { showToast } = useToast();
  const [pastorais, setPastorais] = useState<PastoralDraft[]>([]);
  const [pastoralDraft, setPastoralDraft] = useState<PastoralDraft>(estadoInicial);
  const [fieis, setFieis] = useState<{ id: number; nome: string; telefone?: string | null }[]>([]);

  const carregarPastorais = useCallback(async () => {
    try {
      const [result, fieisData] = await Promise.all([
        PastoralRepository.pastorais.findAllOrdenadas(),
        PastoralRepository.fieis.findAllOrdenados(),
      ]);
      setPastorais(result.map(p => ({
        id: p.id, nome: p.nome, descricao: p.descricao ?? "", carisma: p.carisma ?? "",
        comunidade: p.comunidade ?? "",
        coordenador_id: p.coordenador_id ?? null, coordenador_nome: p.coordenador_nome ?? "",
        coordenador_tel: p.coordenador_tel ?? "",
        vice_id: p.vice_id ?? null, vice_nome: p.vice_nome ?? "", vice_tel: p.vice_tel ?? "",
        secretario_id: p.secretario_id ?? null, secretario_nome: p.secretario_nome ?? "",
        secretario_tel: p.secretario_tel ?? "",
        tesoureiro_id: p.tesoureiro_id ?? null, tesoureiro_nome: p.tesoureiro_nome ?? "",
        tesoureiro_tel: p.tesoureiro_tel ?? "",
      })));
      setFieis(fieisData.map(f => ({ id: f.id, nome: f.nome, telefone: f.telefone })));
    } catch (err) {
      console.error("Erro ao carregar pastorais:", err);
    }
  }, []);

  const salvarPastoral = async () => {
    if (!pastoralDraft.nome?.trim()) { showToast("O nome da pastoral é obrigatório!", "error"); return; }

    const db = await getDb();
    const nomeNorm = normalizeText(pastoralDraft.nome);
    const existentes = await db.select<{ id: number; nome: string }[]>(
      "SELECT id, nome FROM pastorais WHERE deleted_at IS NULL AND id != $1", [pastoralDraft.id ?? -1]
    );
    if (existentes.some(e => normalizeText(e.nome) === nomeNorm)) {
      showToast("Já existe uma pastoral com este nome.", "error"); return;
    }

    try {
      const comunidades = await PastoralRepository.comunidades.findNomes();
      const comMatch = comunidades.find(c => c.nome === pastoralDraft.comunidade);
      const campos = {
        nome: pastoralDraft.nome.trim(), descricao: pastoralDraft.descricao, carisma: pastoralDraft.carisma,
        comunidade_id: comMatch?.id ?? null,
        comunidade: pastoralDraft.comunidade,
        coordenador_id: pastoralDraft.coordenador_id, coordenador_nome: pastoralDraft.coordenador_nome,
        coordenador_tel: pastoralDraft.coordenador_tel,
        vice_id: pastoralDraft.vice_id, vice_nome: pastoralDraft.vice_nome, vice_tel: pastoralDraft.vice_tel,
        secretario_id: pastoralDraft.secretario_id, secretario_nome: pastoralDraft.secretario_nome,
        secretario_tel: pastoralDraft.secretario_tel,
        tesoureiro_id: pastoralDraft.tesoureiro_id, tesoureiro_nome: pastoralDraft.tesoureiro_nome,
        tesoureiro_tel: pastoralDraft.tesoureiro_tel,
      };
      if (pastoralDraft.id) {
        await PastoralRepository.pastorais.update(pastoralDraft.id, campos as never);
      } else {
        await PastoralRepository.pastorais.create(campos as never);
      }
      showToast("Pastoral salva com sucesso!", "success");
      setPastoralDraft(estadoInicial);
      await carregarPastorais();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      showToast("Erro ao salvar pastoral.", "error");
    }
  };

  const excluirPastoral = async (id: number) => {
    const ok = await ask("Excluir esta pastoral?", { title: "Confirmar exclusão", kind: "warning" });
    if (!ok) return;
    try {
      await PastoralRepository.pastorais.softDelete(id);
      await carregarPastorais();
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const selecionarFiel = (cargo: 'coordenador' | 'vice' | 'secretario' | 'tesoureiro', fielId: number) => {
    const fiel = fieis.find(f => f.id === fielId);
    if (!fiel) return;
    setPastoralDraft(prev => ({
      ...prev,
      [`${cargo}_id`]: fiel.id,
      [`${cargo}_nome`]: fiel.nome,
      [`${cargo}_tel`]: fiel.telefone ?? "",
    }));
  };

  useEffect(() => { carregarPastorais(); }, [carregarPastorais]);

  return {
    pastorais, pastoralDraft, setPastoralDraft, salvarPastoral, excluirPastoral,
    carregarPastorais, fieis, selecionarFiel,
  };
}
