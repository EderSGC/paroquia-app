// src/modules/patrimonio/hooks/usePatrimonio.ts
import { useState, useEffect, useCallback } from 'react';
import { PatrimonioRepository } from '../repository/patrimonio.repository';
import { PastoralRepository } from '../../pastoral/repository/pastoral.repository';
import { PatrimonioBem, PatrimonioManutencao } from '@core/types/entities';

interface ComunidadeOpcao { id: number; nome: string; }

interface UsePatrimonioOptions {
  comunidadeFixa?: number | null;
}

const FORM_VAZIO = {
  nome: '', categoria: '', localizacao: '', comunidadeId: '',
  dataAquisicao: new Date().toISOString().split('T')[0],
  valorEstimado: '', estadoConservacao: 'Bom', fotoPath: '', documentoPath: '', observacoes: '',
};

export const usePatrimonio = (options: UsePatrimonioOptions = {}) => {
  const { comunidadeFixa } = options;

  const [bens, setBens] = useState<PatrimonioBem[]>([]);
  const [manutencoes, setManutencoes] = useState<PatrimonioManutencao[]>([]);
  const [comunidades, setComunidades] = useState<ComunidadeOpcao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [nome, setNome] = useState(FORM_VAZIO.nome);
  const [categoria, setCategoria] = useState(FORM_VAZIO.categoria);
  const [localizacao, setLocalizacao] = useState(FORM_VAZIO.localizacao);
  const [comunidadeId, setComunidadeId] = useState(FORM_VAZIO.comunidadeId);
  const [dataAquisicao, setDataAquisicao] = useState(FORM_VAZIO.dataAquisicao);
  const [valorEstimado, setValorEstimado] = useState(FORM_VAZIO.valorEstimado);
  const [estadoConservacao, setEstadoConservacao] = useState(FORM_VAZIO.estadoConservacao);
  const [fotoPath, setFotoPath] = useState(FORM_VAZIO.fotoPath);
  const [documentoPath, setDocumentoPath] = useState(FORM_VAZIO.documentoPath);
  const [observacoes, setObservacoes] = useState(FORM_VAZIO.observacoes);
  const [buscaTermo, setBuscaTermo] = useState('');

  const [filtroComunidade, setFiltroComunidadeInternal] = useState(
    comunidadeFixa != null ? String(comunidadeFixa) : 'TODOS'
  );

  function setFiltroComunidade(v: string) {
    if (comunidadeFixa != null) return;
    setFiltroComunidadeInternal(v);
  }

  const limparFormulario = () => {
    setEditandoId(null);
    setNome(''); setCategoria(''); setLocalizacao('');
    setComunidadeId(comunidadeFixa != null ? String(comunidadeFixa) : '');
    setDataAquisicao(new Date().toISOString().split('T')[0]);
    setValorEstimado(''); setEstadoConservacao('Bom'); setFotoPath(''); setDocumentoPath(''); setObservacoes('');
  };

  const carregarDadosPatrimonio = useCallback(async () => {
    try {
      setCarregando(true);
      const [listaBens, listaManutencoes, listaComunidades] = await Promise.all([
        PatrimonioRepository.bens.findAllOrdenados(),
        PatrimonioRepository.manutencoes.findAllOrdenadas(),
        PastoralRepository.comunidades.findNomes(),
      ]);
      setBens(listaBens);
      setManutencoes(listaManutencoes);
      setComunidades(listaComunidades);
    } catch (error) { console.error("Erro ao carregar patrimônio:", error); }
    finally { setCarregando(false); }
  }, []);

  const carregarParaEdicao = (bem: PatrimonioBem) => {
    setEditandoId(bem.id ?? null);
    setNome(bem.nome);
    setCategoria(bem.categoria);
    setLocalizacao(bem.localizacao ?? '');
    setComunidadeId(bem.comunidade_id ? String(bem.comunidade_id) : '');
    setDataAquisicao(bem.data_aquisicao ?? new Date().toISOString().split('T')[0]);
    setValorEstimado(bem.valor_estimado ? String(bem.valor_estimado) : '');
    setEstadoConservacao(bem.estado_conservacao ?? 'Bom');
    setFotoPath(bem.foto_path ?? '');
    setDocumentoPath(bem.documento_path ?? '');
    setObservacoes(bem.observacoes ?? '');
  };

  const registrarBem = async () => {
    if (!nome || !categoria) return alert("Preencha o Nome e a Categoria.");
    const valorNumerico = valorEstimado ? parseFloat(valorEstimado.replace(',', '.')) : 0;
    const idFinal = comunidadeFixa != null ? comunidadeFixa : (comunidadeId ? parseInt(comunidadeId) : null);
    try {
      if (editandoId) {
        await PatrimonioRepository.bens.update(editandoId, {
          nome, categoria, localizacao, comunidade_id: idFinal,
          data_aquisicao: dataAquisicao, valor_estimado: valorNumerico,
          estado_conservacao: estadoConservacao, foto_path: fotoPath,
          documento_path: documentoPath, observacoes,
        });
      } else {
        await PatrimonioRepository.bens.create({
          nome, categoria, localizacao, comunidade_id: idFinal,
          data_aquisicao: dataAquisicao, valor_estimado: valorNumerico,
          estado_conservacao: estadoConservacao, foto_path: fotoPath,
          documento_path: documentoPath, observacoes,
        });
      }
      limparFormulario();
      await carregarDadosPatrimonio();
    } catch (error) { console.error("Erro ao salvar bem:", error); throw error; }
  };

  const apagarBem = async (id: number) => {
    try {
      await PatrimonioRepository.bens.softDelete(id);
      await carregarDadosPatrimonio();
    } catch (err) {
      console.error("Erro ao excluir bem:", err);
      throw err;
    }
  };

  const registrarManutencao = async (bemId: number, descricaoManutencao: string, dataManutencao: string, prestador: string, custo: string, obs: string) => {
    if (!descricaoManutencao || !dataManutencao) throw new Error("Descrição e Data são obrigatórias.");
    const custoNumerico = custo ? parseFloat(custo.replace(',', '.')) : 0;
    await PatrimonioRepository.manutencoes.registrar(bemId, dataManutencao, descricaoManutencao, prestador, custoNumerico, obs);
    await carregarDadosPatrimonio();
  };

  useEffect(() => { carregarDadosPatrimonio(); }, [carregarDadosPatrimonio]);

  const bensFiltrados = bens.filter(bem => {
    const correspondeBusca = bem.nome.toLowerCase().includes(buscaTermo.toLowerCase()) ||
                             bem.categoria.toLowerCase().includes(buscaTermo.toLowerCase());
    const correspondeComunidade = filtroComunidade === 'TODOS' ||
                                  (filtroComunidade === 'MATRIZ' && bem.comunidade_id == null) ||
                                  String(bem.comunidade_id) === filtroComunidade;
    return correspondeBusca && correspondeComunidade;
  });

  return {
    bensFiltrados, manutencoes, comunidades, carregando,
    buscaTermo, setBuscaTermo, filtroComunidade, setFiltroComunidade,
    registrarBem, apagarBem, registrarManutencao, carregarParaEdicao, limparFormulario,
    recarregar: carregarDadosPatrimonio, editandoId,
    nome, setNome, categoria, setCategoria, localizacao, setLocalizacao,
    comunidadeId, setComunidadeId, dataAquisicao, setDataAquisicao,
    valorEstimado, setValorEstimado, estadoConservacao, setEstadoConservacao,
    fotoPath, setFotoPath, documentoPath, setDocumentoPath, observacoes, setObservacoes,
  };
};
