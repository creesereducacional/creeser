/**
 * Página Admin — Confirmar Turma / Ativar Alunos
 * Rota: /admin/alunos/confirmar-turma
 *
 * Lista alunos com status AGUARDANDO_FORMACAO_TURMA
 * Permite ativá-los (ATIVO) com confirmação de turma.
 *
 * Acesso: grupo_admin, instituicao_admin, admin
 */
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

const STATUS_LABELS = {
  PRE_CADASTRO:                   { label: 'Pré-Cadastro',                     cor: 'bg-gray-100 text-gray-700' },
  AGUARDANDO_PAGAMENTO_MATRICULA: { label: 'Aguardando Pgto. Matrícula',       cor: 'bg-purple-100 text-purple-800' },
  AGUARDANDO_FORMACAO_TURMA:      { label: 'Aguardando Formação de Turma',     cor: 'bg-indigo-100 text-indigo-800' },
  ATIVO:                          { label: 'Ativo',                            cor: 'bg-green-100 text-green-800' },
};

export default function ConfirmarTurmaPage() {
  const [alunos, setAlunos]       = useState([]);
  const [turmas, setTurmas]       = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [turmasSel, setTurmasSel]   = useState({});
  const [ativando, setAtivando]     = useState(null);
  const [msg, setMsg]               = useState(null);

  // Carregar alunos aguardando formação de turma
  const carregarAlunos = () => {
    setCarregando(true);
    fetch('/api/recepcao/pre-cadastros', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const lista = Array.isArray(data) ? data : [];
        setAlunos(lista.filter(a => a.statusmatricula === 'AGUARDANDO_FORMACAO_TURMA'));
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregarAlunos();
    fetch('/api/turmas', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setTurmas(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleAtivar = async (aluno) => {
    if (!window.confirm(`Confirmar ativação de "${aluno.nome}"? Esta ação mudará o status para ATIVO.`)) return;

    setAtivando(aluno.id);
    setMsg(null);
    try {
      const res = await fetch('/api/alunos/ativar', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: aluno.id,
          turmaid: turmasSel[aluno.id] || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ tipo: 'erro', texto: data.error || 'Erro ao ativar aluno.' });
      } else {
        setMsg({ tipo: 'sucesso', texto: data.mensagem });
        carregarAlunos();
      }
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro de conexão.' });
    } finally {
      setAtivando(null);
    }
  };

  const turmasPorCurso = (cursoid) =>
    turmas.filter(t =>
      (!cursoid || t.cursoid === Number(cursoid)) &&
      ['ATIVO', 'EM_ANDAMENTO', 'ABERTA'].includes(String(t.situacao || '').toUpperCase())
    );

  return (
    <DashboardLayout titulo="Confirmar Turma / Ativar Alunos">
      <div className="space-y-5 max-w-5xl">

        {/* Cabeçalho informativo */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-sm text-indigo-800">
          <p className="font-semibold mb-1">Como funciona:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-indigo-700">
            <li>Aluno faz pré-cadastro → Financeiro gera cobrança da matrícula</li>
            <li>Pagamento confirmado → Aluno fica como <strong>Aguardando Formação de Turma</strong></li>
            <li>Você confirma a turma aqui → Aluno torna-se <strong>Ativo</strong></li>
          </ol>
        </div>

        {/* Mensagem de feedback */}
        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm border ${msg.tipo === 'sucesso' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {msg.texto}
          </div>
        )}

        {/* Tabela */}
        {carregando ? (
          <div className="text-gray-400 text-sm py-12 text-center">Carregando…</div>
        ) : alunos.length === 0 ? (
          <div className="text-gray-400 text-sm py-12 text-center">
            Nenhum aluno aguardando formação de turma no momento.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Aluno</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">CPF</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Turma (opcional)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alunos.map(a => {
                  const cfg = STATUS_LABELS[a.statusmatricula] || { label: a.statusmatricula, cor: 'bg-gray-100 text-gray-600' };
                  const turmasDisp = turmasPorCurso(a.cursoid);
                  return (
                    <tr key={a.id} className="hover:bg-indigo-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{a.nome}</p>
                        {a.email && <p className="text-xs text-gray-400">{a.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{a.cpf || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cor}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={turmasSel[a.id] || ''}
                          onChange={e => setTurmasSel(prev => ({ ...prev, [a.id]: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                          <option value="">— Manter turma atual —</option>
                          {turmasDisp.map(t => (
                            <option key={t.id} value={t.id}>{t.nome}</option>
                          ))}
                          {turmasDisp.length === 0 && (
                            <option disabled>Nenhuma turma ativa para este curso</option>
                          )}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleAtivar(a)}
                          disabled={ativando === a.id}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {ativando === a.id ? 'Ativando…' : '✅ Confirmar e Ativar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t text-xs text-gray-400">
              {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} aguardando confirmação
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/admin/alunos"
            className="text-sm text-indigo-600 hover:underline">
            ← Ver todos os alunos
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
