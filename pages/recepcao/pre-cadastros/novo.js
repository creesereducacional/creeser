import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import StatusBadge from '@/components/recepcao/StatusBadge';

// ── Máscaras ─────────────────────────────────────────────────────────
function maskCPF(v) {
  return v.replace(/\D/g,'')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
    .slice(0,14);
}
function maskPhone(v) {
  return v.replace(/\D/g,'')
    .replace(/(\d{2})(\d)/,'($1) $2')
    .replace(/(\d{5})(\d)/,'$1-$2')
    .slice(0,15);
}

const STEPS = [
  { n: 1, label: 'Dados Pessoais',      icon: '👤' },
  { n: 2, label: 'Curso de Interesse',  icon: '📚' },
  { n: 3, label: 'Confirmação',         icon: '✅' },
];

const inputCls = 'w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white transition-colors';
const inputOk  = 'border-gray-300';
const inputErr = 'border-red-400 bg-red-50';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

export default function NovoPrecadastro() {
  const router = useRouter();

  const [etapa, setEtapa] = useState(1);

  const [form, setForm] = useState({
    nome: '', cpf: '', email: '', telefone_celular: '',
    data_nascimento: '',
    responsavel_nome: '', responsavel_cpf: '', responsavel_rg: '', responsavel_telefone: '', responsavel_parentesco: '',
    responsavel_financeiro_mesmo: true,
    financeiro_nome: '', financeiro_cpf: '', financeiro_rg: '', financeiro_telefone: '', financeiro_parentesco: '',
    cursoid: '', turmaid: '', observacoes_adicionais: '',
  });
  const [erros, setErros] = useState({});
  const [idade, setIdade] = useState(null);

  const [instituicoes, setInstituicoes]           = useState([]);
  const [instSel, setInstSel]                     = useState('');
  const [cursos, setCursos]                       = useState([]);
  const [turmas, setTurmas]                       = useState([]);
  const [carregandoCursos, setCarregandoCursos]   = useState(false);
  const [carregandoTurmas, setCarregandoTurmas]   = useState(false);
  const [salvando, setSalvando]                   = useState(false);
  const [erro, setErro]                           = useState(null);

  // Carregar instituições (lógica original inalterada)
  useEffect(() => {
    fetch('/api/comercial/instituicoes', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setInstituicoes(list);
        if (list.length === 1) setInstSel(list[0].id);
      })
      .catch(() => {});
  }, []);

  // Carregar cursos (lógica original inalterada)
  useEffect(() => {
    if (!instSel) { setCursos([]); return; }
    setCarregandoCursos(true);
    fetch(`/api/comercial/cursos?instituicao_id=${instSel}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setCursos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCarregandoCursos(false));
  }, [instSel]);

  // Carregar turmas (lógica original inalterada)
  useEffect(() => {
    if (!form.cursoid) { setTurmas([]); set('turmaid', ''); return; }
    setCarregandoTurmas(true);
    fetch(`/api/comercial/turmas?cursoid=${form.cursoid}&instituicao_id=${instSel}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setTurmas(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCarregandoTurmas(false));
  }, [form.cursoid, instSel]);

  const set = (campo, valor) => {
    setForm(f => ({ ...f, [campo]: valor }));
    if (erros[campo]) setErros(e => ({ ...e, [campo]: null }));
  };

  function calcularIdade(dataNasc) {
    if (!dataNasc) return null;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let id = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      id--;
    }
    return id;
  }

  function handleDataNascimento(val) {
    set('data_nascimento', val);
    const id = calcularIdade(val);
    setIdade(id);
  }

  function validarEtapa1() {
    const e = {};
    if (!form.nome?.trim()) e.nome = 'Nome é obrigatório.';
    if (form.cpf && form.cpf.replace(/\D/g,'').length !== 11) e.cpf = 'CPF inválido (11 dígitos).';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido.';

    if (idade !== null && idade < 18) {
      if (!form.responsavel_nome.trim()) e.responsavel_nome = 'Nome do responsável é obrigatório para menor de idade.';
      if (!form.responsavel_cpf.trim() || form.responsavel_cpf.replace(/\D/g,'').length !== 11) e.responsavel_cpf = 'CPF do responsável é obrigatório e deve ter 11 dígitos.';
      if (!form.responsavel_rg.trim()) e.responsavel_rg = 'RG do responsável é obrigatório.';
      if (!form.responsavel_telefone.trim()) e.responsavel_telefone = 'Telefone do responsável é obrigatório.';
      if (!form.responsavel_parentesco.trim()) e.responsavel_parentesco = 'Parentesco é obrigatório.';

      if (!form.responsavel_financeiro_mesmo) {
        if (!form.financeiro_nome.trim()) e.financeiro_nome = 'Nome do responsável financeiro é obrigatório.';
        if (!form.financeiro_cpf.trim() || form.financeiro_cpf.replace(/\D/g,'').length !== 11) e.financeiro_cpf = 'CPF do responsável financeiro é obrigatório e deve ter 11 dígitos.';
        if (!form.financeiro_rg.trim()) e.financeiro_rg = 'RG do responsável financeiro é obrigatório.';
        if (!form.financeiro_telefone.trim()) e.financeiro_telefone = 'Telefone do responsável financeiro é obrigatório.';
        if (!form.financeiro_parentesco.trim()) e.financeiro_parentesco = 'Parentesco do responsável financeiro é obrigatório.';
      }
    }

    setErros(e);
    return Object.keys(e).length === 0;
  }

  function avancar() {
    if (etapa === 1 && !validarEtapa1()) return;
    setEtapa(s => Math.min(s + 1, 3));
  }

  const [duplicateId, setDuplicateId] = useState(null);

  // Submit (lógica original inalterada)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome?.trim()) { setErro('Nome é obrigatório.'); return; }
    setSalvando(true); setErro(null); setDuplicateId(null);
    try {
      const res = await fetch('/api/recepcao/pre-cadastros', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, instituicao_id: instSel || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Erro ao salvar.');
        if (res.status === 409 && data.aluno_id) {
          setDuplicateId(data.aluno_id);
        }
        return;
      }
      router.push('/recepcao/pre-cadastros');
    } catch { setErro('Erro de conexão.'); }
    finally { setSalvando(false); }
  };

  const instNome   = instituicoes.find(i => i.id === instSel)?.nome || '—';
  const cursoNome  = cursos.find(c => String(c.id) === String(form.cursoid))?.nome || '—';
  const turmaNome  = turmas.find(t => String(t.id) === String(form.turmaid))?.nome || 'Sem turma (provisório)';

  return (
    <RecepcaoLayout titulo="Novo Pré-Cadastro">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Indicador de etapas ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm px-6 py-4">
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const ativo      = etapa === s.n;
              const concluido  = etapa > s.n;
              return (
                <div key={s.n} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                      ${concluido ? 'bg-green-500 text-white' : ativo ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                      {concluido ? '✓' : s.icon}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${ativo ? 'text-blue-700' : concluido ? 'text-green-600' : 'text-gray-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full ${etapa > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Status preview ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl text-sm">
          <span className="text-blue-700 font-semibold">Status ao cadastrar:</span>
          <StatusBadge status="PRE_CADASTRO" size="md" />
          <span className="text-blue-500 text-xs ml-auto hidden sm:block">
            O financeiro avança o status após pagamento
          </span>
        </div>

        {/* ── Alerta de erro geral ──────────────────────────────── */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 space-y-3">
            <p className="font-semibold">⚠️ {erro}</p>
            {duplicateId && (
              <div className="flex gap-2 pt-1">
                <Link href={`/recepcao/pre-cadastros/${duplicateId}`}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm">
                  Abrir cadastro existente
                </Link>
                <button type="button" onClick={() => { setErro(null); setDuplicateId(null); }}
                  className="px-3.5 py-1.5 border border-red-200 hover:bg-red-100/50 text-red-700 rounded-lg text-xs font-medium transition">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── Etapa 1: Dados Pessoais ──────────────────────────── */}
          {etapa === 1 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide pb-2 border-b">👤 Dados Pessoais</h2>

              <div>
                <label className={labelCls}>Nome completo *</label>
                <input
                  className={`${inputCls} ${erros.nome ? inputErr : inputOk}`}
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  placeholder="Nome completo do aluno"
                  autoFocus
                />
                {erros.nome && <p className="text-xs text-red-600 mt-1">{erros.nome}</p>}
              </div>

              <div>
                <label className={labelCls}>CPF</label>
                <input
                  className={`${inputCls} ${erros.cpf ? inputErr : inputOk}`}
                  value={form.cpf}
                  onChange={e => set('cpf', maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                {erros.cpf && <p className="text-xs text-red-600 mt-1">{erros.cpf}</p>}
              </div>

              <div>
                <label className={labelCls}>Telefone / WhatsApp</label>
                <input
                  className={`${inputCls} ${erros.telefone_celular ? inputErr : inputOk}`}
                  value={form.telefone_celular}
                  onChange={e => set('telefone_celular', maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
                {erros.telefone_celular && <p className="text-xs text-red-600 mt-1">{erros.telefone_celular}</p>}
              </div>

              <div>
                <label className={labelCls}>E-mail</label>
                <input
                  type="email"
                  className={`${inputCls} ${erros.email ? inputErr : inputOk}`}
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
                {erros.email && <p className="text-xs text-red-650 mt-1">{erros.email}</p>}
              </div>

              <div>
                <label className={labelCls}>Data de Nascimento *</label>
                <input
                  type="date"
                  className={`${inputCls} ${erros.data_nascimento ? inputErr : inputOk}`}
                  value={form.data_nascimento}
                  onChange={e => handleDataNascimento(e.target.value)}
                />
              </div>

              {idade !== null && idade < 18 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👤</span> Responsável Legal (Aluno Menor de Idade)
                  </h3>
                  
                  <div>
                    <label className={labelCls}>Nome Completo do Responsável *</label>
                    <input
                      className={`${inputCls} ${erros.responsavel_nome ? inputErr : inputOk}`}
                      value={form.responsavel_nome}
                      onChange={e => set('responsavel_nome', e.target.value)}
                      placeholder="Nome do pai, mãe ou tutor legal"
                    />
                    {erros.responsavel_nome && <p className="text-xs text-red-650 mt-1">{erros.responsavel_nome}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>CPF do Responsável *</label>
                      <input
                        className={`${inputCls} ${erros.responsavel_cpf ? inputErr : inputOk}`}
                        value={form.responsavel_cpf}
                        onChange={e => set('responsavel_cpf', maskCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                      {erros.responsavel_cpf && <p className="text-xs text-red-650 mt-1">{erros.responsavel_cpf}</p>}
                    </div>

                    <div>
                      <label className={labelCls}>RG do Responsável *</label>
                      <input
                        className={`${inputCls} ${erros.responsavel_rg ? inputErr : inputOk}`}
                        value={form.responsavel_rg}
                        onChange={e => set('responsavel_rg', e.target.value)}
                        placeholder="RG do responsável"
                      />
                      {erros.responsavel_rg && <p className="text-xs text-red-650 mt-1">{erros.responsavel_rg}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Telefone do Responsável *</label>
                      <input
                        className={`${inputCls} ${erros.responsavel_telefone ? inputErr : inputOk}`}
                        value={form.responsavel_telefone}
                        onChange={e => set('responsavel_telefone', maskPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                      {erros.responsavel_telefone && <p className="text-xs text-red-650 mt-1">{erros.responsavel_telefone}</p>}
                    </div>

                    <div>
                      <label className={labelCls}>Grau de Parentesco *</label>
                      <select
                        className={`${inputCls} ${erros.responsavel_parentesco ? inputErr : inputOk}`}
                        value={form.responsavel_parentesco}
                        onChange={e => set('responsavel_parentesco', e.target.value)}
                      >
                        <option value="">— Selecione —</option>
                        <option value="pai">Pai</option>
                        <option value="mae">Mãe</option>
                        <option value="tutor">Tutor / Outro</option>
                      </select>
                      {erros.responsavel_parentesco && <p className="text-xs text-red-650 mt-1">{erros.responsavel_parentesco}</p>}
                    </div>
                  </div>

                  {/* Checkbox responsável financeiro */}
                  <div className="pt-2 border-t border-amber-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-900">
                      <input
                        type="checkbox"
                        checked={form.responsavel_financeiro_mesmo}
                        onChange={e => set('responsavel_financeiro_mesmo', e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      O Responsável Legal também é o Responsável Financeiro
                    </label>
                  </div>

                  {/* Seção adicional do Responsável Financeiro se desmarcado */}
                  {!form.responsavel_financeiro_mesmo && (
                    <div className="mt-4 pt-4 border-t border-amber-200 space-y-4">
                      <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        💰 Responsável Financeiro
                      </h4>

                      <div>
                        <label className={labelCls}>Nome Completo do Financeiro *</label>
                        <input
                          className={`${inputCls} ${erros.financeiro_nome ? inputErr : inputOk}`}
                          value={form.financeiro_nome}
                          onChange={e => set('financeiro_nome', e.target.value)}
                          placeholder="Nome do pagador das mensalidades"
                        />
                        {erros.financeiro_nome && <p className="text-xs text-red-650 mt-1">{erros.financeiro_nome}</p>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>CPF do Financeiro *</label>
                          <input
                            className={`${inputCls} ${erros.financeiro_cpf ? inputErr : inputOk}`}
                            value={form.financeiro_cpf}
                            onChange={e => set('financeiro_cpf', maskCPF(e.target.value))}
                            placeholder="000.000.000-00"
                            maxLength={14}
                          />
                          {erros.financeiro_cpf && <p className="text-xs text-red-650 mt-1">{erros.financeiro_cpf}</p>}
                        </div>

                        <div>
                          <label className={labelCls}>RG do Financeiro *</label>
                          <input
                            className={`${inputCls} ${erros.financeiro_rg ? inputErr : inputOk}`}
                            value={form.financeiro_rg}
                            onChange={e => set('financeiro_rg', e.target.value)}
                            placeholder="RG do financeiro"
                          />
                          {erros.financeiro_rg && <p className="text-xs text-red-650 mt-1">{erros.financeiro_rg}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Telefone do Financeiro *</label>
                          <input
                            className={`${inputCls} ${erros.financeiro_telefone ? inputErr : inputOk}`}
                            value={form.financeiro_telefone}
                            onChange={e => set('financeiro_telefone', maskPhone(e.target.value))}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                          />
                          {erros.financeiro_telefone && <p className="text-xs text-red-650 mt-1">{erros.financeiro_telefone}</p>}
                        </div>

                        <div>
                          <label className={labelCls}>Grau de Parentesco do Financeiro *</label>
                          <select
                            className={`${inputCls} ${erros.financeiro_parentesco ? inputErr : inputOk}`}
                            value={form.financeiro_parentesco}
                            onChange={e => set('financeiro_parentesco', e.target.value)}
                          >
                            <option value="">— Selecione —</option>
                            <option value="pai">Pai</option>
                            <option value="mae">Mãe</option>
                            <option value="tutor">Tutor / Outro</option>
                          </select>
                          {erros.financeiro_parentesco && <p className="text-xs text-red-650 mt-1">{erros.financeiro_parentesco}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* ── Etapa 2: Curso de Interesse ─────────────────────── */}
          {etapa === 2 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide pb-2 border-b">📚 Curso de Interesse</h2>

              {instituicoes.length > 1 && (
                <div>
                  <label className={labelCls}>Unidade</label>
                  <select
                    value={instSel}
                    onChange={e => { setInstSel(e.target.value); set('cursoid', ''); set('turmaid', ''); }}
                    className={`${inputCls} ${inputOk}`}
                  >
                    <option value="">— Selecione a instituição —</option>
                    {instituicoes.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className={labelCls}>Curso {carregandoCursos && '(carregando…)'}</label>
                <select
                  value={form.cursoid}
                  onChange={e => { set('cursoid', e.target.value); set('turmaid', ''); }}
                  disabled={!instSel || carregandoCursos}
                  className={`${inputCls} ${inputOk} ${!instSel ? 'opacity-50' : ''}`}
                >
                  <option value="">— Selecione o curso —</option>
                  {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                {!instSel && <p className="text-xs text-gray-400 mt-1">Selecione a instituição primeiro.</p>}
              </div>

              {form.cursoid && (
                <div>
                  <label className={labelCls}>
                    Turma {carregandoTurmas ? '(carregando…)' : turmas.length === 0 ? '(nenhuma turma ativa)' : ''}
                  </label>
                  <select
                    value={form.turmaid}
                    onChange={e => set('turmaid', e.target.value)}
                    disabled={carregandoTurmas}
                    className={`${inputCls} ${inputOk}`}
                  >
                    <option value="">— Sem turma (pré-cadastro provisório) —</option>
                    {turmas.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nome}{t.turno ? ` — ${t.turno}` : ''}
                        {t.mensalidade ? ` | R$ ${Number(t.mensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                      </option>
                    ))}
                  </select>
                  {turmas.length === 0 && !carregandoTurmas && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Nenhuma turma ativa. O aluno será vinculado futuramente.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className={labelCls}>Observações</label>
                <textarea
                  rows={3}
                  className={`${inputCls} ${inputOk} resize-none`}
                  value={form.observacoes_adicionais}
                  onChange={e => set('observacoes_adicionais', e.target.value)}
                  placeholder="Observações sobre este pré-cadastro (opcional)…"
                />
              </div>
            </div>
          )}

          {/* ── Etapa 3: Confirmação ─────────────────────────────── */}
          {etapa === 3 && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide pb-2 border-b">✅ Confirmar Dados</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Nome',            val: form.nome || '—' },
                  { label: 'CPF',             val: form.cpf || '—' },
                  { label: 'Telefone',        val: form.telefone_celular || '—' },
                  { label: 'E-mail',          val: form.email || '—' },
                  { label: 'Curso',           val: cursoNome },
                  { label: 'Turma',           val: turmaNome },
                  { label: 'Unidade',         val: instNome },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2">
                    <span className="text-gray-400 w-24 flex-shrink-0">{item.label}</span>
                    <span className="font-medium text-gray-800">{item.val}</span>
                  </div>
                ))}
                {form.observacoes_adicionais && (
                  <div className="pt-2 border-t">
                    <span className="text-xs text-gray-400 block mb-1">Observações</span>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{form.observacoes_adicionais}</p>
                  </div>
                )}
              </div>
              <div className="mt-2 pt-3 border-t flex items-center gap-2 text-xs text-gray-500">
                <span>Status:</span>
                <StatusBadge status="PRE_CADASTRO" size="sm" />
              </div>
            </div>
          )}

          {/* ── Navegação entre etapas ───────────────────────────── */}
          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => etapa > 1 ? setEtapa(e => e - 1) : router.back()}
              className="px-4 py-2.5 text-sm border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium"
            >
              ← {etapa > 1 ? 'Voltar' : 'Cancelar'}
            </button>

            {etapa < 3 ? (
              <button
                type="button"
                onClick={avancar}
                disabled={etapa === 2 && !instSel}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Próximo →
              </button>
            ) : (
              <button
                type="submit"
                disabled={salvando}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                {salvando ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>✅ Confirmar Pré-Cadastro</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </RecepcaoLayout>
  );
}
