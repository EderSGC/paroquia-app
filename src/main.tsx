import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

async function bootstrap() {
  const rootElement =
    document.getElementById("root");

  if (!rootElement) {
    throw new Error(
      "Elemento #root não encontrado."
    );
  }

  const root =
    createRoot(rootElement);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  console.log(
    "✅ Sistema Paroquial iniciado."
  );
}

bootstrap().catch((error) => {
  console.error(
    "❌ Erro ao iniciar aplicação:",
    error
  );

  document.body.innerHTML = `
    <div style="
      height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      flex-direction:column;
      font-family:system-ui;
      text-align:center;
      padding:24px;
    ">
      <h1>Erro ao iniciar o sistema</h1>
      <p>${String(error)}</p>
    </div>
  `;
});