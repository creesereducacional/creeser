/**
 * AdminEmails
 * Componente de gerenciamento e envio de e-mails em massa para alunos
 * Permite enviar e-mails com personalizações e acompanhar histórico
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
export default function AdminEmails() {
  // ========================================
  // ESTADO LOCAL
  // ========================================
  const [visualizacao, setVisualizacao] = useState('enviar'); // enviar, historico
  const [enviando, setEnviando] = useState(false);
  const [modal, setModal] = useState({
    visivel: false,
    titulo: '',
    mensagem: '',
    onConfirmar: null,
    tipo: 'info'
  });
  
  const [formData, setFormData] = useState({
    tipoDestinatarios: 'todos',
    destinatariosSelecionados: [],
    assunto: '',
    mensagem: ''
  });

  // ========================================
  // FETCH DE DADOS
  // ========================================
  const { data: alunos, loading: loadingAlunos } = useApiData('/api/alunos');
  const { data: historico, loading: loadingHistorico, refetch: refetchHistorico } = useApiData('/api/enviar-email');

  const carregando = loadingAlunos || loadingHistorico;
  const alunosAtivos = alunos?.filter(a => a.status === 'aprovado') || [];

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
   * Calcula quantidade de destinatários selecionados
   */
  const getQuantidadeDestinatarios = useCallback(() => {
    switch (formData.tipoDestinatarios) {
      case 'todos':
        return alunosAtivos.filter(a => a.ativo).length;
      case 'ativos':
        return alunosAtivos.filter(a => a.ativo === true).length;
      case 'inativos':
        return alunosAtivos.filter(a => a.ativo === false).length;
      case 'selecionados':
        return formData.destinatariosSelecionados.length;
      default:
        return 0;
    }
  }, [formData.tipoDestinatarios, formData.destinatariosSelecionados, alunosAtivos]);

  /**
   * Alterna seleção de um aluno individual
   */
  const handleSelecionarAluno = useCallback((email) => {
    const selecionados = [...formData.destinatariosSelecionados];
    const index = selecionados.indexOf(email);
    
    if (index > -1) {
      selecionados.splice(index, 1);
    } else {
      selecionados.push(email);
    }
    
    setFormData({ ...formData, destinatariosSelecionados: selecionados });
  }, [formData]);

  /**
   * Seleciona todos os alunos ativos
   */
  const handleSelecionarTodos = useCallback(() => {
    const todosEmails = alunosAtivos.filter(a => a.ativo).map(a => a.email);
    setFormData({ ...formData, destinatariosSelecionados: todosEmails });
  }, [alunosAtivos, formData]);

  /**
   * Desseleciona todos os alunos
   */
  const handleDesmarcarTodos = useCallback(() => {
    setFormData({ ...formData, destinatariosSelecionados: [] });
  }, [formData]);

  /**
   * Envia e-mail em massa com confirmação
   */
  const handleEnviarEmail = useCallback(async (e) => {
    e.preventDefault();
    
    if (!formData.assunto || !formData.mensagem) {
      mostrarMensagem('Por favor, preencha o assunto e a mensagem', 'erro');
      return;
    }

    if (getQuantidadeDestinatarios() === 0) {
      mostrarMensagem('Selecione pelo menos um destinatário', 'erro');
      return;
    }

    pedirConfirmacao(
      'Confirmar Envio',
      `Confirma o envio de e-mail para ${getQuantidadeDestinatarios()} aluno(s)?`,
      async () => {
        setEnviando(true);

        try {
          const response = await fetch('/api/enviar-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              remetente: JSON.parse(localStorage.getItem('usuario'))?.nomeCompleto || 'Admin'
            })
          });

          const result = await response.json();

          if (result.success) {
            setFormData({
              tipoDestinatarios: 'todos',
              destinatariosSelecionados: [],
              assunto: '',
              mensagem: ''
            });
            await refetchHistorico();
            setVisualizacao('historico');
            
            mostrarMensagem(
              `E-mails enviados com sucesso!\n\nTotal: ${result.resultados.total}\nEnviados: ${result.resultados.sucesso}\nFalhas: ${result.resultados.falhas}`,
              'sucesso'
            );
          } else {
            mostrarMensagem('Erro ao enviar e-mails: ' + (result.error || 'Erro desconhecido'), 'erro');
          }
        } catch (erro) {
          console.error('Erro:', erro);
          mostrarMensagem('Erro ao enviar e-mails', 'erro');
        } finally {
          setEnviando(false);
        }
      },
      'confirm'
    );
  }, [formData, getQuantidadeDestinatarios, pedirConfirmacao, mostrarMensagem, refetchHistorico, setVisualizacao]);

  /**
   * Limpa o formulário
   */
  const limparFormulario = useCallback(() => {
    setFormData({
      tipoDestinatarios: 'todos',
      destinatariosSelecionados: [],
      assunto: '',
      mensagem: ''
    });
  }, []);

  // ========================================
  // RENDER - Verifica qual visualização mostrar
  // ========================================

  if (carregando) {
    return <Carregando />;
  }

  return (
    <>
      {visualizacao === 'enviar' && (
        <div>
          {/* SEÇÃO: Cabeçalho e Navegação */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Enviar E-mails</h2>
            <Botao variante="secundario" onClick={() => setVisualizacao('historico')}>
              Ver Histórico
            </Botao>
          </div>

          {/* SEÇÃO: Formulário */}
          <form onSubmit={handleEnviarEmail} className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* Tipo de Destinatários */}
            <div>
              <label className="block text-sm font-medium mb-3">Enviar para:</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipoDestinatarios"
                    value="todos"
                    checked={formData.tipoDestinatarios === 'todos'}
                    onChange={(e) => setFormData({ ...formData, tipoDestinatarios: e.target.value })}
                    className="mr-2"
                  />
                  <span>Todos os alunos ativos ({alunosAtivos.filter(a => a.ativo).length} alunos)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipoDestinatarios"
                    value="ativos"
                    checked={formData.tipoDestinatarios === 'ativos'}
                    onChange={(e) => setFormData({ ...formData, tipoDestinatarios: e.target.value })}
                    className="mr-2"
                  />
                  <span>Apenas alunos ativos ({alunosAtivos.filter(a => a.ativo === true).length} alunos)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipoDestinatarios"
                    value="inativos"
                    checked={formData.tipoDestinatarios === 'inativos'}
                    onChange={(e) => setFormData({ ...formData, tipoDestinatarios: e.target.value })}
                    className="mr-2"
                  />
                  <span>Apenas alunos inativos ({alunosAtivos.filter(a => a.ativo === false).length} alunos)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipoDestinatarios"
                    value="selecionados"
                    checked={formData.tipoDestinatarios === 'selecionados'}
                    onChange={(e) => setFormData({ ...formData, tipoDestinatarios: e.target.value })}
                    className="mr-2"
                  />
                  <span>Selecionar alunos específicos</span>
                </label>
              </div>
            </div>

            {/* Seleção de Alunos Específicos */}
            {formData.tipoDestinatarios === 'selecionados' && (
              <div className="p-4 bg-gray-50 rounded border space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Selecione os alunos ({formData.destinatariosSelecionados.length} selecionados)</h3>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={handleSelecionarTodos}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Selecionar Todos
                    </button>
                    <button
                      type="button"
                      onClick={handleDesmarcarTodos}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {alunosAtivos.filter(a => a.ativo).map(aluno => (
                    <label key={aluno.id} className="flex items-center p-2 hover:bg-gray-100 rounded">
                      <input
                        type="checkbox"
                        checked={formData.destinatariosSelecionados.includes(aluno.email)}
                        onChange={() => handleSelecionarAluno(aluno.email)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <span className="font-medium">{aluno.nomeCompleto}</span>
                        <span className="text-sm text-gray-500 ml-2">({aluno.email})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Assunto */}
            <div>
              <label className="block text-sm font-medium mb-2">Assunto *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded"
                value={formData.assunto}
                onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                placeholder="Ex: Nova turma disponível, Promoção especial, etc."
              />
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-medium mb-2">Mensagem *</label>
              <RichTextEditor
                value={formData.mensagem}
                onChange={(content) => setFormData({ ...formData, mensagem: content })}
                placeholder="Digite sua mensagem aqui..."
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Dica: A mensagem será personalizada com o nome de cada aluno automaticamente.
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-medium text-blue-900 mb-2">📧 Preview do E-mail:</h3>
              <div className="text-sm space-y-1">
                <p><strong>Para:</strong> {getQuantidadeDestinatarios()} aluno(s)</p>
                <p><strong>Assunto:</strong> {formData.assunto || '(sem assunto)'}</p>
                <p className="mt-2"><strong>Mensagem:</strong></p>
                <div className="bg-white p-3 rounded mt-1 whitespace-pre-wrap text-xs">
                  {formData.mensagem || '(sem mensagem)'}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4 border-t">
              <Botao
                type="submit"
                disabled={enviando || getQuantidadeDestinatarios() === 0}
              >
                {enviando ? 'Enviando...' : `Enviar para ${getQuantidadeDestinatarios()} aluno(s)`}
              </Botao>
              <Botao
                type="button"
                variante="secundario"
                onClick={limparFormulario}
              >
                Limpar
              </Botao>
            </div>
          </form>

          {/* Modal de Confirmação */}
          <ConfirmModal
            visivel={modal.visivel}
            onFechar={() => setModal({ ...modal, visivel: false })}
            onConfirmar={modal.onConfirmar}
            titulo={modal.titulo}
            mensagem={modal.mensagem}
            tipo={modal.tipo}
          />
        </div>
      )}

      {visualizacao === 'historico' && (
        <div>
          {/* SEÇÃO: Cabeçalho e Navegação */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Histórico de E-mails Enviados</h2>
            <Botao onClick={() => setVisualizacao('enviar')}>
              + Novo E-mail
            </Botao>
          </div>

          {/* SEÇÃO: Lista de E-mails */}
          {!historico || historico.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
              <p className="text-lg mb-2">📭 Nenhum e-mail enviado ainda</p>
              <p className="text-sm">Clique em "Novo E-mail" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historico.map((email, index) => (
                <div key={email.id} className={`rounded-lg shadow p-6 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-blue-900">{email.assunto}</h3>
                      <p className="text-sm text-gray-500">
                        Enviado em: {new Date(email.dataEnvio).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Por: {email.remetente}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex gap-2">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-semibold">
                          ✓ {email.enviados} enviados
                        </span>
                        {email.falhas > 0 && (
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm font-semibold">
                            ✗ {email.falhas} falhas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3 text-sm space-y-1">
                    <p className="text-gray-600">
                      <strong>Tipo:</strong> {
                        email.tipoDestinatarios === 'todos' ? 'Todos os alunos ativos' :
                        email.tipoDestinatarios === 'ativos' ? 'Alunos ativos' :
                        email.tipoDestinatarios === 'inativos' ? 'Alunos inativos' :
                        'Alunos selecionados'
                      }
                    </p>
                    <p className="text-gray-600">
                      <strong>Total de destinatários:</strong> {email.totalDestinatarios}
                    </p>
                    <details className="mt-3 cursor-pointer">
                      <summary className="text-blue-600 hover:underline">
                        Ver mensagem completa
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-wrap text-xs">
                        {email.mensagem}
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal de Confirmação */}
          <ConfirmModal
            visivel={modal.visivel}
            onFechar={() => setModal({ ...modal, visivel: false })}
            onConfirmar={modal.onConfirmar}
            titulo={modal.titulo}
            mensagem={modal.mensagem}
            tipo={modal.tipo}
          />
        </div>
      )}
    </>
  );
}
