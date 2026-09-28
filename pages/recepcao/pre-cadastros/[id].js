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

/** Converte qualquer valor de data para o formato yyyy-MM-dd usado em <input type="date"> */
function toInputDate(val) {
  if (!val) return '';
  // Já está no formato correto
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch (_) { return ''; }
}

function calcularIdade(dataNasc) {
  if (!dataNasc) return null;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let id = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) id--;
  return id;
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

  // Cursos e turmas para os selects
  const [cursos, setCursos]                   = useState([]);
  const [turmas, setTurmas]                   = useState([]);
  const [carregandoCursos, setCarregandoCursos] = useState(false);
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);

  // Idade derivada da data de nascimento
  const [idade, setIdade] = useState(null);

  // ── Carregar dados do pré-cadastro ─────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setCarregando(true);
    fetch(`/api/recepcao/pre-cadastros/${id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setAluno(data);
        const nascFormatada = toInputDate(data.data_nascimento);
        setIdade(calcularIdade(nascFormatada));
        setForm({
          nome:                   data.nome                   || '',
          cpf:                    data.cpf                    || '',
          email:                  data.email                  || '',
          telefone_celular:       data.telefone_celular       || '',
          observacoes_adicionais: data.observacoes_adicionais || '',
          data_nascimento:        nascFormatada,
          cursoid:                data.cursoid                ? String(data.cursoid) : '',
          turmaid:                data.turmaid                ? String(data.turmaid) : '',
        });
        if (editarParam === '1') setEditando(true);
      })
      .catch(() => setErro('Pré-cadastro não encontrado ou sem acesso.'))
      .finally(() => setCarregando(false));
  }, [id, editarParam]);

  // ── Carregar cursos quando entra em modo edição ────────────────────────────
  useEffect(() => {
    if (!editando) return;
    setCarregandoCursos(true);
    fetch('/api/comercial/cursos', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCursos(Array.isArray(data) ? data : []))
      .catch(() => setCursos([]))
      .finally(() => setCarregandoCursos(false));
  }, [editando]);

  // ── Carregar turmas quando cursoid muda ────────────────────────────────────
  useEffect(() => {
    if (!editando || !form.cursoid) { setTurmas([]); return; }
    setCarregandoTurmas(true);
    fetch(`/api/comercial/turmas?cursoid=${form.cursoid}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setTurmas(Array.isArray(data) ? data : []))
      .catch(() => setTurmas([]))
      .finally(() => setCarregandoTurmas(false));
  }, [form.cursoid, editando]);

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }));

  function handleDataNascimento(val) {
    set('data_nascimento', val);
    setIdade(calcularIdade(val));
  }

  function handleCursoChange(val) {
    set('cursoid', val);
    set('turmaid', ''); // limpa turma ao trocar curso
  }

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
    const nascFormatada = toInputDate(aluno.data_nascimento);
    setIdade(calcularIdade(nascFormatada));
    setForm({
      nome: aluno.nome || '', cpf: aluno.cpf || '',
      email: aluno.email || '', telefone_celular: aluno.telefone_celular || '',
      observacoes_adicionais: aluno.observacoes_adicionais || '',
      data_nascimento: nascFormatada,
      cursoid: aluno.cursoid ? String(aluno.cursoid) : '',
      turmaid: aluno.turmaid ? String(aluno.turmaid) : '',
    });
    setErro(null); setEditando(false);
  }

  function handlePrint() { window.print(); }

  const tel = aluno?.telefone_celular?.replace(/\D/g, '');
  const wppLink = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent('Olá ' + (aluno?.nome || '') + ', tudo bem?')}` : null;

  // Lógica de maioridade — exibe aviso na ficha quando menor de 18
  const isMenor = typeof idade === 'number' && idade < 18;

  // Nome do curso/turma para exibição no modo leitura
  const cursoNome = cursos.find(c => String(c.id) === String(aluno?.cursoid))?.nome || null;
  const turmaNome = turmas.find(t => String(t.id) === String(aluno?.turmaid))?.nome || null;

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
                  <label className={labelCls}>
                    Data de Nascimento
                    {editando && idade !== null && (
                      <span className={`ml-2 font-normal normal-case ${isMenor ? 'text-amber-600' : 'text-green-600'}`}>
                        ({idade} anos — {isMenor ? '⚠️ Menor de idade' : 'Maior de idade'})
                      </span>
                    )}
                  </label>
                  {editando ? (
                    <input
                      type="date"
                      className={inputCls}
                      value={form.data_nascimento}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={e => handleDataNascimento(e.target.value)}
                    />
                  ) : (
                    <div>
                      <p className="text-sm text-gray-800 py-2">{fmtData(aluno.data_nascimento)}</p>
                      {isMenor && !editando && (
                        <p className="text-xs text-amber-600 font-medium">⚠️ Menor de idade ({idade} anos)</p>
                      )}
                    </div>
                  )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Curso {editando && carregandoCursos && <span className="font-normal normal-case text-gray-400">(carregando…)</span>}</label>
                  {editando ? (
                    cursos.length === 0 && !carregandoCursos ? (
                      <p className="text-xs text-gray-400 py-2">Nenhum curso disponível.</p>
                    ) : (
                      <select
                        className={inputCls}
                        value={form.cursoid}
                        onChange={e => handleCursoChange(e.target.value)}
                        disabled={carregandoCursos}
                      >
                        <option value="">— Selecione o curso —</option>
                        {cursos.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    )
                  ) : (
                    <p className="text-sm text-gray-800 py-1">
                      {/* Tenta exibir nome; se ainda não carregou, mostra ID */}
                      {cursoNome || (aluno.cursoid ? `ID ${aluno.cursoid}` : '—')}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Turma
                    {editando && form.cursoid && carregandoTurmas && <span className="font-normal normal-case text-gray-400"> (carregando…)</span>}
                    {editando && form.cursoid && !carregandoTurmas && turmas.length === 0 && <span className="font-normal normal-case text-amber-500"> (nenhuma turma ativa)</span>}
                  </label>
                  {editando ? (
                    !form.cursoid ? (
                      <p className="text-xs text-gray-400 py-2 italic">Selecione um curso primeiro.</p>
                    ) : (
                      <select
                        className={inputCls}
                        value={form.turmaid}
                        onChange={e => set('turmaid', e.target.value)}
                        disabled={carregandoTurmas || turmas.length === 0}
                      >
                        <option value="">— Sem turma (provisório) —</option>
                        {turmas.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.nome}{t.turno ? ` — ${t.turno}` : ''}
                          </option>
                        ))}
                      </select>
                    )
                  ) : (
                    <p className="text-sm text-gray-800 py-1">
                      {turmaNome || (aluno.turmaid ? `ID ${aluno.turmaid}` : '—')}
                    </p>
                  )}
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
