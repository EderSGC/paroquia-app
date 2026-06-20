export interface FielDraft {
  id?: number;
  nome: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  endereco: string;
  cpf: string;
  comunidade: string;
  isDizimista: boolean;
}


export interface ComunidadeDraft {
  id?: number;
  nome: string;
  cnpj: string;
  endereco: string;
  coordenador_nome: string;
  coordenador_tel: string;
  tesoureiro_nome: string;
  tesoureiro_tel: string;
  secretario_nome: string;
  secretario_tel: string;
}
