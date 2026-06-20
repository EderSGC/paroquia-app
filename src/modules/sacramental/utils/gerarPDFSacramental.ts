import { PdfDoc } from "../../documentos/utils/gerarPDF";
import type { Paroquia } from "../../../core/types/app.types";
import type { DadosBatismo, DadosPadrinhos } from "../components/batismo.types";

const ex = (v?: string) => v?.trim() || "—";

// ── Cabeçalho de seção (label negrito sem corpo) ─────────────────────────────
function secHeader(doc: PdfDoc, label: string) {
  doc.addTexto(label, { bold: true });
  doc.addEspaco(3);
}

// ────────────────────────────────────────────────────────────────────────────
// FICHA BATIZANDO (apenas a ficha do batizando)
// ────────────────────────────────────────────────────────────────────────────

export async function gerarPDFFichaBatizando(
  paroquia: Paroquia,
  dados: DadosBatismo,
  fonte: string
): Promise<void> {
  const doc = new PdfDoc(fonte);
  await doc.addCabecalho(paroquia);

  doc.addTitulo("Ficha de Inscrição para o Sacramento do Batismo");

  // Nome + Data Nascimento
  doc.addCamposGrid([
    { label: "Nome do (a) batizando(a)", value: ex(dados.nomeBatizando) },
    { label: "Data de Nascimento", value: ex(dados.dataNascimento) },
  ]);

  // Dados do sacramento
  doc.addCamposGrid([
    { label: "Comunidade", value: ex(dados.comunidade) },
    { label: "Data do Batismo", value: ex(dados.dataBatismo) },
  ]);
  doc.addCamposGrid([
    { label: "Celebrante", value: ex(dados.celebrante) },
    { label: "Transferência", value: ex(dados.transferencia) },
  ]);
  doc.addCamposGrid([
    { label: "Livro", value: ex(dados.livro) },
    { label: "nº / Página", value: `${ex(dados.numeroFicha)} / ${ex(dados.pagina)}` },
  ]);
  doc.addCamposGrid([
    { label: "Início da Formação", value: ex(dados.inicioFormacao) },
    { label: "Término da Formação", value: ex(dados.terminoFormacao) },
  ]);

  // Dados do Pai
  doc.addLinha();
  secHeader(doc, "DADOS DO PAI");
  doc.addCamposGrid([
    { label: "Nome", value: ex(dados.paiNome) },
    { label: "Data de Nasc. / Nascido em", value: `${ex(dados.paiDataNasc)}  —  ${ex(dados.paiNascidoEm)}` },
  ]);
  doc.addCamposGrid([
    { label: "Mãe (avó paterna)", value: ex(dados.paiMae) },
    { label: "Pai (avô paterno)", value: ex(dados.paiPai) },
  ]);
  doc.addCamposGrid([
    { label: "End.", value: ex(dados.paiEndereco) },
    { label: "Comunidade / Tel", value: `${ex(dados.paiComunidade)}  /  ${ex(dados.paiTelefone)}` },
  ]);

  // Dados da Mãe
  doc.addLinha();
  secHeader(doc, "DADOS DA MÃE");
  doc.addCamposGrid([
    { label: "Nome", value: ex(dados.maeNome) },
    { label: "Data de Nasc. / Nascida em", value: `${ex(dados.maeDataNasc)}  —  ${ex(dados.maeNascidoEm)}` },
  ]);
  doc.addCamposGrid([
    { label: "Mãe (avó materna)", value: ex(dados.maeMae) },
    { label: "Pai (avô materno)", value: ex(dados.maePai) },
  ]);
  doc.addCamposGrid([
    { label: "End.", value: ex(dados.maeEndereco) },
    { label: "Comunidade / Tel", value: `${ex(dados.maeComunidade)}  /  ${ex(dados.maeTelefone)}` },
  ]);

  // Participação na Comunidade
  doc.addLinha();
  secHeader(doc, "PARTICIPAÇÃO NA COMUNIDADE");
  doc.addCamposGrid([
    { label: "Frequenta às celebrações e atividades da Comunidade?", value: ex(dados.frequentaAtividades) },
    { label: "Qual?", value: ex(dados.qualAtividade) },
  ]);
  doc.addCamposGrid([
    { label: "É membro de alguma Pastoral na Comunidade?", value: ex(dados.membroPastoral) },
    { label: "Qual?", value: ex(dados.qualPastoral) },
  ]);
  doc.addCamposGrid([
    { label: "Se compromete a participar?", value: ex(dados.seCompromete) },
    { label: "Você contribui financeiramente com a Comunidade?", value: ex(dados.contribuiFinanceiramente) },
  ]);
  doc.addCamposGrid([
    { label: "Você é Dizimista?", value: ex(dados.eDizimista) },
    { label: "Razão pela qual quer ser batizado(a)", value: ex(dados.razaoBatismo) },
  ]);

  // Rodapé
  doc.addEspaco(8);
  doc.addTexto(
    "O Batismo Caracteriza o Espirito de Pertença e inclui fraternalmente na Comunidade Católica. Somos uma Igreja Família de Deus portanto uma Igreja missionária.",
    { align: "center" }
  );

  await doc.salvar(`Ficha Batizando — ${ex(dados.nomeBatizando)}`);
}

// ────────────────────────────────────────────────────────────────────────────
// FICHA PADRINHOS (apenas a ficha de padrinho/madrinha)
// ────────────────────────────────────────────────────────────────────────────

