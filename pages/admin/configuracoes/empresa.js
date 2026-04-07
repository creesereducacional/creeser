import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/DashboardLayout';
import RichTextEditor from '../../../components/RichTextEditor';
import ConfirmModal from '../../../components/ConfirmModal';

const CONTRATO_PLACEHOLDERS = [
  '{{ALUNO_NOME}}',
  '{{ALUNO_CPF}}',
  '{{ALUNO_RG}}',
  '{{ALUNO_EMAIL}}',
  '{{ALUNO_TELEFONE}}',
  '{{ALUNO_DATA_NASCIMENTO}}',
  '{{ALUNO_NACIONALIDADE}}',
  '{{ALUNO_NATURALIDADE}}',
  '{{ALUNO_ESTADO_CIVIL}}',
  '{{ALUNO_PROFISSAO}}',
  '{{ALUNO_ENDERECO_RESIDENCIAL}}',
  '{{ALUNO_ENDERECO}}',
  '{{ALUNO_BAIRRO}}',
  '{{ALUNO_CIDADE}}',
  '{{ALUNO_CEP}}',
  '{{ALUNO_UF}}',
  '{{CURSO_NOME}}',
  '{{CURSO_CARGA_HORARIA}}',
  '{{TURMA_NOME}}',
  '{{VALOR_MENSALIDADE}}',
  '{{VALOR_MATRICULA}}',
  '{{QTD_PARCELAS}}',
  '{{DATA_INICIO_CURSO}}',
  '{{DATA_FIM_CURSO}}',
  '{{INSTITUICAO_NOME}}',
  '{{INSTITUICAO_CNPJ}}',
  '{{INSTITUICAO_ENDERECO}}',
  '{{RESPONSAVEL_NOME}}',
  '{{RESPONSAVEL_CPF}}',
  '{{DATA_ASSINATURA}}'
];

const createContratoInicial = () => ({
  nome: '',
  descricao: '',
  conteudoHtml: '',
  ativo: true,
  padrao: false,
  ordem: 0,
  placeholders: []
});

const extrairPlaceholders = (conteudo) => {
  const matches = String(conteudo || '').match(/\{\{[A-Z0-9_]+\}\}/g) || [];
  return [...new Set(matches)];
};

const resumirHtml = (html, max = 180) => {
  const texto = String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (texto.length <= max) return texto;
  return `${texto.slice(0, max)}...`;
};

