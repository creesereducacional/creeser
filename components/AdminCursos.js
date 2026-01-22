/**
 * @file components/AdminCursos.js
 * @description Módulo de administração de cursos - REFATORADO
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * ✅ REFACTORED: Usa componentes reutilizáveis, hooks customizados, e padrões de engenharia
 * 
 * Estrutura hierárquica:
 * - Cursos (lista, criar, editar, deletar)
 * - Módulos (dentro de um curso)
 * - Aulas (dentro de um módulo)
 * - Questões (dentro de uma aula)
 * - Materiais de Apoio (dentro de uma aula)
 */

import { useState, useCallback } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { useFormData } from '@/hooks/useFormData';
import Tabela from '@/components/ui/Tabela';
import Formulario, { CampoFormulario } from '@/components/ui/Formulario';
import Botao from '@/components/ui/Botao';
import Cartao from '@/components/ui/Cartao';
import { Carregando, SkeletonTabela } from '@/components/ui/Carregando';
import ConfirmModal from './ConfirmModal';
import RichTextEditor from './RichTextEditor';
import ClienteAPI from '@/utils/api';
import {
  validarRequerido,
  validarComprimento,
} from '@/utils/validacoes';

/**
 * Componente principal de administração de cursos
 * 
 * Responsabilidades:
 * - Listar todos os cursos
 * - Criar novo curso
 * - Editar curso existente
 * - Deletar curso
 * - Gerenciar módulos, aulas, questões e materiais
 * 
 * @returns {JSX.Element} Interface de administração de cursos
 */
