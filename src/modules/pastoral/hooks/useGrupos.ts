import { useState, useEffect, useCallback } from "react";
import { PastoralRepository } from '../repository/pastoral.repository';
import { useToast } from '@core/ui/Toast';
import { ask } from '@tauri-apps/plugin-dialog';
import { getDb } from '@core/database';
import { normalizeText } from '@core/utils/validators';

interface GrupoDraft {
  id?: number;
  nome: string;
  categoria: string;
  descricao: string;
  objetivos: string;
  pastoral_id: number | null;
  coordenador_id: number | null;
  coordenador_nome: string;
  coordenador_tel: string;
  coordenador_email: string;
  vice_id: number | null;
  vice_nome: string;
  vice_tel: string;
  vice_email: string;
  secretario_id: number | null;
  secretario_nome: string;
  secretario_tel: string;
  secretario_email: string;
  tesoureiro_id: number | null;
  tesoureiro_nome: string;
  tesoureiro_tel: string;
  tesoureiro_email: string;
}

const estadoInicial: GrupoDraft = {
  nome: "", categoria: "", descricao: "", objetivos: "", pastoral_id: null,
  coordenador_id: null, coordenador_nome: "", coordenador_tel: "", coordenador_email: "",
  vice_id: null, vice_nome: "", vice_tel: "", vice_email: "",
  secretario_id: null, secretario_nome: "", secretario_tel: "", secretario_email: "",
  tesoureiro_id: null, tesoureiro_nome: "", tesoureiro_tel: "", tesoureiro_email: "",
};

interface MembroGrupo {
  id: number;
  grupo_id?: number | null;
  fiel_id?: number | null;
  cargo?: string | null;
  nome_fiel?: string | null;
  telefone_fiel?: string | null;
}

