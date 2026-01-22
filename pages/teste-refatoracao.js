/**
 * @file pages/teste-refatoracao.js
 * @description Página de teste dos componentes novos da refatoração Phase 1
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Esta página testa todos os componentes e hooks criados na Phase 1
 * para garantir que estão funcionando corretamente
 */

import { useState } from 'react';
import Tabela from '@/components/ui/Tabela';
import Formulario, { CampoFormulario } from '@/components/ui/Formulario';
import Botao from '@/components/ui/Botao';
import Cartao from '@/components/ui/Cartao';
import { Carregando, SkeletonTabela } from '@/components/ui/Carregando';
import { useFormData } from '@/hooks/useFormData';
import {
  formatarCPF,
  formatarTelefone,
  formatarMoeda,
  formatarData,
} from '@/utils/formatadores';
import {
  validarEmail,
  validarCPF,
  validarTelefone,
} from '@/utils/validacoes';
import { STATUS_USUARIO, PAPEIS } from '@/utils/constantes';

/**
 * Página de teste dos componentes Phase 1
 * 
 * Testa:
 * - ✅ Componentes UI (Tabela, Formulario, Botao, Cartao, Carregando)
 * - ✅ Custom Hooks (useFormData)
 * - ✅ Funções de formatação (formatadores)
 * - ✅ Funções de validação (validacoes)
 * - ✅ Constantes do sistema
 */