export default function AdminCursos() {
  // ========================================
  // ESTADO LOCAL
  // ========================================

  const [visualizacao, setVisualizacao] = useState('lista'); // lista, curso, modulo, aula
  const [cursoSelecionado, setCursoSelecionado] = useState(null);
  const [moduloSelecionado, setModuloSelecionado] = useState(null);
  const [aulaSelecionada, setAulaSelecionada] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipoForm, setTipoForm] = useState(''); // curso, modulo, aula, questao, material
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [modal, setModal] = useState({
    visivel: false,
    titulo: '',
    mensagem: '',
    onConfirmar: null,
  });

  // ========================================
  // FETCH DE DADOS
  // ========================================

  const { data: cursos, loading, erro, refetch } = useApiData('/api/cursos');

  // ========================================
  // GERENCIAMENTO DE FORMULÁRIOS
  // ========================================

  const { valores, erros, carregando, handleChange, handleSubmit, resetar } =
    useFormData(
      {
        titulo: '',
        descricao: '',
        categoria: '',
        cargaHoraria: '',
        videoApresentacao: '',
        thumbnail: '',
      },
      async (valores) => {
        try {
          if (!validarRequerido(valores.titulo)) {
            throw new Error('Título é obrigatório');
          }

          const dadosEnvio = {
            ...valores,
            cargaHoraria: parseInt(valores.cargaHoraria),
          };

          if (cursoSelecionado?.id && visualizacao !== 'lista') {
            // Editar curso
            await ClienteAPI.put(`/api/cursos/${cursoSelecionado.id}`, dadosEnvio);
            mostrarMensagem('Curso atualizado com sucesso!', 'sucesso');
          } else {
            // Criar curso
            await ClienteAPI.post('/api/cursos', dadosEnvio);
            mostrarMensagem('Curso criado com sucesso!', 'sucesso');
          }

          fecharFormulario();
          refetch();
        } catch (erro) {
          mostrarMensagem(erro.message || 'Erro ao salvar curso', 'erro');
        }
      }
    );

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  const mostrarMensagem = useCallback((mensagem, tipo = 'info') => {
    setModal({
      visivel: true,
      titulo: tipo === 'sucesso' ? '✅ Sucesso!' : '❌ Erro',
      mensagem,
      onConfirmar: null,
    });
  }, []);

  const pedirConfirmacao = useCallback(
    (titulo, mensagem, onConfirmar) => {
      setModal({
        visivel: true,
        titulo,
        mensagem,
        onConfirmar,
      });
    },
    []
  );

  const fecharFormulario = useCallback(() => {
    setMostrarFormulario(false);
    setTipoForm('');
    resetar();
  }, [resetar]);

  const abrirFormularioCurso = useCallback((curso = null) => {
    if (curso) {
      Object.keys(curso).forEach((chave) => {
        handleChange({
          target: { name: chave, value: curso[chave] || '' },
        });
      });
    }
    setTipoForm('curso');
    setMostrarFormulario(true);
  }, [handleChange]);

  const deletarCurso = useCallback(
    (curso) => {
      pedirConfirmacao(
        'Deletar Curso',
        `Deseja deletar "${curso.titulo}"? Esta ação não pode ser desfeita.`,
        async () => {
          try {
            await ClienteAPI.delete(`/api/cursos/${curso.id}`);
            mostrarMensagem('Curso deletado com sucesso!', 'sucesso');
            refetch();
          } catch (erro) {
            mostrarMensagem('Erro ao deletar curso', 'erro');
          }
        }
      );
    },
    [pedirConfirmacao, mostrarMensagem, refetch]
  );

  const alterarStatusCurso = useCallback(
    (curso) => {
      const novoStatus = !curso.ativo;
      pedirConfirmacao(
        novoStatus ? 'Ativar Curso' : 'Inativar Curso',
        `Deseja ${novoStatus ? 'ativar' : 'inativar'} "${curso.titulo}"?`,
        async () => {
          try {
            await ClienteAPI.put(`/api/cursos/${curso.id}`, {
              ...curso,
              ativo: novoStatus,
            });
            mostrarMensagem(`Curso ${novoStatus ? 'ativado' : 'inativado'} com sucesso!`, 'sucesso');
            refetch();
          } catch (erro) {
            mostrarMensagem('Erro ao alterar status', 'erro');
          }
        }
      );
    },
    [pedirConfirmacao, mostrarMensagem, refetch]
  );

  const adicionarModulo = useCallback(
    async (nomeModulo) => {
      try {
        const novoModulo = {
          titulo: nomeModulo,
          descricao: '',
          aulas: [],
          id: Date.now().toString(),
        };

        const dadosAtualizados = {
          ...cursoSelecionado,
          modulos: [...(cursoSelecionado.modulos || []), novoModulo],
        };

        await ClienteAPI.put(`/api/cursos/${cursoSelecionado.id}`, dadosAtualizados);
        setCursoSelecionado(dadosAtualizados);
        mostrarMensagem('Módulo adicionado com sucesso!', 'sucesso');
        refetch();
      } catch (erro) {
        mostrarMensagem('Erro ao adicionar módulo', 'erro');
      }
    },
    [cursoSelecionado, mostrarMensagem, refetch]
  );

  const deletarModulo = useCallback(
    (moduloId) => {
      pedirConfirmacao(
        'Deletar Módulo',
        'Tem certeza que deseja deletar este módulo?',
        async () => {
          try {
            const dadosAtualizados = {
              ...cursoSelecionado,
              modulos: cursoSelecionado.modulos.filter(m => m.id !== moduloId),
            };

            await ClienteAPI.put(`/api/cursos/${cursoSelecionado.id}`, dadosAtualizados);
            setCursoSelecionado(dadosAtualizados);
            mostrarMensagem('Módulo deletado com sucesso!', 'sucesso');
            refetch();
          } catch (erro) {
            mostrarMensagem('Erro ao deletar módulo', 'erro');
          }
        }
      );
    },
    [cursoSelecionado, pedirConfirmacao, mostrarMensagem, refetch]
  );

  // ========================================
  // RENDER - LISTA DE CURSOS
  // ========================================

  if (visualizacao === 'lista') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Gerenciar Cursos</h1>
          <Botao variant="primario" onClick={() => abrirFormularioCurso()}>
            + Novo Curso
          </Botao>
        </div>

        {loading ? (
          <SkeletonTabela linhas={5} colunas={4} />
        ) : erro ? (
          <Cartao className="p-4 bg-red-50 border border-red-200">
            <p className="text-red-700">{erro.toString()}</p>
          </Cartao>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos?.map((curso) => (
              <div
                key={curso.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200"
              >
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900">
                  {curso.thumbnail ? (
                    <img
                      src={curso.thumbnail}
                      alt={curso.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      📚
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        curso.ativo
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {curso.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-2 text-gray-900 line-clamp-2">
                    {curso.titulo}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {curso.descricao
                      ?.replace(/<[^>]*>/g, '')
                      .replace(/&nbsp;/g, ' ')
                      .trim() || 'Sem descrição'}
                  </p>

                  <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                    <div>📂 {curso.categoria}</div>
                    <div>⏱️ {curso.cargaHoraria}h</div>
                    <div>📖 {curso.modulos?.length || 0} módulos</div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2 flex-wrap">
                    <Botao
                      tamanho="pequeno"
                      variant="secundario"
                      onClick={() => abrirFormularioCurso(curso)}
                    >
                      Editar
                    </Botao>
                    <Botao
                      tamanho="pequeno"
                      variant="primario"
                      onClick={() => {
                        setCursoSelecionado(curso);
                        setVisualizacao('curso');
                      }}
                      className="flex-1"
                    >
                      Gerenciar
                    </Botao>
                    <Botao
                      tamanho="pequeno"
                      variant={curso.ativo ? 'perigo' : 'sucesso'}
                      onClick={() => alterarStatusCurso(curso)}
                    >
                      {curso.ativo ? 'Inativar' : 'Ativar'}
                    </Botao>
                    <Botao
                      tamanho="pequeno"
                      variant="perigo"
                      onClick={() => deletarCurso(curso)}
                    >
                      Excluir
                    </Botao>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {mostrarFormulario && tipoForm === 'curso' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
              <h2 className="text-2xl font-bold mb-6">
                {cursoSelecionado ? 'Editar Curso' : 'Novo Curso'}
              </h2>

              <Formulario
                valores={valores}
                erros={erros}
                onSubmit={handleSubmit}
                carregandoSubmit={carregando}
              >
                <CampoFormulario
                  nome="titulo"
                  label="Título *"
                  tipo="text"
                  valor={valores.titulo}
                  erro={erros.titulo}
                  onChange={handleChange}
                  requerido
                />

                <CampoFormulario
                  nome="descricao"
                  label="Descrição *"
                  tipo="textarea"
                  valor={valores.descricao}
                  erro={erros.descricao}
                  onChange={handleChange}
                />

                <CampoFormulario
                  nome="categoria"
                  label="Categoria *"
                  tipo="text"
                  valor={valores.categoria}
                  erro={erros.categoria}
                  onChange={handleChange}
                  requerido
                />

                <CampoFormulario
                  nome="cargaHoraria"
                  label="Carga Horária (horas) *"
                  tipo="number"
                  valor={valores.cargaHoraria}
                  erro={erros.cargaHoraria}
                  onChange={handleChange}
                  requerido
                />

                <CampoFormulario
                  nome="videoApresentacao"
                  label="URL Vídeo Apresentação (YouTube)"
                  tipo="url"
                  valor={valores.videoApresentacao}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                />

                <div className="flex gap-4 mt-6 border-t pt-4">
                  <Botao variant="primario" type="submit" carregando={carregando}>
                    {cursoSelecionado ? 'Atualizar' : 'Criar'} Curso
                  </Botao>
                  <Botao variant="secundario" onClick={fecharFormulario}>
                    Cancelar
                  </Botao>
                </div>
              </Formulario>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={modal.visivel}
          title={modal.titulo}
          message={modal.mensagem}
          onConfirm={() => {
            if (modal.onConfirmar) {
              modal.onConfirmar();
            }
            setModal({ visivel: false, titulo: '', mensagem: '', onConfirmar: null });
          }}
          onClose={() =>
            setModal({ visivel: false, titulo: '', mensagem: '', onConfirmar: null })
          }
        />
      </div>
    );
  }

  const renderFormCurso = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">{modoEdicao ? 'Editar Curso' : 'Novo Curso'}</h3>
        <form onSubmit={handleSubmitCurso}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Título</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded"
              value={formData.titulo || ''}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <RichTextEditor
              value={formData.descricao || ''}
              onChange={(content) => setFormData({...formData, descricao: content})}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Categoria</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded"
              value={formData.categoria || ''}
              onChange={(e) => setFormData({...formData, categoria: e.target.value})}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Carga Horária (horas)</label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border rounded"
              value={formData.cargaHoraria || ''}
              onChange={(e) => setFormData({...formData, cargaHoraria: e.target.value})}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Vídeo de Apresentação do Curso (YouTube)</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
              className="w-full px-3 py-2 border rounded"
              value={formData.videoApresentacao || ''}
              onChange={(e) => setFormData({...formData, videoApresentacao: e.target.value})}
            />
            <p className="text-xs text-gray-500 mt-1">Deixe em branco para usar o vídeo da primeira aula</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Imagem Thumbnail (100px altura)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadThumbnail}
              disabled={uploadingThumbnail}
              className="w-full px-3 py-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              {uploadingThumbnail ? 'Enviando imagem...' : 'Selecione uma imagem (máx. 2MB, recomendado: 100px de altura)'}
            </p>
            {formData.thumbnail && (
              <div className="mt-2 p-2 bg-gray-50 rounded border">
                <p className="text-xs text-gray-600 mb-1">Preview:</p>
                <img src={formData.thumbnail} alt="Preview" className="h-[100px] w-auto object-contain" />
                <button
                  type="button"
                  onClick={() => setFormData({...formData, thumbnail: ''})}
                  className="mt-2 text-xs text-red-600 hover:underline"
                >
                  Remover imagem
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {modoEdicao ? 'Atualizar' : 'Salvar'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setMostrarForm(false);
                setModoEdicao(false);
                setFormData({});
              }} 
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderFormModulo = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h3 className="text-xl font-bold mb-4">Novo Módulo</h3>
        <form onSubmit={handleSubmitModulo}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Título</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded"
              value={formData.titulo || ''}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <textarea
              required
              rows="3"
              className="w-full px-3 py-2 border rounded"
              value={formData.descricao || ''}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Salvar
            </button>
            <button type="button" onClick={() => setMostrarForm(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderFormAula = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">{modoEdicao ? 'Editar Aula' : 'Nova Aula'}</h3>
        <form onSubmit={handleSubmitAula}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Título</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded"
              value={formData.titulo || ''}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <textarea
              required
              rows="3"
              className="w-full px-3 py-2 border rounded"
              value={formData.descricao || ''}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">URL do Vídeo (YouTube)</label>
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border rounded"
              value={formData.videoUrl || ''}
              onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Duração (minutos)</label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border rounded"
              value={formData.duracao || ''}
              onChange={(e) => setFormData({...formData, duracao: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Salvar
            </button>
            <button type="button" onClick={() => {
              setMostrarForm(false);
              setModoEdicao(false);
              setFormData({});
            }} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderFormQuestao = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Nova Questão</h3>
        <form onSubmit={handleSubmitQuestao}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Pergunta</label>
            <textarea
              required
              rows="3"
              className="w-full px-3 py-2 border rounded"
              value={formData.pergunta || ''}
              onChange={(e) => setFormData({...formData, pergunta: e.target.value})}
            />
          </div>
          {[1, 2, 3, 4].map(num => (
            <div key={num} className="mb-3">
              <label className="block text-sm font-medium mb-2">Alternativa {num}</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded"
                value={formData[`alternativa${num}`] || ''}
                onChange={(e) => setFormData({...formData, [`alternativa${num}`]: e.target.value})}
              />
            </div>
          ))}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Resposta Correta</label>
            <select
              required
              className="w-full px-3 py-2 border rounded"
              value={formData.respostaCorreta || ''}
              onChange={(e) => setFormData({...formData, respostaCorreta: e.target.value})}
            >
              <option value="">Selecione...</option>
              <option value="0">Alternativa 1</option>
              <option value="1">Alternativa 2</option>
              <option value="2">Alternativa 3</option>
              <option value="3">Alternativa 4</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Explicação (opcional)</label>
            <textarea
              rows="2"
  // ========================================
  // RENDER - VISUALIZAÇÃO DO CURSO E MÓDULOS
  // ========================================

  if (visualizacao === 'curso' && cursoSelecionado) {
    return (
      <div className="space-y-6">
        <Botao
          variant="secundario"
          onClick={() => {
            setVisualizacao('lista');
            setCursoSelecionado(null);
          }}
        >
          ← Voltar para Cursos
        </Botao>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-3xl font-bold mb-4">{cursoSelecionado.titulo}</h2>
          <p className="text-gray-600 mb-4">{cursoSelecionado.descricao}</p>
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <div>📂 Categoria: {cursoSelecionado.categoria}</div>
            <div>⏱️ Carga Horária: {cursoSelecionado.cargaHoraria}h</div>
            <div>📖 Módulos: {cursoSelecionado.modulos?.length || 0}</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">Módulos</h3>
          <Botao
            variant="primario"
            onClick={async () => {
              const nome = prompt('Digite o nome do novo módulo:');
              if (nome) {
                await adicionarModulo(nome);
              }
            }}
          >
            + Novo Módulo
          </Botao>
        </div>

        {cursoSelecionado.modulos?.length === 0 ? (
          <Cartao className="p-6 text-center text-gray-500">
            <p>Nenhum módulo cadastrado</p>
          </Cartao>
        ) : (
          <div className="space-y-4">
            {cursoSelecionado.modulos.map((modulo, idx) => (
              <div
                key={modulo.id}
                className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold mb-2">Módulo {idx + 1}: {modulo.titulo}</h4>
                    <p className="text-gray-600 text-sm mb-2">{modulo.descricao}</p>
                    <p className="text-xs text-gray-500">📖 {modulo.aulas?.length || 0} aulas</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Botao
                      tamanho="pequeno"
                      variant="primario"
                      onClick={() => {
                        setCursoSelecionado({
                          ...cursoSelecionado,
                          moduloAberto: modulo.id
                        });
                        setVisualizacao('modulo');
                      }}
                    >
                      Aulas
                    </Botao>
                    <Botao
                      tamanho="pequeno"
                      variant="perigo"
                      onClick={() => deletarModulo(modulo.id)}
                    >
                      Excluir
                    </Botao>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmModal
          isOpen={modal.visivel}
          title={modal.titulo}
          message={modal.mensagem}
          onConfirm={() => {
            if (modal.onConfirmar) {
              modal.onConfirmar();
            }
            setModal({ visivel: false, titulo: '', mensagem: '', onConfirmar: null });
          }}
          onClose={() =>
            setModal({ visivel: false, titulo: '', mensagem: '', onConfirmar: null })
          }
        />
      </div>
    );
  }

  // Renderizar lista se nenhuma visualização for selecionada
  return (
    <div className="text-center py-12 text-gray-500">
      <p>Carregando...</p>
    </div>
  );
}