export async function gerarPDFFichaPadrinhos(
  paroquia: Paroquia,
  padrinhos: DadosPadrinhos,
  fonte: string
): Promise<void> {
  const p = padrinhos;
  const doc = new PdfDoc(fonte);
  await doc.addCabecalho(paroquia);

  doc.addTitulo("Ficha de Inscrição: Padrinho/Madrinha");

  // Nome do batizando
  doc.addCamposGrid([
    { label: "Nome do (a) batizando(a)", value: ex(p.nomeBatizando) },
    { label: "", value: "" },
  ]);

  // Dados do Padrinho
  doc.addLinha();
  secHeader(doc, "DADOS DO PADRINHO");
  doc.addCamposGrid([
    { label: "Nome", value: ex(p.padrinhoNome) },
  ], 1);
  doc.addCamposGrid([
    { label: "Data de Nascimento", value: ex(p.padrinhoDataNasc) },
    { label: "Nascido em", value: ex(p.padrinhoNascidoEm) },
  ]);
  doc.addCamposGrid([
    { label: "Mãe", value: ex(p.padrinhoMae) },
    { label: "Pai", value: ex(p.padrinhoPai) },
  ]);
  doc.addCamposGrid([
    { label: "Endereço", value: ex(p.padrinhoEnd) },
  ], 1);
  doc.addCamposGrid([
    { label: "Comunidade", value: ex(p.padrinhoComunidade) },
    { label: "Telefone", value: ex(p.padrinhoTel) },
  ]);

  // Dados da Madrinha
  doc.addLinha();
  secHeader(doc, "DADOS DA MADRINHA");
  doc.addCamposGrid([
    { label: "Nome", value: ex(p.madrinhaNome) },
  ], 1);
  doc.addCamposGrid([
    { label: "Data de Nascimento", value: ex(p.madrinhaDataNasc) },
    { label: "Nascida em", value: ex(p.madrinhaNascidoEm) },
  ]);
  doc.addCamposGrid([
    { label: "Mãe", value: ex(p.madrinhaMae) },
    { label: "Pai", value: ex(p.madrinhaPai) },
  ]);
  doc.addCamposGrid([
    { label: "Endereço", value: ex(p.madrinhaEnd) },
  ], 1);
  doc.addCamposGrid([
    { label: "Comunidade", value: ex(p.madrinhaComunidade) },
    { label: "Telefone", value: ex(p.madrinhaTel) },
  ]);

  // Sacramentos
  doc.addLinha();
  secHeader(doc, "SOBRE OS SACRAMENTOS DOS PADRINHOS (AS)");
  doc.addCamposGrid([
    { label: "O BATISMO — Você é Batizado(a)? (Padrinho)", value: ex(p.padrinhoBatizado) },
    { label: "O BATISMO — Você é Batizado(a)? (Madrinha)", value: ex(p.madrinhaBatizado) },
  ]);
  doc.addCamposGrid([
    { label: "1ª EUCARISTIA — Você fez a 1ª Eucaristia? (Padrinho)", value: ex(p.padrinhoEucaristia) },
    { label: "1ª EUCARISTIA — Você fez a 1ª Eucaristia? (Madrinha)", value: ex(p.madrinhaEucaristia) },
  ]);
  doc.addCamposGrid([
    { label: "CRISMA — Você é Crismado(a)? (Padrinho)", value: ex(p.padrinhoCrisma) },
    { label: "CRISMA — Você é Crismado(a)? (Madrinha)", value: ex(p.madrinhaCrisma) },
  ]);
  doc.addCamposGrid([
    { label: "MATRIMÔNIO — Receberam o Sacramento na Igreja Católica? (Casal)", value: ex(p.casalMatrimonioIgreja) },
    { label: "", value: "" },
  ]);
  doc.addCamposGrid([
    { label: "Estado Civil (Padrinho)", value: ex(p.padrinhoEstadoCivil) },
    { label: "Estado Civil (Madrinha)", value: ex(p.madrinhaEstadoCivil) },
  ]);

  // Participação na Comunidade
  doc.addLinha();
  secHeader(doc, "SOBRE A PARTICIPAÇÃO NA COMUNIDADE ECLESIAL — IGREJA");
  doc.addCamposGrid([
    { label: "Frequenta a Celebração Dominical / Missa? (Padrinho)", value: ex(p.padrinhoFrequentaMissa) },
    { label: "Frequenta a Celebração Dominical / Missa? (Madrinha)", value: ex(p.madrinhaFrequentaMissa) },
  ]);
  doc.addCamposGrid([
    { label: "Qual a razão para não frequentar? (Padrinho)", value: ex(p.padrinhoMotivoNaoFrequenta) },
    { label: "Qual a razão para não frequentar? (Madrinha)", value: ex(p.madrinhaMotivoNaoFrequenta) },
  ]);
  doc.addCamposGrid([
    { label: "Membro ou participa de Pastoral/Atividade? (Padrinho)", value: ex(p.padrinhoParticipaPastoral) },
    { label: "Membro ou participa de Pastoral/Atividade? (Madrinha)", value: ex(p.madrinhaParticipaPastoral) },
  ]);
  doc.addCamposGrid([
    { label: "Contribuem financeiramente? São Dizimistas? (Padrinho)", value: ex(p.padrinhoDizimista) },
    { label: "Contribuem financeiramente? São Dizimistas? (Madrinha)", value: ex(p.madrinhaDizimista) },
  ]);
  doc.addCamposGrid([
    { label: "Gostaria de ser Dizimista? (Padrinho)", value: ex(p.padrinhoGostariaDizimista) },
    { label: "Gostaria de ser Dizimista? (Madrinha)", value: ex(p.madrinhaGostariaDizimista) },
  ]);

  // Por que aceitou
  doc.addCamposGrid([
    { label: "Por que aceitou ser Padrinho?", value: ex(p.padrinhoRazaoAceitou) },
    { label: "Por que aceitou ser Madrinha?", value: ex(p.madrinhaRazaoAceitou) },
  ]);
  doc.addCamposGrid([
    { label: "Vocês sabem o que significa ser Padrinho/Madrinha? (Padrinho)", value: ex(p.padrinhoSabeSignificado) },
    { label: "Vocês sabem o que significa ser Padrinho/Madrinha? (Madrinha)", value: ex(p.madrinhaSabeSignificado) },
  ]);

  // Texto histórico
  doc.addLinha();
  doc.addTexto(
    "Na Igreja Católica, a tradição dos Padrinhos e Madrinhas de Batismo é muito antiga. As pessoas, em sua maioria eram pagãs. Eram adultos(as) que se convertiam à fé Cristã. Antes de serem batizadas, passavam por um longo processo de catequese e inserção na comunidade. Os candidatos(as) ao Batismo recebiam o nome de catecúmenos. Era comum, também, entregá-los aos cuidados de famílias, que iriam acompanhá-los (as) se tornava o Padrinho ou madrinha do convertido(a). A função dos padrinhos e madrinhas eram dar testemunho e acompanhar os seus afilhados(as), e ajudá-los(as) a crescer na fé."
  );

  // Compromissos
  doc.addLinha();
  doc.addCamposGrid([
    { label: "Comprometem-se a acompanhar com testemunho e exemplos? (Padrinho)", value: ex(p.padrinhoCompromissoFe) },
    { label: "Comprometem-se a acompanhar com testemunho e exemplos? (Madrinha)", value: ex(p.madrinhaCompromissoFe) },
  ]);
  doc.addCamposGrid([
    { label: "Comprometem-se a incentivar o crescimento na fé? (Padrinho)", value: ex(p.padrinhoCompromissoAcompanhar) },
    { label: "Comprometem-se a incentivar o crescimento na fé? (Madrinha)", value: ex(p.madrinhaCompromissoAcompanhar) },
  ]);

  // Data e Assinaturas
  doc.addEspaco(6);
  if (p.dataManaus?.trim()) {
    doc.addTexto(`Manaus, ${p.dataManaus}`, { align: "right" });
  }
  doc.addAssinaturasDuplas(
    { label: "Agente Pastoral do Batismo", nome: p.agenteAssinatura || "", cargo: "Agente Pastoral do Batismo / Pastoral da Catequese" },
    { label: "Pe Carlos da Silva", nome: "Pe Carlos da Silva", cargo: "Administrador da AMNSE" }
  );

  await doc.salvar(`Ficha Padrinhos — ${ex(p.nomeBatizando)}`);
}

