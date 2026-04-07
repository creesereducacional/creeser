import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';

export default function CarnesPage() {
  const [carnes, setCarnes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroAluno, setFiltroAluno] = useState('');
  const [expandidoId, setExpandidoId] = useState(null);
  const [gerandoId, setGerandoId] = useState(null);
  const [selectedParcelas, setSelectedParcelas] = useState({});
  const [cancelandoParcela, setCancelandoParcela] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(null); // { titulo, mensagem, onConfirm }
  const [modalRecibo, setModalRecibo] = useState(null); // ordemId

  const toggleParcela = (carneId, parcelaId) => {
    setSelectedParcelas(prev => {
      const set = new Set(prev[carneId] || []);
      set.has(parcelaId) ? set.delete(parcelaId) : set.add(parcelaId);
      return { ...prev, [carneId]: set };
    });
  };

  const toggleTodasParcelas = (carneId, parcelas, selecionar) => {
    const cancelaveis = parcelas.filter(p => p.status !== 'pago' && p.status !== 'cancelado');
    setSelectedParcelas(prev => ({
      ...prev,
      [carneId]: selecionar ? new Set(cancelaveis.map(p => p.id)) : new Set(),
    }));
  };

  const handleCancelarSelecionadas = (carne) => {
    const ids = [...(selectedParcelas[carne.id] || [])];
    if (!ids.length) return;
    setModalConfirmar({
      titulo: 'Cancelar parcelas',
      mensagem: `Confirma o cancelamento de ${ids.length} parcela(s)?`,
      onConfirm: async () => {
        setCancelandoParcela(true);
        try {
          for (const parcela_id of ids) {
            await fetch('/api/admin-financeiro/efi/carne', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ordem_id: carne.id, parcela_id }),
            });
          }
          setSelectedParcelas(prev => ({ ...prev, [carne.id]: new Set() }));
          await carregarCarnes();
        } finally { setCancelandoParcela(false); }
      },
    });
  };

  const handleCancelarParcela = (carne, parcela) => {
    setModalConfirmar({
      titulo: 'Cancelar parcela',
      mensagem: `Confirma o cancelamento da parcela ${parcela.numero_parcela}?`,
      onConfirm: async () => {
        setCancelandoParcela(true);
        try {
          await fetch('/api/admin-financeiro/efi/carne', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordem_id: carne.id, parcela_id: parcela.id }),
          });
          await carregarCarnes();
        } finally { setCancelandoParcela(false); }
      },
    });
  };

  useEffect(() => {
    carregarCarnes();
  }, []);

  const carregarCarnes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin-financeiro/carnes');
      if (response.ok) {
        const data = await response.json();
        setCarnes(Array.isArray(data.carnes) ? data.carnes : []);
      }
    } catch (error) {
      console.error('Erro ao carregar carnês:', error);
    } finally {
      setLoading(false);
    }
  };

  const carnesFiltrados = useMemo(() => {
    let resultado = carnes;

    if (filtroStatus) {
      resultado = resultado.filter(c => c.status === filtroStatus);
    }

    if (filtroAluno) {
      const termo = filtroAluno.toLowerCase();
      resultado = resultado.filter(c =>
        (c.aluno_nome || '').toLowerCase().includes(termo) ||
        (c.aluno_cpf || '').includes(termo)
      );
    }

    return resultado;
  }, [carnes, filtroStatus, filtroAluno]);

  const resumo = useMemo(() => {
    return {
      total: carnesFiltrados.length,
      ativas: carnesFiltrados.filter(c => c.status === 'ativo').length,
      canceladas: carnesFiltrados.filter(c => c.status === 'cancelado').length,
      valor_total: carnesFiltrados.reduce((acc, c) => acc + (Number(c.valor_total) || 0), 0)
    };
  }, [carnesFiltrados]);

  const formataValor = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formataData = (data) => {
    if (!data) return '-';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const StatusBadge = ({ status }) => {
    const cores = {
      'ativo': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800',
      'encerrado': 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${cores[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const StatusParcelaBadge = ({ status }) => {
    const cores = {
      'pendente': 'bg-amber-100 text-amber-800',
      'pago': 'bg-green-100 text-green-800',
      'vencido': 'bg-red-100 text-red-800',
      'cancelado': 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cores[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const handleGerarBoletos = async (carne) => {
    setGerandoId(carne.id);
    try {
      if (!carne.efi_carnet_id) {
        // Carnê ainda não gerado na EFI — criar agora
        const res = await fetch('/api/admin-financeiro/efi/carne', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordem_id: carne.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao gerar carnê');
        if (data.link) window.open(data.link, '_blank');
        await carregarCarnes();
      } else {
        // Já gerado — buscar link atual na EFI
        const res = await fetch(`/api/admin-financeiro/efi/carne?ordem_id=${carne.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao buscar carnê');
        if (data.link) {
          window.open(data.link, '_blank');
        } else {
          alert('Link do carnê não disponível na EFI.');
        }
      }
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setGerandoId(null);
    }
  };

  if (loading) {
    return (
      <AdminFinanceiroLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-gray-600">Carregando carnês...</p>
        </div>
      </AdminFinanceiroLayout>
    );
  }

  return (
    <AdminFinanceiroLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Carnês de Pagamento</h2>
            <p className="text-gray-600">Gestão de múltiplas parcelas por aluno</p>
          </div>
          <Link
            href="/admin-financeiro/alunos"
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition"
          >
            ➕ Novo Carnê
          </Link>
        </div>

        {/* RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700 font-semibold">Total de Carnês</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{resumo.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 font-semibold">Ativos</p>
            <p className="text-3xl font-bold text-green-900 mt-1">{resumo.ativas}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-700 font-semibold">Valor Total</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{formataValor(resumo.valor_total)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-semibold">Cancelados</p>
            <p className="text-3xl font-bold text-red-900 mt-1">{resumo.canceladas}</p>
          </div>
        </div>

        {/* FILTROS */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="🔍 Nome ou CPF do aluno..."
              value={filtroAluno}
              onChange={(e) => setFiltroAluno(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            >
              <option value="">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="cancelado">Cancelado</option>
              <option value="encerrado">Encerrado</option>
            </select>
            <button
              onClick={carregarCarnes}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* TABELA */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {carnesFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">Nenhum carnê encontrado</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {carnesFiltrados.map((carne) => (
                <div key={carne.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* CABEÇALHO DO CARNÊ */}
                  <button
                    onClick={() => setExpandidoId(expandidoId === carne.id ? null : carne.id)}
                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition text-left flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{carne.aluno_nome}</p>
                      <p className="text-sm text-gray-600">{carne.descricao}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formataValor(carne.valor_total)}</p>
                        <p className="text-xs text-gray-600">{carne.quantidade_parcelas}x</p>
                      </div>
                      <StatusBadge status={carne.status} />
                      <span className="text-xl text-gray-400">
                        {expandidoId === carne.id ? '▼' : '▶'}
                      </span>
                    </div>
                  </button>

                  {/* DETALHES EXPANDIDOS */}
                  {expandidoId === carne.id && (
                    <div className="px-6 py-4 bg-white border-t border-gray-200 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">CPF</p>
                          <p className="font-semibold text-gray-900">{carne.aluno_cpf}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Descrição</p>
                          <p className="font-semibold text-gray-900">{carne.descricao || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Data Criação</p>
                          <p className="font-semibold text-gray-900">{formataData(carne.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Valor/Parcela</p>
                          <p className="font-semibold text-gray-900">
                            {formataValor(carne.valor_total / carne.quantidade_parcelas)}
                          </p>
                        </div>
                      </div>

                      {/* TABELA DE PARCELAS */}
                      {carne.parcelas && carne.parcelas.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">Parcelas:</h4>
                            {(selectedParcelas[carne.id]?.size > 0) && (
                              <div className="flex items-center gap-3 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                                <span className="text-sm text-red-700 font-medium">{selectedParcelas[carne.id].size} selecionada(s)</span>
                                <button onClick={() => handleCancelarSelecionadas(carne)} disabled={cancelandoParcela}
                                  className="text-xs font-semibold px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                                  {cancelandoParcela ? 'Cancelando...' : 'Cancelar selecionadas'}
                                </button>
                                <button onClick={() => setSelectedParcelas(p => ({ ...p, [carne.id]: new Set() }))}
                                  className="text-xs text-gray-400 hover:text-gray-600">Limpar</button>
                              </div>
                            )}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                  <th className="px-3 py-2 w-8">
                                    <input type="checkbox"
                                      className="rounded border-gray-300 text-red-600 cursor-pointer"
                                      checked={carne.parcelas.filter(p => p.status !== 'pago' && p.status !== 'cancelado').length > 0 &&
                                        carne.parcelas.filter(p => p.status !== 'pago' && p.status !== 'cancelado').every(p => selectedParcelas[carne.id]?.has(p.id))}
                                      onChange={e => toggleTodasParcelas(carne.id, carne.parcelas, e.target.checked)}
                                    />
                                  </th>
                                  <th className="text-left px-2 py-2">Parcela</th>
                                  <th className="text-left px-2 py-2">Vencimento</th>
                                  <th className="text-right px-2 py-2">Valor</th>
                                  <th className="text-left px-2 py-2">Status</th>
                                  <th className="text-center px-2 py-2">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {carne.parcelas.map((parcela) => {
                                  const cancelavel = parcela.status !== 'pago' && parcela.status !== 'cancelado';
                                  return (
                                    <tr key={parcela.id} className={`border-b border-gray-100 ${selectedParcelas[carne.id]?.has(parcela.id) ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                                      <td className="px-3 py-2">
                                        <input type="checkbox"
                                          disabled={!cancelavel}
                                          checked={selectedParcelas[carne.id]?.has(parcela.id) || false}
                                          onChange={() => toggleParcela(carne.id, parcela.id)}
                                          className="rounded border-gray-300 text-red-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="px-2 py-2 text-gray-900 font-semibold">{parcela.numero_parcela}</td>
                                      <td className="px-2 py-2 text-gray-600">{formataData(parcela.data_vencimento)}</td>
                                      <td className="px-2 py-2 text-gray-900 font-semibold text-right">{formataValor(parcela.valor)}</td>
                                      <td className="px-2 py-2"><StatusParcelaBadge status={parcela.status} /></td>
                                      <td className="px-2 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          {parcela.status === 'pago' && (
                                            <button onClick={() => setModalRecibo(carne.id)}
                                              title="Imprimir Recibo"
                                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition">
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                            </button>
                                          )}
                                          {cancelavel && (
                                            <button onClick={() => handleCancelarParcela(carne, parcela)} disabled={cancelandoParcela}
                                              title="Cancelar parcela"
                                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition disabled:opacity-40">
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* BOTÕES */}
                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <Link
                          href={`/admin-financeiro/carne/${carne.id}`}
                          className="flex-1 px-3 py-2 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 font-semibold text-center transition text-sm"
                        >
                          Detalhes
                        </Link>
                        <button
                          onClick={() => handleGerarBoletos(carne)}
                          disabled={gerandoId === carne.id}
                          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold transition text-sm disabled:opacity-50"
                        >
                          {gerandoId === carne.id
                            ? '⏳ Aguarde...'
                            : carne.efi_carnet_id ? '📄 Abrir Carnê PDF' : '📄 Gerar Boletos'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalConfirmar && (
        <ModalConfirmar
          titulo={modalConfirmar.titulo}
          mensagem={modalConfirmar.mensagem}
          onConfirm={async () => { setModalConfirmar(null); await modalConfirmar.onConfirm(); }}
          onClose={() => setModalConfirmar(null)}
        />
      )}
      {modalRecibo && (
        <ModalRecibo ordemId={modalRecibo} onClose={() => setModalRecibo(null)} />
      )}
    </AdminFinanceiroLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de Confirmação
// ─────────────────────────────────────────────────────────────────────────────
function ModalConfirmar({ titulo, mensagem, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-bold text-gray-800">{titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">{mensagem}</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recibo HTML (para impressão)
// ─────────────────────────────────────────────────────────────────────────────
function gerarHTMLRecibo(dados) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  const valorFmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtData = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
  const numero = dados.boleto_numero || dados.ordem_id?.slice(-8).toUpperCase() || '';

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Recibo</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;padding:40px;font-size:13px;color:#222}
  .header{text-align:center;border-bottom:2px solid #1a5c3a;padding-bottom:14px;margin-bottom:18px}
  .header img{max-height:75px;max-width:180px;object-fit:contain;margin-bottom:8px}
  .header h1{font-size:20px;font-weight:bold;color:#1a5c3a}
  .header p{font-size:11px;color:#555;margin-top:3px}
  h2{text-align:center;font-size:15px;letter-spacing:3px;text-transform:uppercase;margin-bottom:18px;color:#333}
  .numero{text-align:right;font-size:11px;color:#888;margin-bottom:14px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;margin-bottom:20px}
  .item label{font-size:10px;font-weight:bold;text-transform:uppercase;color:#888;display:block}
  .item span{font-size:13px}
  .full{grid-column:1/-1}
  .valor-box{border:2px solid #1a5c3a;border-radius:6px;padding:18px;text-align:center;margin:18px 0;background:#f0faf5}
  .valor-box label{font-size:11px;text-transform:uppercase;color:#555;display:block;margin-bottom:4px}
  .valor-box span{font-size:30px;font-weight:bold;color:#1a5c3a}
  .footer{margin-top:48px;text-align:center}
  .assinatura{display:inline-block;border-top:1px solid #333;margin-top:56px;padding-top:4px;min-width:240px;font-size:11px;color:#555}
  .rodape{font-size:10px;color:#bbb;margin-top:20px}
  @media print{body{padding:20px}}
</style></head><body>
<div class="header">
  ${dados.instituicao.logo ? `<img src="${dados.instituicao.logo}" alt="Logo" />` : ''}
  <h1>${dados.instituicao.nome}</h1>
  ${dados.instituicao.cnpj ? `<p>CNPJ: ${dados.instituicao.cnpj}</p>` : ''}
  ${dados.instituicao.endereco ? `<p>${dados.instituicao.endereco}${dados.instituicao.cidade ? `, ${dados.instituicao.cidade}` : ''}${dados.instituicao.estado ? `/${dados.instituicao.estado}` : ''}</p>` : ''}
  ${dados.instituicao.telefone ? `<p>Tel: ${dados.instituicao.telefone}</p>` : ''}
</div>
<h2>Recibo de Pagamento</h2>
<div class="numero">${numero ? `Nº ${numero} &nbsp;|&nbsp;` : ''}Emitido em: ${hoje}</div>
<div class="grid">
  <div class="item"><label>Aluno</label><span>${dados.aluno.nome}</span></div>
  <div class="item"><label>CPF</label><span>${dados.aluno.cpf}</span></div>
  <div class="item"><label>Curso</label><span>${dados.curso.nome}</span></div>
  <div class="item"><label>Turma</label><span>${dados.turma.nome}</span></div>
  <div class="item full"><label>Descrição</label><span>${dados.descricao}</span></div>
  ${dados.referencia ? `<div class="item"><label>Referência</label><span>${dados.referencia}</span></div>` : ''}
  <div class="item"><label>Vencimento</label><span>${fmtData(dados.data_vencimento)}</span></div>
</div>
<div class="valor-box">
  <label>Valor Pago</label>
  <span>${valorFmt(dados.valor)}</span>
</div>
<div class="footer">
  <div class="assinatura">${dados.instituicao.nome}<br>Responsável pela Instituição</div>
  <p class="rodape">Recibo gerado em ${hoje} &nbsp;|&nbsp; Sistema Creeser Educacional</p>
</div>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal Recibo
// ─────────────────────────────────────────────────────────────────────────────
function ModalRecibo({ ordemId, onClose }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch(`/api/admin-financeiro/recibo/${ordemId}`)
      .then(r => r.ok ? r.json() : r.json().then(b => { throw new Error(b.message); }))
      .then(d => { setDados(d); setLoading(false); })
      .catch(e => { setErro(e.message); setLoading(false); });
  }, [ordemId]);

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=820,height=700');
    w.document.write(gerarHTMLRecibo(dados));
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  const fmtValor = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtData = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-emerald-700">Recibo de Pagamento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-gray-500 text-sm">Carregando dados...</div>
        ) : erro ? (
          <div className="px-6 py-10 text-center text-red-500 text-sm">{erro}</div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-3">
              <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50 space-y-3">
                <div className="text-center border-b border-emerald-200 pb-3">
                  {dados.instituicao.logo && (
                    <img src={dados.instituicao.logo} alt="Logo" className="h-12 w-auto object-contain mx-auto mb-2" />
                  )}
                  <p className="font-bold text-emerald-800">{dados.instituicao.nome}</p>
                  {dados.instituicao.cnpj && <p className="text-xs text-gray-500">CNPJ: {dados.instituicao.cnpj}</p>}
                  {dados.instituicao.cidade && (
                    <p className="text-xs text-gray-500">
                      {dados.instituicao.cidade}{dados.instituicao.estado ? `/${dados.instituicao.estado}` : ''}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div><span className="font-semibold text-gray-500">Aluno:</span> <span className="text-gray-800">{dados.aluno.nome}</span></div>
                  <div><span className="font-semibold text-gray-500">CPF:</span> <span className="text-gray-800">{dados.aluno.cpf}</span></div>
                  <div><span className="font-semibold text-gray-500">Curso:</span> <span className="text-gray-800">{dados.curso.nome}</span></div>
                  <div><span className="font-semibold text-gray-500">Turma:</span> <span className="text-gray-800">{dados.turma.nome}</span></div>
                  <div className="col-span-2"><span className="font-semibold text-gray-500">Descrição:</span> <span className="text-gray-800">{dados.descricao}</span></div>
                  {dados.referencia && (
                    <div><span className="font-semibold text-gray-500">Referência:</span> <span className="text-gray-800">{dados.referencia}</span></div>
                  )}
                  <div><span className="font-semibold text-gray-500">Vencimento:</span> <span className="text-gray-800">{fmtData(dados.data_vencimento)}</span></div>
                </div>
                <div className="text-center pt-2 border-t border-emerald-200">
                  <p className="text-xs text-gray-500 mb-1">Valor pago</p>
                  <p className="text-2xl font-bold text-emerald-700">{fmtValor(dados.valor)}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <button onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">
                Fechar
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir Recibo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
