// src/modules/agenda/services/agenda.service.ts
import { AgendaRepository } from "../repository/agenda.repository";
import { CompromissoAgenda } from "../types/agenda.types";

export const AgendaService = {
  /**
   * Busca compromissos. 
   * A vantagem de ter esta camada é que podemos adicionar 
   * logs, tratamento de erros globais ou filtros aqui.
   */
  async getCompromissos(categoria: string) {
    try {
      return await AgendaRepository.fetchByCategory(categoria);
    } catch (error) {
      console.error("Erro na camada de serviço ao buscar agenda:", error);
      throw new Error("Não foi possível carregar os compromissos.");
    }
  },

  /**
   * Regras de negócio antes de salvar.
   */
  async salvar(compromisso: CompromissoAgenda) {
    // Exemplo de regra: validar se o título existe
    if (!compromisso.titulo || compromisso.titulo.trim() === "") {
      throw new Error("O título do compromisso é obrigatório.");
    }

    // Você pode formatar datas ou dados aqui antes de enviar ao repositório
    return await AgendaRepository.save(compromisso);
  },

  async remover(id: number) {
    return await AgendaRepository.delete(id);
  }
};