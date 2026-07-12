import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';

const ABAS = [
  { id: 'visual',       icon: '🎨', label: 'Visual' },
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
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Identidade Visual</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nome da Instituição *">
          <input value={form.nomeEmpresa || ''} onChange={set('nomeEmpresa')} className={INPUT} />
        </Field>
        <Field label="Razão Social">
          <input value={form.razaoSocial || ''} onChange={set('razaoSocial')} className={INPUT} />
        </Field>
        <Field label="CNPJ">
          <input value={form.cnpj || ''} onChange={set('cnpj')} placeholder="00.000.000/0001-00" className={INPUT} />
        </Field>
        <Field label="Website">
          <input value={form.website || ''} onChange={set('website')} placeholder="https://..." className={INPUT} />
        </Field>
        <Field label="URL do Logo">
          <input value={form.logo || ''} onChange={set('logo')} placeholder="https://... ou /logo.png" className={INPUT} />
        </Field>
        {form.logo && (
          <div className="flex items-center gap-3">
            <img src={form.logo} alt="Logo" className="h-12 object-contain border rounded-lg p-1 bg-gray-50" />
            <p className="text-xs text-gray-400">Pré-visualização</p>
          </div>
        )}
      </div>
      <Field label="Descrição / Slogan">
        <textarea value={form.descricao || ''} onChange={set('descricao')} rows={2} className={INPUT} />
      </Field>

      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide pt-2">Contato</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="E-mail Institucional">
          <input type="email" value={form.email || ''} onChange={set('email')} className={INPUT} />
        </Field>
        <Field label="Telefone">
          <input value={form.telefone || ''} onChange={set('telefone')} className={INPUT} />
        </Field>
        <Field label="WhatsApp de Contato">
          <input value={form.contatoWhatsapp || ''} onChange={set('contatoWhatsapp')} placeholder="5511999999999" className={INPUT} />
        </Field>
        <Field label="DDD Padrão">
          <input value={form.ddd || ''} onChange={set('ddd')} maxLength={2} placeholder="11" className={INPUT} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={!!form.exibirWhatsappAluno} onChange={set('exibirWhatsappAluno')} className="rounded" />
        Exibir WhatsApp de contato no portal do aluno
      </label>

      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide pt-2">Endereço</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Endereço">
          <input value={form.endereco || ''} onChange={set('endereco')} className={INPUT} />
        </Field>
        <Field label="Cidade">
          <input value={form.cidade || ''} onChange={set('cidade')} className={INPUT} />
        </Field>
        <Field label="Estado (UF)">
          <input value={form.estado || ''} onChange={set('estado')} maxLength={2} placeholder="SP" className={INPUT} />
        </Field>
        <Field label="CEP">
          <input value={form.cep || ''} onChange={set('cep')} placeholder="00000-000" className={INPUT} />
        </Field>
      </div>
    </div>
  );

  const renderFinanceiro = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Dados Bancários / Boleto</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Banco">
          <input value={form.fin_banco || ''} onChange={set('fin_banco')} placeholder="Ex: Banco do Brasil" className={INPUT} />
        </Field>
        <Field label="Agência">
          <input value={form.fin_agencia || ''} onChange={set('fin_agencia')} className={INPUT} />
        </Field>
        <Field label="Conta Corrente">
          <input value={form.fin_conta || ''} onChange={set('fin_conta')} className={INPUT} />
        </Field>
        <Field label="Chave PIX">
          <input value={form.fin_pix || ''} onChange={set('fin_pix')} className={INPUT} />
        </Field>
      </div>

      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide pt-2">Regras de Cobrança</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Vencimento do Boleto (dia)">
          <input type="number" min="1" max="28" value={form.fin_boleto_venc || ''} onChange={set('fin_boleto_venc')} className={INPUT} />
        </Field>
        <Field label="Multa por Atraso (%)">
          <input type="number" step="0.1" min="0" max="10" value={form.fin_multa || ''} onChange={set('fin_multa')} className={INPUT} />
        </Field>
        <Field label="Juros ao Mês (%)">
          <input type="number" step="0.1" min="0" max="5" value={form.fin_juros || ''} onChange={set('fin_juros')} className={INPUT} />
        </Field>
      </div>
    </div>
  );

  const renderContratos = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Assinatura Institucional</h3>
      <Field label="Assinatura / Rodapé do Contrato">
        <textarea value={form.cont_assinatura || ''} onChange={set('cont_assinatura')} rows={3}
          placeholder="Nome do responsável, cargo, cidade/data…" className={INPUT} />
      </Field>
      <Field label="Validade do Link de Assinatura (dias)">
        <input type="number" min="1" max="365" value={form.cont_validade || '30'} onChange={set('cont_validade')} className={`${INPUT} max-w-[200px]`} />
      </Field>
      <Field label="Modelo padrão de contrato">
        <select value={form.cont_modelo || ''} onChange={set('cont_modelo')} className={INPUT}>
          <option value="">— Padrão do sistema —</option>
          <option value="basico">Básico</option>
          <option value="completo">Completo com cláusulas LGPD</option>
          <option value="customizado">Customizado (ver empresa.js)</option>
        </select>
      </Field>

      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-800">
        <p className="font-semibold mb-1">📄 Gerenciamento de Contratos</p>
        <p>Acesse o <Link href="/admin/contratos" className="underline font-semibold">módulo de Contratos</Link> para gerar, enviar e monitorar assinaturas individuais.</p>
      </div>
    </div>
  );

  const renderComercial = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Regras de Comissão</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Comissão Padrão">
          <input type="number" step="0.01" min="0" value={form.com_comissao_padrao || ''} onChange={set('com_comissao_padrao')} className={INPUT} />
        </Field>
        <Field label="Tipo de Comissão">
          <select value={form.com_comissao_tipo || 'percentual'} onChange={set('com_comissao_tipo')} className={INPUT}>
            <option value="percentual">Percentual (%)</option>
            <option value="fixo">Valor Fixo (R$)</option>
          </select>
        </Field>
      </div>
      <Field label="Etapas do Funil Comercial (uma por linha)">
        <textarea value={form.com_funil_etapas || ''} onChange={set('com_funil_etapas')} rows={5}
          placeholder="Novo Lead&#10;Contatado&#10;Interessado&#10;Pré-Matrícula&#10;Matriculado" className={INPUT} />
      </Field>
    </div>
  );

  const renderIntegracoes = () => (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        ⚠️ Chaves de API e tokens sensíveis devem ser configurados via <strong>variáveis de ambiente</strong> no painel da Vercel — não aqui.
      </div>

      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Gerencianet / EFI (Boletos)</h3>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={!!form.int_efi_sandbox} onChange={set('int_efi_sandbox')} className="rounded" />
        Modo Sandbox (homologação) — desmarque em produção real
      </label>

      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide pt-2">E-mail Transacional (SMTP)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide pt-2">Assinafy (Contratos Digitais)</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        Configure <code className="text-xs bg-gray-200 px-1 rounded">ASSINAFY_API_KEY</code> e <code className="text-xs bg-gray-200 px-1 rounded">ASSINAFY_BASE_URL</code> nas variáveis de ambiente da Vercel.
      </div>
    </div>
  );

  const renderAvancado = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Módulos do Sistema</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { href: '/admin/configuracoes/empresa', label: 'Config. Empresa', icon: '🏢' },
          { href: '/admin/configuracoes/usuarios', label: 'Gerenciar Usuários', icon: '👥' },
          { href: '/admin/configuracoes/rematricula', label: 'Rematrícula', icon: '📝' },
          { href: '/admin/configuracoes/matriculadores', label: 'Matriculadores', icon: '👤' },
          { href: '/admin/configuracoes/campanhas', label: 'Campanhas de Matrículas', icon: '📊' },
          { href: '/admin/configuracoes/diploma-digital', label: 'Diploma Digital', icon: '📜' },
          { href: '/admin/configuracoes/certificado-digital', label: 'Certificado Digital', icon: '🎖️' },
          { href: '/admin/go-live-checklist', label: '🚀 Go-Live Checklist', icon: '✅' },
          { href: '/admin/logs', label: 'Logs de Auditoria', icon: '📋' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 p-3.5 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 rounded-xl transition-colors text-sm font-medium text-gray-700 hover:text-teal-700">
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </Link>
        ))}
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
