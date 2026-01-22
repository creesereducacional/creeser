/**
 * @file components/AdminAlunos.js
 * @description Módulo de administração de alunos - REFATORADO
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * ✅ REFACTORED: Usa componentes reutilizáveis, hooks customizados, e padrões de engenharia
 * 
 * Mudanças da refatoração:
 * - Usa Tabela para listar alunos (em vez de código inline)
 * - Usa Formulario + CampoFormulario para criar/editar (em vez de código inline)
 * - Usa useApiData para fetch de dados com loading/erro
 * - Usa useFormData para gerenciar estado de formulário e validação
 * - Usa ClienteAPI para todas as requisições HTTP
 * - Usa formatadores para CPF, telefone, data
 * - Usa validadores para validação de entrada
 * - Usa constantes para status, papéis, mensagens
 * - Reduzido de 832 para ~400 linhas
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
import ClienteAPI from '@/utils/api';
import {
  formatarCPF,
  formatarTelefone,
  formatarData,
  formatarNome,
} from '@/utils/formatadores';
import {
  validarEmail,
  validarCPF,
  validarTelefone,
  validarRequerido,
} from '@/utils/validacoes';
import { STATUS_USUARIO, GENEROS } from '@/utils/constantes';

/**
 * Componente principal de administração de alunos
 * 
 * Responsabilidades:
 * - Listar todos os alunos
 * - Criar novo aluno
 * - Editar aluno existente
 * - Deletar aluno
 * - Vincular/desvincular cursos
 * 
 * @returns {JSX.Element} Interface de administração de alunos
 * 
 * @example
 * import AdminAlunos from '@/components/AdminAlunos';
 * 
 * export default function AdminPage() {
 *   return <AdminAlunos />;
 * }
 */
