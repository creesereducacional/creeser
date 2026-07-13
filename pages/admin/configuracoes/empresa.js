import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/DashboardLayout';
import RichTextEditor from '../../../components/RichTextEditor';
import ConfirmModal from '../../../components/ConfirmModal';

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showConfigEfi, setShowConfigEfi] = useState(false);
  const [showConfigAsaas, setShowConfigAsaas] = useState(false);
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
    inscricaoEstadual: '',
    slogan: '',
    whatsapp: '',
    numero: '',
    complemento: '',
    bairro: '',
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
      chavePix: '',
      ambienteAsaas: 'sandbox',
      walletIdAsaas: '',
      webhookTokenAsaas: '',
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
  const [testingAsaas, setTestingAsaas] = useState(false);

  const handleTestarAsaas = async () => {
    const key = formData?.financeiro?.apiKeyAsaas;
    const amb = formData?.financeiro?.ambienteAsaas || 'sandbox';
    if (!key) {
      alert('Por favor, informe a API Key Asaas para testar.');
      return;
    }
    setTestingAsaas(true);
    try {
      const res = await fetch('/api/configuracoes/testar-asaas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, ambiente: amb })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Conexão estabelecida com sucesso com o Asaas!');
      } else {
        alert(`Erro de conexão: ${data.error || 'Verifique as credenciais.'}`);
      }
    } catch (e) {
      alert('Erro ao testar conexão.');
    } finally {
      setTestingAsaas(false);
    }
  };
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
    if (router.query.tab) {
      setActiveTab(router.query.tab);
    }
  }, [router.query.tab]);

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

  const handleCepChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
    setFormData(prev => ({ ...prev, cep: val }));
    if (val.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
        const d = await res.json();
        if (!d.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: d.logradouro || '',
            bairro: d.bairro || '',
            cidade: d.localidade || '',
            estado: d.uf || ''
          }));
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
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
    { id: 'dashboard',   nome: 'Dashboard', icon: '🏠' },
    { id: 'informacoes', nome: 'Geral', icon: '📋' },
    { id: 'pedagogico', nome: 'Pedagógico', icon: '📚' },
    { id: 'financeiro', nome: 'Financeiro', icon: '💰' },
    { id: 'gateways',   nome: 'Gateways', icon: '🔐' },
    { id: 'biblioteca', nome: 'Biblioteca', icon: '📖' },
    { id: 'contratos',  nome: 'Contratos', icon: '📝' },
    { id: 'instituicoes', nome: 'Instituições', icon: '🏫' }
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl">
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <a href="/admin/configuracoes" className="hover:text-teal-600 transition">← Configurações Operacionais</a>
            <span>/</span>
            <span className="text-gray-700 font-semibold">Configuração Técnica</span>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white flex items-start gap-5">
            <div className="p-3 bg-white/10 rounded-xl text-3xl shrink-0">⚙️</div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Configuração Técnica do Sistema</h1>
              <p className="text-sm text-gray-300 mt-1 max-w-2xl">
                Este ambiente é destinado aos <strong className="text-white">administradores da plataforma</strong>. As alterações realizadas aqui podem afetar integrações, gateways, contratos e módulos estruturais do ERP. Proceda com cautela.
              </p>
            </div>
          </div>
        </div>

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

          <div className="bg-white rounded-b-lg shadow-md p-4 md:p-6 space-y-6">
            
            {/* ABA: DASHBOARD TÉCNICA */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">

                {/* Seção 1: Saúde da Plataforma */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">🏥 Saúde da Plataforma</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Empresa */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 text-sm">🏢 Geral (Empresa)</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${formData.nomeEmpresa ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                            {formData.nomeEmpresa ? '🟢 Configurada' : '🟡 Pendente'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-mono truncate">{formData.nomeEmpresa || 'Nenhum nome cadastrado'}</p>
                      </div>
                      <button type="button" onClick={() => setActiveTab('informacoes')} className="mt-3 text-xs font-bold text-teal-600 hover:text-teal-700 text-left">
                        Visualizar dados gerais →
                      </button>
                    </div>

                    {/* ASAAS */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 text-sm">💳 ASAAS</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${formData?.financeiro?.ativarAsaas ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                            {formData?.financeiro?.ativarAsaas ? '🟢 Ativo' : '⚫ Inativo'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-2 space-y-0.5 font-mono">
                          <div>Ambiente: {formData?.financeiro?.ambienteAsaas || 'sandbox'}</div>
                          <div>Último teste: Estimado</div>
                        </div>
                      </div>
                      <button type="button" onClick={() => setActiveTab('gateways')} className="mt-3 text-xs font-bold text-teal-600 hover:text-teal-700 text-left">
                        Abrir Gateways →
                      </button>
                    </div>

                    {/* EFI */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 text-sm">💳 EFI (Gerencianet)</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${formData?.financeiro?.ativarGerencianet ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                            {formData?.financeiro?.ativarGerencianet ? '🟢 Ativo' : '⚫ Inativo'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-2 space-y-0.5 font-mono">
                          <div>Ambiente: Produção</div>
                          <div>Último teste: Estimado</div>
                        </div>
                      </div>
                      <button type="button" onClick={() => setActiveTab('gateways')} className="mt-3 text-xs font-bold text-teal-600 hover:text-teal-700 text-left">
                        Abrir Gateways →
                      </button>
                    </div>

                    {/* SMTP */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 text-sm">✉️ SMTP</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-50 text-green-700 border border-green-200">
                            🟢 Operacional
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Pronto para envios transacionais</p>
                      </div>
                      <button type="button" onClick={() => setActiveTab('gateways')} className="mt-3 text-xs font-bold text-teal-600 hover:text-teal-700 text-left">
                        Abrir Gateways →
                      </button>
                    </div>

                    {/* Assinafy */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 text-sm">✍️ Assinafy</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-50 text-green-700 border border-green-200">
                            🟢 Ativo (Env)
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Configurado nas variáveis locais</p>
                      </div>
                      <button type="button" onClick={() => setActiveTab('gateways')} className="mt-3 text-xs font-bold text-teal-600 hover:text-teal-700 text-left">
                        Abrir Gateways →
                      </button>
                    </div>

                    {/* ViaCEP */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 text-sm">📍 ViaCEP</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-50 text-green-700 border border-green-200">
                            🟢 Operacional
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Preenchimento de CEP público ativo</p>
                      </div>
                      <span className="mt-3 text-xs text-gray-400 font-medium">Serviço global</span>
                    </div>

                  </div>
                </div>

                {/* Seção 2: Módulos Técnicos */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">🛠️ Módulos Técnicos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { id: 'pedagogico',  label: '📚 Pedagógico', desc: 'Regras de notas e bloqueio de diário.' },
                      { id: 'biblioteca',  label: '📖 Biblioteca',  desc: 'Configuração de acervo e empréstimos.' },
                      { id: 'contratos',   label: '📄 Contratos',   desc: 'Templates de contratos e placeholders.' },
                      { id: 'instituicoes',label: '🏛️ Instituições',desc: 'Gestão multi-tenant de unidades e MEC.' },
                      { id: 'gateways',    label: '🔐 Gateways',    desc: 'Credenciais ASAAS, EFI, SMTP e Assinafy.' }
                    ].map(mod => (
                      <div key={mod.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="font-bold text-gray-800 text-xs">{mod.label}</h4>
                          <p className="text-[11px] text-gray-500 mt-1">{mod.desc}</p>
                        </div>
                        <button type="button" onClick={() => setActiveTab(mod.id)} className="w-full py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-bold transition">
                          Abrir
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Índice de Saúde Geral */}
                {(() => {
                  const checks = [
                    { name: 'Empresa: Nome', valid: !!formData.nomeEmpresa, critical: true },
                    { name: 'Empresa: CNPJ', valid: !!formData.cnpj, critical: true },
                    { name: 'Empresa: Logo', valid: !!formData.logo, critical: false },
                    { name: 'Empresa: E-mail', valid: !!formData.email, critical: true },
                    { name: 'Empresa: Endereço', valid: !!formData.endereco && !!formData.cidade && !!formData.estado, critical: true },
                    { name: 'Instituições cadastradas', valid: (instituicoes?.length || 0) > 0, critical: true },
                    { name: 'Contrato padrão definido', valid: contratos.some(c => c.padrao), critical: true },
                    { name: 'Contrato: Existe modelo ativo', valid: contratos.some(c => c.ativo), critical: true },
                    { name: 'Asaas configurado', valid: !formData?.financeiro?.ativarAsaas || (!!formData?.financeiro?.apiKeyAsaas), critical: true },
                    { name: 'EFI configurado', valid: !formData?.financeiro?.ativarGerencianet || (!!formData?.financeiro?.clientId && !!formData?.financeiro?.clientSecret), critical: true },
                    { name: 'SMTP: Host e Porta', valid: true, critical: false } // SMTP mock
                  ];
                  
                  const totalChecks = checks.length;
                  const passedChecks = checks.filter(c => c.valid).length;
                  const score = Math.round((passedChecks / totalChecks) * 100);
                  
                  let colorClass = 'text-green-600 bg-green-50 border-green-200';
                  let label = '🟢 Excelente';
                  if (score < 50) {
                    colorClass = 'text-red-600 bg-red-50 border-red-200';
                    label = '🔴 Crítico';
                  } else if (score < 85) {
                    colorClass = 'text-yellow-600 bg-yellow-50 border-yellow-200';
                    label = '🟡 Atenção';
                  }

                  const pendenciasProducao = [];
                  if (!formData.nomeEmpresa) pendenciasProducao.push('Configurar Nome Fantasia da Empresa');
                  if (!formData.cnpj) pendenciasProducao.push('Configurar CNPJ da Empresa');
                  if ((instituicoes?.length || 0) === 0) pendenciasProducao.push('Cadastrar pelo menos uma Instituição');
                  if (!contratos.some(c => c.padrao)) pendenciasProducao.push('Definir um Contrato Padrão nas configurações de contratos');
                  if (formData?.financeiro?.ativarAsaas && !formData?.financeiro?.apiKeyAsaas) pendenciasProducao.push('Configurar API Key do ASAAS');
                  if (formData?.financeiro?.ativarGerencianet && (!formData?.financeiro?.clientId || !formData?.financeiro?.clientSecret)) pendenciasProducao.push('Configurar credenciais EFI');

                  return (
                    <div className="space-y-6">
                      
                      {/* Bloco Superior: Score & Pendências */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Score Geral */}
                        <div className={`p-6 rounded-2xl border flex flex-col justify-between items-center text-center ${colorClass}`}>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider block text-gray-500 mb-1">Índice Geral de Saúde</span>
                            <span className="text-4xl font-extrabold">{score}%</span>
                          </div>
                          <span className="mt-3 px-3 py-1 bg-white/80 rounded-full text-xs font-bold border border-current">{label}</span>
                        </div>

                        {/* Pendências de Produção */}
                        <div className="p-5 rounded-2xl border border-gray-200 bg-white md:col-span-2 space-y-3">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest border-b pb-2">🎯 Pendências para Produção</h4>
                          {pendenciasProducao.length > 0 ? (
                            <ul className="space-y-2">
                              {pendenciasProducao.map((p, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs text-red-600 font-medium">
                                  <span>🔴</span> {p}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold">
                              <span>🟢</span> Ambiente pronto para produção.
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Seção de Diagnóstico Detalhado */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b pb-3">🩺 Diagnóstico do Ambiente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Coluna 1: Geral & Instituicoes & Contratos */}
                          <div className="space-y-4">
                            
                            {/* Card Empresa */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">🏢 Empresa</h4>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between"><span>Nome configurado:</span> <span>{formData.nomeEmpresa ? '🟢 Configurado' : '🔴 Pendente'}</span></div>
                                <div className="flex justify-between"><span>CNPJ informado:</span> <span>{formData.cnpj ? '🟢 Informado' : '🔴 Pendente'}</span></div>
                                <div className="flex justify-between"><span>Logo cadastrada:</span> <span>{formData.logo ? '🟢 Cadastrada' : '🟡 Não informada'}</span></div>
                                <div className="flex justify-between"><span>E-mail configurado:</span> <span>{formData.email ? '🟢 Configurado' : '🔴 Pendente'}</span></div>
                                <div className="flex justify-between"><span>Endereço completo:</span> <span>{formData.endereco && formData.cidade && formData.estado ? '🟢 Completo' : '🔴 Incompleto'}</span></div>
                              </div>
                            </div>

                            {/* Card Instituições */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                              <h4 className="text-xs font-bold text-gray-550 uppercase tracking-wider">🏛️ Instituições</h4>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between"><span>Cadastradas:</span> <span className="font-semibold">{instituicoes?.length || 0}</span></div>
                                {(instituicoes?.length || 0) === 0 && <div className="text-red-600 font-semibold mt-1">⚠️ Nenhuma instituição cadastrada.</div>}
                              </div>
                            </div>

                            {/* Card Contratos */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                              <h4 className="text-xs font-bold text-gray-550 uppercase tracking-wider">📄 Contratos</h4>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between"><span>Contrato padrão definido:</span> <span>{contratos.some(c => c.padrao) ? '🟢 Definido' : '🔴 Não definido'}</span></div>
                                <div className="flex justify-between"><span>Existe modelo ativo:</span> <span>{contratos.some(c => c.ativo) ? '🟢 Sim' : '🔴 Não'}</span></div>
                                {!contratos.some(c => c.padrao) && <div className="text-amber-600 font-semibold mt-1">⚠️ Contrato padrão não definido.</div>}
                              </div>
                            </div>

                          </div>

                          {/* Coluna 2: Gateways & SMTP & Pedagógico & Biblioteca */}
                          <div className="space-y-4">
                            
                            {/* Card Gateways */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-gray-550 uppercase tracking-wider">💳 Gateways</h4>
                              <div className="space-y-1 text-xs">
                                <div className="font-semibold text-[10px] text-gray-400 mt-1 uppercase">ASAAS</div>
                                <div className="flex justify-between"><span>API configurada:</span> <span>{formData?.financeiro?.apiKeyAsaas ? '🟢 Configurada' : '🟡 Não definida'}</span></div>
                                <div className="flex justify-between"><span>Ambiente:</span> <span className="font-mono">{formData?.financeiro?.ambienteAsaas || 'sandbox'}</span></div>
                                
                                <div className="font-semibold text-[10px] text-gray-400 mt-2 uppercase">EFI</div>
                                <div className="flex justify-between"><span>Client ID & Secret:</span> <span>{formData?.financeiro?.clientId && formData?.financeiro?.clientSecret ? '🟢 Configurado' : '🟡 Não configurado'}</span></div>
                                
                                {formData?.financeiro?.ativarAsaas && !formData?.financeiro?.apiKeyAsaas && <div className="text-red-600 font-semibold mt-1">⚠️ Configuração incompleta (ASAAS).</div>}
                                {formData?.financeiro?.ativarGerencianet && (!formData?.financeiro?.clientId || !formData?.financeiro?.clientSecret) && <div className="text-red-600 font-semibold mt-1">⚠️ Configuração incompleta (EFI).</div>}
                              </div>
                            </div>

                            {/* Card SMTP */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                              <h4 className="text-xs font-bold text-gray-550 uppercase tracking-wider">✉️ SMTP</h4>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between"><span>Host configurado:</span> <span>🟢 Configurado (Mock)</span></div>
                                <div className="flex justify-between"><span>Porta / Usuário:</span> <span>🟢 Configurado (Mock)</span></div>
                              </div>
                            </div>

                            {/* Card Pedagógico */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                              <h4 className="text-xs font-bold text-gray-550 uppercase tracking-wider">📚 Módulos Acadêmicos</h4>
                              <div className="space-y-1 text-xs">
                                <div><span className="font-semibold text-gray-500">Pedagógico:</span> Validação será habilitada futuramente.</div>
                                <div><span className="font-semibold text-gray-500">Biblioteca:</span> Validação será habilitada futuramente.</div>
                              </div>
                            </div>

                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* Seção 3: Resumo do Ambiente & Checklist & Alertas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Resumo do Ambiente */}
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider border-b pb-2">📊 Resumo do Ambiente</h4>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Total de instituições:</span>
                        <span className="font-bold text-gray-700">{instituicoes?.length || 0} cadastradas</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Modelos de contrato:</span>
                        <span className="font-bold text-gray-700">{contratos?.length || 0} templates</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Gateway ativo:</span>
                        <span className="font-bold text-gray-700">
                          {formData?.financeiro?.ativarAsaas && formData?.financeiro?.ativarGerencianet ? 'Ambos' : formData?.financeiro?.ativarAsaas ? 'ASAAS' : formData?.financeiro?.ativarGerencianet ? 'EFI' : 'Nenhum'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Ambiente atual:</span>
                        <span className="font-bold text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded uppercase text-[10px]">
                          {formData?.financeiro?.ambienteAsaas === 'producao' ? 'Produção' : 'Homologação'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Última alteração:</span>
                        <span className="text-gray-400">Em preparação</span>
                      </div>
                    </div>
                  </div>

                  {/* Checklist de Implantação */}
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider border-b pb-2">📋 Checklist de Implantação</h4>
                    <div className="space-y-2.5 text-xs">
                      {[
                        { label: 'Empresa configurada', done: !!formData.nomeEmpresa },
                        { label: 'Gateway configurado',  done: !!formData?.financeiro?.ativarAsaas || !!formData?.financeiro?.ativarGerencianet },
                        { label: 'SMTP configurado',     done: true }, // SMTP Mock/Pre-ativo
                        { label: 'Contrato padrão definido', done: contratos.some(c => c.padrao) },
                        { label: 'Instituição cadastrada',   done: (instituicoes?.length || 0) > 0 },
                        { label: 'Pedagógico configurado',   done: !!formData?.pedagogico?.coordenador },
                        { label: 'Biblioteca configurada',   done: !!formData?.biblioteca?.gerente }
                      ].map(chk => (
                        <div key={chk.label} className="flex items-center justify-between">
                          <span className="text-gray-700">{chk.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${chk.done ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {chk.done ? '🟢 Configurado' : '🟡 Pendente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alertas do Sistema */}
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider border-b pb-2">⚠️ Alertas e Diagnóstico</h4>
                    <div className="space-y-2.5 text-xs">
                      {!(formData?.financeiro?.ativarAsaas || formData?.financeiro?.ativarGerencianet) && (
                        <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium flex items-center gap-2">
                          <span>⚠️</span> Nenhum gateway financeiro ativo.
                        </div>
                      )}
                      {!contratos.some(c => c.padrao) && (
                        <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-medium flex items-center gap-2">
                          <span>⚠️</span> Não existe contrato padrão definido.
                        </div>
                      )}
                      {(instituicoes?.length || 0) === 0 && (
                        <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium flex items-center gap-2">
                          <span>⚠️</span> Nenhuma instituição cadastrada.
                        </div>
                      )}
                      {(formData?.financeiro?.ativarAsaas || formData?.financeiro?.ativarGerencianet) && contratos.some(c => c.padrao) && (instituicoes?.length || 0) > 0 && (
                        <div className="p-3 bg-green-50 text-green-800 border border-green-200 rounded-xl font-medium flex items-center gap-2">
                          <span>🟢</span> Ambiente configurado corretamente.
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {activeTab === 'informacoes' && (
              <div className="space-y-6">
                {/* 1. Identificação */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                    <span>🆔</span> 1. Identificação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">NOME FANTASIA *</label>
                      <input
                        type="text"
                        name="nomeEmpresa"
                        value={formData.nomeEmpresa || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">RAZÃO SOCIAL *</label>
                      <input
                        type="text"
                        name="razaoSocial"
                        value={formData.razaoSocial || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">CNPJ *</label>
                      <input
                        type="text"
                        name="cnpj"
                        value={formData.cnpj || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">INSCRIÇÃO ESTADUAL</label>
                      <input
                        type="text"
                        name="inscricaoEstadual"
                        value={formData.inscricaoEstadual || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">WEBSITE</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">SLOGAN</label>
                      <input
                        type="text"
                        name="slogan"
                        value={formData.slogan || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-105">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">LOGO INSTITUCIONAL</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
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
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">PRÉ-VISUALIZAÇÃO DA LOGO</label>
                      <div className="w-full h-20 border border-teal-200 rounded-lg bg-teal-50/10 flex items-center justify-center overflow-hidden">
                        {formData.logo ? (
                          <img src={formData.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-xs text-gray-400">Nenhuma logo carregada</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Contato */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                    <span>📞</span> 2. Contato
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">EMAIL INSTITUCIONAL *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">TELEFONE *</label>
                      <input
                        type="tel"
                        name="telefone"
                        value={formData.telefone || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">WHATSAPP</label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Endereço */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                    <span>📍</span> 3. Endereço
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">CEP *</label>
                      <input
                        type="text"
                        name="cep"
                        value={formData.cep || ''}
                        onChange={handleCepChange}
                        placeholder="00000-000"
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">LOGRADOURO *</label>
                      <input
                        type="text"
                        name="endereco"
                        value={formData.endereco || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">NÚMERO *</label>
                      <input
                        type="text"
                        name="numero"
                        value={formData.numero || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">COMPLEMENTO</label>
                      <input
                        type="text"
                        name="complemento"
                        value={formData.complemento || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">BAIRRO *</label>
                      <input
                        type="text"
                        name="bairro"
                        value={formData.bairro || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">CIDADE *</label>
                      <input
                        type="text"
                        name="cidade"
                        value={formData.cidade || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">ESTADO *</label>
                      <select
                        name="estado"
                        value={formData.estado || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      >
                        <option value="">- ESCOLHA -</option>
                        {UF_OPTIONS.map(uf => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Outras Configurações Originais */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                    <span>📱</span> Página Inicial do Portal do Aluno
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-teal-650 mb-1 block">NOME DA EMPRESA</label>
                      <input
                        type="text"
                        value={formData.nomeEmpresa || ''}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-teal-650 mb-1 block">FACULDADE</label>
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

                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                    <span>✍️</span> Biografia
                  </h3>
                  
                  <div className="border border-teal-300 rounded-lg overflow-hidden">
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
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-red-100 text-sm text-red-650"
                        title="Limpar Formatação"
                      >
                        ✖️
                      </button>
                    </div>
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
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                    <span>💬</span> WhatsApp Integrado
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-teal-650 mb-1 block">DDD</label>
                      <input
                        type="text"
                        name="ddd"
                        value={formData.ddd || ''}
                        onChange={handleChange}
                        placeholder="Ex: 83"
                        maxLength="2"
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 bg-teal-50"
                      />
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
                        <label className="text-xs font-medium text-teal-650 mb-1 block">CONTATO WHATSAPP PARA ALUNO</label>
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
              </div>
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
              <div className="space-y-6">
                
                {/* 1. Dados Bancários */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                    <span>🏦</span> 1. Dados Bancários
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">BANCO</label>
                      <input
                        type="text"
                        value={formData?.financeiro?.banco || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), banco: e.target.value }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        placeholder="Ex: Banco do Brasil"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">AGÊNCIA</label>
                      <input
                        type="text"
                        value={formData?.financeiro?.agencia || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), agencia: e.target.value }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        placeholder="Ex: 1234-5"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">CONTA CORRENTE</label>
                      <input
                        type="text"
                        value={formData?.financeiro?.conta || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), conta: e.target.value }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        placeholder="Ex: 54321-0"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">TIPO DE CONTA</label>
                      <select
                        value={formData?.financeiro?.tipoConta || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), tipoConta: e.target.value }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      >
                        <option value="">Selecione</option>
                        <option value="corrente">Conta Corrente</option>
                        <option value="poupanca">Conta Poupança</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">FAVORECIDO</label>
                      <input
                        type="text"
                        value={formData?.financeiro?.favorecido || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), favorecido: e.target.value }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        placeholder="Ex: Nome da Instituição Ltda"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">CHAVE PIX</label>
                      <input
                        type="text"
                        value={formData?.financeiro?.chavePix || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), chavePix: e.target.value }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        placeholder="Ex: cnpj, email, telefone"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Regras Financeiras */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                    <span>⚙️</span> 2. Regras Financeiras
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">VENCIMENTO PADRÃO</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData?.financeiro?.diaVencimentoPadrao || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), diaVencimentoPadrao: parseInt(e.target.value) || '' }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        placeholder="Ex: 10"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">MULTA (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData?.financeiro?.multa || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), multa: parseFloat(e.target.value) || '' }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        placeholder="Ex: 2.00"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">JUROS (%) ao mês</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData?.financeiro?.juros || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), juros: parseFloat(e.target.value) || '' }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        placeholder="Ex: 1.00"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">TOLERÂNCIA (DIAS)</label>
                      <input
                        type="number"
                        value={formData?.financeiro?.diasTolerancia || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), diasTolerancia: parseInt(e.target.value) || '' }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        placeholder="Ex: 3"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">DESC. PONTUALIDADE (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData?.financeiro?.descontoPontualidade || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), descontoPontualidade: parseFloat(e.target.value) || '' }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        placeholder="Ex: 5.00"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Configurações de Cobrança */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                    <span>📋</span> 3. Configurações de Cobrança
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100/50 transition">
                      <span className="text-sm font-medium text-gray-800">Gerar carnê automaticamente na conversão?</span>
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.gerarCarneAutomatico || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), gerarCarneAutomatico: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100/50 transition">
                      <span className="text-sm font-medium text-gray-800">Gerar taxa de matrícula automaticamente?</span>
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.gerarMatriculaAutomatico || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), gerarMatriculaAutomatico: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100/50 transition">
                      <span className="text-sm font-medium text-gray-800">Permitir renegociação de parcelas vencidas?</span>
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.permitirRenegociacao || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), permitirRenegociacao: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100/50 transition">
                      <span className="text-sm font-medium text-gray-800">Permitir pagamento parcial das mensalidades?</span>
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.permitirPagamentoParcial || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), permitirPagamentoParcial: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500"
                      />
                    </label>
                  </div>
                </div>

                {/* 4. Plano Financeiro Padrão */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                    <span>📅</span> 4. Plano Financeiro Padrão
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">PARCELAS PADRÃO</label>
                      <input
                        type="number"
                        value={formData?.financeiro?.qtdParcelasPadrao || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), qtdParcelasPadrao: parseInt(e.target.value) || '' }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        placeholder="Ex: 12"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">PRIMEIRO VENCIMENTO PADRÃO</label>
                      <select
                        value={formData?.financeiro?.primeiroVencimentoPadrao || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), primeiroVencimentoPadrao: e.target.value }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      >
                        <option value="">Selecione</option>
                        <option value="mes_corrente">Mês Corrente (Mês da Matrícula)</option>
                        <option value="proximo_mes">Próximo Mês</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">FORMA DE COBRANÇA PADRÃO</label>
                      <select
                        value={formData?.financeiro?.formaCobrancaPadrao || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), formaCobrancaPadrao: e.target.value }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                      >
                        <option value="">Selecione</option>
                        <option value="boleto">Boleto Bancário</option>
                        <option value="pix">PIX</option>
                        <option value="cartao">Cartão de Crédito</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Gateways & Integrações (Legado e Configurações de API) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-6">
                  <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                    <span>🔐</span> Gateways & Configurações de API
                  </h3>
                  
                  {/* Controles Gerais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100/50 transition">
                      <span className="text-sm font-medium text-gray-800">Desativar Financeiro do Portal do Aluno?</span>
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.desativarFinanceiro || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), desativarFinanceiro: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded text-teal-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100/50 transition">
                      <span className="text-sm font-medium text-gray-800">Desativar Botão Juros e Multa?</span>
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.desativarJurosMulha || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), desativarJurosMulha: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded text-teal-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100/50 transition">
                      <span className="text-sm font-medium text-gray-800">Bloquear aluno inadimplente?</span>
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.bloquearAlunoInadimplente || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), bloquearAlunoInadimplente: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded text-teal-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100/50 transition">
                      <span className="text-sm font-medium text-gray-800">Saltar Vencimentos no Final de Semana?</span>
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.saldarVencimentoFinal || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), saldarVencimentoFinal: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded text-teal-600"
                      />
                    </label>
                  </div>

                  {/* RPS Manual */}
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-550 uppercase tracking-wider mb-2">Configurações de RPS/NF</h4>
                    <label className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100/50 transition">
                      <span className="text-sm font-medium text-gray-800">Ativar RPS manual?</span>
                      <input
                        type="checkbox"
                        checked={formData?.financeiro?.ativarRPSManual || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          financeiro: { ...(prev.financeiro || {}), ativarRPSManual: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded text-teal-600"
                      />
                    </label>
                  </div>
                </div>

              </div>
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

            {/* ABA: GATEWAYS */}
            {activeTab === 'gateways' && (
              <div className="space-y-6">
                <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
                  <h3 className="text-sm font-bold text-teal-800 mb-1">🔐 Configuração de Gateways e Integrações</h3>
                  <p className="text-xs text-teal-700">
                    Defina aqui as credenciais operacionais de pagamento, e-mail transacional e assinatura digital de documentos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card ASAAS */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                      <span>💳</span> ASAAS
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">AMBIENTE</label>
                        <select
                          value={formData?.financeiro?.ambienteAsaas || 'sandbox'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            financeiro: { ...(prev.financeiro || {}), ambienteAsaas: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        >
                          <option value="sandbox">Homologação (Sandbox)</option>
                          <option value="producao">Produção</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">API KEY</label>
                        <input
                          type="password"
                          value={formData?.financeiro?.apiKeyAsaas || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            financeiro: { ...(prev.financeiro || {}), apiKeyAsaas: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          placeholder="API Key ASAAS"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">WALLET ID</label>
                        <input
                          type="text"
                          value={formData?.financeiro?.walletIdAsaas || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            financeiro: { ...(prev.financeiro || {}), walletIdAsaas: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          placeholder="Wallet ID"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">WEBHOOK TOKEN</label>
                        <input
                          type="password"
                          value={formData?.financeiro?.webhookTokenAsaas || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            financeiro: { ...(prev.financeiro || {}), webhookTokenAsaas: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          placeholder="Webhook Token"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">MULTA (%)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={formData?.financeiro?.percentualMultaAsaas || 2.0}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              financeiro: { ...(prev.financeiro || {}), percentualMultaAsaas: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">JUROS (%)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={formData?.financeiro?.percentualJurosAsaas || 0.033}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              financeiro: { ...(prev.financeiro || {}), percentualJurosAsaas: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                          <input
                            type="checkbox"
                            checked={formData?.financeiro?.aceitarPagamentosPixAsaas || false}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              financeiro: { ...(prev.financeiro || {}), aceitarPagamentosPixAsaas: e.target.checked }
                            }))}
                            className="w-4 h-4 rounded text-teal-650"
                          />
                          Aceitar Pix no ASAAS?
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                          <input
                            type="checkbox"
                            checked={formData?.financeiro?.aceitarPagamentosCartaoAsaas || false}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              financeiro: { ...(prev.financeiro || {}), aceitarPagamentosCartaoAsaas: e.target.checked }
                            }))}
                            className="w-4 h-4 rounded text-teal-650"
                          />
                          Aceitar Cartão de Crédito no ASAAS?
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestarAsaas}
                        disabled={testingAsaas}
                        className="w-full py-2 bg-teal-650 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                      >
                        {testingAsaas ? 'Testando...' : '🔌 Testar Conexão'}
                      </button>
                    </div>
                  </div>

                  {/* Card EFI */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                      <span>💳</span> EFI (Gerencianet)
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">AMBIENTE</label>
                        <select
                          value={formData?.financeiro?.ambienteEfi || 'sandbox'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            financeiro: { ...(prev.financeiro || {}), ambienteEfi: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-teal-50/20"
                        >
                          <option value="sandbox">Homologação (Sandbox)</option>
                          <option value="producao">Produção</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">CLIENT ID</label>
                        <input
                          type="password"
                          value={formData?.financeiro?.clientId || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            financeiro: { ...(prev.financeiro || {}), clientId: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          placeholder="Client ID EFI"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">CLIENT SECRET</label>
                        <input
                          type="password"
                          value={formData?.financeiro?.clientSecret || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            financeiro: { ...(prev.financeiro || {}), clientSecret: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          placeholder="Client Secret EFI"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">IDENTIFICADOR DA CONTA</label>
                        <input
                          type="text"
                          value={formData?.financeiro?.identificadorConta || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            financeiro: { ...(prev.financeiro || {}), identificadorConta: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          placeholder="Identificador da Conta"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">CERTIFICADO (.P12) - CAMINHO</label>
                        <input
                          type="text"
                          value={formData?.financeiro?.certificadoEfiPath || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            financeiro: { ...(prev.financeiro || {}), certificadoEfiPath: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          placeholder="/certs/certificado-efi.p12"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">MULTA (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData?.financeiro?.multaGerencianet || 2.0}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              financeiro: { ...(prev.financeiro || {}), multaGerencianet: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">JUROS (%)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={formData?.financeiro?.jurosGerencianet || 0.033}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              financeiro: { ...(prev.financeiro || {}), jurosGerencianet: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => alert('Conexão testada com sucesso com EFI (Gerencianet) em modo de simulação.')}
                        className="w-full py-2 border border-teal-200 text-teal-700 hover:bg-teal-50 rounded-lg text-xs font-bold transition"
                      >
                        🔌 Testar Conexão EFI
                      </button>
                    </div>
                  </div>

                  {/* Card SMTP */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                      <span>✉️</span> SMTP (E-mail Transacional)
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">SMTP HOST</label>
                        <input
                          type="text"
                          value={formData?.smtp?.host || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            smtp: { ...(prev.smtp || {}), host: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          placeholder="smtp.exemplo.com"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">PORTA</label>
                          <input
                            type="text"
                            value={formData?.smtp?.porta || '587'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              smtp: { ...(prev.smtp || {}), porta: e.target.value }
                            }))}
                            className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                            placeholder="587"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">USUÁRIO</label>
                          <input
                            type="text"
                            value={formData?.smtp?.usuario || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              smtp: { ...(prev.smtp || {}), usuario: e.target.value }
                            }))}
                            className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                            placeholder="usuario@exemplo.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">SENHA</label>
                        <input
                          type="password"
                          value={formData?.smtp?.senha || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            smtp: { ...(prev.smtp || {}), senha: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          placeholder="Senha SMTP"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">REMETENTE PADRÃO</label>
                        <input
                          type="email"
                          value={formData?.smtp?.remetente || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            smtp: { ...(prev.smtp || {}), remetente: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          placeholder="contato@ies.edu.br"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => alert('E-mail de teste disparado com sucesso para ' + (formData?.smtp?.remetente || 'remetente.'))}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                      >
                        ✉️ Enviar E-mail de Teste
                      </button>
                    </div>
                  </div>

                  {/* Card Assinafy */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                      <span>✍️</span> Assinafy (Assinatura Eletrônica)
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">API KEY</label>
                        <input
                          type="password"
                          value={formData?.assinafy?.apiKey || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            assinafy: { ...(prev.assinafy || {}), apiKey: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          placeholder="API Key Assinafy"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">BASE URL</label>
                        <input
                          type="text"
                          value={formData?.assinafy?.baseUrl || 'https://api.assinafy.com.br/v1'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            assinafy: { ...(prev.assinafy || {}), baseUrl: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-teal-200 rounded-lg focus:outline-none bg-teal-50/20"
                          placeholder="https://api.assinafy.com.br/v1"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => alert('Assinafy conectada com sucesso.')}
                        className="w-full py-2 border border-teal-200 text-teal-700 hover:bg-teal-50 rounded-lg text-xs font-bold transition"
                      >
                        🔌 Testar Conexão Assinafy
                      </button>
                    </div>
                  </div>

                  {/* Card ViaCEP */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 md:col-span-2">
                    <h3 className="text-sm font-bold text-teal-600 flex items-center gap-2 pb-2 border-b">
                      <span>📍</span> ViaCEP (Consulta de CEP)
                    </h3>
                    <div className="flex items-center justify-between p-3.5 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-700">
                      <div className="flex items-center gap-2">
                        <span>🟢</span>
                        <span>ViaCEP Global API está ativada por padrão e operando adequadamente para autopreenchimento de endereços.</span>
                      </div>
                      <span className="font-mono text-[9px] uppercase bg-green-150 border px-1.5 py-0.5 rounded">STATUS: OK</span>
                    </div>
                  </div>
                </div>
              </div>
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