// ────────────────────────────────────────────────────────────────────────────
// CRISMA
// ────────────────────────────────────────────────────────────────────────────

export async function gerarPDFCrisma(
  paroquia: Paroquia,
  dados: Record<string, string>,
  fonte: string
): Promise<void> {
  const doc = new PdfDoc(fonte);
  await doc.addCabecalho(paroquia);
  doc.addTitulo("Ficha de Inscrição para o Sacramento do Crisma");

  // ── 1. Dados Pessoais ─────────────────────────────────────────────────────
  doc.addTexto("1. DADOS PESSOAIS DO CRISMANDO(A)", { bold: true });
  doc.addEspaco(5);
  doc.addCamposGrid([
    { label: "Nome Completo", value: ex(dados.nome) },
    { label: "Data de Nascimento", value: ex(dados.dataNasc) },
    { label: "RG", value: ex(dados.rgCpf) },
    { label: "CPF / Estado Civil", value: ex(dados.estadoCivilCrismando) },
    { label: "Escolaridade (Série/Turma)", value: ex(dados.escolaridade) },
    { label: "Paróquia que Frequenta", value: ex(dados.paroquiaAtual) },
  ]);
  doc.addCamposGrid([
    { label: "Endereço Completo (Rua, nº, Bairro, Cidade, Estado)", value: ex(dados.endereco) },
  ], 1);
  doc.addCamposGrid([
    { label: "Telefone / WhatsApp", value: ex(dados.tel) },
    { label: "E-mail", value: ex(dados.email) },
  ]);

  // ── 2. Dados Sacramentais ─────────────────────────────────────────────────
  doc.addLinha();
  doc.addTexto("2. DADOS SACRAMENTAIS", { bold: true });
  doc.addEspaco(5);
  doc.addCamposGrid([
    { label: "Data do Batismo", value: ex(dados.dataBatismo) },
    { label: "Local (Paróquia/Cidade) do Batismo", value: ex(dados.localBatismo) },
    { label: "Data da 1ª Eucaristia", value: ex(dados.dataEucaristia) },
    { label: "Local (Paróquia/Cidade) da Eucaristia", value: ex(dados.localEucaristia) },
  ]);

  // ── 3. Dados da Família ───────────────────────────────────────────────────
  doc.addLinha();
  doc.addTexto("3. DADOS DA FAMÍLIA", { bold: true });
  doc.addEspaco(5);
  doc.addCamposGrid([
    { label: "Nome da Mãe", value: ex(dados.mae) },
    { label: "Nome do Pai", value: ex(dados.pai) },
    { label: "Estado Civil dos Pais", value: ex(dados.estadoCivilPais) },
    { label: "Responsável (se menor de idade)", value: ex(dados.responsavel) },
  ]);

  // ── 4. Padrinho / Madrinha ────────────────────────────────────────────────
  doc.addLinha();
  doc.addTexto("4. PADRINHO / MADRINHA E INFORMAÇÕES ADICIONAIS", { bold: true });
  doc.addEspaco(5);
  doc.addCamposGrid([
    { label: "Nome Completo do Padrinho", value: ex(dados.padrinho) },
    { label: "Nome Completo da Madrinha", value: ex(dados.madrinha) },
    { label: "Valor da Taxa (R$)", value: ex(dados.valorTaxa) },
    { label: "", value: "" },
  ]);

  // ── Assinaturas ───────────────────────────────────────────────────────────
  doc.addAssinaturasDuplas(
    { label: "Crismando / Responsável", nome: "", cargo: "Crismando(a) / Responsável" },
    { label: "Secretaria / Agente", nome: "", cargo: "Secretaria / Agente Pastoral" }
  );

  await doc.salvar(`Ficha de Crisma — ${ex(dados.nome)}`);
}

