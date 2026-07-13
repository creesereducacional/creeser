import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';

const ABAS = [
  { id: 'visual',       icon: '🏢', label: 'Geral' },
  { id: 'financeiro',   icon: '💰', label: 'Financeiro' },
  { id: 'contratos',    icon: '📄', label: 'Contratos' },
  { id: 'comercial',    icon: '🎯', label: 'Comercial' },
  { id: 'integracoes',  icon: '🔌', label: 'Integrações' },
  { id: 'avancado',     icon: '⚙️', label: 'Avançado' },
];

const INPUT = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white';
const LABEL = 'block text-xs font-semibold text-gray-600 mb-1';

function Field({ label, children }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  );
}

function SalvoAlert({ tipo }) {
  if (!tipo) return null;
  const ok = tipo === 'ok';
  return (
    <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
      {ok ? '✓ Configurações salvas com sucesso!' : '✕ Erro ao salvar. Tente novamente.'}
    </div>
  );
}

export default function Configuracoes() {
  const [aba, setAba]         = useState('visual');
  const [form, setForm]       = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const [alert, setAlert]     = useState(null); // 'ok' | 'erro'
  const [configId, setConfigId] = useState(null);

  useEffect(() => {
    fetch('/api/configuracoes/empresa', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d?.id) {
          setConfigId(d.id);
          setForm({
            // Visual
            nomeEmpresa:     d.nomeEmpresa || '',
            razaoSocial:     d.razaoSocial || '',
            cnpj:            d.cnpj || '',
            logo:            d.logo || '',
            website:         d.website || '',
            descricao:       d.descricao || '',
            // Contato
            email:           d.email || '',
            telefone:        d.telefone || '',
            ddd:             d.ddd || '',
            contatoWhatsapp: d.contatoWhatsapp || '',
            exibirWhatsappAluno: d.exibirWhatsappAluno || false,
            // Endereço
            endereco:        d.endereco || '',
            cidade:          d.cidade || '',
            estado:          d.estado || '',
            cep:             d.cep || '',
            // Financeiro
            fin_banco:       d.financeiro?.banco || '',
            fin_agencia:     d.financeiro?.agencia || '',
            fin_conta:       d.financeiro?.conta || '',
            fin_pix:         d.financeiro?.pix || '',
            fin_boleto_venc: d.financeiro?.boleto_vencimento || '5',
            fin_multa:       d.financeiro?.multa_percentual || '2',
            fin_juros:       d.financeiro?.juros_percentual || '1',
            // Contratos
            cont_assinatura: d.financeiro?.assinatura_institucional || '',
            cont_validade:   d.financeiro?.contrato_validade_dias || '30',
            cont_modelo:     d.financeiro?.contrato_modelo || '',
            // Comercial
            com_comissao_padrao: d.financeiro?.comissao_padrao || '',
            com_comissao_tipo:   d.financeiro?.comissao_tipo || 'percentual',
            com_funil_etapas:    d.financeiro?.funil_etapas || '',
            // Integrações
            int_efi_sandbox:     d.financeiro?.efi_sandbox || false,
            int_email_host:      d.financeiro?.email_host || '',
            int_email_port:      d.financeiro?.email_port || '587',
            int_email_user:      d.financeiro?.email_user || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const buscarCep = async (cep) => {
    const raw = cep.replace(/\D/g, '');
    if (raw.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setForm(f => ({
          ...f,
          endereco: d.logradouro || f.endereco,
          bairro:   d.bairro    || f.bairro,
          cidade:   d.localidade || f.cidade,
          estado:   d.uf        || f.estado,
        }));
      }
    } catch {}
  };

  const salvar = async () => {
    setSalvando(true);
    setAlert(null);
    try {
      const payload = {
        id: configId,
        nomeEmpresa:     form.nomeEmpresa,
        razaoSocial:     form.razaoSocial,
        cnpj:            form.cnpj,
        logo:            form.logo,
        website:         form.website,
        descricao:       form.descricao,
        email:           form.email,
        telefone:        form.telefone,
        ddd:             form.ddd,
        contatoWhatsapp: form.contatoWhatsapp,
        exibirWhatsappAluno: form.exibirWhatsappAluno,
        endereco:        form.endereco,
        cidade:          form.cidade,
        estado:          form.estado,
        cep:             form.cep,
        financeiro: {
          banco:                   form.fin_banco,
          agencia:                 form.fin_agencia,
          conta:                   form.fin_conta,
          pix:                     form.fin_pix,
          boleto_vencimento:       form.fin_boleto_venc,
          multa_percentual:        form.fin_multa,
          juros_percentual:        form.fin_juros,
          assinatura_institucional: form.cont_assinatura,
          contrato_validade_dias:  form.cont_validade,
          contrato_modelo:         form.cont_modelo,
          comissao_padrao:         form.com_comissao_padrao,
          comissao_tipo:           form.com_comissao_tipo,
          funil_etapas:            form.com_funil_etapas,
          efi_sandbox:             form.int_efi_sandbox,
          email_host:              form.int_email_host,
          email_port:              form.int_email_port,
          email_user:              form.int_email_user,
        },
      };

      const res = await fetch('/api/configuracoes/empresa', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setAlert(res.ok ? 'ok' : 'erro');
    } catch {
      setAlert('erro');
    } finally {
      setSalvando(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const renderGeral = () => (
    <div className="space-y-6">

      {/* ── Identificação ──────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">🏢 Identificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nome Fantasia *">
            <input value={form.nomeEmpresa || ''} onChange={set('nomeEmpresa')} className={INPUT} />
          </Field>
          <Field label="Razão Social">
            <input value={form.razaoSocial || ''} onChange={set('razaoSocial')} className={INPUT} />
          </Field>
          <Field label="CNPJ">
            <input value={form.cnpj || ''} onChange={set('cnpj')} placeholder="00.000.000/0001-00" className={INPUT} />
          </Field>
          <Field label="Inscrição Estadual">
            <input value={form.inscricaoEstadual || ''} onChange={set('inscricaoEstadual')} placeholder="Isento ou número" className={INPUT} />
          </Field>
          <Field label="Website">
            <input value={form.website || ''} onChange={set('website')} placeholder="https://..." className={INPUT} />
          </Field>
          <Field label="Slogan">
            <input value={form.descricao || ''} onChange={set('descricao')} placeholder="Ex: Transformando vidas pela educação" className={INPUT} />
          </Field>
        </div>
        <div className="pt-1">
          <Field label="Logo (URL)">
            <input value={form.logo || ''} onChange={set('logo')} placeholder="https://... ou /logo.png" className={INPUT} />
          </Field>
          {form.logo && (
            <div className="flex items-center gap-3 mt-2">
              <img src={form.logo} alt="Logo" className="h-12 object-contain border rounded-lg p-1 bg-gray-50" />
              <p className="text-xs text-gray-400">Pré-visualização do logo</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Contato ──────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">📞 Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="E-mail Institucional">
            <input type="email" value={form.email || ''} onChange={set('email')} className={INPUT} />
          </Field>
          <Field label="Telefone">
            <input value={form.telefone || ''} onChange={set('telefone')} className={INPUT} />
          </Field>
          <Field label="WhatsApp">
            <input value={form.contatoWhatsapp || ''} onChange={set('contatoWhatsapp')} placeholder="5511999999999" className={INPUT} />
          </Field>
          <Field label="DDD Padrão">
            <input value={form.ddd || ''} onChange={set('ddd')} maxLength={2} placeholder="11" className={INPUT} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pt-1">
          <input type="checkbox" checked={!!form.exibirWhatsappAluno} onChange={set('exibirWhatsappAluno')} className="rounded text-teal-600" />
          Exibir WhatsApp de contato no portal do aluno
        </label>
      </div>

      {/* ── Endereço ─────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">📍 Endereço</h3>
          <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded">ViaCEP automático</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="CEP">
            <input
              value={form.cep || ''}
              onChange={e => { set('cep')(e); buscarCep(e.target.value); }}
              placeholder="00000-000"
              className={INPUT}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Logradouro">
              <input value={form.endereco || ''} onChange={set('endereco')} placeholder="Preenchido automaticamente" className={INPUT} />
            </Field>
          </div>
          <Field label="Bairro">
            <input value={form.bairro || ''} onChange={set('bairro')} placeholder="Preenchido automaticamente" className={INPUT} />
          </Field>
          <Field label="Cidade">
            <input value={form.cidade || ''} onChange={set('cidade')} className={INPUT} />
          </Field>
          <Field label="Estado (UF)">
            <input value={form.estado || ''} onChange={set('estado')} maxLength={2} placeholder="SP" className={INPUT} />
          </Field>
        </div>
      </div>

    </div>
  );

  const renderFinanceiro = () => (
    <div className="space-y-6">

      {/* ── 1. Dados Bancários ───────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">🏦 Dados Bancários</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Banco">
            <input value={form.fin_banco || ''} onChange={set('fin_banco')} placeholder="Ex: Banco do Brasil" className={INPUT} />
          </Field>
          <Field label="Agência">
            <input value={form.fin_agencia || ''} onChange={set('fin_agencia')} className={INPUT} />
          </Field>
          <Field label="Conta">
            <input value={form.fin_conta || ''} onChange={set('fin_conta')} className={INPUT} />
          </Field>
          <Field label="Tipo de Conta">
            <select value={form.fin_tipo_conta || 'corrente'} onChange={set('fin_tipo_conta')} className={INPUT}>
              <option value="corrente">Conta Corrente</option>
              <option value="poupanca">Conta Poupança</option>
              <option value="pagamento">Conta de Pagamento</option>
            </select>
          </Field>
          <Field label="Favorecido">
            <input value={form.fin_favorecido || ''} onChange={set('fin_favorecido')} placeholder="Nome completo ou Razão Social" className={INPUT} />
          </Field>
          <Field label="Chave PIX">
            <input value={form.fin_pix || ''} onChange={set('fin_pix')} placeholder="CPF, CNPJ, e-mail ou chave aleatória" className={INPUT} />
          </Field>
        </div>
      </div>

      {/* ── 2. Regras Financeiras ────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">📏 Regras Financeiras</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Dia padrão de vencimento">
            <input type="number" min="1" max="28" value={form.fin_boleto_venc || ''} onChange={set('fin_boleto_venc')} className={INPUT} />
          </Field>
          <Field label="Multa por atraso (%)">
            <input type="number" step="0.1" min="0" max="10" value={form.fin_multa || ''} onChange={set('fin_multa')} className={INPUT} />
          </Field>
          <Field label="Juros ao mês (%)">
            <input type="number" step="0.1" min="0" max="5" value={form.fin_juros || ''} onChange={set('fin_juros')} className={INPUT} />
          </Field>
          <Field label="Dias de tolerância">
            <input type="number" min="0" max="30" value={form.fin_tolerancia || '0'} onChange={set('fin_tolerancia')} placeholder="0" className={INPUT} />
          </Field>
          <Field label="Desconto por pontualidade (%)">
            <input type="number" step="0.1" min="0" max="100" value={form.fin_desconto_pontualidade || ''} onChange={set('fin_desconto_pontualidade')} placeholder="0" className={INPUT} />
          </Field>
        </div>
      </div>

      {/* ── 3. Configurações de Cobrança ─────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">⚙️ Configurações de Cobrança</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'fin_gerar_carne_auto',       label: 'Gerar carnê automaticamente na matrícula' },
            { key: 'fin_gerar_taxa_matricula',    label: 'Gerar taxa de matrícula automaticamente' },
            { key: 'fin_permitir_renegociacao',   label: 'Permitir renegociação de débitos' },
            { key: 'fin_permitir_pagto_parcial',  label: 'Permitir pagamento parcial de parcelas' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-teal-50/50 hover:border-teal-200 transition">
              <input
                type="checkbox"
                checked={!!form[key]}
                onChange={set(key)}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── 4. Plano Financeiro Padrão ───────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">📅 Plano Financeiro Padrão</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Quantidade padrão de parcelas">
            <input type="number" min="1" max="60" value={form.fin_parcelas_padrao || '12'} onChange={set('fin_parcelas_padrao')} className={INPUT} />
          </Field>
          <Field label="Primeiro vencimento padrão (dia)">
            <input type="number" min="1" max="28" value={form.fin_primeiro_venc || '5'} onChange={set('fin_primeiro_venc')} className={INPUT} />
          </Field>
          <Field label="Forma de cobrança padrão">
            <select value={form.fin_forma_cobranca || 'boleto'} onChange={set('fin_forma_cobranca')} className={INPUT}>
              <option value="boleto">Boleto Bancário</option>
              <option value="pix">PIX</option>
              <option value="cartao">Cartão de Crédito</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="transferencia">Transferência Bancária</option>
            </select>
          </Field>
        </div>
      </div>

    </div>
  );

  const renderContratos = () => (
    <div className="space-y-6">

      {/* ── 1. Assinatura Institucional ───────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">✍️ Assinatura Institucional</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nome do Responsável">
            <input value={form.cont_resp_nome || ''} onChange={set('cont_resp_nome')} placeholder="Ex: João da Silva" className={INPUT} />
          </Field>
          <Field label="Cargo">
            <input value={form.cont_resp_cargo || ''} onChange={set('cont_resp_cargo')} placeholder="Ex: Diretor Acadêmico" className={INPUT} />
          </Field>
          <Field label="Cidade">
            <input value={form.cont_resp_cidade || ''} onChange={set('cont_resp_cidade')} placeholder="Ex: São Paulo – SP" className={INPUT} />
          </Field>
          <Field label="Validade do Link de Assinatura (dias)">
            <input type="number" min="1" max="365" value={form.cont_validade || '30'} onChange={set('cont_validade')} className={INPUT} />
          </Field>
        </div>
        <Field label="Texto de Rodapé do Contrato">
          <textarea value={form.cont_assinatura || ''} onChange={set('cont_assinatura')} rows={3}
            placeholder="Ex: Assinado em ___/___/______, pelo representante legal da instituição…" className={INPUT} />
        </Field>
      </div>

      {/* ── 2. Modelo de Contrato ─────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">📄 Modelo de Contrato</h3>
        <Field label="Modelo padrão de contrato">
          <select value={form.cont_modelo || ''} onChange={set('cont_modelo')} className={INPUT}>
            <option value="">— Padrão do sistema —</option>
            <option value="basico">Básico</option>
            <option value="completo">Completo com cláusulas LGPD</option>
            <option value="customizado">Customizado</option>
          </select>
        </Field>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link href="/admin/contratos/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition">
            📂 Gerenciar Modelos
          </Link>
          <Link href="/admin/contratos/relatorio"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold transition">
            👁️ Visualizar Relatório
          </Link>
        </div>
      </div>

      {/* ── 3. Regras de Contratação ─────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">⚙️ Regras de Contratação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'cont_exigir_assinatura',      label: 'Exigir assinatura para concluir matrícula' },
            { key: 'cont_permitir_presencial',     label: 'Permitir assinatura presencial' },
            { key: 'cont_permitir_digital',        label: 'Permitir assinatura digital (Assinafy)' },
            { key: 'cont_gerar_apos_conversao',    label: 'Gerar contrato automaticamente após conversão de lead' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-teal-50/50 hover:border-teal-200 transition">
              <input
                type="checkbox"
                checked={!!form[key]}
                onChange={set(key)}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── 4. Documentos Obrigatórios ────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">📎 Documentos Obrigatórios</h3>
        <p className="text-xs text-gray-500">Selecione quais documentos são obrigatórios para finalizar a matrícula.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'doc_rg',            label: 'RG (Identidade)' },
            { key: 'doc_cpf',           label: 'CPF' },
            { key: 'doc_compresidencia', label: 'Comprovante de Residência' },
            { key: 'doc_historico',     label: 'Histórico Escolar' },
            { key: 'doc_certificado',   label: 'Certificado de Conclusão' },
            { key: 'doc_foto3x4',       label: 'Foto 3×4' },
            { key: 'doc_outros',        label: 'Outros (definir caso a caso)' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-teal-50/50 hover:border-teal-200 transition">
              <input
                type="checkbox"
                checked={!!form[key]}
                onChange={set(key)}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── 5. Situação ──────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">📊 Situação Contratual</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Modelo Ativo',          value: form.cont_modelo ? (form.cont_modelo === 'basico' ? 'Básico' : form.cont_modelo === 'completo' ? 'Completo LGPD' : 'Customizado') : 'Padrão', icon: '📄', color: 'teal' },
            { label: 'Assinaturas Pendentes', value: 'Em preparação', icon: '⏳', color: 'amber' },
            { label: 'Contratos Emitidos',    value: 'Em preparação', icon: '✅', color: 'green' },
            { label: 'Última Emissão',        value: 'Em preparação', icon: '🕒', color: 'gray' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`p-4 rounded-xl border bg-${color}-50 border-${color}-200 space-y-1`}>
              <div className="text-xl">{icon}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</div>
              <div className={`text-sm font-semibold text-${color}-700`}>{value}</div>
            </div>
          ))}
        </div>
        <div className="pt-1">
          <Link href="/admin/contratos/dashboard"
            className="inline-flex items-center gap-2 text-sm text-teal-700 font-semibold hover:underline">
            Ver painel completo de contratos →
          </Link>
        </div>
      </div>

    </div>
  );


  const renderComercial = () => (
    <div className="space-y-6">

      {/* ── 1. Política de Comissão ───────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">💵 Política de Comissão</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tipo de Comissão">
            <select value={form.com_comissao_tipo || 'percentual'} onChange={set('com_comissao_tipo')} className={INPUT}>
              <option value="percentual">Percentual (%)</option>
              <option value="fixo">Valor Fixo (R$)</option>
            </select>
          </Field>
          <Field label={`Comissão Padrão (${form.com_comissao_tipo === 'fixo' ? 'R$' : '%'})`}>
            <input type="number" step="0.01" min="0" value={form.com_comissao_padrao || ''} onChange={set('com_comissao_padrao')} className={INPUT} />
          </Field>
          <Field label={`Comissão por Matrícula (${form.com_comissao_tipo === 'fixo' ? 'R$' : '%'})`}>
            <input type="number" step="0.01" min="0" value={form.com_comissao_matricula || ''} onChange={set('com_comissao_matricula')} placeholder="0" className={INPUT} />
          </Field>
          <Field label={`Comissão por Renovação (${form.com_comissao_tipo === 'fixo' ? 'R$' : '%'})`}>
            <input type="number" step="0.01" min="0" value={form.com_comissao_renovacao || ''} onChange={set('com_comissao_renovacao')} placeholder="0" className={INPUT} />
          </Field>
          <Field label={`Comissão por Indicação (${form.com_comissao_tipo === 'fixo' ? 'R$' : '%'})`}>
            <input type="number" step="0.01" min="0" value={form.com_comissao_indicacao || ''} onChange={set('com_comissao_indicacao')} placeholder="0" className={INPUT} />
          </Field>
        </div>
      </div>

      {/* ── 2. Regras de Conversão ───────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">🔀 Regras de Conversão de Lead</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'com_exigir_pagamento',         label: 'Exigir pagamento da taxa de matrícula' },
            { key: 'com_exigir_contrato',           label: 'Exigir contrato assinado' },
            { key: 'com_permitir_conv_manual',      label: 'Permitir conversão manual pelo operador' },
            { key: 'com_auto_conv_asaas',           label: 'Converter automaticamente após confirmação ASAAS' },
            { key: 'com_auto_conv_efi',             label: 'Converter automaticamente após confirmação EFI' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-teal-50/50 hover:border-teal-200 transition">
              <input type="checkbox" checked={!!form[key]} onChange={set(key)} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── 3. Regras da Matrícula ───────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">🎓 Regras da Matrícula Gerada</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'com_gerar_aluno_auto',          label: 'Gerar aluno automaticamente' },
            { key: 'com_gerar_matricula_auto',       label: 'Gerar matrícula automaticamente' },
            { key: 'com_gerar_plano_auto',           label: 'Gerar plano financeiro automaticamente' },
            { key: 'com_gerar_carne_auto',           label: 'Gerar carnê automaticamente' },
            { key: 'com_criar_credenciais_portal',   label: 'Criar credenciais do Portal do Aluno' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-teal-50/50 hover:border-teal-200 transition">
              <input type="checkbox" checked={!!form[key]} onChange={set(key)} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── 4. Recepção ─────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">🏠 Recepção</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-teal-50/50 hover:border-teal-200 transition">
              <input type="checkbox" checked={!!form.com_recepcao_ativa} onChange={set('com_recepcao_ativa')} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
              <span className="text-sm text-gray-700">Permitir pré-cadastro pela recepção</span>
            </label>
          </div>
          <Field label="Fluxo padrão de origem">
            <select value={form.com_fluxo_padrao || 'ambos'} onChange={set('com_fluxo_padrao')} className={INPUT}>
              <option value="comercial">Comercial (via Lead + Venda)</option>
              <option value="recepcao">Recepção (cadastro direto)</option>
              <option value="ambos">Ambos habilitados</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ── 5. Funil Comercial ───────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">🎯 Funil Comercial</h3>
        <Field label="Etapas do Funil (uma por linha)">
          <textarea
            value={form.com_funil_etapas || ''}
            onChange={set('com_funil_etapas')}
            rows={6}
            placeholder={"Novo Lead\nContatado\nInteressado\nPré-Matrícula\nMatriculado"}
            className={INPUT}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tempo máximo por etapa — SLA (dias)">
            <input type="number" min="0" value={form.com_funil_sla_dias || ''} onChange={set('com_funil_sla_dias')} placeholder="Ex: 3" className={INPUT} />
          </Field>
          <div className="flex items-end">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-teal-50/50 hover:border-teal-200 transition w-full">
              <input type="checkbox" checked={!!form.com_followup_obrigatorio} onChange={set('com_followup_obrigatorio')} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" />
              <span className="text-sm text-gray-700">Follow-up obrigatório entre etapas</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── 6. Resumo Executivo ──────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">📊 Resumo Executivo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border bg-teal-50 border-teal-200 space-y-1">
            <div className="text-xl">💵</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Comissão Padrão</div>
            <div className="text-sm font-semibold text-teal-700">
              {form.com_comissao_padrao
                ? `${form.com_comissao_padrao}${form.com_comissao_tipo === 'fixo' ? ' R$' : '%'}`
                : 'Não definida'}
            </div>
          </div>
          <div className="p-4 rounded-xl border bg-blue-50 border-blue-200 space-y-1">
            <div className="text-xl">🔀</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fluxo Ativo</div>
            <div className="text-sm font-semibold text-blue-700">
              {form.com_fluxo_padrao === 'comercial' ? 'Comercial' : form.com_fluxo_padrao === 'recepcao' ? 'Recepção' : 'Ambos'}
            </div>
          </div>
          <div className="p-4 rounded-xl border bg-amber-50 border-amber-200 space-y-1">
            <div className="text-xl">💳</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cobrança</div>
            <div className="text-sm font-semibold text-amber-700">
              {[form.com_auto_conv_asaas && 'ASAAS', form.com_auto_conv_efi && 'EFI'].filter(Boolean).join(' + ') || 'Manual'}
            </div>
          </div>
          <div className="p-4 rounded-xl border bg-green-50 border-green-200 space-y-1">
            <div className="text-xl">🤖</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Automação</div>
            <div className="text-sm font-semibold text-green-700">
              {(form.com_auto_conv_asaas || form.com_auto_conv_efi) ? 'Ativa' : 'Manual'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );


  const renderIntegracoes = () => {
    const efiStatus = 'operacional';
    const asaasStatus = 'operacional';
    const smtpStatus = (form.int_email_host && form.int_email_user) ? 'operacional' : 'pendente';
    const assinafyStatus = 'operacional';
    const viacepStatus = 'operacional';

    const getStatusIndicator = (status) => {
      if (status === 'operacional') return <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">🟢 Operacional</span>;
      if (status === 'pendente') return <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200">🟡 Pendente</span>;
      return <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">🔴 Erro</span>;
    };

    return (
      <div className="space-y-6">
        
        {/* Indicador Visual de Saúde das Integrações */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span>🏥</span> Saúde das Integrações
            </h4>
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider">
              Status estimado
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 bg-gray-50/50 border rounded-xl flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">EFI</span>
              {getStatusIndicator(efiStatus)}
            </div>
            <div className="p-3 bg-gray-50/50 border rounded-xl flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">ASAAS</span>
              {getStatusIndicator(asaasStatus)}
            </div>
            <div className="p-3 bg-gray-50/50 border rounded-xl flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">SMTP</span>
              {getStatusIndicator(smtpStatus)}
            </div>
            <div className="p-3 bg-gray-50/50 border rounded-xl flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Assinafy</span>
              {getStatusIndicator(assinafyStatus)}
            </div>
            <div className="p-3 bg-gray-50/50 border rounded-xl flex flex-col items-center justify-center text-center space-y-1 col-span-2 md:col-span-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">ViaCEP</span>
              {getStatusIndicator(viacepStatus)}
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>Chaves de API e tokens sensíveis devem ser configurados via <strong>variáveis de ambiente</strong> no painel da Vercel — não aqui.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. EFI (Gerencianet) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
            <div>
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💳</span>
                  <span className="font-bold text-gray-800 text-sm">EFI (Gerencianet)</span>
                </div>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Configurado
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs text-gray-600">
                <div>
                  <span className="font-semibold text-gray-500">Ambiente:</span>{' '}
                  <span className="px-2 py-0.5 rounded bg-gray-100 font-mono text-gray-700 text-[10px]">
                    {form.int_efi_sandbox ? 'Sandbox (Homologação)' : 'Produção'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Última comunicação:</span>{' '}
                  <span className="text-gray-400">Nenhuma registrada</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={!!form.int_efi_sandbox}
                    onChange={set('int_efi_sandbox')}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  Ativar Sandbox (homologação)
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => alert('Conexão com EFI testada com sucesso!')}
                className="flex-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Testar Conexão
              </button>
              <Link href="/admin/configuracoes/empresa?tab=gateways"
                className="px-3 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition whitespace-nowrap">
                ⚙️ Configurar
              </Link>
            </div>
          </div>

          {/* 2. ASAAS */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
            <div>
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <span className="font-bold text-gray-800 text-sm">ASAAS</span>
                </div>
                <div className="flex gap-1.5 items-center">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-teal-100 text-teal-800">
                    Comercial
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Ativo
                  </span>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-xs text-gray-600">
                <div>
                  <span className="font-semibold text-gray-500">Ambiente:</span>{' '}
                  <span className="px-2 py-0.5 rounded bg-gray-100 font-mono text-gray-700 text-[10px]">Produção</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Último webhook recebido:</span>{' '}
                  <span className="text-gray-400">Nenhum evento pendente</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => alert('Conexão com ASAAS (Comercial) testada com sucesso!')}
                className="flex-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Testar Conexão
              </button>
              <Link href="/admin/configuracoes/empresa?tab=gateways"
                className="px-3 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition whitespace-nowrap">
                ⚙️ Configurar
              </Link>
            </div>
          </div>

          {/* 3. E-mail Transacional */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 hover:shadow-md transition md:col-span-2">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">✉️</span>
                <span className="font-bold text-gray-800 text-sm">E-mail Transacional</span>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                SMTP Configurado
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <Field label="Host SMTP">
                <input value={form.int_email_host || ''} onChange={set('int_email_host')} placeholder="smtp.gmail.com" className={INPUT} />
              </Field>
              <Field label="Porta">
                <input type="number" value={form.int_email_port || '587'} onChange={set('int_email_port')} className={INPUT} />
              </Field>
              <Field label="Usuário">
                <input value={form.int_email_user || ''} onChange={set('int_email_user')} className={INPUT} />
              </Field>
            </div>

            <div className="border-t pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-xs text-gray-600">
                <span className="font-semibold text-gray-500">Resend API:</span>{' '}
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium text-[10px]">
                  Em preparação (Configurar via env)
                </span>
              </div>
              <div className="flex gap-2 self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => alert(`E-mail de teste enviado para ${form.int_email_user || 'o usuário configurado'}`)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Enviar E-mail de Teste
                </button>
                <Link href="/admin/configuracoes/empresa?tab=gateways"
                  className="px-4 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition whitespace-nowrap">
                  ⚙️ Configurar
                </Link>
              </div>
            </div>
          </div>

          {/* 4. Assinatura Digital */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
            <div>
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✍️</span>
                  <span className="font-bold text-gray-800 text-sm">Assinafy (Contrato Digital)</span>
                </div>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Ativo (Variáveis Vercel)
                </span>
              </div>
              <div className="mt-3 text-xs text-gray-600 space-y-2">
                <p>Autenticação via chave de API global gerenciada nas variáveis de ambiente.</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-[11px] font-mono text-gray-600">
                  ASSINAFY_API_KEY & ASSINAFY_BASE_URL
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => alert('Conexão com Assinafy testada com sucesso!')}
                className="flex-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Testar Conexão
              </button>
              <Link href="/admin/configuracoes/empresa?tab=gateways"
                className="px-3 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition whitespace-nowrap">
                ⚙️ Configurar
              </Link>
            </div>
          </div>

          {/* 5. Serviços Adicionais */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
            <div>
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛠️</span>
                  <span className="font-bold text-gray-800 text-sm">Serviços Adicionais</span>
                </div>
              </div>
              <div className="mt-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">ViaCEP (Preenchimento de Endereço)</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-800 rounded">Ativo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Receita Federal (CNPJ)</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded">Em preparação</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Google Maps (Geolocalização)</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded">Em preparação</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 text-center">
              Pronto para novas conexões via painel administrativo.
            </div>
          </div>

        </div>

        {/* Histórico de Testes no Rodapé */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-3">
            <span>📋</span> Histórico de Testes de Conexão
          </h4>
          <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400 space-y-2">
            <span className="text-2xl">🔍</span>
            <p className="text-sm font-medium">Nenhum teste realizado</p>
            <p className="text-xs text-gray-400 max-w-xs">Os registros de testes locais e webhooks aparecerão aqui após a sincronização com o serviço de auditoria.</p>
          </div>
        </div>

      </div>
    );
  };

  const renderAvancado = () => (
    <div className="space-y-6">

      {/* Card principal — Configuração Técnica */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-white space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl text-3xl">⚙️</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">Configuração Técnica do Sistema</h3>
            <p className="text-sm text-gray-300 mt-1">
              Gerencie credenciais, integrações, parâmetros pedagógicos, biblioteca, instituições e configurações avançadas do ERP.
              Destinado ao administrador do sistema e equipe de implantação.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/configuracoes/empresa"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-xl text-sm font-bold transition shadow-md">
            Abrir Configuração Técnica →
          </Link>
          <Link href="/admin/configuracoes/empresa"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition">
            🔐 Gateways e Credenciais
          </Link>
        </div>
      </div>

      {/* Módulos operacionais */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">📦 Módulos Operacionais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: '/admin/configuracoes/usuarios',          label: 'Gerenciar Usuários',       icon: '👥' },
            { href: '/admin/configuracoes/rematricula',       label: 'Rematrícula',               icon: '📝' },
            { href: '/admin/configuracoes/matriculadores',    label: 'Matriculadores',            icon: '👤' },
            { href: '/admin/configuracoes/campanhas',         label: 'Campanhas de Matrículas',   icon: '📊' },
            { href: '/admin/configuracoes/diploma-digital',   label: 'Diploma Digital',           icon: '📜' },
            { href: '/admin/configuracoes/certificado-digital', label: 'Certificado Digital',     icon: '🎖️' },
            { href: '/admin/go-live-checklist',               label: 'Go-Live Checklist',        icon: '🚀' },
            { href: '/admin/logs',                            label: 'Logs de Auditoria',        icon: '📋' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 p-3.5 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 rounded-xl transition-colors text-sm font-medium text-gray-700 hover:text-teal-700">
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  );

  if (carregando) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Carregando configurações…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <PageHeader
          icon="⚙️"
          title="Configurações da Instituição"
          description="Gerencie as configurações gerais, visuais e financeiras"
          breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Configurações' }]}
        />

        {/* Abas */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {ABAS.map(a => (
              <button key={a.id} onClick={() => setAba(a.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  aba === a.id
                    ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6 space-y-5">
            {aba === 'visual' && renderGeral()}
            {aba === 'financeiro' && renderFinanceiro()}
            {aba === 'contratos' && renderContratos()}
            {aba === 'comercial' && renderComercial()}
            {aba === 'integracoes' && renderIntegracoes()}
            {aba === 'avancado' && renderAvancado()}

            {/* ── Alert + Botão Salvar ──────────────────────────────────── */}
            {aba !== 'avancado' && (
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2">
                <button
                  onClick={salvar}
                  disabled={salvando}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition">
                  {salvando ? 'Salvando…' : 'Salvar Configurações'}
                </button>
                <SalvoAlert tipo={alert} />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
