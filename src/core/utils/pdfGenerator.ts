/**
 * Geração de PDF a partir do preview HTML via html2pdf.js (html2canvas + jsPDF).
 * Garante que o PDF seja idêntico ao preview exibido na tela.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

async function getHtml2Pdf(): Promise<Any> {
  // @ts-ignore
  const mod = await import("html2pdf.js");
  return mod.default ?? mod;
}

const PASTA_DOCUMENTOS = "Sistema Paroquial";

export async function garantirPastaDocumentos(): Promise<void> {
  try {
    const { documentDir, join } = await import("@tauri-apps/api/path");
    const { mkdir } = await import("@tauri-apps/plugin-fs");
    const base = await documentDir();
    await mkdir(await join(base, PASTA_DOCUMENTOS), { recursive: true });
  } catch { /* silencioso */ }
}

export function printWithTitle(titulo: string): void {
  const anterior = document.title;
  document.title = titulo;
  window.print();
  setTimeout(() => { document.title = anterior; }, 1000);
}

/**
 * Captura o elemento de preview HTML e gera PDF idêntico ao que aparece na tela.
 * Exibe modal com opções de Imprimir ou Salvar PDF.
 */
export async function gerarPDFDoPreview(
  elementId: string,
  titulo: string,
): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) {
    alert(`Elemento #${elementId} não encontrado.`);
    return;
  }

  // Overlay visível — html2canvas precisa de elemento visível e sem clip
  const overlay = document.createElement("div");
  overlay.style.cssText = [
    "position:fixed", "inset:0", "z-index:999999",
    "background:white", "overflow:auto",
    "display:flex", "flex-direction:column", "align-items:center",
    "padding:20px",
  ].join(";");

  const clone = el.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.display = "block";
  clone.style.visibility = "visible";
  clone.style.position = "static";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";

  const msg = document.createElement("div");
  msg.style.cssText = "font-family:sans-serif;font-size:16px;color:#1f3b73;font-weight:700;margin-bottom:12px;";
  msg.textContent = "⏳ Gerando PDF, aguarde...";

  overlay.appendChild(msg);
  overlay.appendChild(clone);
  document.body.appendChild(overlay);

  await new Promise(r => setTimeout(r, 300));

  try {
    const html2pdf = await getHtml2Pdf();
    const opts = {
      margin: [0, 0, 0, 0],
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      pagebreak: { mode: ["css", "legacy"] },
    };

    const blob: Blob = await html2pdf().set(opts).from(clone).output("blob");
    const bytes = new Uint8Array(await blob.arrayBuffer());

    overlay.remove();

    await mostrarModalSalvar(bytes, titulo);
  } catch (e) {
    console.error("[PDF]", e);
    overlay.remove();
    alert("Erro ao gerar o PDF. Tente novamente.");
  }
}

async function mostrarModalSalvar(bytes: Uint8Array, titulo: string): Promise<void> {
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
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const nomeArquivo = sanitizarNome(titulo) + ".pdf";
        await invoke<string>("imprimir_pdf", { pdfBytes: Array.from(bytes), nomeArquivo });
      } catch (e) {
        console.error("[Imprimir]", e);
        alert("Erro ao abrir o diálogo de impressão.");
      }
    });

    modal.querySelector("#pdf-salvar")!.addEventListener("click", async () => {
      fechar();
      try {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeFile } = await import("@tauri-apps/plugin-fs");
        const nomeArquivo = sanitizarNome(titulo);
        const caminho = await save({
          title: "Salvar documento",
          defaultPath: `${nomeArquivo}.pdf`,
          filters: [{ name: "PDF", extensions: ["pdf"] }],
        });
        if (caminho) {
          await writeFile(caminho, bytes);
          alert("✅ PDF salvo com sucesso!");
        }
      } catch (e) {
        console.error("[Salvar PDF]", e);
        alert("Erro ao salvar o PDF.");
      }
    });

    modal.querySelector("#pdf-cancelar")!.addEventListener("click", fechar);
  });
}

function sanitizarNome(titulo: string): string {
  return titulo.replace(/[/\\:*?"<>|]/g, "").trim() || "Documento Paroquial";
}

export function dataParaNomeArquivo(data?: string): string {
  const d = data ? new Date(data) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
