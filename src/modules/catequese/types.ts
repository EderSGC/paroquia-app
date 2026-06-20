// src/modules/catequese/types/types.ts

/**
 * Define as etapas oficiais da caminhada de catequese na paróquia.
 * O uso de tipos literais impede erros de digitação como "Crisma " ou "crisma".
 */
export type EtapaCatequese = 
  | "Batismo" 
  | "Primeira Eucaristia" 
  | "Crisma" 
  | "Adultos" 
  | "Catecumenato" 
  | "Perseverança" 
  | "Formação Bíblica";

/**
 * Define a situação de matrícula de um catequizando no diário.
 */
export type SituacaoCatequizando = 
  | "Ativo" 
  | "Aprovado" 
  | "Em Acompanhamento" 
  | "Transferido" 
  | "Desistente";

/**
 * Representa a estrutura de uma Turma no sistema.
 */
export interface Turma {
  id?: number;          // O ID é opcional pois não existe antes de salvar no banco
  nome: string;         // Ex: "Turma São João Paulo II"
  etapa: EtapaCatequese;// Vinculado ao tipo estrito definido acima
  ano: number;          // Ano letivo corrente (Ex: 2026)
  catequista_id: number;// Chave estrangeira ligando ao Catequista
  comunidade: string;   // Nome da capela ou comunidade pertencente
  horario: string;      // Ex: "Sábado às 16h"
  ativa: boolean;       // Controle de status da turma
}

/**
 * Representa a matrícula de um aluno (Catequizando) em uma turma.
 */
export interface Catequizando {
  id?: number;
  fiel_id: number;      // 🟢 Ligação com o cadastro geral de Fiéis do sistema
  turma_id: number;     // Vínculo com a turma em que está matriculado
  situacao: SituacaoCatequizando;
  docs_entregues: boolean; // Controle de pendência de Certidões
  observacoes: string;  // Histórico ou restrições médicas/alimentares
}

/**
 * Representa o perfil de um Catequista.
 */
export interface Catequista {
  id?: number;
  fiel_id: number;      // 🟢 Vínculo com o cadastro geral de Fiéis do sistema
  formacao: string;     // Cursos ou teologia que possui
  disponibilidade: string; // Dias e horários que pode lecionar
}

/**
 * Representa o registro individual de presença em uma determinada data.
 */
export interface Presenca {
  id?: number;
  matricula_id: number; // Ligação com o ID do Catequizando
  data: string;         // Formato YYYY-MM-DD
  presente: boolean;    // true = presente, false = falta
  justificativa?: string; // Motivo preenchido caso apresente falta
}