import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ComercialLayout from '@/components/ComercialLayout';
import { PageHeader, SkeletonCard } from '@/components/ui';

const KANBAN_COLUMNS = [
  { status: 'novo',                 label: 'Novo Lead',            color: 'border-blue-400 bg-blue-50/20' },
  { status: 'contatado',            label: 'Primeiro Contato',     color: 'border-yellow-400 bg-yellow-50/20' },
  { status: 'interessado',          label: 'Em Negociação',        color: 'border-orange-400 bg-orange-50/20' },
  { status: 'proposta_enviada',     label: 'Proposta Enviada',     color: 'border-indigo-400 bg-indigo-50/20' },
  { status: 'aguardando_pagamento', label: 'Aguardando Pagamento', color: 'border-purple-400 bg-purple-50/20' },
  { status: 'pago',                 label: 'Pago',                 color: 'border-emerald-400 bg-emerald-50/20' },
  { status: 'matriculado',          label: 'Matriculado',          color: 'border-teal-500 bg-teal-50/20' },
  { status: 'perdido',              label: 'Perdido',              color: 'border-red-400 bg-red-50/20' }
];

const fmtMoeda = (v) =>
  v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

export default function LeadsKanban() {
  const [leads, setLeads] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroInst, setFiltroInst] = useState('');
  const [filtroCaptador, setFiltroCaptador] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');

  // Listas de apoio
  const [instituicoes, setInstituicoes] = useState([]);
  const [captadores, setCaptadores] = useState([]);
  const [cursos, setCursos] = useState([]);

  // Carregar dados iniciais e opções de filtros
  useEffect(() => {
    fetch('/api/comercial/instituicoes', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setInstituicoes(d))
      .catch(() => {});

    fetch('/api/comercial/equipe', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setCaptadores(d))
      .catch(() => {});

    fetch('/api/comercial/cursos', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setCursos(d))
      .catch(() => {});
  }, []);

  const carregarLeads = useCallback(() => {
    setCarregando(true);
    fetch('/api/comercial/leads', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setLeads(Array.isArray(d) ? d : []))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    carregarLeads();
  }, [carregarLeads]);

  // Lógica de drag & drop nativo HTML5
  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.status === targetStatus) return;

    if (targetStatus === 'matriculado') {
      alert('O status "Matriculado" é definido automaticamente através do fluxo financeiro/acadêmico de conversão.');
      setDraggedLead(null);
      return;
    }

    const originalStatus = draggedLead.status;
    // Otimista
    setLeads(prev => prev.map(l => l.id === draggedLead.id ? { ...l, status: targetStatus } : l));

    try {
      const res = await fetch(`/api/comercial/leads/${draggedLead.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar status do lead.');
      }

      // Adicionar log automático na timeline
      await fetch(`/api/comercial/leads/${draggedLead.id}/interacoes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'atualizacao',
          titulo: 'Status Alterado',
          descricao: `Etapa comercial alterada via painel Kanban de "${originalStatus.replace('_', ' ')}" para "${targetStatus.replace('_', ' ')}"`
        })
      });

    } catch (err) {
      alert(err.message);
      // Reverter
      setLeads(prev => prev.map(l => l.id === draggedLead.id ? { ...l, status: originalStatus } : l));
    } finally {
      setDraggedLead(null);
    }
  };

  // Filtragem dos Leads
  const leadsFiltrados = leads.filter(l => {
    // Busca por Nome, Email, Telefone, WhatsApp ou CPF (extraído de observações caso presente)
    const matchBusca = !busca || 
      l.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      (l.telefone || '').includes(busca) || 
      (l.whatsapp || '').includes(busca) ||
      (l.email || '').toLowerCase().includes(busca.toLowerCase()) ||
      (l.observacoes || '').includes(busca);

    const matchInst = !filtroInst || String(l.instituicao_id) === String(filtroInst);
    const matchCaptador = !filtroCaptador || String(l.captado_por_id) === String(filtroCaptador);
    const matchCurso = !filtroCurso || String(l.cursoid) === String(filtroCurso) || l.curso_interesse === filtroCurso;
    const matchOrigem = !filtroOrigem || l.origem === filtroOrigem;
    const matchPrioridade = !filtroPrioridade || l.prioridade_followup === filtroPrioridade;

    return matchBusca && matchInst && matchCaptador && matchCurso && matchOrigem && matchPrioridade;
  });

  const getCardPrioridadeClass = (p) => {
    switch (p) {
      case 'alta': return 'border-l-4 border-orange-500';
      case 'urgente': return 'border-l-4 border-red-500 shadow-red-50/50 shadow-sm animate-pulse';
      case 'baixa': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-yellow-500'; // Média/Padrão
    }
  };

  const getPrioridadeEmoji = (p) => {
    switch (p) {
      case 'alta': return '🟠';
      case 'urgente': return '🔴';
      case 'baixa': return '🟢';
      default: return '🟡';
    }
  };

  return (
    <ComercialLayout titulo="Painel Kanban Comercial">
      <div className="space-y-6 max-w-full">

        {/* Cabeçalho */}
        <PageHeader
          icon="🎯"
          title="Funil de Vendas (Kanban)"
          subtitle="Visualize e organize a jornada comercial dos leads com fluxo drag & drop"
          actions={
            <div className="flex gap-2">
              <button
                onClick={carregarLeads}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition"
              >
                🔄 Atualizar
              </button>
              <Link href="/comercial/leads/novo">
                <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
                  + Novo Lead
                </button>
              </Link>
            </div>
          }
        />

        {/* Barra de Filtros Rápidos */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pesquisa Instantânea</label>
            <input
              type="text"
              placeholder="Buscar por nome, telefone, email..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instituição</label>
            <select
              value={filtroInst}
              onChange={e => setFiltroInst(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">Todas</option>
              {instituicoes.map(i => (
                <option key={i.id} value={i.id}>{i.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Captador</label>
            <select
              value={filtroCaptador}
              onChange={e => setFiltroCaptador(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">Todos</option>
              {captadores.map(c => (
                <option key={c.id} value={c.id}>{c.nomecompleto}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Curso</label>
            <select
              value={filtroCurso}
              onChange={e => setFiltroCurso(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">Todos</option>
              {cursos.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Origem</label>
              <select
                value={filtroOrigem}
                onChange={e => setFiltroOrigem(e.target.value)}
                className="w-full border rounded-lg px-2 py-2 text-xs focus:outline-none"
              >
                <option value="">Todas</option>
                {['Site', 'Instagram', 'Facebook', 'Google', 'WhatsApp', 'Evento', 'Indicação', 'Outro'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridade</label>
              <select
                value={filtroPrioridade}
                onChange={e => setFiltroPrioridade(e.target.value)}
                className="w-full border rounded-lg px-2 py-2 text-xs focus:outline-none"
              >
                <option value="">Todas</option>
                <option value="baixa">🟢 Baixa</option>
                <option value="media">🟡 Média</option>
                <option value="alta">🟠 Alta</option>
                <option value="urgente">🔴 Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Kanban Board Container */}
        {carregando ? (
          <SkeletonCard count={3} cols="grid-cols-1 md:grid-cols-3" />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin select-none" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
            {KANBAN_COLUMNS.map(col => {
              const colLeads = leadsFiltrados.filter(l => l.status === col.status);
              
              return (
                <div
                  key={col.status}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, col.status)}
                  className={`flex flex-col w-72 min-w-[288px] rounded-2xl border p-4 transition ${col.color}`}
                >
                  {/* Header da Coluna */}
                  <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <span className="font-bold text-sm text-gray-800 tracking-wide uppercase truncate">{col.label}</span>
                    <span className="bg-white border text-gray-500 font-extrabold text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Lista de Cards */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {colLeads.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center text-xs text-gray-400">
                        Solte cards aqui
                      </div>
                    ) : (
                      colLeads.map(lead => {
                        // Calcular dias sem contato
                        const dataRef = lead.updated_at || lead.created_at;
                        const diasSemContato = Math.floor((new Date() - new Date(dataRef)) / (1000 * 60 * 60 * 24));
                        const semContatoCritico = diasSemContato > 7;

                        // Parsear valor previsto
                        let valorMensalidade = 0;
                        let bolsaDesconto = '';
                        let convenioDesc = '';
                        try {
                          const marker = '[FICHA_MATRICULA_COMERCIAL]';
                          const idx = lead.observacoes?.indexOf(marker);
                          if (idx !== -1 && idx !== undefined) {
                            const parsed = JSON.parse(lead.observacoes.substring(idx + marker.length));
                            if (parsed && parsed.financeiro) {
                              valorMensalidade = parseFloat(parsed.financeiro.valor_mensalidade || 0);
                              bolsaDesconto = parsed.financeiro.bolsa;
                              convenioDesc = parsed.financeiro.convenio;
                            }
                          }
                        } catch (_) {}

                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={e => handleDragStart(e, lead)}
                            className={`bg-white rounded-xl border p-3.5 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-3 relative overflow-hidden ${getCardPrioridadeClass(lead.prioridade_followup)} ${
                              semContatoCritico ? 'border-red-400 bg-red-50/10' : 'border-gray-150 bg-white'
                            }`}
                          >
                            {/* Nome e Indicador Atraso */}
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-bold text-gray-800 text-xs block truncate max-w-[80%]" title={lead.nome}>
                                  {lead.nome}
                                </span>
                                <span className="text-[10px]" title={`Prioridade: ${lead.prioridade_followup || 'média'}`}>
                                  {getPrioridadeEmoji(lead.prioridade_followup)}
                                </span>
                              </div>
                              {lead.curso_interesse && (
                                <span className="text-[10px] font-medium text-gray-500 block truncate" title={lead.curso_interesse}>
                                  📚 {lead.curso_interesse}
                                </span>
                              )}
                            </div>

                            {/* Detalhes Ficha */}
                            <div className="text-[10px] text-gray-400 space-y-0.5 pt-1 border-t border-gray-100">
                              {lead.origem && (
                                <div><strong className="text-gray-500">Origem:</strong> {lead.origem}</div>
                              )}
                              {valorMensalidade > 0 && (
                                <div>
                                  <strong className="text-gray-500">Mensalidade Prevista:</strong>{' '}
                                  <span className="font-bold text-gray-800">{fmtMoeda(valorMensalidade)}</span>
                                </div>
                              )}
                              {lead.proximo_contato && (
                                <div className={lead.dias_em_atraso > 0 ? 'text-red-650 font-bold' : ''}>
                                  <strong className="text-gray-500">Follow-up:</strong> {new Date(lead.proximo_contato).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1">
                              {lead.origem && (
                                <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[8px] font-bold uppercase rounded border">
                                  {lead.origem}
                                </span>
                              )}
                              {bolsaDesconto && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-bold uppercase rounded border border-blue-200">
                                  Bolsa: {bolsaDesconto}
                                </span>
                              )}
                              {convenioDesc && (
                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[8px] font-bold uppercase rounded border border-purple-200">
                                  Convênio: {convenioDesc}
                                </span>
                              )}
                            </div>

                            {/* Sem Contato Atraso */}
                            {semContatoCritico && (
                              <div className="flex items-center gap-1 bg-red-100/50 text-red-800 text-[8px] font-extrabold px-2 py-0.5 rounded-md animate-pulse">
                                <span>⚠️</span> Sem contato há {diasSemContato} dias
                              </div>
                            )}

                            {/* Rodapé Ações */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[9px]">
                              <span className="text-gray-400 truncate max-w-[65%]">👤 {lead.usuarios?.nomecompleto || 'Sistema'}</span>
                              <Link href={`/comercial/leads/${lead.id}`} className="text-teal-600 font-bold hover:underline">
                                Ver Lead →
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </ComercialLayout>
  );
}
