import type { CSSProperties } from "react";
import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";

import { AppLogo } from "../../../core/ui/AppLogo";
import type { Paroquia } from "../../../core/types/app.types";
import { createDataUrl } from "../../../core/utils/image";
import { finalizarSetup } from "../services/auth.service";

interface SetupScreenProps {
  onDone: () => void;
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: 14,
  fontFamily: "system-ui",
  outline: "none",
  boxSizing: "border-box",
  background: "#f9fafb",
  color: "#1a1d2e",
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#6b7280",
  marginBottom: 4,
  display: "block",
};

const paroquiaInicial: Paroquia = {
  nome: "",
  diocese: "",
  cidade: "",
  estado: "",
  endereco: "",
  cep: "",
  email: "",
  telefone: "",
  cnpj: "",
  logo_path: "",
  diocese_logo_path: "",
};

export function SetupScreen({ onDone }: SetupScreenProps) {
  const [passo, setPasso] = useState(1);
  const [form, setForm] = useState<Paroquia>(paroquiaInicial);
  const [login, setLogin] = useState({ nome: "", login: "", senha: "", confirmar: "" });
  const [erro, setErro] = useState("");
  const [logoPreview, setLogoPreview] = useState("");

  function campo<K extends keyof Paroquia>(key: K, valor: Paroquia[K]) {
    setForm((state) => ({ ...state, [key]: valor }));
  }

  async function selecionarLogo() {
    const path = await open({ filters: [{ name: "Imagem", extensions: ["png", "jpg", "jpeg"] }] });

    if (path && typeof path === "string") {
      const bytes = await readFile(path);
      const dataUrl = createDataUrl(path, new Uint8Array(bytes));

      campo("logo_path", dataUrl);
      setLogoPreview(dataUrl);
      setErro("");
    }
  }

  async function concluirConfiguracao() {
    // Validações rigorosas
    if (!login.nome || !login.nome.trim()) {
      setErro("Informe o nome completo do administrador.");
      return;
    }

    if (!login.login || !login.login.trim()) {
      setErro("Informe um login para o sistema.");
      return;
    }

    if (!login.senha || !login.senha.trim()) {
      setErro("Informe uma senha para a conta.");
      return;
    }

    if (login.senha !== login.confirmar) {
      setErro("As senhas não coincidem. Verifique com cuidado.");
      return;
    }

    if (login.senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setErro(""); // Limpar erros anteriores

    try {
      console.log("Iniciando setup do sistema...");
      
      await finalizarSetup({
        paroquia: form,
        administrador: {
          nome: login.nome.trim(),
          login: login.login.trim(),
          senha: login.senha.trim(),
        },
      });

      console.log("Setup finalizado com sucesso!");
      onDone();
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao configurar sistema:", mensagemErro);
      setErro(`Erro ao salvar: ${mensagemErro}. Tente novamente.`);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#f5f6fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 480,
          background: "white",
          borderRadius: 16,
          border: "0.5px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <div style={{ background: "#1e2340", padding: "28px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#3d4db3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
              }}
            >
              P
            </div>
            <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
              Configuração Inicial
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {["Paróquia", "Administrador"].map((label, index) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      passo > index + 1
                        ? "#22c55e"
                        : passo === index + 1
                          ? "#3d4db3"
                          : "#2e3566",
                    color: "white",
                  }}
                >
                  {passo > index + 1 ? "✓" : index + 1}
                </div>
                <span style={{ color: passo === index + 1 ? "white" : "#5a6494", fontSize: 12 }}>
                  {label}
                </span>
                {index === 0 && <span style={{ color: "#2e3566", margin: "0 4px" }}>›</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 32 }}>
          {passo === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Nome da Paróquia *</label>
                <input
                  style={inputStyle}
                  placeholder="Ex: Paróquia Nossa Senhora Aparecida"
                  value={form.nome}
                  onChange={(event) => campo("nome", event.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Diocese</label>
                <input
                  style={inputStyle}
                  placeholder="Ex: Diocese de Manaus"
                  value={form.diocese}
                  onChange={(event) => campo("diocese", event.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Cidade</label>
                  <input
                    style={inputStyle}
                    placeholder="Manaus"
                    value={form.cidade}
                    onChange={(event) => campo("cidade", event.target.value)}
                  />
                </div>
                <div style={{ width: 80 }}>
                  <label style={labelStyle}>Estado</label>
                  <input
                    style={inputStyle}
                    placeholder="AM"
                    value={form.estado}
                    onChange={(event) => campo("estado", event.target.value.toUpperCase())}
                    maxLength={2}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Logo da Paróquia</label>
                <div
                  onClick={selecionarLogo}
                  style={{
                    border: "2px dashed #e5e7eb",
                    borderRadius: 10,
                    padding: 20,
                    textAlign: "center",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    background: "#f9fafb",
                  }}
                >
                  {logoPreview ? (
                    <>
                      <AppLogo
                        logoPath={logoPreview}
                        alt="Logo da paróquia"
                        size={72}
                        radius={12}
                        fallbackText={form.nome?.[0] ?? "P"}
                        background="white"
                        padding={4}
                      />
                      <span style={{ fontSize: 12, color: "#4b5563" }}>
                        Logo selecionada com sucesso
                      </span>
                    </>
                  ) : (
                    <>
                      <AppLogo
                        alt="Identidade do sistema"
                        size={72}
                        radius={12}
                        fallbackText="P"
                        background="white"
                        padding={4}
                      />
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>
                        Clique para escolher a imagem da sua paróquia
                      </span>
                      <span style={{ fontSize: 11, color: "#d1d5db" }}>
                        PNG ou JPG. Se preferir, você pode continuar mesmo sem logo.
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  if (!form.nome) {
                    setErro("Informe o nome da paróquia.");
                    return;
                  }

                  setErro("");
                  setPasso(2);
                }}
                style={{
                  background: "#3d4db3",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "11px 0",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Continuar →
              </button>
              {erro && (
                <p style={{ color: "#dc2626", fontSize: 12, margin: 0, textAlign: "center" }}>
                  {erro}
                </p>
              )}
            </div>
          )}

          {passo === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                Crie a conta do administrador principal do sistema.
              </p>
              <div>
                <label style={labelStyle}>Nome completo *</label>
                <input
                  style={inputStyle}
                  placeholder="Ex: Padre João Silva"
                  value={login.nome}
                  onChange={(event) =>
                    setLogin((state) => ({ ...state, nome: event.target.value }))
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Login *</label>
                <input
                  style={inputStyle}
                  placeholder="padre.joao"
                  value={login.login}
                  onChange={(event) =>
                    setLogin((state) => ({ ...state, login: event.target.value }))
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Senha *</label>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••"
                  value={login.senha}
                  onChange={(event) =>
                    setLogin((state) => ({ ...state, senha: event.target.value }))
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Confirmar senha *</label>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••"
                  value={login.confirmar}
                  onChange={(event) =>
                    setLogin((state) => ({ ...state, confirmar: event.target.value }))
                  }
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setPasso(1)}
                  style={{
                    flex: 1,
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: 8,
                    padding: "11px 0",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ← Voltar
                </button>
                <button
                  onClick={concluirConfiguracao}
                  style={{
                    flex: 2,
                    background: "#3d4db3",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "11px 0",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Concluir configuração
                </button>
              </div>
              {erro && (
                <p style={{ color: "#dc2626", fontSize: 12, margin: 0, textAlign: "center" }}>
                  {erro}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
