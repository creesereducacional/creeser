/**
 * @file components/AdminFuncionarios.js
 * @description Módulo de administração de funcionários - REFATORADO
 * @author CREESER Development
 * @date 2025-01-22
 * 
 * ✅ REFACTORED: Usa componentes reutilizáveis, hooks customizados, e padrões de engenharia
 * 
 * Funcionalidades:
 * - Listar todos os funcionários
 * - Filtrar por nome e status
 * - Deletar funcionário
 * - Inativar funcionário
 * - Editar funcionário
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useApiData } from '@/hooks/useApiData';
import Tabela from '@/components/ui/Tabela';
import Botao from '@/components/ui/Botao';
import Cartao from '@/components/ui/Cartao';
import { Carregando } from '@/components/ui/Carregando';
import ConfirmModal from './ConfirmModal';
import ClienteAPI from '@/utils/api';

/**
 * Componente principal de administração de funcionários
 * 
 * Responsabilidades:
 * - Listar e filtrar funcionários
 * - Deletar funcionário
 * - Inativar funcionário
 * 
 * @returns {JSX.Element} Interface de administração de funcionários
 */
export default function AdminFuncionarios() {
  // ========================================
  // ESTADO LOCAL
  // ========================================

  const [filtro, setFiltro] = useState({ nome: '', status: 'ATIVO' });
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [modal, setModal] = useState({
    visivel: false,
    titulo: '',
    mensagem: '',
    onConfirmar: null,
    tipo: 'delete'
  });

  // ========================================
  // FETCH DE DADOS
  // ========================================

  const { data: funcionarios, loading, erro, refetch } = useApiData('/api/funcionarios');

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
    (titulo, mensagem, onConfirmar, tipo = 'delete') => {
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

  const funcionariosFiltrados = useCallback(() => {
    if (!funcionarios) return [];
    
    return funcionarios.filter(f => {
      const nomeMatch = f.nome.toLowerCase().includes(filtro.nome.toLowerCase());
      const statusMatch = filtro.status === 'TODOS' || f.status === filtro.status;
      return nomeMatch && statusMatch;
    });
  }, [funcionarios, filtro]);

  const handleFiltro = useCallback((e) => {
    const { name, value } = e.target;
    setFiltro(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleLimpar = useCallback(() => {
    setFiltro({ nome: '', status: 'ATIVO' });
  }, []);

  const deletarFuncionario = useCallback(
    (funcionario) => {
      pedirConfirmacao(
        'Deletar Funcionário',
        `Deseja deletar "${funcionario.nome}"? Esta ação não pode ser desfeita.`,
        async () => {
          try {
            await ClienteAPI.delete(`/api/funcionarios/${funcionario.id}`);
            mostrarMensagem('Funcionário deletado com sucesso!', 'sucesso');
            refetch();
          } catch (erro) {
            mostrarMensagem('Erro ao deletar funcionário', 'erro');
          }
        }
      );
    },
    [pedirConfirmacao, mostrarMensagem, refetch]
  );

  const inativarFuncionario = useCallback(
    (funcionario) => {
      pedirConfirmacao(
        'Inativar Funcionário',
        `Deseja inativar "${funcionario.nome}"?`,
        async () => {
          try {
            await ClienteAPI.put(`/api/funcionarios/${funcionario.id}`, {
              ...funcionario,
              status: 'INATIVO'
            });
            mostrarMensagem('Funcionário inativado com sucesso!', 'sucesso');
            refetch();
          } catch (erro) {
            mostrarMensagem('Erro ao inativar funcionário', 'erro');
          }
        }
      );
    },
    [pedirConfirmacao, mostrarMensagem, refetch]
  );

  const listadoFuncionarios = funcionariosFiltrados();

  // ========================================
  // RENDER
  // ========================================

  if (loading) {
    return <Carregando mensagem="Carregando funcionários..." />;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Funcionários</h1>
        <Link href="/admin/funcionarios/novo">
          <Botao variant="primario">+ Novo Funcionário</Botao>
        </Link>
      </div>

      {/* Erro */}
      {erro && (
        <Cartao className="p-4 bg-red-50 border border-red-200">
          <p className="text-red-700">{erro.toString()}</p>
        </Cartao>
      )}

      {/* Filtro */}
      <Cartao className="p-6">
        <div className="flex items-center gap-2 mb-4 text-teal-600">
          <span>🔍</span>
          <h2 className="font-semibold">Filtro de Busca</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <input
              type="text"
              name="nome"
              value={filtro.nome}
              onChange={handleFiltro}
              placeholder="Nome do Funcionário"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={filtro.status}
              onChange={handleFiltro}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
            >
              <option value="TODOS">TODOS</option>
              <option value="ATIVO">ATIVO</option>
              <option value="INATIVO">INATIVO</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Botao
              variant="secundario"
              className="flex-1"
              onClick={handleLimpar}
            >
              Limpar Filtros
            </Botao>
          </div>
        </div>
      </Cartao>

      {/* Lista */}
      {listadoFuncionarios.length === 0 ? (
        <Cartao className="p-12 text-center">
          <p className="text-gray-500 text-lg">Nenhum funcionário encontrado</p>
        </Cartao>
      ) : (
        <Cartao className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                    Matrícula
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                    Função
                  </th>
                  <th className="px-4 py-3 text-center text-xs md:text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {listadoFuncionarios.map((func, index) => (
                  <tr
                    key={func.id}
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-teal-50 transition`}
                  >
                    <td className="px-4 py-3 text-xs md:text-sm font-semibold text-gray-800">
                      {func.id}
                    </td>
                    <td className="px-4 py-3 text-xs md:text-sm font-semibold text-gray-800">
                      {func.nome || func.usuarios?.nomecompleto || func.usuarios?.nomeCompleto || func.usuarios?.nome || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs md:text-sm text-gray-600">
                      {func.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs md:text-sm text-gray-600">
                      {func.telefonecelular || func.telefoneCelular || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs md:text-sm text-gray-600">
                      {func.funcao}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2 flex-wrap">
                        <Link href={`/admin/funcionarios/${func.id}`}>
                          <Botao
                            tamanho="pequeno"
                            variant="primario"
                            title="Editar"
                          >
                            Editar
                          </Botao>
                        </Link>
                        <Botao
                          tamanho="pequeno"
                          variant="secundario"
                          onClick={() => inativarFuncionario(func)}
                          title="Inativar"
                        >
                          Inativar
                        </Botao>
                        <Botao
                          tamanho="pequeno"
                          variant="perigo"
                          onClick={() => deletarFuncionario(func)}
                          title="Excluir"
                        >
                          Excluir
                        </Botao>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {listadoFuncionarios.length > 0 && (
            <div className="px-4 md:px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <span className="text-xs md:text-sm text-gray-600">
                Total: <span className="font-bold text-teal-600">{listadoFuncionarios.length}</span> funcionário(s)
              </span>
            </div>
          )}
        </Cartao>
      )}

      {/* Modal de Confirmação */}
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
            tipo: 'delete'
          });
        }}
        onClose={() =>
          setModal({
            visivel: false,
            titulo: '',
            mensagem: '',
            onConfirmar: null,
            tipo: 'delete'
          })
        }
      />
    </div>
  );
}
