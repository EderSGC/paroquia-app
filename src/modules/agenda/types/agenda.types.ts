// src/modules/agenda/types/agenda.types.ts

export type CategoriaAgenda = "missa" | "evento" | "reuniao" | "reserva" | "formacao" | "visita" | "escala";

export interface CompromissoAgenda {
  id?: number;
  titulo: string;
  descricao?: string;
  data: string;           // YYYY-MM-DD
  horario: string;        // HH:MM
  local: string;          // Sala 1, Matriz, Capela, etc.
  categoria: CategoriaAgenda;
  fiel_id?: number | null; 
  nome_fiel?: string;     // Adicionado pois vem do JOIN no repositório
  telefone_fiel?: string; // Adicionado pois vem do JOIN no repositório
}