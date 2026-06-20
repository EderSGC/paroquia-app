/**
 * Função para imprimir documentos HTML com suporte a fontes dinâmicas.
 * @param title - Título da janela de impressão.
 * @param content - Conteúdo HTML do documento.
 * @param fontFamily - Nome da fonte escolhida (ex: 'Arial', 'Georgia', 'Minha Fonte Instalada').
 */
export function printDocumentHtml(title: string, content: string, fontFamily: string = "Arial") {
  const printWindow = window.open("", "_blank", "width=1100,height=900");

  if (!printWindow) {
    window.alert("Não foi possível abrir a janela de impressão. Verifique se o sistema bloqueou a abertura.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 12mm;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: white;
            color: #111827;
            /* Injeção da fonte escolhida pelo usuário */
            font-family: "${fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", serif;
          }

          body {
            padding: 24px;
          }

          img {
            max-width: 100%;
            object-fit: contain;
          }

          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
  printWindow.document.close();

  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 350);
}