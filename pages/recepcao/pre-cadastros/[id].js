import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import RecepcaoLayout from '@/components/RecepcaoLayout';

const STATUS_CONFIG = {
  PRE_CADASTRO:                   { label: 'Pre-Cadastro',                    cor: 'bg-gray-100 text-gray-700 border-gray-300' },
  AGUARDANDO_PAGAMENTO_MATRICULA: { label: 'Aguardando Pagamento',            cor: 'bg-purple-100 text-purple-800 border-purple-300' },
  AGUARDANDO_FORMACAO_TURMA:      { label: 'Aguardando Formacao de Turma',    cor: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  ATIVO:                          { label: 'Ativo',                           cor: 'bg-green-100 text-green-800 border-green-300' },
  DESISTENTE:                     { label: 'Desistente',                      cor: 'bg-orange-100 text-orange-800 border-orange-300' },
  CANCELADO:                      { label: 'Cancelado',                       cor: 'bg-red-100 text-red-700 border-red-300' },
};

const s = (status) => STATUS_CONFIG[status] || { label: status || '—', cor: 'bg-gray-100 text-gray-600 border-gray-300' };

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export default function PreCadastroDetalhe() {
  const router = useRouter();
  const { id } = router.query;

  const [aluno, setAluno]       = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [form, setForm]         = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState(null);
  const [sucesso, setSucesso]   = useState(null);

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
      })
      .catch(() => setErro('Pre-cadastro nao encontrado ou sem acesso.'))
      .finally(() => setCarregando(false));
  }, [id]);

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }));

  async function handleSalvar() {
    if (!form.nome?.trim()) { setErro('Nome e obrigatorio.'); return; }
    setSalvando(true);
    setErro(null);
    setSucesso(null);
    try {
      const res = await fetch(`/api/recepcao/pre-cadastros/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro ao salvar.'); return; }
      setAluno(prev => ({ ...prev, ...data }));
      setEditando(false);
      setSucesso('Dados salvos com sucesso!');
    } catch {
      setErro('Erro de conexao.');
    } finally {
      setSalvando(false);
    }
  }

  function handleCancelar() {
    if (!aluno) return;
    setForm({
      nome:                   aluno.nome                   || '',
      cpf:                    aluno.cpf                    || '',
      email:                  aluno.email                  || '',
      telefone_celular:       aluno.telefone_celular       || '',
      observacoes_adicionais: aluno.observacoes_adicionais || '',
    });
    setErro(null);
    setEditando(false);
  }

  const status = s(aluno?.statusmatricula);

  return (
    <RecepcaoLayout titulo="Pre-Cadastro — Detalhe">
      <div className="max-w-2xl w-full mx-auto space-y-5">

        {/* Navegacao */}
        <div className="flex items-center gap-2">
          <Link href="/recepcao/pre-cadastros"
            className="text-sm text-blue-600 hover:underline">
            ← Pre-Cadastros
          </Link>
        </div>

        {carregando && (
          <div className="py-20 text-center text-gray-400">Carregando...</div>
        )}

        {erro && !carregando && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{erro}</div>
        )}
        {sucesso && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">{sucesso}</div>
        )}

        {aluno && (
          <>
            {/* Cabecalho */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{aluno.nome}</h2>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.cor}`}>
                    {status.label}
                  </span>
                </div>
                {!editando && (
                  <button
                    onClick={() => { setEditando(true); setSucesso(null); setErro(null); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>

            {/* Formulario */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2 text-sm">Dados Pessoais</h3>

              <div>
                <label className={labelCls}>Nome completo *</label>
                {editando ? (
                  <input className={inputCls} value={form.nome}
                    onChange={e => set('nome', e.target.value)} placeholder="Nome do aluno" />
                ) : (
                  <p className="text-sm text-gray-800 py-2">{aluno.nome || '—'}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>CPF</label>
                  {editando ? (
                    <input className={inputCls} value={form.cpf}
                      onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
                  ) : (
                    <p className="text-sm text-gray-800 py-2">{aluno.cpf || '—'}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Telefone / WhatsApp</label>
                  {editando ? (
                    <input className={inputCls} value={form.telefone_celular}
                      onChange={e => set('telefone_celular', e.target.value)} placeholder="(00) 00000-0000" />
                  ) : (
                    <p className="text-sm text-gray-800 py-2">{aluno.telefone_celular || '—'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>E-mail</label>
                {editando ? (
                  <input type="email" className={inputCls} value={form.email}
                    onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
                ) : (
                  <p className="text-sm text-gray-800 py-2">{aluno.email || '—'}</p>
                )}
              </div>
            </div>

            {/* Observacoes */}
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
              <h3 className="font-semibold text-gray-800 border-b pb-2 text-sm">Observacoes</h3>
              {editando ? (
                <textarea className={inputCls + ' resize-none h-24'} value={form.observacoes_adicionais}
                  onChange={e => set('observacoes_adicionais', e.target.value)}
                  placeholder="Observacoes adicionais..." />
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{aluno.observacoes_adicionais || '—'}</p>
              )}
            </div>

            {/* Informacoes do sistema (somente leitura) */}
            <div className="bg-gray-50 rounded-2xl p-5 space-y-2">
              <h3 className="font-semibold text-gray-600 text-sm mb-3">Informacoes do Sistema</h3>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Status atual:</span>{' '}
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${status.cor}`}>
                    {status.label}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Cadastrado em:</span>{' '}
                  {aluno.datacriacao ? new Date(aluno.datacriacao).toLocaleDateString('pt-BR') : '—'}
                </div>
                {aluno.cursoid && (
                  <div>
                    <span className="font-medium">Curso ID:</span> {aluno.cursoid}
                  </div>
                )}
                {aluno.turmaid && (
                  <div>
                    <span className="font-medium">Turma ID:</span> {aluno.turmaid}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2 pt-2 border-t">
                Status e informacoes academicas sao gerenciados pelo financeiro e administrativo.
              </p>
            </div>

            {/* Botoes de acao no modo edicao */}
            {editando && (
              <div className="flex gap-3">
                <button
                  onClick={handleCancelar}
                  disabled={salvando}
                  className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </RecepcaoLayout>
  );
}
