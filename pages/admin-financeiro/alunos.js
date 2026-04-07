import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';

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
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const valorFinal = () => {
    const v = Number(form.valor) || 0;
    return v - v * ((Number(form.percentual_desconto) || 0) / 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descricao.trim()) return setErro('Descrição é obrigatória');
    if (!form.valor || Number(form.valor) <= 0) return setErro('Valor deve ser maior que zero');
    setSalvando(true); setErro('');
    try {
      const qtd = Number(form.quantidade_parcelas) || 1;
      const res = await fetch('/api/admin-financeiro/ordens/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: aluno.id, tipo: 'ordem_simples',
          descricao: form.descricao.trim(),
          referencia: form.categoria || null,
          valor_total: Number(form.valor),
          percentual_desconto: Number(form.percentual_desconto) || 0,
          valor_desconto: Number(form.valor) * ((Number(form.percentual_desconto) || 0) / 100),
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
          setTimeout(() => { onSalvo(); onSuccess(); }, 3000);
          return;
        }
      }

      setSucesso('✅ Ordem e boleto EFI criados com sucesso!');
      setTimeout(() => { onSalvo(); onSuccess(); }, 1500);
    } catch (e) { setErro(e.message); } finally { setSalvando(false); }
  };

  const inputCls = 'flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-blue-700">Nova Ordem de Pagamento</h3>
            <p className="text-sm text-gray-500">{aluno.nome}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          <p className="text-xs font-semibold text-teal-600 mb-1">Lançar faturas</p>

          <div className="grid grid-cols-2 gap-3">
            {/* Valor | Desconto */}
            <FieldGroup label="Valor *">
              <input type="number" step="0.01" min="0" value={form.valor}
                onChange={e => set('valor', e.target.value)}
                className={inputCls} placeholder="Valor da fatura" />
            </FieldGroup>
            <div className="flex items-stretch rounded-lg border border-teal-300 bg-teal-50 focus-within:border-teal-500">
              <span className="px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-100 border-r border-teal-300 flex items-center rounded-l-lg flex-shrink-0">Desconto</span>
              <input type="number" step="0.01" min="0" max="100" value={form.percentual_desconto}
                onChange={e => set('percentual_desconto', e.target.value)}
                className={inputCls} placeholder="0" />
              <span className="px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-100 border-l border-teal-300 flex items-center rounded-r-lg flex-shrink-0">%</span>
            </div>

            {/* Vencimento | Vencimento do Desconto */}
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

            {/* Categoria | Qtd. Parcelas */}
            <FieldGroup label="Categoria">
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
                className={inputCls + ' cursor-pointer'}>
                <option value="">- Escolha uma Categoria -</option>
                {CATEGORIAS_ORDEM.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="Qtd. Parcelas">
              <input type="number" min="1" max="60" value={form.quantidade_parcelas}
                onChange={e => set('quantidade_parcelas', e.target.value)}
                className={inputCls} placeholder="Quantidade de parcelas." />
            </FieldGroup>

            {/* Descrição — linha inteira */}
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

          {erro && <p className="text-sm text-red-600">{erro}</p>}
          {sucesso && <p className="text-sm text-green-600">{sucesso}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Criar Ordem'}
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
    periodo: '',
    data_vencimento: vencimentoStr,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const valorFinal = () => { const v = Number(form.valor) || 0; return v - v * ((Number(form.percentual_desconto) || 0) / 100); };
  const valorParcela = () => valorFinal() / (Number(form.quantidade_parcelas) || 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.valor || Number(form.valor) <= 0) return setErro('Valor deve ser maior que zero');
    if (!form.data_vencimento) return setErro('Data do primeiro vencimento é obrigatória');
    setSalvando(true); setErro('');
    try {
      const res = await fetch('/api/admin-financeiro/ordens/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: aluno.id, tipo: 'carne',
          descricao: form.descricao.trim() || 'MENSALIDADE',
          referencia: form.periodo.trim() || null,
          valor_total: Number(form.valor),
          percentual_desconto: Number(form.percentual_desconto) || 0,
          valor_desconto: Number(form.valor) * ((Number(form.percentual_desconto) || 0) / 100),
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
          setTimeout(() => { onSalvo(); onSuccess(); }, 3000);
          return;
        }
      }

      setSucesso('✅ Carnê e boletos EFI criados com sucesso!');
      setTimeout(() => { onSalvo(); onSuccess(); }, 1500);
    } catch (e) { setErro(e.message); } finally { setSalvando(false); }
  };

  const inputCls = 'flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400';

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
            {/* Valor | Desconto */}
            <FieldGroup label="Valor *">
              <input type="number" step="0.01" min="0" value={form.valor}
                onChange={e => set('valor', e.target.value)}
                className={inputCls} placeholder="Valor total do carnê" />
            </FieldGroup>
            <div className="flex items-stretch rounded-lg border border-teal-300 bg-teal-50 focus-within:border-teal-500">
              <span className="px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-100 border-r border-teal-300 flex items-center rounded-l-lg flex-shrink-0">Desconto</span>
              <input type="number" step="0.01" min="0" max="100" value={form.percentual_desconto}
                onChange={e => set('percentual_desconto', e.target.value)}
                className={inputCls} placeholder="0" />
              <span className="px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-100 border-l border-teal-300 flex items-center rounded-r-lg flex-shrink-0">%</span>
            </div>

            {/* 1º Vencimento | Vencimento do Desconto */}
            <FieldGroup label="1º Vencimento *">
              <input type="date" value={form.data_vencimento}
                onChange={e => set('data_vencimento', e.target.value)}
                className={inputCls} />
            </FieldGroup>
            <FieldGroup label="Vencimento do Desconto">
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
              <input type="text" value={form.periodo}
                onChange={e => set('periodo', e.target.value)}
                className={inputCls} />
            </FieldGroup>

            {/* Descrição — linha inteira */}
            <FieldGroup label="Descrição" className="col-span-2">
              <textarea rows={2} value={form.descricao}
                onChange={e => set('descricao', e.target.value)}
                className={inputCls + ' resize-none'}
                placeholder="Caso deixe em branco, será inserido: 'MENSALIDADE'." />
            </FieldGroup>
            {Number(form.valor) > 0 ? (
              <div className="flex items-center bg-purple-50 border border-purple-200 rounded-lg px-4 text-sm text-purple-800">
                {form.quantidade_parcelas}x de <strong className="ml-1">R$ {valorParcela().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                <span className="mx-2 text-purple-400">·</span>Total: <strong className="ml-1">R$ {valorFinal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
            ) : <div />}
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}
          {sucesso && <p className="text-sm text-green-600">{sucesso}</p>}
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

function ModalRecibo({ ordem, onClose }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch(`/api/admin-financeiro/recibo/${ordem.id}`)
      .then(r => r.ok ? r.json() : r.json().then(b => { throw new Error(b.message); }))
      .then(d => { setDados(d); setLoading(false); })
      .catch(e => { setErro(e.message); setLoading(false); });
  }, [ordem.id]);

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

