/**
 * AdminSlider
 * Componente de gerenciamento de slides/carousel do site
 * Permite fazer upload de imagens e editar textos dos slides
 */

import { useState, useCallback } from 'react';
import useApiData from '../hooks/useApiData';
import ClienteAPI from '../utils/api';
import ConfirmModal from './ConfirmModal';
import Botao from './ui/Botao';
import Carregando from './ui/Carregando';

// ========================================
// SUB-COMPONENTE: Formulário de Edição
// ========================================

/**
 * EditForm - Formulário para editar título e descrição de um slide
 */
function EditForm({ slide, onSave, onCancel, onOpenDeleteModal }) {
  const [titulo, setTitulo] = useState(slide.titulo || '');
  const [descricao, setDescricao] = useState(slide.descricao || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSave({
      fileName: slide.nome,
      titulo,
      descricao,
    });
  };

  const handleDeleteImageClick = () => {
    onOpenDeleteModal('image', slide.nome);
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border-t">
      <h3 className="font-semibold text-md mb-4">Editar Slide: {slide.nome}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            rows="3"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
        <div className="flex justify-between pt-3 border-t">
          <Botao 
            type="button" 
            variante="perigo"
            tamanho="sm"
            onClick={handleDeleteImageClick}
          >
            🗑️ Deletar Imagem
          </Botao>
          <div className="flex gap-2">
            <Botao 
              type="button" 
              variante="secundario"
              tamanho="sm"
              onClick={onCancel}
            >
              Cancelar
            </Botao>
            <Botao 
              type="submit"
              tamanho="sm"
            >
              Salvar
            </Botao>
          </div>
        </div>
      </form>
    </div>
  );
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export default function AdminSlider() {
  // ========================================
  // ESTADO LOCAL
  // ========================================
  const [arquivo, setArquivo] = useState(null);
  const [uploadando, setUploadando] = useState(false);
  const [editandoSlide, setEditandoSlide] = useState(null);
  const [modal, setModal] = useState({
    visivel: false,
    titulo: '',
    mensagem: '',
    onConfirmar: null,
    tipo: 'info',
    tipoDelecao: null, // 'slide' ou 'image'
    dados: null // nome do slide
  });

  // ========================================
  // FETCH DE DADOS
  // ========================================
  const { data: slides, loading, erro, refetch } = useApiData('/api/slider');

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  /**
   * Exibe mensagem de feedback
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
   * Abre modal de confirmação de deleção
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
   * Trata a seleção de arquivo
   */
  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setArquivo(selectedFile);
    }
  }, []);

  /**
   * Realiza upload da imagem do slider
   */
  const handleUpload = useCallback(async (e) => {
    e.preventDefault();
    if (!arquivo) {
      mostrarMensagem('Por favor, selecione um arquivo', 'erro');
      return;
    }

    setUploadando(true);

    try {
      const formData = new FormData();
      formData.append('sliderImage', arquivo);

      const response = await fetch('/api/upload-slider', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha no upload da imagem');
      }
      
      setArquivo(null);
      e.target.reset();
      await refetch();
      mostrarMensagem('Imagem enviada com sucesso!', 'sucesso');
    } catch (erro) {
      console.error('Erro no upload:', erro);
      mostrarMensagem(erro.message, 'erro');
    } finally {
      setUploadando(false);
    }
  }, [arquivo, refetch, mostrarMensagem]);

  /**
   * Salva textos do slide
   */
  const handleSaveText = useCallback(async (slideData) => {
    try {
      const response = await fetch('/api/slider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slideData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar os dados');
      }

      setEditandoSlide(null);
      await refetch();
      mostrarMensagem('Textos do slide salvos com sucesso!', 'sucesso');
    } catch (erro) {
      console.error('Erro ao salvar:', erro);
      mostrarMensagem(erro.message, 'erro');
    }
  }, [refetch, mostrarMensagem]);

  /**
   * Deleta um slide completo
   */
  const handleDeleteSlide = useCallback(async (slideName) => {
    try {
      const response = await fetch('/api/slider', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: slideName, deleteAll: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao deletar o slide');
      }

      await refetch();
      mostrarMensagem('Slide deletado com sucesso!', 'sucesso');
    } catch (erro) {
      console.error('Erro ao deletar:', erro);
      mostrarMensagem(erro.message, 'erro');
    }
  }, [refetch, mostrarMensagem]);

  /**
   * Deleta apenas a imagem, mantendo os textos
   */
  const handleDeleteImageOnly = useCallback(async (slideName) => {
    try {
      const response = await fetch('/api/slider', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: slideName, deleteAll: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao deletar a imagem');
      }

      setEditandoSlide(null);
      await refetch();
      mostrarMensagem('Imagem deletada com sucesso! Os textos foram mantidos.', 'sucesso');
    } catch (erro) {
      console.error('Erro ao deletar imagem:', erro);
      mostrarMensagem(erro.message, 'erro');
    }
  }, [refetch, mostrarMensagem]);

  /**
   * Abre modal para confirmar deleção
   */
  const openDeleteModal = useCallback((tipoDelecao, slideName) => {
    const titulo = tipoDelecao === 'image' ? 'Deletar Imagem' : 'Deletar Slide';
    const mensagem = tipoDelecao === 'image' 
      ? `Tem certeza que deseja deletar apenas a imagem "${slideName}"? Os textos serão mantidos.`
      : `Tem certeza que deseja deletar o slide "${slideName}" completamente? Esta ação não pode ser desfeita.`;
    
    pedirConfirmacao(
      titulo,
      mensagem,
      () => {
        if (tipoDelecao === 'image') {
          handleDeleteImageOnly(slideName);
        } else {
          handleDeleteSlide(slideName);
        }
      },
      'delete'
    );
  }, [pedirConfirmacao, handleDeleteImageOnly, handleDeleteSlide]);

  // ========================================
  // RENDER
  // ========================================

  if (loading) {
    return <Carregando />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-8">
      {/* SEÇÃO: Instruções */}
      <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
        <h2 className="font-bold text-lg text-blue-800 mb-2">📸 Instruções para Imagens do Slider</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          <li><strong>Dimensões recomendadas:</strong> 1600px × 900px (proporção 16:9)</li>
          <li><strong>Formato:</strong> JPG ou PNG</li>
          <li><strong>Tamanho máximo:</strong> 2 MB</li>
          <li><strong>Nomenclatura:</strong> Use nomes simples e descritivos (ex: capacitacao-servidores.jpg)</li>
        </ul>
      </div>

      {/* SEÇÃO: Upload de Imagem */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Enviar Nova Imagem</h2>
        <form onSubmit={handleUpload} className="flex items-end gap-4">
          <div className="flex-1">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/jpeg, image/png"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <Botao
            type="submit"
            disabled={uploadando || !arquivo}
          >
            {uploadando ? '⏳ Enviando...' : '📤 Enviar'}
          </Botao>
        </form>
      </div>

      {/* SEÇÃO: Galeria de Slides */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Gerenciar Slides</h2>
        {!slides || slides.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            <p className="text-lg mb-2">📭 Nenhum slide cadastrado</p>
            <p className="text-sm">Envie uma imagem para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {slides.map((slide, index) => (
              <div 
                key={slide.id} 
                className={`border rounded-lg p-3 shadow-sm ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                {/* Imagem do Slide */}
                <img 
                  src={slide.url} 
                  alt={slide.nome} 
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />

                {/* Informações do Slide */}
                <div className="mb-3">
                  <p className="font-bold text-sm truncate" title={slide.titulo}>
                    {slide.titulo || 'Sem título'}
                  </p>
                  <p className="text-xs text-gray-600 truncate" title={slide.descricao}>
                    {slide.descricao || 'Sem descrição'}
                  </p>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <button
                    onClick={() => setEditandoSlide(slide.id === editandoSlide ? null : slide.id)}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    {editandoSlide === slide.id ? '✖️ Fechar' : '✏️ Editar'}
                  </button>
                  <button
                    onClick={() => openDeleteModal('slide', slide.nome)}
                    className="text-red-600 hover:text-red-800 transition"
                    title="Deletar Slide"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Formulário de Edição (expandido) */}
                {editandoSlide === slide.id && (
                  <EditForm 
                    slide={slide} 
                    onSave={handleSaveText}
                    onCancel={() => setEditandoSlide(null)}
                    onOpenDeleteModal={openDeleteModal}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