export function useGrupos() {
  const { showToast } = useToast();
  const [grupos, setGrupos] = useState<GrupoDraft[]>([]);
  const [grupoDraft, setGrupoDraft] = useState<GrupoDraft>(estadoInicial);
  const [membrosGrupo, setMembrosGrupo] = useState<MembroGrupo[]>([]);
  const [contagemMembros, setContagemMembros] = useState<Record<number, number>>({});
  const [pastorais, setPastorais] = useState<{ id: number; nome: string }[]>([]);
  const [fieis, setFieis] = useState<{ id: number; nome: string; telefone?: string | null }[]>([]);

  const limparDraft = () => setGrupoDraft(estadoInicial);

  const carregarGrupos = useCallback(async () => {
    try {
      const [data, contagem, pasts, fieisData] = await Promise.all([
        PastoralRepository.grupos.findAllOrdenados(),
        PastoralRepository.grupoMembros.contagemPorGrupo(),
        PastoralRepository.pastorais.findAllOrdenadas(),
        PastoralRepository.fieis.findAllOrdenados(),
      ]);
      setGrupos(data.map(g => ({
        id: g.id,
        nome: g.nome,
        categoria: g.categoria ?? "",
        descricao: g.descricao ?? "",
        objetivos: g.objetivos ?? "",
        pastoral_id: g.pastoral_id ?? null,
        coordenador_id: g.coordenador_id ?? null,
        coordenador_nome: g.coordenador_nome ?? "",
        coordenador_tel: g.coordenador_tel ?? "",
        coordenador_email: g.coordenador_email ?? "",
        vice_id: g.vice_id ?? null,
        vice_nome: g.vice_nome ?? "",
        vice_tel: g.vice_tel ?? "",
        vice_email: g.vice_email ?? "",
        secretario_id: g.secretario_id ?? null,
        secretario_nome: g.secretario_nome ?? "",
        secretario_tel: g.secretario_tel ?? "",
        secretario_email: g.secretario_email ?? "",
        tesoureiro_id: g.tesoureiro_id ?? null,
        tesoureiro_nome: g.tesoureiro_nome ?? "",
        tesoureiro_tel: g.tesoureiro_tel ?? "",
        tesoureiro_email: g.tesoureiro_email ?? "",
      })));
      setContagemMembros(contagem);
      setPastorais(pasts.map(p => ({ id: p.id, nome: p.nome })));
      setFieis(fieisData.map(f => ({ id: f.id, nome: f.nome, telefone: f.telefone })));
    } catch (err) {
      console.error("Erro ao carregar grupos:", err);
    }
  }, []);

  useEffect(() => { carregarGrupos(); }, [carregarGrupos]);

  const salvarGrupo = async () => {
    if (!grupoDraft.nome?.trim()) { showToast("O nome do grupo é obrigatório!", "error"); return; }

    const db = await getDb();
    const nomeNorm = normalizeText(grupoDraft.nome);
    const existentes = await db.select<{ id: number; nome: string }[]>(
      "SELECT id, nome FROM grupos WHERE deleted_at IS NULL AND id != $1", [grupoDraft.id ?? -1]
    );
    if (existentes.some(e => normalizeText(e.nome) === nomeNorm)) {
      showToast("Já existe um grupo com este nome.", "error"); return;
    }

    try {
      const campos = {
        nome: grupoDraft.nome.trim(), categoria: grupoDraft.categoria, descricao: grupoDraft.descricao,
        objetivos: grupoDraft.objetivos, pastoral_id: grupoDraft.pastoral_id,
        coordenador_id: grupoDraft.coordenador_id, coordenador_nome: grupoDraft.coordenador_nome,
        coordenador_tel: grupoDraft.coordenador_tel, coordenador_email: grupoDraft.coordenador_email,
        vice_id: grupoDraft.vice_id, vice_nome: grupoDraft.vice_nome,
        vice_tel: grupoDraft.vice_tel, vice_email: grupoDraft.vice_email,
        secretario_id: grupoDraft.secretario_id, secretario_nome: grupoDraft.secretario_nome,
        secretario_tel: grupoDraft.secretario_tel, secretario_email: grupoDraft.secretario_email,
        tesoureiro_id: grupoDraft.tesoureiro_id, tesoureiro_nome: grupoDraft.tesoureiro_nome,
        tesoureiro_tel: grupoDraft.tesoureiro_tel, tesoureiro_email: grupoDraft.tesoureiro_email,
      };
      if (grupoDraft.id) {
        await PastoralRepository.grupos.update(grupoDraft.id, campos as any);
      } else {
        await PastoralRepository.grupos.create(campos as any);
      }
      showToast("Grupo salvo com sucesso!", "success");
      limparDraft();
      await carregarGrupos();
    } catch (err) {
      console.error("Erro ao salvar grupo:", err);
      showToast("Erro ao salvar grupo.", "error");
    }
  };

  const excluirGrupo = async (id: number) => {
    const ok = await ask("Deseja excluir este grupo?", { title: "Confirmar exclusão", kind: "warning" });
    if (!ok) return;
    try {
      await PastoralRepository.grupos.softDelete(id);
      await carregarGrupos();
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const editarGrupo = (grupo: GrupoDraft) => setGrupoDraft(grupo);

  const carregarMembrosGrupo = async (grupoId: number) => {
    const res = await PastoralRepository.grupoMembros.findByGrupo(grupoId);
    setMembrosGrupo(res);
  };

  const vincularMembro = async (grupoId: number, fielId: number, cargo: string) => {
    const ok = await PastoralRepository.grupoMembros.vincular(grupoId, fielId, cargo);
    if (!ok) { showToast("Este fiel já é membro deste grupo.", "info"); return; }
    showToast("Membro adicionado!", "success");
    await carregarMembrosGrupo(grupoId);
    await carregarGrupos();
  };

  const removerMembro = async (id: number, grupoId: number) => {
    await PastoralRepository.grupoMembros.hardDelete(id);
    await carregarMembrosGrupo(grupoId);
    await carregarGrupos();
  };

  return {
    grupos, grupoDraft, setGrupoDraft, salvarGrupo, excluirGrupo, editarGrupo, limparDraft,
    carregarGrupos, membrosGrupo, carregarMembrosGrupo, vincularMembro, removerMembro,
    contagemMembros, pastorais, fieis,
  };
}
