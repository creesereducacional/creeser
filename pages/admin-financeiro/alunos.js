import { useEffect, useMemo, useState } from 'react';
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

function ModalOrdem({ aluno, onClose, onSalvo }) {
  const hoje = new Date();
  const diaAluno = aluno.dia_pagamento || hoje.getDate();
  const vencimentoPadrao = new Date(hoje.getFullYear(), hoje.getMonth(), diaAluno);
  if (vencimentoPadrao < hoje) vencimentoPadrao.setMonth(vencimentoPadrao.getMonth() + 1);
  const vencimentoStr = vencimentoPadrao.toISOString().split('T')[0];

  const [form, setForm] = useState({
    descricao: '',
    referencia: '',
    valor: aluno.valor_mensalidade || '',
    percentual_desconto: '',
    data_vencimento: vencimentoStr,
    observacoes: ''
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

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
      // 1. Criar ordem + parcela no banco
      const res = await fetch('/api/admin-financeiro/ordens/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: aluno.id, tipo: 'ordem_simples',
          descricao: form.descricao.trim(), referencia: form.referencia.trim() || null,
          valor_total: Number(form.valor), percentual_desconto: Number(form.percentual_desconto) || 0,
          valor_desconto: Number(form.valor) * ((Number(form.percentual_desconto) || 0) / 100),
          quantidade_parcelas: 1, data_vencimento_primeira: form.data_vencimento,
          observacoes: form.observacoes.trim() || null, criado_por: 'financeiro'
        }),
      });
      const resBody = await res.json();
      if (!res.ok) throw new Error(resBody.error || resBody.message || 'Erro ao criar ordem');

      const parcela_id = resBody.parcelas?.[0]?.id;

      // 2. Gerar boleto na EFI
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
          setTimeout(() => { onSalvo(); onClose(); }, 3000);
          return;
        }
      }

      setSucesso('✅ Ordem e boleto EFI criados com sucesso!');
      setTimeout(() => { onSalvo(); onClose(); }, 1500);
    } catch (e) { setErro(e.message); } finally { setSalvando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-blue-700">Nova Ordem de Pagamento</h3>
            <p className="text-sm text-gray-500">{aluno.nome}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Descrição *</label>
            <input type="text" value={form.descricao} onChange={e => setForm(p => ({...p, descricao: e.target.value}))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" placeholder="Ex: Mensalidade Fevereiro/2025" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Referência</label>
            <input type="text" value={form.referencia} onChange={e => setForm(p => ({...p, referencia: e.target.value}))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" placeholder="Ex: 02/2025" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Vencimento *</label>
            <input type="date" value={form.data_vencimento} onChange={e => setForm(p => ({...p, data_vencimento: e.target.value}))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Valor (R$) *</label>
              <input type="number" step="0.01" min="0" value={form.valor} onChange={e => setForm(p => ({...p, valor: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" placeholder="0,00" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Desconto (%)</label>
              <input type="number" step="0.01" min="0" max="100" value={form.percentual_desconto} onChange={e => setForm(p => ({...p, percentual_desconto: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" placeholder="0" />
            </div>
          </div>
          {(Number(form.valor) > 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
              Valor final: <strong>R$ {valorFinal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm(p => ({...p, observacoes: e.target.value}))} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" />
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

function ModalCarne({ aluno, onClose, onSalvo }) {
  const [form, setForm] = useState({
    descricao: '',
    referencia: '',
    valor: aluno.valor_mensalidade || '',
    percentual_desconto: '',
    quantidade_parcelas: aluno.qtd_parcelas || 12,
    intervalo_dias: 30,
    data_vencimento: '',
    observacoes: ''
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const valorFinal = () => {
    const v = Number(form.valor) || 0;
    return v - v * ((Number(form.percentual_desconto) || 0) / 100);
  };
  const valorParcela = () => valorFinal() / (Number(form.quantidade_parcelas) || 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descricao.trim()) return setErro('Descrição é obrigatória');
    if (!form.valor || Number(form.valor) <= 0) return setErro('Valor deve ser maior que zero');
    if (!form.data_vencimento) return setErro('Data do primeiro vencimento é obrigatória');
    setSalvando(true); setErro('');
    try {
      const res = await fetch('/api/admin-financeiro/ordens/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aluno_id: Number(aluno.id), tipo: 'carne',
          descricao: form.descricao.trim(), referencia: form.referencia.trim() || null,
          valor_total: Number(form.valor), percentual_desconto: Number(form.percentual_desconto) || 0,
          valor_desconto: Number(form.valor) * ((Number(form.percentual_desconto) || 0) / 100),
          quantidade_parcelas: Number(form.quantidade_parcelas),
          intervalo_dias: Number(form.intervalo_dias) || 30,
          data_vencimento_primeira: form.data_vencimento,
          observacoes: form.observacoes.trim() || null, criado_por: 'financeiro'
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Erro');
      setSucesso('✅ Carnê criado com sucesso!');
      setTimeout(() => { onSalvo(); onClose(); }, 1200);
    } catch (e) { setErro(e.message); } finally { setSalvando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-purple-700">Novo Carnê</h3>
            <p className="text-sm text-gray-500">{aluno.nome}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Descrição *</label>
            <input type="text" value={form.descricao} onChange={e => setForm(p => ({...p, descricao: e.target.value}))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400" placeholder="Ex: Mensalidades 2025" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Referência</label>
            <input type="text" value={form.referencia} onChange={e => setForm(p => ({...p, referencia: e.target.value}))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400" placeholder="Ex: 2025/1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Valor Total (R$) *</label>
              <input type="number" step="0.01" min="0" value={form.valor} onChange={e => setForm(p => ({...p, valor: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400" placeholder="0,00" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Desconto (%)</label>
              <input type="number" step="0.01" min="0" max="100" value={form.percentual_desconto} onChange={e => setForm(p => ({...p, percentual_desconto: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400" placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Qtd. de Parcelas *</label>
              <input type="number" min="1" value={form.quantidade_parcelas} onChange={e => setForm(p => ({...p, quantidade_parcelas: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Intervalo (dias)</label>
              <input type="number" min="1" value={form.intervalo_dias} onChange={e => setForm(p => ({...p, intervalo_dias: e.target.value}))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">1º Vencimento *</label>
            <input type="date" value={form.data_vencimento} onChange={e => setForm(p => ({...p, data_vencimento: e.target.value}))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400" />
          </div>
          {(Number(form.valor) > 0) && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 text-sm text-purple-800">
              {form.quantidade_parcelas}x de <strong>R$ {valorParcela().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              {' '}= Total: <strong>R$ {valorFinal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm(p => ({...p, observacoes: e.target.value}))} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400" />
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

export default function AlunosFinanceiroPage() {
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
    totalValor: alunosFiltrados.reduce((acc, a) => acc + (Number(a.valor_mensalidade) || 0), 0),
  }), [alunosFiltrados]);

  const getNomeTurma = (id) => turmas.find(t => t.id === id)?.nome || 'Sem turma';
  const getNomeCurso = (id) => cursos.find(c => c.id === id)?.nome || 'Sem curso';
  const formataValor = (v) => Number(v||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${{ ATIVO: 'bg-green-100 text-green-800', INATIVO: 'bg-red-100 text-red-800' }[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>
  );

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
            <p className="text-sm text-teal-700 font-semibold">Total de Alunos</p>
            <p className="text-3xl font-bold text-teal-900 mt-1">{resumo.totalAlunos}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm text-emerald-700 font-semibold">Somatório Mensalidade</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{formataValor(resumo.totalValor)}</p>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">CPF</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Turma</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Curso</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Mensalidade</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Parcelas</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {alunosFiltrados.map(aluno => (
                    <tr key={aluno.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{aluno.nome}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{aluno.cpf}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{getNomeTurma(aluno.turmaid)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{getNomeCurso(aluno.cursoid)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{aluno.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{formataValor(aluno.valor_mensalidade)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{aluno.qtd_parcelas || 1}x</td>
                      <td className="px-6 py-4"><StatusBadge status={aluno.statusmatricula} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* Editar dados financeiros */}
                          <button onClick={() => setModalFinanceiro(aluno)} title="Dados Financeiros"
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          {/* Criar Ordem */}
                          <button onClick={() => setModalOrdem(aluno)} title="Criar Ordem de Pagamento"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </button>
                          {/* Criar Carnê */}
                          <button onClick={() => setModalCarne(aluno)} title="Criar Carnê"
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
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
        <ModalOrdem aluno={modalOrdem} onClose={() => setModalOrdem(null)} onSalvo={carregarDados} />
      )}
      {modalCarne && (
        <ModalCarne aluno={modalCarne} onClose={() => setModalCarne(null)} onSalvo={carregarDados} />
      )}
    </AdminFinanceiroLayout>
  );
}


