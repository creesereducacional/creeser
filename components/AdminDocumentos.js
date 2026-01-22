/**
 * @file components/AdminDocumentos.js
 * @description Módulo de administração de documentos de alunos - REFATORADO
 * @author CREESER Development
 * @date 2025-01-22
 * 
 * ✅ REFACTORED: Usa componentes reutilizáveis, hooks customizados, e padrões de engenharia
 * 
 * Funcionalidades:
 * - Listar documentos enviados por alunos
 * - Avaliar documentos (aprovar/reprovar/revisão)
 * - Filtrar por status e curso
 * - Marcar como visualizado
 * - Excluir documento
 */

import { useCallback, useEffect, useState } from 'react';
import { useApiData } from '@/hooks/useApiData';
import Botao from '@/components/ui/Botao';
import Cartao from '@/components/ui/Cartao';
import { Carregando } from '@/components/ui/Carregando';
import ConfirmModal from './ConfirmModal';
import ClienteAPI from '@/utils/api';

/**
 * Componente principal de administração de documentos
 * 
 * Responsabilidades:
 * - Gerenciar documentos enviados por alunos
 * - Avaliar e fornecer feedback
 * - Filtrar por status e curso
 * 
 * @returns {JSX.Element} Interface de administração de documentos
 */
export default function AdminDocumentos() {
  // ========================================
  // ESTADO LOCAL
  // ========================================

  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroCurso, setFiltroCurso] = useState('todos');
  const [documentoSelecionado, setDocumentoSelecionado] = useState(null);
  const [comentarioFeedback, setComentarioFeedback] = useState('');
  const [modal, setModal] = useState({
    visivel: false,
    titulo: '',
    mensagem: '',
    onConfirmar: null,
    tipo: 'info'
  });

  // ========================================
  // FETCH DE DADOS
  // ========================================

  const { data: documentos, loading, erro, refetch } = useApiData('/api/documentos');

  // Recarregar a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  const mostrarMensagem = useCallback((mensagem, tipo = 'info') => {
    setModal({
      visivel: true,
      titulo: tipo === 'sucesso' ? '✅ Sucesso!' : '❌ Erro',
      mensagem,
      onConfirmar: null,
      tipo: 'info'
    });
  }, []);

  const pedirConfirmacao = useCallback(
    (titulo, mensagem, onConfirmar, tipo = 'confirm') => {
      setModal({
        visivel: true,
        titulo,
        mensagem,
        onConfirmar,
        tipo
      });
    },
    []
  );

  const marcarComoVisualizado = useCallback(
    async (id) => {
      try {
        await ClienteAPI.put('/api/documentos', {
          id,
          visualizado: true
        });
        refetch();
      } catch (error) {
        mostrarMensagem('Erro ao marcar como visualizado', 'erro');
      }
    },
    [refetch, mostrarMensagem]
  );

  const atualizarStatus = useCallback(
    async (id, status) => {
      try {
        await ClienteAPI.put('/api/documentos', {
          id,
          status,
          comentario: comentarioFeedback
        });
        mostrarMensagem('Status do documento atualizado com sucesso!', 'sucesso');
        setDocumentoSelecionado(null);
        setComentarioFeedback('');
        refetch();
      } catch (error) {
        mostrarMensagem('Erro ao atualizar status do documento', 'erro');
      }
    },
    [comentarioFeedback, mostrarMensagem, refetch]
  );

  const excluirDocumento = useCallback(
    (documento) => {
      pedirConfirmacao(
        'Deletar Documento',
        `Deseja deletar "${documento.arquivoOriginal}"? Esta ação não pode ser desfeita.`,
        async () => {
          try {
            await ClienteAPI.delete(`/api/documentos?id=${documento.id}`);
            mostrarMensagem('Documento deletado com sucesso!', 'sucesso');
            refetch();
          } catch (erro) {
            mostrarMensagem('Erro ao deletar documento', 'erro');
          }
        },
        'delete'
      );
    },
    [pedirConfirmacao, mostrarMensagem, refetch]
  );

  const getStatusBadge = (status) => {
    const badges = {
      pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      aprovado: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprovado' },
      reprovado: { bg: 'bg-red-100', text: 'text-red-800', label: 'Reprovado' },
      revisao: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Em Revisão' }
    };
    const badge = badges[status] || badges.pendente;
    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-semibold`}>
        {badge.label}
      </span>
    );
  };

  // ========================================
  // CÁLCULOS
  // ========================================

  const documentosList = documentos || [];
  const cursosUnicos = [...new Set(documentosList.map(d => d.cursoNome))];
  const documentosNaoVisualizados = documentosList.filter(d => !d.visualizado).length;
  const documentosPendentes = documentosList.filter(d => d.status === 'pendente').length;
  const documentosAprovados = documentosList.filter(d => d.status === 'aprovado').length;
  const documentosReprovados = documentosList.filter(d => d.status === 'reprovado').length;

  const documentosFiltrados = documentosList.filter(doc => {
    const filtroStatusOk = filtroStatus === 'todos' || doc.status === filtroStatus;
    const filtroCursoOk = filtroCurso === 'todos' || doc.cursoNome === filtroCurso;
    return filtroStatusOk && filtroCursoOk;
  });

  // ========================================
  // RENDER
  // ========================================

  if (loading) {
    return <Carregando mensagem="Carregando documentos..." />;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">📤 Documentos dos Alunos</h1>
            <p className="text-purple-100">Gerencie e avalie os documentos enviados</p>
          </div>
          {documentosNaoVisualizados > 0 && (
            <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-xl animate-pulse">
              {documentosNaoVisualizados} novo{documentosNaoVisualizados > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <Cartao className="p-4 bg-red-50 border border-red-200">
          <p className="text-red-700">{erro.toString()}</p>
        </Cartao>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Cartao className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{documentosList.length}</div>
          <div className="text-gray-600 text-sm mt-2">Total de Documentos</div>
        </Cartao>
        <Cartao className="p-6 text-center">
          <div className="text-3xl font-bold text-yellow-600">{documentosPendentes}</div>
          <div className="text-gray-600 text-sm mt-2">Pendentes</div>
        </Cartao>
        <Cartao className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{documentosAprovados}</div>
          <div className="text-gray-600 text-sm mt-2">Aprovados</div>
        </Cartao>
        <Cartao className="p-6 text-center">
          <div className="text-3xl font-bold text-red-600">{documentosReprovados}</div>
          <div className="text-gray-600 text-sm mt-2">Reprovados</div>
        </Cartao>
      </div>

      {/* Filtros */}
      <Cartao className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Status
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="revisao">Em Revisão</option>
              <option value="aprovado">Aprovados</option>
              <option value="reprovado">Reprovados</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Curso
            </label>
            <select
              value={filtroCurso}
              onChange={(e) => setFiltroCurso(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="todos">Todos os Cursos</option>
              {cursosUnicos.map((curso, idx) => (
                <option key={idx} value={curso}>
                  {curso}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Cartao>

      {/* Lista de Documentos */}
      <Cartao className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold">
            📋 Documentos Enviados ({documentosFiltrados.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {documentosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Nenhum documento encontrado com os filtros selecionados
            </div>
          ) : (
            documentosFiltrados.map(doc => (
              <div
                key={doc.id}
                className={`p-6 hover:bg-gray-50 transition cursor-pointer ${
                  !doc.visualizado ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => !doc.visualizado && marcarComoVisualizado(doc.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="font-bold text-lg">{doc.alunoNome}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{doc.cursoNome}</span>
                          <span>•</span>
                          <span>{doc.aulaNome}</span>
                        </div>
                      </div>
                      {!doc.visualizado && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          NOVO
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(doc.status)}
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(doc.data).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {doc.descricao && (
                  <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-700">{doc.descricao}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 bg-purple-100 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-purple-800 mb-1">Arquivo:</p>
                    <p className="text-sm text-gray-700">{doc.arquivoOriginal}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(doc.tamanho / 1024 / 1024).toFixed(2)} MB • {doc.tipo}
                    </p>
                  </div>
                </div>

                {doc.comentario && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800 mb-1">Feedback:</p>
                    <p className="text-sm text-gray-700">{doc.comentario}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    📥 Download
                  </a>

                  <Botao
                    tamanho="pequeno"
                    variant="sucesso"
                    onClick={() => setDocumentoSelecionado(doc)}
                  >
                    ✓ Avaliar
                  </Botao>

                  <Botao
                    tamanho="pequeno"
                    variant="perigo"
                    onClick={() => excluirDocumento(doc)}
                  >
                    🗑️ Excluir
                  </Botao>
                </div>
              </div>
            ))
          )}
        </div>
      </Cartao>

      {/* Modal de Avaliação */}
      {documentoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Avaliar Documento</h3>

            <div className="mb-4 p-4 bg-gray-100 rounded-lg">
              <p className="font-semibold">{documentoSelecionado.alunoNome}</p>
              <p className="text-sm text-gray-600">{documentoSelecionado.arquivoOriginal}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback para o aluno
              </label>
              <textarea
                value={comentarioFeedback}
                onChange={(e) => setComentarioFeedback(e.target.value)}
                placeholder="Deixe um comentário sobre o documento..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                rows="4"
              />
            </div>

            <div className="flex gap-3 mb-3">
              <Botao
                className="flex-1"
                variant="sucesso"
                onClick={() => atualizarStatus(documentoSelecionado.id, 'aprovado')}
              >
                ✓ Aprovar
              </Botao>
              <Botao
                className="flex-1"
                variant="secundario"
                onClick={() => atualizarStatus(documentoSelecionado.id, 'revisao')}
              >
                🔄 Em Revisão
              </Botao>
              <Botao
                className="flex-1"
                variant="perigo"
                onClick={() => atualizarStatus(documentoSelecionado.id, 'reprovado')}
              >
                ✗ Reprovar
              </Botao>
            </div>

            <Botao
              className="w-full"
              variant="secundario"
              onClick={() => {
                setDocumentoSelecionado(null);
                setComentarioFeedback('');
              }}
            >
              Cancelar
            </Botao>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={modal.visivel}
        title={modal.titulo}
        message={modal.mensagem}
        type={modal.tipo}
        onConfirm={() => {
          if (modal.onConfirmar) {
            modal.onConfirmar();
          }
          setModal({
            visivel: false,
            titulo: '',
            mensagem: '',
            onConfirmar: null,
            tipo: 'info'
          });
        }}
        onClose={() =>
          setModal({
            visivel: false,
            titulo: '',
            mensagem: '',
            onConfirmar: null,
            tipo: 'info'
          })
        }
      />
    </div>
  );
}
