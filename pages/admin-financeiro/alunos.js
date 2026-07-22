import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';
import BarraFiltros from '@/components/AdminFinanceiro/BarraFiltros';
import { FinanceEngine } from '../../lib/financeiro/FinanceEngine';

const PLANOS_FINANCEIROS = [
  'MENSAL', 'SEMESTRAL', 'ANUAL', 'AVULSO', 'BOLSISTA', 'CONVÊNIO'
];

function ModalDadosFinanceiros({ aluno, onClose, onSalvo }) {
  const [form, setForm] = useState({
    planoFinanceiro: aluno.plano_financeiro || '',
    valorMatricula: aluno.valor_matricula || '',
    valorMensalidade: aluno.valor_mensalidade || '',
    percentualDesconto: aluno.percentual_desconto || '',
    quantidadeParcelas: aluno.qtd_parcelas || '',
    diaPagamento: aluno.dia_pagamento || '',
    quantidadeMesesContrato: aluno.qtd_meses_contrato || '',
    cnpjBoleto: aluno.cnpj_boleto || '',
    razaoSocialBoleto: aluno.razao_social_boleto || '',
    alunoBolsista: aluno.aluno_bolsista != null ? String(aluno.aluno_bolsista) : '',
    percentualBolsaEstudo: aluno.percentual_bolsa || '',
    financiamentoEstudantil: aluno.financiamento_estudantil || '',
    percentualFinanciamento: aluno.percentual_financiamento || '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch(`/api/alunos/${aluno.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      onSalvo();
      onClose();
    } catch (e) {
      setErro('Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-teal-700">Dados Financeiros</h3>
            <p className="text-sm text-gray-500">{aluno.nome}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          {/* Plano */}
          <div>
            <label className="text-xs font-medium text-teal-600 mb-1 block">Planos Financeiros</label>
            <select name="planoFinanceiro" value={form.planoFinanceiro} onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50">
              <option value="">Selecione</option>
              {PLANOS_FINANCEIROS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Matrícula + Mensalidade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">R$ Matrícula</label>
              <input type="number" name="valorMatricula" value={form.valorMatricula} onChange={handleChange} step="0.01" min="0"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" placeholder="0,00" />
            </div>
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">R$ Mensalidade</label>
              <input type="number" name="valorMensalidade" value={form.valorMensalidade} onChange={handleChange} step="0.01" min="0"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" placeholder="0,00" />
            </div>
          </div>

          {/* Desconto + Parcelas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">Desconto (%)</label>
              <input type="number" name="percentualDesconto" value={form.percentualDesconto} onChange={handleChange} step="0.01" min="0" max="100"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">Qtd. de Parcelas</label>
              <input type="number" name="quantidadeParcelas" value={form.quantidadeParcelas} onChange={handleChange} min="1"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" placeholder="Quantidade de parcelas" />
            </div>
          </div>

          {/* Dia Pag + Meses Contrato */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">Dia de Pagamento</label>
              <input type="number" name="diaPagamento" value={form.diaPagamento} onChange={handleChange} min="1" max="31"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" placeholder="Dia de pagamento escolhido pelo aluno" />
            </div>
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">Qtd. Meses Contrato</label>
              <input type="number" name="quantidadeMesesContrato" value={form.quantidadeMesesContrato} onChange={handleChange} min="1"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" placeholder="Qtd. período contratual" />
            </div>
          </div>

          {/* CNPJ + Razão Social */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">CNPJ no Boleto</label>
              <input type="text" name="cnpjBoleto" value={form.cnpjBoleto} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">Razão Social</label>
              <input type="text" name="razaoSocialBoleto" value={form.razaoSocialBoleto} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" placeholder="Razão social para emissão" />
            </div>
          </div>

          {/* Bolsista + % Bolsa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">Aluno Bolsista?</label>
              <select name="alunoBolsista" value={form.alunoBolsista} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50">
                <option value="">- Escolha uma opção -</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">(%) Bolsa de Estudo</label>
              <input type="number" name="percentualBolsaEstudo" value={form.percentualBolsaEstudo} onChange={handleChange} step="0.01" min="0" max="100"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" placeholder="Percentual da bolsa" />
            </div>
          </div>

          {/* Financiamento + % Financiamento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">Financiamento Estudantil</label>
              <select name="financiamentoEstudantil" value={form.financiamentoEstudantil} onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50">
                <option value="">- Escolha uma opção -</option>
                <option value="FIES">FIES</option>
                <option value="PROUNI">PROUNI</option>
                <option value="PRIVADO">Financiamento Privado</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-teal-600 mb-1 block">(%) Financiamento</label>
              <input type="number" name="percentualFinanciamento" value={form.percentualFinanciamento} onChange={handleChange} step="0.01" min="0" max="100"
                className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50" placeholder="Percentual do financiamento" />
            </div>
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
            Cancelar
          </button>
          <button onClick={handleSalvar} disabled={salvando}
            className="px-5 py-2 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

const CATEGORIAS_ORDEM = [
  'ACORDO', 'APÓLICE DE SEGURO', 'APÓLICE DE SEGURO E CRACHÁ', 'BIBLIOTECA',
  'CANCELAMENTO', 'CERTIFICADO DE PÓS GRADUAÇÃO', 'CRACHÁ', 'CURSO DE FÉRIAS',
  'DECLARAÇÃO DE MATRÍCULA', 'DESISTÊNCIA', 'EMENTÁRIO', 'ESTÁGIO',
  'ESTUDO DIRIGIDO', 'FARDAMENTO', 'FATURA AVULSA', 'FUNDACRED',
  'HISTÓRICO', 'INSCRIÇÃO EVENTO', 'INSCRIÇÃO PROCESSO SELETIVO',
  'MATERIAL DIDÁTICO', 'MATRÍCULA', 'MENSALIDADE', 'NEGOCIAÇÃO', 'OUTROS',
  'REABERTURA DE ATIVIDADES', 'REINGRESSO MATRÍCULA', 'REMATRÍCULA',
  'REPOSIÇÃO DE DISCIPLINAS', 'SOLICITAÇÃO', 'TAXA DE INSCRIÇÃO',
  'TRANCAMENTO', 'TRANSFERÊNCIA',
];

function FieldGroup({ label, children, className = '' }) {
  return (
    <div className={`flex items-stretch rounded-lg border border-teal-300 bg-teal-50 focus-within:border-teal-500 ${className}`}>
      <span className="px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-100 border-r border-teal-300 flex items-center whitespace-nowrap rounded-l-lg flex-shrink-0">{label}</span>
      {children}
    </div>
  );
}

function ModalOrdem({ aluno, onClose, onSalvo, onSuccess }) {
  const hoje = new Date();
  const diaAluno = aluno.dia_pagamento || hoje.getDate();
  const vencimentoPadrao = new Date(hoje.getFullYear(), hoje.getMonth(), diaAluno);
  if (vencimentoPadrao < hoje) vencimentoPadrao.setMonth(vencimentoPadrao.getMonth() + 1);
  const vencimentoStr = vencimentoPadrao.toISOString().split('T')[0];

  const [form, setForm] = useState({
    descricao: '',
    categoria: '',
    valor: aluno.valor_mensalidade || '',
    percentual_desconto: '',
    vencimento_desconto: '',
    data_vencimento: vencimentoStr,
    quantidade_parcelas: 1,
    // campos para acordo
    valor_entrada: '',
    data_vencimento_entrada: vencimentoStr,
    dia_vencimento_parcelas: diaAluno,
    quantidade_parcelas_acordo: 1,
  });

  const [parcelasAberto, setParcelasAberto] = useState([]);
  const [loadingParcelas, setLoadingParcelas] = useState(false);
  const [selectedParcelas, setSelectedParcelas] = useState(new Set());

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [tipoDesconto, setTipoDesconto] = useState('%');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Carregar parcelas em aberto/vencidas do aluno quando a categoria for ACORDO
  useEffect(() => {
    if (form.categoria === 'ACORDO') {
      setLoadingParcelas(true);
      setErro('');
      fetch(`/api/admin-financeiro/aluno-ordens/${aluno.id}`)
        .then(res => res.json())
        .then(data => {
          // Extrair parcelas não pagas e não canceladas das ordens e dos carnês
          const parcelasOriginais = [];

          // Das ordens simples
          (data.ordens || []).forEach(o => {
            // Em aluno-ordens/[id].js, as ordens vêm agregadas com dados da parcela
            // e os detalhes completos vêm no array financeiro_parcelas
            const parcList = o.financeiro_parcelas || [];
            parcList.forEach(p => {
              if (p.status !== 'pago' && p.status !== 'cancelado') {
                parcelasOriginais.push({
                  id: p.id,
                  descricao: o.descricao || 'Fatura',
                  referencia: o.referencia || 'Ordem Simples',
                  data_vencimento: p.data_vencimento,
                  valor: Number(p.valor) || 0,
                  numero_parcela: p.numero_parcela,
                  cobranca: p.boleto_numero || p.efi_charge_id || o.efi_charge_id
                });
              }
            });
          });

          // Dos carnês
          (data.carnes || []).forEach(c => {
            const parcList = c.parcelas || [];
            parcList.forEach(p => {
              if (p.status !== 'pago' && p.status !== 'cancelado') {
                parcelasOriginais.push({
                  id: p.id,
                  descricao: c.descricao || 'Carnê',
                  referencia: c.referencia || 'Carnê',
                  data_vencimento: p.data_vencimento,
                  valor: Number(p.valor) || 0,
                  numero_parcela: p.numero_parcela,
                  cobranca: p.boleto_numero || p.efi_charge_id
                });
              }
            });
          });

          // Ordenar por data de vencimento
          parcelasOriginais.sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));

          setParcelasAberto(parcelasOriginais);
          // Auto-selecionar todas por padrão
          setSelectedParcelas(new Set(parcelasOriginais.map(p => p.id)));
        })
        .catch(err => {
          console.error(err);
          setErro('Erro ao carregar parcelas em aberto.');
        })
        .finally(() => {
          setLoadingParcelas(false);
        });
    } else {
      setParcelasAberto([]);
      setSelectedParcelas(new Set());
    }
  }, [form.categoria, aluno.id]);

  const totalDebitoSelecionado = Array.from(selectedParcelas).reduce((acc, id) => {
    const p = parcelasAberto.find(x => x.id === id);
    return acc + (p ? p.valor : 0);
  }, 0);

  const entrada = Number(form.valor_entrada) || 0;
  const saldo = Math.max(0, totalDebitoSelecionado - entrada);
  const qtdParcelasAcordo = Number(form.quantidade_parcelas_acordo) || 1;
  const valorParcelaAcordo = saldo / qtdParcelasAcordo;

  const valorFinal = () => {
    return FinanceEngine.calcularParcelaFinal(form.valor, form.percentual_desconto, tipoDesconto);
  };

  const handleToggleParcela = (id) => {
    setSelectedParcelas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleTodas = () => {
    if (selectedParcelas.size === parcelasAberto.length) {
      setSelectedParcelas(new Set());
    } else {
      setSelectedParcelas(new Set(parcelasAberto.map(p => p.id)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.categoria === 'ACORDO') {
      // Validações do Acordo
      if (selectedParcelas.size === 0) return setErro('Selecione ao menos uma parcela original.');
      if (entrada <= 0) return setErro('O valor de entrada deve ser maior que zero.');
      if (entrada > totalDebitoSelecionado) return setErro('O valor de entrada não pode ser maior que o débito total.');
      if (!form.data_vencimento_entrada) return setErro('Data de vencimento da entrada é obrigatória.');
      if (qtdParcelasAcordo <= 0) return setErro('A quantidade de parcelas deve ser maior que zero.');
      if (!form.dia_vencimento_parcelas || Number(form.dia_vencimento_parcelas) < 1 || Number(form.dia_vencimento_parcelas) > 31) {
        return setErro('Dia de vencimento das parcelas deve ser entre 1 e 31.');
      }
      if (!form.descricao.trim()) return setErro('Observação/Descrição é obrigatória.');

      setSalvando(true); setErro('');
      try {
        const res = await fetch('/api/admin-financeiro/acordos/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aluno_id: aluno.id,
            descricao: form.descricao.trim(),
            parcelas_originais: Array.from(selectedParcelas),
            valor_entrada: entrada,
            data_vencimento_entrada: form.data_vencimento_entrada,
            quantidade_parcelas: qtdParcelasAcordo,
            dia_vencimento_parcelas: Number(form.dia_vencimento_parcelas),
          }),
        });
        const resBody = await res.json();
        if (!res.ok) throw new Error(resBody.message || 'Erro ao criar acordo');

        // Gerar boleto no banco EFI para a parcela de entrada
        const entradaParcelaId = resBody.parcelas?.find(p => p.numero_parcela === 1)?.id;
        if (entradaParcelaId) {
          setSucesso('⏳ Gerando boleto da entrada no banco EFI...');
          const efiRes = await fetch('/api/admin-financeiro/efi/cobranca', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parcela_id: entradaParcelaId, descricao: `Entrada - ${form.descricao.trim()}` }),
          });
          if (!efiRes.ok) {
            const efiBody = await efiRes.json();
            setSucesso('✅ Acordo criado, mas falha no boleto da entrada: ' + (efiBody.message || 'erro desconhecido'));
            setTimeout(() => { onSalvo(); onSuccess(); onClose(); }, 2500);
            return;
          }
        }

        setSucesso('✅ Acordo financeiro criado com sucesso!');
        setTimeout(() => { onSalvo(); onSuccess(); onClose(); }, 800);
      } catch (err) { setErro(err.message); } finally { setSalvando(false); }

    } else {
      // Comportamento original
      if (!form.descricao.trim()) return setErro('Descrição é obrigatória');
      if (!form.valor || Number(form.valor) <= 0) return setErro('Valor deve ser maior que zero');
      
      // Validações preventivas no Frontend
      const cpfSanitizado = (aluno.cpf || '').replace(/\D/g, '');
      if (!cpfSanitizado || cpfSanitizado.length !== 11) {
        return setErro('CPF do aluno é inválido ou incompleto (deve conter 11 dígitos). Ajuste o cadastro antes de prosseguir.');
      }
      if (!aluno.instituicao_id) {
        return setErro('O aluno não possui vínculo com uma instituição cadastrada no sistema.');
      }

      setSalvando(true); setErro('');
      try {
        const qtd = Number(form.quantidade_parcelas) || 1;
        const pctDesc = tipoDesconto === '%' ? (Number(form.percentual_desconto) || 0) : 0;
        const valDesc = tipoDesconto === 'R$' ? (Number(form.percentual_desconto) || 0) : Number(form.valor) * (pctDesc / 100);
        const res = await fetch('/api/admin-financeiro/ordens/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aluno_id: aluno.id, tipo: 'ordem_simples',
            descricao: form.descricao.trim(),
            referencia: form.categoria || null,
            valor_total: Number(form.valor),
            percentual_desconto: pctDesc,
            valor_desconto: valDesc,
            quantidade_parcelas: qtd,
            data_vencimento_primeira: form.data_vencimento,
            criado_por: 'financeiro',
          }),
        });
        const resBody = await res.json();
        if (!res.ok) throw new Error(resBody.error || resBody.message || 'Erro ao criar ordem');

        const parcela_id = resBody.parcelas?.[0]?.id;
        if (parcela_id) {
          setSucesso('⏳ Gerando boleto no banco EFI...');
          const efiRes = await fetch('/api/admin-financeiro/efi/cobranca', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parcela_id, descricao: form.descricao.trim() }),
          });
          if (!efiRes.ok) {
            const efiBody = await efiRes.json();
            setSucesso('✅ Ordem criada, mas falha no boleto EFI: ' + (efiBody.message || 'erro desconhecido'));
            setTimeout(() => { onSalvo(); onSuccess(); onClose(); }, 2000);
            return;
          }
        }

        setSucesso('✅ Ordem e boleto EFI criados com sucesso!');
        setTimeout(() => { onSalvo(); onSuccess(); onClose(); }, 800);
      } catch (e) { setErro(e.message); } finally { setSalvando(false); }
    }
  };

  const inputCls = 'flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-blue-700">
              {form.categoria === 'ACORDO' ? 'Novo Acordo Financeiro' : 'Nova Ordem de Pagamento'}
            </h3>
            <p className="text-sm text-gray-500">{aluno.nome}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-650">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            
            {/* Escolha de categoria e seletor */}
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Categoria" className="col-span-2">
                <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
                  className={inputCls + ' cursor-pointer'}>
                  <option value="">- Escolha uma Categoria -</option>
                  {CATEGORIAS_ORDEM.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldGroup>
            </div>

            {form.categoria === 'ACORDO' ? (
              // ── ÁREA DO ACORDO FINANCEIRO ─────────────────────────────────────────────
              <div className="space-y-4">
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Selecione as Parcelas originais para o Acordo:</span>
                    {parcelasAberto.length > 0 && (
                      <button type="button" onClick={handleToggleTodas} className="text-xs text-teal-600 hover:text-teal-700 font-bold">
                        {selectedParcelas.size === parcelasAberto.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                      </button>
                    )}
                  </div>

                  {loadingParcelas ? (
                    <p className="text-xs text-gray-400 italic py-2 text-center">Carregando faturas do aluno...</p>
                  ) : parcelasAberto.length === 0 ? (
                    <p className="text-xs text-gray-450 italic py-2 text-center">Nenhuma fatura em aberto encontrada para este aluno.</p>
                  ) : (
                    <div className="border rounded-lg max-h-[160px] overflow-y-auto p-2 bg-gray-50 space-y-1">
                      {parcelasAberto.map(p => (
                        <label key={p.id} className="flex items-center justify-between p-1.5 hover:bg-white rounded cursor-pointer text-xs select-none">
                          <div className="flex items-center gap-2">
                            <input type="checkbox"
                              checked={selectedParcelas.has(p.id)}
                              onChange={() => handleToggleParcela(p.id)}
                              className="rounded border-gray-300 text-teal-600 cursor-pointer" />
                            <span className="font-medium text-gray-800">{p.descricao} (Nº {p.numero_parcela})</span>
                            <span className="text-gray-450">· Ref: {p.referencia}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-500">Venc. {p.data_vencimento.split('-').reverse().join('/')}</span>
                            <span className="font-bold text-gray-900">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Valor de Entrada *">
                    <input type="number" step="0.01" min="0.01" value={form.valor_entrada}
                      onChange={e => set('valor_entrada', e.target.value)} required
                      className={inputCls} placeholder="R$ 0,00" />
                  </FieldGroup>
                  <FieldGroup label="Vencimento Entrada *">
                    <input type="date" value={form.data_vencimento_entrada}
                      onChange={e => set('data_vencimento_entrada', e.target.value)} required
                      className={inputCls} />
                  </FieldGroup>
                  <FieldGroup label="Qtd. Parcelas Saldo *">
                    <input type="number" min="1" max="60" value={form.quantidade_parcelas_acordo}
                      onChange={e => set('quantidade_parcelas_acordo', e.target.value)} required
                      className={inputCls} />
                  </FieldGroup>
                  <FieldGroup label="Dia Venc. Parcelas *">
                    <input type="number" min="1" max="31" value={form.dia_vencimento_parcelas}
                      onChange={e => set('dia_vencimento_parcelas', e.target.value)} required
                      className={inputCls} />
                  </FieldGroup>
                </div>

                {/* Resumo do Acordo */}
                {totalDebitoSelecionado > 0 && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between text-gray-700">
                      <span>Total do Débito Selecionado:</span>
                      <span className="font-bold">R$ {totalDebitoSelecionado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Valor de Entrada obrigatória:</span>
                      <span className="font-bold text-blue-700">- R$ {entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Saldo Restante:</span>
                      <span className="font-bold">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-teal-200 my-1" />
                    <div className="flex justify-between text-teal-850 font-bold text-base">
                      <span>{qtdParcelasAcordo}x parcelas de saldo de:</span>
                      <span>R$ {valorParcelaAcordo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}

                {/* Descrição obrigatória */}
                <FieldGroup label="Observações / Justificativa *">
                  <textarea rows={2} value={form.descricao}
                    onChange={e => set('descricao', e.target.value)} required
                    className={inputCls + ' resize-none'} placeholder="Descreva os termos do acordo (obrigatório, mínimo 10 caracteres)." />
                </FieldGroup>
              </div>
            ) : (
              // ── COMPORTAMENTO ORIGINAL (OUTRAS CATEGORIAS) ──────────────────────────────
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Valor *">
                  <input type="number" step="0.01" min="0" value={form.valor}
                    onChange={e => set('valor', e.target.value)}
                    className={inputCls} placeholder="Valor da fatura" />
                </FieldGroup>
                <div className="flex items-stretch rounded-lg border border-teal-300 bg-teal-50 focus-within:border-teal-500">
                  <span className="px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-100 border-r border-teal-300 flex items-center rounded-l-lg flex-shrink-0">Desconto</span>
                  <input type="number" step="0.01" min="0" max={tipoDesconto === '%' ? 100 : undefined} value={form.percentual_desconto}
                    onChange={e => set('percentual_desconto', e.target.value)}
                    className={inputCls} placeholder="0" />
                  <select
                    value={tipoDesconto}
                    onChange={e => { setTipoDesconto(e.target.value); set('percentual_desconto', ''); }}
                    className="px-2 py-2 text-xs font-bold text-teal-700 bg-teal-100 border-l border-teal-300 rounded-r-lg flex-shrink-0 focus:outline-none cursor-pointer">
                    <option value="%">%</option>
                    <option value="R$">R$</option>
                  </select>
                </div>

                <FieldGroup label="Vencimento *">
                  <input type="date" value={form.data_vencimento}
                    onChange={e => set('data_vencimento', e.target.value)}
                    className={inputCls} />
                </FieldGroup>
                <FieldGroup label="Vencimento do Desconto">
                  <input type="date" value={form.vencimento_desconto}
                    onChange={e => set('vencimento_desconto', e.target.value)}
                    className={inputCls} />
                </FieldGroup>

                <FieldGroup label="Qtd. Parcelas">
                  <input type="number" min="1" max="60" value={form.quantidade_parcelas}
                    onChange={e => set('quantidade_parcelas', e.target.value)}
                    className={inputCls} placeholder="Quantidade de parcelas." />
                </FieldGroup>

                <FieldGroup label="Descrição *" className="col-span-2">
                  <textarea rows={2} value={form.descricao}
                    onChange={e => set('descricao', e.target.value)}
                    className={inputCls + ' resize-none'} placeholder="Insira a descrição." />
                </FieldGroup>

                {Number(form.valor) > 0 && (
                  <div className="col-span-2 flex items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
                    Valor final: <strong className="ml-1">R$ {valorFinal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
              </div>
            )}

            {erro && <p className="text-sm text-red-650 font-semibold">{erro}</p>}
            {sucesso && <p className="text-sm text-green-650 font-semibold">{sucesso}</p>}
          </div>

          <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
            <button type="button" onClick={onClose} disabled={salvando} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">Cancelar</button>
            <button type="submit" disabled={salvando || (form.categoria === 'ACORDO' && (selectedParcelas.size === 0 || !form.descricao || form.descricao.trim().length < 10))}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              {salvando ? 'Processando...' : form.categoria === 'ACORDO' ? 'Confirmar Acordo' : 'Criar Ordem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalCarne({ aluno, onClose, onSalvo, onSuccess }) {
  const hoje = new Date();
  const diaAluno = aluno.dia_pagamento || hoje.getDate();
  const vencimentoPadrao = new Date(hoje.getFullYear(), hoje.getMonth(), diaAluno);
  if (vencimentoPadrao < hoje) vencimentoPadrao.setMonth(vencimentoPadrao.getMonth() + 1);
  const vencimentoStr = vencimentoPadrao.toISOString().split('T')[0];

  const [form, setForm] = useState({
    descricao: '',
    valor: aluno.valor_mensalidade || '',
    percentual_desconto: '',
    vencimento_desconto: '',
    quantidade_parcelas: aluno.qtd_parcelas || 12,
    periodo: 'Período Único',
    data_vencimento: vencimentoStr,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [tipoDesconto, setTipoDesconto] = useState('%');

  // Configurações carregadas da empresa
  const [configFinanceira, setConfigFinanceira] = useState({
    multa: 2.0,
    juros: 0.033, // ao dia
    tolerancia: 0,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Carrega as configurações financeiras padrão
  useEffect(() => {
    fetch('/api/configuracoes/empresa', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          const multaConf = d.financeiro?.multaGerencianet !== undefined ? Number(d.financeiro.multaGerencianet) : (Number(d.financeiro?.multa_percentual) || 2.0);
          const jurosConf = d.financeiro?.jurosGerencianet !== undefined ? Number(d.financeiro.jurosGerencianet) : (Number(d.financeiro?.juros_percentual) / 30 || 0.033);
          const toleranciaConf = d.financeiro?.tolerancia_dias !== undefined ? Number(d.financeiro.tolerancia_dias) : 0;
          
          setConfigFinanceira({
            multa: multaConf,
            juros: jurosConf,
            tolerancia: toleranciaConf,
          });

          if (d.financeiro?.tipo_desconto_padrao) {
            setTipoDesconto(d.financeiro.tipo_desconto_padrao);
          }
        }
      })
      .catch(() => {});
  }, []);

  // form.valor = valor Nominal da PARCELA
  const calcParcelaFinal = () => {
    return FinanceEngine.calcularParcelaFinal(form.valor, form.percentual_desconto, tipoDesconto);
  };
  const calcDescontoParcela = () => {
    return FinanceEngine.calcularDescontoParcela(form.valor, form.percentual_desconto, tipoDesconto);
  };
  const calcValorTotal = () => {
    return FinanceEngine.calcularTotalNominalCarne(form.valor, form.quantidade_parcelas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.valor || Number(form.valor) <= 0) return setErro('Valor nominal da parcela deve ser maior que zero');
    if (!form.data_vencimento) return setErro('Data do primeiro vencimento é obrigatória');
    setSalvando(true); setErro('');
    try {
      const pctDesc = tipoDesconto === '%' ? (Number(form.percentual_desconto) || 0) : 0;
      const valDescUnitario = calcDescontoParcela();
      const valDescTotal = valDescUnitario * (Number(form.quantidade_parcelas) || 1);
      
      const valorTotalNominal = calcValorTotal();

      const res = await fetch('/api/admin-financeiro/ordens/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: aluno.id, tipo: 'carne',
          descricao: form.descricao.trim() || 'MENSALIDADE',
          referencia: form.periodo.trim() || null,
          valor_total: valorTotalNominal,
          percentual_desconto: pctDesc,
          valor_desconto: valDescTotal,
          quantidade_parcelas: Number(form.quantidade_parcelas),
          intervalo_dias: 30,
          data_vencimento_primeira: form.data_vencimento,
          criado_por: 'financeiro',
        }),
      });
      const resBody = await res.json();
      if (!res.ok) throw new Error(resBody.error || resBody.message || 'Erro ao criar carnê');

      const ordem_id = resBody.ordem?.id;
      if (ordem_id) {
        setSucesso('⏳ Gerando carnê no banco EFI...');
        const efiRes = await fetch('/api/admin-financeiro/efi/carne', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordem_id }),
        });
        if (!efiRes.ok) {
          const efiBody = await efiRes.json();
          setSucesso('✅ Carnê criado, mas falha no EFI: ' + (efiBody.message || 'erro desconhecido'));
          setTimeout(() => { onSalvo(); onSuccess(); onClose(); }, 2000);
          return;
        }
      }

      setSucesso('✅ Carnê e boletos EFI criados com sucesso!');
      setTimeout(() => { onSalvo(); onSuccess(); onClose(); }, 800);
    } catch (e) { setErro(e.message); } finally { setSalvando(false); }
  };

  const inputCls = 'flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400';

  const formatarData = (dataStr) => {
    if (!dataStr) return '__/__/____';
    try {
      const parts = dataStr.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch {
      return dataStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-purple-700">Novo Carnê</h3>
            <p className="text-sm text-gray-500">{aluno.nome}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          <p className="text-xs font-semibold text-teal-600 mb-1">Lançar carnê</p>

          <div className="grid grid-cols-2 gap-3">
            {/* Valor Nominal da Parcela | Desconto */}
            <FieldGroup label="Valor Nominal da Parcela *">
              <input type="number" step="0.01" min="0" value={form.valor}
                onChange={e => set('valor', e.target.value)}
                className={inputCls} placeholder="0,00" />
            </FieldGroup>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-600 mb-1">Desconto por Pontualidade</span>
              <div className="flex items-stretch rounded-lg border border-teal-300 bg-teal-50 focus-within:border-teal-500 h-[38px]">
                <input type="number" step="0.01" min="0" max={tipoDesconto === '%' ? 100 : undefined} value={form.percentual_desconto}
                  onChange={e => set('percentual_desconto', e.target.value)}
                  className={inputCls} placeholder="0" />
                <select
                  value={tipoDesconto}
                  onChange={e => { setTipoDesconto(e.target.value); set('percentual_desconto', ''); }}
                  className="px-2 py-2 text-xs font-bold text-teal-700 bg-teal-100 border-l border-teal-300 rounded-r-lg flex-shrink-0 focus:outline-none cursor-pointer">
                  <option value="%">%</option>
                  <option value="R$">R$</option>
                </select>
              </div>
            </div>

            {/* 1º Vencimento | Data limite do desconto */}
            <FieldGroup label="1º Vencimento *">
              <input type="date" value={form.data_vencimento}
                onChange={e => set('data_vencimento', e.target.value)}
                className={inputCls} />
            </FieldGroup>
            <FieldGroup label="Data limite do desconto">
              <input type="date" value={form.vencimento_desconto}
                onChange={e => set('vencimento_desconto', e.target.value)}
                className={inputCls} />
            </FieldGroup>

            {/* Qtd. Parcelas | Intervalo */}
            <FieldGroup label="Qtd. Parcelas">
              <input type="number" min="1" max="60" value={form.quantidade_parcelas}
                onChange={e => set('quantidade_parcelas', e.target.value)}
                className={inputCls} placeholder="Parcelas" />
            </FieldGroup>
            <FieldGroup label="Período">
              <select value={form.periodo}
                onChange={e => set('periodo', e.target.value)}
                className={inputCls + ' cursor-pointer'}>
                <option value="Período Único">Período Único</option>
                {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={`${n}º Período`}>{n}º Período</option>
                ))}
              </select>
            </FieldGroup>

            {/* Descrição — linha inteira */}
            <FieldGroup label="Descrição" className="col-span-2">
              <textarea rows={2} value={form.descricao}
                onChange={e => set('descricao', e.target.value)}
                className={inputCls + ' resize-none'}
                placeholder="Caso deixe em branco, será inserido: 'MENSALIDADE'." />
            </FieldGroup>
            {Number(form.valor) > 0 ? (
              <div className="col-span-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-sm space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Valor nominal da parcela</span>
                  <span className="font-semibold text-gray-800">R$ {(Number(form.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Desconto concedido até {formatarData(form.vencimento_desconto)}</span>
                  <span className="text-red-650 font-medium">- R$ {calcDescontoParcela().toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {tipoDesconto === '%' ? `(${form.percentual_desconto || 0}%)` : ''}</span>
                </div>
                <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg p-2 text-green-800 font-bold text-sm">
                  <span>Valor para pagamento até a data limite</span>
                  <span className="text-lg">R$ {calcParcelaFinal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center bg-orange-50 border border-orange-200 rounded-lg p-2 text-orange-800 font-semibold text-sm">
                  <span>Valor após a data limite</span>
                  <span>R$ {(Number(form.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-purple-200 my-1" />
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-purple-900">Após o vencimento:</div>
                  <div className="flex justify-between text-gray-600 text-xs pl-2">
                    <span>• Multa</span>
                    <span>{configFinanceira.multa.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-xs pl-2">
                    <span>• Juros</span>
                    <span>{configFinanceira.juros.toFixed(3)}% ao dia</span>
                  </div>
                </div>
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Dias de tolerância</span>
                  <span>{configFinanceira.tolerancia} dias</span>
                </div>
                <div className="border-t border-purple-200 my-1" />
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Quantidade de parcelas</span>
                  <span>{Number(form.quantidade_parcelas) || 1}×</span>
                </div>
                <div className="flex justify-between items-center bg-purple-100 border border-purple-300 rounded-lg p-2 text-purple-800 font-extrabold text-base">
                  <span>Total nominal do carnê</span>
                  <span className="text-xl text-purple-900">R$ {calcValorTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="text-[10px] text-gray-500 italic mt-2 text-center">
                  "Este carnê será emitido com valor nominal. O desconto será aplicado automaticamente pelo gateway apenas para pagamentos realizados até a data limite."
                </p>
              </div>
            ) : <div className="col-span-2" />}
          </div>

          {erro && <p className="text-sm text-red-650 font-semibold">{erro}</p>}
          {sucesso && <p className="text-sm text-green-650 font-semibold">{sucesso}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-5 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Criar Carnê'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Modal2aVia({ ordem, onClose }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-blue-700">2ª Via da Fatura</h3>
            <p className="text-sm text-gray-500">{ordem.descricao}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {ordem.boleto_url ? (
            <a href={ordem.boleto_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm font-semibold hover:bg-blue-100 transition">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Imprimir / Abrir Boleto
            </a>
          ) : (
            <p className="text-xs text-gray-400 italic text-center py-2">Boleto não disponível para esta fatura.</p>
          )}
          <div className="border-t pt-4">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Enviar por e-mail</label>
            <div className="flex gap-2">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" />
              <button disabled={!email} onClick={() => setMsg('Funcionalidade em breve.')}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                Enviar
              </button>
            </div>
            {msg && <p className="text-xs text-emerald-600 mt-1">{msg}</p>}
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">Fechar</button>
        </div>
      </div>
    </div>
  );
}

function ModalExcluirFatura({ ordem, aluno, onClose, onSalvo }) {
  const [motivo, setMotivo] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');

  const handleExcluir = async () => {
    setExcluindo(true); setErro('');
    try {
      const res = await fetch('/api/admin-financeiro/efi/cobranca', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordem_id: ordem.id, motivo: motivo.trim() || undefined }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.message || 'Erro ao cancelar'); }
      onSalvo();
      onClose();
    } catch (e) { setErro(e.message); } finally { setExcluindo(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-red-700">Excluir Fatura</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <div>
              <p className="text-sm font-semibold text-red-800">Ação irreversível</p>
              <p className="text-xs text-red-600 mt-0.5">A fatura será cancelada no banco EFI e marcada como desativada.</p>
            </div>
          </div>
          <p className="text-sm text-gray-700"><span className="font-medium">Fatura:</span> {ordem.descricao}</p>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Motivo da exclusão (opcional)</label>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
              placeholder="Descreva o motivo..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-red-400" />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">Cancelar</button>
          <button onClick={handleExcluir} disabled={excluindo}
            className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
            {excluindo ? 'Excluindo...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalHistorico({ ordem, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-700">Histórico da Fatura</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm font-medium text-gray-800">{ordem.descricao}</p>
          {ordem.referencia && <p className="text-xs text-gray-500">Referência: {ordem.referencia}</p>}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 mb-1">Motivo da desativação</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ordem.observacoes || 'Nenhum motivo registrado.'}</p>
          </div>
          {ordem.updated_at && (
            <p className="text-xs text-gray-400">Cancelado em: {new Date(ordem.updated_at).toLocaleString('pt-BR')}</p>
          )}
        </div>
        <div className="flex justify-end px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">Fechar</button>
        </div>
      </div>
    </div>
  );
}

function gerarHTMLRecibo(dados) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  const valorFmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtData = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
  const numero = dados.boleto_numero || dados.ordem_id?.slice(-8).toUpperCase() || '';

  const MAPA_METODOS = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    cartao: 'Cartão',
    transferencia: 'Transferência',
    boleto: 'Boleto'
  };

  const isMultiplo = dados.metodo_pagamento === 'multiplo' && Array.isArray(dados.detalhes_baixa_multipla) && dados.detalhes_baixa_multipla.length > 1;

  let formaPagamentoHTML = '';
  if (isMultiplo) {
    const listItems = dados.detalhes_baixa_multipla.map(item => {
      const label = MAPA_METODOS[String(item.metodo).toLowerCase()] || String(item.metodo).toUpperCase();
      const valor = valorFmt(item.valor);
      return `<div style="display:flex; justify-content:space-between; margin-bottom:4px; font-family:monospace; font-size:12px;"><span>${label.padEnd(20, '.')}</span> <span>${valor}</span></div>`;
    }).join('');

    formaPagamentoHTML = `
      <div style="margin-top:16px; border-top:1px dashed #ccc; padding-top:10px; max-width:280px; margin-left:auto; margin-right:auto; text-align:left;">
        <label style="font-size:10px; font-weight:bold; text-transform:uppercase; color:#888; display:block; margin-bottom:6px;">Forma de pagamento:</label>
        ${listItems}
        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:12px; margin-top:8px; border-top:1px solid #eee; padding-top:4px;">
          <span>Total pago</span>
          <span>${valorFmt(dados.valor)}</span>
        </div>
      </div>
    `;
  } else {
    const labelMetodo = MAPA_METODOS[String(dados.metodo_pagamento || '').toLowerCase()] || String(dados.metodo_pagamento || 'PIX').toUpperCase();
    formaPagamentoHTML = `<div style="margin-top:10px; font-size:12px; color:#333; text-align:center;"><strong>Forma de pagamento:</strong> ${labelMetodo}</div>`;
  }

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
  ${formaPagamentoHTML}
</div>
<div class="footer">
  <div class="assinatura">${dados.instituicao.nome}<br>Responsável pela Instituição</div>
  <p class="rodape">Recibo gerado em ${hoje} &nbsp;|&nbsp; Sistema Creeser Educacional</p>
</div>
</body></html>`;
}

function ModalRecibo({ ordem, onClose }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const url = ordem.parcelaId
      ? `/api/admin-financeiro/recibo/${ordem.id}?parcelaId=${ordem.parcelaId}`
      : `/api/admin-financeiro/recibo/${ordem.id}`;

    fetch(url)
      .then(r => r.ok ? r.json() : r.json().then(b => { throw new Error(b.message); }))
      .then(d => { setDados(d); setLoading(false); })
      .catch(e => { setErro(e.message); setLoading(false); });
  }, [ordem.id, ordem.parcelaId]);

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=820,height=700');
    w.document.write(gerarHTMLRecibo(dados));
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  const formataValor = (v) => Number(v||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formataData = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-emerald-700">Recibo de Pagamento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-gray-500 text-sm">Carregando dados...</div>
        ) : erro ? (
          <div className="px-6 py-10 text-center text-red-500 text-sm">{erro}</div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-3">
              {/* Preview */}
              <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50 space-y-3">
                <div className="text-center border-b border-emerald-200 pb-3">
                  {dados.instituicao.logo && <img src={dados.instituicao.logo} alt="Logo" className="h-12 w-auto object-contain mx-auto mb-2" />}
                  <p className="font-bold text-emerald-800">{dados.instituicao.nome}</p>
                  {dados.instituicao.cnpj && <p className="text-xs text-gray-500">CNPJ: {dados.instituicao.cnpj}</p>}
                  {dados.instituicao.cidade && <p className="text-xs text-gray-500">{dados.instituicao.cidade}{dados.instituicao.estado ? `/${dados.instituicao.estado}` : ''}</p>}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div><span className="font-semibold text-gray-500">Aluno:</span> <span className="text-gray-800">{dados.aluno.nome}</span></div>
                  <div><span className="font-semibold text-gray-500">CPF:</span> <span className="text-gray-800">{dados.aluno.cpf}</span></div>
                  <div><span className="font-semibold text-gray-500">Curso:</span> <span className="text-gray-800">{dados.curso.nome}</span></div>
                  <div><span className="font-semibold text-gray-500">Turma:</span> <span className="text-gray-800">{dados.turma.nome}</span></div>
                  <div className="col-span-2"><span className="font-semibold text-gray-500">Descrição:</span> <span className="text-gray-800">{dados.descricao}</span></div>
                  {dados.referencia && <div><span className="font-semibold text-gray-500">Referência:</span> <span className="text-gray-800">{dados.referencia}</span></div>}
                  <div><span className="font-semibold text-gray-500">Vencimento:</span> <span className="text-gray-800">{formataData(dados.data_vencimento)}</span></div>
                </div>
                <div className="text-center pt-2 border-t border-emerald-200">
                  <p className="text-xs text-gray-500 mb-1">Valor pago</p>
                  <p className="text-2xl font-bold text-emerald-700">{formataValor(dados.valor)}</p>
                  
                  {dados.metodo_pagamento === 'multiplo' && Array.isArray(dados.detalhes_baixa_multipla) && dados.detalhes_baixa_multipla.length > 1 ? (
                    <div className="mt-3 border-t border-emerald-200/50 pt-2 text-left text-xs space-y-1 text-gray-700 max-w-[280px] mx-auto">
                      <p className="font-bold text-gray-500 uppercase tracking-wide text-[9px] mb-1">Forma de pagamento:</p>
                      {dados.detalhes_baixa_multipla.map((item, idx) => {
                        const MAPA_METODOS = {
                          pix: 'PIX',
                          dinheiro: 'Dinheiro',
                          cartao: 'Cartão',
                          transferencia: 'Transferência',
                          boleto: 'Boleto'
                        };
                        const label = MAPA_METODOS[String(item.metodo).toLowerCase()] || String(item.metodo).toUpperCase();
                        return (
                          <div key={idx} className="flex justify-between font-mono">
                            <span>{label.padEnd(20, '.')}</span>
                            <span>{formataValor(item.valor)}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                        <span>Total pago</span>
                        <span>{formataValor(dados.valor)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-center text-xs text-gray-650">
                      <strong>Forma de pagamento:</strong> {
                        (() => {
                          const MAPA_METODOS = {
                            pix: 'PIX',
                            dinheiro: 'Dinheiro',
                            cartao: 'Cartão',
                            transferencia: 'Transferência',
                            boleto: 'Boleto'
                          };
                          return MAPA_METODOS[String(dados.metodo_pagamento || '').toLowerCase()] || String(dados.metodo_pagamento || 'PIX').toUpperCase();
                        })()
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">Fechar</button>
              <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Imprimir Recibo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ModalContrato({ aluno, onClose }) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  const handleAssinarDigital = async () => {
    setEnviando(true);
    setErro(null);
    setResultado(null);
    try {
      const res = await fetch(`/api/contratos/aluno/${aluno.id}/assinar-digital`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 422 && json?.error?.includes('configur')) {
          setErro('Assinatura digital não configurada para esta instituição. Configure as variáveis ASSINAFY nas configurações.');
        } else {
          setErro(json?.error || 'Erro ao enviar para assinatura digital.');
        }
      } else {
        setResultado(json?.mensagem || 'Documento enviado com sucesso para assinatura digital.');
      }
    } catch (e) {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-bold text-gray-800">Contrato — {aluno.nome}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <button
            onClick={() => window.open(`/admin/alunos/contrato/${aluno.id}?autoprint=1`, '_blank')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition text-sm font-medium text-gray-700">
            <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Contrato
          </button>

          <button
            onClick={handleAssinarDigital}
            disabled={enviando}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-sm font-medium text-white disabled:opacity-60">
            {enviando ? (
              <svg className="w-5 h-5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            )}
            {enviando ? 'Enviando...' : 'Enviar para Assinatura Digital'}
          </button>

          {resultado && (
            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              {resultado}
            </div>
          )}
          {erro && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {erro}
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AlunosFinanceiroPage() {
  const router = useRouter();

  const handleCopyBoletoUrl = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url)
      .then(() => alert('Link do boleto copiado!'))
      .catch(() => {
        const el = document.createElement('textarea');
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alert('Link do boleto copiado!');
      });
  };
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('ATIVO');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroAnoLetivo, setFiltroAnoLetivo] = useState('');
  const [unidades, setUnidades] = useState([]);
  const [todasTurmas, setTodasTurmas] = useState([]);
  const [carregouOpcoes, setCarregouOpcoes] = useState(false);

  const [modalFinanceiro, setModalFinanceiro] = useState(null);
  const [modalOrdem, setModalOrdem] = useState(null);
  const [modalCarne, setModalCarne] = useState(null);
  const [modal2aVia, setModal2aVia] = useState(null);
  const [modalExcluir, setModalExcluir] = useState(null);
  const [modalHistorico, setModalHistorico] = useState(null);
  const [modalRecibo, setModalRecibo] = useState(null);
  const [modalContrato, setModalContrato] = useState(null);
  const [modalTrancar, setModalTrancar] = useState(null);
  const [modalLote, setModalLote] = useState(false);
  const [modalCarteirinha, setModalCarteirinha] = useState(null);
  const [selectedFaturas, setSelectedFaturas] = useState(new Set());
  const [deletandoLote, setDeletandoLote] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [ordensCache, setOrdensCache] = useState({});
  const [carnesCache, setCarnesCache] = useState({});
  const [loadingOrdens, setLoadingOrdens] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('aberto');

  // Carnês tab states
  const [expandidoCarneId, setExpandidoCarneId] = useState(null);
  const [selectedParcelasAluno, setSelectedParcelasAluno] = useState({});
  const [cancelandoParcelaAluno, setCancelandoParcelaAluno] = useState(false);
  const [gerandoBoletoAluno, setGerandoBoletoAluno] = useState(null);
  const [modalConfirmarAluno, setModalConfirmarAluno] = useState(null);
  const [modalCancelarParcelaAluno, setModalCancelarParcelaAluno] = useState(null);
  const [modalWhatsapp, setModalWhatsapp] = useState(null);

  const fetchOrdensAluno = async (alunoId, force = false) => {
    if (!force && ordensCache[alunoId]) return;
    setLoadingOrdens(alunoId);
    try {
      const res = await fetch(`/api/admin-financeiro/aluno-ordens/${alunoId}`);
      if (res.ok) {
        const data = await res.json();
        setOrdensCache(prev => ({ ...prev, [alunoId]: data.ordens || [] }));
        setCarnesCache(prev => ({ ...prev, [alunoId]: data.carnes || [] }));
      }
    } catch (e) { console.error(e); } finally { setLoadingOrdens(null); }
  };

  const toggleParcelaAluno = (carneId, parcelaId) => {
    setSelectedParcelasAluno(prev => {
      const set = new Set(prev[carneId] || []);
      set.has(parcelaId) ? set.delete(parcelaId) : set.add(parcelaId);
      return { ...prev, [carneId]: set };
    });
  };

  const toggleTodasParcelasAluno = (carneId, parcelas, selecionar) => {
    const cancelaveis = parcelas.filter(p => p.status !== 'pago' && p.status !== 'cancelado');
    setSelectedParcelasAluno(prev => ({
      ...prev,
      [carneId]: selecionar ? new Set(cancelaveis.map(p => p.id)) : new Set(),
    }));
  };

  const handleEnviarWhatsApp = async (parcelaId, fastSend = false) => {
    try {
      const res = await fetch(`/api/admin-financeiro/parcelas/${parcelaId}/whatsapp-info`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erro ao buscar dados do WhatsApp');
      }
      const data = await res.json();
      const { aluno_nome, responsavel_telefone, numero_parcela, valor, data_vencimento, payment_url } = data;

      if (!responsavel_telefone) {
        console.warn('WhatsApp/telefone não encontrado para o responsável ou aluno no banco de dados.');
        alert('Responsável sem telefone cadastrado.');
        return;
      }

      let telefoneLimpo = responsavel_telefone.replace(/\D/g, '');
      if (telefoneLimpo.length === 10 || telefoneLimpo.length === 11) {
        telefoneLimpo = '55' + telefoneLimpo;
      }

      if (telefoneLimpo.length < 10) {
        console.error('Número de telefone inválido ou incompleto:', responsavel_telefone);
        alert('Responsável sem telefone cadastrado.');
        return;
      }

      if (!payment_url) {
        console.warn('payment_url/boleto_url não encontrado para a parcela:', parcelaId);
        alert('A cobrança não possui link disponível para envio.');
        return;
      }

      const dataFormatada = data_vencimento ? new Date(data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '';
      const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

      const msg = `Olá, tudo bem?\n\nSegue a 2ª via da parcela *#${numero_parcela}* do aluno *${aluno_nome}*.\n\n*Vencimento:* ${dataFormatada}\n*Valor:* ${valorFormatado}\n\nVocê pode efetuar o pagamento pelo link a seguir:\n${payment_url}\n\nQualquer dúvida, estamos à disposição!`;

      if (fastSend) {
        try {
          await fetch(`/api/admin-financeiro/parcelas/${parcelaId}/log-whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefone: telefoneLimpo })
          });
        } catch (err) {
          console.error('Falha ao registrar log de auditoria:', err);
        }
        const url = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      } else {
        setModalWhatsapp({
          id: parcelaId,
          aluno_nome,
          responsavel_telefone: telefoneLimpo,
          numero_parcela,
          valor,
          data_vencimento,
          payment_url,
          valorFormatado,
          dataFormatada,
          mensagemPadrao: msg
        });
      }
    } catch (err) {
      console.error('Erro ao processar envio para o WhatsApp:', err);
      alert('Erro ao processar envio: ' + err.message);
    }
  };

  const handleCancelarParcelaAluno = (carne, parcela, alunoId) => {
    setModalCancelarParcelaAluno({
      type: 'single',
      carne,
      parcela,
      alunoId,
    });
  };

  const handleCancelarSelecionadasAluno = (carne, alunoId) => {
    const ids = [...(selectedParcelasAluno[carne.id] || [])];
    if (!ids.length) return;
    setModalCancelarParcelaAluno({
      type: 'multiple',
      carne,
      ids,
      alunoId,
    });
  };

  const handleConfirmarCancelarParcelaAluno = async (observacao) => {
    if (!modalCancelarParcelaAluno) return;
    setCancelandoParcelaAluno(true);
    const { type, carne, parcela, ids, alunoId } = modalCancelarParcelaAluno;
    try {
      if (type === 'single') {
        await fetch('/api/admin-financeiro/efi/carne', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordem_id: carne.id, parcela_id: parcela.id, observacao }),
        });
      } else if (type === 'multiple') {
        for (const parcela_id of ids) {
          await fetch('/api/admin-financeiro/efi/carne', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordem_id: carne.id, parcela_id, observacao }),
          });
        }
        setSelectedParcelasAluno(prev => ({ ...prev, [carne.id]: new Set() }));
      }
      setCarnesCache(prev => { const n = {...prev}; delete n[alunoId]; return n; });
      fetchOrdensAluno(alunoId, true);
      setModalCancelarParcelaAluno(null);
    } catch (e) {
      console.error(e);
    } finally {
      setCancelandoParcelaAluno(false);
    }
  };

  const handleGerarBoletosAluno = async (carne, alunoId) => {
    setGerandoBoletoAluno(carne.id);
    try {
      if (!carne.efi_carnet_id) {
        const res = await fetch('/api/admin-financeiro/efi/carne', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordem_id: carne.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao gerar carnê');
        if (data.link) window.open(data.link, '_blank');
        setCarnesCache(prev => { const n = {...prev}; delete n[alunoId]; return n; });
        fetchOrdensAluno(alunoId, true);
      } else {
        const res = await fetch(`/api/admin-financeiro/efi/carne?ordem_id=${carne.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao buscar carnê');
        if (data.link) window.open(data.link, '_blank');
        else alert('Link do carnê não disponível na EFI.');
      }
    } catch (err) { alert('Erro: ' + err.message); }
    finally { setGerandoBoletoAluno(null); }
  };

  const handleRowClick = (aluno) => {
    const novoId = expandedId === aluno.id ? null : aluno.id;
    setExpandedId(novoId);
    setSelectedFaturas(new Set());
    if (novoId) { setAbaAtiva('aberto'); fetchOrdensAluno(aluno.id); }
  };

  const handleBulkDelete = async (alunoId) => {
    if (selectedFaturas.size === 0) return;
    setDeletandoLote(true);
    try {
      await Promise.all([...selectedFaturas].map(ordemId =>
        fetch('/api/admin-financeiro/efi/cobranca', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordem_id: ordemId }),
        })
      ));
      setSelectedFaturas(new Set());
      setOrdensCache(prev => { const n = {...prev}; delete n[alunoId]; return n; });
      fetchOrdensAluno(alunoId, true);
    } catch (e) { console.error(e); } finally { setDeletandoLote(false); }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filtroStatus) query.set('status', filtroStatus);
      if (filtroCurso) query.set('cursoId', filtroCurso);
      if (filtroTurma) query.set('turmaId', filtroTurma);
      if (filtroUnidade) query.set('unidadeId', filtroUnidade);
      if (filtroAnoLetivo) query.set('anoLetivo', filtroAnoLetivo);
      if (filtroNome) query.set('search', filtroNome);

      const res = await fetch(`/api/admin-financeiro/alunos?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAlunos(Array.isArray(data.alunos) ? data.alunos : []);
        if (data.turmas) setTurmas(data.turmas);
        if (data.cursos) setCursos(data.cursos);
      }

      if (!carregouOpcoes) {
        const [resOpcoes, resTurmas] = await Promise.all([
          fetch('/api/turmas/opcoes'),
          fetch('/api/turmas')
        ]);
        if (resOpcoes.ok) {
          const dataOpcoes = await resOpcoes.json();
          if (dataOpcoes.unidades) setUnidades(dataOpcoes.unidades);
        }
        if (resTurmas.ok) {
          const dataTurmas = await resTurmas.json();
          setTodasTurmas(Array.isArray(dataTurmas) ? dataTurmas : dataTurmas.turmas || []);
        }
        setCarregouOpcoes(true);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // Disparar busca ao mudar os filtros
  useEffect(() => {
    carregarDados();
  }, [filtroStatus, filtroCurso, filtroTurma, filtroUnidade, filtroAnoLetivo]);

  // Debounce para busca por texto
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      carregarDados();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [filtroNome]);

  const limparFiltros = () => {
    setFiltroNome('');
    setFiltroStatus('ATIVO');
    setFiltroCurso('');
    setFiltroTurma('');
    setFiltroUnidade('');
    setFiltroAnoLetivo('');
  };

  const turmasFiltradasOpcoes = useMemo(() => {
    let list = todasTurmas;
    if (filtroCurso) {
      list = list.filter(t => String(t.cursoId) === String(filtroCurso));
    }
    if (filtroUnidade) {
      list = list.filter(t => String(t.unidadeId) === String(filtroUnidade));
    }
    return list;
  }, [todasTurmas, filtroCurso, filtroUnidade]);

  const anosLetivosOpcoes = useMemo(() => {
    const anos = todasTurmas.map(t => t.anoLetivo).filter(Boolean);
    return [...new Set(anos)].sort();
  }, [todasTurmas]);

  const alunosFiltrados = alunos;

  const resumo = useMemo(() => ({
    totalAlunos: alunosFiltrados.length,
    totalAberto: alunosFiltrados.reduce((acc, a) => acc + (Number(a.financeiro_aberto) || 0), 0),
    totalAtraso: alunosFiltrados.reduce((acc, a) => acc + (Number(a.financeiro_atraso) || 0), 0),
    totalPago: alunosFiltrados.reduce((acc, a) => acc + (Number(a.financeiro_pago) || 0), 0),
  }), [alunosFiltrados]);

  const getNomeTurma = (id) => turmas.find(t => t.id === id)?.nome || 'Sem turma';
  const getNomeCurso = (id) => cursos.find(c => c.id === id)?.nome || 'Sem curso';
  const formataValor = (v) => Number(v||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formataData = (d) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return '-'; } };

  const StatusBadge = ({ status }) => {
    const cfg = {
      ATIVO:                          { cls: 'bg-green-100 text-green-800',   label: 'Ativo' },
      INATIVO:                        { cls: 'bg-red-100 text-red-800',       label: 'Inativo' },
      PRE_CADASTRO:                   { cls: 'bg-gray-100 text-gray-700',     label: 'Pré-Cadastro' },
      AGUARDANDO_PAGAMENTO_MATRICULA: { cls: 'bg-purple-100 text-purple-800', label: 'Ag. Pgto Matrícula' },
      AGUARDANDO_FORMACAO_TURMA:      { cls: 'bg-indigo-100 text-indigo-800', label: 'Ag. Formação Turma' },
      DESISTENTE:                     { cls: 'bg-orange-100 text-orange-800', label: 'Desistente' },
      CANCELADO:                      { cls: 'bg-red-100 text-red-800',       label: 'Cancelado' },
    }[status] || { cls: 'bg-gray-100 text-gray-800', label: status || '—' };
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>;
  };

  const StatusOrdemBadge = ({ status }) => {
    const cores = { pendente: 'bg-yellow-100 text-yellow-800', pago: 'bg-green-100 text-green-800', vencido: 'bg-orange-100 text-orange-800', cancelado: 'bg-red-100 text-red-800', ativo: 'bg-blue-100 text-blue-800' };
    const labels = { pendente: 'Pendente', pago: 'Pago', vencido: 'Vencido', cancelado: 'Cancelado', ativo: 'Ativo' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cores[status] || 'bg-gray-100 text-gray-800'}`}>{labels[status] || status}</span>;
  };

  if (loading) return (
    <AdminFinanceiroLayout>
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-gray-600">Carregando alunos...</p>
      </div>
    </AdminFinanceiroLayout>
  );

  return (
    <AdminFinanceiroLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Alunos</h2>
            <p className="text-gray-600">Selecione um aluno para lançar ordens ou carnês de pagamento</p>
          </div>
          <button
            onClick={() => setModalLote(true)}
            className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-bold transition text-sm flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Gerar Carnê em Lote
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
            <p className="text-sm text-teal-700 font-semibold">Total de Alunos</p>
            <p className="text-3xl font-bold text-teal-900 mt-1">{resumo.totalAlunos}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700 font-semibold">Aberto</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{formataValor(resumo.totalAberto)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-semibold">Em Atraso</p>
            <p className="text-2xl font-bold text-red-900 mt-1">{formataValor(resumo.totalAtraso)}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm text-emerald-700 font-semibold">Pago</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{formataValor(resumo.totalPago)}</p>
          </div>
        </div>

        <BarraFiltros
          searchPlaceholder="🔍 Aluno, Matrícula, CPF ou Responsável..."
          searchValue={filtroNome}
          onSearchChange={setFiltroNome}
          statusValue={filtroStatus}
          onStatusChange={setFiltroStatus}
          statusOptions={[
            { value: "ATIVO", label: "Ativo" },
            { value: "PRE_CADASTRO", label: "Pré-Cadastro" },
            { value: "AGUARDANDO_PAGAMENTO_MATRICULA", label: "Ag. Pagamento Matrícula" },
            { value: "AGUARDANDO_FORMACAO_TURMA", label: "Ag. Formação de Turma" },
            { value: "DESISTENTE", label: "Desistente" },
            { value: "CANCELADO", label: "Cancelado" },
            { value: "INATIVO", label: "Inativo" }
          ]}
          unidadeValue={filtroUnidade}
          onUnidadeChange={setFiltroUnidade}
          unidades={unidades}
          cursoValue={filtroCurso}
          onCursoChange={setFiltroCurso}
          cursos={cursos}
          turmaValue={filtroTurma}
          onTurmaChange={setFiltroTurma}
          turmas={turmasFiltradasOpcoes}
          anoLetivoValue={filtroAnoLetivo}
          onAnoLetivoChange={setFiltroAnoLetivo}
          anosLetivos={anosLetivosOpcoes}
          onClear={limparFiltros}
        />

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {alunosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">Nenhum aluno encontrado com os filtros selecionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Turma</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Curso</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-blue-700">Aberto</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-red-700">Atraso</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-emerald-700">Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {alunosFiltrados.map(aluno => (
                    <Fragment key={aluno.id}>
                      <tr
                        onClick={() => handleRowClick(aluno)}
                        className="hover:bg-gray-50 transition cursor-pointer select-none"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          <div className="flex items-center gap-2">
                            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${expandedId === aluno.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            {aluno.nome}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{getNomeTurma(aluno.turmaid)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{getNomeCurso(aluno.cursoid)}</td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-blue-700">{formataValor(aluno.financeiro_aberto)}</td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-red-600">{formataValor(aluno.financeiro_atraso)}</td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-emerald-600">{formataValor(aluno.financeiro_pago)}</td>
                        <td className="px-6 py-4"><StatusBadge status={aluno.statusmatricula} /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setModalFinanceiro(aluno)} title="Dados Financeiros"
                              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => setModalOrdem(aluno)} title="Criar Ordem de Pagamento"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                            <button onClick={() => setModalCarne(aluno)} title="Criar Carnê"
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </button>
                            <button onClick={() => setModalContrato(aluno)} title="Contrato"
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                            <button onClick={() => setModalCarteirinha(aluno)} title="Carteirinha"
                              className="p-1.5 text-indigo-650 hover:bg-indigo-50 rounded-lg transition">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 012-2h2a2 2 0 012 2v1m-6 4h4" /></svg>
                            </button>
                            {!['CANCELADO', 'DESISTENTE', 'TRANCADO'].includes(aluno.statusmatricula) && (
                              <button onClick={() => setModalTrancar(aluno)} title="Trancar Matrícula"
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* SANFONA - ordens do aluno */}
                      {expandedId === aluno.id && (
                        <tr>
                          <td colSpan={8} className="bg-gray-50 border-b border-gray-200 px-0 py-0">
                            <div className="px-6 pt-4 pb-5">

                              {/* Abas */}
                              {(() => {
                                const ordens = ordensCache[aluno.id] || [];
                                const carnes = carnesCache[aluno.id] || [];
                                const contagem = {
                                  aberto:     ordens.filter(o => ['pendente','ativo','vencido'].includes(o.status_parcela || o.status)).length,
                                  pago:       ordens.filter(o => (o.status_parcela || o.status) === 'pago').length,
                                  desativado: ordens.filter(o => (o.status_parcela || o.status) === 'cancelado').length,
                                  carnes:     carnes.filter(c => c.status !== 'cancelado').length,
                                };
                                const abas = [
                                  { key: 'aberto',      label: 'Faturas em aberto',   ativo: 'bg-blue-600 text-white shadow-sm',    inativo: 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50' },
                                  { key: 'pago',        label: 'Faturas pagas',        ativo: 'bg-emerald-600 text-white shadow-sm', inativo: 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50' },
                                  { key: 'desativado',  label: 'Faturas desativadas',  ativo: 'bg-gray-500 text-white shadow-sm',    inativo: 'bg-white text-gray-500 border border-gray-300 hover:bg-gray-50' },
                                  { key: 'carnes',      label: 'Carnês',               ativo: 'bg-purple-600 text-white shadow-sm',  inativo: 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50' },
                                  { key: 'recorrencia', label: 'Plano Recorrência',    ativo: 'bg-orange-500 text-white shadow-sm',  inativo: 'bg-white text-orange-500 border border-orange-200 hover:bg-orange-50' },
                                ];
                                return (
                                  <div className="flex gap-2 mb-5">
                                    {abas.map(aba => (
                                      <button
                                        key={aba.key}
                                        onClick={e => { e.stopPropagation(); setAbaAtiva(aba.key); setSelectedFaturas(new Set()); }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${abaAtiva === aba.key ? aba.ativo : aba.inativo}`}
                                      >
                                        {aba.label}
                                        {aba.key !== 'recorrencia' && contagem[aba.key] != null && (
                                          <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${abaAtiva === aba.key ? 'bg-white/25' : 'bg-gray-100 text-gray-600'}`}>
                                            {contagem[aba.key]}
                                          </span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()}

                              {/* Conteúdo da aba */}
                              {abaAtiva === 'recorrencia' ? (
                                <div className="py-6 text-center text-gray-400">
                                  <p className="text-sm font-medium">Plano Recorrência</p>
                                  <p className="text-xs mt-1">Em breve — cobrança via cartão de crédito recorrente</p>
                                </div>
                              ) : loadingOrdens === aluno.id ? (
                                <p className="text-sm text-gray-500 py-4">Carregando faturas...</p>
                              ) : abaAtiva === 'carnes' ? (() => {
                                const carnes = carnesCache[aluno.id] || [];
                                if (carnes.length === 0) return (
                                  <p className="text-sm text-gray-400 py-4 text-center">Nenhum carnê cadastrado para este aluno.</p>
                                );
                                const fmtV = (v) => Number(v||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                const fmtD = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';
                                const CoresCarne = { ativo:'bg-green-100 text-green-800', cancelado:'bg-red-100 text-red-800', encerrado:'bg-gray-100 text-gray-800' };
                                const CoresParcela = { pendente:'bg-amber-100 text-amber-800', pago:'bg-green-100 text-green-800', vencido:'bg-red-100 text-red-800', cancelado:'bg-gray-100 text-gray-800' };
                                return (
                                  <div className="space-y-2">
                                    {carnes.map(carne => (
                                      <div key={carne.id} className="border border-purple-200 rounded-lg overflow-hidden">
                                        {/* Cabeçalho */}
                                        <button
                                          onClick={e => { e.stopPropagation(); setExpandidoCarneId(expandidoCarneId === carne.id ? null : carne.id); }}
                                          className="w-full px-4 py-3 bg-purple-50 hover:bg-purple-100 transition text-left flex items-center justify-between"
                                        >
                                          <div className="flex-1">
                                            <p className="font-bold text-gray-900 text-sm">{carne.descricao || 'Carnê'}</p>
                                            {carne.referencia && <p className="text-xs text-gray-500">{carne.referencia}</p>}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <div className="text-right">
                                              <p className="font-semibold text-sm text-gray-900">{fmtV(carne.valor_total)}</p>
                                              <p className="text-xs text-gray-500">{carne.quantidade_parcelas}x</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${CoresCarne[carne.status] || 'bg-gray-100 text-gray-800'}`}>{carne.status}</span>
                                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandidoCarneId === carne.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                          </div>
                                        </button>

                                        {/* Detalhes expandidos */}
                                        {expandidoCarneId === carne.id && (
                                          <div className="px-4 py-4 bg-white border-t border-purple-100 space-y-4">
                                            {/* Info grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                              <div>
                                                <p className="text-gray-500 text-xs">CPF</p>
                                                <p className="font-semibold text-gray-900">{aluno.cpf || '-'}</p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500 text-xs">Descrição</p>
                                                <p className="font-semibold text-gray-900">{carne.descricao || '-'}</p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500 text-xs">Data Criação</p>
                                                <p className="font-semibold text-gray-900">{fmtD(carne.created_at)}</p>
                                              </div>
                                              <div>
                                                <p className="text-gray-500 text-xs">Valor/Parcela</p>
                                                <p className="font-semibold text-gray-900">{fmtV(carne.valor_total / carne.quantidade_parcelas)}</p>
                                              </div>
                                            </div>

                                            {/* Parcelas */}
                                            {carne.parcelas && carne.parcelas.length > 0 && (
                                              <div>
                                                <div className="flex items-center justify-between mb-2">
                                                  <h4 className="font-semibold text-gray-900 text-sm">Parcelas:</h4>
                                                  {(selectedParcelasAluno[carne.id]?.size > 0) && (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                                                      <span className="text-xs text-red-700 font-medium">{selectedParcelasAluno[carne.id].size} selecionada(s)</span>
                                                      <button onClick={e => { e.stopPropagation(); handleCancelarSelecionadasAluno(carne, aluno.id); }} disabled={cancelandoParcelaAluno}
                                                        className="text-xs font-semibold px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                                                        {cancelandoParcelaAluno ? 'Cancelando...' : 'Cancelar selecionadas'}
                                                      </button>
                                                      <button onClick={e => { e.stopPropagation(); setSelectedParcelasAluno(p => ({ ...p, [carne.id]: new Set() })); }}
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
                                                              carne.parcelas.filter(p => p.status !== 'pago' && p.status !== 'cancelado').every(p => selectedParcelasAluno[carne.id]?.has(p.id))}
                                                            onChange={e => { e.stopPropagation(); toggleTodasParcelasAluno(carne.id, carne.parcelas, e.target.checked); }}
                                                            onClick={e => e.stopPropagation()}
                                                          />
                                                        </th>
                                                        <th className="text-left px-2 py-2 text-xs font-semibold">Parcela</th>
                                                        <th className="text-left px-2 py-2 text-xs font-semibold">Vencimento</th>
                                                        <th className="text-right px-2 py-2 text-xs font-semibold">Valor</th>
                                                        <th className="text-left px-2 py-2 text-xs font-semibold">Status</th>
                                                        <th className="text-center px-2 py-2 text-xs font-semibold">Ações</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {carne.parcelas.map(parcela => {
                                                        const cancelavel = parcela.status !== 'pago' && parcela.status !== 'cancelado';
                                                        return (
                                                          <tr key={parcela.id} className={`border-b border-gray-100 ${selectedParcelasAluno[carne.id]?.has(parcela.id) ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                                                            <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                                                              <input type="checkbox"
                                                                disabled={!cancelavel}
                                                                checked={selectedParcelasAluno[carne.id]?.has(parcela.id) || false}
                                                                onChange={() => toggleParcelaAluno(carne.id, parcela.id)}
                                                                onClick={e => e.stopPropagation()}
                                                                className="rounded border-gray-300 text-red-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                              />
                                                            </td>
                                                            <td className="px-2 py-2 text-gray-900 font-semibold">{parcela.numero_parcela}</td>
                                                            <td className="px-2 py-2 text-gray-600">{fmtD(parcela.data_vencimento)}</td>
                                                            <td className="px-2 py-2 text-gray-900 font-semibold text-right">{fmtV(FinanceEngine.obterValorVigente(parcela))}</td>
                                                            <td className="px-2 py-2">
                                                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${CoresParcela[parcela.status] || 'bg-gray-100 text-gray-800'}`}>{parcela.status}</span>
                                                            </td>

                                                            <td className="px-2 py-2 text-center">
                                                              <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                                                                {parcela.status === 'pago' && (
                                                                  <button title="Imprimir Recibo" onClick={() => setModalRecibo({ id: carne.id, parcelaId: parcela.id })}
                                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                                                  </button>
                                                                )}
                                                                {(parcela.status === 'pendente' || parcela.status === 'vencido') && (
                                                                  <div className="flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:shadow-sm transition-all duration-200 divide-x divide-emerald-250">
                                                                    <button
                                                                      onClick={() => handleEnviarWhatsApp(parcela.id, true)}
                                                                      onContextMenu={(e) => { e.preventDefault(); handleEnviarWhatsApp(parcela.id, false); }}
                                                                      title="Enviar 2ª via rápida por WhatsApp (Clique com botão direito para editar)"
                                                                      className="w-9 h-9 flex items-center justify-center rounded-l-full hover:scale-105 transition-all duration-200 cursor-pointer">
                                                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.48-.002 9.932-4.453 9.935-9.934.002-2.657-1.03-5.155-2.905-7.03C16.426 1.768 13.932.735 11.28.735 5.798.735 1.346 5.188 1.343 10.669c-.001 1.554.415 3.076 1.203 4.437l-.988 3.606 3.693-.97c1.37.747 2.808 1.134 4.396 1.14l.003-.008zm10.153-6.885c-.29-.145-1.722-.85-1.99-.947-.267-.097-.463-.146-.658.145-.195.29-.757.947-.928 1.142-.17.195-.34.22-.63.075-.29-.145-1.228-.453-2.338-1.444-.864-.77-1.448-1.721-1.618-2.011-.17-.29-.018-.447.127-.592.13-.13.29-.34.436-.509.145-.17.195-.29.29-.485.097-.195.048-.364-.025-.509-.073-.145-.658-1.587-.9-2.17-.236-.569-.475-.491-.657-.5l-.558-.01c-.195 0-.51.072-.777.363-.267.29-1.02 1.02-1.02 2.485s1.07 2.871 1.218 3.064c.146.195 2.105 3.2 5.1 4.499.712.309 1.268.494 1.7.632.715.228 1.364.195 1.878.118.571-.085 1.722-.704 1.965-1.385.243-.68.243-1.261.17-1.385-.073-.122-.268-.195-.559-.34z"/>
                                                                      </svg>
                                                                    </button>
                                                                    <button
                                                                      onClick={() => handleEnviarWhatsApp(parcela.id, false)}
                                                                      title="Personalizar mensagem antes de enviar"
                                                                      className="w-5 h-9 flex items-center justify-center rounded-r-full hover:bg-emerald-100/50 hover:scale-105 transition-all duration-200 cursor-pointer">
                                                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                                      </svg>
                                                                    </button>
                                                                  </div>
                                                                )}
                                                                {parcela.boleto_url && (
                                                                  <button title="Copiar Link do Boleto" onClick={() => handleCopyBoletoUrl(parcela.boleto_url)}
                                                                    className="p-1.5 text-gray-650 hover:bg-gray-100 rounded transition">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                                  </button>
                                                                )}
                                                                {cancelavel && (
                                                                  <button onClick={() => handleCancelarParcelaAluno(carne, parcela, aluno.id)} disabled={cancelandoParcelaAluno}
                                                                    title="Cancelar Parcela"
                                                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:scale-105 hover:shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
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

                                            {/* Botões de ação */}
                                            <div className="flex gap-2 pt-3 border-t border-gray-200">
                                              <button
                                                onClick={e => { e.stopPropagation(); handleGerarBoletosAluno(carne, aluno.id); }}
                                                disabled={gerandoBoletoAluno === carne.id}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold transition text-sm disabled:opacity-50"
                                              >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                {gerandoBoletoAluno === carne.id ? 'Aguarde...' : carne.efi_carnet_id ? 'Abrir Carnê PDF' : 'Gerar Boletos'}
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })() : (() => {
                                const ordens = ordensCache[aluno.id] || [];
                                const filtradas = ordens.filter(o => {
                                  const s = o.status_parcela || o.status;
                                  if (abaAtiva === 'aberto')     return ['pendente', 'ativo', 'vencido'].includes(s);
                                  if (abaAtiva === 'pago')       return s === 'pago';
                                  if (abaAtiva === 'desativado') return s === 'cancelado';
                                  return false;
                                });

                                if (filtradas.length === 0) return (
                                  <p className="text-sm text-gray-400 py-4 text-center">Nenhuma fatura nesta categoria.</p>
                                );

                                return (
                                  <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                      {selectedFaturas.size > 0 && abaAtiva === 'aberto' && (
                                        <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                                          <span className="text-sm text-red-700 font-medium">{selectedFaturas.size} selecionado{selectedFaturas.size > 1 ? 's' : ''}</span>
                                          <button
                                            onClick={e => { e.stopPropagation(); handleBulkDelete(aluno.id); }}
                                            disabled={deletandoLote}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            {deletandoLote ? 'Deletando...' : 'Deletar selecionados'}
                                          </button>
                                          <button onClick={e => { e.stopPropagation(); setSelectedFaturas(new Set()); }} className="text-xs text-gray-400 hover:text-gray-600 ml-auto">Limpar seleção</button>
                                        </div>
                                      )}
                                    <table className="w-full text-sm rounded-lg overflow-hidden">
                                      <thead>
                                        <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                          <th className="px-3 py-2 w-8">
                                            <input type="checkbox"
                                              checked={filtradas.length > 0 && filtradas.every(o => selectedFaturas.has(o.id))}
                                              disabled={abaAtiva === 'pago' || abaAtiva === 'desativado'}
                                              onChange={e => {
                                                e.stopPropagation();
                                                setSelectedFaturas(e.target.checked ? new Set(filtradas.map(o => o.id)) : new Set());
                                              }}
                                              onClick={e => e.stopPropagation()}
                                              className="rounded border-gray-300 text-red-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                            />
                                          </th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold">Descrição</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold">Referência</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold">Vencimento</th>
                                          <th className="px-4 py-2 text-right text-xs font-semibold">Valor</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold">Status</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold">Cobrança</th>
                                          <th className="px-4 py-2 text-center text-xs font-semibold">Ações</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {filtradas.map(ordem => (
                                          <tr key={ordem.id} className={`hover:bg-gray-50 transition ${selectedFaturas.has(ordem.id) ? 'bg-red-50' : ''}`}>
                                            <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                                              <input type="checkbox"
                                                checked={selectedFaturas.has(ordem.id)}
                                                disabled={abaAtiva === 'pago' || abaAtiva === 'desativado'}
                                                onChange={e => {
                                                  const next = new Set(selectedFaturas);
                                                  e.target.checked ? next.add(ordem.id) : next.delete(ordem.id);
                                                  setSelectedFaturas(next);
                                                }}
                                                onClick={e => e.stopPropagation()}
                                                className="rounded border-gray-300 text-red-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                              />
                                            </td>
                                            <td className="px-4 py-2 text-gray-800 font-medium">{ordem.descricao}</td>
                                            <td className="px-4 py-2 text-gray-500">{ordem.referencia || '-'}</td>
                                            <td className="px-4 py-2 text-gray-600">{formataData(ordem.data_vencimento)}</td>
                                            <td className="px-4 py-2 text-right font-semibold text-gray-800">{formataValor(ordem.valor_total)}</td>
                                            <td className="px-4 py-2"><StatusOrdemBadge status={ordem.status_parcela || ordem.status} /></td>
                                            <td className="px-4 py-2 text-xs text-gray-400 font-mono">{ordem.cobranca || '-'}</td>
                                            <td className="px-4 py-2">
                                              <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                                                {abaAtiva === 'aberto' && (<>
                                                  <button title="2ª Via da Fatura" onClick={e => { e.stopPropagation(); setModal2aVia(ordem); }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                                  </button>
                                                  {ordem.boleto_url && (
                                                    <button title="Copiar Link do Boleto" onClick={e => { e.stopPropagation(); handleCopyBoletoUrl(ordem.boleto_url); }}
                                                      className="p-1.5 text-gray-650 hover:bg-gray-100 rounded transition">
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                    </button>
                                                  )}
                                                  <button title="Excluir Fatura" onClick={e => { e.stopPropagation(); setModalExcluir({ ordem, aluno }); }}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                  </button>
                                                </>)}
                                                {abaAtiva === 'pago' && (
                                                  <button title="Imprimir Recibo" onClick={e => { e.stopPropagation(); setModalRecibo({ id: ordem.id, parcelaId: ordem.parcela_id }); }}
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                                  </button>
                                                )}
                                                {abaAtiva === 'desativado' && (
                                                  <button title="Ver Histórico" onClick={e => { e.stopPropagation(); setModalHistorico(ordem); }}
                                                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                  </button>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalFinanceiro && (
        <ModalDadosFinanceiros aluno={modalFinanceiro} onClose={() => setModalFinanceiro(null)} onSalvo={carregarDados} />
      )}
      {modalOrdem && (
        <ModalOrdem aluno={modalOrdem} onClose={() => setModalOrdem(null)} onSalvo={carregarDados}
          onSuccess={() => {
            const alunoId = modalOrdem.id;
            setOrdensCache(prev => { const n = {...prev}; delete n[alunoId]; return n; });
            setExpandedId(alunoId);
            setTimeout(() => fetchOrdensAluno(alunoId, true), 500);
          }}
        />
      )}
      {modalCarne && (
        <ModalCarne aluno={modalCarne} onClose={() => setModalCarne(null)} onSalvo={carregarDados} onSuccess={() => router.push('/admin-financeiro/carnes')} />
      )}
      {modal2aVia && (
        <Modal2aVia ordem={modal2aVia} onClose={() => setModal2aVia(null)} />
      )}
      {modalExcluir && (
        <ModalExcluirFatura
          ordem={modalExcluir.ordem}
          aluno={modalExcluir.aluno}
          onClose={() => setModalExcluir(null)}
          onSalvo={() => {
            const alunoId = modalExcluir.aluno.id;
            setOrdensCache(prev => { const n = {...prev}; delete n[alunoId]; return n; });
            fetchOrdensAluno(alunoId, true);
          }}
        />
      )}
      {modalHistorico && (
        <ModalHistorico ordem={modalHistorico} onClose={() => setModalHistorico(null)} />
      )}
      {modalRecibo && (
        <ModalRecibo ordem={modalRecibo} onClose={() => setModalRecibo(null)} />
      )}
      {modalContrato && (
        <ModalContrato aluno={modalContrato} onClose={() => setModalContrato(null)} />
      )}
      {modalTrancar && (
        <ModalTrancar
          aluno={modalTrancar}
          onClose={() => setModalTrancar(null)}
          onSalvo={carregarDados}
        />
      )}
      {modalLote && (
        <ModalLote
          turmas={todasTurmas}
          onClose={() => setModalLote(false)}
          onSalvo={carregarDados}
        />
      )}
      {modalCarteirinha && (
        <ModalCarteirinha
          aluno={modalCarteirinha}
          onClose={() => setModalCarteirinha(null)}
        />
      )}
      {modalConfirmarAluno && (
        <ModalConfirmar
          titulo={modalConfirmarAluno.titulo}
          mensagem={modalConfirmarAluno.mensagem}
          onConfirm={async () => { setModalConfirmarAluno(null); await modalConfirmarAluno.onConfirm(); }}
          onClose={() => setModalConfirmarAluno(null)}
        />
      )}
      {modalCancelarParcelaAluno && modalCancelarParcelaAluno.type === 'single' && (
        <ModalCancelarParcela
          carne={modalCancelarParcelaAluno.carne}
          parcela={modalCancelarParcelaAluno.parcela}
          onConfirm={handleConfirmarCancelarParcelaAluno}
          onClose={() => setModalCancelarParcelaAluno(null)}
          loading={cancelandoParcelaAluno}
          formatData={fmtD}
          formatValor={fmtV}
        />
      )}
      {modalCancelarParcelaAluno && modalCancelarParcelaAluno.type === 'multiple' && (
        <ModalCancelarParcelasMultiplas
          quantidade={modalCancelarParcelaAluno.ids.length}
          onConfirm={handleConfirmarCancelarParcelaAluno}
          onClose={() => setModalCancelarParcelaAluno(null)}
          loading={cancelandoParcelaAluno}
        />
      )}
      {modalWhatsapp && (
        <ModalWhatsapp
          data={modalWhatsapp}
          onConfirm={async (editedText) => {
            try {
              await fetch(`/api/admin-financeiro/parcelas/${modalWhatsapp.id}/log-whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telefone: modalWhatsapp.responsavel_telefone })
              });
            } catch (err) {
              console.error('Falha ao registrar log de auditoria:', err);
            }
            const url = `https://wa.me/${modalWhatsapp.responsavel_telefone}?text=${encodeURIComponent(editedText)}`;
            window.open(url, '_blank');
            setModalWhatsapp(null);
          }}
          onClose={() => setModalWhatsapp(null)}
        />
      )}
    </AdminFinanceiroLayout>
  );
}


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


function ModalTrancar({ aluno, onClose, onSalvo }) {
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [parcelasCancelaveis, setParcelasCancelaveis] = useState([]);
  const [loadingParcelas, setLoadingParcelas] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/admin-financeiro/aluno-ordens/${aluno.id}`);
        if (!res.ok) throw new Error('Falha ao carregar parcelas');
        const data = await res.json();
        if (!active) return;

        const today = new Date().toISOString().split('T')[0];
        const cancelaveis = [];

        if (data.ordens) {
          data.ordens.forEach(o => {
            const list = o.financeiro_parcelas || [];
            list.forEach(p => {
              if (p.status !== 'pago' && p.status !== 'cancelado' && p.data_vencimento >= today) {
                cancelaveis.push({
                  id: p.id,
                  numero_parcela: p.numero_parcela,
                  valor: p.valor,
                  data_vencimento: p.data_vencimento,
                  descricao: o.descricao || 'Ordem'
                });
              }
            });
          });
        }

        if (data.carnes) {
          data.carnes.forEach(c => {
            const list = c.parcelas || [];
            list.forEach(p => {
              if (p.status !== 'pago' && p.status !== 'cancelado' && p.data_vencimento >= today) {
                cancelaveis.push({
                  id: p.id,
                  numero_parcela: p.numero_parcela,
                  valor: p.valor,
                  data_vencimento: p.data_vencimento,
                  descricao: c.descricao || 'Carnê'
                });
              }
            });
          });
        }

        setParcelasCancelaveis(cancelaveis);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoadingParcelas(false);
      }
    };
    load();
    return () => { active = false; };
  }, [aluno.id]);

  const handleConfirmar = async (e) => {
    e.preventDefault();
    if (!observacao.trim()) {
      setErro('Observação é obrigatória');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`/api/admin-financeiro/alunos/${aluno.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'trancar', observacao_trancamento: observacao }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao trancar aluno');
      }
      onSalvo();
      onClose();
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  const temAtraso = Number(aluno.financeiro_atraso) > 0;
  const totalCancelado = parcelasCancelaveis.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

  const formatarValor = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarData = (d) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const cursoNome = aluno.cursos?.nome || aluno.curso || '-';
  const turmaNome = aluno.turmas?.nome || aluno.turma || '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h3 className="text-base font-bold text-gray-800">Trancar Matrícula</h3>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-650">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleConfirmar} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 font-semibold">Aviso Importante</p>
              {temAtraso ? (
                <p className="text-xs text-amber-700 mt-1">
                  Este aluno possui débitos em aberto. A matrícula será marcada como <strong>TRANCADO COM DÉBITO</strong>. As parcelas vencidas permanecerão ativas para cobrança.
                </p>
              ) : (
                <p className="text-xs text-amber-700 mt-1">
                  As parcelas futuras e pendentes deste aluno serão canceladas.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Aluno</label>
                <p className="font-semibold text-gray-800">{aluno.nome}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Curso / Turma</label>
                <p className="font-semibold text-gray-800">{cursoNome} · {turmaNome}</p>
              </div>
            </div>

            <div className="border-t pt-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Resumo de Cancelamento Financeiro
              </label>
              {loadingParcelas ? (
                <p className="text-xs text-gray-450 italic">Carregando parcelas futuras...</p>
              ) : parcelasCancelaveis.length === 0 ? (
                <p className="text-xs text-gray-500 italic">Nenhuma parcela futura a ser cancelada.</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs bg-red-50 text-red-800 p-2 rounded border border-red-100 font-medium">
                    <span>Qtd. de parcelas: {parcelasCancelaveis.length}</span>
                    <span>Total a cancelar: {formatarValor(totalCancelado)}</span>
                  </div>
                  <div className="border rounded-lg max-h-[140px] overflow-y-auto p-2 bg-gray-50 space-y-1">
                    {parcelasCancelaveis.map((p, idx) => (
                      <div key={p.id || idx} className="flex justify-between items-center text-[11px] p-1 border-b border-gray-150 last:border-b-0 hover:bg-white rounded">
                        <span className="text-gray-700 font-medium truncate max-w-[200px]" title={p.descricao}>
                          {p.descricao} (P. {p.numero_parcela})
                        </span>
                        <span className="text-gray-500 font-mono">Venc. {formatarData(p.data_vencimento)}</span>
                        <span className="text-red-700 font-bold font-mono">{formatarValor(p.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                Observação do Trancamento <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                placeholder="Descreva o motivo do trancamento..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-amber-400 resize-none text-gray-800 bg-white"
              />
            </div>

            {erro && <p className="text-xs text-red-650 font-semibold">{erro}</p>}
          </div>

          <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-4 py-2 text-sm text-gray-650 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !observacao.trim() || loadingParcelas}
              className="px-5 py-2 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
            >
              {loading ? 'Trancando...' : 'Trancar Matrícula'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function ModalCarteirinha({ aluno, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  const getIniciais = (nome) => {
    if (!nome) return '';
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const matriculaFinal = aluno.matricula || `ALU-${aluno.id}`;
  const cursoNome = aluno.cursos?.nome || aluno.curso || '-';
  const turmaNome = aluno.turmas?.nome || aluno.turma || '-';
  const unidadeNome = aluno.turmas?.unidades?.nome || '-';
  const anoLetivoVal = aluno.ano_letivo || aluno.turmas?.anoletivo || '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 print:shadow-none print:w-auto print:max-w-none print:mx-0 print:rounded-none flex flex-col no-print-container">
        <div className="flex items-center justify-between px-6 py-4 border-b print:hidden">
          <h3 className="text-base font-bold text-gray-800">Carteirinha de Estudante</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-650 text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 flex justify-center print:p-0" id="carteirinha-impressao">
          <div className="w-80 h-48 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden border border-white/10 print:shadow-none print:border-black print:text-black">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl -mr-6 -mt-6"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

            <div className="flex justify-between items-start border-b border-white/20 pb-2">
              <div>
                <h4 className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">CREESER EDUCACIONAL</h4>
                <p className="text-[8px] text-gray-400">CARTEIRA DE ESTUDANTE</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${aluno.statusmatricula === 'ATIVO' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {aluno.statusmatricula || 'ATIVO'}
              </span>
            </div>

            <div className="flex gap-3 my-2 flex-grow items-center">
              <div className="w-14 h-18 bg-white/10 rounded-lg border border-white/20 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                {aluno.foto ? (
                  <img src={aluno.foto} alt="Foto Aluno" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-indigo-300">{getIniciais(aluno.nome)}</span>
                )}
              </div>

              <div className="space-y-0.5 overflow-hidden flex-grow min-w-0">
                <h5 className="text-[10px] font-bold truncate" title={aluno.nome}>{aluno.nome}</h5>

                <div className="grid grid-cols-2 gap-x-1 text-[7px] text-gray-300">
                  <div className="min-w-0">
                    <span className="text-gray-550 block">Matrícula</span>
                    <span className="font-semibold block truncate">{matriculaFinal}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-550 block">Ano Letivo</span>
                    <span className="font-semibold block truncate">{anoLetivoVal}</span>
                  </div>
                </div>

                <div className="text-[7px] text-gray-300 min-w-0">
                  <span className="text-gray-550 block">Curso / Turma</span>
                  <span className="font-semibold block truncate">{cursoNome} · {turmaNome}</span>
                </div>

                <div className="text-[7px] text-gray-300 min-w-0">
                  <span className="text-gray-550 block">Unidade</span>
                  <span className="font-semibold block truncate">{unidadeNome}</span>
                </div>
              </div>

              {/* Área Reservada para QR Code */}
              <div className="w-14 h-14 bg-white text-slate-900 rounded-lg p-1 border border-white/10 flex flex-col items-center justify-center flex-shrink-0 text-center font-mono print:border-black print:text-black">
                {aluno.qrcode || aluno.qr_code ? (
                  <img src={aluno.qrcode || aluno.qr_code} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <div className="text-[5px] font-bold text-indigo-700 print:text-black tracking-wider uppercase leading-none mb-0.5">QR CODE</div>
                    <div className="w-7 h-7 border border-dashed border-indigo-300 print:border-black rounded flex items-center justify-center my-0.5 bg-indigo-50/50 print:bg-transparent">
                      <svg className="w-4.5 h-4.5 text-indigo-500 print:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M4 8h.01M4 16h.01M4 20h.01" /></svg>
                    </div>
                    <div className="text-[4px] text-gray-500 font-bold truncate max-w-full">ALU-{matriculaFinal}</div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-white/20 pt-2 text-[7px] text-gray-400">
              <span className="font-mono">ID: {aluno.id}</span>
              <span className="font-mono font-bold text-white tracking-widest">{matriculaFinal}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl print:hidden">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-650 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
            Fechar
          </button>
          <button onClick={handlePrint} className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Imprimir
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #carteirinha-impressao, #carteirinha-impressao * {
            visibility: visible !important;
          }
          #carteirinha-impressao {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}


function ModalLote({ turmas, onClose, onSalvo }) {
  const [turmaId, setTurmaId] = useState('');
  const [alunos, setAlunos] = useState([]);
  const [selectedAlunos, setSelectedAlunos] = useState(new Set());
  const [loadingAlunos, setLoadingAlunos] = useState(false);

  const [form, setForm] = useState({
    periodo_inicio: '2026-01-05',
    periodo_fim: '2026-06-05',
    qtd_parcelas: 6,
    dia_vencimento: 10
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [relatorio, setRelatorio] = useState(null);

  const turmasFiltradas = (turmas || []).filter(t => (t.status_formacao || 'EM_FORMACAO') === 'EM_FORMACAO');
  const semTurmas = turmasFiltradas.length === 0;

  useEffect(() => {
    if (!turmaId) {
      setAlunos([]);
      setSelectedAlunos(new Set());
      return;
    }
    setLoadingAlunos(true);
    setErro('');
    fetch(`/api/admin-financeiro/alunos?turmaId=${turmaId}`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.alunos || [];
        setAlunos(list);
        setSelectedAlunos(new Set(list.map(a => a.id)));
      })
      .catch(() => setErro('Erro ao carregar alunos da turma.'))
      .finally(() => setLoadingAlunos(false));
  }, [turmaId]);

  const handleToggleAluno = (id) => {
    setSelectedAlunos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleTodos = () => {
    if (selectedAlunos.size === alunos.length) {
      setSelectedAlunos(new Set());
    } else {
      setSelectedAlunos(new Set(alunos.map(a => a.id)));
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (semTurmas) return;
    if (selectedAlunos.size === 0) {
      setErro('Selecione pelo menos um aluno.');
      return;
    }
    setSalvando(true);
    setErro('');
    setRelatorio(null);
    try {
      const res = await fetch('/api/admin-financeiro/ordens/lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turmaId: Number(turmaId),
          alunoIds: Array.from(selectedAlunos),
          ...form
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao gerar carnê em lote');
      }
      setRelatorio(data.relatorio);
      onSalvo();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-teal-700">Gerar Carnê em Lote (Primeiro Semestre)</h3>
          <button onClick={onClose} disabled={salvando} className="text-gray-400 hover:text-gray-650 text-xl leading-none">&times;</button>
        </div>

        {relatorio ? (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <h4 className="text-sm font-bold text-green-700">Geração de Carnês Finalizada!</h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <span className="text-xs font-semibold text-emerald-800 uppercase block">Gerados</span>
                <span className="text-2xl font-bold text-emerald-900">{relatorio.gerados.length}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <span className="text-xs font-semibold text-amber-800 uppercase block">Ignorados</span>
                <span className="text-2xl font-bold text-amber-900">{relatorio.ignorados.length}</span>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                <span className="text-xs font-semibold text-red-800 uppercase block">Erros</span>
                <span className="text-2xl font-bold text-red-900">{relatorio.erros.length}</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {relatorio.gerados.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-emerald-800">✅ Carnês Gerados com Sucesso:</h5>
                  <ul className="text-xs text-gray-700 list-disc list-inside mt-1">
                    {relatorio.gerados.map(g => <li key={g.alunoId}>{g.nome} (Total: R$ {g.valor.toFixed(2)})</li>)}
                  </ul>
                </div>
              )}
              {relatorio.ignorados.length > 0 && (
                <div className="pt-2 border-t">
                  <h5 className="text-xs font-bold text-amber-800">⚠️ Alunos Ignorados (Sem alteração):</h5>
                  <ul className="text-xs text-gray-750 list-inside mt-1 space-y-0.5">
                    {relatorio.ignorados.map(i => <li key={i.alunoId}>• <strong>{i.nome}</strong>: {i.motivo}</li>)}
                  </ul>
                </div>
              )}
              {relatorio.erros.length > 0 && (
                <div className="pt-2 border-t">
                  <h5 className="text-xs font-bold text-red-800">❌ Erros durante Processamento:</h5>
                  <ul className="text-xs text-gray-750 list-inside mt-1 space-y-0.5">
                    {relatorio.erros.map(e => <li key={e.alunoId}>• <strong>{e.nome}</strong>: {e.motivo}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button onClick={onClose} className="px-5 py-2 bg-teal-650 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold">
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
            {semTurmas && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs space-y-1">
                <p className="font-bold">Nenhuma turma Não Iniciada disponível para geração em lote.</p>
                <p className="text-[11px] text-red-700">A geração em lote só é permitida para turmas com status Não Iniciada.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-650 uppercase tracking-wide mb-1 block">Turma *</label>
                <select value={turmaId} onChange={e => setTurmaId(e.target.value)} required disabled={semTurmas}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-teal-500 bg-white text-gray-800 disabled:opacity-55 disabled:bg-gray-100">
                  <option value="">Selecione uma turma</option>
                  {turmasFiltradas.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} (Não Iniciada)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-650 uppercase tracking-wide mb-1 block">Dia de Vencimento *</label>
                <input type="number" min="1" max="31" value={form.dia_vencimento} onChange={e => set('dia_vencimento', e.target.value)} required disabled={semTurmas}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-teal-500 bg-white text-gray-800 disabled:opacity-55 disabled:bg-gray-100" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-650 uppercase tracking-wide mb-1 block">Início Período *</label>
                <input type="date" value={form.periodo_inicio} onChange={e => set('periodo_inicio', e.target.value)} required disabled={semTurmas}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-teal-500 bg-white text-gray-800 disabled:opacity-55 disabled:bg-gray-100" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-650 uppercase tracking-wide mb-1 block">Fim Período *</label>
                <input type="date" value={form.periodo_fim} onChange={e => set('periodo_fim', e.target.value)} required disabled={semTurmas}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-teal-500 bg-white text-gray-800 disabled:opacity-55 disabled:bg-gray-100" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-650 uppercase tracking-wide mb-1 block">Qtd. Parcelas *</label>
                <input type="number" min="1" max="12" value={form.qtd_parcelas} onChange={e => set('qtd_parcelas', e.target.value)} required disabled={semTurmas}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-teal-500 bg-white text-gray-800 disabled:opacity-55 disabled:bg-gray-100" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Alunos da Turma ({selectedAlunos.size}/{alunos.length})</span>
                {alunos.length > 0 && !semTurmas && (
                  <button type="button" onClick={handleToggleTodos} className="text-xs text-teal-600 hover:text-teal-700 font-bold">
                    {selectedAlunos.size === alunos.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                )}
              </div>

              <div className="border rounded-lg max-h-[180px] overflow-y-auto p-2 bg-gray-50 space-y-1">
                {loadingAlunos ? (
                  <p className="text-xs text-gray-400 italic py-2 text-center">Carregando alunos...</p>
                ) : semTurmas ? (
                  <p className="text-xs text-gray-450 italic py-2 text-center">Nenhuma turma elegível selecionada.</p>
                ) : alunos.length === 0 ? (
                  <p className="text-xs text-gray-450 italic py-2 text-center">Selecione uma turma para carregar os alunos.</p>
                ) : (
                  alunos.map(aluno => (
                    <label key={aluno.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer text-xs">
                      <input type="checkbox" checked={selectedAlunos.has(aluno.id)} onChange={() => handleToggleAluno(aluno.id)} disabled={semTurmas}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                      <span className="text-gray-800 font-medium">{aluno.nome}</span>
                      {aluno.valor_mensalidade ? (
                        <span className="text-gray-450 ml-auto">Mensalidade: R$ {Number(aluno.valor_mensalidade).toFixed(2)}</span>
                      ) : (
                        <span className="text-red-500 font-semibold ml-auto">Sem mensalidade definida</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>

            {erro && <p className="text-xs text-red-650 font-semibold">{erro}</p>}

            <div className="flex justify-end gap-3 pt-2 border-t">
              <button type="button" onClick={onClose} disabled={salvando}
                className="px-4 py-2 text-sm text-gray-650 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                Cancelar
              </button>
              <button type="submit" disabled={salvando || !turmaId || selectedAlunos.size === 0 || semTurmas}
                className="px-5 py-2 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {salvando ? 'Gerando Lote...' : 'Gerar Carnês'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ModalCancelarParcela({ carne, parcela, onConfirm, onClose, loading, formatData, formatValor }) {
  const [observacao, setObservacao] = useState('');
  const isValid = observacao.trim().length >= 10 && observacao.trim().length <= 500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Cancelar Parcela</h3>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-5 space-y-4 text-left">
          <p className="text-sm text-gray-650">Tem certeza que deseja cancelar esta parcela?</p>
          
          <div className="bg-gray-50 border border-gray-150 rounded-lg p-3 text-sm space-y-1 text-gray-700">
            <div><span className="font-semibold text-gray-900">Parcela:</span> #{parcela.numero_parcela}</div>
            <div><span className="font-semibold text-gray-900">Vencimento:</span> {formatData(parcela.data_vencimento)}</div>
            <div><span className="font-semibold text-gray-900">Valor:</span> {formatValor(parcela.valor)}</div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Observação *</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              disabled={loading}
              placeholder="Informe o motivo do cancelamento..."
              rows={4}
              maxLength={500}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-400 focus:outline-none transition disabled:bg-gray-50 text-gray-800"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Mínimo 10 caracteres</span>
              <span className={observacao.trim().length >= 10 ? 'text-green-600 font-semibold' : 'text-red-500'}>
                {observacao.length} / 500
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-650 border border-gray-300 rounded-lg hover:bg-gray-150/60 bg-white transition disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            onClick={() => onConfirm(observacao)}
            disabled={!isValid || loading}
            className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-350 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '⏳ Processando...' : 'Confirmar Cancelamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalCancelarParcelasMultiplas({ quantidade, onConfirm, onClose, loading }) {
  const [observacao, setObservacao] = useState('');
  const isValid = observacao.trim().length >= 10 && observacao.trim().length <= 500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Cancelar Parcelas</h3>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-5 space-y-4 text-left">
          <p className="text-sm text-gray-650">Tem certeza que deseja cancelar estas parcelas?</p>
          
          <div className="bg-gray-50 border border-gray-150 rounded-lg p-3 text-sm space-y-1 text-gray-700">
            <div><span className="font-semibold text-gray-900">Quantidade de Parcelas:</span> {quantidade}</div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Observação *</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              disabled={loading}
              placeholder="Informe o motivo do cancelamento..."
              rows={4}
              maxLength={500}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-400 focus:outline-none transition disabled:bg-gray-50 text-gray-800"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Mínimo 10 caracteres</span>
              <span className={observacao.trim().length >= 10 ? 'text-green-600 font-semibold' : 'text-red-500'}>
                {observacao.length} / 500
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-650 border border-gray-300 rounded-lg hover:bg-gray-150/60 bg-white transition disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            onClick={() => onConfirm(observacao)}
            disabled={!isValid || loading}
            className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-350 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '⏳ Processando...' : 'Confirmar Cancelamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Whatsapp
function ModalWhatsapp({ data, onConfirm, onClose }) {
  const [text, setText] = useState(data.mensagemPadrao || '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            💬 Enviar 2ª Via por WhatsApp
          </h3>
          <div className="mt-3 text-xs bg-white bg-opacity-15 p-3 rounded-lg flex flex-col gap-1 text-emerald-50">
            <div><span className="font-semibold">Aluno:</span> {data.aluno_nome}</div>
            <div className="flex justify-between">
              <div><span className="font-semibold">Parcela:</span> #{data.numero_parcela}</div>
              <div><span className="font-semibold">Valor:</span> {data.valorFormatado}</div>
              <div><span className="font-semibold">Vencimento:</span> {data.dataFormatada}</div>
            </div>
          </div>
        </div>

        {/* Corpo / Edição */}
        <div className="p-6">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Mensagem a ser enviada:
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none font-sans"
            placeholder="Digite a mensagem..."
          />
        </div>

        {/* Rodapé / Ações */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-100 transition text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(text)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition text-sm font-semibold shadow-sm hover:shadow flex items-center gap-1.5"
          >
            Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}


