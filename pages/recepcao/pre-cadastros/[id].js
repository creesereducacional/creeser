import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import StatusBadge from '@/components/recepcao/StatusBadge';
import TimelineStatus from '@/components/recepcao/TimelineStatus';

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

function iniciais(nome) {
  if (!nome) return '?';
  const p = nome.trim().split(' ').filter(Boolean);
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}
function avatarCor(nome) {
  const cores = ['bg-blue-500','bg-purple-500','bg-green-500','bg-orange-500','bg-pink-500','bg-teal-500','bg-indigo-500'];
  if (!nome) return cores[0];
  return cores[nome.charCodeAt(0) % cores.length];
}
function fmt(val) { return val || '—'; }
function fmtData(val) {
  if (!val) return '—';
  try { return new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch (_) { return val; }
}

export default function PreCadastroDetalhe() {
  const router = useRouter();
  const { id, editar: editarParam } = router.query;

  const [aluno, setAluno]           = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando]     = useState(false);
  const [form, setForm]             = useState({});
  const [salvando, setSalvando]     = useState(false);
  const [erro, setErro]             = useState(null);
  const [sucesso, setSucesso]       = useState(null);

  useEffect(() => {
    if (!id) return;
    setCarregando(true);
    fetch(`/api/recepcao/pre-cadastros/${id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setAluno(data);
        setForm({
          nome:                   data.nome                   || '',
          cpf:                    data.cpf                    || '',
          email:                  data.email                  || '',
          telefone_celular:       data.telefone_celular       || '',
          observacoes_adicionais: data.observacoes_adicionais || '',
        });
        if (editarParam === '1') setEditando(true);
      })
      .catch(() => setErro('Pré-cadastro não encontrado ou sem acesso.'))
      .finally(() => setCarregando(false));
  }, [id, editarParam]);

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }));

  async function handleSalvar() {
    if (!form.nome?.trim()) { setErro('Nome é obrigatório.'); return; }
    setSalvando(true); setErro(null); setSucesso(null);
    try {
      const res = await fetch(`/api/recepcao/pre-cadastros/${id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro ao salvar.'); return; }
      setAluno(prev => ({ ...prev, ...data }));
      setEditando(false);
      setSucesso('Dados salvos com sucesso!');
    } catch { setErro('Erro de conexão.'); }
    finally { setSalvando(false); }
  }

  function handleCancelar() {
    if (!aluno) return;
    setForm({
      nome: aluno.nome || '', cpf: aluno.cpf || '',
      email: aluno.email || '', telefone_celular: aluno.telefone_celular || '',
      observacoes_adicionais: aluno.observacoes_adicionais || '',
    });
    setErro(null); setEditando(false);
  }

  function handlePrint() { window.print(); }

  const tel = aluno?.telefone_celular?.replace(/\D/g, '');
  const wppLink = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent('Olá ' + (aluno?.nome || '') + ', tudo bem?')}` : null;

  return (
    <RecepcaoLayout titulo="Ficha do Aluno">
      <div className="max-w-3xl w-full mx-auto space-y-5 print:max-w-full">

        {/* ── Navegação ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between print:hidden">
          <Link href="/recepcao/pre-cadastros" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            ← Voltar
          </Link>
          <div className="flex items-center gap-2">
            {wppLink && (
              <a href={wppLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                💬 WhatsApp
              </a>
            )}
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              🖨️ Imprimir
            </button>
            {aluno && !editando && (
              <button onClick={() => { setEditando(true); setSucesso(null); setErro(null); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                ✏️ Editar
              </button>
            )}
          </div>
        </div>

        {/* ── Alertas ─────────────────────────────────────────────── */}
        {erro && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{erro}</div>}
        {sucesso && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">✅ {sucesso}</div>}

        {carregando && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
              <div className="h-3 bg-gray-100 rounded w-1/4 mx-auto" />
            </div>
          </div>
        )}

        {aluno && (
          <>
            {/* ── Cabeçalho ─────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-md p-6 text-white">
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl ${avatarCor(aluno.nome)} flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-inner ring-2 ring-white/30`}>
                  {iniciais(aluno.nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold truncate">{aluno.nome}</h1>
                  <div className="flex items-center gap-3 mt-1 text-blue-100 text-sm">
                    {aluno.cpf && <span>CPF {aluno.cpf}</span>}
                    {aluno.telefone_celular && <span>📱 {aluno.telefone_celular}</span>}
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={aluno.statusmatricula} size="md" />
                  </div>
                </div>
                <div className="text-right text-blue-100 text-xs flex-shrink-0 hidden sm:block">
                  <div>Cadastrado em</div>
                  <div className="font-semibold text-white text-sm mt-0.5">{fmtData(aluno.datacriacao)}</div>
                  {aluno.matricula && <div className="mt-2">Matrícula: <span className="font-semibold text-white">{aluno.matricula}</span></div>}
                </div>
              </div>
            </div>

            {/* ── Timeline ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Jornada do Aluno</h2>
              <TimelineStatus status={aluno.statusmatricula} />
            </div>

            {/* ── Dados Pessoais ─────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">👤 Dados Pessoais</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nome completo *</label>
                  {editando ? (
                    <input className={inputCls} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do aluno" />
                  ) : (
                    <p className="text-sm text-gray-800 py-2 font-medium">{fmt(aluno.nome)}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>CPF</label>
                  {editando ? (
                    <input className={inputCls} value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
                  ) : (
                    <p className="text-sm text-gray-800 py-2">{fmt(aluno.cpf)}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Data de Nascimento</label>
                  <p className="text-sm text-gray-800 py-2">{fmtData(aluno.data_nascimento)}</p>
                </div>
              </div>
            </div>

            {/* ── Contato ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">📞 Contato</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Telefone / WhatsApp</label>
                  {editando ? (
                    <input className={inputCls} value={form.telefone_celular} onChange={e => set('telefone_celular', e.target.value)} placeholder="(00) 00000-0000" />
                  ) : (
                    <div className="flex items-center gap-2 py-1">
                      <p className="text-sm text-gray-800">{fmt(aluno.telefone_celular)}</p>
                      {wppLink && (
                        <a href={wppLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 text-xs font-medium">
                          💬 Abrir
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>E-mail</label>
                  {editando ? (
                    <input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
                  ) : (
                    <p className="text-sm text-gray-800 py-2">{fmt(aluno.email)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Curso / Turma ─────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">📚 Curso / Turma</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={labelCls}>Curso</span>
                  <p className="text-gray-800 py-1">{aluno.cursoid ? `ID ${aluno.cursoid}` : '—'}</p>
                </div>
                <div>
                  <span className={labelCls}>Turma</span>
                  <p className="text-gray-800 py-1">{aluno.turmaid ? `ID ${aluno.turmaid}` : '—'}</p>
                </div>
              </div>
            </div>

            {/* ── Financeiro ───────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">💰 Resumo Financeiro</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                {[
                  { label: 'Valor Matrícula',  val: aluno.valor_matricula   ? `R$ ${Number(aluno.valor_matricula).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : '—' },
                  { label: 'Mensalidade',       val: aluno.valor_mensalidade ? `R$ ${Number(aluno.valor_mensalidade).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : '—' },
                  { label: 'Desconto',          val: aluno.percentual_desconto ? `${aluno.percentual_desconto}%` : '—' },
                  { label: 'Parcelas',          val: aluno.qtd_parcelas || '—' },
                ].map(item => (
                  <div key={item.label}>
                    <span className={labelCls}>{item.label}</span>
                    <p className="text-gray-800 font-semibold">{item.val}</p>
                  </div>
                ))}
              </div>
              {aluno.data_pagamento_matricula && (
                <div className="mt-3 pt-3 border-t text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2">
                  ✅ Matrícula paga em {fmtData(aluno.data_pagamento_matricula)}
                </div>
              )}
            </div>

            {/* ── Observações ──────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">📝 Observações</h2>
              {editando ? (
                <textarea className={inputCls + ' resize-none h-24'} value={form.observacoes_adicionais}
                  onChange={e => set('observacoes_adicionais', e.target.value)} placeholder="Observações adicionais…" />
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {aluno.observacoes_adicionais || <span className="text-gray-400 italic">Sem observações.</span>}
                </p>
              )}
            </div>

            {/* ── Histórico ────────────────────────────────── */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">🕐 Histórico</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-500">
                <div><span className="font-semibold block text-gray-600">Cadastrado</span>{fmtData(aluno.datacriacao)}</div>
                <div><span className="font-semibold block text-gray-600">Atualizado</span>{fmtData(aluno.dataatualizacao)}</div>
                <div><span className="font-semibold block text-gray-600">Data Captação</span>{fmtData(aluno.data_captacao)}</div>
                <div><span className="font-semibold block text-gray-600">Ativado em</span>{fmtData(aluno.data_ativacao)}</div>
              </div>
            </div>

            {/* ── Botões ───────────────────────────────────── */}
            {editando && (
              <div className="flex gap-3 print:hidden">
                <button onClick={handleCancelar} disabled={salvando}
                  className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleSalvar} disabled={salvando}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50">
                  {salvando ? 'Salvando…' : '✅ Salvar Alterações'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </RecepcaoLayout>
  );
}

