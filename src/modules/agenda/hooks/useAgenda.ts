// src/modules/agenda/hooks/useAgenda.ts

import { useState } from "react";
import { AgendaService } from "../services/agenda.service";
import {
  CompromissoAgenda,
  CategoriaAgenda,
} from "../types/agenda.types";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido.";
}

export function useAgenda() {
  const [compromissos, setCompromissos] = useState<CompromissoAgenda[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarPorCategoria(
    categoria: CategoriaAgenda
  ): Promise<void> {
    setCarregando(true);
    setErro(null);

    try {
      const dados =
        await AgendaService.getCompromissos(categoria);

      setCompromissos(dados);
    } catch (error: unknown) {
      const mensagem = getErrorMessage(error);

      setErro(mensagem);

      console.error(
        "[Agenda] Erro ao carregar compromissos:",
        error
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarCompromisso(
  dados: CompromissoAgenda
): Promise<boolean> {
    setErro(null);

    try {
      await AgendaService.salvar(dados);

      return true;
    } catch (error: unknown) {
      const mensagem = getErrorMessage(error);

      setErro(mensagem);

      console.error(
        "[Agenda] Erro ao salvar compromisso:",
        error
      );

      return false;
    }
  }

  async function excluirCompromisso(
    id: number
  ): Promise<boolean> {
    setErro(null);

    try {
      await AgendaService.remover(id);

      setCompromissos((prev) =>
        prev.filter((compromisso) => compromisso.id !== id)
      );

      return true;
    } catch (error: unknown) {
      const mensagem = getErrorMessage(error);

      setErro(mensagem);

      console.error(
        "[Agenda] Erro ao excluir compromisso:",
        error
      );

      return false;
    }
  }

  return {
    compromissos,
    carregando,
    erro,
    carregarPorCategoria,
    salvarCompromisso,
    excluirCompromisso,
  };
}