export default function ConfiguracaoEmpresa() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('informacoes');
  const [formData, setFormData] = useState({
    nomeEmpresa: '',
    cnpj: '',
    razaoSocial: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    logo: '',
    website: '',
    descricao: '',
    faculdade: '',
    biografia: '',
    ddd: '',
    exibirWhatsappAluno: false,
    contatoWhatsapp: '',
    pedagogico: {
      coordenador: '',
      email: '',
      telefone: '',
      bloquearHistorico: false,
      bloquearDeclaracao: false,
      bloquearPortalContrato: false,
      casasDecimais: 0,
      idIESCenso: '',
      atividadeComplementarDisciplina: false,
      notasEscola: false,
      notaseFaltas: false,
      frequenciaV1: false,
      frequenciaV2: false
    },
    financeiro: {
      banco: '',
      agencia: '',
      conta: '',
      chave_pix: '',
      desativarFinanceiro: false,
      desativarJurosMulha: false,
      bloquearAlunoInadimplente: false,
      saldarVencimentoFinal: false,
      ativarRPSManual: false,
      ativarGerencianet: false,
      clientId: '',
      clientSecret: '',
      identificadorConta: '',
      aceitarCartaoGerencianet: false,
      jurosGerencianet: 0.033,
      multaGerencianet: 2.0,
      ativarAsaas: false,
      apiKeyAsaas: '',
      percentualJurosAsaas: 0.033,
      percentualMultaAsaas: 2.000,
      aceitarPagamentosCartaoAsaas: false,
      aceitarPagamentosPixAsaas: false,
      chavePix: ''
    },
    biblioteca: {
      gerente: '',
      email: '',
      acervo: 0,
      bloquearEmprestimoPendencia: false,
      qtdRenovacaoPorPessoa: 'ilimitada',
      qtdItensPorPessoa: 'ilimitada',
      qtdReservasPorPessoa: '3',
      diasVencimentoReserva: '2'
    },
  });

  const [loading, setLoading] = useState(false);
  const [instituicoes, setInstituicoes] = useState([]);
  const [loadingInstituicoes, setLoadingInstituicoes] = useState(false);
  const [formInstituicao, setFormInstituicao] = useState({
    nome: '',
    codMec: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    website: '',
    ativa: true,
    descricao: ''
  });
  const [editandoInstituicao, setEditandoInstituicao] = useState(null);
  const [instituicaoContratoId, setInstituicaoContratoId] = useState('');
  const [contratos, setContratos] = useState([]);
  const [loadingContratos, setLoadingContratos] = useState(false);
  const [salvandoContrato, setSalvandoContrato] = useState(false);
  const [formContrato, setFormContrato] = useState(createContratoInicial());
  const [editandoContrato, setEditandoContrato] = useState(null);
  const editorContratoRef = useRef(null);
  const confirmActionRef = useRef(null);
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm'
  });

  useEffect(() => {
    carregarDados();
    carregarInstituicoes();
  }, []);

  const carregarDados = async () => {
    try {
      const res = await fetch('/api/configuracoes/empresa');
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const carregarInstituicoes = async () => {
    setLoadingInstituicoes(true);
    try {
      const res = await fetch('/api/instituicoes');
      if (res.ok) {
        const data = await res.json();
        setInstituicoes(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar instituições:', error);
    } finally {
      setLoadingInstituicoes(false);
    }
  };

  useEffect(() => {
    if (!instituicoes || instituicoes.length === 0) {
      if (instituicaoContratoId) {
        setInstituicaoContratoId('');
      }
      return;
    }

    const existeSelecionada = instituicoes.some(inst => String(inst.id) === String(instituicaoContratoId));
    if (!instituicaoContratoId || !existeSelecionada) {
      setInstituicaoContratoId(String(instituicoes[0].id));
    }
  }, [instituicoes, instituicaoContratoId]);

  useEffect(() => {
    if (activeTab !== 'contratos') return;

    if (!instituicaoContratoId) {
      setContratos([]);
      return;
    }

    carregarContratos(instituicaoContratoId);
  }, [activeTab, instituicaoContratoId]);

  const mostrarFeedback = (message, type = 'alert', title = 'Aviso') => {
    setFeedbackModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const fecharFeedback = () => {
    setFeedbackModal(prev => ({ ...prev, isOpen: false }));
  };

  const abrirConfirmacao = (message, onConfirm, title = 'Confirmação', type = 'confirm') => {
    confirmActionRef.current = onConfirm;
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const fecharConfirmacao = () => {
    confirmActionRef.current = null;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const confirmarAcaoModal = async () => {
    const acao = confirmActionRef.current;
    fecharConfirmacao();

    if (typeof acao === 'function') {
      await acao();
    }
  };

  const carregarContratos = async (instituicaoId) => {
    setLoadingContratos(true);
    try {
      const res = await fetch(`/api/instituicoes/${instituicaoId}/contratos`);
      if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro?.error || 'Falha ao carregar modelos de contrato');
      }

      const data = await res.json();
      setContratos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      mostrarFeedback(error.message || 'Erro ao carregar contratos', 'error', 'Falha ao carregar');
    } finally {
      setLoadingContratos(false);
    }
  };

  const limparFormularioContrato = () => {
    setFormContrato(createContratoInicial());
    setEditandoContrato(null);
  };

  const handleChangeContrato = (e) => {
    const { name, value, type, checked } = e.target;
    setFormContrato(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const inserirPlaceholderNoContrato = (placeholder) => {
    if (editorContratoRef.current && typeof editorContratoRef.current.insertText === 'function') {
      editorContratoRef.current.insertText(placeholder);
      setFormContrato(prev => ({
        ...prev,
        placeholders: [...new Set([...(prev.placeholders || []), placeholder])]
      }));
      return;
    }

    setFormContrato(prev => {
      const conteudoAtual = String(prev.conteudoHtml || '');
      const separador = conteudoAtual && !conteudoAtual.endsWith(' ') ? ' ' : '';
      const novoConteudo = `${conteudoAtual}${separador}${placeholder}`;

      return {
        ...prev,
        conteudoHtml: novoConteudo,
        placeholders: [...new Set([...(prev.placeholders || []), placeholder])]
      };
    });
  };

  const editarContrato = (contrato) => {
    setEditandoContrato(contrato);
    setFormContrato({
      nome: contrato?.nome || '',
      descricao: contrato?.descricao || '',
      conteudoHtml: contrato?.conteudoHtml || contrato?.conteudo_html || '',
      ativo: contrato?.ativo !== false,
      padrao: contrato?.padrao === true,
      ordem: Number.isFinite(Number(contrato?.ordem)) ? Number(contrato.ordem) : 0,
      placeholders: Array.isArray(contrato?.placeholders) ? contrato.placeholders : []
    });
  };

  const salvarContrato = async () => {
    if (!instituicaoContratoId) {
      mostrarFeedback('Selecione uma instituição para configurar contratos', 'alert', 'Atenção');
      return;
    }

    if (!String(formContrato.nome || '').trim()) {
      mostrarFeedback('Informe o nome do modelo de contrato', 'alert', 'Atenção');
      return;
    }

    setSalvandoContrato(true);
    try {
      const payload = {
        nome: String(formContrato.nome || '').trim(),
        descricao: String(formContrato.descricao || '').trim() || null,
        conteudoHtml: formContrato.conteudoHtml || '',
        ativo: formContrato.ativo !== false,
        padrao: formContrato.padrao === true,
        ordem: Number.isFinite(Number(formContrato.ordem)) ? Number(formContrato.ordem) : 0,
        placeholders: extrairPlaceholders(formContrato.conteudoHtml || '')
      };

      const url = editandoContrato
        ? `/api/contratos/${editandoContrato.id}`
        : `/api/instituicoes/${instituicaoContratoId}/contratos`;

      const metodo = editandoContrato ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro?.error || 'Falha ao salvar modelo de contrato');
      }

      mostrarFeedback(
        editandoContrato ? 'Modelo atualizado com sucesso!' : 'Modelo criado com sucesso!',
        'success',
        'Tudo certo'
      );
      limparFormularioContrato();
      await carregarContratos(instituicaoContratoId);
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      mostrarFeedback(error.message || 'Erro ao salvar contrato', 'error', 'Falha ao salvar');
    } finally {
      setSalvandoContrato(false);
    }
  };

  const definirContratoPadrao = async (contratoId) => {
    try {
      const res = await fetch(`/api/contratos/${contratoId}/padrao`, {
        method: 'POST'
      });

      if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro?.error || 'Falha ao definir modelo padrão');
      }

      await carregarContratos(instituicaoContratoId);
    } catch (error) {
      console.error('Erro ao definir padrão:', error);
      mostrarFeedback(error.message || 'Erro ao definir padrão', 'error', 'Falha ao definir padrão');
    }
  };

  const deletarContrato = (contratoId) => {
    abrirConfirmacao(
      'Tem certeza que deseja deletar este modelo de contrato?',
      async () => {
        try {
          const res = await fetch(`/api/contratos/${contratoId}`, {
            method: 'DELETE'
          });

          if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro?.error || 'Falha ao deletar modelo de contrato');
          }

          if (editandoContrato && String(editandoContrato.id) === String(contratoId)) {
            limparFormularioContrato();
          }

          mostrarFeedback('Modelo de contrato deletado com sucesso.', 'success', 'Modelo removido');
          await carregarContratos(instituicaoContratoId);
        } catch (error) {
          console.error('Erro ao deletar contrato:', error);
          mostrarFeedback(error.message || 'Erro ao deletar contrato', 'error', 'Falha ao deletar');
        }
      },
      'Excluir modelo de contrato',
      'delete'
    );
  };

  const handleChangeInstituicao = (e) => {
    const { name, value, type, checked } = e.target;
    setFormInstituicao(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const salvarInstituicao = async () => {
    if (!formInstituicao.nome.trim()) {
      mostrarFeedback('Por favor, informe o nome da instituição', 'alert', 'Atenção');
      return;
    }

    try {
      const metodo = editandoInstituicao ? 'PUT' : 'POST';
      const url = editandoInstituicao 
        ? `/api/instituicoes/${editandoInstituicao.id}`
        : '/api/instituicoes';
      
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formInstituicao)
      });

      if (res.ok) {
        mostrarFeedback(
          editandoInstituicao ? 'Instituição atualizada!' : 'Instituição criada com sucesso!',
          'success',
          'Tudo certo'
        );
        setFormInstituicao({
          nome: '',
          codMec: '',
          cnpj: '',
          email: '',
          telefone: '',
          endereco: '',
          cidade: '',
          estado: '',
          cep: '',
          website: '',
          ativa: true,
          descricao: ''
        });
        setEditandoInstituicao(null);
        carregarInstituicoes();
      } else {
        mostrarFeedback('Erro ao salvar instituição', 'error', 'Falha ao salvar');
      }
    } catch (error) {
      console.error('Erro:', error);
      mostrarFeedback('Erro ao salvar instituição', 'error', 'Falha ao salvar');
    }
  };

  const editarInstituicao = (instituicao) => {
    setFormInstituicao({
      ...instituicao,
      codMec: instituicao.codMec || instituicao.cod_mec || ''
    });
    setEditandoInstituicao(instituicao);
  };

  const deletarInstituicao = (id) => {
    abrirConfirmacao(
      'Tem certeza que deseja deletar esta instituição?',
      async () => {
        try {
          const res = await fetch(`/api/instituicoes/${id}`, {
            method: 'DELETE'
          });

          if (res.ok) {
            mostrarFeedback('Instituição deletada com sucesso!', 'success', 'Instituição removida');
            carregarInstituicoes();
          } else {
            mostrarFeedback('Erro ao deletar instituição', 'error', 'Falha ao deletar');
          }
        } catch (error) {
          console.error('Erro:', error);
          mostrarFeedback('Erro ao deletar instituição', 'error', 'Falha ao deletar');
        }
      },
      'Excluir instituição',
      'delete'
    );
  };

  const cancelarEdicaoInstituicao = () => {
    setFormInstituicao({
      nome: '',
      codMec: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      website: '',
      ativa: true,
      descricao: ''
    });
    setEditandoInstituicao(null);
  };

  const aplicarFormatacao = (tipo) => {
    const textarea = document.getElementById('biografia-editor');
    const inicio = textarea.selectionStart;
    const fim = textarea.selectionEnd;
    const texto = formData.biografia || '';
    const selecionado = texto.substring(inicio, fim);

    let novoTexto = texto;
    let novaSelecao = { inicio, fim };

    if (!selecionado) {
      // Se nada está selecionado, insere um placeholder
      switch(tipo) {
        case 'negrito':
          novoTexto = texto.substring(0, inicio) + '**texto em negrito**' + texto.substring(fim);
          novaSelecao.fim = inicio + 20;
          break;
        case 'italico':
          novoTexto = texto.substring(0, inicio) + '*texto em itálico*' + texto.substring(fim);
          novaSelecao.fim = inicio + 18;
          break;
        case 'sublinhado':
          novoTexto = texto.substring(0, inicio) + '__texto sublinhado__' + texto.substring(fim);
          novaSelecao.fim = inicio + 20;
          break;
        case 'listaOrderada':
          novoTexto = texto.substring(0, inicio) + '1. Item 1\n2. Item 2\n3. Item 3' + texto.substring(fim);
          novaSelecao.fim = inicio + 29;
          break;
        case 'listaNaoOrdenada':
          novoTexto = texto.substring(0, inicio) + '• Item 1\n• Item 2\n• Item 3' + texto.substring(fim);
          novaSelecao.fim = inicio + 26;
          break;
        case 'h1':
          novoTexto = texto.substring(0, inicio) + '# Título 1' + texto.substring(fim);
          novaSelecao.fim = inicio + 10;
          break;
        case 'h2':
          novoTexto = texto.substring(0, inicio) + '## Título 2' + texto.substring(fim);
          novaSelecao.fim = inicio + 11;
          break;
        case 'h3':
          novoTexto = texto.substring(0, inicio) + '### Título 3' + texto.substring(fim);
          novaSelecao.fim = inicio + 12;
          break;
        case 'alinhadorAesquerda':
          novoTexto = texto.substring(0, inicio) + '[esq]Texto alinhado à esquerda[/esq]' + texto.substring(fim);
          novaSelecao.fim = inicio + 35;
          break;
        case 'alinhadoCentro':
          novoTexto = texto.substring(0, inicio) + '[centro]Texto centralizado[/centro]' + texto.substring(fim);
          novaSelecao.fim = inicio + 34;
          break;
        case 'alinhadorAdireita':
          novoTexto = texto.substring(0, inicio) + '[dir]Texto alinhado à direita[/dir]' + texto.substring(fim);
          novaSelecao.fim = inicio + 33;
          break;
        case 'limpar':
          novoTexto = '';
          novaSelecao = { inicio: 0, fim: 0 };
          break;
        default:
          return;
      }
    } else {
      // Se há seleção, aplica formatação
      switch(tipo) {
        case 'negrito':
          novoTexto = texto.substring(0, inicio) + '**' + selecionado + '**' + texto.substring(fim);
          novaSelecao.fim = fim + 4;
          break;
        case 'italico':
          novoTexto = texto.substring(0, inicio) + '*' + selecionado + '*' + texto.substring(fim);
          novaSelecao.fim = fim + 2;
          break;
        case 'sublinhado':
          novoTexto = texto.substring(0, inicio) + '__' + selecionado + '__' + texto.substring(fim);
          novaSelecao.fim = fim + 4;
          break;
        case 'h1':
          novoTexto = texto.substring(0, inicio) + '# ' + selecionado + texto.substring(fim);
          novaSelecao.fim = fim + 2;
          break;
        case 'h2':
          novoTexto = texto.substring(0, inicio) + '## ' + selecionado + texto.substring(fim);
          novaSelecao.fim = fim + 3;
          break;
        case 'h3':
          novoTexto = texto.substring(0, inicio) + '### ' + selecionado + texto.substring(fim);
          novaSelecao.fim = fim + 4;
          break;
        case 'limpar':
          novoTexto = '';
          novaSelecao = { inicio: 0, fim: 0 };
          break;
        default:
          return;
      }
    }

    setFormData(prev => ({
      ...prev,
      biografia: novoTexto
    }));

    // Restaura a seleção após atualizar o estado
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(novaSelecao.inicio, novaSelecao.fim);
    }, 0);
  };

  const handleChange = (e, section = null) => {
    const { name, value } = e.target;
    if (section) {
      setFormData(prev => {
        // Garantir que a seção existe
        const sectionData = prev[section] || {};
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [name]: value
          }
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/configuracoes/empresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        mostrarFeedback('Configurações salvas com sucesso', 'success', 'Tudo certo');
      } else {
        mostrarFeedback('Erro ao salvar configurações', 'error', 'Falha ao salvar');
      }
    } catch (error) {
      console.error('Erro:', error);
      mostrarFeedback('Erro ao salvar configurações', 'error', 'Falha ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const abas = [
    { id: 'informacoes', nome: 'Informações', icon: '📋' },
    { id: 'pedagogico', nome: 'Pedagógico', icon: '📚' },
    { id: 'financeiro', nome: 'Financeiro', icon: '💰' },
    { id: 'biblioteca', nome: 'Biblioteca', icon: '📖' },
    { id: 'contratos', nome: 'Contratos', icon: '📝' },
    { id: 'instituicoes', nome: 'Instituições', icon: '🏫' }
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Configuração da Empresa</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Abas */}
          <div className="bg-white rounded-t-lg shadow-md border-b border-gray-200 overflow-x-auto">
            <div className="flex gap-0 min-w-max md:min-w-full">
              {abas.map((aba) => (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => setActiveTab(aba.id)}
                  className={`px-4 py-3 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
                    activeTab === aba.id
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-600 hover:text-teal-600'
                  }`}
                >
                  {aba.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo das Abas */}
          <div className="bg-white rounded-b-lg shadow-md p-4 md:p-6 space-y-6">
            {/* ABA: INFORMAÇÕES */}
            {activeTab === 'informacoes' && (
              <>
                <h3 className="text-sm font-bold text-teal-600">📋 Informações Básicas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">NOME DA EMPRESA *</label>
                    <input
                      type="text"
                      name="nomeEmpresa"
                      value={formData.nomeEmpresa}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">RAZÃO SOCIAL *</label>
                    <input
                      type="text"
                      name="razaoSocial"
                      value={formData.razaoSocial}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">CNPJ *</label>
                    <input
                      type="text"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleChange}
                      placeholder="00.000.000/0000-00"
                      required
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">WEBSITE</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-teal-600 mb-4">🏷️ Logo</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">LOGO</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => setFormData(prev => ({ ...prev, logo: ev.target.result }));
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">PRÉ-VISUALIZAÇÃO</label>
                      <div className="w-full h-20 border border-teal-300 rounded-lg bg-teal-50 flex items-center justify-center overflow-hidden">
                        {formData.logo ? (
                          <img src={formData.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-xs text-gray-400">Nenhuma logo carregada</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-teal-600 mb-4">📞 Contato</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">EMAIL *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">TELEFONE *</label>
                      <input
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-teal-600 mb-4">📍 Endereço</h3>
                  
                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">ENDEREÇO COMPLETO *</label>
                    <input
                      type="text"
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50 mb-4"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">CIDADE *</label>
                      <input
                        type="text"
                        name="cidade"
                        value={formData.cidade}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">ESTADO *</label>
                      <select
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      >
                        <option value="">- ESCOLHA -</option>
                        <option value="AC">AC</option>
                        <option value="AL">AL</option>
                        <option value="AP">AP</option>
                        <option value="AM">AM</option>
                        <option value="BA">BA</option>
                        <option value="CE">CE</option>
                        <option value="DF">DF</option>
                        <option value="ES">ES</option>
                        <option value="GO">GO</option>
                        <option value="MA">MA</option>
                        <option value="MT">MT</option>
                        <option value="MS">MS</option>
                        <option value="MG">MG</option>
                        <option value="PA">PA</option>
                        <option value="PB">PB</option>
                        <option value="PR">PR</option>
                        <option value="PE">PE</option>
                        <option value="PI">PI</option>
                        <option value="RJ">RJ</option>
                        <option value="RN">RN</option>
                        <option value="RS">RS</option>
                        <option value="RO">RO</option>
                        <option value="RR">RR</option>
                        <option value="SC">SC</option>
                        <option value="SP">SP</option>
                        <option value="SE">SE</option>
                        <option value="TO">TO</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">CEP *</label>
                      <input
                        type="text"
                        name="cep"
                        value={formData.cep}
                        onChange={handleChange}
                        placeholder="00000-000"
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-teal-600 mb-4">📱 Página Inicial do Portal do Aluno</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">NOME DA EMPRESA</label>
                      <input
                        type="text"
                        value={formData.nomeEmpresa}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">FACULDADE</label>
                      <input
                        type="text"
                        name="faculdade"
                        value={formData.faculdade || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-teal-600 mb-4">✍️ Biografia</h3>
                  
                  <div className="border border-teal-300 rounded-lg overflow-hidden">
                    {/* Barra de Formatação */}
                    <div className="bg-blue-50 border-b border-teal-300 p-2 flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => aplicarFormatacao('negrito')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold text-sm"
                        title="Negrito (Ctrl+B)"
                      >
                        B
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => aplicarFormatacao('italico')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 italic text-sm"
                        title="Itálico (Ctrl+I)"
                      >
                        I
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => aplicarFormatacao('sublinhado')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 underline text-sm"
                        title="Sublinhado (Ctrl+U)"
                      >
                        U
                      </button>

                      <div className="border-l border-gray-300 mx-1"></div>

                      <button
                        type="button"
                        onClick={() => aplicarFormatacao('listaOrderada')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
                        title="Lista Ordenada"
                      >
                        1️⃣
                      </button>

                      <button
                        type="button"
                        onClick={() => aplicarFormatacao('listaNaoOrdenada')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
                        title="Lista com Marcadores"
                      >
                        • 
                      </button>

                      <div className="border-l border-gray-300 mx-1"></div>

                      <button
                        type="button"
                        onClick={() => aplicarFormatacao('h1')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold text-sm"
                        title="Título 1"
                      >
                        H1
                      </button>

                      <button
                        type="button"
                        onClick={() => aplicarFormatacao('h2')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold text-sm"
                        title="Título 2"
                      >
                        H2
                      </button>

                      <button
                        type="button"
                        onClick={() => aplicarFormatacao('h3')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold text-sm"
                        title="Título 3"
                      >
                        H3
                      </button>

                      <div className="border-l border-gray-300 mx-1"></div>

                      <button
                        type="button"
                        onClick={() => aplicarFormatacao('alinhadorAesquerda')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
                        title="Alinhar à Esquerda"
                      >
                        ⬅️
                      </button>

                      <button
                        type="button"
                        onClick={() => aplicarFormatacao('alinhadoCentro')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
                        title="Alinhar ao Centro"
                      >
                        ⬍
                      </button>

                      <button
                        type="button"
                        onClick={() => aplicarFormatacao('alinhadorAdireita')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
                        title="Alinhar à Direita"
                      >
                        ➡️
                      </button>

                      <div className="border-l border-gray-300 mx-1"></div>

                      <button
                        type="button"
                        onClick={() => aplicarFormatacao('limpar')}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-red-100 text-sm text-red-600"
                        title="Limpar Formatação"
                      >
                        ✖️
                      </button>
                    </div>

                    {/* Textarea */}
                    <textarea
                      id="biografia-editor"
                      name="biografia"
                      value={formData.biografia || ''}
                      onChange={handleChange}
                      placeholder="Digite aqui a biografia da instituição..."
                      rows="8"
                      className="w-full px-3 py-2 text-sm border-0 focus:outline-none bg-teal-50 resize-none font-family-mono"
                    />
                  </div>

                  <div className="text-xs text-gray-500 mt-2 flex gap-2">
                    <span>ℹ️</span>
                    <span>Use a barra de formatação acima para estilizar o texto. A formatação será exibida corretamente no portal do aluno.</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-teal-600 mb-4">📞 WhatsApp</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">DDD</label>
                      <input
                        type="text"
                        name="ddd"
                        value={formData.ddd || ''}
                        onChange={handleChange}
                        placeholder="Ex: 83"
                        maxLength="2"
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        ℹ️ Informe o número com o DDD. Ex: (83) 99688-2222 ou 83996882222
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.exibirWhatsappAluno || false}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            exibirWhatsappAluno: e.target.checked
                          }))}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium text-gray-800">Exibir contato WhatsApp para Aluno?</span>
                      </label>
                    </div>

                    {formData.exibirWhatsappAluno && (
                      <div>
                        <label className="text-xs font-medium text-teal-600 mb-1 block">CONTATO WHATSAPP PARA ALUNO</label>
                        <input
                          type="tel"
                          name="contatoWhatsapp"
                          value={formData.contatoWhatsapp || ''}
                          onChange={handleChange}
                          placeholder="(00) 00000-0000"
                          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ABA: PEDAGÓGICO */}
            {activeTab === 'pedagogico' && (
              <>
                <h3 className="text-sm font-bold text-teal-600">📚 Coordenador Pedagógico</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">COORDENADOR *</label>
                    <input
                      type="text"
                      name="coordenador"
                      value={formData?.pedagogico?.coordenador || ''}
                      onChange={(e) => handleChange(e, 'pedagogico')}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">EMAIL</label>
                    <input
                      type="email"
                      name="email"
                      value={formData?.pedagogico?.email || ''}
                      onChange={(e) => handleChange(e, 'pedagogico')}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-teal-600 mb-1 block">TELEFONE</label>
                    <input
                      type="tel"
                      name="telefone"
                      value={formData?.pedagogico?.telefone || ''}
                      onChange={(e) => handleChange(e, 'pedagogico')}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <h3 className="text-sm font-bold text-teal-600 mb-4">⚙️ Configurações do Portal</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.pedagogico?.bloquearHistorico || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pedagogico: {
                            ...(prev.pedagogico || {}),
                            bloquearHistorico: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Bloquear Emissão de Histórico no Portal do Aluno?</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.pedagogico?.bloquearDeclaracao || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pedagogico: {
                            ...(prev.pedagogico || {}),
                            bloquearDeclaracao: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Bloquear Emissão de Declaração no Portal do Aluno?</span>
                    </label>
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                    <input
                      type="checkbox"
                      checked={formData?.pedagogico?.bloquearPortalContrato || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pedagogico: {
                          ...(prev.pedagogico || {}),
                          bloquearPortalContrato: e.target.checked
                        }
                      }))}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium text-gray-800">Bloquear Portal do Aluno que não assinaram Contrato Digital?</span>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">QUANT. DE CASAS DECIMAIS PARA NOTAS</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData?.pedagogico?.casasDecimais || 0}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pedagogico: {
                            ...(prev.pedagogico || {}),
                            casasDecimais: parseInt(e.target.value)
                          }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">ID DA IES NO CENSO</label>
                      <input
                        type="text"
                        value={formData?.pedagogico?.idIESCenso || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pedagogico: {
                            ...(prev.pedagogico || {}),
                            idIESCenso: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                    <h4 className="text-xs font-bold text-yellow-800 mb-2">💡 DICA</h4>
                    <p className="text-xs text-yellow-700">
                      Ao marcar a opção <strong>Atividade Complementar Como Disciplinas</strong>, você poderá criar disciplinas do tipo <strong>Atividade Complementar</strong>, podendo assim, após o diferimento dos certificados enviados pelos alunos, integralizar as horas deferidas nas respectivas disciplinas.
                    </p>
                    <p className="text-xs text-yellow-700 mt-2">
                      <strong>Ao desmarcar esta opção</strong>, as horas deferidas através dos certificados enviados, serão armazenadas em sua totalidade, na matrícula do aluno.
                    </p>
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                    <input
                      type="checkbox"
                      checked={formData?.pedagogico?.atividadeComplementarDisciplina || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pedagogico: {
                          ...(prev.pedagogico || {}),
                          atividadeComplementarDisciplina: e.target.checked
                        }
                      }))}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium text-gray-800">Atividade Complementar Como Disciplina?</span>
                  </label>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-teal-600 mb-4">🎓 Menus Pedagógicos</h3>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                    <h4 className="text-xs font-bold text-yellow-800 mb-1">⚠️ OBSERVAÇÃO</h4>
                    <p className="text-xs text-yellow-700">
                      Ao desmarcar alguma das opções abaixo, o menu será ocultado para todos os usuários da sua plataforma. Dados que foram inseridos anteriormente <strong>NÃO</strong> serão perdidos!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.pedagogico?.notasEscola || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pedagogico: {
                            ...(prev.pedagogico || {}),
                            notasEscola: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Notas (Escola)?</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.pedagogico?.notaseFaltas || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pedagogico: {
                            ...(prev.pedagogico || {}),
                            notaseFaltas: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Notas e faltas?</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.pedagogico?.frequenciaV1 || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pedagogico: {
                            ...(prev.pedagogico || {}),
                            frequenciaV1: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Frequência V1?</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.pedagogico?.frequenciaV2 || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pedagogico: {
                            ...(prev.pedagogico || {}),
                            frequenciaV2: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Frequência V2?</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* ABA: FINANCEIRO */}
            {activeTab === 'financeiro' && (
              <>
                <h3 className="text-sm font-bold text-teal-600">💰 Dados Financeiros</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.desativarFinanceiro || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            desativarFinanceiro: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Desativar Financeiro do Portal do Aluno?</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.desativarJurosMulha || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            desativarJurosMulha: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Desativar Botão Juros e Mulha?</span>
                    </label>
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                    <input
                      type="checkbox"
                      checked={formData?.financeiro?.bloquearAlunoInadimplente || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        financeiro: {
                          ...(prev.financeiro || {}),
                          bloquearAlunoInadimplente: e.target.checked
                        }
                      }))}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium text-gray-800">Bloquear aluno inadimplente?</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                    <input
                      type="checkbox"
                      checked={formData?.financeiro?.saldarVencimentoFinal || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        financeiro: {
                          ...(prev.financeiro || {}),
                          saldarVencimentoFinal: e.target.checked
                        }
                      }))}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium text-gray-800">Saltar Vencimentos no Final de Semana?</span>
                  </label>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-teal-600 mb-4">📋 Notas Fiscais</h3>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                    <h4 className="text-xs font-bold text-yellow-800 mb-2">⚠️ ATENÇÃO:</h4>
                    <p className="text-xs text-yellow-700">
                      Com RPS Manual ativado, informe no Cerbrum o último número consultado no portal da prefeitura.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Com RPS Manual desativado, o Cerbrum usa o último número gerado no próprio sistema.
                    </p>
                    <p className="text-xs text-yellow-700 mt-2">
                      <em>(Use apenas se emitir notas também em outro sistema fora do Cerbrum.)</em>
                    </p>
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                    <input
                      type="checkbox"
                      checked={formData?.financeiro?.ativarRPSManual || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        financeiro: {
                          ...(prev.financeiro || {}),
                          ativarRPSManual: e.target.checked
                        }
                      }))}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium text-gray-800">Ativar RPS manual?</span>
                  </label>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-teal-600 mb-4">🔐 Gerencianet</h3>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                    <h4 className="text-xs font-bold text-yellow-800 mb-2">💡 DICA</h4>
                    <p className="text-xs text-yellow-700">
                      Ativando esta função, será exibido a opção <strong>Gerencianet</strong> na criação das turmas no campo Conta de Recebimento.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Certifique que o <strong>Client ID</strong> e o <strong>Client Secret</strong> estão preenchidos corretamente.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      O não preenchimento correto do <strong>Client ID</strong> e o <strong>Client Secret</strong> causará erros no momento de gerar as formas de pagamento.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      <a href="#" className="text-blue-600 hover:text-blue-800">Clique aqui</a>, e veja como encontrar o <strong>Client ID</strong> e o <strong>Client Secret</strong>. Use os dados de produção.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Para habilitar os pagamentos via Cartão é necessário informar o <strong>Identificador de Conta</strong>.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      <a href="#" className="text-blue-600 hover:text-blue-800">Clique aqui</a>, e veja como encontrar o <strong>Identificador de Conta</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.ativarGerencianet || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            ativarGerencianet: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Ativar Gerencianet</span>
                    </label>

                    <div>
                      <button
                        type="button"
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                      >
                        ✓ Validar suas Credenciais
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">CLIENT ID</label>
                      <input
                        type="text"
                        value={formData?.financeiro?.clientId || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            clientId: e.target.value
                          }
                        }))}
                        placeholder="Client_Id_66a1f0187f1f3e8a53ed7c296e322043a95e762a"
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">CLIENT SECRET</label>
                      <input
                        type="text"
                        value={formData?.financeiro?.clientSecret || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            clientSecret: e.target.value
                          }
                        }))}
                        placeholder="Client_Secret_817629a3f55cbe4c753bfac451232393dff22d07"
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.aceitarCartaoGerencianet || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            aceitarCartaoGerencianet: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Aceitar Pagamentos via Cartão?</span>
                    </label>

                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">IDENTIFICADOR DE CONTA</label>
                      <input
                        type="text"
                        value={formData?.financeiro?.identificadorConta || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            identificadorConta: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">% JUROS</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData?.financeiro?.jurosGerencianet || 0.033}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            jurosGerencianet: parseFloat(e.target.value)
                          }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">% MULTA</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData?.financeiro?.multaGerencianet || 2.0}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            multaGerencianet: parseFloat(e.target.value)
                          }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-teal-600 mb-4">🔐 Asaas</h3>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                    <h4 className="text-xs font-bold text-yellow-800 mb-2">💡 DICA</h4>
                    <p className="text-xs text-yellow-700">
                      Ativando esta função, será exibido a opção <strong>Asaas</strong> na criação das turmas no campo Conta de Recebimento.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Certifique que a <strong>API Key Asaas</strong> está preenchida corretamente.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      O não preenchimento correto da <strong>API Key Asaas</strong> causará erros no momento de gerar as formas de pagamento.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      <a href="#" className="text-blue-600 hover:text-blue-800">Clique aqui</a>, e veja como encontrar a <strong>API key Asaas</strong>. Use os dados de produção.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.ativarAsaas || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            ativarAsaas: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Ativar Asaas</span>
                    </label>

                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">API KEY ASAAS</label>
                      <input
                        type="password"
                        value={formData?.financeiro?.apiKeyAsaas || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            apiKeyAsaas: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">% JUROS *</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData?.financeiro?.percentualJurosAsaas || 0.033}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            percentualJurosAsaas: parseFloat(e.target.value)
                          }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-600 mb-1 block">% MULTA *</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData?.financeiro?.percentualMultaAsaas || 2.000}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            percentualMultaAsaas: parseFloat(e.target.value)
                          }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.aceitarPagamentosCartaoAsaas || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            aceitarPagamentosCartaoAsaas: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Aceitar Pagamentos via Cartão?</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.aceitarPagamentosPixAsaas || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: {
                            ...(prev.financeiro || {}),
                            aceitarPagamentosPixAsaas: e.target.checked
                          }
                        }))}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-gray-800">Aceitar Pagamentos via PIX?</span>
                    </label>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs font-medium text-teal-600 mb-1 block">CHAVE PIX PARA COBRANÇAS</label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    >
                      <option value="">SELECIONE UMA CHAVE PIX</option>
                      <option value="pix1">Chave PIX 1</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ABA: BIBLIOTECA */}
            {activeTab === 'biblioteca' && (
              <>
                <h3 className="text-sm font-bold text-teal-600 mb-6">📖 Biblioteca</h3>
                
                <div className="space-y-4">
                  {/* Bloqueio de empréstimos */}
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg">
                    <input
                      type="checkbox"
                      id="bloquearEmprestimoPendencia"
                      checked={formData?.biblioteca?.bloquearEmprestimoPendencia || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        biblioteca: {
                          ...(prev.biblioteca || {}),
                          bloquearEmprestimoPendencia: e.target.checked
                        }
                      }))}
                      className="w-5 h-5"
                    />
                    <label htmlFor="bloquearEmprestimoPendencia" className="text-sm font-medium text-gray-800 cursor-pointer">
                      Bloqueio de empréstimos por pendência de multa
                    </label>
                  </div>

                  {/* Qtd. de Renovação por Pessoa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-xs font-medium text-teal-600">Qtd. de Renovação por Pessoa</label>
                    <select
                      value={formData?.biblioteca?.qtdRenovacaoPorPessoa || 'ilimitada'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        biblioteca: {
                          ...(prev.biblioteca || {}),
                          qtdRenovacaoPorPessoa: e.target.value
                        }
                      }))}
                      className="px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    >
                      <option value="ilimitada">Permitir Renovações Ilimitadas</option>
                      <option value="1">Permitir 1 Renovação</option>
                      <option value="2">Permitir 2 Renovações</option>
                      <option value="3">Permitir 3 Renovações</option>
                      <option value="bloquear">Bloquear Renovações</option>
                    </select>
                  </div>

                  {/* Qtd. de Itens por Pessoa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-xs font-medium text-teal-600">Qtd. de Itens por Pessoa</label>
                    <select
                      value={formData?.biblioteca?.qtdItensPorPessoa || 'ilimitada'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        biblioteca: {
                          ...(prev.biblioteca || {}),
                          qtdItensPorPessoa: e.target.value
                        }
                      }))}
                      className="px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    >
                      <option value="ilimitada">Permitir Empréstimos ilimitados</option>
                      <option value="1">Permitir 1 Item</option>
                      <option value="2">Permitir 2 Itens</option>
                      <option value="3">Permitir 3 Itens</option>
                      <option value="5">Permitir 5 Itens</option>
                      <option value="10">Permitir 10 Itens</option>
                    </select>
                  </div>

                  {/* Qtd. de Reservas por Pessoa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-xs font-medium text-teal-600">Qtd. de Reservas por Pessoa</label>
                    <select
                      value={formData?.biblioteca?.qtdReservasPorPessoa || '3'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        biblioteca: {
                          ...(prev.biblioteca || {}),
                          qtdReservasPorPessoa: e.target.value
                        }
                      }))}
                      className="px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    >
                      <option value="ilimitada">Permitir Reservas Ilimitadas</option>
                      <option value="1">Limitar Reservas em 1 Exemplar</option>
                      <option value="2">Limitar Reservas em 2 Exemplares</option>
                      <option value="3">Limitar Reservas em 3 Exemplares</option>
                      <option value="5">Limitar Reservas em 5 Exemplares</option>
                      <option value="bloquear">Bloquear Reservas</option>
                    </select>
                  </div>

                  {/* Dias de Vencimento para Reserva */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-xs font-medium text-teal-600">Dias de Venc. para à Reserva</label>
                    <select
                      value={formData?.biblioteca?.diasVencimentoReserva || '2'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        biblioteca: {
                          ...(prev.biblioteca || {}),
                          diasVencimentoReserva: e.target.value
                        }
                      }))}
                      className="px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                    >
                      <option value="1">Limitar Vencimento em 1 Dia</option>
                      <option value="2">Limitar Vencimento em 2 Dias</option>
                      <option value="3">Limitar Vencimento em 3 Dias</option>
                      <option value="5">Limitar Vencimento em 5 Dias</option>
                      <option value="7">Limitar Vencimento em 7 Dias</option>
                      <option value="14">Limitar Vencimento em 14 Dias</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ABA: CONTRATOS */}
            {activeTab === 'contratos' && (
              <>
                <div className="space-y-6">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <h3 className="text-sm font-bold text-blue-800 mb-1">📝 Modelos de Contrato por Instituição</h3>
                    <p className="text-xs text-blue-700">
                      Configure modelos com placeholders dinâmicos. Esta etapa prepara a base para geração de PDF e assinatura digital em fases seguintes.
                    </p>
                  </div>

                  <div className="bg-teal-50 border border-teal-300 rounded-lg p-4">
                    <label className="text-xs font-medium text-teal-600 mb-1 block">INSTITUIÇÃO *</label>
                    <select
                      value={instituicaoContratoId}
                      onChange={(e) => {
                        setInstituicaoContratoId(e.target.value);
                        limparFormularioContrato();
                      }}
                      className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                    >
                      {instituicoes && instituicoes.length > 0 ? (
                        instituicoes.map((inst) => (
                          <option key={inst.id} value={inst.id}>{inst.nome}</option>
                        ))
                      ) : (
                        <option value="">Nenhuma instituição cadastrada</option>
                      )}
                    </select>
                  </div>

                  {!instituicaoContratoId ? (
                    <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">Cadastre ao menos uma instituição para criar modelos de contrato.</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-teal-50 border border-teal-300 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-teal-600 mb-4">
                          {editandoContrato ? '✏️ Editar Modelo de Contrato' : '➕ Novo Modelo de Contrato'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-xs font-medium text-teal-600 mb-1 block">NOME DO MODELO *</label>
                            <input
                              type="text"
                              name="nome"
                              value={formContrato.nome}
                              onChange={handleChangeContrato}
                              placeholder="Ex: Contrato de Prestação de Serviços"
                              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium text-teal-600 mb-1 block">ORDEM DE EXIBIÇÃO</label>
                            <input
                              type="number"
                              name="ordem"
                              value={formContrato.ordem}
                              onChange={handleChangeContrato}
                              className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="text-xs font-medium text-teal-600 mb-1 block">DESCRIÇÃO</label>
                          <textarea
                            name="descricao"
                            value={formContrato.descricao}
                            onChange={handleChangeContrato}
                            rows="2"
                            placeholder="Descrição interna para identificação do modelo"
                            className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-lg cursor-pointer hover:bg-green-100 transition">
                            <input
                              type="checkbox"
                              name="ativo"
                              checked={formContrato.ativo}
                              onChange={handleChangeContrato}
                              className="w-5 h-5"
                            />
                            <span className="text-sm font-medium text-gray-800">Modelo ativo</span>
                          </label>

                          <label className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg cursor-pointer hover:bg-yellow-100 transition">
                            <input
                              type="checkbox"
                              name="padrao"
                              checked={formContrato.padrao}
                              onChange={handleChangeContrato}
                              className="w-5 h-5"
                            />
                            <span className="text-sm font-medium text-gray-800">Definir como modelo padrão</span>
                          </label>
                        </div>

                        <div className="mb-4">
                          <label className="text-xs font-medium text-teal-600 mb-2 block">CONTEÚDO DO CONTRATO</label>
                          <RichTextEditor
                            ref={editorContratoRef}
                            value={formContrato.conteudoHtml}
                            onChange={(conteudoHtml) => setFormContrato(prev => ({
                              ...prev,
                              conteudoHtml
                            }))}
                          />
                        </div>

                        <div className="mb-4">
                          <h4 className="text-xs font-bold text-teal-600 mb-2">⚙️ Placeholders Disponíveis</h4>
                          <div className="flex flex-wrap gap-2">
                            {CONTRATO_PLACEHOLDERS.map((placeholder) => (
                              <button
                                key={placeholder}
                                type="button"
                                onClick={() => inserirPlaceholderNoContrato(placeholder)}
                                className="px-2 py-1 text-xs bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition"
                              >
                                {placeholder}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Clique em um placeholder para inseri-lo no conteúdo em edição.
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={salvarContrato}
                            disabled={salvandoContrato}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                          >
                            {salvandoContrato
                              ? 'Salvando...'
                              : editandoContrato
                                ? '✏️ Atualizar Modelo'
                                : '💾 Salvar Modelo'}
                          </button>

                          {editandoContrato && (
                            <button
                              type="button"
                              onClick={limparFormularioContrato}
                              className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
                            >
                              ❌ Cancelar Edição
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-teal-600 mb-4">📋 Modelos Cadastrados</h3>

                        {loadingContratos ? (
                          <div className="text-center py-4 text-gray-500">Carregando modelos...</div>
                        ) : contratos && contratos.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {contratos.map((contrato) => (
                              <div key={contrato.id} className="bg-white border border-gray-300 rounded-lg p-4 hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-2 gap-3">
                                  <h4 className="font-bold text-teal-700">{contrato.nome}</h4>
                                  <div className="flex items-center gap-2">
                                    {contrato.padrao && (
                                      <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">Padrão</span>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded ${contrato.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {contrato.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                  </div>
                                </div>

                                {contrato.descricao && (
                                  <p className="text-xs text-gray-600 mb-2">{contrato.descricao}</p>
                                )}

                                <p className="text-xs text-gray-500 mb-1">Ordem: {contrato.ordem || 0}</p>
                                <p className="text-xs text-gray-600 mb-3">{resumirHtml(contrato.conteudoHtml || contrato.conteudo_html) || 'Sem conteúdo'}</p>

                                <div className="flex gap-2 pt-3 border-t border-gray-200">
                                  <button
                                    type="button"
                                    onClick={() => editarContrato(contrato)}
                                    className="flex-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded font-semibold transition"
                                  >
                                    ✏️ Editar
                                  </button>

                                  {!contrato.padrao && (
                                    <button
                                      type="button"
                                      onClick={() => definirContratoPadrao(contrato.id)}
                                      className="flex-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded font-semibold transition"
                                    >
                                      ⭐ Padrão
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => deletarContrato(contrato.id)}
                                    className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-semibold transition"
                                  >
                                    🗑️ Deletar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                            <p className="text-gray-500">Nenhum modelo de contrato cadastrado para esta instituição.</p>
                            <p className="text-xs text-gray-400 mt-1">Crie o primeiro modelo usando o formulário acima.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ABA: INSTITUIÇÕES */}
            {activeTab === 'instituicoes' && (
              <>
                <div className="space-y-6">
                  {/* Formulário para adicionar/editar instituição */}
                  <div className="bg-teal-50 border border-teal-300 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-teal-600 mb-4">🏫 {editandoInstituicao ? 'Editar' : 'Adicionar Nova'} Instituição</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-teal-600 mb-1 block">NOME DA INSTITUIÇÃO *</label>
                        <input
                          type="text"
                          name="nome"
                          value={formInstituicao.nome}
                          onChange={handleChangeInstituicao}
                          placeholder="Ex: CREESER Educacional"
                          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-teal-600 mb-1 block">CÓD. DO MEC</label>
                        <input
                          type="text"
                          name="codMec"
                          value={formInstituicao.codMec}
                          onChange={handleChangeInstituicao}
                          placeholder="Código do MEC"
                          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-teal-600 mb-1 block">CNPJ</label>
                        <input
                          type="text"
                          name="cnpj"
                          value={formInstituicao.cnpj}
                          onChange={handleChangeInstituicao}
                          placeholder="00.000.000/0000-00"
                          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-teal-600 mb-1 block">EMAIL</label>
                        <input
                          type="email"
                          name="email"
                          value={formInstituicao.email}
                          onChange={handleChangeInstituicao}
                          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-teal-600 mb-1 block">TELEFONE</label>
                        <input
                          type="tel"
                          name="telefone"
                          value={formInstituicao.telefone}
                          onChange={handleChangeInstituicao}
                          placeholder="(00) 00000-0000"
                          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-teal-600 mb-1 block">SITE</label>
                        <input
                          type="url"
                          name="website"
                          value={formInstituicao.website}
                          onChange={handleChangeInstituicao}
                          placeholder="https://exemplo.com.br"
                          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-teal-600 mb-1 block">CIDADE</label>
                        <input
                          type="text"
                          name="cidade"
                          value={formInstituicao.cidade}
                          onChange={handleChangeInstituicao}
                          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-teal-600 mb-1 block">ESTADO</label>
                        <select
                          name="estado"
                          value={formInstituicao.estado}
                          onChange={handleChangeInstituicao}
                          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                        >
                          <option value="">- ESCOLHA -</option>
                          <option value="AC">AC</option>
                          <option value="AL">AL</option>
                          <option value="AP">AP</option>
                          <option value="AM">AM</option>
                          <option value="BA">BA</option>
                          <option value="CE">CE</option>
                          <option value="DF">DF</option>
                          <option value="ES">ES</option>
                          <option value="GO">GO</option>
                          <option value="MA">MA</option>
                          <option value="MT">MT</option>
                          <option value="MS">MS</option>
                          <option value="MG">MG</option>
                          <option value="PA">PA</option>
                          <option value="PB">PB</option>
                          <option value="PR">PR</option>
                          <option value="PE">PE</option>
                          <option value="PI">PI</option>
                          <option value="RJ">RJ</option>
                          <option value="RN">RN</option>
                          <option value="RS">RS</option>
                          <option value="RO">RO</option>
                          <option value="RR">RR</option>
                          <option value="SC">SC</option>
                          <option value="SP">SP</option>
                          <option value="SE">SE</option>
                          <option value="TO">TO</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-teal-600 mb-1 block">CEP</label>
                        <input
                          type="text"
                          name="cep"
                          value={formInstituicao.cep}
                          onChange={handleChangeInstituicao}
                          placeholder="00000-000"
                          className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-xs font-medium text-teal-600 mb-1 block">ENDEREÇO</label>
                      <input
                        type="text"
                        name="endereco"
                        value={formInstituicao.endereco}
                        onChange={handleChangeInstituicao}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="text-xs font-medium text-teal-600 mb-1 block">DESCRIÇÃO</label>
                      <textarea
                        name="descricao"
                        value={formInstituicao.descricao}
                        onChange={handleChangeInstituicao}
                        rows="3"
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 border border-green-300 rounded-lg">
                      <input
                        type="checkbox"
                        id="ativa"
                        name="ativa"
                        checked={formInstituicao.ativa}
                        onChange={handleChangeInstituicao}
                        className="w-5 h-5"
                      />
                      <label htmlFor="ativa" className="text-sm font-medium text-gray-800 cursor-pointer">
                        Instituição Ativa
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={salvarInstituicao}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
                      >
                        {editandoInstituicao ? '✏️ Atualizar' : '➕ Adicionar'} Instituição
                      </button>
                      
                      {editandoInstituicao && (
                        <button
                          type="button"
                          onClick={cancelarEdicaoInstituicao}
                          className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
                        >
                          ❌ Cancelar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de instituições */}
                  <div>
                    <h3 className="text-sm font-bold text-teal-600 mb-4">📋 Instituições Cadastradas</h3>
                    
                    {loadingInstituicoes ? (
                      <div className="text-center py-4 text-gray-500">Carregando...</div>
                    ) : instituicoes && instituicoes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {instituicoes.map((inst) => (
                          <div key={inst.id} className="bg-white border border-gray-300 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-teal-600">{inst.nome}</h4>
                              <span className={`text-xs px-2 py-1 rounded ${inst.ativa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {inst.ativa ? '✓ Ativa' : '✗ Inativa'}
                              </span>
                            </div>
                            
                            {inst.cnpj && <p className="text-xs text-gray-600">CNPJ: {inst.cnpj}</p>}
                            {inst.email && <p className="text-xs text-gray-600">Email: {inst.email}</p>}
                            {inst.telefone && <p className="text-xs text-gray-600">Tel: {inst.telefone}</p>}
                            {inst.cidade && inst.estado && <p className="text-xs text-gray-600">{inst.cidade}, {inst.estado}</p>}
                            
                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                              <button
                                onClick={() => editarInstituicao(inst)}
                                className="flex-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded font-semibold transition"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => deletarInstituicao(inst.id)}
                                className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-semibold transition"
                              >
                                🗑️ Deletar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500">Nenhuma instituição cadastrada yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Adicione a primeira institucição usando o formulário acima.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}


          </div>

          {/* Botões */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push('/admin/configuracoes')}
              className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2"
            >
              💾 Salvar Configurações
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={feedbackModal.isOpen}
        onClose={fecharFeedback}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={fecharConfirmacao}
        onConfirm={confirmarAcaoModal}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </DashboardLayout>
  );
}
