import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import RecepcaoLayout from '@/components/RecepcaoLayout';

const STATUS_PREVISTO = {
  PRE_CADASTRO: {
    label: 'Pré-Cadastro',
    desc: 'Sem curso selecionado. Secretaria definirá curso e turma.',
    cor: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  AGUARDANDO_TURMA: {
    label: 'Aguardando Turma',
    desc: 'Curso selecionado, mas sem turma disponível. Admin deverá cadastrar turma.',
    cor: 'bg-yellow-50 text-yellow-800 border-yellow-300',
  },
  AGUARDANDO_ORDEM_PAGAMENTO: {
    label: 'Aguardando Ordem de Pagamento',
    desc: 'Turma selecionada. Financeiro deverá gerar a ordem de pagamento.',
    cor: 'bg-orange-50 text-orange-800 border-orange-300',
  },
};

export default function NovoPrecadastro() {
  const router = useRouter();

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone_celular: '',
    cursoid: '',
    turmaid: '',
    observacoes_adicionais: '',
  });

  const [instituicoes, setInstituicoes]       = useState([]);
  const [instSel, setInstSel]                 = useState('');
  const [cursos, setCursos]                   = useState([]);
  const [turmas, setTurmas]                   = useState([]);
  const [carregandoCursos, setCarregandoCursos] = useState(false);
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);
  const [salvando, setSalvando]               = useState(false);
  const [erro, setErro]                       = useState(null);

  // Carregar instituições
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

  // Carregar cursos
  useEffect(() => {
    if (!instSel) { setCursos([]); return; }
    setCarregandoCursos(true);
    fetch(`/api/comercial/cursos?instituicao_id=${instSel}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setCursos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCarregandoCursos(false));
  }, [instSel]);

  // Carregar turmas
  useEffect(() => {
    if (!form.cursoid) { setTurmas([]); set('turmaid', ''); return; }
    setCarregandoTurmas(true);
    fetch(`/api/comercial/turmas?cursoid=${form.cursoid}&instituicao_id=${instSel}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setTurmas(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCarregandoTurmas(false));
  }, [form.cursoid, instSel]);

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }));

  const statusPrevisto = form.turmaid
    ? 'AGUARDANDO_ORDEM_PAGAMENTO'
    : form.cursoid
    ? 'AGUARDANDO_TURMA'
    : 'PRE_CADASTRO';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome?.trim()) { setErro('Nome é obrigatório.'); return; }
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch('/api/recepcao/pre-cadastros', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, instituicao_id: instSel || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro ao salvar.'); return; }
      router.push('/recepcao/pre-cadastros');
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setSalvando(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
  const sp = STATUS_PREVISTO[statusPrevisto];

  return (
    <RecepcaoLayout titulo="Novo Pré-Cadastro">
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">

        {/* Status previsto */}
        <div className={`flex flex-col gap-0.5 px-4 py-3 rounded-xl text-sm border ${sp.cor}`}>
          <span className="font-semibold">Status ao cadastrar: {sp.label}</span>
          <span className="text-xs opacity-80">{sp.desc}</span>
        </div>

        {erro && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{erro}</div>
        )}

        {/* Dados básicos */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Dados Básicos</h2>
          <div>
            <label className={labelCls}>Nome completo *</label>
            <input className={inputCls} value={form.nome}
              onChange={e => set('nome', e.target.value)}
              placeholder="Nome do aluno" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>CPF</label>
              <input className={inputCls} value={form.cpf}
                onChange={e => set('cpf', e.target.value)}
                placeholder="000.000.000-00" />
            </div>
            <div>
              <label className={labelCls}>Telefone / WhatsApp</label>
              <input className={inputCls} value={form.telefone_celular}
                onChange={e => set('telefone_celular', e.target.value)}
                placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div>
            <label className={labelCls}>E-mail</label>
            <input type="email" className={inputCls} value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="email@exemplo.com" />
          </div>
        </div>

        {/* Instituição — só mostrar se houver mais de uma */}
        {instituicoes.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-gray-800 border-b pb-2">Instituição</h2>
            <div>
              <label className={labelCls}>Unidade</label>
              <select value={instSel}
                onChange={e => { setInstSel(e.target.value); set('cursoid', ''); set('turmaid', ''); }}
                className={inputCls}>
                <option value="">— Selecione a instituição —</option>
                {instituicoes.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Curso e turma */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Curso de Interesse</h2>

          <div>
            <label className={labelCls}>Curso {carregandoCursos ? '(carregando…)' : ''}</label>
            <select value={form.cursoid}
              onChange={e => { set('cursoid', e.target.value); set('turmaid', ''); }}
              disabled={!instSel}
              className={inputCls + (!instSel ? ' opacity-50' : '')}>
              <option value="">— Selecione o curso —</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {!instSel && (
              <p className="text-xs text-gray-400 mt-1">Selecione a instituição primeiro.</p>
            )}
          </div>

          {form.cursoid && (
            <div>
              <label className={labelCls}>
                Turma {carregandoTurmas ? '(carregando…)' : turmas.length === 0 ? '(nenhuma turma ativa)' : ''}
              </label>
              <select value={form.turmaid}
                onChange={e => set('turmaid', e.target.value)}
                disabled={turmas.length === 0 || carregandoTurmas}
                className={inputCls + (turmas.length === 0 ? ' opacity-50' : '')}>
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
                  ⚠️ Nenhuma turma ativa para este curso. O aluno ficará como &quot;Aguardando Turma&quot; até que o admin cadastre uma turma.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Observações</h2>
          <textarea rows={3} className={inputCls + ' resize-none'}
            value={form.observacoes_adicionais}
            onChange={e => set('observacoes_adicionais', e.target.value)}
            placeholder="Observações sobre este pré-cadastro (opcional)…" />
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            ← Cancelar
          </button>
          <button type="submit" disabled={salvando || !instSel}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {salvando ? 'Salvando…' : '✅ Criar Pré-Cadastro'}
          </button>
        </div>
      </form>
    </RecepcaoLayout>
  );
}
