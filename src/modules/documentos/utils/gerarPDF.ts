import { jsPDF } from "jspdf";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile, readFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import type { Paroquia } from "../../../core/types/app.types";

// ── Constantes de layout ────────────────────────────────────────────────────
const ML = 20; // margem esquerda
const MR = 20; // margem direita
const MT = 20; // margem superior
const MB = 20; // margem inferior

// ── Utilitário de fonte ─────────────────────────────────────────────────────

/**
 * Retorna o nome da fonte sem modificação.
 * PdfDoc tenta embutir a fonte do sistema; se não encontrar, cai para helvetica/times/courier.
 */
export function mapFonte(nome: string): string {
  return nome;
}

/** Mapeia para uma das 3 fontes built-in do jsPDF (fallback interno). */
function fonteBuiltin(nome: string): string {
  const f = nome.toLowerCase();
  if (f.includes("courier") || f.includes("mono")) return "courier";
  if (f.includes("times") || f.includes("georgia") || f.includes("serif")) return "times";
  return "helvetica";
}

// ── Funções auxiliares internas (copiadas da AtaPage) ───────────────────────

/**
 * Remove diacríticos para medir largura de texto com métricas confiáveis
 * no jsPDF (a fonte Times tem métricas incompletas para caracteres acentuados).
 */
