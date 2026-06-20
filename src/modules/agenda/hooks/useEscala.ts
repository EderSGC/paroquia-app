// src/modules/agenda/hooks/useEscala.ts

import { useCallback, useState } from "react";

export interface Escala {
  id: string;
  data: string;
  local: string;
  ministros: string;
  observacao: string;
}

const createEmptyEscala = (): Escala => ({
  id:
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  data: "",
  local: "",
  ministros: "",
  observacao: "",
});

export function useEscala() {
  const [escalas, setEscalas] = useState<Escala[]>([
    createEmptyEscala(),
  ]);

  const addLinha = useCallback(() => {
    setEscalas((prev) => [
      ...prev,
      createEmptyEscala(),
    ]);
  }, []);

  const updateEscala = useCallback(
    (
      id: string,
      field: keyof Escala,
      value: string
    ) => {
      setEscalas((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                [field]: value,
              }
            : item
        )
      );
    },
    []
  );

  const removerLinha = useCallback(
    (id: string) => {
      setEscalas((prev) =>
        prev.filter(
          (item) => item.id !== id
        )
      );
    },
    []
  );

  const limparEscalas = useCallback(() => {
    setEscalas([createEmptyEscala()]);
  }, []);

  return {
    escalas,
    addLinha,
    updateEscala,
    removerLinha,
    limparEscalas,
  };
}