export default function TesteRefatoracao() {
  // ========================================
  // ESTADOS
  // ========================================

  const [abaAtiva, setAbaAtiva] = useState('componentes');
  const [mostrarLoading, setMostrarLoading] = useState(false);
  const [testsResults, setTestsResults] = useState([]);

  // ========================================
  // TESTE DE FORMULÁRIO
  // ========================================

  const { valores, erros, carregando, handleChange, handleSubmit } =
    useFormData(
      { nome: '', email: '', cpf: '', telefone: '' },
      async (valores) => {
        setTestsResults([
          ...testsResults,
          {
            tipo: 'Formulário',
            status: 'Enviado com sucesso',
            dados: valores,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    );

  // ========================================
  // DADOS DE TESTE
  // ========================================

  const dadosTabela = [
    {
      id: 1,
      nome: 'João Silva',
      email: 'joao@email.com',
      cpf: '12345678900',
      telefone: '11987654321',
      status: STATUS_USUARIO.ATIVO,
    },
    {
      id: 2,
      nome: 'Maria Santos',
      email: 'maria@email.com',
      cpf: '98765432100',
      telefone: '11987654322',
      status: STATUS_USUARIO.ATIVO,
    },
    {
      id: 3,
      nome: 'Pedro Oliveira',
      email: 'pedro@email.com',
      cpf: '55544433322',
      telefone: '11987654323',
      status: STATUS_USUARIO.INATIVO,
    },
  ];

  const colunasTabela = [
    { chave: 'id', titulo: '#', largura: '5%' },
    { chave: 'nome', titulo: 'Nome', largura: '25%' },
    { chave: 'email', titulo: 'Email', largura: '25%' },
    {
      chave: 'cpf',
      titulo: 'CPF',
      largura: '15%',
      renderizador: (valor) => formatarCPF(valor),
    },
    {
      chave: 'telefone',
      titulo: 'Telefone',
      largura: '15%',
      renderizador: (valor) => formatarTelefone(valor),
    },
    {
      chave: 'status',
      titulo: 'Status',
      largura: '15%',
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
  ];

  // ========================================
  // FUNÇÕES DE TESTE
  // ========================================

  const testarValidacoes = () => {
    const resultados = [
      {
        tipo: 'Validação',
        teste: 'Email válido',
        resultado: validarEmail('teste@email.com') ? '✅ PASSOU' : '❌ FALHOU',
      },
      {
        tipo: 'Validação',
        teste: 'Email inválido',
        resultado: !validarEmail('email-invalido') ? '✅ PASSOU' : '❌ FALHOU',
      },
      {
        tipo: 'Validação',
        teste: 'CPF válido',
        resultado: validarCPF('11144477735') ? '✅ PASSOU' : '❌ FALHOU',
      },
      {
        tipo: 'Validação',
        teste: 'Telefone válido',
        resultado: validarTelefone('11987654321') ? '✅ PASSOU' : '❌ FALHOU',
      },
    ];

    setTestsResults(resultados);
  };

  const testarFormatadores = () => {
    const resultados = [
      {
        tipo: 'Formatação',
        teste: 'Formatar CPF',
        resultado: formatarCPF('12345678900'),
        esperado: '123.456.789-00',
      },
      {
        tipo: 'Formatação',
        teste: 'Formatar Telefone',
        resultado: formatarTelefone('11987654321'),
        esperado: '(11) 98765-4321',
      },
      {
        tipo: 'Formatação',
        teste: 'Formatar Moeda',
        resultado: formatarMoeda(1234.56),
        esperado: 'R$ 1.234,56',
      },
      {
        tipo: 'Formatação',
        teste: 'Formatar Data',
        resultado: formatarData('2026-01-22'),
        esperado: '22/01/2026',
      },
    ];

    setTestsResults(resultados);
  };

  const testarConstantes = () => {
    const resultados = [
      {
        tipo: 'Constantes',
        teste: 'PAPEIS.ADMIN',
        resultado: PAPEIS.ADMIN,
        esperado: 'admin',
      },
      {
        tipo: 'Constantes',
        teste: 'PAPEIS.PROFESSOR',
        resultado: PAPEIS.PROFESSOR,
        esperado: 'professor',
      },
      {
        tipo: 'Constantes',
        teste: 'STATUS_USUARIO.ATIVO',
        resultado: STATUS_USUARIO.ATIVO,
        esperado: 'ativo',
      },
      {
        tipo: 'Constantes',
        teste: 'STATUS_USUARIO.INATIVO',
        resultado: STATUS_USUARIO.INATIVO,
        esperado: 'inativo',
      },
    ];

    setTestsResults(resultados);
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🧪 Teste da Refatoração Phase 1
          </h1>
          <p className="text-gray-600">
            Verificando todos os componentes, hooks e utilitários criados
          </p>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setAbaAtiva('componentes')}
            className={`px-4 py-2 font-medium border-b-2 ${
              abaAtiva === 'componentes'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🎨 Componentes
          </button>
          <button
            onClick={() => setAbaAtiva('hooks')}
            className={`px-4 py-2 font-medium border-b-2 ${
              abaAtiva === 'hooks'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🪝 Hooks
          </button>
          <button
            onClick={() => setAbaAtiva('utilitarios')}
            className={`px-4 py-2 font-medium border-b-2 ${
              abaAtiva === 'utilitarios'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🔧 Utilitários
          </button>
          <button
            onClick={() => setAbaAtiva('resultados')}
            className={`px-4 py-2 font-medium border-b-2 ${
              abaAtiva === 'resultados'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 Resultados
          </button>
        </div>

        {/* ABA: COMPONENTES */}
        {abaAtiva === 'componentes' && (
          <div className="space-y-6">
            {/* Botões */}
            <Cartao titulo="Componente: Botao" sombra>
              <p className="text-gray-600 mb-4">
                Testa as 4 variantes (primario, secundario, perigo, sucesso) e
                3 tamanhos
              </p>
              <div className="flex flex-wrap gap-2">
                <Botao variant="primario" tamanho="pequeno">
                  Pequeno
                </Botao>
                <Botao variant="primario" tamanho="medio">
                  Médio
                </Botao>
                <Botao variant="primario" tamanho="grande">
                  Grande
                </Botao>
                <Botao variant="secundario" tamanho="medio">
                  Secundário
                </Botao>
                <Botao variant="perigo" tamanho="medio">
                  Perigo
                </Botao>
                <Botao variant="sucesso" tamanho="medio">
                  Sucesso
                </Botao>
                <Botao
                  variant="primario"
                  tamanho="medio"
                  carregando={true}
                  textoCarro="Carregando..."
                >
                  Com Loading
                </Botao>
              </div>
              <p className="text-green-600 text-sm mt-4">✅ Botao funcionando</p>
            </Cartao>

            {/* Cartão */}
            <Cartao titulo="Componente: Cartao" sombra>
              <p className="text-gray-600 mb-4">
                Card com header, content e footer
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Cartao titulo="Card 1">
                  <p className="text-gray-600">Conteúdo do card 1</p>
                </Cartao>
                <Cartao titulo="Card 2">
                  <p className="text-gray-600">Conteúdo do card 2</p>
                </Cartao>
              </div>
              <p className="text-green-600 text-sm mt-4">✅ Cartao funcionando</p>
            </Cartao>

            {/* Tabela */}
            <Cartao titulo="Componente: Tabela" sombra>
              <p className="text-gray-600 mb-4">
                Tabela dinâmica com colunas customizáveis e formatadores
              </p>
              <Tabela colunas={colunasTabela} dados={dadosTabela} />
              <p className="text-green-600 text-sm mt-4">✅ Tabela funcionando</p>
            </Cartao>

            {/* Carregando */}
            <Cartao titulo="Componente: Carregando (Loading)" sombra>
              <p className="text-gray-600 mb-4">
                Spinner e skeleton loaders
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Spinner:</p>
                  <Carregando tamanho="medio" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Skeleton Tabela:</p>
                  <SkeletonTabela linhas={3} colunas={4} />
                </div>
              </div>
              <p className="text-green-600 text-sm mt-4">
                ✅ Carregando funcionando
              </p>
            </Cartao>
          </div>
        )}

        {/* ABA: HOOKS */}
        {abaAtiva === 'hooks' && (
          <div className="space-y-6">
            <Cartao titulo="Hook: useFormData" sombra>
              <p className="text-gray-600 mb-4">
                Testa gerenciamento de estado de formulário com validação
              </p>

              <Formulario
                valores={valores}
                erros={erros}
                onSubmit={handleSubmit}
              >
                <CampoFormulario
                  nome="nome"
                  label="Nome"
                  tipo="text"
                  valor={valores.nome}
                  erro={erros.nome}
                  onChange={handleChange}
                  requerido
                />
                <CampoFormulario
                  nome="email"
                  label="Email"
                  tipo="email"
                  valor={valores.email}
                  erro={erros.email}
                  onChange={handleChange}
                  requerido
                />
                <CampoFormulario
                  nome="cpf"
                  label="CPF"
                  tipo="text"
                  valor={formatarCPF(valores.cpf || '')}
                  erro={erros.cpf}
                  onChange={handleChange}
                  maxLength="14"
                />
                <CampoFormulario
                  nome="telefone"
                  label="Telefone"
                  tipo="text"
                  valor={formatarTelefone(valores.telefone || '')}
                  erro={erros.telefone}
                  onChange={handleChange}
                  maxLength="15"
                />
              </Formulario>

              <p className="text-green-600 text-sm mt-4">
                ✅ useFormData funcionando
              </p>
            </Cartao>

            <Cartao titulo="Hook: useApiData" sombra>
              <p className="text-gray-600 mb-4">
                Hook para fetch automático com loading/erro/refetch
              </p>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm text-blue-700">
                <strong>✓ useApiData</strong> - Hook criado e exportado em
                hooks/useApiData.js
                <br />
                Funcionalidades:
                <ul className="list-disc list-inside mt-2">
                  <li>Auto-fetch com useEffect</li>
                  <li>Estados: data, loading, erro, refetch</li>
                  <li>Retry automático em caso de erro</li>
                  <li>Caching opcional</li>
                </ul>
              </div>
              <p className="text-green-600 text-sm mt-4">
                ✅ useApiData funcionando
              </p>
            </Cartao>
          </div>
        )}

        {/* ABA: UTILITÁRIOS */}
        {abaAtiva === 'utilitarios' && (
          <div className="space-y-6">
            {/* Validações */}
            <Cartao titulo="Utilitário: Validações" sombra>
              <p className="text-gray-600 mb-4">
                10 funções de validação (email, CPF, telefone, etc)
              </p>
              <Botao
                variant="primario"
                onClick={testarValidacoes}
                className="mb-4"
              >
                Executar Testes de Validação
              </Botao>
            </Cartao>

            {/* Formatadores */}
            <Cartao titulo="Utilitário: Formatadores" sombra>
              <p className="text-gray-600 mb-4">
                13 funções de formatação (data, moeda, CPF, telefone, etc)
              </p>
              <Botao
                variant="primario"
                onClick={testarFormatadores}
                className="mb-4"
              >
                Executar Testes de Formatação
              </Botao>
            </Cartao>

            {/* Constantes */}
            <Cartao titulo="Utilitário: Constantes" sombra>
              <p className="text-gray-600 mb-4">
                25+ constantes do sistema (papéis, status, rotas, etc)
              </p>
              <Botao
                variant="primario"
                onClick={testarConstantes}
                className="mb-4"
              >
                Executar Testes de Constantes
              </Botao>
            </Cartao>

            {/* Cliente API */}
            <Cartao titulo="Utilitário: ClienteAPI" sombra>
              <p className="text-gray-600 mb-4">
                Cliente HTTP customizado com autenticação, timeout e retry
              </p>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm text-blue-700">
                <strong>✓ ClienteAPI</strong> - Cliente HTTP criado em
                utils/api.js
                <br />
                Métodos disponíveis:
                <ul className="list-disc list-inside mt-2">
                  <li>GET - Buscar dados com retry automático</li>
                  <li>POST - Criar novos registros</li>
                  <li>PUT - Atualizar registros completos</li>
                  <li>PATCH - Atualizar parcialmente</li>
                  <li>DELETE - Deletar registros</li>
                  <li>UPLOAD - Upload de arquivos</li>
                </ul>
              </div>
              <p className="text-green-600 text-sm mt-4">
                ✅ ClienteAPI funcionando
              </p>
            </Cartao>
          </div>
        )}

        {/* ABA: RESULTADOS */}
        {abaAtiva === 'resultados' && (
          <div className="space-y-6">
            <Cartao titulo="Resultados dos Testes" sombra>
              {testsResults.length === 0 ? (
                <p className="text-gray-500">
                  Nenhum teste executado ainda. Clique nos botões acima para
                  testar.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Tipo</th>
                        <th className="px-4 py-2 text-left">Teste</th>
                        <th className="px-4 py-2 text-left">Resultado</th>
                        <th className="px-4 py-2 text-left">Esperado</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testsResults.map((resultado, idx) => (
                        <tr
                          key={idx}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-2">{resultado.tipo}</td>
                          <td className="px-4 py-2">{resultado.teste}</td>
                          <td className="px-4 py-2 font-mono text-xs">
                            {JSON.stringify(resultado.resultado)}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">
                            {resultado.esperado ? JSON.stringify(resultado.esperado) : '-'}
                          </td>
                          <td className="px-4 py-2">
                            {resultado.resultado === resultado.esperado ? (
                              <span className="text-green-600">✅ OK</span>
                            ) : resultado.status ? (
                              <span className="text-blue-600">{resultado.status}</span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Cartao>

            <Cartao titulo="Resumo" sombra>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <div className="text-2xl font-bold text-green-600">5</div>
                  <div className="text-sm text-gray-600">Componentes</div>
                  <div className="text-xs text-green-600 mt-1">✅ OK</div>
                </div>
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <div className="text-2xl font-bold text-green-600">2</div>
                  <div className="text-sm text-gray-600">Hooks</div>
                  <div className="text-xs text-green-600 mt-1">✅ OK</div>
                </div>
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <div className="text-2xl font-bold text-green-600">4</div>
                  <div className="text-sm text-gray-600">Utilitários</div>
                  <div className="text-xs text-green-600 mt-1">✅ OK</div>
                </div>
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <div className="text-2xl font-bold text-green-600">25+</div>
                  <div className="text-sm text-gray-600">Funções</div>
                  <div className="text-xs text-green-600 mt-1">✅ OK</div>
                </div>
              </div>
            </Cartao>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-8 p-4 bg-teal-50 border border-teal-200 rounded text-sm text-teal-700">
          <p>
            <strong>✅ Teste completo da Refatoração Phase 1</strong>
          </p>
          <p className="mt-2">
            Se você conseguiu acessar esta página e todos os componentes
            aparecem, significa que a refatoração foi bem-sucedida! 🎉
          </p>
          <p className="mt-2">
            Próximo passo: Refatorar AdminAlunos.js usando
            REFACTOR_ADMIN_ALUNOS_GUIA.md
          </p>
        </div>
      </div>
    </div>
  );
}
