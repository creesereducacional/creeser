import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import BarraFiltros from '@/components/AdminFinanceiro/BarraFiltros';
import ModalContratoAluno from '@/components/ModalContratoAluno';
import ModalRematricula from '@/components/ModalRematricula';
import ConfirmModal from '@/components/ConfirmModal';

export default function ListagemAlunos() {
  const router = useRouter();
  const currentYear = new Date().getFullYear().toString();
  const [abaAtiva, setAbaAtiva] = useState('listar');
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalContratoAluno, setModalContratoAluno] = useState(null);
  const [modalRematricula, setModalRematricula] = useState(null);
  const [modalDelete, setModalDelete] = useState({ isOpen: false, id: null, nome: '' });

  // Opções para os filtros
  const [unidades, setUnidades] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [anosLetivos, setAnosLetivos] = useState([]);

  // Estados dos filtros
  const [searchVal, setSearchVal] = useState('');
  const [statusVal, setStatusVal] = useState('');
  const [unidadeVal, setUnidadeVal] = useState('');
  const [cursoVal, setCursoVal] = useState('');
  const [turmaVal, setTurmaVal] = useState('');
  const [anoLetivoVal, setAnoLetivoVal] = useState('');

  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    carregarAlunos();
    carregarOpcoesFiltros();
  }, []);

  const carregarAlunos = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const response = await fetch('/api/alunos');
      const data = await response.json().catch(() => null);

      if (response.ok) {
        setAlunos(Array.isArray(data) ? data : []);
      } else {
        const msg = data?.message || data?.error || `Erro ${response.status} ao carregar alunos.`;
        setErrorMsg(msg);
        console.error('❌ Falha ao carregar alunos:', msg);
        setAlunos([]);
      }
    } catch (error) {
      console.error('❌ Erro de conexão ao carregar alunos:', error);
      setErrorMsg(error.message || 'Falha de comunicação com o servidor.');
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarOpcoesFiltros = async () => {
    try {
      const [resOpcoes, resTurmas, resCursos, resAnos] = await Promise.all([
        fetch('/api/turmas/opcoes'),
        fetch('/api/turmas'),
        fetch('/api/cursos'),
        fetch('/api/configuracoes/anos-letivos'),
      ]);

      if (resOpcoes.ok) {
        const data = await resOpcoes.json();
        if (Array.isArray(data.unidades)) setUnidades(data.unidades);
      }

      if (resTurmas.ok) {
        const data = await resTurmas.json();
        setTurmas(Array.isArray(data) ? data : (data.turmas || []));
      }

      if (resCursos.ok) {
        const data = await resCursos.json();
        setCursos(Array.isArray(data) ? data : (data.cursos || []));
      }

      if (resAnos.ok) {
        const data = await resAnos.json();
        const lista = Array.isArray(data)
          ? data.map(a => (a.nome ?? a.ano ?? '').toString()).filter(Boolean)
          : [];
        setAnosLetivos([...new Set(lista)].sort());
      }
    } catch (error) {
      console.error('Erro ao carregar opções de filtros:', error);
    }
  };

  // Filtragem dinâmica de turmas baseada no curso / unidade selecionados
  const turmasFiltradasOpcoes = useMemo(() => {
    let list = turmas;
    if (cursoVal) {
      list = list.filter(t => String(t.cursoId || t.cursoid || t.curso_id) === String(cursoVal));
    }
    if (unidadeVal) {
      list = list.filter(t => String(t.unidadeId || t.unidadeid || t.unidade_id) === String(unidadeVal));
    }
    return list;
  }, [turmas, cursoVal, unidadeVal]);

  const limparFiltros = () => {
    setSearchVal('');
    setStatusVal('');
    setUnidadeVal('');
    setCursoVal('');
    setTurmaVal('');
    setAnoLetivoVal('');
  };

  // Filtragem dos registros de alunos / matrículas
  const filteredAlunos = useMemo(() => {
    return alunos.filter((aluno) => {
      // 1. Busca por Texto: Nome, Matrícula, CPF, Responsável
      if (searchVal && searchVal.trim()) {
        const term = searchVal.trim().toLowerCase();
        const nome = String(aluno.nome || '').toLowerCase();
        const cpf = String(aluno.cpf || '').replace(/\D/g, '');
        const matNum = String(aluno.numero_id || aluno.matricula_codigo || aluno.matricula || '').toLowerCase();
        const respNome = String(aluno.nome_responsavel || aluno.responsavel || aluno.mae || aluno.pai || '').toLowerCase();

        const matchNome = nome.includes(term);
        const matchCpf = cpf.includes(term.replace(/\D/g, '')) || String(aluno.cpf || '').toLowerCase().includes(term);
        const matchMat = matNum.includes(term);
        const matchResp = respNome.includes(term);

        if (!matchNome && !matchCpf && !matchMat && !matchResp) {
          return false;
        }
      }

      // 2. Filtro de Status
      if (statusVal) {
        const statusAtual = String(aluno.status || aluno.status_administrativo || aluno.statusmatricula || '').toUpperCase();
        if (statusAtual !== statusVal.toUpperCase()) {
          return false;
        }
      }

      // 3. Filtro de Unidade
      if (unidadeVal) {
        const unidId = String(aluno.unidade_id || aluno.unidadeId || '');
        if (unidId !== String(unidadeVal)) {
          return false;
        }
      }

      // 4. Filtro de Curso
      if (cursoVal) {
        const cId = String(aluno.curso_id || aluno.cursoid || aluno.cursoId || '');
        if (cId !== String(cursoVal)) {
          return false;
        }
      }

      // 5. Filtro de Turma
      if (turmaVal) {
        const tId = String(aluno.turma_id || aluno.turmaid || aluno.turmaId || '');
        if (tId !== String(turmaVal)) {
          return false;
        }
      }

      // 6. Filtro de Ano Letivo
      if (anoLetivoVal) {
        const aLet = String(aluno.ano_letivo ?? aluno.anoLetivo ?? aluno.ano ?? '');
        if (aLet !== String(anoLetivoVal)) {
          return false;
        }
      }

      return true;
    });
  }, [alunos, searchVal, statusVal, unidadeVal, cursoVal, turmaVal, anoLetivoVal]);

  const solicitarDeletar = (aluno) => {
    setModalDelete({
      isOpen: true,
      id: aluno.id,
      nome: aluno.nome || 'este aluno',
    });
  };

  const executarDeletar = async () => {
    const id = modalDelete.id;
    setModalDelete({ isOpen: false, id: null, nome: '' });
    if (!id) return;

    try {
      const response = await fetch(`/api/alunos/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setAlunos(prev => prev.filter(a => a.id !== id));
      } else {
        alert(data.message || data.error || 'Erro ao excluir aluno do banco de dados.');
      }
    } catch (error) {
      console.error('Erro ao deletar aluno:', error);
      alert('Falha na comunicação ao tentar excluir o aluno.');
    }
  };

  const marcarContratoGerado = async (alunoId) => {
    try {
      await fetch(`/api/contratos/aluno/${alunoId}/marcar-gerado`, {
        method: 'POST',
        credentials: 'include',
      });
      setAlunos(prev => prev.map(a => a.id === alunoId ? { ...a, status_contrato: 'GERADO' } : a));
    } catch (_) {}
  };

  const abrirContratoAluno = (aluno) => {
    if (!aluno?.id) {
      alert('Aluno não identificado para gerar contrato');
      return;
    }

    setModalContratoAluno(aluno);
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

  const StatusBadge = ({ status }) => {
    const cfg = {
      ATIVO:                          { cls: 'bg-green-100 text-green-800 border-green-200',   label: 'Ativo' },
      INATIVO:                        { cls: 'bg-red-100 text-red-800 border-red-200',       label: 'Inativo' },
      PRE_CADASTRO:                   { cls: 'bg-gray-100 text-gray-700 border-gray-200',     label: 'Pré-Cadastro' },
      AGUARDANDO_PAGAMENTO:           { cls: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Ag. Pagamento' },
      AGUARDANDO_PAGAMENTO_MATRICULA: { cls: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Ag. Pagamento' },
      AGUARDANDO_TURMA:               { cls: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Ag. Turma' },
      AGUARDANDO_FORMACAO_TURMA:      { cls: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Ag. Turma' },
      TRANCADO:                       { cls: 'bg-amber-100 text-amber-800 border-amber-200',   label: 'Trancado' },
      DESISTENTE:                     { cls: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Desistente' },
      CANCELADO:                      { cls: 'bg-rose-100 text-rose-800 border-rose-200',     label: 'Cancelado' },
      CONCLUIDO:                      { cls: 'bg-teal-100 text-teal-800 border-teal-200',     label: 'Concluído' },
    }[String(status).toUpperCase()] || { cls: 'bg-gray-100 text-gray-800 border-gray-200', label: status || '—' };

    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <PageHeader
          icon="👨‍🎓"
          title="Gerenciar Alunos"
          subtitle={loading ? 'Carregando...' : `${filteredAlunos.length} registro${filteredAlunos.length !== 1 ? 's' : ''} de matrícula encontrado${filteredAlunos.length !== 1 ? 's' : ''}`}
          breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Alunos' }]}
          actions={
            <Link href="/admin/alunos/novo">
              <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-sm">
                + Novo Aluno
              </button>
            </Link>
          }
        />

        {/* Abas - Listar, Inserir e Importação */}
        <div className="flex gap-2 border-b border-gray-200">
          <button 
            onClick={() => setAbaAtiva('listar')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 transition cursor-pointer ${
              abaAtiva === 'listar' 
                ? 'text-teal-600 border-b-2 border-teal-600' 
                : 'text-gray-500 hover:text-teal-600'
            }`}
          >
            📋 Listar
          </button>
          <Link href="/admin/alunos/novo">
            <button className="px-6 py-3 text-gray-500 hover:text-teal-600 font-semibold flex items-center gap-2 transition cursor-pointer">
              ➕ Inserir
            </button>
          </Link>
          <button 
            onClick={() => setAbaAtiva('importacao')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 transition cursor-pointer ${
              abaAtiva === 'importacao' 
                ? 'text-teal-600 border-b-2 border-teal-600' 
                : 'text-gray-500 hover:text-teal-600'
            }`}
          >
            📥 Importação
          </button>
        </div>

        {/* ABA LISTAR - Barra de Filtros Padronizada e Listagem */}
        {abaAtiva === 'listar' && (
          <div className="space-y-6">
            {/* Barra de Filtros Padronizada */}
            <BarraFiltros
              searchPlaceholder="🔍 Aluno, Matrícula, CPF ou Responsável..."
              searchValue={searchVal}
              onSearchChange={setSearchVal}
              statusValue={statusVal}
              onStatusChange={setStatusVal}
              statusOptions={[
                { value: "ATIVO", label: "Ativo" },
                { value: "PRE_CADASTRO", label: "Pré-Cadastro" },
                { value: "AGUARDANDO_PAGAMENTO", label: "Aguardando Pagamento" },
                { value: "AGUARDANDO_TURMA", label: "Aguardando Turma" },
                { value: "TRANCADO", label: "Trancado" },
                { value: "CANCELADO", label: "Cancelado" },
                { value: "DESISTENTE", label: "Desistente" },
                { value: "CONCLUIDO", label: "Concluído" },
                { value: "INATIVO", label: "Inativo" }
              ]}
              unidadeValue={unidadeVal}
              onUnidadeChange={setUnidadeVal}
              unidades={unidades}
              cursoValue={cursoVal}
              onCursoChange={setCursoVal}
              cursos={cursos}
              turmaValue={turmaVal}
              onTurmaChange={setTurmaVal}
              turmas={turmasFiltradasOpcoes}
              anoLetivoValue={anoLetivoVal}
              onAnoLetivoChange={setAnoLetivoVal}
              anosLetivos={anosLetivos}
              onClear={limparFiltros}
            />

            {/* Listagem em Tabela */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  📚 Listagem de Alunos e Matrículas
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Registros Exibidos: <strong>{filteredAlunos.length}</strong>
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center text-gray-500 font-medium">Carregando alunos e matrículas...</div>
              ) : errorMsg ? (
                <div className="p-12 text-center space-y-3">
                  <div className="text-red-500 text-3xl">⚠️</div>
                  <div className="text-gray-800 font-bold">{errorMsg}</div>
                  <button
                    onClick={carregarAlunos}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : filteredAlunos.length === 0 ? (
                <div className="p-12 text-center text-gray-500">Nenhum aluno ou matrícula encontrado com os filtros selecionados.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-teal-50 border-b border-teal-200">
                        <th className="text-left px-4 py-3 text-xs font-bold text-teal-900 border-r border-teal-200">#ID ALUNO</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-teal-900 border-r border-teal-200">Nome do Aluno</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-teal-900 border-r border-teal-200">A. Letivo</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-teal-900 border-r border-teal-200">Turma</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-teal-900 border-r border-teal-200">Curso</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-teal-900 border-r border-teal-200">Matrícula</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-teal-900 border-r border-teal-200">Status</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-teal-900 border-r border-teal-200">Contrato</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-teal-900">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAlunos.map((aluno) => {
                        const rowKey = aluno.matricula_id ? `${aluno.id}-${aluno.matricula_id}` : `${aluno.id}-${aluno.turmaid || 'legado'}`;
                        const turmaNomeExibicao = aluno.turma_nome || aluno.turma || 'Sem turma';
                        const cursoNomeExibicao = aluno.curso_nome || aluno.curso || '—';

                        return (
                          <tr key={rowKey} className="hover:bg-teal-50/50 transition">
                            <td className="px-4 py-3 text-sm font-bold text-teal-800 border-r border-gray-200 whitespace-nowrap">
                              #{aluno.numero_id || aluno.id}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-semibold border-r border-gray-200">
                              {aluno.nome}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 whitespace-nowrap">
                              {aluno.ano_letivo ?? aluno.anoLetivo ?? '—'}{aluno.semestre ? `/${aluno.semestre}` : ''}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-800 border-r border-gray-200">
                              {turmaNomeExibicao}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                              <div className="flex items-center gap-1.5">
                                <span>{cursoNomeExibicao}</span>
                                {aluno.is_principal === false && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold" title="Matrícula Simultânea Adicional">
                                    Simultâneo
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-700 border-r border-gray-200 whitespace-nowrap">
                              {aluno.matricula_codigo || aluno.matricula || aluno.numero_id || '—'}
                            </td>
                            <td className="px-4 py-3 text-center border-r border-gray-200 whitespace-nowrap">
                              <StatusBadge status={aluno.status || aluno.status_administrativo} />
                            </td>
                            <td className="px-4 py-3 border-r border-gray-200">
                              {/* Badge status_contrato */}
                              {(() => {
                                const sc = aluno.status_contrato || 'NAO_GERADO';
                                const BADGE = {
                                  NAO_GERADO:         'bg-gray-100 text-gray-500 border-gray-300',
                                  GERADO:             'bg-blue-100 text-blue-700 border-blue-300',
                                  ENVIADO_ASSINATURA: 'bg-yellow-100 text-yellow-700 border-yellow-300',
                                  ASSINADO:           'bg-green-100 text-green-700 border-green-300',
                                  RECUSADO:           'bg-red-100 text-red-700 border-red-300',
                                  EXPIRADO:           'bg-orange-100 text-orange-700 border-orange-300',
                                };
                                const LABEL = {
                                  NAO_GERADO:         'Não Gerado',
                                  GERADO:             'Gerado',
                                  ENVIADO_ASSINATURA: 'Enviado',
                                  ASSINADO:           'Assinado',
                                  RECUSADO:           'Recusado',
                                  EXPIRADO:           'Expirado',
                                };
                                return (
                                  <div className="flex flex-col gap-1.5">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${BADGE[sc] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                      {LABEL[sc] || sc}
                                    </span>
                                    <div className="flex gap-1 flex-wrap">
                                      <button
                                        onClick={() => { abrirContratoAluno(aluno); marcarContratoGerado(aluno.id); }}
                                        className="px-1.5 py-0.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                                        title="Gerar contrato"
                                      >Gerar</button>
                                      <button
                                        onClick={() => iniciarAssinaturaDigital(aluno.id)}
                                        className="px-1.5 py-0.5 text-xs rounded border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                        title="Enviar para Assinafy"
                                      >Assinafy</button>
                                      <button
                                        onClick={() => consultarAssinaturaDigital(aluno.id)}
                                        className="px-1.5 py-0.5 text-xs rounded border border-teal-300 text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                                        title="Ver status da assinatura"
                                      >Status</button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                <Link href={`/admin/alunos/${aluno.id}`}>
                                  <button
                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer"
                                    title="Editar Dados do Aluno"
                                  >
                                    ✏️
                                  </button>
                                </Link>
                                <Link href={`/admin/alunos/ficha?id=${aluno.id}`} target="_blank" rel="noopener noreferrer">
                                  <button
                                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition cursor-pointer"
                                    title="Gerar PDF da Ficha do Aluno"
                                  >
                                    🖨️
                                  </button>
                                </Link>
                                <button
                                  className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition cursor-pointer"
                                  title="Resetar Senha"
                                >
                                  🔑
                                </button>
                                <button
                                  onClick={() => abrirContratoAluno(aluno)}
                                  className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition cursor-pointer"
                                  title="Contrato para impressão"
                                >
                                  📄
                                </button>
                                <Link href={`/admin/alunos/historico?id=${aluno.id}`}>
                                  <button
                                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition cursor-pointer"
                                    title="Histórico Escolar"
                                  >
                                    📜
                                  </button>
                                </Link>
                                <Link href={`/admin/alunos/declaracao?id=${aluno.id}&tipo=matricula`}>
                                  <button
                                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition cursor-pointer"
                                    title="Declaração de Matrícula"
                                  >
                                    📝
                                  </button>
                                </Link>
                                <button
                                  onClick={() => setModalRematricula(aluno)}
                                  className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded transition cursor-pointer"
                                  title="Transferência / Rematrícula / Novo Curso"
                                >
                                  🔄
                                </button>
                                <button
                                  onClick={() => solicitarDeletar(aluno)}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition cursor-pointer"
                                  title="Deletar"
                                >
                                  ❌
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA IMPORTAÇÃO */}
        {abaAtiva === 'importacao' && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-teal-600 mb-2 flex items-center gap-2">
                📥 Envio de Arquivo para Importação de Alunos
              </h2>
              <p className="text-sm text-gray-600">Selecione a turma e o arquivo de alunos para importar</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
              <h3 className="text-lg font-bold text-teal-600 mb-4">Configuração</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">TURMA</label>
                  <select className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50">
                    <option value="">Selecione a turma</option>
                    {turmas.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-teal-600 mb-1 block">ANO LETIVO</label>
                  <select className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50">
                    <option value="">Escolha o ano letivo</option>
                    {anosLetivos.map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
              </div>

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

            <div className="flex gap-4 mb-6">
              <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-sm cursor-pointer">
                IMPORTAR ALUNOS
              </button>
            </div>
          </div>
        )}
      </div>

      {modalContratoAluno && (
        <ModalContratoAluno
          isOpen={!!modalContratoAluno}
          onClose={() => setModalContratoAluno(null)}
          alunoId={modalContratoAluno.id}
          alunoNome={modalContratoAluno.nome}
        />
      )}

      {modalRematricula && (
        <ModalRematricula
          isOpen={!!modalRematricula}
          onClose={() => setModalRematricula(null)}
          aluno={modalRematricula}
          onSuccess={() => carregarAlunos()}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={modalDelete.isOpen}
        onClose={() => setModalDelete({ isOpen: false, id: null, nome: '' })}
        onConfirm={executarDeletar}
        title="Excluir Aluno"
        message={`Tem certeza que deseja deletar o aluno "${modalDelete.nome}"? Esta ação não poderá ser desfeita.`}
        type="delete"
      />
    </DashboardLayout>
  );
}

