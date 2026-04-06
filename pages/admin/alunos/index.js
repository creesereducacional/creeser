import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function ListagemAlunos() {
  const router = useRouter();
  const currentYear = new Date().getFullYear().toString();
  const [abaAtiva, setAbaAtiva] = useState('listar');
  const [alunos, setAlunos] = useState([]);
  const [filteredAlunos, setFilteredAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instituicoes, setInstituicoes] = useState([]);
  const [loadingInstituicoes, setLoadingInstituicoes] = useState(true);
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [loadingAnosLetivos, setLoadingAnosLetivos] = useState(true);
  const [searchNome, setSearchNome] = useState('');
  const [searchMatricula, setSearchMatricula] = useState('');
  const [searchInstituicao, setSearchInstituicao] = useState('');
  const [searchAnoLetivo, setSearchAnoLetivo] = useState('');
  const [searchTurma, setSearchTurma] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchCPF, setSearchCPF] = useState('');

  useEffect(() => {
    carregarAlunos();
    carregarInstituicoes();
    carregarAnosLetivos();
  }, []);

  useEffect(() => {
    filtrarAlunos();
  }, [alunos, searchNome, searchMatricula, searchInstituicao, searchAnoLetivo, searchTurma, searchStatus, searchCPF]);

  const carregarAlunos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/alunos');
      if (response.ok) {
        const data = await response.json();
        setAlunos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarInstituicoes = async () => {
    try {
      setLoadingInstituicoes(true);
      const response = await fetch('/api/instituicoes');

      if (response.ok) {
        const data = await response.json();
        const lista = Array.isArray(data) ? data : [];
        setInstituicoes(lista);
      }
    } catch (error) {
      console.error('Erro ao carregar instituições:', error);
    } finally {
      setLoadingInstituicoes(false);
    }
  };

  const carregarAnosLetivos = async () => {
    try {
      setLoadingAnosLetivos(true);
      const response = await fetch('/api/configuracoes/anos-letivos');

      if (response.ok) {
        const data = await response.json();
        const lista = Array.isArray(data) ? data : [];
        setAnosLetivos(lista);
      }
    } catch (error) {
      console.error('Erro ao carregar anos letivos:', error);
    } finally {
      setLoadingAnosLetivos(false);
    }
  };

  const filtrarAlunos = () => {
    let filtered = alunos;

    if (searchNome) {
      filtered = filtered.filter(a =>
        a.nome.toLowerCase().includes(searchNome.toLowerCase())
      );
    }

    if (searchMatricula) {
      filtered = filtered.filter(a =>
        (a.numero_id && a.numero_id.toString().includes(searchMatricula)) ||
        (a.matricula && a.matricula.toString().includes(searchMatricula))
      );
    }

    if (searchInstituicao) {
      const filtroInstituicao = searchInstituicao.toLowerCase();
      filtered = filtered.filter(a =>
        a.instituicao && a.instituicao.toLowerCase().includes(filtroInstituicao)
      );
    }

    if (searchAnoLetivo) {
      const filtroAno = searchAnoLetivo.toString();
      filtered = filtered.filter(a => {
        const ano = a.anoLetivo ?? a.ano_letivo ?? a.anoLetivoAtual ?? a.ano;
        if (ano === null || ano === undefined) return false;
        return ano.toString() === filtroAno;
      });
    }

    if (searchTurma) {
      filtered = filtered.filter(a =>
        a.turma && a.turma.toLowerCase().includes(searchTurma.toLowerCase())
      );
    }

    if (searchCPF) {
      filtered = filtered.filter(a =>
        a.cpf && a.cpf.includes(searchCPF)
      );
    }

    if (searchStatus) {
      filtered = filtered.filter(a => a.status === searchStatus);
    }

    setFilteredAlunos(filtered);
  };

  const deletarAluno = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este aluno?')) return;

    try {
      const response = await fetch(`/api/alunos/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAlunos(alunos.filter(a => a.id !== id));
        alert('Aluno deletado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao deletar aluno:', error);
      alert('Erro ao deletar aluno');
    }
  };

  const limparFiltros = () => {
    setSearchNome('');
    setSearchMatricula('');
    setSearchInstituicao('');
    setSearchAnoLetivo('');
    setSearchTurma('');
    setSearchStatus('');
    setSearchCPF('');
  };

  const abrirContratoAluno = (alunoId) => {
    if (!alunoId) {
      alert('Aluno não identificado para gerar contrato');
      return;
    }

    window.open(`/admin/alunos/contrato/${alunoId}?autoprint=1`, '_blank', 'noopener,noreferrer');
  };

  const iniciarAssinaturaDigital = async (alunoId) => {
    if (!alunoId) {
      alert('Aluno não identificado para assinatura digital');
      return;
    }

    try {
      const response = await fetch(`/api/contratos/aluno/${alunoId}/assinar-digital`, {
        method: 'POST'
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao iniciar assinatura digital');
      }

      const signingUrls = Array.isArray(data?.signingUrls) ? data.signingUrls : [];
      if (signingUrls.length > 0) {
        signingUrls.forEach((item) => {
          const url = typeof item === 'string' ? item : item?.url;
          if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        });

        alert('Assinatura digital iniciada. Os links de assinatura foram abertos em nova aba.');
      } else {
        alert('Assinatura digital iniciada, mas a Assinafy não retornou links de assinatura. Verifique o documento no painel da Assinafy.');
      }
    } catch (error) {
      console.error('Erro ao iniciar assinatura digital:', error);
      alert(error.message || 'Erro ao iniciar assinatura digital');
    }
  };

  const consultarAssinaturaDigital = async (alunoId) => {
    if (!alunoId) {
      alert('Aluno não identificado para consulta de assinatura digital');
      return;
    }

    try {
      const response = await fetch(`/api/contratos/aluno/${alunoId}/assinatura-status`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao consultar assinatura digital');
      }

      const status = String(data?.status || 'desconhecido').toUpperCase();
      const provider = String(data?.provider || 'assinafy').toUpperCase();
      const documentId = data?.providerDocumentId || '-';
      const assignmentId = data?.providerAssignmentId || '-';
      const requestedAt = data?.requestedAt
        ? new Date(data.requestedAt).toLocaleString('pt-BR')
        : '-';
      const syncWarning = data?.syncWarning ? `\nAviso de sincronização: ${data.syncWarning}` : '';

      alert(
        `Assinatura Digital (${provider})\n\n` +
        `Status: ${status}\n` +
        `Documento: ${documentId}\n` +
        `Assignment: ${assignmentId}\n` +
        `Solicitado em: ${requestedAt}${syncWarning}`
      );
    } catch (error) {
      console.error('Erro ao consultar assinatura digital:', error);
      alert(error.message || 'Erro ao consultar assinatura digital');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">👨‍🎓</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gerenciar Alunos</h1>
          </div>
        </div>

        {/* Abas - Listar, Inserir e Importação */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button 
            onClick={() => setAbaAtiva('listar')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 transition ${
              abaAtiva === 'listar' 
                ? 'text-teal-600 border-b-2 border-teal-600' 
                : 'text-gray-500 hover:text-teal-600'
            }`}
          >
            📋 Listar
          </button>
          <Link href="/admin/alunos/novo">
            <button className="px-6 py-3 text-gray-500 hover:text-teal-600 font-semibold flex items-center gap-2 transition">
              ➕ Inserir
            </button>
          </Link>
          <button 
            onClick={() => setAbaAtiva('importacao')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 transition ${
              abaAtiva === 'importacao' 
                ? 'text-teal-600 border-b-2 border-teal-600' 
                : 'text-gray-500 hover:text-teal-600'
            }`}
          >
            📥 Importação
          </button>
        </div>

        {/* ABA LISTAR - Filtro de Busca e Listagem */}
        {abaAtiva === 'listar' && (
          <>
            {/* Filtro de Busca */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 md:p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-teal-600 text-xl">🔍</span>
                <h2 className="text-lg font-semibold text-gray-700">Filtro de Busca</h2>
              </div>

              <div className="space-y-4">
                {/* Linha 1: Instituição, Ano Letivo, Turma, Status */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">INSTITUIÇÃO</label>
                    <select
                      value={searchInstituicao}
                      onChange={(e) => setSearchInstituicao(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                    >
                      <option value="">- Instituição -</option>
                      {loadingInstituicoes ? (
                        <option value="" disabled>Carregando...</option>
                      ) : instituicoes.length > 0 ? (
                        instituicoes.map((inst) => (
                          <option key={inst.id || inst.nome} value={inst.nome}>
                            {inst.nome}
                          </option>
                        ))
                      ) : (
                        <option value="CREESER">CREESER</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">ANO LETIVO</label>
                    <select
                      value={searchAnoLetivo}
                      onChange={(e) => setSearchAnoLetivo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                    >
                      <option value="">- Escolha o ano letivo -</option>
                      {loadingAnosLetivos ? (
                        <option value="" disabled>Carregando...</option>
                      ) : anosLetivos.length > 0 ? (
                        anosLetivos.map((ano) => {
                          const valorAno = (ano.nome ?? ano.ano ?? '').toString();
                          if (!valorAno) return null;
                          return (
                            <option key={ano.id || valorAno} value={valorAno}>
                              {valorAno}
                            </option>
                          );
                        })
                      ) : (
                        <option value={currentYear}>{currentYear}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">TURMA</label>
                    <select
                      value={searchTurma}
                      onChange={(e) => setSearchTurma(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                    >
                      <option value="">Selecione a turma</option>
                      <option value="1A">1A</option>
                      <option value="1B">1B</option>
                      <option value="2A">2A</option>
                      <option value="2B">2B</option>
                      <option value="3A">3A</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">STATUS</label>
                    <select
                      value={searchStatus}
                      onChange={(e) => setSearchStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                    >
                      <option value="">- Todos -</option>
                      <option value="ATIVO">ATIVO</option>
                      <option value="INATIVO">INATIVO</option>
                    </select>
                  </div>
                </div>

                {/* Linha 2: Nome/Matrícula e CPF */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">NOME OU MATRÍCULA</label>
                    <input
                      type="text"
                      placeholder="Nome do aluno ou Número de Matrícula"
                      value={searchNome || searchMatricula}
                      onChange={(e) => {
                        setSearchNome(e.target.value);
                        setSearchMatricula(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">CPF</label>
                    <input
                      type="text"
                      placeholder="CPF do aluno"
                      value={searchCPF}
                      onChange={(e) => setSearchCPF(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={limparFiltros}
                      className="w-full px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm"
                    >
                      LIMPAR
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Listagem */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  📚 Listagem de Alunos
                </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Quantidade de Alunos: <strong>{filteredAlunos.length}</strong>
              </span>
              <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition text-sm">
                IMPRIMIR
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Carregando...</div>
          ) : filteredAlunos.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Nenhum aluno encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-teal-100 border-b border-teal-300">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">#ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">A. Letivo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Turma</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Matrícula</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-teal-800 border-r border-teal-300">Nome</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-teal-800">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlunos.map((aluno) => (
                    <tr key={aluno.id} className="border-b border-gray-200 hover:bg-teal-50 transition">
                      <td className="px-4 py-3 text-sm font-bold text-teal-700 border-r border-gray-200">#{aluno.numero_id || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{aluno.ano_letivo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{aluno.turmaid || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{aluno.numero_id || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-semibold border-r border-gray-200">{aluno.nome}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <Link href={`/admin/alunos/${aluno.id}`}>
                            <button
                              className="p-2 text-blue-600 hover:text-blue-800 transition"
                              title="Editar"
                            >
                              ✏️
                            </button>
                          </Link>
                          <button
                            onClick={() => window.print()}
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Imprimir"
                          >
                            🖨️
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Resetar Senha"
                          >
                            🔑
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Pesquisar"
                          >
                            🔍
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Configurar"
                          >
                            ⚙️
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Compartilhar"
                          >
                            🔗
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Megafone"
                          >
                            📢
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Armazenamento"
                          >
                            ☁️
                          </button>
                          <button
                            onClick={() => abrirContratoAluno(aluno.id)}
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Contrato para impressão"
                          >
                            📄
                          </button>
                          <button
                            onClick={() => iniciarAssinaturaDigital(aluno.id)}
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Iniciar assinatura digital"
                          >
                            🔒
                          </button>
                          <button
                            onClick={() => consultarAssinaturaDigital(aluno.id)}
                            className="p-2 text-gray-600 hover:text-gray-800 transition"
                            title="Consultar status da assinatura digital"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => deletarAluno(aluno.id)}
                            className="p-2 text-red-600 hover:text-red-800 transition"
                            title="Deletar"
                          >
                            ❌
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </div>
          </>
        )}

        {/* ABA IMPORTAÇÃO */}
        {abaAtiva === 'importacao' && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            {/* Cabeçalho */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-teal-600 mb-2 flex items-center gap-2">
                📥 Envio de Arquivo para Importação de Alunos
              </h2>
              <p className="text-sm text-gray-600">Selecione a turma e o arquivo de alunos para importar</p>
            </div>

            {/* Seção de Configuração */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
              <h3 className="text-lg font-bold text-teal-600 mb-4">Configuração</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">TURMA</label>
                  <select className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50">
                    <option value="">Selecione a turma</option>
                    <option value="1A">1A</option>
                    <option value="1B">1B</option>
                    <option value="2A">2A</option>
                    <option value="2B">2B</option>
                    <option value="3A">3A</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">ANO LETIVO</label>
                  <select className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50">
                    <option value="">Escolha o ano letivo</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
              </div>

              {/* Área de Upload */}
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">ARQUIVO EXCEL</label>
                <div className="border-2 border-dashed border-teal-300 rounded-lg p-6 text-center cursor-pointer hover:bg-teal-50 transition">
                  <input type="file" className="hidden" accept=".xlsx,.xls,.csv" />
                  <div className="text-gray-500">
                    <p className="text-sm">Clique ou arraste o arquivo aqui</p>
                    <p className="text-xs text-gray-400 mt-1">Nenhum arquivo 😢</p>
                  </div>
                </div>
              </div>
            </div>

            {/* DICAS */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                ⚠️ DICAS
              </h4>
              <ul className="text-sm text-yellow-900 space-y-1">
                <li>• Verifique as <strong>Regras de Importação</strong> antes de enviar o arquivo</li>
                <li>• Use o <strong>Arquivo Modelo (Vazio)</strong> como base para estruturar seu arquivo</li>
                <li>• Certifique-se de selecionar a turma e o ano letivo corretos</li>
                <li>• Apenas arquivos Excel (.xlsx, .xls) ou CSV são aceitos</li>
              </ul>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-4 mb-6">
              <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-sm">
                IMPORTAR ALUNOS
              </button>
              <button className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition text-sm">
                ATUALIZAR LISTA DE ARQUIVOS
              </button>
            </div>

            {/* Resultados */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-teal-600 mb-4">Resultado da Importação</h3>
              <div className="text-center text-gray-500 py-6">
                <p>Nenhuma informação foi localizada em nossa Base de Dados</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
