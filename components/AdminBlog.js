/**
 * AdminBlog
 * Componente de gerenciamento de notícias e posts do blog
 * Permite criar, editar, excluir e publicar notícias com editor de texto rico
 */

import { useState, useCallback } from 'react';
import useApiData from '../hooks/useApiData';
import ClienteAPI from '../utils/api';
import RichTextEditor from './RichTextEditor';
import ConfirmModal from './ConfirmModal';
import Botao from './ui/Botao';
import Carregando from './ui/Carregando';

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export default function AdminBlog() {
  // ========================================
  // ESTADO LOCAL
  // ========================================
  const [mostrarForm, setMostrarForm] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [uploadingImagem, setUploadingImagem] = useState(false);
  const [formData, setFormData] = useState({});
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
  const { data: noticias, loading, erro, refetch } = useApiData('/api/noticias');

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  /**
   * Exibe mensagem de feedback para o usuário
   */
  const mostrarMensagem = useCallback((mensagem, tipo = 'info') => {
    setModal({
      visivel: true,
      titulo: tipo === 'sucesso' ? 'Sucesso' : tipo === 'erro' ? 'Erro' : 'Informação',
      mensagem,
      tipo,
      onConfirmar: () => setModal({ ...modal, visivel: false })
    });
  }, [modal]);

  /**
   * Abre modal de confirmação
   */
  const pedirConfirmacao = useCallback((titulo, mensagem, onConfirmar, tipo = 'warning') => {
    setModal({
      visivel: true,
      titulo,
      mensagem,
      tipo,
      onConfirmar
    });
  }, []);

  /**
   * Formata data ISO para formato brasileiro
   */
  const formatarData = useCallback((dataISO) => {
    return new Date(dataISO).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  /**
   * Abre formulário para criar ou editar notícia
   */
  const abrirFormulario = useCallback((noticia = null) => {
    if (noticia) {
      setFormData(noticia);
      setModoEdicao(true);
    } else {
      setFormData({});
      setModoEdicao(false);
    }
    setMostrarForm(true);
  }, []);

  /**
   * Salva notícia (criar ou atualizar)
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const url = '/api/noticias';
      const method = modoEdicao ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await refetch();
        setMostrarForm(false);
        setFormData({});
        setModoEdicao(false);
        mostrarMensagem(
          modoEdicao ? 'Notícia atualizada com sucesso!' : 'Notícia criada com sucesso!',
          'sucesso'
        );
      }
    } catch (erro) {
      console.error('Erro ao salvar notícia:', erro);
      mostrarMensagem('Erro ao salvar notícia', 'erro');
    }
  }, [formData, modoEdicao, refetch, mostrarMensagem]);

  /**
   * Deleta uma notícia com confirmação
   */
  const handleDelete = useCallback((id, titulo) => {
    pedirConfirmacao(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir a notícia "${titulo}"? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          await ClienteAPI.delete(`/api/noticias?id=${id}`);
          await refetch();
          mostrarMensagem('Notícia excluída com sucesso!', 'sucesso');
        } catch (erro) {
          console.error('Erro ao excluir notícia:', erro);
          mostrarMensagem('Erro ao excluir notícia', 'erro');
        }
      },
      'delete'
    );
  }, [refetch, pedirConfirmacao, mostrarMensagem]);

  /**
   * Faz upload da imagem de destaque
   */
  const handleUploadImagem = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarMensagem('Por favor, selecione apenas arquivos de imagem', 'erro');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      mostrarMensagem('A imagem deve ter no máximo 2MB', 'erro');
      return;
    }

    setUploadingImagem(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload-thumbnail', {
        method: 'POST',
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, imagem: data.url }));
        mostrarMensagem('Imagem enviada com sucesso!', 'sucesso');
      } else {
        throw new Error('Erro ao fazer upload');
      }
    } catch (erro) {
      console.error('Erro ao fazer upload:', erro);
      mostrarMensagem('Erro ao fazer upload da imagem', 'erro');
    } finally {
      setUploadingImagem(false);
    }
  }, [mostrarMensagem]);

  // ========================================
  // RENDER
  // ========================================

  if (loading) {
    return <Carregando />;
  }

  return (
    <div>
      {/* SEÇÃO: Cabeçalho e Ações */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gerenciar Blog / Notícias</h2>
        <Botao onClick={() => abrirFormulario()}>
          + Nova Notícia
        </Botao>
      </div>

      {/* SEÇÃO: Tabela de Notícias */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {noticias && noticias.length > 0 ? (
              noticias.map((noticia, index) => (
                <tr key={noticia.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {noticia.imagem && (
                        <img src={noticia.imagem} alt="" className="h-10 w-16 object-cover rounded mr-3" />
                      )}
                      <div className="text-sm font-medium text-gray-900">{noticia.titulo}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{noticia.categoria}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{noticia.autor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatarData(noticia.dataPublicacao)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      noticia.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {noticia.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Botao 
                      tamanho="sm" 
                      variante="secundario"
                      onClick={() => abrirFormulario(noticia)}
                    >
                      ✏️ Editar
                    </Botao>
                    <Botao 
                      tamanho="sm" 
                      variante="perigo"
                      onClick={() => handleDelete(noticia.id, noticia.titulo)}
                    >
                      🗑️ Excluir
                    </Botao>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-500">
                  Nenhuma notícia cadastrada. Clique em "Nova Notícia" para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SEÇÃO: Modal do Formulário */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{modoEdicao ? 'Editar Notícia' : 'Nova Notícia'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Título *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded"
                  value={formData.titulo || ''}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Resumo (para cards) *</label>
                <textarea
                  required
                  rows="2"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Texto curto que aparece no card da home"
                  value={formData.resumo || ''}
                  onChange={(e) => setFormData({...formData, resumo: e.target.value})}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Conteúdo completo *</label>
                <RichTextEditor
                  value={formData.conteudo || ''}
                  onChange={(content) => setFormData({...formData, conteudo: content})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Categoria</label>
                  <select
                    className="w-full px-3 py-2 border rounded"
                    value={formData.categoria || 'Geral'}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  >
                    <option value="Geral">Geral</option>
                    <option value="Eventos">Eventos</option>
                    <option value="Cursos">Cursos</option>
                    <option value="Institucional">Institucional</option>
                    <option value="Parcerias">Parcerias</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Autor</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    value={formData.autor || 'IGEPPS'}
                    onChange={(e) => setFormData({...formData, autor: e.target.value})}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Imagem de destaque</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImagem}
                  disabled={uploadingImagem}
                  className="w-full px-3 py-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {uploadingImagem ? 'Enviando imagem...' : 'Opcional: imagem que aparece no card e na página (máx. 2MB)'}
                </p>
                {formData.imagem && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border">
                    <p className="text-xs text-gray-600 mb-1">Preview:</p>
                    <img src={formData.imagem} alt="Preview" className="h-32 w-auto object-contain" />
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, imagem: ''})}
                      className="mt-2 text-xs text-red-600 hover:underline"
                    >
                      Remover imagem
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.ativo !== false}
                    onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                  />
                  <span className="text-sm">Notícia ativa (visível no site)</span>
                </label>
              </div>

              <div className="flex gap-2">
                <Botao type="submit">
                  {modoEdicao ? 'Atualizar' : 'Publicar'}
                </Botao>
                <Botao 
                  type="button" 
                  variante="secundario"
                  onClick={() => {
                    setMostrarForm(false);
                    setModoEdicao(false);
                    setFormData({});
                  }} 
                >
                  Cancelar
                </Botao>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEÇÃO: Modal de Confirmação */}
      <ConfirmModal
        visivel={modal.visivel}
        onFechar={() => setModal({ ...modal, visivel: false })}
        onConfirmar={modal.onConfirmar}
        titulo={modal.titulo}
        mensagem={modal.mensagem}
        tipo={modal.tipo}
      />
    </div>
  );
}
