import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';
import CustomModal from '../../../components/CustomModal';
import ModalPreviewContrato from '@/components/ModalPreviewContrato';

export default function EditarTurma() {
  const router = useRouter();
  const { id } = router.query;
  const [opcoes, setOpcoes] = useState({ instituicoes: [], unidades: [], cursos: [], grades: [], contratos: [] });
  const [loadingOpcoes, setLoadingOpcoes] = useState(true);
  const [showPreviewContrato, setShowPreviewContrato] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    instituicaoId: '',
    unidadeId: '',
    cursoId: '',
    gradeId: '',
    contratoId: '',
    cargaHoraria: '',
    processoSeletivo: '',
    edittalProcessoSeletivo: '',
    turno: '',
    tipo: 'Boleto',
    mensalidade: '',
    desconto: '',
    inscricao: '',
    matricula: '',
    contaRecebimento: '',
    mesesContrato: '',
    limiteCadastroAlunos: '',
    iesRegistradoraDiploma: '',
    situacao: 'ATIVO',
  });
  const [originalGradeId, setOriginalGradeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    redirectTo: null,
  });

  const abrirModal = (title, message, type = 'success', redirectTo = null) => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      redirectTo,
    });
  };

  const fecharModal = () => {
    const redirectTo = modal.redirectTo;
    setModal((prev) => ({
      ...prev,
      isOpen: false,
      redirectTo: null,
    }));

    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  useEffect(() => {
    if (id) {
      carregarTurma();
    }
  }, [id]);

  useEffect(() => {
    carregarOpcoes(formData.instituicaoId, formData.unidadeId);
  }, [formData.instituicaoId, formData.unidadeId]);

  useEffect(() => {
    if (!opcoes.unidades.length && !opcoes.cursos.length && !opcoes.grades.length) {
      return;
    }

    setFormData((prev) => {
      const proximo = { ...prev };

      if (!proximo.unidadeId && proximo.unidade) {
        const unidadeEncontrada = opcoes.unidades.find((item) => item.nome === proximo.unidade);
        if (unidadeEncontrada) {
          proximo.unidadeId = String(unidadeEncontrada.id);
        }
      }

      if (!proximo.instituicaoId) {
        const unidadeDaTurma = opcoes.unidades.find((item) => String(item.id) === String(proximo.unidadeId));
        const instituicaoViaUnidade = String(unidadeDaTurma?.instituicaoId || unidadeDaTurma?.instituicao_id || '');

        if (instituicaoViaUnidade) {
          proximo.instituicaoId = instituicaoViaUnidade;
        }
      }

      if (!proximo.instituicaoId && proximo.instituicao) {
        const instituicaoEncontrada = opcoes.instituicoes.find((item) => item.nome === proximo.instituicao);
        if (instituicaoEncontrada) {
          proximo.instituicaoId = String(instituicaoEncontrada.id);
        }
      }

      if (!proximo.cursoId && proximo.curso) {
        const cursoEncontrado = opcoes.cursos.find((item) => item.nome === proximo.curso);
        if (cursoEncontrado) {
          proximo.cursoId = String(cursoEncontrado.id);
        }
      }

      if (!proximo.gradeId && proximo.grade) {
        const gradeEncontrada = opcoes.grades.find((item) => item.nome === proximo.grade);
        if (gradeEncontrada) {
          proximo.gradeId = String(gradeEncontrada.id);
        }
      }

      return proximo;
    });
  }, [opcoes]);

  const carregarTurma = async () => {
    try {
      const res = await fetch(`/api/turmas/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          ...data,
          instituicaoId: data.instituicaoId ? String(data.instituicaoId) : '',
          unidadeId: data.unidadeId ? String(data.unidadeId) : '',
          cursoId: data.cursoId ? String(data.cursoId) : '',
          gradeId: data.gradeId ? String(data.gradeId) : '',
        }));
        if (data.gradeId) {
          setOriginalGradeId(String(data.gradeId));
        }
      } else {
        alert('Turma não encontrada');
        router.push('/admin/turmas');
      }
    } catch (error) {
      console.error('Erro ao carregar turma:', error);
      alert('Erro ao carregar turma');
    } finally {
      setLoading(false);
    }
  };

  const carregarOpcoes = async (instituicaoId = '', unidadeId = '') => {
    try {
      setLoadingOpcoes(true);
      const params = new URLSearchParams();
      if (instituicaoId) {
        params.set('instituicaoId', instituicaoId);
      }
      if (unidadeId) {
        params.set('unidadeId', unidadeId);
      }

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/turmas/opcoes${query}`);
      if (!res.ok) return;

      const data = await res.json();
      setOpcoes({
        instituicoes: Array.isArray(data.instituicoes) ? data.instituicoes : [],
        unidades: Array.isArray(data.unidades) ? data.unidades : [],
        cursos: Array.isArray(data.cursos) ? data.cursos : [],
        grades: Array.isArray(data.grades) ? data.grades : [],
        contratos: Array.isArray(data.contratos) ? data.contratos : [],
      });
    } catch (error) {
      console.error('Erro ao carregar opções de turmas:', error);
    } finally {
      setLoadingOpcoes(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'instituicaoId') {
      setFormData((prev) => ({
        ...prev,
        instituicaoId: value,
        unidadeId: '',
        cursoId: '',
        gradeId: '',
      }));
      return;
    }

    if (name === 'unidadeId') {
      setFormData((prev) => ({
        ...prev,
        unidadeId: value,
        cursoId: '',
        gradeId: '',
      }));
      return;
    }

    if (name === 'cursoId') {
      setFormData((prev) => ({
        ...prev,
        cursoId: value,
        gradeId: '',
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!formData.instituicaoId) {
        alert('A instituição da turma é obrigatória');
        setSaving(false);
        return;
      }

      const instituicaoSelecionada = opcoes.instituicoes.find((item) => item.id?.toString() === formData.instituicaoId);
      const unidadeSelecionada = opcoes.unidades.find((item) => item.id?.toString() === formData.unidadeId);
      const cursoSelecionado = opcoes.cursos.find((item) => item.id?.toString() === formData.cursoId);
      const gradeSelecionada = opcoes.grades.find((item) => item.id?.toString() === formData.gradeId);

      const payload = {
        ...formData,
        instituicao: instituicaoSelecionada?.nome || '',
        unidade: unidadeSelecionada?.nome || '',
        curso: cursoSelecionado?.nome || '',
        grade: gradeSelecionada?.nome || '',
      };

      const res = await fetch(`/api/turmas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Turma atualizada com sucesso!');
        router.push('/admin/turmas');
      } else {
        alert('Erro ao atualizar turma');
      }
    } catch (error) {
      console.error('Erro ao atualizar turma:', error);
      alert('Erro ao atualizar turma');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 text-center">Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📚</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Editar Turma</h1>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção: Configuração Básica */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Configuração Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">INSTITUIÇÃO *</label>
                <select
                  name="instituicaoId"
                  value={formData.instituicaoId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione a Instituição</option>
                  {loadingOpcoes ? (
                    <option value="" disabled>Carregando...</option>
                  ) : (
                    opcoes.instituicoes
                      .filter((instituicao) => instituicao.ativa !== false)
                      .map((instituicao) => (
                        <option key={instituicao.id} value={instituicao.id}>
                          {instituicao.nome}
                        </option>
                      ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">UNIDADE *</label>
                <select
                  name="unidadeId"
                  value={formData.unidadeId}
                  onChange={handleChange}
                  required
                  disabled={!formData.instituicaoId || loadingOpcoes}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">{formData.instituicaoId ? 'Selecione a Unidade' : 'Selecione a instituição primeiro'}</option>
                  {loadingOpcoes ? (
                    <option value="" disabled>Carregando...</option>
                  ) : (
                    opcoes.unidades.map((unidade) => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.nome}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CURSO *</label>
                <select
                  name="cursoId"
                  value={formData.cursoId}
                  onChange={handleChange}
                  required
                  disabled={!formData.unidadeId || loadingOpcoes}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">{formData.unidadeId ? 'Selecione o Curso' : 'Selecione a unidade primeiro'}</option>
                  {loadingOpcoes ? (
                    <option value="" disabled>Carregando...</option>
                  ) : (
                    opcoes.cursos.map((curso) => (
                      <option key={curso.id} value={curso.id}>
                        {curso.nome}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">GRADE *</label>
                <select
                  name="gradeId"
                  value={formData.gradeId}
                  onChange={handleChange}
                  required
                  disabled={Boolean(originalGradeId) || !formData.cursoId || loadingOpcoes}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.cursoId ? 'Selecione a Grade' : 'Selecione o curso primeiro'}</option>
                  {loadingOpcoes ? (
                    <option value="" disabled>Carregando...</option>
                  ) : (
                    opcoes.grades
                      .filter((grade) => !formData.cursoId || !grade.cursoid || grade.cursoid?.toString() === formData.cursoId)
                      .map((grade) => (
                        <option key={grade.id} value={grade.id}>
                          {grade.nome}
                        </option>
                      ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">NOME *</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  placeholder="Nome da turma"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">TURNO *</label>
                <select
                  name="turno"
                  value={formData.turno}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Selecione o turno</option>
                  <option value="Matutino">Matutino</option>
                  <option value="Vespertino">Vespertino</option>
                  <option value="Noturno">Noturno</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção: Carga Horária */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Carga Horária</h3>
            
            <input
              type="text"
              name="cargaHoraria"
              value={formData.cargaHoraria}
              onChange={handleChange}
              placeholder="Ex: 400 horas"
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
            />
          </div>

          {/* Seção: Processo Seletivo */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Processo Seletivo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">PROCESSO SELETIVO</label>
                <input
                  type="date"
                  name="processoSeletivo"
                  value={formData.processoSeletivo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">EDITAL PROCESSO SELETIVO</label>
                <input
                  type="text"
                  name="edittalProcessoSeletivo"
                  value={formData.edittalProcessoSeletivo}
                  onChange={handleChange}
                  placeholder="Número do edital"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Dados Financeiros */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Dados Financeiros</h3>
            
            <div className="mb-4">
              <label className="text-xs font-medium text-teal-600 mb-2 block">TIPO DE COBRANÇA</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipo"
                    value="Boleto"
                    checked={formData.tipo === 'Boleto'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Boleto</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipo"
                    value="Em mãos/Recibo"
                    checked={formData.tipo === 'Em mãos/Recibo'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Em mãos/Recibo</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">MENSALIDADE</label>
                <input
                  type="text"
                  name="mensalidade"
                  value={formData.mensalidade}
                  onChange={handleChange}
                  placeholder="R$ 00,00"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">DESCONTO</label>
                <input
                  type="text"
                  name="desconto"
                  value={formData.desconto}
                  onChange={handleChange}
                  placeholder="R$ 00,00"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">MATRÍCULA</label>
                <input
                  type="text"
                  name="matricula"
                  value={formData.matricula}
                  onChange={handleChange}
                  placeholder="R$ 00,00"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">INSCRIÇÃO</label>
                <input
                  type="text"
                  name="inscricao"
                  value={formData.inscricao}
                  onChange={handleChange}
                  placeholder="R$ 00,00"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">CONTA DE RECEBIMENTO</label>
                <select
                  name="contaRecebimento"
                  value={formData.contaRecebimento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                >
                  <option value="">Defina uma Conta Cedente</option>
                  <option value="Conta 1">Conta 1</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">QTD. MESES CONTRATO</label>
                <input
                  type="text"
                  name="mesesContrato"
                  value={formData.mesesContrato}
                  onChange={handleChange}
                  placeholder="Ex. 12"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">LIMITE PARA CADASTRO DE ALUNOS</label>
                <input
                  type="number"
                  name="limiteCadastroAlunos"
                  value={formData.limiteCadastroAlunos}
                  onChange={handleChange}
                  placeholder="Ex. 50"
                  className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Seção: Contrato da Turma */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4 flex items-center gap-2">
              📄 Contrato da Turma
            </h3>

            {(!Array.isArray(opcoes.contratos) || opcoes.contratos.length === 0) ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium">
                Nenhum modelo de contrato cadastrado para esta instituição.
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-teal-600 mb-1 block">MODELO DE CONTRATO *</label>
                <div className="flex gap-2">
                  <select
                    name="contratoId"
                    value={formData.contratoId}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                  >
                    <option value="">Selecione o Modelo de Contrato</option>
                    {opcoes.contratos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.padrao ? '(Padrão)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowPreviewContrato(true)}
                    className="px-4 py-2 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-300 rounded-lg hover:bg-teal-100 flex items-center gap-1 transition cursor-pointer"
                  >
                    👁 Visualizar
                  </button>
                </div>

                {(() => {
                  if (!Array.isArray(opcoes.contratos)) return null;
                  const contratoSel = opcoes.contratos.find((c) => String(c.id) === String(formData.contratoId));
                  if (!contratoSel) return null;

                  return (
                    <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 shadow-inner">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">📌 {contratoSel.nome}</span>
                          {contratoSel.padrao && (
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] rounded-full">
                              Modelo Padrão
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-semibold text-[10px] rounded-full uppercase">
                          {contratoSel.status || 'Ativo'}
                        </span>
                      </div>

                      {contratoSel.descricao && (
                        <p className="text-slate-600 italic border-l-2 border-slate-300 pl-2 py-0.5">
                          "{contratoSel.descricao}"
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>
                          📅 Última atualização:{' '}
                          {contratoSel.updatedAt
                            ? new Date(contratoSel.updatedAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : '-'}
                        </span>
                        {contratoSel.qtdPlaceholders !== undefined && (
                          <span>🧩 {contratoSel.qtdPlaceholders} variáveis configuradas</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Seção: Registro */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Registro</h3>
            
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">IES REGISTRADORA DO DIPLOMA</label>
              <select
                name="iesRegistradoraDiploma"
                value={formData.iesRegistradoraDiploma}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
              >
                <option value="">Defina uma Opção</option>
                <option value="Opção 1">Opção 1</option>
              </select>
            </div>
          </div>

          {/* Seção: Status */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-bold text-teal-600 mb-4">Status</h3>
            
            <select
              name="situacao"
              value={formData.situacao}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
            >
              <option value="ATIVO">ATIVO</option>
              <option value="INATIVO">INATIVO</option>
            </select>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 justify-start">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm disabled:opacity-50"
            >
              {saving ? 'SALVANDO...' : 'SALVAR'}
            </button>
            <Link href="/admin/turmas">
              <button
                type="button"
                className="px-8 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition text-sm"
              >
                CANCELAR
              </button>
            </Link>
          </div>
        </form>
      </div>

      <CustomModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={fecharModal}
      />

      <ModalPreviewContrato
        isOpen={showPreviewContrato}
        onClose={() => setShowPreviewContrato(false)}
        contratoId={formData.contratoId}
        instituicaoNome={opcoes.instituicoes.find((i) => String(i.id) === String(formData.instituicaoId))?.nome}
      />
    </DashboardLayout>
  );
}