// ────────────────────────────────────────────────────────────────────────────
// PRIMEIRA EUCARISTIA
// ────────────────────────────────────────────────────────────────────────────

export async function gerarPDFEucaristia(
  paroquia: Paroquia,
  dados: Record<string, string>,
  fonte: string
): Promise<void> {
  const doc = new PdfDoc(fonte);
  await doc.addCabecalho(paroquia);

  doc.addTitulo("Ficha de Registro — Primeira Eucaristia");

  // ── 1. Dados do Comunicante ───────────────────────────────────────────────
  doc.addTexto("1. DADOS DO COMUNICANTE", { bold: true });
  doc.addEspaco(5);
  doc.addCamposGrid([
    { label: "Nome Completo do Comunicante", value: ex(dados.nome) },
    { label: "Comunidade / Paróquia", value: ex(dados.comunidade) },
  ], 2, true);

  // ── 2. Dados da Formação e Celebração ────────────────────────────────────
  doc.addLinha();
  doc.addTexto("2. DADOS DA FORMAÇÃO E CELEBRAÇÃO", { bold: true });
  doc.addEspaco(5);
  doc.addCamposGrid([
    { label: "Turma de Catequese", value: ex(dados.turma) },
    { label: "Catequista Responsável", value: ex(dados.catequista) },
    { label: "Data da Primeira Comunhão", value: ex(dados.dataComunhao) },
    { label: "Local da Celebração", value: ex(dados.local) },
  ], 2, true);

  // ── 3. Observações ────────────────────────────────────────────────────────
  if (dados.obs?.trim()) {
    doc.addLinha();
    doc.addSecao("3. Observações Pastorais", dados.obs);
  } else {
    doc.addLinha();
    doc.addTexto("3. OBSERVAÇÕES PASTORAIS", { bold: true });
    doc.addEspaco(5);
    doc.addCamposGrid([{ label: "Observações", value: " " }], 1, true);
    doc.addEspaco(10);
  }

  // ── Citação pastoral ──────────────────────────────────────────────────────
  doc.addEspaco(6);
  doc.addTexto(
    '"Eu sou o pão da vida. Quem vem a mim não terá fome, e quem crê em mim nunca terá sede."',
    { align: "center" }
  );
  doc.addTexto("— João 6,35", { align: "center" });

  // ── Assinaturas ───────────────────────────────────────────────────────────
  doc.addAssinaturasDuplas(
    { label: "Catequista", nome: ex(dados.catequista) !== "—" ? ex(dados.catequista) : "", cargo: "Catequista Responsável" },
    { label: "Pároco", nome: "", cargo: "Pároco / Vigário / Diácono" }
  );

  await doc.salvar(`Ficha de Primeira Eucaristia — ${ex(dados.nome)}`);
}

// ────────────────────────────────────────────────────────────────────────────
// MATRIMÔNIO
// ────────────────────────────────────────────────────────────────────────────

