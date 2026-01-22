/**
 * @file components/AdminProfessores.js
 * @description Módulo de administração de professores - REFATORADO
 * @author CREESER Development
 * @date 2025-01-22
 * 
 * ✅ REFACTORED: Usa componentes reutilizáveis, hooks customizados, e padrões de engenharia
 * 
 * Funcionalidades:
 * - Listar todos os professores
 * - Criar novo professor
 * - Editar professor existente
 * - Deletar professor
 * - Upload de foto de perfil
 * - Vincular professor a cursos
 */

import { useState, useCallback } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { useFormData } from '@/hooks/useFormData';
import Botao from '@/components/ui/Botao';
import Cartao from '@/components/ui/Cartao';
import { Carregando } from '@/components/ui/Carregando';
import ConfirmModal from './ConfirmModal';
import ClienteAPI from '@/utils/api';
import { validarRequerido, validarEmail } from '@/utils/validacoes';

/**
 * Componente principal de administração de professores
 * 
 * Responsabilidades:
 * - Gerenciar lista de professores
 * - Criar e editar dados do professor
 * - Fazer upload de foto de perfil
 * - Vincular professor a cursos
 * 
 * @returns {JSX.Element} Interface de administração de professores
 */
export default function AdminProfessores() {
  // ========================================
  // ESTADO LOCAL
  // ========================================

  const [professorSelecionado, setProfessorSelecionado] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [modal, setModal] = useState({
    visivel: false,
    titulo: '',
    mensagem: '',
    onConfirmar: null
  });

  // ========================================
  // FETCH DE DADOS
  // ========================================

  const { data: professores, loading, erro, refetch } = useApiData('/api/professores');
  const { data: cursos } = useApiData('/api/cursos');

  // ========================================
  // GERENCIAMENTO DE FORMULÁRIO
  // ========================================

  const { valores, erros, carregando, handleChange, handleSubmit, resetar } =
    useFormData(
      {
        nome: '',
        email: '',
        telefone: '',
        especialidade: '',
        biografia: '',
        foto: '',
        cursosResponsaveis: []
      },
      async (valores) => {
        try {
          if (!validarRequerido(valores.nome)) {
            throw new Error('Nome é obrigatório');
          }
          if (!validarEmail(valores.email)) {
            throw new Error('Email é inválido');
          }

          if (professorSelecionado?.id) {
            // Editar professor
            await ClienteAPI.put(`/api/professores/${professorSelecionado.id}`, valores);
            mostrarMensagem('Professor atualizado com sucesso!', 'sucesso');
          } else {
            // Criar professor
            await ClienteAPI.post('/api/professores', valores);
            mostrarMensagem('Professor criado com sucesso!', 'sucesso');
          }

          fecharFormulario();
          refetch();
        } catch (erro) {
          mostrarMensagem(erro.message || 'Erro ao salvar professor', 'erro');
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
    setProfessorSelecionado(null);
    resetar();
  }, [resetar]);

  const handleUploadFoto = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        mostrarMensagem('Por favor, selecione apenas imagens', 'erro');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        mostrarMensagem('A imagem deve ter no máximo 5MB', 'erro');
        return;
      }

      setUploadandoFoto(true);
      try {
        const formData = new FormData();
        formData.append('foto', file);

        const response = await ClienteAPI.post('/api/upload-foto', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        handleChange({
          target: { name: 'foto', value: response.data.url }
        });
        mostrarMensagem('Foto enviada com sucesso!', 'sucesso');
      } catch (erro) {
        mostrarMensagem('Erro ao fazer upload da foto', 'erro');
      } finally {
        setUploadandoFoto(false);
      }
    },
    [handleChange, mostrarMensagem]
  );

  const deletarProfessor = useCallback(
    (professor) => {
      pedirConfirmacao(
        'Deletar Professor',
        `Deseja deletar "${professor.nome}"? Esta ação não pode ser desfeita.`,
        async () => {
          try {
            await ClienteAPI.delete(`/api/professores/${professor.id}`);
            mostrarMensagem('Professor deletado com sucesso!', 'sucesso');
            refetch();
          } catch (erro) {
            mostrarMensagem('Erro ao deletar professor', 'erro');
          }
        }
      );
    },
    [pedirConfirmacao, mostrarMensagem, refetch]
  );

  const toggleCurso = useCallback(
    (cursoId) => {
      const cursosAtualizados = (valores.cursosResponsaveis || []).includes(cursoId)
        ? valores.cursosResponsaveis.filter(id => id !== cursoId)
        : [...(valores.cursosResponsaveis || []), cursoId];
      
      handleChange({
        target: { name: 'cursosResponsaveis', value: cursosAtualizados }
      });
    },
    [valores.cursosResponsaveis, handleChange]
  );

  const abrirFormulario = useCallback((professor = null) => {
    if (professor) {
      setProfessorSelecionado(professor);
      Object.keys(professor).forEach((chave) => {
        handleChange({
          target: { name: chave, value: professor[chave] || '' }
        });
      });
    }
    setMostrarFormulario(true);
  }, [handleChange]);

  // ========================================
  // RENDER - LISTA DE PROFESSORES
  // ========================================

  if (loading) {
    return <Carregando mensagem="Carregando professores..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Professores</h1>
        <Botao variant="primario" onClick={() => abrirFormulario()}>
          + Novo Professor
        </Botao>
      </div>

      {erro ? (
        <Cartao className="p-4 bg-red-50 border border-red-200">
          <p className="text-red-700">{erro.toString()}</p>
        </Cartao>
      ) : !professores || professores.length === 0 ? (
        <Cartao className="p-12 text-center">
          <p className="text-gray-500 text-lg">Nenhum professor cadastrado</p>
          <Botao variant="primario" className="mt-4" onClick={() => abrirFormulario()}>
            Cadastrar Primeiro Professor
          </Botao>
        </Cartao>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {professores.map((professor) => (
            <div
              key={professor.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200"
            >
              {/* Cabeçalho com Foto */}
              <div className="flex gap-4 p-6 border-b border-gray-200">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {professor.foto ? (
                    <img
                      src={professor.foto}
                      alt={professor.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      👤
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{professor.nome}</h3>
                  {professor.especialidade && (
                    <p className="text-sm text-blue-600 font-semibold">{professor.especialidade}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">📧 {professor.email}</p>
                  {professor.telefone && (
                    <p className="text-xs text-gray-600">📱 {professor.telefone}</p>
                  )}
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-6">
                {professor.biografia && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{professor.biografia}</p>
                )}

                {professor.cursosResponsaveis?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">📚 Cursos Responsáveis:</p>
                    <div className="flex flex-wrap gap-2">
                      {professor.cursosResponsaveis.map((cursoId) => {
                        const curso = cursos?.find(c => c.id === cursoId);
                        return curso ? (
                          <span key={cursoId} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {curso.titulo}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Botões */}
                <div className="flex gap-2 pt-4 border-t">
                  <Botao
                    className="flex-1"
                    tamanho="pequeno"
                    variant="secundario"
                    onClick={() => abrirFormulario(professor)}
                  >
                    ✏️ Editar
                  </Botao>
                  <Botao
                    className="flex-1"
                    tamanho="pequeno"
                    variant="perigo"
                    onClick={() => deletarProfessor(professor)}
                  >
                    🗑️ Excluir
                  </Botao>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold mb-6">
              {professorSelecionado ? '✏️ Editar Professor' : '➕ Novo Professor'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Foto do Professor */}
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-blue-600 flex items-center justify-center flex-shrink-0">
                  {valores.foto ? (
                    <img src={valores.foto} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl text-gray-400">👤</span>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition inline-block">
                    {uploadandoFoto ? '📤 Enviando...' : '📷 Escolher Foto'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadFoto}
                      disabled={uploadandoFoto}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG ou GIF (máx. 5MB)</p>
                </div>
              </div>

              {/* Campos do Formulário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={valores.nome}
                    onChange={handleChange}
                    required
                  />
                  {erros.nome && <p className="text-red-600 text-xs mt-1">{erros.nome}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={valores.email}
                    onChange={handleChange}
                    required
                  />
                  {erros.email && <p className="text-red-600 text-xs mt-1">{erros.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="tel"
                    name="telefone"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={valores.telefone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
                  <input
                    type="text"
                    name="especialidade"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={valores.especialidade}
                    onChange={handleChange}
                    placeholder="Ex: Educação Financeira, Psicologia..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Biografia</label>
                <textarea
                  name="biografia"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  value={valores.biografia}
                  onChange={handleChange}
                  placeholder="Breve descrição sobre o professor, formação acadêmica, experiência..."
                />
              </div>

              {cursos && cursos.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Cursos Responsáveis
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cursos.map((curso) => (
                      <label
                        key={curso.id}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                          (valores.cursosResponsaveis || []).includes(curso.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={(valores.cursosResponsaveis || []).includes(curso.id)}
                          onChange={() => toggleCurso(curso.id)}
                          className="mr-3 w-5 h-5"
                        />
                        <span className="font-medium">{curso.titulo}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 border-t pt-4">
                <Botao variant="primario" type="submit" carregando={carregando}>
                  {professorSelecionado ? '💾 Salvar Alterações' : '➕ Cadastrar Professor'}
                </Botao>
                <Botao variant="secundario" onClick={fecharFormulario}>
                  Cancelar
                </Botao>
              </div>
            </form>
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
