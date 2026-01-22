/**
 * @file components/AdminUsuarios.js
 * @description Módulo de administração de usuários do sistema - REFATORADO
 * @author CREESER Development
 * @date 2025-01-22
 * 
 * ✅ REFACTORED: Usa componentes reutilizáveis, hooks customizados, e padrões de engenharia
 * 
 * Funcionalidades:
 * - Listar todos os usuários
 * - Criar novo usuário
 * - Editar usuário existente
 * - Deletar usuário
 * - Alterar status (ativo/inativo)
 */

import { useCallback, useState } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { useFormData } from '@/hooks/useFormData';
import Botao from '@/components/ui/Botao';
import Cartao from '@/components/ui/Cartao';
import { Carregando } from '@/components/ui/Carregando';
import ConfirmModal from './ConfirmModal';
import ClienteAPI from '@/utils/api';
import { validarRequerido, validarEmail } from '@/utils/validacoes';

/**
 * Máscaras de formatação para campos
 */
const mascaras = {
  cpf: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  },
  whatsapp: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
};

/**
 * Componente principal de administração de usuários
 * 
 * Responsabilidades:
 * - Gerenciar lista de usuários do sistema
 * - Criar, editar e deletar usuários
 * - Alterar status de usuários
 * 
 * @returns {JSX.Element} Interface de administração de usuários
 */