export async function gerarPDFMatrimonio(
  paroquia: Paroquia,
  dados: Record<string, string>,
  fonte: string
): Promise<void> {
  const doc = new PdfDoc(fonte);
  await doc.addCabecalho(paroquia);
  doc.addTitulo("Ficha de Habilitação Matrimonial");

  // ── 1. DADOS DO NOIVO ────────────────────────────────────────────────────
  doc.addTexto("1. DADOS DO NOIVO", { bold: true });
  doc.addEspaco(5);
  doc.addCamposGrid([
    { label: "Nome Completo", value: ex(dados.noivoNome) },
    { label: "Estado Civil", value: ex(dados.noivoEstadoCivil) },
  ]);
  doc.addCamposGrid([
    { label: "Nome do Pai", value: ex(dados.noivoPai) },
    { label: "Nome da Mãe", value: ex(dados.noivoMae) },
  ]);
  doc.addCamposGrid([
    { label: "Data de Nascimento", value: ex(dados.noivoDataNasc) },
    { label: "Nascido em (Local)", value: ex(dados.noivoLocalNasc) },
  ]);
  doc.addCamposGrid([
    { label: "Data do Batismo", value: ex(dados.noivoDataBatismo) },
    { label: "Paróquia de Batismo", value: ex(dados.noivoParoquiaBatismo) },
  ]);
  doc.addCamposGrid([
    { label: "Livro (Batismo)", value: ex(dados.noivoLivroBat) },
    { label: "Folha / Número", value: `${ex(dados.noivoFolhaBat)} / ${ex(dados.noivoNumBat)}` },
  ]);
  if (dados.noivoEstadoCivil === "Viúvo") {
    doc.addCamposGrid([
      { label: "Se Viúvo, de quem?", value: ex(dados.noivoViuvoDe) },
      { label: "Falecida aos", value: ex(dados.noivoDataObitoViuvo) },
    ]);
  }
  doc.addCamposGrid([
    { label: "Cidade Atual", value: ex(dados.noivoCidadeCivil) },
    { label: "Arquidiocese", value: ex(dados.noivoArqCivil) },
  ]);
  doc.addCamposGrid([
    { label: "Endereço (Rua, nº, Bairro, Cidade)", value: `${ex(dados.noivoEndRua)}, ${ex(dados.noivoEndNum)} — ${ex(dados.noivoEndBairro)}, ${ex(dados.noivoEndCidade)}` },
    { label: "Telefone", value: ex(dados.noivoFone) },
  ]);

  // ── 2. DADOS DA NOIVA ────────────────────────────────────────────────────
  doc.addLinha();
  doc.addTexto("2. DADOS DA NOIVA", { bold: true });
  doc.addEspaco(5);
  doc.addCamposGrid([
    { label: "Nome Completo", value: ex(dados.noivaNome) },
    { label: "Estado Civil", value: ex(dados.noivaEstadoCivil) },
  ]);
  doc.addCamposGrid([
    { label: "Nome do Pai", value: ex(dados.noivaPai) },
    { label: "Nome da Mãe", value: ex(dados.noivaMae) },
  ]);
  doc.addCamposGrid([
    { label: "Data de Nascimento", value: ex(dados.noivaDataNasc) },
    { label: "Nascida em (Local)", value: ex(dados.noivaLocalNasc) },
  ]);
  doc.addCamposGrid([
    { label: "Data do Batismo", value: ex(dados.noivaDataBatismo) },
    { label: "Paróquia de Batismo", value: ex(dados.noivaParoquiaBatismo) },
  ]);
  doc.addCamposGrid([
    { label: "Livro (Batismo)", value: ex(dados.noivaLivroBat) },
    { label: "Folha / Número", value: `${ex(dados.noivaFolhaBat)} / ${ex(dados.noivaNumBat)}` },
  ]);
  if (dados.noivaEstadoCivil === "Viúva") {
    doc.addCamposGrid([
      { label: "Se Viúva, de quem?", value: ex(dados.noivaViuvoDe) },
      { label: "Falecido aos", value: ex(dados.noivaDataObitoViuvo) },
    ]);
  }
  doc.addCamposGrid([
    { label: "Cidade Atual", value: ex(dados.noivaCidadeCivil) },
    { label: "Arquidiocese", value: ex(dados.noivaArqCivil) },
  ]);
  doc.addCamposGrid([
    { label: "Endereço (Rua, nº, Bairro, Cidade)", value: `${ex(dados.noivaEndRua)}, ${ex(dados.noivaEndNum)} — ${ex(dados.noivaEndBairro)}, ${ex(dados.noivaEndCidade)}` },
    { label: "Telefone", value: ex(dados.noivaFone) },
  ]);

  // ── 3. ENTREVISTA DOS NUBENTES ────────────────────────────────────────────
  doc.addLinha();
  doc.addTexto("3. ENTREVISTA DOS NUBENTES", { bold: true });
  doc.addEspaco(5);
  const perguntas = [
    "Consciente da importância do sacramento?",
    "Aceita a indissolubilidade (para sempre)?",
    "Assume a educação dos filhos na fé?",
    "Fez a Primeira Eucaristia?",
    "É Crismado(a)?",
    "Já houve anterior matrimônio religioso?",
    "Há algum impedimento Canônico?",
  ];
  doc.addCamposGrid([
    { label: "Pergunta", value: "Noivo" },
    { label: "", value: "Noiva" },
  ]);
  for (let i = 0; i < perguntas.length; i++) {
    doc.addCamposGrid([
      { label: `${i + 1}.${i + 1} ${perguntas[i]} (Noivo)`, value: ex(dados[`entNoivo${i + 1}`]) },
      { label: `${i + 1}.${i + 1} ${perguntas[i]} (Noiva)`, value: ex(dados[`entNoiva${i + 1}`]) },
    ]);
  }
  doc.addLinha();
  doc.addTexto("Endereço dos Nubentes após o Matrimônio", { bold: true });
  doc.addEspaco(3);
  doc.addCamposGrid([
    { label: "Rua", value: ex(dados.futRua) },
    { label: "Número", value: ex(dados.futNum) },
  ]);
  doc.addCamposGrid([
    { label: "Bairro", value: ex(dados.futBairro) },
    { label: "Cidade", value: ex(dados.futCidade) },
  ]);
  doc.addCamposGrid([
    { label: "Telefone", value: ex(dados.futFone) },
    { label: "", value: "" },
  ]);

  // ── 4. PROCLAMAS, CELEBRAÇÃO E DISPENSAS ────────────────────────────────
  doc.addLinha();
  doc.addTexto("4. PROCLAMAS E CELEBRAÇÃO", { bold: true });
  doc.addEspaco(5);
  doc.addCamposGrid([
    { label: "1ª Publicação", value: ex(dados.proc1) },
    { label: "2ª Publicação", value: ex(dados.proc2) },
  ]);
  doc.addCamposGrid([
    { label: "3ª Publicação", value: ex(dados.proc3) },
    { label: "Com Efeito Civil?", value: ex(dados.efeitoCivil) },
  ]);
  doc.addCamposGrid([
    { label: "Dia do Matrimônio", value: ex(dados.celDia) },
    { label: "Hora", value: ex(dados.celHora) },
  ]);
  doc.addCamposGrid([
    { label: "Local da Celebração", value: ex(dados.celLocal) },
    { label: "Observações", value: ex(dados.celObservacoes) },
  ]);
  doc.addCamposGrid([
    { label: "Habilitação Civil — Cartório", value: ex(dados.civilCartorio) },
    { label: "Ofício", value: ex(dados.civilOficio) },
  ]);
  doc.addCamposGrid([
    { label: "Data da Habilitação Civil", value: ex(dados.civilData) },
    { label: "", value: "" },
  ]);
  doc.addLinha();
  doc.addTexto("Dispensas e Documentos", { bold: true });
  doc.addEspaco(3);
  doc.addCamposGrid([
    { label: "Autorização para outro Sacerdote", value: ex(dados.autorizacaoPadre) },
    { label: "Transferência para outra Paróquia", value: ex(dados.transfParoquia) },
  ]);
  doc.addCamposGrid([
    { label: "Dispensas Obtidas", value: ex(dados.dispensasObtidas) },
    { label: "Outros Documentos", value: ex(dados.docOutros) },
  ]);
  doc.addCamposGrid([
    { label: "Certidão de Batismo entregue?", value: ex(dados.docBatismo) },
    { label: "Certificado do Curso de Noivos?", value: ex(dados.docCurso) },
  ]);

  // ── 5. ATA E TESTEMUNHAS ─────────────────────────────────────────────────
  doc.addLinha();
  doc.addTexto("5. ATA DA CELEBRAÇÃO DO MATRIMÔNIO", { bold: true });
  doc.addEspaco(5);
  doc.addCamposGrid([
    { label: "Dia", value: ex(dados.ataDia) },
    { label: "Mês", value: ex(dados.ataMes) },
  ]);
  doc.addCamposGrid([
    { label: "Ano", value: ex(dados.ataAno) },
    { label: "Hora", value: ex(dados.ataHora) },
  ]);
  doc.addCamposGrid([
    { label: "Local da Celebração", value: ex(dados.ataLocal) },
    { label: "Celebrante", value: ex(dados.ataCelebrante) },
  ]);
  doc.addCamposGrid([
    { label: "Livro de Registro", value: ex(dados.livroReg) },
    { label: "Folha / Número", value: `${ex(dados.folhaReg)} / ${ex(dados.numReg)}` },
  ]);
  doc.addLinha();
  doc.addTexto("Testemunhas", { bold: true });
  doc.addEspaco(3);
  for (let i = 1; i <= 6; i++) {
    const nomeVal = ex(dados[`test${i}Nome`]);
    const endVal  = ex(dados[`test${i}End`]);
    if (nomeVal !== "—" || endVal !== "—") {
      doc.addCamposGrid([
        { label: `${i}ª Testemunha — Nome`, value: nomeVal },
        { label: "Endereço", value: endVal },
      ]);
    }
  }

  doc.addAssinaturasDuplas(
    { label: "Noivo", nome: ex(dados.noivoNome) !== "—" ? ex(dados.noivoNome) : "", cargo: "Noivo" },
    { label: "Noiva", nome: ex(dados.noivaNome) !== "—" ? ex(dados.noivaNome) : "", cargo: "Noiva" }
  );

  await doc.salvar(`Ficha de Matrimônio — ${ex(dados.noivoNome)} e ${ex(dados.noivaNome)}`);
}

