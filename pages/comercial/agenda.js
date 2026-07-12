import { useState, useEffect } from 'react';
import Link from 'next/link';
import ComercialLayout from '@/components/ComercialLayout';
import { PageHeader, SkeletonCard } from '@/components/ui';

export default function AgendaComercial() {
  const [data, setData] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [secaoAtiva, setSecaoAtiva] = useState('hoje'); // 'hoje', 'amanha', 'atrasados', 'proximos'

  // Modal de Conclusão e Próximo Agendamento
  const [followupConcluindo, setFollowupConcluindo] = useState(null);
  const [obsConclusao, setObsConclusao] = useState('');
  const [salvandoConclusao, setSalvandoConclusao] = useState(false);

  // Agendamento do Próximo Contato (opcional)
  const [agendarProximo, setAgendarProximo] = useState(false);
  const [proximoTipo, setProximoTipo] = useState('ligacao');
  const [proximoAssunto, setProximoAssunto] = useState('');
  const [proximoObs, setProximoObs] = useState('');
  const [proximaData, setProximaData] = useState('');
  const [proximaPrioridade, setProximaPrioridade] = useState('media');

  const carregarAgenda = () => {
    setCarregando(true);
    setErro(null);
    fetch('/api/comercial/agenda', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('Erro ao carregar dados da agenda.');
        return r.json();
      })
      .then(d => setData(d))
      .catch(e => setErro(e.message))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregarAgenda();
  }, []);

  const handleConcluir = async (e) => {
    e.preventDefault();
    if (!followupConcluindo) return;

    setSalvandoConclusao(true);
    try {
      // 1. Concluir o atual
      const res = await fetch(`/api/comercial/leads/${followupConcluindo.lead_id}/followups`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followupId: followupConcluindo.id,
          observacao_conclusao: obsConclusao
        })
      });

      if (!res.ok) throw new Error('Falha ao concluir follow-up.');

      // 2. Agendar próximo (se marcado)
      if (agendarProximo && proximaData && proximoAssunto.trim()) {
        await fetch(`/api/comercial/leads/${followupConcluindo.lead_id}/followups`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: proximoTipo,
            assunto: proximoAssunto,
            observacao: proximoObs,
            data_agendada: proximaData,
            prioridade: proximaPrioridade
          })
        });
      }

      // Reset
      setFollowupConcluindo(null);
      setObsConclusao('');
      setAgendarProximo(false);
      setProximoAssunto('');
      setProximoObs('');
      setProximaData('');
      carregarAgenda();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvandoConclusao(false);
    }
  };

  const getPrioridadeBadge = (p) => {
    const map = {
      alta: 'bg-red-50 text-red-700 border-red-200',
      media: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      baixa: 'bg-gray-50 text-gray-500 border-gray-200'
    };
    return `px-2 py-0.5 border text-[10px] font-bold rounded uppercase ${map[p] || map.media}`;
  };

  return (
    <ComercialLayout titulo="Minha Agenda Comercial">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <PageHeader
          icon="📅"
          title="Minha Agenda Comercial"
          subtitle="Acompanhe seus agendamentos, tarefas de follow-up e compromissos comerciais"
          actions={
            <button
              onClick={carregarAgenda}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition"
            >
              🔄 Atualizar
            </button>
          }
        />

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm shadow-xs">
            ⚠️ {erro}
          </div>
        )}

        {carregando ? (
          <div className="space-y-6">
            <SkeletonCard count={4} cols="grid-cols-1 md:grid-cols-4" />
            <SkeletonCard count={2} />
          </div>
        ) : (
          data && (
            <>
              {/* KPIs & Seções */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'hoje', label: 'Hoje', count: data.kpis.totalHoje, bg: 'bg-white border-teal-500', icon: '☀️' },
                  { key: 'amanha', label: 'Amanhã', count: data.kpis.totalAmanha, bg: 'bg-white border-blue-500', icon: '🌅' },
                  {
                    key: 'atrasados',
                    label: 'Atrasados',
                    count: data.kpis.totalAtrasados,
                    bg: data.kpis.totalAtrasados > 0 ? 'bg-red-50 border-red-500 animate-pulse' : 'bg-white border-gray-300',
                    icon: '🚨',
                    customText: data.kpis.totalAtrasados > 0 ? 'text-red-700' : ''
                  },
                  { key: 'proximos', label: 'Próximos 7 Dias', count: data.kpis.totalProximos, bg: 'bg-white border-purple-500', icon: '📅' }
                ].map(card => (
                  <button
                    key={card.key}
                    onClick={() => setSecaoAtiva(card.key)}
                    className={`text-left p-5 border-2 rounded-2xl shadow-xs transition hover:shadow cursor-pointer ${card.bg} ${
                      secaoAtiva === card.key ? 'ring-2 ring-teal-500/20' : ''
                    }`}
                  >
                    <span className="text-xl">{card.icon}</span>
                    <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mt-2">{card.label}</span>
                    <span className={`text-3xl font-extrabold block mt-1 ${card.customText || 'text-gray-900'}`}>{card.count}</span>
                  </button>
                ))}
              </div>

              {/* Lista dos Compromissos Filtrados */}
              <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-6">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>📂</span> Agendamentos de follow-up: {secaoAtiva.toUpperCase()}
                </h3>

                {data[secaoAtiva]?.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    Nenhum follow-up agendado para esta seção. Bom trabalho!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data[secaoAtiva]?.map((item) => {
                      const leadsData = item.leads || {};
                      const isAtrasado = secaoAtiva === 'atrasados';
                      
                      return (
                        <div
                          key={item.id}
                          className={`border rounded-xl p-5 shadow-xs transition hover:shadow-sm space-y-3 relative ${
                            isAtrasado ? 'border-red-200 bg-red-50/20' : 'border-gray-100 bg-white'
                          }`}
                        >
                          {/* Top Badges */}
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-xs text-gray-400 block">Lead / Aluno</span>
                              <span className="font-bold text-gray-800 text-sm block">{leadsData.nome || '—'}</span>
                            </div>
                            <div className="flex gap-2">
                              {getPrioridadeBadge(item.prioridade)}
                              <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold uppercase rounded border border-teal-200">
                                {item.tipo}
                              </span>
                            </div>
                          </div>

                          {/* Data/Hora e Assunto */}
                          <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-3">
                            <div>
                              <span className="text-gray-400 font-medium block">Data Agendada:</span>
                              <span className={`font-bold ${isAtrasado ? 'text-red-600' : 'text-gray-700'}`}>
                                📅 {new Date(item.data_agendada).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 font-medium block">Assunto:</span>
                              <span className="font-semibold text-gray-700 truncate block">{item.assunto}</span>
                            </div>
                          </div>

                          {/* Detalhes/Observações */}
                          {item.observacao && (
                            <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-xs text-gray-600 leading-relaxed max-h-20 overflow-y-auto">
                              <strong>Instruções:</strong> {item.observacao}
                            </div>
                          )}

                          {/* Ações */}
                          <div className="flex items-center justify-between border-t border-gray-100 pt-3 gap-2">
                            {/* Links rápidos para contato */}
                            <div className="flex items-center gap-2">
                              {leadsData.whatsapp && (
                                <a
                                  href={`https://wa.me/55${leadsData.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg text-xs flex items-center gap-1.5 transition font-semibold"
                                >
                                  <span>📱</span> WhatsApp
                                </a>
                              )}
                              <Link href={`/comercial/leads/${item.lead_id}`} className="text-xs text-teal-600 hover:underline">
                                Ver Lead →
                              </Link>
                            </div>

                            {/* Ação Concluir */}
                            <button
                              onClick={() => setFollowupConcluindo(item)}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                            >
                              Concluir Contato
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )
        )}

        {/* Modal de Conclusão e Agendamento em Fluxo Único */}
        {followupConcluindo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-teal-600 text-white p-5">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>✅</span> Concluir Follow-up
                </h3>
                <p className="text-xs text-teal-100 mt-1">
                  Registrando retorno comercial para o lead: <strong>{followupConcluindo.leads?.nome}</strong>
                </p>
              </div>

              <form onSubmit={handleConcluir} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* 1. Retorno do Contato */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">O que foi conversado?</label>
                  <textarea
                    rows={3}
                    value={obsConclusao}
                    onChange={e => setObsConclusao(e.target.value)}
                    placeholder="Ex: Cliente atendeu, confirmou interesse no curso e solicitou retorno amanhã..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
                    required
                  />
                </div>

                {/* 2. Checkbox agendar próximo */}
                <label className="flex items-center gap-2 text-sm font-semibold text-teal-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agendarProximo}
                    onChange={e => setAgendarProximo(e.target.checked)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  Agendar próximo contato (Follow-up)
                </label>

                {/* 3. Formulário Próximo Contato */}
                {agendarProximo && (
                  <div className="border border-teal-100 bg-teal-50/20 rounded-xl p-4 space-y-3 animate-slide-down">
                    <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider">📅 Novo Agendamento</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipo de Contato</label>
                        <select
                          value={proximoTipo}
                          onChange={e => setProximoTipo(e.target.value)}
                          className="w-full border bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                        >
                          <option value="ligacao">📞 Ligação</option>
                          <option value="whatsapp">📱 WhatsApp</option>
                          <option value="email">📧 E-mail</option>
                          <option value="reuniao">🤝 Reunião</option>
                          <option value="visita">🏢 Visita</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prioridade</label>
                        <select
                          value={proximaPrioridade}
                          onChange={e => setProximaPrioridade(e.target.value)}
                          className="w-full border bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                        >
                          <option value="baixa">Baixa</option>
                          <option value="media">Média</option>
                          <option value="alta">Alta</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data e Hora Planejada</label>
                      <input
                        type="datetime-local"
                        value={proximaData}
                        onChange={e => setProximaData(e.target.value)}
                        className="w-full border bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                        required={agendarProximo}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Assunto / Motivo</label>
                      <input
                        type="text"
                        value={proximoAssunto}
                        onChange={e => setProximoAssunto(e.target.value)}
                        placeholder="Ex: Envio do contrato / Fechamento financeiro..."
                        className="w-full border bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                        required={agendarProximo}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Detalhes (Opcional)</label>
                      <textarea
                        rows={2}
                        value={proximoObs}
                        onChange={e => setProximoObs(e.target.value)}
                        placeholder="Instruções de apoio..."
                        className="w-full border bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setFollowupConcluindo(null)}
                    className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm text-gray-600 transition"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoConclusao}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white px-6 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    {salvandoConclusao ? 'Salvando...' : 'Confirmar e Gravar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ComercialLayout>
  );
}