function semAcentos(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Renderiza uma linha de texto justificada.
 * Na última linha (ou linha única) usa alinhamento à esquerda normal.
 * Mede sem acentos mas renderiza com acentos.
 */
function textJustificado(
  doc: jsPDF,
  linha: string,
  isUltima: boolean,
  lx: number,
  ly: number,
  lw: number
): void {
  if (isUltima || !linha.trim()) {
    doc.text(linha, lx, ly);
    return;
  }
  const palavras = linha.split(" ").filter((p) => p.length > 0);
  if (palavras.length <= 1) {
    doc.text(linha, lx, ly);
    return;
  }

  const larguraLinha = doc.getTextWidth(semAcentos(linha));
  const larguraEspaco = doc.getTextWidth(" ");
  const espacoExtra = (lw - larguraLinha) / (palavras.length - 1);
  const espacoTotal = larguraEspaco + espacoExtra;

  let cx = lx;
  for (const palavra of palavras) {
    doc.text(palavra, cx, ly);
    cx += doc.getTextWidth(semAcentos(palavra)) + espacoTotal;
  }
}

/**
 * Valida e retorna o data URL de um logo armazenado no banco.
 * logo_path já é um data URL (base64) — só precisamos verificar o prefixo.
 */
function carregarImagem(dataUrl: string | undefined): string | null {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  return dataUrl;
}

// ── Classe principal ────────────────────────────────────────────────────────

export class PdfDoc {
  private doc: jsPDF;
  private fonteName: string;
  private W: number;
  private H: number;
  private cw: number; // content width
  private y: number;  // cursor vertical atual

  constructor(fonteName: string) {
    this.fonteName = fonteName;
    this.doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    this.W = this.doc.internal.pageSize.getWidth();
    this.H = this.doc.internal.pageSize.getHeight();
    this.cw = this.W - ML - MR;
    this.y = MT;
  }

  // ── Embedding de fonte do sistema ─────────────────────────────────────────

  /**
   * Tenta carregar a fonte selecionada do sistema via Tauri e embutir no PDF.
   * Se não encontrar o arquivo, faz fallback para a fonte built-in mais próxima.
   */
  private async carregarFonteDoSistema(): Promise<void> {
    const f = this.fonteName.toLowerCase();

    // Fontes que mapeiam diretamente para built-ins do jsPDF (sem embedding)
    // Inclui Arial* pois é metricamente idêntica ao Helvetica e o jsPDF
    // não faz subsetting — embutir fontes grandes gera PDFs de 20+ MB.
    if (
      f.includes("arial") ||
      f.includes("helvetica") ||
      f === "times" ||
      f.includes("times new roman") ||
      f === "courier" ||
      f.includes("courier new")
    ) {
      this.fonteName = fonteBuiltin(this.fonteName);
      return;
    }

    try {
      const [normalPath, boldPath] = await invoke<[string | null, string | null]>(
        "buscar_arquivo_fonte",
        { familia: this.fonteName }
      );

      if (!normalPath) {
        this.fonteName = fonteBuiltin(this.fonteName);
        return;
      }

      // Só embute fontes .ttf — arquivos .ttc (TrueType Collection) e .otf
      // causam renderização incorreta no jsPDF e geram PDFs enormes.
      const ext = normalPath.split(".").pop()?.toLowerCase();
      if (ext !== "ttf") {
        this.fonteName = fonteBuiltin(this.fonteName);
        return;
      }

      const toBase64 = (bytes: Uint8Array): string => {
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      };

      const normalBytes = await readFile(normalPath);

      // Rejeita fontes muito grandes (> 5 MB) para evitar PDFs enormes
      if (normalBytes.length > 5 * 1024 * 1024) {
        this.fonteName = fonteBuiltin(this.fonteName);
        return;
      }

      const normalVfsName = `${this.fonteName}-normal.ttf`;
      this.doc.addFileToVFS(normalVfsName, toBase64(normalBytes));
      this.doc.addFont(normalVfsName, this.fonteName, "normal");

      if (boldPath && boldPath !== normalPath) {
        const boldExt = boldPath.split(".").pop()?.toLowerCase();
        if (boldExt === "ttf") {
          const boldBytes = await readFile(boldPath);
          if (boldBytes.length <= 5 * 1024 * 1024) {
            const boldVfsName = `${this.fonteName}-bold.ttf`;
            this.doc.addFileToVFS(boldVfsName, toBase64(boldBytes));
            this.doc.addFont(boldVfsName, this.fonteName, "bold");
          } else {
            this.doc.addFont(normalVfsName, this.fonteName, "bold");
          }
        } else {
          this.doc.addFont(normalVfsName, this.fonteName, "bold");
        }
      } else {
        this.doc.addFont(normalVfsName, this.fonteName, "bold");
      }
    } catch {
      this.fonteName = fonteBuiltin(this.fonteName);
    }
  }

  // ── Verificação de quebra de página ──────────────────────────────────────

  private checkPage(needed = 10): void {
    if (this.y + needed > this.H - MB) {
      this.doc.addPage();
      this.y = MT;
    }
  }

  /** Força uma nova página (útil para separar seções distintas). */
  novaPagina(): this {
    this.doc.addPage();
    this.y = MT;
    return this;
  }

  // ── Cabeçalho ─────────────────────────────────────────────────────────────

  /**
   * Monta o cabeçalho completo:
   * - Logo da paróquia à esquerda e logo da diocese à direita
   * - Nome da diocese (cinza, pequeno)
   * - Nome da paróquia (azul, negrito)
   * - Contatos centralizados
   * - Linha horizontal azul
   */
  async addCabecalho(paroquia: Paroquia): Promise<this> {
    // Carrega e embute a fonte do sistema antes de qualquer renderização
    await this.carregarFonteDoSistema();

    const logoLeft  = carregarImagem(paroquia.logo_path);
    const logoRight = carregarImagem(paroquia.diocese_logo_path);
    const logoSize  = 24;

    if (logoLeft)  this.doc.addImage(logoLeft,  "JPEG", ML, this.y, logoSize, logoSize);
    if (logoRight) this.doc.addImage(logoRight, "JPEG", this.W - MR - logoSize, this.y, logoSize, logoSize);

    const cx = this.W / 2;
    let yh = this.y + 5;

    // Diocese
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text((paroquia.diocese || "Arquidiocese").toUpperCase(), cx, yh, { align: "center" });
    yh += 5;

    // Nome da paróquia — azul, negrito
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(31, 59, 115);
    const nomeLinhas = this.doc.splitTextToSize(
      (paroquia.nome || "Paróquia").toUpperCase(),
      this.cw - logoSize * 2 - 10
    );
    for (const linha of nomeLinhas) {
      this.doc.text(linha, cx, yh, { align: "center" });
      yh += 6;
    }
    yh += 1;

    // Contatos
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    this.doc.setTextColor(80, 80, 80);
    const infos: string[] = [
      paroquia.endereco,
      [paroquia.cep, paroquia.cidade, paroquia.estado].filter(Boolean).join(" - "),
      paroquia.email,
      paroquia.telefone,
      paroquia.cnpj ? `CNPJ: ${paroquia.cnpj}` : "",
    ].filter(Boolean) as string[];
    for (const info of infos) {
      this.doc.text(info, cx, yh, { align: "center" });
      yh += 4;
    }

    this.y = Math.max(yh + 2, this.y + logoSize + 4);

    // Linha azul
    this.doc.setDrawColor(31, 59, 115);
    this.doc.setLineWidth(0.6);
    this.doc.line(ML, this.y, this.W - MR, this.y);
    this.y += 5;

    return this;
  }

  // ── Protocolo ─────────────────────────────────────────────────────────────

  /**
   * Exibe o número de protocolo alinhado à direita.
   * Data opcional é exibida antes do número, também à direita.
   */
  addProtocolo(numero: string, data?: string): this {
    if (!numero?.trim()) return this;

    this.doc.setFont(this.fonteName, "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 100, 100);

    if (data?.trim()) {
      this.doc.text(data.trim(), this.W - MR, this.y, { align: "right" });
      this.y += 4.5;
    }

    this.doc.text(`Protocolo nº ${numero}`, this.W - MR, this.y, { align: "right" });
    this.y += 7;

    return this;
  }

  /**
   * Exibe protocolo à esquerda e data à direita na mesma linha.
   * Formato usado nos recibos.
   */
  addProtocoloComData(protocolo: string, data: string): this {
    this.checkPage(8);
    this.doc.setFont(this.fonteName, "bold");
    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);

    if (protocolo?.trim()) this.doc.text(protocolo.trim(), ML, this.y);
    if (data?.trim())       this.doc.text(data.trim(), this.W - MR, this.y, { align: "right" });

    this.y += 7;
    return this;
  }

  // ── Bloco Recibo ──────────────────────────────────────────────────────────

  /**
   * Desenha a caixa característica do recibo:
   * - Borda arredondada
   * - Linha de título (esq) + badge R$ (dir) com separador horizontal
   * - Corpo de texto com segmentos de negrito embutidos
   */
  addReciboBox(
    titulo: string,
    valor: string,
    segmentos: Array<{ text: string; bold?: boolean }>
  ): this {
    const pad  = 6;
    const boxX = ML;
    const boxW = this.cw;
    const innerW = boxW - pad * 2;

    // ── Tokeniza os segmentos em palavras com flag de negrito ──────────────
    const tokens: Array<{ word: string; bold: boolean }> = [];
    for (const seg of segmentos) {
      const palavras = seg.text.split(/\s+/).filter((w) => w.length > 0);
      for (const p of palavras) tokens.push({ word: p, bold: !!seg.bold });
    }

    // ── Monta linhas respeitando largura interna ───────────────────────────
    this.doc.setFontSize(10);
    const linhas: Array<Array<{ word: string; bold: boolean }>> = [];
    let linhaAtual: typeof tokens = [];
    let larguraAtual = 0;

    for (const tok of tokens) {
      this.doc.setFont(this.fonteName, tok.bold ? "bold" : "normal");
      const ww = this.doc.getTextWidth(tok.word);
      const sw = this.doc.getTextWidth(" ");
      if (larguraAtual + ww > innerW && linhaAtual.length > 0) {
        linhas.push(linhaAtual);
        linhaAtual = [tok];
        larguraAtual = ww + sw;
      } else {
        linhaAtual.push(tok);
        larguraAtual += ww + sw;
      }
    }
    if (linhaAtual.length > 0) linhas.push(linhaAtual);

    // ── Calcula altura total da caixa ─────────────────────────────────────
    const headerH = 13;
    const bodyH   = linhas.length * 5.8 + pad * 2 + 2;
    const totalH  = headerH + bodyH;

    this.checkPage(totalH + 12);

    const boxY = this.y;

    // ── Borda arredondada ─────────────────────────────────────────────────
    this.doc.setDrawColor(26, 29, 46);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(boxX, boxY, boxW, totalH, 3, 3, "S");

    // ── Título ────────────────────────────────────────────────────────────
    const titY = boxY + headerH * 0.72;
    this.doc.setFont(this.fonteName, "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(26, 29, 46);
    this.doc.text(titulo.toUpperCase(), boxX + pad, titY);

    // ── Badge R$ ──────────────────────────────────────────────────────────
    this.doc.setFont(this.fonteName, "bold");
    this.doc.setFontSize(11);
    const valorText = `R$ ${valor}`;
    const valorTextW = this.doc.getTextWidth(valorText);
    const badgeW = valorTextW + 10;
    const badgeH = headerH - 3;
    const badgeX = boxX + boxW - pad - badgeW;
    const badgeY = boxY + 1.5;
    this.doc.setFillColor(238, 242, 247);
    this.doc.setDrawColor(26, 29, 46);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "FD");
    this.doc.setTextColor(26, 29, 46);
    this.doc.text(valorText, badgeX + badgeW / 2, badgeY + badgeH * 0.68, { align: "center" });

    // ── Linha divisória ───────────────────────────────────────────────────
    const divY = boxY + headerH;
    this.doc.setDrawColor(26, 29, 46);
    this.doc.setLineWidth(0.5);
    this.doc.line(boxX, divY, boxX + boxW, divY);

    // ── Corpo com negrito misto ───────────────────────────────────────────
    let ty = divY + pad + 4;
    const tx = boxX + pad;
    for (const linha of linhas) {
      let cx = tx;
      for (const tok of linha) {
        this.doc.setFont(this.fonteName, tok.bold ? "bold" : "normal");
        this.doc.setFontSize(10);
        this.doc.setTextColor(26, 29, 46);
        this.doc.text(tok.word, cx, ty);
        cx += this.doc.getTextWidth(tok.word) + this.doc.getTextWidth(" ");
      }
      ty += 5.8;
    }

    this.y = boxY + totalH + 6;
    return this;
  }

  // ── Título ────────────────────────────────────────────────────────────────

  /**
   * Renderiza um título centralizado em maiúsculas e negrito.
   */
  addTitulo(texto: string): this {
    if (!texto?.trim()) return this;

    this.checkPage(14);
    this.doc.setFont(this.fonteName, "bold");
    this.doc.setFontSize(13);
    this.doc.setTextColor(20, 20, 20);

    const linhas = this.doc.splitTextToSize(texto.toUpperCase(), this.cw);
    this.doc.text(linhas, this.W / 2, this.y, { align: "center" });
    this.y += linhas.length * 6 + 4;

    return this;
  }

  // ── Seção: label + texto justificado ─────────────────────────────────────

  /**
   * Imprime um label em negrito seguido do texto justificado.
   * Se o texto contiver "\n", cada parágrafo é justificado separadamente.
   */
  addSecao(label: string, texto: string): this {
    if (!texto?.trim()) return this;

    const paragrafos = texto.split("\n");

    if (label?.trim()) {
      this.checkPage(12);
      this.doc.setFont(this.fonteName, "bold");
      this.doc.setFontSize(10);
      this.doc.setTextColor(20, 20, 20);
      this.doc.text(`${label}:`, ML, this.y);
      this.y += 5.5;
    }

    this.doc.setFont(this.fonteName, "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(40, 40, 40);

    for (const paragrafo of paragrafos) {
      // Define fonte/tamanho ANTES de splitTextToSize — garante métricas corretas
      this.doc.setFont(this.fonteName, "normal");
      this.doc.setFontSize(10);
      const linhas: string[] = this.doc.splitTextToSize(paragrafo, this.cw);

      for (let i = 0; i < linhas.length; i++) {
        this.checkPage(6);
        textJustificado(this.doc, linhas[i], i === linhas.length - 1, ML, this.y, this.cw);
        this.y += 5.5;
      }
    }

    this.y += 4;
    return this;
  }

  // ── Texto corrido justificado ─────────────────────────────────────────────

  /**
   * Texto corrido com opções de recuo, negrito e alinhamento.
   * Padrão: justificado à esquerda sem recuo.
   */
  addTexto(
    texto: string,
    options?: { indent?: boolean; bold?: boolean; align?: "left" | "center" | "right" }
  ): this {
    if (!texto?.trim()) return this;

    const { indent = false, bold = false, align = "left" } = options ?? {};
    const lx  = ML + (indent ? 10 : 0);
    const lw  = this.cw - (indent ? 10 : 0);

    // Define fonte/tamanho ANTES de splitTextToSize — garante métricas corretas
    this.doc.setFont(this.fonteName, bold ? "bold" : "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(40, 40, 40);

    const paragrafos = texto.split("\n");
    for (const paragrafo of paragrafos) {
      this.doc.setFont(this.fonteName, bold ? "bold" : "normal");
      this.doc.setFontSize(10);
      const linhas: string[] = this.doc.splitTextToSize(paragrafo, lw);

      for (let i = 0; i < linhas.length; i++) {
        this.checkPage(6);
        if (align === "center") {
          this.doc.text(linhas[i], this.W / 2, this.y, { align: "center" });
        } else if (align === "right") {
          this.doc.text(linhas[i], this.W - MR, this.y, { align: "right" });
        } else {
          // left / justify
          textJustificado(this.doc, linhas[i], i === linhas.length - 1, lx, this.y, lw);
        }
        this.y += 5.5;
      }
    }

    this.y += 1;
    return this;
  }

  // ── Linha horizontal ──────────────────────────────────────────────────────

  /** Traça uma linha horizontal fina entre as margens. */
  addLinha(): this {
    this.checkPage(4);
    this.doc.setDrawColor(180, 180, 180);
    this.doc.setLineWidth(0.3);
    this.doc.line(ML, this.y, this.W - MR, this.y);
    this.y += 4;
    return this;
  }

  // ── Espaçamento vertical ──────────────────────────────────────────────────

  /** Avança o cursor vertical em `mm` milímetros (padrão 6 mm). */
  addEspaco(mm = 6): this {
    this.y += mm;
    return this;
  }

  // ── Assinatura simples ────────────────────────────────────────────────────

  /**
   * Adiciona uma única assinatura centralizada:
   * linha, nome em negrito e cargo abaixo.
   */
  addAssinatura(nome: string, cargo: string): this {
    this.checkPage(25);
    this.y += 6;

    const cx   = ML + this.cw / 2;
    const linW = this.cw * 0.4;

    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    this.doc.line(cx - linW / 2, this.y, cx + linW / 2, this.y);
    this.y += 5;

    this.doc.setFont(this.fonteName, "bold");
    this.doc.setFontSize(10);
    this.doc.setTextColor(20, 20, 20);
    this.doc.text(nome || "________________________", cx, this.y, { align: "center" });
    this.y += 5;

    this.doc.setFont(this.fonteName, "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(80, 80, 80);
    this.doc.text(cargo, cx, this.y, { align: "center" });
    this.y += 8;

    return this;
  }

  // ── Assinaturas duplas ────────────────────────────────────────────────────

  /**
   * Duas assinaturas lado a lado (esquerda e direita).
   * Cada bloco tem: label/linha, nome em negrito e cargo.
   */
  addAssinaturasDuplas(
    esq: { label: string; nome?: string; cargo?: string },
    dir: { label: string; nome?: string; cargo?: string }
  ): this {
    this.checkPage(25);
    this.y += 8;

    const col1x = ML + this.cw * 0.05;
    const col2x = ML + this.cw * 0.55;
    const linW  = this.cw * 0.35;

    // Linhas
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    this.doc.line(col1x, this.y, col1x + linW, this.y);
    this.doc.line(col2x, this.y, col2x + linW, this.y);
    this.y += 5;

    // Nomes
    this.doc.setFont(this.fonteName, "bold");
    this.doc.setFontSize(10);
    this.doc.setTextColor(20, 20, 20);
    this.doc.text(
      esq.nome || esq.label || "________________________",
      col1x + linW / 2,
      this.y,
      { align: "center" }
    );
    this.doc.text(
      dir.nome || dir.label || "________________________",
      col2x + linW / 2,
      this.y,
      { align: "center" }
    );
    this.y += 5;

    // Cargos
    this.doc.setFont(this.fonteName, "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(80, 80, 80);
    if (esq.cargo) this.doc.text(esq.cargo, col1x + linW / 2, this.y, { align: "center" });
    if (dir.cargo) this.doc.text(dir.cargo, col2x + linW / 2, this.y, { align: "center" });
    this.y += 8;

    return this;
  }

  // ── Campos em grade (estilo prévia) ──────────────────────────────────────

  /**
   * Renderiza campos no estilo "label pequeno + valor + linha inferior",
   * idêntico à prévia HTML. `colunas` define quantos campos por linha (1 ou 2).
   */
  addCamposGrid(
    campos: { label: string; value: string }[],
    colunas: 1 | 2 | 3 = 2,
    noLines = false
  ): this {
    const gap      = 8;
    const colW     = colunas === 3 ? (this.cw - gap * 2) / 3 : colunas === 2 ? (this.cw - gap) / 2 : this.cw;
    const lblLineH = 4;   // espaçamento entre linhas do label
    const valLineH = 5.5; // espaçamento entre linhas do valor

    for (let i = 0; i < campos.length; i += colunas) {
      // Primeira passagem: calcula quantas linhas cada coluna precisa
      let maxLblLines = 1;
      let maxValLines = 1;

      for (let c = 0; c < colunas && i + c < campos.length; c++) {
        const { label, value } = campos[i + c];

        this.doc.setFont(this.fonteName, "bold");
        this.doc.setFontSize(7.5);
        const lbl = this.doc.splitTextToSize(label.toUpperCase(), colW);
        maxLblLines = Math.max(maxLblLines, lbl.length);

        this.doc.setFont(this.fonteName, "normal");
        this.doc.setFontSize(10);
        const val = this.doc.splitTextToSize(value || " ", colW);
        maxValLines = Math.max(maxValLines, val.length);
      }

      const rowH = maxLblLines * lblLineH + maxValLines * valLineH + 1;
      this.checkPage(rowH + 4);

      for (let c = 0; c < colunas && i + c < campos.length; c++) {
        const { label, value } = campos[i + c];
        const x = ML + c * (colW + gap);

        // Label (uppercase, cinza) — com quebra de linha
        this.doc.setFont(this.fonteName, "bold");
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(100, 112, 133);
        const lblLines: string[] = this.doc.splitTextToSize(label.toUpperCase(), colW);
        lblLines.forEach((linha: string, li: number) => {
          this.doc.text(linha, x, this.y + li * lblLineH);
        });

        const valueY = this.y + maxLblLines * lblLineH + 1;

        // Valor — com quebra de linha
        this.doc.setFont(this.fonteName, "normal");
        this.doc.setFontSize(10);
        this.doc.setTextColor(30, 30, 30);
        const valLines: string[] = this.doc.splitTextToSize(value || " ", colW);
        valLines.forEach((linha: string, li: number) => {
          this.doc.text(linha, x, valueY + li * valLineH);
        });

        // Linha inferior (desativada para layout compacto)
        if (!noLines && false) {
          const lineY = this.y + maxLblLines * lblLineH + maxValLines * valLineH + 1;
          this.doc.setDrawColor(208, 213, 221);
          this.doc.setLineWidth(0.3);
          this.doc.line(x, lineY, x + colW, lineY);
        }
      }

      this.y += rowH;
    }

    this.y += 2;
    return this;
  }

  // ── Tabela simples ────────────────────────────────────────────────────────

  /**
   * Tabela de duas colunas com cabeçalho azul (#1f3b73) e linhas alternadas.
   * @param headers - Títulos das duas colunas [col1, col2]
   * @param rows    - Linhas de dados: cada entrada é [texto, valor]
   */
  addTabela(headers: [string, string], rows: [string, string][]): this {
    const colW1 = this.cw * 0.6;
    const colW2 = this.cw * 0.4;
    const rowH  = 7;

    this.checkPage(rowH + 4);

    // Cabeçalho azul
    this.doc.setFillColor(31, 59, 115);
    this.doc.rect(ML, this.y - 5, this.cw, rowH, "F");
    this.doc.setFont(this.fonteName, "bold");
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(headers[0], ML + 2, this.y);
    this.doc.text(headers[1], ML + colW1 + 2, this.y);
    this.y += rowH;

    // Linhas de dados
    this.doc.setFont(this.fonteName, "normal");
    this.doc.setFontSize(10);

    for (let i = 0; i < rows.length; i++) {
      this.checkPage(rowH + 2);

      // Fundo alternado
      if (i % 2 === 0) {
        this.doc.setFillColor(240, 244, 251);
        this.doc.rect(ML, this.y - 5, this.cw, rowH, "F");
      }

      this.doc.setTextColor(30, 30, 30);
      this.doc.text(rows[i][0], ML + 2, this.y);
      this.doc.text(rows[i][1], ML + colW1 + 2, this.y);
      this.y += rowH;
    }

    // Borda da tabela
    const tableH = rowH * (rows.length + 1);
    this.doc.setDrawColor(180, 180, 180);
    this.doc.setLineWidth(0.2);
    this.doc.rect(ML, this.y - tableH, this.cw, tableH, "S");
    // Divisor de colunas
    this.doc.line(ML + colW1, this.y - tableH, ML + colW1, this.y);

    this.y += 4;
    return this;
  }

  // ── Texto com estilo livre (fontSize, italic, color) ────────────────────

  addTextoEstilo(
    texto: string,
    opts?: {
      fontSize?: number;
      bold?: boolean;
      italic?: boolean;
      align?: "left" | "center" | "right";
      color?: [number, number, number];
    }
  ): this {
    if (!texto?.trim()) return this;

    const { fontSize = 10, bold = false, italic = false, align = "left", color = [40, 40, 40] } = opts ?? {};
    const style = bold ? "bold" : italic ? "italic" : "normal";

    this.doc.setFont(this.fonteName, style);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...color);

    const lineH = fontSize * 0.45 + 1.5;
    const linhas: string[] = this.doc.splitTextToSize(texto, this.cw);

    for (const linha of linhas) {
      this.checkPage(lineH + 2);
      if (align === "center") {
        this.doc.text(linha, this.W / 2, this.y, { align: "center" });
      } else if (align === "right") {
        this.doc.text(linha, this.W - MR, this.y, { align: "right" });
      } else {
        this.doc.text(linha, ML, this.y);
      }
      this.y += lineH;
    }
    this.y += 2;
    return this;
  }

  // ── Caixa de citação com borda ────────────────────────────────────────────

  addCaixaCitacao(texto: string): this {
    if (!texto?.trim()) return this;

    const pad = 6;
    this.doc.setFont(this.fonteName, "italic");
    this.doc.setFontSize(10);
    this.doc.setTextColor(55, 65, 81);

    const linhas: string[] = this.doc.splitTextToSize(`"${texto}"`, this.cw - pad * 2);
    const boxH = linhas.length * 5.5 + pad * 2;

    this.checkPage(boxH + 4);

    this.doc.setDrawColor(180, 180, 180);
    this.doc.setLineWidth(0.4);
    this.doc.roundedRect(ML, this.y, this.cw, boxH, 2, 2, "S");

    let ty = this.y + pad + 4;
    for (const linha of linhas) {
      this.doc.text(linha, this.W / 2, ty, { align: "center" });
      ty += 5.5;
    }

    this.y += boxH + 5;
    return this;
  }

  // ── Assinatura alinhada à direita ─────────────────────────────────────────

  addAssinaturaDir(cidadeData: string, nome: string, cargo: string): this {
    this.checkPage(38);
    this.y += 10;

    const linW = this.cw * 0.42;
    const lineX = ML + this.cw - linW;
    const cx    = lineX + linW / 2;

    if (cidadeData?.trim()) {
      this.doc.setFont(this.fonteName, "normal");
      this.doc.setFontSize(10);
      this.doc.setTextColor(60, 60, 60);
      this.doc.text(cidadeData.trim(), this.W - MR, this.y, { align: "right" });
      this.y += 14;
    }

    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    this.doc.line(lineX, this.y, this.W - MR, this.y);
    this.y += 5;

    if (nome?.trim()) {
      this.doc.setFont(this.fonteName, "bold");
      this.doc.setFontSize(11);
      this.doc.setTextColor(20, 20, 20);
      this.doc.text(nome.trim(), cx, this.y, { align: "center" });
      this.y += 5;
    }

    if (cargo?.trim()) {
      this.doc.setFont(this.fonteName, "normal");
      this.doc.setFontSize(9);
      this.doc.setTextColor(80, 80, 80);
      this.doc.text(cargo.trim(), cx, this.y, { align: "center" });
      this.y += 6;
    }

    return this;
  }

  // ── Gerar bytes do PDF ──────────────────────────────────────────────────

  getBytes(): ArrayBuffer {
    return this.doc.output("arraybuffer");
  }

  // ── Salvar ────────────────────────────────────────────────────────────────

  private sanitizarNome(titulo: string): string {
    return titulo.replace(/[/\\:*?"<>|]/g, "").trim() || "Documento Paroquial";
  }

  async salvarArquivo(tituloArquivo: string): Promise<string | null> {
    const nomeArquivo = this.sanitizarNome(tituloArquivo);
    const caminho = await save({
      title: "Salvar documento",
      defaultPath: `${nomeArquivo}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!caminho) return null;
    await writeFile(caminho, new Uint8Array(this.getBytes()));
    return caminho;
  }

  async imprimirComDialogo(tituloArquivo: string): Promise<void> {
    const nomeArquivo = this.sanitizarNome(tituloArquivo) + ".pdf";
    const bytes = Array.from(new Uint8Array(this.getBytes()));
    await invoke<string>("imprimir_pdf", { pdfBytes: bytes, nomeArquivo });
  }

  /**
   * Exibe modal com 2 opções: Imprimir (diálogo do SO) e Salvar PDF.
   */
  async salvar(tituloArquivo: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)";

      const modal = document.createElement("div");
      modal.style.cssText = "background:white;border-radius:20px;padding:32px;min-width:340px;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.25);text-align:center;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif";

      modal.innerHTML = `
        <div style="font-size:15px;font-weight:700;color:#1f3b73;margin-bottom:6px">Documento Pronto</div>
        <div style="font-size:13px;color:#64748b;margin-bottom:24px">Escolha o que fazer com o documento</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button id="pdf-imprimir" style="padding:14px 20px;border-radius:14px;border:none;background:linear-gradient(135deg,#22c55e,#16a34a);font-size:14px;font-weight:700;cursor:pointer;color:white;box-shadow:0 6px 20px rgba(34,197,94,0.3);transition:all .15s ease">
            🖨  Imprimir
          </button>
          <button id="pdf-salvar" style="padding:14px 20px;border-radius:14px;border:1px solid #d0d5dd;background:rgba(255,255,255,0.9);font-size:14px;font-weight:600;cursor:pointer;color:#475467;transition:all .15s ease">
            💾  Salvar PDF
          </button>
        </div>
        <button id="pdf-cancelar" style="margin-top:16px;padding:8px 16px;border:none;background:transparent;font-size:12px;color:#94a3b8;cursor:pointer;font-weight:600">Cancelar</button>
      `;

      const fechar = () => { overlay.remove(); resolve(); };

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) fechar(); });

      modal.querySelector("#pdf-imprimir")!.addEventListener("click", async () => {
        fechar();
        await this.imprimirComDialogo(tituloArquivo);
      });

      modal.querySelector("#pdf-salvar")!.addEventListener("click", async () => {
        fechar();
        const caminho = await this.salvarArquivo(tituloArquivo);
        if (caminho) alert("✅ PDF salvo com sucesso!");
      });

      modal.querySelector("#pdf-cancelar")!.addEventListener("click", fechar);
    });
  }
}