// ────────────────────────────────────────────────────────────────────────────
// UNÇÃO DOS ENFERMOS
// ────────────────────────────────────────────────────────────────────────────

export async function gerarPDFUncao(
  paroquia: Paroquia,
  dados: Record<string, string>,
  comunidadeEfetiva: string,
  fonte: string
): Promise<void> {
  const doc = new PdfDoc(fonte);
  await doc.addCabecalho(paroquia);
  doc.addTitulo("Ficha de Unção dos Enfermos");

  doc.addCamposGrid([
    { label: "Nome do Enfermo", value: ex(dados.nome) },
    { label: "Comunidade", value: ex(comunidadeEfetiva) },
    { label: "Endereço", value: ex(dados.endereco) },
    { label: "Telefone", value: ex(dados.telefone) },
    { label: "Data da Visita", value: ex(dados.dataVisita) },
    { label: "Quem Fez a Visita", value: ex(dados.visitante) },
  ]);

  if (dados.anotacoes) {
    doc.addLinha();
    doc.addSecao("Anotações Pastorais", dados.anotacoes);
  }

  doc.addAssinatura(ex(dados.visitante) !== "—" ? ex(dados.visitante) : "", "Padre / Diácono / Agente Pastoral");
  await doc.salvar(`Ficha de Unção — ${ex(dados.nome)}`);
}

