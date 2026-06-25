export interface DadosBatismo {
  nomeBatizando: string; dataNascimento: string; comunidade: string;
  dataBatismo: string; celebrante: string; transferencia: string;
  livro: string; numeroFicha: string; pagina: string;
  inicioFormacao: string; terminoFormacao: string;
  paiNome: string; paiDataNasc: string; paiNascidoEm: string;
  paiMae: string; paiPai: string; paiEndereco: string;
  paiComunidade: string;
  paiTelefone: string;
  maeNome: string; maeDataNasc: string; maeNascidoEm: string;
  maeMae: string; maePai: string; maeEndereco: string;
  maeComunidade: string;
  maeTelefone: string;
  frequentaAtividades: string; qualAtividade: string;
  membroPastoral: string; qualPastoral: string;
  eDizimista: string; contribuiFinanceiramente: string;
  razaoBatismo: string;
  seCompromete?: string;
  documentoRetirado?: string;
}

export interface DadosPadrinhos {
  nomeBatizando: string;
  padrinhoNome: string; padrinhoDataNasc: string; padrinhoNascidoEm: string;
  padrinhoMae: string; padrinhoPai: string; padrinhoEnd: string;
  padrinhoComunidade: string; padrinhoTel: string; padrinhoBatizado: string;
  padrinhoEucaristia: string; padrinhoCrisma: string; padrinhoEstadoCivil: string;
  padrinhoFrequentaMissa: string; padrinhoMotivoNaoFrequenta: string;
  padrinhoParticipaPastoral: string; padrinhoDizimista: string;
  padrinhoGostariaDizimista: string; padrinhoRazaoAceitou: string;
  padrinhoSabeSignificado: string;
  padrinhoCompromissoFe: string; padrinhoCompromissoAcompanhar: string;
  madrinhaNome: string; madrinhaDataNasc: string; madrinhaNascidoEm: string;
  madrinhaMae: string; madrinhaPai: string; madrinhaEnd: string;
  madrinhaComunidade: string; madrinhaTel: string; madrinhaBatizado: string;
  madrinhaEucaristia: string; madrinhaCrisma: string; madrinhaEstadoCivil: string;
  madrinhaFrequentaMissa: string; madrinhaMotivoNaoFrequenta: string;
  madrinhaParticipaPastoral: string; madrinhaDizimista: string;
  madrinhaGostariaDizimista: string; madrinhaRazaoAceitou: string;
  madrinhaSabeSignificado: string;
  madrinhaCompromissoFe: string; madrinhaCompromissoAcompanhar: string;
  casalMatrimonioIgreja: string;
  dataManaus: string;
  agenteAssinatura: string; padreAssinatura: string;
}
