/**
 * AdminAvaliacoes
 * Componente de gerenciamento e análise de avaliações dos cursos
 * Exibe estatísticas, filtros e relatório detalhado de avaliações
 */

import { useState, useCallback } from 'react';
import useApiData from '../hooks/useApiData';
import ClienteAPI from '../utils/api';
import Carregando from './ui/Carregando';
import Cartao from './ui/Cartao';

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export default function AdminAvaliacoes() {
  // ========================================
  // ESTADO LOCAL
  // ========================================
  const [filtroEstrelas, setFiltroEstrelas] = useState('todas');
  const [filtroCurso, setFiltroCurso] = useState('todos');

  // ========================================
  // FETCH DE DADOS
  // ========================================
  const { data: avaliacoes, loading: loadingAvaliacoes } = useApiData('/api/avaliacoes');
  const { data: cursos, loading: loadingCursos } = useApiData('/api/cursos');

  const carregando = loadingAvaliacoes || loadingCursos;

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  /**
   * Busca o nome do curso a partir do ID
   */
  const getNomeCurso = useCallback((cursoId) => {
    const curso = cursos?.find(c => c.id === cursoId);
    return curso?.titulo || 'Curso não encontrado';
  }, [cursos]);

  /**
   * Busca o nome da aula dentro de um curso
   */
  const getNomeAula = useCallback((cursoId, aulaId) => {
    const curso = cursos?.find(c => c.id === cursoId);
    if (!curso) return 'Aula não encontrada';
    
    for (const modulo of curso.modulos || []) {
      const aula = modulo.aulas?.find(a => a.id === aulaId);
      if (aula) return aula.titulo;
    }
    return 'Aula não encontrada';
  }, [cursos]);

  /**
   * Calcula a média de avaliações de um curso
   */
  const calcularMediaCurso = useCallback((cursoId) => {
    if (!avaliacoes) return 0;
    const avaliacoesCurso = avaliacoes.filter(a => a.cursoId === cursoId);
    if (avaliacoesCurso.length === 0) return 0;
    const soma = avaliacoesCurso.reduce((acc, a) => acc + a.estrelas, 0);
    return (soma / avaliacoesCurso.length).toFixed(1);
  }, [avaliacoes]);

  /**
   * Filtra avaliações com base nos critérios selecionados
   */
  const avaliacoesFiltradas = avaliacoes?.filter(avaliacao => {
    const filtroEstrelasOk = filtroEstrelas === 'todas' || avaliacao.estrelas === parseInt(filtroEstrelas);
    const filtroCursoOk = filtroCurso === 'todos' || avaliacao.cursoId === filtroCurso;
    return filtroEstrelasOk && filtroCursoOk;
  }) || [];

  /**
   * Renderiza as estrelas de avaliação
   */
  const renderEstrelas = (quantidade) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span 
          key={i} 
          className={`text-2xl ${i <= quantidade ? 'text-yellow-400' : 'text-gray-400'}`}
        >
          ★
        </span>
      ))}
    </div>
  );

  /**
   * Calcula estatísticas gerais das avaliações
   */
  const calcularEstatisticas = useCallback(() => {
    if (!avaliacoes || avaliacoes.length === 0) {
      return {
        total: 0,
        media: 0,
        cincoEstrelas: 0,
        avaliacoesBaixas: 0
      };
    }
    
    const media = (avaliacoes.reduce((acc, a) => acc + a.estrelas, 0) / avaliacoes.length).toFixed(1);
    const cincoEstrelas = avaliacoes.filter(a => a.estrelas === 5).length;
    const avaliacoesBaixas = avaliacoes.filter(a => a.estrelas <= 2).length;

    return {
      total: avaliacoes.length,
      media,
      cincoEstrelas,
      avaliacoesBaixas
    };
  }, [avaliacoes]);

  // ========================================
  // RENDER
  // ========================================

  if (carregando) {
    return <Carregando />;
  }

  const { total, media, cincoEstrelas, avaliacoesBaixas } = calcularEstatisticas();

  return (
    <div className="space-y-6">
      {/* SEÇÃO: Cabeçalho */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-2">⭐ Avaliações dos Cursos</h2>
        <p className="text-yellow-100">Acompanhe o feedback dos alunos sobre as aulas</p>
      </div>

      {/* SEÇÃO: Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Cartao titulo="Total de Avaliações" valor={total} cor="text-yellow-600" />
        <Cartao titulo="Média Geral" valor={media} cor="text-green-600" />
        <Cartao titulo="Avaliações 5 Estrelas" valor={cincoEstrelas} cor="text-blue-600" />
        <Cartao titulo="Avaliações Baixas" valor={avaliacoesBaixas} cor="text-red-600" />
      </div>

      {/* SEÇÃO: Filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Curso
            </label>
            <select
              value={filtroCurso}
              onChange={(e) => setFiltroCurso(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="todos">Todos os Cursos</option>
              {cursos?.map(curso => (
                <option key={curso.id} value={curso.id}>
                  {curso.titulo} ({avaliacoes?.filter(a => a.cursoId === curso.id).length || 0} avaliações)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Estrelas
            </label>
            <select
              value={filtroEstrelas}
              onChange={(e) => setFiltroEstrelas(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="todas">Todas as Avaliações</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 estrelas)</option>
              <option value="4">⭐⭐⭐⭐ (4 estrelas)</option>
              <option value="3">⭐⭐⭐ (3 estrelas)</option>
              <option value="2">⭐⭐ (2 estrelas)</option>
              <option value="1">⭐ (1 estrela)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SEÇÃO: Média por Curso */}
      {cursos && cursos.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">📊 Média por Curso</h3>
          <div className="space-y-3">
            {cursos.map(curso => {
              const mediaLocal = calcularMediaCurso(curso.id);
              const quantidade = avaliacoes?.filter(a => a.cursoId === curso.id).length || 0;
              return (
                <div key={curso.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold">{curso.titulo}</p>
                    <p className="text-sm text-gray-600">{quantidade} avaliações</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-yellow-600">{mediaLocal}</span>
                    {renderEstrelas(Math.round(parseFloat(mediaLocal)))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEÇÃO: Lista de Avaliações */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold">
            📝 Avaliações Recentes ({avaliacoesFiltradas.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {avaliacoesFiltradas.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Nenhuma avaliação encontrada com os filtros selecionados
            </div>
          ) : (
            avaliacoesFiltradas.map(avaliacao => (
              <div key={avaliacao.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg text-gray-800">
                        {avaliacao.alunoNome}
                      </span>
                      {renderEstrelas(avaliacao.estrelas)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Curso:</strong> {getNomeCurso(avaliacao.cursoId)}</p>
                      <p><strong>Aula:</strong> {getNomeAula(avaliacao.cursoId, avaliacao.aulaId)}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {new Date(avaliacao.data).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                {avaliacao.comentario && (
                  <div className="mt-3 p-4 bg-gray-100 rounded-lg">
                    <p className="text-gray-700 italic">"{avaliacao.comentario}"</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
