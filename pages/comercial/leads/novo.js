import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ComercialLayout from '@/components/ComercialLayout';
import PageHeader from '@/components/ui/PageHeader';

const ORIGENS = ['', 'Site', 'Instagram', 'Facebook', 'Google', 'WhatsApp', 'Evento', 'Indicação', 'Outro'];

// Máscara (99) 99999-9999
function maskPhone(value) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2)  return d.replace(/^(\d{0,2})/, '($1');
  if (d.length <= 7)  return d.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

// Máscara CPF
function maskCpf(value) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.replace(/^(\d{3})(\d{0,3})/, '$1.$2');
  if (d.length <= 9) return d.replace(/^(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
}

function emailValido(v) {
  return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function NovoLead() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    whatsapp: '',
    email: '',
    curso_interesse: '',
    curso_id: '',
    turma_id: '',
    origem: '',
    observacoes: '',
    status: 'novo',
    
    // Dados Pessoais do Aluno
    data_nascimento: '',
    nome_mae: '',
    nome_pai: '',
    rg: '',
    cpf: '',
    
    // Endereço
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',

    // Responsável Financeiro
    resp_nome: '',
    resp_cpf: '',
    resp_rg: '',
    resp_telefone: '',
    resp_email: '',
    resp_parentesco: '',
    resp_mesmo_aluno: false,

    // Dados da Matrícula
    ano_letivo: new Date().getFullYear(),
    periodo: '',
    turno: '',
    data_matricula: new Date().toISOString().slice(0, 10),
    matriz_curricular: '',
    unidade_id: '',

    // Plano Financeiro
    valor_inscricao: '',
    valor_mensalidade: '',
    qtd_parcelas: '12',
    dia_vencimento: '10',
    data_primeiro_vencimento: '',
    bolsa_percentual: '',
    bolsa_valor: '',
    convenio: '',
    desconto: '',
    observacoes_financeiras: '',

    // Origem e Equipe
    captador_id: '',

    // Checklist Comercial
    chk_documentacao: false,
    chk_contrato_enviado: false,
    chk_contrato_assinado: false,
    chk_cobranca_enviada: false,
    chk_pagamento_confirmado: false,
    chk_matricula_efetivada: false,
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [emailTocado, setEmailTocado] = useState(false);

  const [instituicoes, setInstituicoes] = useState([]);
  const [instituicaoId, setInstituicaoId] = useState('');
  const [cursos, setCursos] = useState([]);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [turmas, setTurmas] = useState([]);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [equipe, setEquipe] = useState([]);

  // Estados inteligentes de preenchimento automático
  const [semParametroFinanceiro, setSemParametroFinanceiro] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    valor_inscricao: false,
    valor_mensalidade: false,
    qtd_parcelas: false,
    dia_vencimento: false,
    data_primeiro_vencimento: false,
    convenio: false
  });

  // 1. Carrega instituições e equipe comercial ao montar
  useEffect(() => {
    fetch('/api/comercial/instituicoes', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const lista = Array.isArray(data) ? data : [];
        setInstituicoes(lista);
        if (lista.length > 0) setInstituicaoId(String(lista[0].id));
      })
      .catch(() => {});

    fetch('/api/comercial/equipe', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setEquipe(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // 2. Carrega cursos quando a instituição muda e limpa curso_id/turma_id
  useEffect(() => {
    if (!instituicaoId) return;
    setLoadingCursos(true);
    setCursos([]);
    setTurmas([]);
    setSemParametroFinanceiro(false);
    setForm(f => ({ 
      ...f, 
      curso_id: '', 
      curso_interesse: '', 
      turma_id: '', 
      valor_mensalidade: '', 
      valor_inscricao: '',
      matriz_curricular: '',
      unidade_id: ''
    }));
    fetch(`/api/comercial/cursos?instituicao_id=${instituicaoId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCursos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingCursos(false));
  }, [instituicaoId]);

  // 3. Carrega turmas quando o curso muda e limpa turma_id
  useEffect(() => {
    if (!form.curso_id) {
      setTurmas([]);
      setSemParametroFinanceiro(false);
      return;
    }
    setLoadingTurmas(true);
    setForm(f => ({ ...f, turma_id: '' }));
    fetch(`/api/comercial/turmas?cursoid=${form.curso_id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setTurmas(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoadingTurmas(false));
  }, [form.curso_id]);

  // 4. Centraliza lógica de preenchimento automático baseado na Turma selecionada
  const loadTurmaConfiguration = (tId) => {
    if (!tId) {
      setSemParametroFinanceiro(false);
      return;
    }
    const turma = turmas.find(t => String(t.id) === String(tId));
    if (!turma) return;

    // Alerta de parâmetros financeiros vazios
    const temFinanceiro = !!(turma.mensalidade || turma.matricula || turma.mesescontrato);
    setSemParametroFinanceiro(!temFinanceiro);

    setForm(f => {
      const updates = {};

      // DADOS ACADÊMICOS
      if (turma.datainicio) {
        updates.ano_letivo = new Date(turma.datainicio).getFullYear();
        const mes = new Date(turma.datainicio).getMonth() + 1;
        updates.periodo = `${updates.ano_letivo}/${mes <= 6 ? '1' : '2'}`;
        
        // Primeiro vencimento: dia_vencimento no mês seguinte à data de início da turma
        const nextMonth = new Date(turma.datainicio);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(parseInt(f.dia_vencimento || '10'));
        updates.data_primeiro_vencimento = nextMonth.toISOString().slice(0, 10);
      }
      if (turma.turno) {
        updates.turno = turma.turno.toUpperCase();
      }
      if (turma.gradeid) {
        updates.matriz_curricular = String(turma.gradeid);
      }
      if (turma.unidadeid) {
        updates.unidade_id = String(turma.unidadeid);
      }

      // DADOS FINANCEIROS (Preservar se alterado manualmente)
      if (!touchedFields.valor_inscricao) {
        updates.valor_inscricao = turma.matricula || '';
      }
      if (!touchedFields.valor_mensalidade) {
        updates.valor_mensalidade = turma.mensalidade || '';
      }
      if (!touchedFields.qtd_parcelas) {
        updates.qtd_parcelas = turma.mesescontrato || '12';
      }
      if (!touchedFields.dia_vencimento) {
        updates.dia_vencimento = '10';
      }
      if (!touchedFields.convenio && turma.tipocobranca) {
        updates.convenio = turma.tipocobranca;
      }

      return { ...f, ...updates };
    });
  };

  useEffect(() => {
    loadTurmaConfiguration(form.turma_id);
  }, [form.turma_id, turmas]);

  // Sync Responsável Financeiro com Aluno se checkbox marcado
  useEffect(() => {
    if (form.resp_mesmo_aluno) {
      setForm(f => ({
        ...f,
        resp_nome: f.nome,
        resp_cpf: f.cpf,
        resp_rg: f.rg,
        resp_telefone: f.whatsapp || f.telefone,
        resp_email: f.email,
        resp_parentesco: 'O Próprio',
      }));
    }
  }, [form.resp_mesmo_aluno, form.nome, form.cpf, form.rg, form.whatsapp, form.telefone, form.email]);

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));
  
  const setCheck = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.checked }));

  const setPhone = (campo) => (e) => {
    setForm(f => ({ ...f, [campo]: maskPhone(e.target.value) }));
  };

  const setCpf = (campo) => (e) => {
    setForm(f => ({ ...f, [campo]: maskCpf(e.target.value) }));
  };

  const setCurso = (e) => {
    const id = e.target.value;
    const c = cursos.find(c => String(c.id) === id);
    setForm(f => ({ ...f, curso_id: id, curso_interesse: c ? c.nome : '' }));
  };

  // Busca de CEP simplificada
  const handleCepBlur = async () => {
    const cleanCep = form.cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm(f => ({
            ...f,
            endereco: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || '',
          }));
        }
      } catch (_) {}
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return; }
    if (!instituicaoId) { setErro('Instituição é obrigatória.'); return; }
    if (!form.curso_id) { setErro('Curso é obrigatório.'); return; }
    if (!form.turma_id) { setErro('Turma é obrigatória.'); return; }
    if (!emailValido(form.email)) { setErro('E-mail inválido.'); setEmailTocado(true); return; }

    setSalvando(true);
    setErro(null);

    // Preparar Ficha de Matrícula Completa Serializada
    const fichaMatricula = {
      aluno: {
        data_nascimento: form.data_nascimento || null,
        nome_mae: form.nome_mae || null,
        nome_pai: form.nome_pai || null,
        rg: form.rg || null,
        cpf: form.cpf || null,
        endereco: form.endereco || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        cep: form.cep || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
      },
      academico: {
        curso_id: form.curso_id,
        turma_id: form.turma_id,
        instituicao_id: instituicaoId,
        ano_letivo: form.ano_letivo || null,
        periodo: form.periodo || null,
        turno: form.turno || null,
        data_matricula: form.data_matricula || null,
        matriz_curricular: form.matriz_curricular || null,
        unidade_id: form.unidade_id || null,
      },
      responsavel_financeiro: {
        nome: form.resp_nome || null,
        cpf: form.resp_cpf || null,
        rg: form.resp_rg || null,
        telefone: form.resp_telefone || null,
        email: form.resp_email || null,
        parentesco: form.resp_parentesco || null,
        mesmo_aluno: form.resp_mesmo_aluno,
      },
      financeiro: {
        valor_inscricao: form.valor_inscricao || null,
        valor_mensalidade: form.valor_mensalidade || null,
        qtd_parcelas: form.qtd_parcelas || null,
        dia_vencimento: form.dia_vencimento || null,
        data_primeiro_vencimento: form.data_primeiro_vencimento || null,
        bolsa_percentual: form.bolsa_percentual || null,
        bolsa_valor: form.bolsa_valor || null,
        convenio: form.convenio || null,
        desconto: form.desconto || null,
        observacoes_financeiras: form.observacoes_financeiras || null,
      },
      comercial: {
        origem: form.origem || null,
        captador_id: form.captador_id || null,
        checklist: {
          documentacao: form.chk_documentacao,
          contrato_enviado: form.chk_contrato_enviado,
          contrato_assinado: form.chk_contrato_assinado,
          cobranca_enviada: form.chk_cobranca_enviada,
          pagamento_confirmado: form.chk_pagamento_confirmado,
          matricula_efetivada: form.chk_matricula_efetivada,
        }
      }
    };

    const observacoesFinais = `${form.observacoes || ''}\n\n[FICHA_MATRICULA_COMERCIAL]\n${JSON.stringify(fichaMatricula, null, 2)}`;

    try {
      const res = await fetch('/api/comercial/leads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-instituicao-id': instituicaoId },
        body: JSON.stringify({
          nome:            form.nome,
          telefone:        form.telefone,
          whatsapp:        form.whatsapp,
          email:           form.email,
          curso_interesse: form.curso_interesse,
          origem:          form.origem,
          observacoes:     observacoesFinais,
          status:          form.status,
          captado_por_id:  form.captador_id || null
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro ao salvar.'); return; }
      router.push(`/comercial/leads/${data.id}`);
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const renderSugerido = (campo) => {
    if (!touchedFields[campo] && form[campo]) {
      return (
        <span className="text-[10px] text-green-600 font-semibold block mt-1">
          ✓ Valores sugeridos automaticamente
        </span>
      );
    }
    return null;
  };

  const emailInvalido = emailTocado && !emailValido(form.email);
  const inputBase = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 transition-shadow';

  return (
    <ComercialLayout titulo="Ficha de Matrícula Comercial">
      <div className="max-w-4xl w-full mx-auto pb-12">
        <PageHeader
          icon="📝"
          title="Ficha de Matrícula Comercial"
          breadcrumbs={[
            { label: 'Dashboard', href: '/comercial/dashboard' },
            { label: 'Meus Leads', href: '/comercial/leads' },
            { label: 'Ficha de Matrícula' }
          ]}
        />

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">{erro}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SEÇÃO 1: Dados Acadêmicos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
              <span className="text-teal-600">🎓</span> 1. Dados Acadêmicos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Instituição */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Instituição <span className="text-red-500">*</span>
                </label>
                <select
                  value={instituicaoId}
                  onChange={e => setInstituicaoId(e.target.value)}
                  className={inputBase}
                  required
                >
                  {instituicoes.length === 0 && (
                    <option value="">Carregando...</option>
                  )}
                  {instituicoes.map(i => (
                    <option key={i.id} value={String(i.id)}>{i.nome}</option>
                  ))}
                </select>
              </div>

              {/* Curso */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Curso <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.curso_id}
                  onChange={setCurso}
                  disabled={loadingCursos || cursos.length === 0}
                  className={`${inputBase} ${loadingCursos || cursos.length === 0 ? 'text-gray-400 bg-gray-50' : ''}`}
                  required
                >
                  {loadingCursos ? (
                    <option value="">Carregando cursos...</option>
                  ) : cursos.length === 0 ? (
                    <option value="">Nenhum curso disponível</option>
                  ) : (
                    <>
                      <option value="">Selecione o curso...</option>
                      {cursos.map(c => (
                        <option key={c.id} value={String(c.id)}>
                          {c.nome}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Turma */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Turma <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.turma_id}
                  onChange={set('turma_id')}
                  disabled={loadingTurmas || turmas.length === 0}
                  className={`${inputBase} ${loadingTurmas || turmas.length === 0 ? 'text-gray-400 bg-gray-50' : ''}`}
                  required
                >
                  {loadingTurmas ? (
                    <option value="">Carregando turmas...</option>
                  ) : turmas.length === 0 ? (
                    <option value="">Nenhuma turma disponível</option>
                  ) : (
                    <>
                      <option value="">Selecione a turma...</option>
                      {turmas.map(t => (
                        <option key={t.id} value={String(t.id)}>
                          {t.nome} ({t.turno || 'Geral'})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: Dados Pessoais do Aluno */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
              <span className="text-teal-600">👤</span> 2. Dados do Aluno
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={set('nome')}
                  placeholder="Nome completo do aluno"
                  className={inputBase}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={form.data_nascimento}
                  onChange={set('data_nascimento')}
                  className={inputBase}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome da Mãe</label>
                <input
                  type="text"
                  value={form.nome_mae}
                  onChange={set('nome_mae')}
                  placeholder="Nome da mãe completo"
                  className={inputBase}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">RG</label>
                <input
                  type="text"
                  value={form.rg}
                  onChange={set('rg')}
                  placeholder="RG do aluno"
                  className={inputBase}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Pai</label>
                <input
                  type="text"
                  value={form.nome_pai}
                  onChange={set('nome_pai')}
                  placeholder="Nome do pai completo"
                  className={inputBase}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CPF</label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={setCpf('cpf')}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={setPhone('whatsapp')}
                  placeholder="(99) 99999-9999"
                  maxLength={15}
                  className={inputBase}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  onBlur={() => setEmailTocado(true)}
                  placeholder="aluno@exemplo.com"
                  className={`${inputBase} ${emailInvalido ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Residência / Endereço</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CEP</label>
                  <input
                    type="text"
                    value={form.cep}
                    onChange={set('cep')}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    maxLength={9}
                    className={inputBase}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    value={form.endereco}
                    onChange={set('endereco')}
                    placeholder="Avenida, Rua, etc."
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                  <input
                    type="text"
                    value={form.numero}
                    onChange={set('numero')}
                    placeholder="123"
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={form.complemento}
                    onChange={set('complemento')}
                    placeholder="Ap, Bloco, etc."
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={form.bairro}
                    onChange={set('bairro')}
                    placeholder="Centro, etc."
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={set('cidade')}
                    placeholder="São Paulo"
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={form.estado}
                    onChange={set('estado')}
                    placeholder="SP"
                    maxLength={2}
                    className={inputBase}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: Responsável Financeiro */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b pb-2">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-teal-600">🛡️</span> 3. Responsável Financeiro
              </h3>
              <label className="flex items-center gap-2 text-sm font-medium text-teal-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.resp_mesmo_aluno}
                  onChange={setCheck('resp_mesmo_aluno')}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                O aluno é o responsável financeiro
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={form.resp_nome}
                  onChange={set('resp_nome')}
                  disabled={form.resp_mesmo_aluno}
                  placeholder="Nome completo do responsável"
                  className={`${inputBase} ${form.resp_mesmo_aluno ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Parentesco</label>
                <input
                  type="text"
                  value={form.resp_parentesco}
                  onChange={set('resp_parentesco')}
                  disabled={form.resp_mesmo_aluno}
                  placeholder="Pai, Mãe, Cônjuge, etc."
                  className={`${inputBase} ${form.resp_mesmo_aluno ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CPF</label>
                <input
                  type="text"
                  value={form.resp_cpf}
                  onChange={setCpf('resp_cpf')}
                  disabled={form.resp_mesmo_aluno}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`${inputBase} ${form.resp_mesmo_aluno ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">RG</label>
                <input
                  type="text"
                  value={form.resp_rg}
                  onChange={set('resp_rg')}
                  disabled={form.resp_mesmo_aluno}
                  placeholder="RG do responsável"
                  className={`${inputBase} ${form.resp_mesmo_aluno ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone Celular</label>
                <input
                  type="tel"
                  value={form.resp_telefone}
                  onChange={setPhone('resp_telefone')}
                  disabled={form.resp_mesmo_aluno}
                  placeholder="(99) 99999-9999"
                  maxLength={15}
                  className={`${inputBase} ${form.resp_mesmo_aluno ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                <input
                  type="email"
                  value={form.resp_email}
                  onChange={set('resp_email')}
                  disabled={form.resp_mesmo_aluno}
                  placeholder="responsavel@exemplo.com"
                  className={`${inputBase} ${form.resp_mesmo_aluno ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: Dados da Matrícula */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
              <span className="text-teal-600">📅</span> 4. Dados da Matrícula
            </h3>

            {semParametroFinanceiro && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-center gap-2">
                <span>⚠️</span>
                <span>Esta turma ainda não possui parâmetros financeiros configurados no módulo acadêmico.</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Ano Letivo */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ano Letivo</label>
                <input
                  type="number"
                  value={form.ano_letivo}
                  onChange={set('ano_letivo')}
                  className={inputBase}
                />
                {form.turma_id && renderSugerido('ano_letivo')}
              </div>

              {/* Período */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Período / Semestre</label>
                <input
                  type="text"
                  value={form.periodo}
                  onChange={set('periodo')}
                  placeholder="2026/1"
                  className={inputBase}
                />
                {form.turma_id && renderSugerido('periodo')}
              </div>

              {/* Turno */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Turno</label>
                <select
                  value={form.turno}
                  onChange={set('turno')}
                  className={inputBase}
                >
                  <option value="">Selecione...</option>
                  <option value="INTEGRAL">Integral</option>
                  <option value="MANHA">Manhã</option>
                  <option value="TARDE">Tarde</option>
                  <option value="NOITE">Noite</option>
                </select>
                {form.turma_id && renderSugerido('turno')}
              </div>

              {/* Data Matrícula */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data da Matrícula</label>
                <input
                  type="date"
                  value={form.data_matricula}
                  onChange={set('data_matricula')}
                  className={inputBase}
                />
              </div>

              {/* Matriz Curricular */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Matriz Curricular (ID)</label>
                <input
                  type="text"
                  value={form.matriz_curricular}
                  onChange={set('matriz_curricular')}
                  placeholder="Matriz"
                  className={inputBase}
                />
                {form.turma_id && renderSugerido('matriz_curricular')}
              </div>

              {/* Unidade */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Unidade (ID)</label>
                <input
                  type="text"
                  value={form.unidade_id}
                  onChange={set('unidade_id')}
                  placeholder="Unidade"
                  className={inputBase}
                />
                {form.turma_id && renderSugerido('unidade_id')}
              </div>
            </div>
          </div>

          {/* SEÇÃO 5: Plano Financeiro */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
              <span className="text-teal-600">💵</span> 5. Plano Financeiro
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Valor Inscrição */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor da Inscrição (Matrícula)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor_inscricao}
                  onChange={e => {
                    setForm(f => ({ ...f, valor_inscricao: e.target.value }));
                    setTouchedFields(t => ({ ...t, valor_inscricao: true }));
                  }}
                  placeholder="R$ 150,00"
                  className={inputBase}
                />
                {form.turma_id && renderSugerido('valor_inscricao')}
              </div>

              {/* Valor Mensalidade */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor da Mensalidade</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor_mensalidade}
                  onChange={e => {
                    setForm(f => ({ ...f, valor_mensalidade: e.target.value }));
                    setTouchedFields(t => ({ ...t, valor_mensalidade: true }));
                  }}
                  placeholder="R$ 300,00"
                  className={inputBase}
                />
                {form.turma_id && renderSugerido('valor_mensalidade')}
              </div>

              {/* Parcelas */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Parcelas (Mensalidades)</label>
                <input
                  type="number"
                  value={form.qtd_parcelas}
                  onChange={e => {
                    setForm(f => ({ ...f, qtd_parcelas: e.target.value }));
                    setTouchedFields(t => ({ ...t, qtd_parcelas: true }));
                  }}
                  placeholder="12"
                  className={inputBase}
                />
                {form.turma_id && renderSugerido('qtd_parcelas')}
              </div>

              {/* Dia Vencimento */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dia Vencimento</label>
                <input
                  type="number"
                  value={form.dia_vencimento}
                  onChange={e => {
                    setForm(f => ({ ...f, dia_vencimento: e.target.value }));
                    setTouchedFields(t => ({ ...t, dia_vencimento: true }));
                  }}
                  placeholder="10"
                  className={inputBase}
                />
                {form.turma_id && renderSugerido('dia_vencimento')}
              </div>

              {/* Primeiro Vencimento */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Primeiro Vencimento</label>
                <input
                  type="date"
                  value={form.data_primeiro_vencimento}
                  onChange={e => {
                    setForm(f => ({ ...f, data_primeiro_vencimento: e.target.value }));
                    setTouchedFields(t => ({ ...t, data_primeiro_vencimento: true }));
                  }}
                  className={inputBase}
                />
                {form.turma_id && renderSugerido('data_primeiro_vencimento')}
              </div>

              {/* Bolsa % */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bolsa (%)</label>
                <input
                  type="number"
                  value={form.bolsa_percentual}
                  onChange={set('bolsa_percentual')}
                  placeholder="Ex: 50"
                  className={inputBase}
                />
              </div>

              {/* Bolsa R$ */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bolsa Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.bolsa_valor}
                  onChange={set('bolsa_valor')}
                  placeholder="R$ 0,00"
                  className={inputBase}
                />
              </div>

              {/* Desconto */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Desconto Comercial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.desconto}
                  onChange={set('desconto')}
                  placeholder="R$ 0,00"
                  className={inputBase}
                />
              </div>

              {/* Convênio */}
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Convênio / Parceria</label>
                <input
                  type="text"
                  value={form.convenio}
                  onChange={e => {
                    setForm(f => ({ ...f, convenio: e.target.value }));
                    setTouchedFields(t => ({ ...t, convenio: true }));
                  }}
                  placeholder="Associação, Empresa parceira, etc."
                  className={inputBase}
                />
                {form.turma_id && renderSugerido('convenio')}
              </div>

              {/* Observações Financeiras */}
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Observações Financeiras</label>
                <textarea
                  value={form.observacoes_financeiras}
                  onChange={set('observacoes_financeiras')}
                  rows={2}
                  placeholder="Regras específicas de cobrança..."
                  className={`${inputBase} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 6: Origem Comercial */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
              <span className="text-teal-600">🎯</span> 6. Origem Comercial
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Origem */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Origem do Lead</label>
                <select
                  value={form.origem}
                  onChange={set('origem')}
                  className={inputBase}
                >
                  {ORIGENS.map(o => <option key={o} value={o}>{o || 'Selecionar...'}</option>)}
                </select>
              </div>

              {/* Captador */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vendedor / Captador</label>
                <select
                  value={form.captador_id}
                  onChange={set('captador_id')}
                  className={inputBase}
                >
                  <option value="">Selecionar vendedor...</option>
                  {equipe.map(member => (
                    <option key={member.id} value={member.id}>{member.nomecompleto}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 7: Checklist Comercial */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
              <span className="text-teal-600">✅</span> 7. Checklist Comercial
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {/* Doc recebido */}
              <label className="flex flex-col items-center justify-center p-3 border rounded-xl hover:bg-gray-50 cursor-pointer select-none text-center gap-2">
                <input
                  type="checkbox"
                  checked={form.chk_documentacao}
                  onChange={setCheck('chk_documentacao')}
                  className="rounded text-teal-600 focus:ring-teal-500 h-5 w-5"
                />
                <span className="text-xs font-medium text-gray-700">Documentação</span>
              </label>

              {/* Contrato Enviado */}
              <label className="flex flex-col items-center justify-center p-3 border rounded-xl hover:bg-gray-50 cursor-pointer select-none text-center gap-2">
                <input
                  type="checkbox"
                  checked={form.chk_contrato_enviado}
                  onChange={setCheck('chk_contrato_enviado')}
                  className="rounded text-teal-600 focus:ring-teal-500 h-5 w-5"
                />
                <span className="text-xs font-medium text-gray-700">Contrato Enviado</span>
              </label>

              {/* Contrato Assinado */}
              <label className="flex flex-col items-center justify-center p-3 border rounded-xl hover:bg-gray-50 cursor-pointer select-none text-center gap-2">
                <input
                  type="checkbox"
                  checked={form.chk_contrato_assinado}
                  onChange={setCheck('chk_contrato_assinado')}
                  className="rounded text-teal-600 focus:ring-teal-500 h-5 w-5"
                />
                <span className="text-xs font-medium text-gray-700">Contrato Assinado</span>
              </label>

              {/* Cobrança Enviada */}
              <label className="flex flex-col items-center justify-center p-3 border rounded-xl hover:bg-gray-50 cursor-pointer select-none text-center gap-2">
                <input
                  type="checkbox"
                  checked={form.chk_cobranca_enviada}
                  onChange={setCheck('chk_cobranca_enviada')}
                  className="rounded text-teal-600 focus:ring-teal-500 h-5 w-5"
                />
                <span className="text-xs font-medium text-gray-700">Cobrança Enviada</span>
              </label>

              {/* Pagamento Confirmado */}
              <label className="flex flex-col items-center justify-center p-3 border rounded-xl hover:bg-gray-50 cursor-pointer select-none text-center gap-2">
                <input
                  type="checkbox"
                  checked={form.chk_pagamento_confirmado}
                  onChange={setCheck('chk_pagamento_confirmado')}
                  className="rounded text-teal-600 focus:ring-teal-500 h-5 w-5"
                />
                <span className="text-xs font-medium text-gray-700">Pagto Confirmado</span>
              </label>

              {/* Matrícula Efetivada */}
              <label className="flex flex-col items-center justify-center p-3 border rounded-xl hover:bg-gray-50 cursor-pointer select-none text-center gap-2">
                <input
                  type="checkbox"
                  checked={form.chk_matricula_efetivada}
                  onChange={setCheck('chk_matricula_efetivada')}
                  className="rounded text-teal-600 focus:ring-teal-500 h-5 w-5"
                />
                <span className="text-xs font-medium text-gray-700">Matrícula Ok</span>
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3 justify-end pt-4">
            <Link href="/comercial/leads">
              <button
                type="button"
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={salvando}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white px-8 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              {salvando ? 'Processando...' : 'Cadastrar Ficha de Matrícula'}
            </button>
          </div>
        </form>
      </div>
    </ComercialLayout>
  );
}