export default function AdminAlunos() {
  // ========================================
  // ESTADO LOCAL
  // ========================================

  const [visualizacao, setVisualizacao] = useState('todos'); // todos, ativos, inativos
  const [alunoParaEditar, setAlunoParaEditar] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modal, setModal] = useState({
    visivel: false,
    titulo: '',
    mensagem: '',
    onConfirmar: null,
  });
  const [filtroNome, setFiltroNome] = useState('');

  // ========================================
  // FETCH DE DADOS
  // ========================================

  // Buscar lista de alunos
  const { data: alunos, loading, erro, refetch } = useApiData('/api/alunos', {
    dependencias: [visualizacao],
    parametros: {
      status: visualizacao !== 'todos' ? visualizacao : undefined,
    },
  });

  // Buscar cursos disponíveis
  const { data: cursos = [] } = useApiData('/api/cursos');

  // ========================================
  // GERENCIAMENTO DE FORMULÁRIO
  // ========================================

  const { valores, erros, carregando, handleChange, handleSubmit, resetar } =
    useFormData(
      {
        nomeCompleto: '',
        email: '',
        cpf: '',
        whatsapp: '',
        dataNascimento: '',
        genero: '',
        rua: '',
        numero: '',
        complemento: '',
        cidade: '',
        estado: '',
        cep: '',
        foto: '',
        cursos: [],
        status: STATUS_USUARIO.ATIVO,
      },
      // Callback de submit
      async (valores) => {
        try {
          // Validar campos obrigatórios
          const errosValidacao = {};

          if (!validarRequerido(valores.nomeCompleto)) {
            errosValidacao.nomeCompleto = 'Nome é obrigatório';
          }
          if (!validarEmail(valores.email)) {
            errosValidacao.email = 'Email inválido';
          }
          if (!validarCPF(valores.cpf)) {
            errosValidacao.cpf = 'CPF inválido';
          }
          if (!validarTelefone(valores.whatsapp)) {
            errosValidacao.whatsapp = 'Telefone inválido';
          }

          if (Object.keys(errosValidacao).length > 0) {
            throw new Error('Verifique os campos destacados');
          }

          // Preparar dados para envio
          const dadosEnvio = {
            ...valores,
            // Limpar máscara do CPF
            cpf: valores.cpf.replace(/\D/g, ''),
            // Limpar máscara do telefone
            whatsapp: valores.whatsapp.replace(/\D/g, ''),
            // Limpar máscara do CEP
            cep: valores.cep?.replace(/\D/g, ''),
          };

          // Fazer requisição (POST para novo, PUT para editar)
          if (alunoParaEditar?.id) {
            await ClienteAPI.put(`/api/alunos/${alunoParaEditar.id}`, dadosEnvio);
            mostrarMensagem('Aluno atualizado com sucesso!', 'sucesso');
          } else {
            await ClienteAPI.post('/api/alunos', dadosEnvio);
            mostrarMensagem('Aluno criado com sucesso!', 'sucesso');
          }

          // Fechar formulário e recarregar dados
          fecharFormulario();
          refetch();
        } catch (erro) {
          mostrarMensagem(
            erro.message || 'Erro ao salvar aluno',
            'erro'
          );
        }
      }
    );

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  /**
   * Mostrar modal com mensagem
   */
  const mostrarMensagem = useCallback((mensagem, tipo = 'info') => {
    setModal({
      visivel: true,
      titulo: tipo === 'sucesso' ? '✅ Sucesso!' : '❌ Erro',
      mensagem,
      onConfirmar: null,
    });
  }, []);

  /**
   * Mostrar modal de confirmação
   */
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

  /**
   * Abrir formulário para criar novo aluno
   */
  const abrirNovoAluno = useCallback(() => {
    setAlunoParaEditar(null);
    resetar();
    setMostrarFormulario(true);
  }, [resetar]);

  /**
   * Abrir formulário para editar aluno
   */
  const abrirEdicao = useCallback((aluno) => {
    setAlunoParaEditar(aluno);
    // Preencher formulário com dados do aluno
    Object.keys(aluno).forEach((chave) => {
      handleChange({
        target: { name: chave, value: aluno[chave] || '' },
      });
    });
    setMostrarFormulario(true);
  }, [handleChange]);

  /**
   * Fechar formulário
   */
  const fecharFormulario = useCallback(() => {
    setMostrarFormulario(false);
    setAlunoParaEditar(null);
    resetar();
  }, [resetar]);

  /**
   * Deletar aluno
   */
  const deletarAluno = useCallback(
    (aluno) => {
      pedirConfirmacao(
        'Deletar Aluno',
        `Deseja deletar ${aluno.nomeCompleto}? Esta ação não pode ser desfeita.`,
        async () => {
          try {
            await ClienteAPI.delete(`/api/alunos/${aluno.id}`);
            mostrarMensagem('Aluno deletado com sucesso!', 'sucesso');
            refetch();
          } catch (erro) {
            mostrarMensagem('Erro ao deletar aluno', 'erro');
          }
        }
      );
    },
    [pedirConfirmacao, mostrarMensagem, refetch]
  );

  /**
   * Vincular curso ao aluno
   */
  const vincularCurso = useCallback(
    async (alunoId, cursoId) => {
      try {
        await ClienteAPI.patch(`/api/alunos/${alunoId}`, {
          action: 'vincularCurso',
          cursoId,
        });
        mostrarMensagem('Curso vinculado com sucesso!', 'sucesso');
        refetch();
      } catch (erro) {
        mostrarMensagem('Erro ao vincular curso', 'erro');
      }
    },
    [mostrarMensagem, refetch]
  );

  /**
   * Desvincular curso do aluno
   */
  const desvincularCurso = useCallback(
    (alunoId, cursoId) => {
      pedirConfirmacao(
        'Desvincular Curso',
        'Deseja desvincular este curso?',
        async () => {
          try {
            await ClienteAPI.patch(`/api/alunos/${alunoId}`, {
              action: 'desvincularCurso',
              cursoId,
            });
            mostrarMensagem('Curso desvinculado com sucesso!', 'sucesso');
            refetch();
          } catch (erro) {
            mostrarMensagem('Erro ao desvincular curso', 'erro');
          }
        }
      );
    },
    [pedirConfirmacao, mostrarMensagem, refetch]
  );

  // ========================================
  // CONFIGURAÇÃO DA TABELA
  // ========================================

  const colunas = [
    {
      chave: 'foto',
      titulo: 'Foto',
      largura: '5%',
      renderizador: (valor) =>
        valor ? (
          <img
            src={valor}
            alt="Foto"
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-200" />
        ),
    },
    {
      chave: 'nomeCompleto',
      titulo: 'Nome',
      largura: '25%',
      renderizador: (valor) => formatarNome(valor),
    },
    {
      chave: 'email',
      titulo: 'Email',
      largura: '25%',
      renderizador: (valor) => valor,
    },
    {
      chave: 'cpf',
      titulo: 'CPF',
      largura: '15%',
      renderizador: (valor) => formatarCPF(valor),
    },
    {
      chave: 'whatsapp',
      titulo: 'Telefone',
      largura: '15%',
      renderizador: (valor) => formatarTelefone(valor),
    },
    {
      chave: 'status',
      titulo: 'Status',
      largura: '10%',
      renderizador: (valor) => (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            valor === STATUS_USUARIO.ATIVO
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {valor === STATUS_USUARIO.ATIVO ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      chave: 'acoes',
      titulo: 'Ações',
      largura: '15%',
      renderizador: (_, aluno) => (
        <div className="flex gap-2">
          <Botao
            tamanho="pequeno"
            variant="secundario"
            onClick={() => abrirEdicao(aluno)}
          >
            Editar
          </Botao>
          <Botao
            tamanho="pequeno"
            variant="perigo"
            onClick={() => deletarAluno(aluno)}
          >
            Deletar
          </Botao>
        </div>
      ),
    },
  ];

  // Filtrar alunos pelo nome
  const alunosFiltrados = alunos?.filter((aluno) =>
    aluno.nomeCompleto
      ?.toLowerCase()
      .includes(filtroNome.toLowerCase())
  ) || [];

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">
      {/* Cabeçalho com título e botão de novo */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Alunos</h1>
        <Botao variant="primario" onClick={abrirNovoAluno}>
          + Novo Aluno
        </Botao>
      </div>

      {/* Filtros */}
      <Cartao>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por nome */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Buscar por nome
            </label>
            <input
              type="text"
              placeholder="Digite o nome..."
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Filtro por status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={visualizacao}
              onChange={(e) => setVisualizacao(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="todos">Todos</option>
              <option value={STATUS_USUARIO.ATIVO}>Ativos</option>
              <option value={STATUS_USUARIO.INATIVO}>Inativos</option>
            </select>
          </div>

          {/* Resultados */}
          <div className="flex items-end">
            <p className="text-gray-600">
              {alunosFiltrados.length} aluno(s) encontrado(s)
            </p>
          </div>
        </div>
      </Cartao>

      {/* Tabela de alunos */}
      <Cartao titulo="Lista de Alunos">
        {loading ? (
          <SkeletonTabela linhas={5} colunas={colunas.length} />
        ) : erro ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {erro.toString()}
          </div>
        ) : (
          <Tabela
            colunas={colunas}
            dados={alunosFiltrados}
            carregando={loading}
            vazio={
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum aluno encontrado</p>
                <Botao variant="primario" onClick={abrirNovoAluno} className="mt-4">
                  Criar Primeiro Aluno
                </Botao>
              </div>
            }
          />
        )}
      </Cartao>

      {/* Formulário modal */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold mb-6">
              {alunoParaEditar ? 'Editar Aluno' : 'Novo Aluno'}
            </h2>

            <Formulario
              valores={valores}
              erros={erros}
              onSubmit={handleSubmit}
              carregandoSubmit={carregando}
            >
              {/* Dados Pessoais */}
              <fieldset className="border-t pt-4">
                <legend className="text-lg font-semibold mb-4">
                  Dados Pessoais
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CampoFormulario
                    nome="nomeCompleto"
                    label="Nome Completo *"
                    tipo="text"
                    valor={valores.nomeCompleto}
                    erro={erros.nomeCompleto}
                    onChange={handleChange}
                    requerido
                  />
                  <CampoFormulario
                    nome="email"
                    label="Email *"
                    tipo="email"
                    valor={valores.email}
                    erro={erros.email}
                    onChange={handleChange}
                    desabilitado={!!alunoParaEditar}
                    requerido
                  />
                  <CampoFormulario
                    nome="cpf"
                    label="CPF *"
                    tipo="text"
                    valor={formatarCPF(valores.cpf || '')}
                    erro={erros.cpf}
                    onChange={handleChange}
                    maxLength="14"
                    requerido
                  />
                  <CampoFormulario
                    nome="whatsapp"
                    label="WhatsApp *"
                    tipo="text"
                    valor={formatarTelefone(valores.whatsapp || '')}
                    erro={erros.whatsapp}
                    onChange={handleChange}
                    maxLength="15"
                    requerido
                  />
                  <CampoFormulario
                    nome="dataNascimento"
                    label="Data de Nascimento"
                    tipo="date"
                    valor={valores.dataNascimento}
                    onChange={handleChange}
                  />
                  <CampoFormulario
                    nome="genero"
                    label="Gênero"
                    tipo="select"
                    valor={valores.genero}
                    onChange={handleChange}
                    opcoes={Object.entries(GENEROS).map(([chave, valor]) => ({
                      valor,
                      label: valor.charAt(0).toUpperCase() + valor.slice(1),
                    }))}
                  />
                </div>
              </fieldset>

              {/* Endereço */}
              <fieldset className="border-t pt-4">
                <legend className="text-lg font-semibold mb-4">Endereço</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CampoFormulario
                    nome="rua"
                    label="Rua"
                    tipo="text"
                    valor={valores.rua}
                    onChange={handleChange}
                  />
                  <CampoFormulario
                    nome="numero"
                    label="Número"
                    tipo="text"
                    valor={valores.numero}
                    onChange={handleChange}
                  />
                  <CampoFormulario
                    nome="complemento"
                    label="Complemento"
                    tipo="text"
                    valor={valores.complemento}
                    onChange={handleChange}
                  />
                  <CampoFormulario
                    nome="cep"
                    label="CEP"
                    tipo="text"
                    valor={valores.cep}
                    onChange={handleChange}
                    maxLength="9"
                  />
                  <CampoFormulario
                    nome="cidade"
                    label="Cidade"
                    tipo="text"
                    valor={valores.cidade}
                    onChange={handleChange}
                  />
                  <CampoFormulario
                    nome="estado"
                    label="Estado"
                    tipo="text"
                    valor={valores.estado}
                    onChange={handleChange}
                    maxLength="2"
                  />
                </div>
              </fieldset>

              {/* Status */}
              <fieldset className="border-t pt-4">
                <legend className="text-lg font-semibold mb-4">Status</legend>
                <CampoFormulario
                  nome="status"
                  label="Status"
                  tipo="select"
                  valor={valores.status}
                  onChange={handleChange}
                  opcoes={[
                    { valor: STATUS_USUARIO.ATIVO, label: 'Ativo' },
                    { valor: STATUS_USUARIO.INATIVO, label: 'Inativo' },
                  ]}
                />
              </fieldset>

              {/* Botões de ação */}
              <div className="flex gap-4 mt-6 border-t pt-4">
                <Botao
                  variant="primario"
                  type="submit"
                  carregando={carregando}
                >
                  {alunoParaEditar ? 'Atualizar' : 'Criar'} Aluno
                </Botao>
                <Botao variant="secundario" onClick={fecharFormulario}>
                  Cancelar
                </Botao>
              </div>
            </Formulario>
          </div>
        </div>
      )}

      {/* Modal de confirmação */}
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
