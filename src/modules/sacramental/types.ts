/** Dados serializados no campo json_dados de sacramentos_registros, por tipo. */

export interface DadosCrisma {
  nome: string;
  dataNasc: string;
  rgCpf: string;
  cpf: string;
  endereco: string;
  tel: string;
  email: string;
  escolaridade: string;
  paroquiaAtual: string;
  dataBatismo: string;
  localBatismo: string;
  dataEucaristia: string;
  localEucaristia: string;
  mae: string;
  pai: string;
  responsavel: string;
  estadoCivilPais: string;
  padrinho: string;
  madrinha: string;
  estadoCivilCrismando: string;
  valorTaxa: string;
  certidaoBatismo: string;
  certidaoEucaristia: string;
}

export interface DadosEucaristia {
  nome: string;
  comunidade: string;
  turma: string;
  catequista: string;
  dataComunhao: string;
  local: string;
  obs: string;
  [key: string]: string;
}

export interface DadosMatrimonio {
  noivoNome: string;
  noivoPai: string;
  noivoMae: string;
  noivoDataNasc: string;
  noivoLocalNasc: string;
  noivoDataBatismo: string;
  noivoParoquiaBatismo: string;
  noivoLivroBat: string;
  noivoFolhaBat: string;
  noivoNumBat: string;
  noivoEstadoCivil: string;
  noivoViuvoDe: string;
  noivoDataObitoViuvo: string;
  noivoCidadeCivil: string;
  noivoArqCivil: string;
  noivoEndRua: string;
  noivoEndNum: string;
  noivoEndBairro: string;
  noivoEndCidade: string;
  noivoFone: string;
  noivaNome: string;
  noivaPai: string;
  noivaMae: string;
  noivaDataNasc: string;
  noivaLocalNasc: string;
  noivaDataBatismo: string;
  noivaParoquiaBatismo: string;
  noivaLivroBat: string;
  noivaFolhaBat: string;
  noivaNumBat: string;
  noivaEstadoCivil: string;
  noivaViuvoDe: string;
  noivaDataObitoViuvo: string;
  noivaCidadeCivil: string;
  noivaArqCivil: string;
  noivaEndRua: string;
  noivaEndNum: string;
  noivaEndBairro: string;
  noivaEndCidade: string;
  noivaFone: string;
  [key: string]: string;
}

export interface DadosUncao {
  nome: string;
  endereco: string;
  telefone: string;
  comunidade: string;
  comunidadeManual: string;
  tipoComunidade: "existente" | "manual";
  dataVisita: string;
  visitante: string;
  anotacoes: string;
}

export interface DadosObito {
  nome: string;
  dataNasc: string;
  dataFalecimento: string;
  dataExequias: string;
  local: string;
  ministro: string;
  cemiterio: string;
  comunidade: string;
  observacoes: string;
}

export interface DadosCertificado {
  nome?: string;
  fiel?: string;
  esposo?: string;
  esposa?: string;
  dataSacramento?: string;
  celebrante?: string;
  comunidade?: string;
  livro?: string;
  folha?: string;
  termo?: string;
  naturalidade?: string;
  dataNascimento?: string;
  paiNome?: string;
  maeNome?: string;
  padrinho?: string;
  madrinha?: string;
  observacoes?: string;
}

/**
 * Union discriminada pelo tipo de sacramento.
 * Uso: `const dados = JSON.parse(json_dados) as SacramentoJsonDados`
 */
export type SacramentoJsonDados =
  | { batizando: import("./components/batismo.types").DadosBatismo; padrinhos: import("./components/batismo.types").DadosPadrinhos }
  | DadosCrisma
  | DadosEucaristia
  | DadosMatrimonio
  | DadosUncao
  | DadosObito
  | DadosCertificado;
