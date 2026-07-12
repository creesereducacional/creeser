import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ComercialLayout from '@/components/ComercialLayout';
import PageHeader from '@/components/ui/PageHeader';

const ORIGENS = ['', 'Instagram', 'Facebook', 'WhatsApp', 'Indicação', 'Site', 'Evento', 'Outros'];

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

    // Financeiro
    valor_inscricao: '',
    valor_mensalidade: '',
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

  // 1. Carrega instituições ao montar
  useEffect(() => {
    fetch('/api/comercial/instituicoes', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const lista = Array.isArray(data) ? data : [];
        setInstituicoes(lista);
        if (lista.length > 0) setInstituicaoId(String(lista[0].id));
      })
      .catch(() => {});
  }, []);

  // 2. Carrega cursos quando a instituição muda
  useEffect(() => {
    if (!instituicaoId) return;
    setLoadingCursos(true);
    setCursos([]);
    setTurmas([]);
    setForm(f => ({ ...f, curso_id: '', curso_interesse: '', turma_id: '', valor_mensalidade: '' }));
    fetch(`/api/comercial/cursos?instituicao_id=${instituicaoId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCursos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingCursos(false));
  }, [instituicaoId]);

  // 3. Carrega turmas e valores quando o curso muda
  useEffect(() => {
    if (!form.curso_id) {
      setTurmas([]);
      return;
    }
    setLoadingTurmas(true);
    setForm(f => ({ ...f, turma_id: '' }));
    fetch(`/api/comercial/turmas?cursoid=${form.curso_id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setTurmas(list);
        
        // Auto-preencher valor padrão de mensalidade
        const selectedCurso = cursos.find(c => String(c.id) === form.curso_id);
        if (selectedCurso) {
          setForm(f => ({ 
            ...f, 
            valor_mensalidade: selectedCurso.valor_mensalidade || (list[0]?.mensalidade) || '' 
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTurmas(false));
  }, [form.curso_id]);

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  const setPhone = (campo) => (e) => {
    setForm(f => ({ ...f, [campo]: maskPhone(e.target.value) }));
  };

  const setCpf = (e) => {
    setForm(f => ({ ...f, cpf: maskCpf(e.target.value) }));
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

    // Preparar Ficha de Matrícula Serializada
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
      },
      financeiro: {
        valor_inscricao: form.valor_inscricao || null,
        valor_mensalidade: form.valor_mensalidade || null,
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

  const emailInvalido = emailTocado && !emailValido(form.email);
  const inputBase = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 transition-shadow';

  return (
    <ComercialLayout titulo="Ficha de Matrícula Comercial">
      <div className="max-w-3xl w-full mx-auto pb-12">
        <PageHeader
          icon="📝"
          title="Ficha de Matrícula Comercial"
          breadcrumbs={[
            { label: 'Dashboard', href: '/comercial/dashboard' },
            { label: 'Meus Leads', href: '/comercial/leads' },
            { label: 'Nova Ficha' }
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
                  disabled={instituicoes.length <= 1}
                  className={`${inputBase} ${instituicoes.length <= 1 ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
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
              {/* Nome Completo */}
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

              {/* Data Nascimento */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={form.data_nascimento}
                  onChange={set('data_nascimento')}
                  className={inputBase}
                />
              </div>

              {/* Nome da Mãe */}
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

              {/* RG */}
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

              {/* Nome do Pai */}
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

              {/* CPF */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CPF</label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={setCpf}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={inputBase}
                />
              </div>

              {/* Telefone */}
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

              {/* E-mail */}
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
                {/* CEP */}
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

                {/* Logradouro */}
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

                {/* Número */}
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

                {/* Complemento */}
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

                {/* Bairro */}
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

                {/* Cidade */}
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

                {/* Estado */}
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

          {/* SEÇÃO 3: Dados Financeiros */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
              <span className="text-teal-600">💵</span> 3. Dados Financeiros
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Valor Inscrição */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor da Inscrição (Matrícula)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor_inscricao}
                  onChange={set('valor_inscricao')}
                  placeholder="R$ 150,00"
                  className={inputBase}
                />
              </div>

              {/* Valor Mensalidade */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor da Mensalidade</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor_mensalidade}
                  onChange={set('valor_mensalidade')}
                  placeholder="R$ 300,00"
                  className={inputBase}
                />
              </div>

              {/* Origem / Indicação */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Origem / Indicação</label>
                <select
                  value={form.origem}
                  onChange={set('origem')}
                  className={inputBase}
                >
                  {ORIGENS.map(o => <option key={o} value={o}>{o || 'Selecionar...'}</option>)}
                </select>
              </div>
            </div>

            {/* Observações */}
            <div className="pt-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações Internas</label>
              <textarea
                value={form.observacoes}
                onChange={set('observacoes')}
                rows={3}
                placeholder="Anotações comerciais sobre a negociação..."
                className={`${inputBase} resize-none`}
              />
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