export default function AlunosFinanceiroPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('ATIVO');

  const [modalFinanceiro, setModalFinanceiro] = useState(null);
  const [modalOrdem, setModalOrdem] = useState(null);
  const [modalCarne, setModalCarne] = useState(null);
  const [modal2aVia, setModal2aVia] = useState(null);
  const [modalExcluir, setModalExcluir] = useState(null);
  const [modalHistorico, setModalHistorico] = useState(null);
  const [modalRecibo, setModalRecibo] = useState(null);
  const [selectedFaturas, setSelectedFaturas] = useState(new Set());
  const [deletandoLote, setDeletandoLote] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [ordensCache, setOrdensCache] = useState({});
  const [carnesCache, setCarnesCache] = useState({});
  const [loadingOrdens, setLoadingOrdens] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('aberto');

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

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin-financeiro/alunos');
      if (res.ok) {
        const data = await res.json();
        setAlunos(Array.isArray(data.alunos) ? data.alunos : []);
        if (data.turmas) setTurmas(data.turmas);
        if (data.cursos) setCursos(data.cursos);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const alunosFiltrados = useMemo(() => {
    let r = alunos;
    if (filtroStatus) r = r.filter(a => a.statusmatricula === filtroStatus);
    if (filtroNome) { const t = filtroNome.toLowerCase(); r = r.filter(a => (a.nome||'').toLowerCase().includes(t)||(a.cpf||'').includes(t)||(a.email||'').toLowerCase().includes(t)); }
    if (filtroTurma) r = r.filter(a => a.turmaid === filtroTurma);
    if (filtroCurso) r = r.filter(a => a.cursoid === filtroCurso);
    return r;
  }, [alunos, filtroNome, filtroTurma, filtroCurso, filtroStatus]);

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

  const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${{ ATIVO: 'bg-green-100 text-green-800', INATIVO: 'bg-red-100 text-red-800' }[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>
  );

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
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Alunos</h2>
          <p className="text-gray-600">Selecione um aluno para lançar ordens ou carnês de pagamento</p>
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

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input type="text" placeholder="🔍 Nome, Email ou CPF..." value={filtroNome} onChange={e => setFiltroNome(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500" />
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500">
              <option value="ATIVO">Status: Ativo</option>
              <option value="INATIVO">Status: Inativo</option>
              <option value="">Todos os Status</option>
            </select>
            <select value={filtroTurma} onChange={e => setFiltroTurma(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500">
              <option value="">Todas as Turmas</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
            <select value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500">
              <option value="">Todos os Cursos</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>

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
                                const fmtValor = (v) => Number(v||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                const fmtData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';
                                const coresCarne = { ativo:'bg-blue-100 text-blue-800', waiting:'bg-yellow-100 text-yellow-800', cancelado:'bg-gray-100 text-gray-800', encerrado:'bg-green-100 text-green-800' };
                                return (
                                  <table className="w-full text-sm rounded-lg overflow-hidden">
                                    <thead>
                                      <tr className="bg-purple-50 text-gray-600 border-b border-purple-200">
                                        <th className="px-4 py-2 text-left text-xs font-semibold">Descrição</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold">Período</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold">Parcelas</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold">Valor Total</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold">Criado em</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {carnes.map(carne => (
                                        <tr key={carne.id} className="hover:bg-purple-50 transition">
                                          <td className="px-4 py-2 text-gray-800 font-medium">{carne.descricao || '-'}</td>
                                          <td className="px-4 py-2 text-gray-500">{carne.referencia || '-'}</td>
                                          <td className="px-4 py-2 text-center">
                                            <span className="text-gray-700 font-semibold">{carne.parcelas_pagas}</span>
                                            <span className="text-gray-400">/{carne.parcelas_total}</span>
                                            {carne.parcelas_pagas > 0 && (
                                              <span className="ml-1 text-xs text-emerald-600 font-semibold">pagas</span>
                                            )}
                                          </td>
                                          <td className="px-4 py-2 text-right font-semibold text-gray-800">{fmtValor(carne.valor_total)}</td>
                                          <td className="px-4 py-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${coresCarne[carne.status] || 'bg-gray-100 text-gray-800'}`}>
                                              {carne.status || '-'}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 text-gray-500 text-xs">{fmtData(carne.created_at)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
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
                                                  <button title="Excluir Fatura" onClick={e => { e.stopPropagation(); setModalExcluir({ ordem, aluno }); }}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                  </button>
                                                </>)}
                                                {abaAtiva === 'pago' && (
                                                  <button title="Imprimir Recibo" onClick={e => { e.stopPropagation(); setModalRecibo(ordem); }}
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
    </AdminFinanceiroLayout>
  );
}


