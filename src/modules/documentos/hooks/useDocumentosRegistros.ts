import { useEffect, useState } from "react";
import { DocumentosRepository } from '../repository/documentos.repository';

export interface DocumentoRegistro {
  id: number;
  tipo: string;
  numero_protocolo: string;
  assunto: string;
  destinatario: string;
  signatario: string;
  data_emissao: string;
  json_dados: string;
  created_at: string;
}

export interface RegistrarPayload {
  numero_protocolo: string;
  assunto?: string;
  destinatario?: string;
  signatario?: string;
  data_emissao?: string;
  json_dados?: string;
}

export function useDocumentosRegistros(tipo: string) {
  const [registros, setRegistros] = useState<DocumentoRegistro[]>([]);
  const [loading, setLoading] = useState(false);
  const [proximoNumero, setProximoNumero] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const anoAtual = new Date().getFullYear();

  async function carregar() {
    setLoading(true);
    try {
      const result = await DocumentosRepository.registros.findByTipo(tipo);
      setRegistros(result as DocumentoRegistro[]);

      const count = await DocumentosRepository.registros.countByTipoAno(tipo, anoAtual);
      setProximoNumero(`${String(count + 1).padStart(3, "0")}/${anoAtual}`);
    } catch (e) {
      console.error("[documentos_registros]", e);
    } finally {
      setLoading(false);
    }
  }

  async function registrar(payload: RegistrarPayload) {
    try {
      await DocumentosRepository.registros.create({
        tipo,
        numero_protocolo: payload.numero_protocolo,
        assunto: payload.assunto ?? "",
        destinatario: payload.destinatario ?? "",
        signatario: payload.signatario ?? "",
        data_emissao: payload.data_emissao ?? new Date().toISOString().split("T")[0],
        json_dados: payload.json_dados ?? "",
      });
      await carregar();
    } catch (e) {
      console.error("[documentos_registros] registrar:", e);
    }
  }

  async function atualizar(id: number, payload: RegistrarPayload) {
    try {
      await DocumentosRepository.registros.update(id, {
        numero_protocolo: payload.numero_protocolo,
        assunto: payload.assunto ?? "",
        destinatario: payload.destinatario ?? "",
        signatario: payload.signatario ?? "",
        data_emissao: payload.data_emissao ?? new Date().toISOString().split("T")[0],
        json_dados: payload.json_dados ?? "",
      });
      await carregar();
    } catch (e) {
      console.error("[documentos_registros] atualizar:", e);
    }
  }

  async function salvar(payload: RegistrarPayload) {
    if (editandoId !== null) {
      await atualizar(editandoId, payload);
      setEditandoId(null);
    } else {
      await registrar(payload);
    }
  }

  function iniciarEdicao(id: number) { setEditandoId(id); }
  function cancelarEdicao() { setEditandoId(null); }

  async function excluir(id: number) {
    try {
      await DocumentosRepository.registros.hardDelete(id);
      await carregar();
    } catch (e) {
      console.error("[documentos_registros] excluir:", e);
    }
  }

  useEffect(() => { carregar(); }, [tipo]);

  return { registros, loading, proximoNumero, editandoId, registrar, atualizar, salvar, excluir, iniciarEdicao, cancelarEdicao, carregar };
}