export default function AdminUsuarios() {
  // ========================================
  // ESTADO LOCAL
  // ========================================

  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modal, setModal] = useState({
    visivel: false,
    titulo: '',
    mensagem: '',
    onConfirmar: null,
    tipo: 'confirm'
  });

  // ========================================
  // FETCH DE DADOS
  // ========================================

  const { data: usuarios, loading, erro, refetch } = useApiData('/api/usuarios');

  // ========================================
  // GERENCIAMENTO DE FORMULÁRIO
  // ========================================

  const { valores, erros, carregando, handleChange: handleChangeBase, handleSubmit, resetar } =
    useFormData(
      {
        nomeCompleto: '',
        email: '',
        senha: '',
        cpf: '',
        dataNascimento: '',
        whatsapp: '',
        tipo: 'aluno',
        status: 'ativo'
      },
      async (valores) => {
        try {
          if (!validarRequerido(valores.nomeCompleto)) {
            throw new Error('Nome completo é obrigatório');
          }
          if (!validarEmail(valores.email)) {
            throw new Error('Email é inválido');
          }
          if (!validarRequerido(valores.senha)) {
            throw new Error('Senha é obrigatória');
          }

          if (usuarioSelecionado?.id) {
            // Editar usuário
            await ClienteAPI.put(`/api/usuarios/${usuarioSelecionado.id}`, valores);
            mostrarMensagem('Usuário atualizado com sucesso!', 'sucesso');
          } else {
            // Criar usuário
            await ClienteAPI.post('/api/usuarios', valores);
            mostrarMensagem('Usuário criado com sucesso!', 'sucesso');
          }

          fecharFormulario();
          refetch();
        } catch (erro) {
          mostrarMensagem(erro.message || 'Erro ao salvar usuário', 'erro');
        }
      }
    );

  // Wrapper para handleChange que aplica máscaras
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      let maskedValue = value;
      
      if (name === 'cpf' && mascaras.cpf) {
        maskedValue = mascaras.cpf(value);
      } else if (name === 'whatsapp' && mascaras.whatsapp) {
        maskedValue = mascaras.whatsapp(value);
      }
      
      handleChangeBase({
        target: { name, value: maskedValue }
      });
    },
    [handleChangeBase]
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

  const fecharFormulario = useCallback(() => {
    setMostrarFormulario(false);
    setUsuarioSelecionado(null);
    resetar();
  }, [resetar]);

  const abrirFormulario = useCallback((usuario = null) => {
    if (usuario) {
      setUsuarioSelecionado(usuario);
      Object.keys(usuario).forEach((chave) => {
        if (chave !== 'id' && chave !== 'senha') {
          handleChangeBase({
            target: { name: chave, value: usuario[chave] || '' }
          });
        }
      });
    }
    setMostrarFormulario(true);
  }, [handleChangeBase]);

  const deletarUsuario = useCallback(
    (usuario) => {
      pedirConfirmacao(
        'Deletar Usuário',
        `Deseja deletar "${usuario.nomeCompleto}"? Esta ação não pode ser desfeita.`,
        async () => {
          try {
            await ClienteAPI.delete(`/api/usuarios/${usuario.id}`);
            mostrarMensagem('Usuário deletado com sucesso!', 'sucesso');
            refetch();
          } catch (erro) {
            mostrarMensagem('Erro ao deletar usuário', 'erro');
          }
        },
        'delete'
      );
    },
    [pedirConfirmacao, mostrarMensagem, refetch]
  );

  const alternarStatus = useCallback(
    (usuario) => {
      const novoStatus = usuario.status === 'ativo' ? 'inativo' : 'ativo';
      pedirConfirmacao(
        novoStatus === 'ativo' ? 'Ativar Usuário' : 'Inativar Usuário',
        `Deseja ${novoStatus === 'ativo' ? 'ativar' : 'inativar'} "${usuario.nomeCompleto}"?`,
        async () => {
          try {
            await ClienteAPI.put(`/api/usuarios/${usuario.id}`, {
              ...usuario,
              status: novoStatus
            });
            mostrarMensagem(`Usuário ${novoStatus === 'ativo' ? 'ativado' : 'inativado'} com sucesso!`, 'sucesso');
            refetch();
          } catch (erro) {
            mostrarMensagem('Erro ao alterar status', 'erro');
          }
        }
      );
    },
    [pedirConfirmacao, mostrarMensagem, refetch]
  );

  // ========================================
  // RENDER
  // ========================================

  if (loading) {
    return <Carregando mensagem="Carregando usuários..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gerenciar Usuários</h1>
          <p className="text-sm text-gray-600 mt-2">Total: {usuarios?.length || 0} usuários</p>
        </div>
        <Botao
          variant="primario"
          onClick={() => {
            if (mostrarFormulario) {
              fecharFormulario();
            } else {
              abrirFormulario();
            }
          }}
        >
          {mostrarFormulario ? '✕ Cancelar' : '+ Novo Usuário'}
        </Botao>
      </div>

      {erro && (
        <Cartao className="p-4 bg-red-50 border border-red-200">
          <p className="text-red-700">{erro.toString()}</p>
        </Cartao>
      )}

      {mostrarFormulario && (
        <Cartao className="p-6">
          <h2 className="text-xl font-bold mb-6">
            {usuarioSelecionado ? '✏️ Editar Usuário' : '➕ Novo Usuário'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Nome Completo *</label>
              <input
                name="nomeCompleto"
                value={valores.nomeCompleto}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              {erros.nomeCompleto && <p className="text-red-600 text-xs mt-1">{erros.nomeCompleto}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Email *</label>
              <input
                name="email"
                type="email"
                value={valores.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              {erros.email && <p className="text-red-600 text-xs mt-1">{erros.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Senha {usuarioSelecionado ? '(deixe em branco para não alterar)' : '*'}
              </label>
              <input
                name="senha"
                type="password"
                value={valores.senha}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required={!usuarioSelecionado}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">CPF *</label>
              <input
                name="cpf"
                value={valores.cpf}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="000.000.000-00"
                maxLength="14"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Data de Nascimento *</label>
              <input
                name="dataNascimento"
                type="date"
                value={valores.dataNascimento}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">WhatsApp *</label>
              <input
                name="whatsapp"
                value={valores.whatsapp}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="(00) 00000-0000"
                maxLength="15"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Tipo *</label>
              <select
                name="tipo"
                value={valores.tipo}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="aluno">Aluno</option>
                <option value="professor">Professor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Status *</label>
              <select
                name="status"
                value={valores.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <Botao variant="primario" type="submit" carregando={carregando}>
                {usuarioSelecionado ? 'Atualizar Usuário' : 'Criar Usuário'}
              </Botao>
              <Botao variant="secundario" onClick={fecharFormulario}>
                Cancelar
              </Botao>
            </div>
          </form>
        </Cartao>
      )}

      {!usuarios || usuarios.length === 0 ? (
        <Cartao className="p-12 text-center">
          <p className="text-gray-500 text-lg">Nenhum usuário cadastrado</p>
        </Cartao>
      ) : (
        <Cartao className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                    CPF
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs md:text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario, index) => (
                  <tr
                    key={usuario.id}
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50 transition ${
                      usuario.status === 'inativo' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-xs md:text-sm font-semibold text-gray-800">
                      {usuario.nomeCompleto}
                    </td>
                    <td className="px-4 py-3 text-xs md:text-sm text-gray-600">
                      {usuario.email}
                    </td>
                    <td className="px-4 py-3 text-xs md:text-sm text-gray-600">
                      {usuario.cpf}
                    </td>
                    <td className="px-4 py-3 text-xs md:text-sm text-gray-600">
                      {usuario.tipo.charAt(0).toUpperCase() + usuario.tipo.slice(1)}
                    </td>
                    <td className="px-4 py-3 text-xs md:text-sm">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          usuario.status === 'ativo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2 flex-wrap">
                        <Botao
                          tamanho="pequeno"
                          variant="primario"
                          onClick={() => abrirFormulario(usuario)}
                          title="Editar"
                        >
                          Editar
                        </Botao>
                        <Botao
                          tamanho="pequeno"
                          variant={usuario.status === 'ativo' ? 'secundario' : 'sucesso'}
                          onClick={() => alternarStatus(usuario)}
                          title={usuario.status === 'ativo' ? 'Inativar' : 'Ativar'}
                        >
                          {usuario.status === 'ativo' ? 'Inativar' : 'Ativar'}
                        </Botao>
                        <Botao
                          tamanho="pequeno"
                          variant="perigo"
                          onClick={() => deletarUsuario(usuario)}
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
        </Cartao>
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
            tipo: 'confirm'
          });
        }}
        onClose={() =>
          setModal({
            visivel: false,
            titulo: '',
            mensagem: '',
            onConfirmar: null,
            tipo: 'confirm'
          })
        }
      />
    </div>
  );
}