// ────────────────────────────────────────────────────────────────────────────
// ÓBITOS E EXÉQUIAS
// ────────────────────────────────────────────────────────────────────────────

export async function gerarPDFObito(
  paroquia: Paroquia,
  dados: Record<string, string>,
  comunidadeEfetiva: string,
  fonte: string
): Promise<void> {
  const doc = new PdfDoc(fonte);
  await doc.addCabecalho(paroquia);
  doc.addTitulo("Ficha de Óbito e Exéquias");

  doc.addCamposGrid([
    { label: "Nome do Falecido(a)", value: ex(dados.nome) },
    { label: "Comunidade", value: ex(comunidadeEfetiva) },
    { label: "Data de Nascimento", value: ex(dados.dataNasc) },
    { label: "Data do Falecimento", value: ex(dados.dataFalecimento) },
    { label: "Data das Exéquias", value: ex(dados.dataExequias) },
    { label: "Local das Exéquias", value: ex(dados.local) },
    { label: "Ministro", value: ex(dados.ministro) },
    { label: "Cemitério", value: ex(dados.cemiterio) },
  ]);

  if (dados.obs) {
    doc.addLinha();
    doc.addSecao("Observações", dados.obs);
  }

  await doc.salvar(`Ficha de Óbito — ${ex(dados.nome)}`);
}

// ────────────────────────────────────────────────────────────────────────────
// CERTIFICADOS (geração via jsPDF — fiel à prévia de impressão)
// ────────────────────────────────────────────────────────────────────────────

const v = (s?: string, fb = "________________") => s?.trim() || fb;

export async function gerarPDFCertBatismo(
  paroquia: Paroquia,
  form: Record<string, string>,
  fonte: string
): Promise<void> {
  const doc = new PdfDoc(fonte);
  await doc.addCabecalho(paroquia);

  doc.addTextoEstilo("CERTIDÃO DE BATISMO", { fontSize: 18, bold: true, align: "center", color: [20, 20, 20] });
  doc.addEspaco(4);
  doc.addTextoEstilo(v(form.nome, "___________________________"), { fontSize: 17, bold: true, align: "center", color: [31, 59, 115] });
  doc.addEspaco(7);

  doc.addTextoEstilo(`Nascido(a) em ${v(form.naturalidade, "________")}, no dia ${v(form.nascimento, "____/____/____")},`, { align: "center" });
  doc.addTextoEstilo(`filho(a) de ${v(form.pais)}.`, { align: "center" });
  doc.addEspaco(5);

  const func = form.funcaoCelebrante?.trim() ? ` (${form.funcaoCelebrante.trim()})` : "";
  doc.addTextoEstilo(`Foi batizado(a) solenemente pelo ${v(form.celebrante)}${func}`, { align: "center" });
  doc.addTextoEstilo(`no dia ${v(form.dataBatismo, "________")}, na ${v(form.localBatismo)}`, { align: "center" });
  doc.addTextoEstilo(`desta Área Missionária ${paroquia.nome}.`, { align: "center" });
  doc.addEspaco(7);

  doc.addTextoEstilo("Foram seus padrinhos:", { align: "center" });
  doc.addEspaco(3);
  doc.addTextoEstilo(v(form.padrinho, "________"), { fontSize: 13, bold: true, align: "center" });
  doc.addTextoEstilo("e", { italic: true, align: "center" });
  doc.addTextoEstilo(v(form.madrinha, "________"), { fontSize: 13, bold: true, align: "center" });
  doc.addEspaco(7);

  doc.addTextoEstilo(
    `E para constar, foi lavrado o presente termo no livro nº ${v(form.livro, "___")}, folha nº ${v(form.folha, "___")}, sob o nº ${v(form.termo, "___")}.`,
    { italic: true, align: "center" }
  );

  doc.addAssinaturaDir(form.cidadeData || "", form.assinante || "", form.cargoAssinante || "");
  await doc.salvar(`Certidão de Batismo — ${v(form.nome, "sem nome")}`);
}

export async function gerarPDFCertCrisma(
  paroquia: Paroquia,
  form: Record<string, string>,
  fonte: string
): Promise<void> {
  const doc = new PdfDoc(fonte);
  await doc.addCabecalho(paroquia);

  doc.addTextoEstilo("Lembrança da Crisma", { fontSize: 20, bold: true, align: "center", color: [31, 59, 115] });
  doc.addEspaco(3);
  doc.addTextoEstilo('"Recebe por este sinal o Espírito Santo, o dom de Deus!"', { italic: true, align: "center", color: [55, 65, 81] });
  doc.addEspaco(7);

  doc.addTextoEstilo("Certificamos que", { align: "center" });
  doc.addEspaco(2);
  doc.addTextoEstilo(v(form.fiel, "____________________________________"), { fontSize: 16, bold: true, align: "center" });
  doc.addEspaco(5);

  doc.addTextoEstilo(`recebeu o Sacramento da Confirmação no dia ${v(form.dataCrisma, "___/___/___")},`, { align: "center" });
  doc.addTextoEstilo(`na ${v(form.local)},`, { align: "center" });
  doc.addTextoEstilo(`desta ${paroquia.nome}.`, { align: "center" });
  doc.addEspaco(6);

  doc.addCaixaCitacao("Dons do Espírito Santo: Sabedoria • Entendimento • Conselho • Fortaleza • Ciência • Piedade • Temor a Deus");
  doc.addEspaco(5);

  doc.addTextoEstilo(`Padrinho/Madrinha: ${v(form.padrinhoMadrinha)}    |    Catequista: ${v(form.catequista)}`, { align: "center" });
  doc.addEspaco(2);
  doc.addTextoEstilo(`Celebrante: ${v(form.celebrante)}`, { align: "center" });
  doc.addEspaco(5);

  doc.addTextoEstilo(
    `Registrado no Livro nº ${v(form.livro, "___")}, folha nº ${v(form.folha, "___")}, termo nº ${v(form.termo, "___")}.`,
    { italic: true, align: "center" }
  );

  doc.addAssinaturaDir(form.cidadeData || "", form.assinante || "", form.cargoAssinante || "");
  await doc.salvar(`Lembrança da Crisma — ${v(form.fiel, "sem nome")}`);
}

export async function gerarPDFCertEucaristia(
  paroquia: Paroquia,
  form: Record<string, string>,
  fonte: string
): Promise<void> {
  const doc = new PdfDoc(fonte);
  await doc.addCabecalho(paroquia);

  doc.addTextoEstilo("LEMBRANÇA DA PRIMEIRA EUCARISTIA", { fontSize: 18, bold: true, align: "center", color: [31, 59, 115] });
  doc.addEspaco(7);

  doc.addTextoEstilo("Certificamos que", { align: "center" });
  doc.addEspaco(3);
  doc.addTextoEstilo(v(form.fiel, "________________________________"), { fontSize: 17, bold: true, align: "center" });
  doc.addEspaco(5);

  doc.addTextoEstilo(`recebeu pela primeira vez o Pão da Vida no dia ${v(form.dataEucaristia, "___/___/___")},`, { align: "center" });
  doc.addTextoEstilo(`na ${v(form.local)},`, { align: "center" });
  doc.addTextoEstilo(`desta ${paroquia.nome}.`, { align: "center" });
  doc.addEspaco(7);

  doc.addCaixaCitacao("Quem come a minha carne e bebe o meu sangue tem a vida eterna, e eu o ressuscitarei no último dia. (João 6:54)");
  doc.addEspaco(5);

  doc.addTextoEstilo(`Catequista: ${v(form.catequista)}    |    Celebrante: ${v(form.celebrante)}`, { align: "center" });
  doc.addEspaco(3);

  doc.addAssinaturaDir(form.cidadeData || "", form.assinante || "", form.cargoAssinante || "");
  await doc.salvar(`Lembrança da 1ª Eucaristia — ${v(form.fiel, "sem nome")}`);
}

export async function gerarPDFCertMatrimonio(
  paroquia: Paroquia,
  form: Record<string, string>,
  fonte: string
): Promise<void> {
  const doc = new PdfDoc(fonte);
  await doc.addCabecalho(paroquia);

  doc.addTextoEstilo("CERTIDÃO DE MATRIMÔNIO", { fontSize: 18, bold: true, align: "center", color: [20, 20, 20] });
  doc.addEspaco(7);

  doc.addTextoEstilo("Certificamos que, perante a Igreja de Deus e as leis sagradas, uniram-se em matrimônio:", { align: "center" });
  doc.addEspaco(4);

  doc.addTextoEstilo(v(form.esposo, "_________________________"), { fontSize: 16, bold: true, align: "center" });
  doc.addTextoEstilo("e", { italic: true, align: "center" });
  doc.addTextoEstilo(v(form.esposa, "_________________________"), { fontSize: 16, bold: true, align: "center" });
  doc.addEspaco(6);

  doc.addTextoEstilo(`A cerimônia foi realizada no dia ${v(form.dataMatrimonio, "________")},`, { align: "center" });
  doc.addTextoEstilo(`na ${v(form.local)},`, { align: "center" });
  doc.addTextoEstilo(`desta ${paroquia.nome}.`, { align: "center" });
  doc.addEspaco(4);

  const funcCel = form.funcaoCelebrante?.trim() ? ` (${form.funcaoCelebrante.trim()})` : "";
  doc.addTextoEstilo(`Celebrada solenemente pelo Revmo. ${v(form.celebrante)}${funcCel}.`, { align: "center" });
  doc.addEspaco(7);

  doc.addTextoEstilo("Foram testemunhas deste ato sagrado:", { align: "center" });
  doc.addEspaco(2);
  doc.addTextoEstilo(v(form.testemunha1, "________"), { fontSize: 13, bold: true, align: "center" });
  doc.addTextoEstilo("e", { bold: true, align: "center" });
  doc.addTextoEstilo(v(form.testemunha2, "________"), { fontSize: 13, bold: true, align: "center" });
  doc.addEspaco(6);

  doc.addTextoEstilo(
    `E para que este ato tenha validade jurídica e eclesiástica, foi lavrado o termo no livro nº ${v(form.livro, "___")}, folha nº ${v(form.folha, "___")}, sob o nº ${v(form.termo, "___")}.`,
    { italic: true, align: "center" }
  );

  doc.addAssinaturaDir(form.cidadeData || "", form.assinante || "", form.cargoAssinante || "");
  await doc.salvar(`Certidão de Matrimônio — ${v(form.esposo, "sem nome")} e ${v(form.esposa, "sem nome")}`);
}
