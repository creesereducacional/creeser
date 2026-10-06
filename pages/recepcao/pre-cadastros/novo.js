import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import RecepcaoLayout from '@/components/RecepcaoLayout';
import StatusBadge from '@/components/recepcao/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import { validarCPF } from '@/utils/validacoes';

// ── UF OPTIONS ────────────────────────────────────────────────────────
const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// ── MÁSCARAS ──────────────────────────────────────────────────────────
function maskCPF(v = '') {
  const d = String(v).replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskPhone(v = '') {
  const d = String(v).replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskRG(v = '') {
  return String(v).replace(/\D/g, '').slice(0, 14);
}

function maskAno(v = '') {
  return String(v).replace(/\D/g, '').slice(0, 4);
}

// ── ETAPAS DO WIZARD ──────────────────────────────────────────────────
const ETAPAS = [
  { n: 1, label: 'Dados Pessoais',              icon: '👤', desc: 'Identificação básica e foto' },
  { n: 2, label: 'Contatos e Endereço',         icon: '📍', desc: 'Telefones, e-mail e localização' },
  { n: 3, label: 'Responsáveis',                icon: '👥', desc: 'Legal, financeiro e filiação' },
  { n: 4, label: 'Dados Acadêmicos',            icon: '🎓', desc: 'Unidade, curso e turma' },
  { n: 5, label: 'Documentação',                icon: '📄', desc: 'Certidões, RG e histórico escolar' },
  { n: 6, label: 'Financeiro / Contrato',       icon: '💳', desc: 'Valores, condições e parcelas' },
  { n: 7, label: 'Conferência e Confirmação',   icon: '✅', desc: 'Revisão geral e salvamento' },
];

const inputCls = 'w-full px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688] bg-white transition-all text-slate-800 placeholder:text-slate-400';
const inputOk  = 'border-slate-200 hover:border-slate-300';
const inputErr = 'border-rose-400 bg-rose-50/50';
const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5';

export default function NovoPrecadastro() {
  const router = useRouter();

  // Etapa ativa do wizard (1 a 7)
  const [etapa, setEtapa] = useState(1);

  // Estado unificado do formulário
  const ESTADO_INICIAL = {
    // 1. Identificação Acadêmica
    instituicao_id: '',
    instituicao: '',
    cursoid: '',
    turmaid: '',
    anoLetivo: new Date().getFullYear().toString(),
    turnoIntegral: false,
    semestre: '',
    status: 'PRE_CADASTRO',

    // 2. Dados Pessoais
    nome: '',
    nomeSocial: false,
    apelido: '',
    cpf: '',
    data_nascimento: '',
    sexo: '',
    estadoCivil: '',
    nacionalidade: 'BRASILEIRA',
    naturalidade: '',
    ufNaturalidade: '',
    pessoaComDeficiencia: false,
    tipoDeficiencia: '',

    // 3. Contatos e Endereço
    email: '',
    telefone_celular: '',
    telefoneResidencial: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    complemento: '',

    // 4. Filiação e Responsáveis
    pai: '',
    mae: '',
    responsavel_nome: '',
    responsavel_cpf: '',
    responsavel_rg: '',
    responsavel_telefone: '',
    responsavel_parentesco: '',
    responsavel_financeiro_mesmo: true,
    financeiro_nome: '',
    financeiro_cpf: '',
    financeiro_rg: '',
    financeiro_telefone: '',
    financeiro_parentesco: '',

    // 5. Documentação
    rg: '',
    dataExpedicaoRG: '',
    orgaoExpedidorRG: 'SSP',
    ufRG: '',
    termo: '',
    folha: '',
    livro: '',
    nomeCartorio: '',
    tituloEleitoral: '',
    zonaEleitoral: '',
    secaoEleitoral: '',
    carteiraReservista: '',
    numeroRegistroConselho: '',
    tipoEscolaAnterior: '',
    paisOrigem: 'BRA - Brasil',
    estabelecimento: '',
    anoConclusao: '',
    enderecoDEM: '',
    municipioDEM: '',
    ufDEM: '',

    // 6. Dados Financeiros & Contrato
    planoFinanceiro: '',
    valor_matricula: '',
    valor_mensalidade: '',
    percentualDesconto: '',
    qtd_parcelas: '',
    diaPagamento: '',
    quantidadeMesesContrato: '',
    alunoBolsista: '',
    percentualBolsaEstudo: '',
    financiamentoEstudantil: '',
    percentualFinanciamento: '',
    cnpjBoleto: '',
    razaoSocialBoleto: '',

    // 7. Informações Adicionais
    religiao: '',
    laudoCid: '',
    indicacaoQuem: '',
    observacoes_adicionais: '',

    // Foto
    foto: null,
  };

  const [form, setForm] = useState(ESTADO_INICIAL);
  const [erros, setErros] = useState({});
  const [idade, setIdade] = useState(null);

  // Auxiliares de carregamento de opções
  const [instituicoes, setInstituicoes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [anosLetivos, setAnosLetivos] = useState([]);

  const [carregandoCursos, setCarregandoCursos] = useState(false);
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [duplicateId, setDuplicateId] = useState(null);
  const [verificandoCpf, setVerificandoCpf] = useState(false);

  // Upload de Foto
  const [fotoAluno, setFotoAluno] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  // Modal de Alertas/Avisos
  const [modalAlerta, setModalAlerta] = useState({ isOpen: false, title: '', message: '', type: 'error' });

  // ── Carregar contexto do usuário & opções iniciais ───────────────────
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const userInstId = data?.usuario?.instituicao_id;
        if (userInstId) {
          setForm(prev => ({
            ...prev,
            instituicao_id: String(userInstId)
          }));
          setInstituicoes([{ id: userInstId, nome: data?.usuario?.instituicao_nome || 'Instituição Atual' }]);
        } else {
          fetch('/api/comercial/instituicoes', { credentials: 'include' })
            .then(r => r.ok ? r.json() : [])
            .then(lista => {
              const list = Array.isArray(lista) ? lista : [];
              setInstituicoes(list);
              if (list.length === 1) {
                setForm(prev => ({
                  ...prev,
                  instituicao_id: String(list[0].id),
                  instituicao: list[0].nome || ''
                }));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    // Anos letivos
    fetch('/api/configuracoes/anos-letivos', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setAnosLetivos(data);
      })
      .catch(() => {});
  }, []);

  // ── Carregar Cursos quando instituicao_id muda ────────────────────────
  useEffect(() => {
    setCarregandoCursos(true);
    const url = form.instituicao_id
      ? `/api/comercial/cursos?instituicao_id=${form.instituicao_id}`
      : '/api/comercial/cursos';

    fetch(url, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCursos(Array.isArray(data) ? data : []))
      .catch(() => setCursos([]))
      .finally(() => setCarregandoCursos(false));
  }, [form.instituicao_id]);

  // ── Carregar Turmas quando cursoid ou instituicao_id muda ─────────────
  useEffect(() => {
    if (!form.cursoid) {
      setTurmas([]);
      setForm(prev => ({ ...prev, turmaid: '' }));
      return;
    }

    setCarregandoTurmas(true);
    const url = `/api/comercial/turmas?cursoid=${form.cursoid}${form.instituicao_id ? `&instituicao_id=${form.instituicao_id}` : ''}`;

    fetch(url, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setTurmas(Array.isArray(data) ? data : []))
      .catch(() => setTurmas([]))
      .finally(() => setCarregandoTurmas(false));
  }, [form.cursoid, form.instituicao_id]);

  // Atualizar valores financeiros padrão ao selecionar Turma (se a turma tiver mensalidade)
  useEffect(() => {
    if (!form.turmaid) return;
    const turmaSel = turmas.find(t => String(t.id) === String(form.turmaid));
    if (turmaSel && turmaSel.mensalidade && !form.valor_mensalidade) {
      setForm(prev => ({
        ...prev,
        valor_mensalidade: String(turmaSel.mensalidade)
      }));
    }
  }, [form.turmaid, turmas]);

  // ── Helpers de Estado e Formulário ────────────────────────────────────
  const setCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    if (erros[campo]) {
      setErros(prev => ({ ...prev, [campo]: null }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let parsedValue = type === 'checkbox' ? checked : value;

    if (type !== 'checkbox') {
      if (name === 'cpf' || name === 'responsavel_cpf' || name === 'financeiro_cpf') {
        parsedValue = maskCPF(value);
      } else if (name === 'telefone_celular' || name === 'telefoneResidencial' || name === 'responsavel_telefone' || name === 'financeiro_telefone') {
        parsedValue = maskPhone(value);
      } else if (name === 'rg' || name === 'responsavel_rg' || name === 'financeiro_rg') {
        parsedValue = maskRG(value);
      } else if (name === 'anoConclusao') {
        parsedValue = maskAno(value);
      } else if (['tituloEleitoral', 'zonaEleitoral', 'secaoEleitoral', 'carteiraReservista', 'numeroRegistroConselho'].includes(name)) {
        parsedValue = value.replace(/\D/g, '');
      }
    }

    setCampo(name, parsedValue);
  };

  function calcularIdade(dataNasc) {
    if (!dataNasc) return null;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let id = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      id--;
    }
    return id;
  }

  const handleDataNascimento = (val) => {
    setCampo('data_nascimento', val);
    const id = calcularIdade(val);
    setIdade(id);
  };

  // ── Checagem de CPF Duplicado ─────────────────────────────────────────
  const checarCpfDuplicado = async (cpfVal) => {
    const rawCpf = String(cpfVal || '').replace(/\D/g, '');
    if (rawCpf.length !== 11) return;

    if (!validarCPF(rawCpf)) {
      setModalAlerta({
        isOpen: true,
        title: 'CPF Inválido',
        message: 'O CPF informado contém dígitos verificadores incorretos. Por favor, revise o número digitado.',
        type: 'error'
      });
      setCampo('cpf', '');
      return;
    }

    setVerificandoCpf(true);
    try {
      const res = await fetch(`/api/recepcao/pre-cadastros/verificar-cpf?cpf=${encodeURIComponent(cpfVal.trim())}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.exists) {
        setErro(`Este CPF (${cpfVal}) já possui um cadastro no sistema (Aluno: ${data.aluno?.nome || 'Já existente'}).`);
        if (data.aluno?.id) setDuplicateId(data.aluno.id);
        setModalAlerta({
          isOpen: true,
          title: 'CPF Já Cadastrado',
          message: `Já existe um cadastro com este CPF para o aluno ${data.aluno?.nome || 'existente'}.`,
          type: 'error'
        });
      }
    } catch (e) {
      console.error('Erro ao verificar CPF:', e);
    } finally {
      setVerificandoCpf(false);
    }
  };

  const handleCpfBlur = () => {
    if (form.cpf && form.cpf.replace(/\D/g, '').length === 11) {
      checarCpfDuplicado(form.cpf);
    }
  };

  // ── Busca de Endereço por CEP ─────────────────────────────────────────
  const buscarEnderecoPorCEP = async (cepValue) => {
    const cleanCep = String(cepValue || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setErros(prev => ({ ...prev, cep: 'CEP não encontrado' }));
        return;
      }

      setForm(prev => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        uf: data.uf || prev.uf
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setCampo('cep', value);
    if (value.length === 8) {
      buscarEnderecoPorCEP(value);
    }
  };

  // ── Foto do Aluno ─────────────────────────────────────────────────────
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoAluno(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFotoSeNecessario = async () => {
    if (!fotoFile) {
      return form.foto || null;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('foto', fotoFile);

    const uploadRes = await fetch('/api/upload-foto', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!uploadRes.ok) {
      const errData = await uploadRes.json().catch(() => null);
      throw new Error(errData?.error || 'Falha ao fazer upload da foto');
    }

    const uploadData = await uploadRes.json();
    return uploadData.url || null;
  };

  // ── Validações por Etapa ──────────────────────────────────────────────
  const validarEtapa = (n) => {
    const e = {};

    if (n === 1) {
      // Dados Pessoais
      if (!form.nome?.trim()) e.nome = 'Nome completo é obrigatório.';
      if (form.cpf && form.cpf.replace(/\D/g, '').length !== 11) {
        e.cpf = 'CPF deve conter 11 dígitos.';
      }
      if (form.cpf && form.cpf.replace(/\D/g, '').length === 11 && !validarCPF(form.cpf.replace(/\D/g, ''))) {
        e.cpf = 'CPF inválido.';
      }
      if (!form.data_nascimento) {
        e.data_nascimento = 'Data de nascimento é obrigatória.';
      }
    } else if (n === 2) {
      // Contatos e Endereço
      if (!form.telefone_celular?.trim()) {
        e.telefone_celular = 'Telefone celular / WhatsApp é obrigatório.';
      }
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        e.email = 'E-mail informado é inválido.';
      }
    } else if (n === 3) {
      // Responsáveis (se menor de 18)
      if (idade !== null && idade < 18) {
        if (!form.responsavel_nome?.trim()) e.responsavel_nome = 'Nome do responsável legal é obrigatório para menor de idade.';
        if (!form.responsavel_cpf?.trim() || form.responsavel_cpf.replace(/\D/g, '').length !== 11) {
          e.responsavel_cpf = 'CPF do responsável legal deve ter 11 dígitos.';
        }
        if (!form.responsavel_telefone?.trim()) e.responsavel_telefone = 'Telefone do responsável legal é obrigatório.';
        if (!form.responsavel_parentesco?.trim()) e.responsavel_parentesco = 'Grau de parentesco é obrigatório.';

        if (!form.responsavel_financeiro_mesmo) {
          if (!form.financeiro_nome?.trim()) e.financeiro_nome = 'Nome do responsável financeiro é obrigatório.';
          if (!form.financeiro_cpf?.trim() || form.financeiro_cpf.replace(/\D/g, '').length !== 11) {
            e.financeiro_cpf = 'CPF do financeiro deve ter 11 dígitos.';
          }
          if (!form.financeiro_telefone?.trim()) e.financeiro_telefone = 'Telefone do financeiro é obrigatório.';
          if (!form.financeiro_parentesco?.trim()) e.financeiro_parentesco = 'Parentesco do financeiro é obrigatório.';
        }
      }
    } else if (n === 4) {
      // Dados Acadêmicos
      if (instituicoes.length > 1 && !form.instituicao_id) {
        e.instituicao_id = 'Selecione a instituição / unidade de atendimento.';
      }
      if (!form.cursoid) {
        e.cursoid = 'Curso de interesse é obrigatório.';
      }
    }

    setErros(e);
    return Object.keys(e).length === 0;
  };

  const avancar = () => {
    if (!validarEtapa(etapa)) return;
    setEtapa(prev => Math.min(prev + 1, ETAPAS.length));
  };

  const voltar = () => {
    setEtapa(prev => Math.max(prev - 1, 1));
  };

  // ── Submissão Final do Formulário ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarEtapa(1) || !validarEtapa(2) || !validarEtapa(3) || !validarEtapa(4)) {
      setModalAlerta({
        isOpen: true,
        title: 'Campos Obrigatórios Pendentes',
        message: 'Por favor, revise as etapas anteriores e preencha todos os campos obrigatórios.',
        type: 'error'
      });
      return;
    }

    setSalvando(true);
    setErro(null);
    setDuplicateId(null);

    try {
      // 1. Upload de foto se houver
      let fotoUrl = form.foto || null;
      if (fotoFile) {
        try {
          fotoUrl = await uploadFotoSeNecessario();
        } catch (uploadErr) {
          console.warn('Aviso: upload de foto falhou, continuando sem foto:', uploadErr);
        }
      }

      // 2. Montar payload completo reutilizando campos do cadastro completo de alunos
      const payload = {
        ...form,
        foto: fotoUrl,
        // Garantir compatibilidade institucional
        instituicao_id: form.instituicao_id || undefined,
        // Campos que a API de pré-cadastros espera
        cursoid: form.cursoid ? Number(form.cursoid) : undefined,
        turmaid: form.turmaid ? Number(form.turmaid) : undefined,
        valor_matricula: form.valor_matricula ? Number(form.valor_matricula) : undefined,
        valor_mensalidade: form.valor_mensalidade ? Number(form.valor_mensalidade) : undefined,
        qtd_parcelas: form.qtd_parcelas ? Number(form.qtd_parcelas) : undefined,
      };

      const res = await fetch('/api/recepcao/pre-cadastros', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Erro ao realizar o cadastro do aluno.');
        if (res.status === 409 && data.aluno_id) {
          setDuplicateId(data.aluno_id);
        }
        setModalAlerta({
          isOpen: true,
          title: 'Erro no Cadastro',
          message: data.error || 'Não foi possível salvar o cadastro do aluno. Verifique os dados.',
          type: 'error'
        });
        return;
      }

      setModalAlerta({
        isOpen: true,
        title: 'Cadastro Concluído',
        message: 'O aluno foi cadastrado com sucesso no CREESER!',
        type: 'success'
      });

      setTimeout(() => {
        router.push('/recepcao/pre-cadastros');
      }, 1500);
    } catch (err) {
      console.error('Erro de conexão ao salvar aluno:', err);
      setErro('Falha de conexão com o servidor.');
    } finally {
      setSalvando(false);
    }
  };

  // Nomes de referência para exibição na etapa de conferência
  const instNome  = instituicoes.find(i => String(i.id) === String(form.instituicao_id))?.nome || form.instituicao || '—';
  const cursoNome = cursos.find(c => String(c.id) === String(form.cursoid))?.nome || '—';
  const turmaNome = turmas.find(t => String(t.id) === String(form.turmaid))?.nome || 'Sem turma (provisório)';

  return (
    <RecepcaoLayout titulo="Novo Cadastro Completo de Aluno">
      <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">

        {/* ── 1. CABEÇALHO COM BREADCRUMB E AÇÕES ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
              <Link href="/recepcao/dashboard" className="hover:text-slate-600 transition">Recepção</Link>
              <span>›</span>
              <Link href="/recepcao/pre-cadastros" className="hover:text-slate-600 transition">Pré-Cadastros</Link>
              <span>›</span>
              <span className="text-slate-700 font-semibold">Novo Cadastro</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#009688] text-white flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
                👨‍🎓
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Novo Cadastro de Aluno
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-normal">
                  Fluxo unificado da recepção: dados pessoais, responsáveis, matrícula e contrato
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link href="/recepcao/pre-cadastros">
              <button
                type="button"
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition"
              >
                Voltar à Listagem
              </button>
            </Link>
          </div>
        </div>

        {/* ── 2. WIZARD PROGRESS STEPPER (7 ETAPAS) ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
            {ETAPAS.map((s) => {
              const ativo = etapa === s.n;
              const concluido = etapa > s.n;
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => {
                    // Permite voltar livremente para qualquer etapa já visitada
                    if (s.n < etapa || validarEtapa(etapa)) {
                      setEtapa(s.n);
                    }
                  }}
                  className={`flex flex-col items-center text-center p-2 rounded-xl transition-all border ${
                    ativo
                      ? 'bg-teal-50/80 border-[#009688] text-[#009688] shadow-2xs'
                      : concluido
                        ? 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                        : 'border-transparent text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-transform ${
                    ativo
                      ? 'bg-[#009688] text-white shadow-xs scale-105'
                      : concluido
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                  }`}>
                    {concluido ? '✓' : s.n}
                  </div>
                  <span className="text-[11px] font-bold leading-tight line-clamp-1">
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              Etapa {etapa} de {ETAPAS.length}: <span className="text-[#009688]">{ETAPAS[etapa - 1].label}</span>
            </span>
            <span className="hidden sm:inline text-slate-400">
              {ETAPAS[etapa - 1].desc}
            </span>
          </div>
        </div>

        {/* ── 3. ALERTA DE ERRO GERAL / CPF DUPLICADO ───────────────────────── */}
        {erro && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs sm:text-sm text-rose-700 space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{erro}</span>
            </p>
            {duplicateId && (
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/recepcao/pre-cadastros/${duplicateId}`}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  Abrir cadastro existente
                </Link>
                <button
                  type="button"
                  onClick={() => { setErro(null); setDuplicateId(null); }}
                  className="px-3.5 py-1.5 border border-rose-200 hover:bg-rose-100/50 text-rose-700 rounded-lg text-xs font-medium transition"
                >
                  Fechar alerta
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 4. CONTEÚDO DAS ETAPAS ────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ════════ ETAPA 1: DADOS PESSOAIS ════════ */}
          {etapa === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <span>👤</span>
                  <span>1. Dados Pessoais do Aluno</span>
                </div>
                <span className="text-xs text-slate-400 font-normal">Campos com * são obrigatórios</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome Completo */}
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nome Completo do Aluno *</label>
                  <input
                    type="text"
                    name="nome"
                    value={form.nome}
                    onChange={handleInputChange}
                    placeholder="Nome completo do aluno"
                    className={`${inputCls} ${erros.nome ? inputErr : inputOk}`}
                    autoFocus
                  />
                  {erros.nome && <p className="text-xs text-rose-600 mt-1">{erros.nome}</p>}
                </div>

                {/* Nome Social Checkbox + Apelido */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/60">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      name="nomeSocial"
                      checked={form.nomeSocial}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#009688] rounded focus:ring-[#009688]/30"
                    />
                    <span>Possui Nome Social ou Tratamento Específico?</span>
                  </label>

                  {form.nomeSocial && (
                    <div>
                      <input
                        type="text"
                        name="apelido"
                        value={form.apelido}
                        onChange={handleInputChange}
                        placeholder="Informe o Nome Social do aluno"
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>

                {/* CPF */}
                <div>
                  <label className={labelCls}>CPF do Aluno</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cpf"
                      value={form.cpf}
                      onChange={handleInputChange}
                      onBlur={handleCpfBlur}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={`${inputCls} ${erros.cpf ? inputErr : inputOk}`}
                    />
                    {verificandoCpf && (
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 animate-spin">⌛</span>
                    )}
                  </div>
                  {erros.cpf && <p className="text-xs text-rose-600 mt-1">{erros.cpf}</p>}
                </div>

                {/* Data de Nascimento */}
                <div>
                  <label className={labelCls}>
                    Data de Nascimento *
                    {idade !== null && (
                      <span className={`ml-2 font-semibold ${idade < 18 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        ({idade} anos — {idade < 18 ? 'Menor de idade ⚠️' : 'Maior de idade'})
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    name="data_nascimento"
                    value={form.data_nascimento}
                    onChange={e => handleDataNascimento(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className={`${inputCls} ${erros.data_nascimento ? inputErr : inputOk}`}
                  />
                  {erros.data_nascimento && <p className="text-xs text-rose-600 mt-1">{erros.data_nascimento}</p>}
                </div>

                {/* Sexo */}
                <div>
                  <label className={labelCls}>Sexo</label>
                  <select
                    name="sexo"
                    value={form.sexo}
                    onChange={handleInputChange}
                    className={inputCls}
                  >
                    <option value="">Selecione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                  </select>
                </div>

                {/* Estado Civil */}
                <div>
                  <label className={labelCls}>Estado Civil</label>
                  <select
                    name="estadoCivil"
                    value={form.estadoCivil}
                    onChange={handleInputChange}
                    className={inputCls}
                  >
                    <option value="">Selecione</option>
                    <option value="SOLTEIRO">Solteiro(a)</option>
                    <option value="CASADO">Casado(a)</option>
                    <option value="DIVORCIADO">Divorciado(a)</option>
                    <option value="VIÚVO">Viúvo(a)</option>
                  </select>
                </div>

                {/* Nacionalidade */}
                <div>
                  <label className={labelCls}>Nacionalidade</label>
                  <select
                    name="nacionalidade"
                    value={form.nacionalidade}
                    onChange={handleInputChange}
                    className={inputCls}
                  >
                    <option value="BRASILEIRA">Brasileira</option>
                    <option value="ESTRANGEIRA">Estrangeira</option>
                  </select>
                </div>

                {/* Naturalidade */}
                <div>
                  <label className={labelCls}>Naturalidade (Cidade / Estado)</label>
                  <input
                    type="text"
                    name="naturalidade"
                    value={form.naturalidade}
                    onChange={handleInputChange}
                    placeholder="Ex: Teresina-PI"
                    className={inputCls}
                  />
                </div>

                {/* Pessoa com Deficiência (PcD) */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        name="pessoaComDeficiencia"
                        checked={form.pessoaComDeficiencia}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-[#009688] rounded focus:ring-[#009688]/30"
                      />
                      <span>Pessoa com Deficiência (PcD)?</span>
                    </label>

                    {form.pessoaComDeficiencia && (
                      <select
                        name="tipoDeficiencia"
                        value={form.tipoDeficiencia}
                        onChange={handleInputChange}
                        className={inputCls}
                      >
                        <option value="">- Selecione a Deficiência -</option>
                        <option value="AUDITIVA">Auditiva</option>
                        <option value="VISUAL">Visual</option>
                        <option value="MOTORA">Motora</option>
                        <option value="INTELECTUAL">Intelectual</option>
                        <option value="MULTIPLA">Múltipla</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Foto do Aluno */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <label className={labelCls}>Foto 3x4 do Aluno (Opcional)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-[#009688] hover:file:bg-teal-100/70 cursor-pointer"
                    />
                    {fotoAluno && (
                      <div className="w-14 h-16 rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                        <img src={fotoAluno} alt="Preview Foto" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ ETAPA 2: CONTATOS E ENDEREÇO ════════ */}
          {etapa === 2 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <span>📍</span>
                  <span>2. Contatos e Localização</span>
                </div>
                <span className="text-xs text-slate-400 font-normal">Preenchimento automático via CEP</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Telefone / WhatsApp */}
                <div>
                  <label className={labelCls}>Telefone Celular / WhatsApp *</label>
                  <input
                    type="text"
                    name="telefone_celular"
                    value={form.telefone_celular}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className={`${inputCls} ${erros.telefone_celular ? inputErr : inputOk}`}
                    autoFocus
                  />
                  {erros.telefone_celular && <p className="text-xs text-rose-600 mt-1">{erros.telefone_celular}</p>}
                </div>

                {/* Telefone Fixo/Residencial */}
                <div>
                  <label className={labelCls}>Telefone Secundário / Residencial</label>
                  <input
                    type="text"
                    name="telefoneResidencial"
                    value={form.telefoneResidencial}
                    onChange={handleInputChange}
                    placeholder="(00) 0000-0000"
                    maxLength={15}
                    className={inputCls}
                  />
                </div>

                {/* E-mail */}
                <div className="sm:col-span-2">
                  <label className={labelCls}>E-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="email@exemplo.com"
                    className={`${inputCls} ${erros.email ? inputErr : inputOk}`}
                  />
                  {erros.email && <p className="text-xs text-rose-600 mt-1">{erros.email}</p>}
                </div>

                {/* CEP */}
                <div>
                  <label className={labelCls}>CEP (8 dígitos)</label>
                  <input
                    type="text"
                    name="cep"
                    value={form.cep}
                    onChange={handleCepChange}
                    placeholder="00000000"
                    maxLength={8}
                    className={`${inputCls} ${erros.cep ? inputErr : inputOk}`}
                  />
                  {erros.cep && <p className="text-xs text-rose-600 mt-1">{erros.cep}</p>}
                  <p className="text-[11px] text-slate-400 mt-1">💡 Preenche logradouro, bairro, cidade e UF automaticamente</p>
                </div>

                {/* Número */}
                <div>
                  <label className={labelCls}>Número</label>
                  <input
                    type="text"
                    name="numero"
                    value={form.numero}
                    onChange={handleInputChange}
                    placeholder="Nº ou S/N"
                    className={inputCls}
                  />
                </div>

                {/* Endereço / Logradouro */}
                <div className="sm:col-span-2">
                  <label className={labelCls}>Endereço (Rua, Av, Travessa)</label>
                  <input
                    type="text"
                    name="endereco"
                    value={form.endereco}
                    onChange={handleInputChange}
                    placeholder="Logradouro"
                    className={inputCls}
                  />
                </div>

                {/* Bairro */}
                <div>
                  <label className={labelCls}>Bairro</label>
                  <input
                    type="text"
                    name="bairro"
                    value={form.bairro}
                    onChange={handleInputChange}
                    placeholder="Bairro"
                    className={inputCls}
                  />
                </div>

                {/* Cidade */}
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    value={form.cidade}
                    onChange={handleInputChange}
                    placeholder="Cidade"
                    className={inputCls}
                  />
                </div>

                {/* UF */}
                <div>
                  <label className={labelCls}>Estado (UF)</label>
                  <select
                    name="uf"
                    value={form.uf}
                    onChange={handleInputChange}
                    className={inputCls}
                  >
                    <option value="">Selecione a UF</option>
                    {UF_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* Complemento */}
                <div>
                  <label className={labelCls}>Complemento</label>
                  <input
                    type="text"
                    name="complemento"
                    value={form.complemento}
                    onChange={handleInputChange}
                    placeholder="Apto, Bloco, Casa..."
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ════════ ETAPA 3: RESPONSÁVEIS LEGAL E FINANCEIRO ════════ */}
          {etapa === 3 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <span>👥</span>
                  <span>3. Filiação e Responsáveis (Legal e Financeiro)</span>
                </div>
                {idade !== null && idade < 18 ? (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    ⚠️ Menor de Idade: Responsável Obrigatório
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-normal">Opcional para maiores de 18 anos</span>
                )}
              </div>

              {/* Filiação Geral (Pai e Mãe) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nome da Mãe</label>
                  <input
                    type="text"
                    name="mae"
                    value={form.mae}
                    onChange={handleInputChange}
                    placeholder="Nome completo da mãe"
                    className={inputCls}
                    autoFocus
                  />
                </div>

                <div>
                  <label className={labelCls}>Nome do Pai</label>
                  <input
                    type="text"
                    name="pai"
                    value={form.pai}
                    onChange={handleInputChange}
                    placeholder="Nome completo do pai"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Responsável Legal */}
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>⚖️</span>
                  <span>Responsável Legal {idade !== null && idade < 18 ? '*' : '(se houver)'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Nome Completo do Responsável Legal</label>
                    <input
                      type="text"
                      name="responsavel_nome"
                      value={form.responsavel_nome}
                      onChange={handleInputChange}
                      placeholder="Nome do tutor, mãe, pai ou representante legal"
                      className={`${inputCls} ${erros.responsavel_nome ? inputErr : inputOk}`}
                    />
                    {erros.responsavel_nome && <p className="text-xs text-rose-600 mt-1">{erros.responsavel_nome}</p>}
                  </div>

                  <div>
                    <label className={labelCls}>CPF do Responsável Legal</label>
                    <input
                      type="text"
                      name="responsavel_cpf"
                      value={form.responsavel_cpf}
                      onChange={handleInputChange}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={`${inputCls} ${erros.responsavel_cpf ? inputErr : inputOk}`}
                    />
                    {erros.responsavel_cpf && <p className="text-xs text-rose-600 mt-1">{erros.responsavel_cpf}</p>}
                  </div>

                  <div>
                    <label className={labelCls}>RG do Responsável Legal</label>
                    <input
                      type="text"
                      name="responsavel_rg"
                      value={form.responsavel_rg}
                      onChange={handleInputChange}
                      placeholder="Somente números"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Telefone do Responsável Legal</label>
                    <input
                      type="text"
                      name="responsavel_telefone"
                      value={form.responsavel_telefone}
                      onChange={handleInputChange}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className={`${inputCls} ${erros.responsavel_telefone ? inputErr : inputOk}`}
                    />
                    {erros.responsavel_telefone && <p className="text-xs text-rose-600 mt-1">{erros.responsavel_telefone}</p>}
                  </div>

                  <div>
                    <label className={labelCls}>Grau de Parentesco</label>
                    <select
                      name="responsavel_parentesco"
                      value={form.responsavel_parentesco}
                      onChange={handleInputChange}
                      className={`${inputCls} ${erros.responsavel_parentesco ? inputErr : inputOk}`}
                    >
                      <option value="">— Selecione —</option>
                      <option value="MÃE">Mãe</option>
                      <option value="PAI">Pai</option>
                      <option value="AVÓ/AVÔ">Avó / Avô</option>
                      <option value="TIO/TIA">Tio / Tia</option>
                      <option value="TUTOR">Tutor Legal / Outro</option>
                    </select>
                    {erros.responsavel_parentesco && <p className="text-xs text-rose-600 mt-1">{erros.responsavel_parentesco}</p>}
                  </div>
                </div>

                {/* Checkbox: Responsável legal é também o responsável financeiro */}
                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                    <input
                      type="checkbox"
                      name="responsavel_financeiro_mesmo"
                      checked={form.responsavel_financeiro_mesmo}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#009688] rounded focus:ring-[#009688]/30"
                    />
                    <span>O Responsável Legal também é o Responsável Financeiro pelo contrato/pagamento?</span>
                  </label>
                </div>

                {/* Seção adicional do Responsável Financeiro se desmarcado */}
                {!form.responsavel_financeiro_mesmo && (
                  <div className="mt-3 p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-4">
                    <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>💳</span>
                      <span>Responsável Financeiro Específico</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Nome Completo do Responsável Financeiro *</label>
                        <input
                          type="text"
                          name="financeiro_nome"
                          value={form.financeiro_nome}
                          onChange={handleInputChange}
                          placeholder="Nome de quem assinará como pagador"
                          className={`${inputCls} ${erros.financeiro_nome ? inputErr : inputOk}`}
                        />
                        {erros.financeiro_nome && <p className="text-xs text-rose-600 mt-1">{erros.financeiro_nome}</p>}
                      </div>

                      <div>
                        <label className={labelCls}>CPF do Responsável Financeiro *</label>
                        <input
                          type="text"
                          name="financeiro_cpf"
                          value={form.financeiro_cpf}
                          onChange={handleInputChange}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          className={`${inputCls} ${erros.financeiro_cpf ? inputErr : inputOk}`}
                        />
                        {erros.financeiro_cpf && <p className="text-xs text-rose-600 mt-1">{erros.financeiro_cpf}</p>}
                      </div>

                      <div>
                        <label className={labelCls}>RG do Responsável Financeiro</label>
                        <input
                          type="text"
                          name="financeiro_rg"
                          value={form.financeiro_rg}
                          onChange={handleInputChange}
                          placeholder="RG do pagador"
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Telefone do Responsável Financeiro *</label>
                        <input
                          type="text"
                          name="financeiro_telefone"
                          value={form.financeiro_telefone}
                          onChange={handleInputChange}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                          className={`${inputCls} ${erros.financeiro_telefone ? inputErr : inputOk}`}
                        />
                        {erros.financeiro_telefone && <p className="text-xs text-rose-600 mt-1">{erros.financeiro_telefone}</p>}
                      </div>

                      <div>
                        <label className={labelCls}>Parentesco do Responsável Financeiro *</label>
                        <select
                          name="financeiro_parentesco"
                          value={form.financeiro_parentesco}
                          onChange={handleInputChange}
                          className={`${inputCls} ${erros.financeiro_parentesco ? inputErr : inputOk}`}
                        >
                          <option value="">— Selecione —</option>
                          <option value="MÃE">Mãe</option>
                          <option value="PAI">Pai</option>
                          <option value="AVÓ/AVÔ">Avó / Avô</option>
                          <option value="TIO/TIA">Tio / Tia</option>
                          <option value="OUTRO">Outro Representante</option>
                        </select>
                        {erros.financeiro_parentesco && <p className="text-xs text-rose-600 mt-1">{erros.financeiro_parentesco}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ ETAPA 4: DADOS ACADÊMICOS / MATRÍCULA ════════ */}
          {etapa === 4 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <span>🎓</span>
                  <span>4. Dados Acadêmicos & Matrícula</span>
                </div>
                <span className="text-xs text-slate-400 font-normal">Vínculo com Unidade, Curso e Turma</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Seleção de Instituição / Unidade */}
                {instituicoes.length > 1 && (
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Instituição / Unidade *</label>
                    <select
                      name="instituicao_id"
                      value={form.instituicao_id}
                      onChange={e => {
                        const sel = instituicoes.find(i => String(i.id) === e.target.value);
                        setForm(prev => ({
                          ...prev,
                          instituicao_id: e.target.value,
                          instituicao: sel?.nome || '',
                          cursoid: '',
                          turmaid: ''
                        }));
                      }}
                      className={`${inputCls} ${erros.instituicao_id ? inputErr : inputOk}`}
                      autoFocus
                    >
                      <option value="">— Selecione a Instituição / Unidade —</option>
                      {instituicoes.map(i => (
                        <option key={i.id} value={String(i.id)}>{i.nome}</option>
                      ))}
                    </select>
                    {erros.instituicao_id && <p className="text-xs text-rose-600 mt-1">{erros.instituicao_id}</p>}
                  </div>
                )}

                {/* Seleção de Curso */}
                <div className="sm:col-span-2">
                  <label className={labelCls}>
                    Curso de Interesse * {carregandoCursos && '(Carregando cursos...)'}
                  </label>
                  <select
                    name="cursoid"
                    value={form.cursoid}
                    onChange={e => {
                      setCampo('cursoid', e.target.value);
                      setCampo('turmaid', '');
                    }}
                    disabled={carregandoCursos || cursos.length === 0}
                    className={`${inputCls} ${erros.cursoid ? inputErr : inputOk} ${cursos.length === 0 ? 'opacity-50' : ''}`}
                  >
                    <option value="">— Selecione o Curso —</option>
                    {cursos.map(c => (
                      <option key={c.id} value={String(c.id)}>{c.nome}</option>
                    ))}
                  </select>
                  {erros.cursoid && <p className="text-xs text-rose-600 mt-1">{erros.cursoid}</p>}
                  {!carregandoCursos && cursos.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">Nenhum curso disponível para a unidade selecionada.</p>
                  )}
                </div>

                {/* Seleção de Turma */}
                <div className="sm:col-span-2">
                  <label className={labelCls}>
                    Turma {carregandoTurmas ? '(Carregando turmas...)' : turmas.length === 0 ? '(Nenhuma turma ativa)' : ''}
                  </label>
                  <select
                    name="turmaid"
                    value={form.turmaid}
                    onChange={handleInputChange}
                    disabled={!form.cursoid || carregandoTurmas}
                    className={inputCls}
                  >
                    <option value="">— Sem turma vinculada (pré-cadastro provisório) —</option>
                    {turmas.map(t => (
                      <option key={t.id} value={String(t.id)}>
                        {t.nome}{t.turno ? ` — ${t.turno}` : ''}
                        {t.mensalidade ? ` | Mensalidade: R$ ${Number(t.mensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                      </option>
                    ))}
                  </select>
                  {form.cursoid && turmas.length === 0 && !carregandoTurmas && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Nenhuma turma ativa encontrada para este curso. O aluno poderá ser vinculado a uma turma posteriormente.
                    </p>
                  )}
                </div>

                {/* Ano Letivo */}
                <div>
                  <label className={labelCls}>Ano Letivo</label>
                  <select
                    name="anoLetivo"
                    value={form.anoLetivo}
                    onChange={handleInputChange}
                    className={inputCls}
                  >
                    {anosLetivos.length > 0 ? (
                      anosLetivos.map(a => {
                        const valor = (a.nome ?? a.ano ?? '').toString();
                        return <option key={a.id || valor} value={valor}>{valor}</option>;
                      })
                    ) : (
                      <>
                        <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
                        <option value={(new Date().getFullYear() + 1).toString()}>{new Date().getFullYear() + 1}</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Semestre */}
                <div>
                  <label className={labelCls}>Semestre Letivo</label>
                  <select
                    name="semestre"
                    value={form.semestre}
                    onChange={handleInputChange}
                    className={inputCls}
                  >
                    <option value="">Selecione</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={String(n)}>{n}º Semestre</option>
                    ))}
                  </select>
                </div>

                {/* Turno Integral */}
                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      name="turnoIntegral"
                      checked={form.turnoIntegral}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#009688] rounded focus:ring-[#009688]/30"
                    />
                    <span>Regime / Turno Integral?</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ════════ ETAPA 5: DOCUMENTAÇÃO ════════ */}
          {etapa === 5 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <span>📄</span>
                  <span>5. Documentação & Histórico Escolar</span>
                </div>
                <span className="text-xs text-slate-400 font-normal">Certidões, RG e Ensino Médio</span>
              </div>

              {/* Documento de Identidade RG */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Número do RG</label>
                  <input
                    type="text"
                    name="rg"
                    value={form.rg}
                    onChange={handleInputChange}
                    placeholder="Somente números"
                    className={inputCls}
                    autoFocus
                  />
                </div>

                <div>
                  <label className={labelCls}>Órgão Expedidor</label>
                  <select
                    name="orgaoExpedidorRG"
                    value={form.orgaoExpedidorRG}
                    onChange={handleInputChange}
                    className={inputCls}
                  >
                    <option value="SSP">SSP</option>
                    <option value="PC">PC</option>
                    <option value="DETRAN">DETRAN</option>
                    <option value="OUTRO">OUTRO</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>UF do RG</label>
                  <select
                    name="ufRG"
                    value={form.ufRG}
                    onChange={handleInputChange}
                    className={inputCls}
                  >
                    <option value="">Selecione UF</option>
                    {UF_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Registro de Nascimento / Certidão */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  📜 Certidão de Nascimento / Registro Civil
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className={labelCls}>Termo</label>
                    <input
                      type="text"
                      name="termo"
                      value={form.termo}
                      onChange={handleInputChange}
                      placeholder="Termo"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Folha</label>
                    <input
                      type="text"
                      name="folha"
                      value={form.folha}
                      onChange={handleInputChange}
                      placeholder="Folha"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Livro</label>
                    <input
                      type="text"
                      name="livro"
                      value={form.livro}
                      onChange={handleInputChange}
                      placeholder="Livro"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nome do Cartório</label>
                    <input
                      type="text"
                      name="nomeCartorio"
                      value={form.nomeCartorio}
                      onChange={handleInputChange}
                      placeholder="Cartório"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Histórico Escolar / Ensino Médio */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  🏫 Conclusão do Ensino Médio (INEP / Censo)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Escola / Estabelecimento de Origem</label>
                    <input
                      type="text"
                      name="estabelecimento"
                      value={form.estabelecimento}
                      onChange={handleInputChange}
                      placeholder="Nome da escola anterior"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Ano de Conclusão</label>
                    <input
                      type="text"
                      name="anoConclusao"
                      value={form.anoConclusao}
                      onChange={handleInputChange}
                      placeholder="Ex: 2023"
                      maxLength={4}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Tipo de Escola Anterior</label>
                    <select
                      name="tipoEscolaAnterior"
                      value={form.tipoEscolaAnterior}
                      onChange={handleInputChange}
                      className={inputCls}
                    >
                      <option value="">Selecione</option>
                      <option value="PUBLICA">Pública</option>
                      <option value="PRIVADA">Privada</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Município da Escola</label>
                    <input
                      type="text"
                      name="municipioDEM"
                      value={form.municipioDEM}
                      onChange={handleInputChange}
                      placeholder="Cidade"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>UF da Escola</label>
                    <select
                      name="ufDEM"
                      value={form.ufDEM}
                      onChange={handleInputChange}
                      className={inputCls}
                    >
                      <option value="">Selecione UF</option>
                      {UF_OPTIONS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ ETAPA 6: DADOS FINANCEIROS & CONTRATO ════════ */}
          {etapa === 6 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <span>💳</span>
                  <span>6. Dados Financeiros & Contrato</span>
                </div>
                <span className="text-xs text-slate-400 font-normal">Valores e condições de cobrança</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Valor Matrícula */}
                <div>
                  <label className={labelCls}>Valor da Matrícula (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="valor_matricula"
                    value={form.valor_matricula}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={inputCls}
                    autoFocus
                  />
                </div>

                {/* Valor Mensalidade */}
                <div>
                  <label className={labelCls}>Valor da Mensalidade (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="valor_mensalidade"
                    value={form.valor_mensalidade}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>

                {/* Desconto */}
                <div>
                  <label className={labelCls}>Desconto (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="percentualDesconto"
                    value={form.percentualDesconto}
                    onChange={handleInputChange}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>

                {/* Qtd Parcelas */}
                <div>
                  <label className={labelCls}>Quantidade de Parcelas</label>
                  <input
                    type="number"
                    name="qtd_parcelas"
                    value={form.qtd_parcelas}
                    onChange={handleInputChange}
                    placeholder="Ex: 12"
                    className={inputCls}
                  />
                </div>

                {/* Dia do Pagamento */}
                <div>
                  <label className={labelCls}>Dia de Vencimento</label>
                  <select
                    name="diaPagamento"
                    value={form.diaPagamento}
                    onChange={handleInputChange}
                    className={inputCls}
                  >
                    <option value="">Selecione o Dia</option>
                    {[5, 10, 15, 20, 25].map(d => (
                      <option key={d} value={String(d)}>Dia {d}</option>
                    ))}
                  </select>
                </div>

                {/* Meses de Contrato */}
                <div>
                  <label className={labelCls}>Meses de Contrato</label>
                  <input
                    type="number"
                    name="quantidadeMesesContrato"
                    value={form.quantidadeMesesContrato}
                    onChange={handleInputChange}
                    placeholder="Ex: 12"
                    className={inputCls}
                  />
                </div>

                {/* Bolsa de Estudos */}
                <div>
                  <label className={labelCls}>Aluno Bolsista?</label>
                  <select
                    name="alunoBolsista"
                    value={form.alunoBolsista}
                    onChange={handleInputChange}
                    className={inputCls}
                  >
                    <option value="">Não</option>
                    <option value="SIM">Sim</option>
                  </select>
                </div>

                {/* Percentual Bolsa */}
                {form.alunoBolsista === 'SIM' && (
                  <div>
                    <label className={labelCls}>Percentual da Bolsa (%)</label>
                    <input
                      type="number"
                      name="percentualBolsaEstudo"
                      value={form.percentualBolsaEstudo}
                      onChange={handleInputChange}
                      placeholder="Ex: 50"
                      className={inputCls}
                    />
                  </div>
                )}

                {/* Indicação */}
                <div className="sm:col-span-2">
                  <label className={labelCls}>Houve Indicação? Origem</label>
                  <select
                    name="indicacaoQuem"
                    value={form.indicacaoQuem}
                    onChange={handleInputChange}
                    className={inputCls}
                  >
                    <option value="">Não informado</option>
                    <option value="ALUNO">Indicação de Aluno</option>
                    <option value="PROFESSOR">Indicação de Professor</option>
                    <option value="REDES_SOCIAIS">Redes Sociais</option>
                    <option value="COMERCIAL">Equipe Comercial</option>
                    <option value="OUTRO">Outro canal</option>
                  </select>
                </div>

                {/* Observações */}
                <div className="sm:col-span-3">
                  <label className={labelCls}>Observações Adicionais</label>
                  <textarea
                    rows={3}
                    name="observacoes_adicionais"
                    value={form.observacoes_adicionais}
                    onChange={handleInputChange}
                    placeholder="Informações relevantes para o financeiro ou secretaria acadêmica..."
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ════════ ETAPA 7: CONFERÊNCIA E CONFIRMAÇÃO ════════ */}
          {etapa === 7 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <span>✅</span>
                  <span>7. Conferência dos Dados & Confirmação Final</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Status gerado:</span>
                  <StatusBadge status="PRE_CADASTRO" size="sm" />
                </div>
              </div>

              {/* Grid Resumo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                {/* Card 1: Aluno & Contatos */}
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>👤</span> Aluno & Contato
                    </span>
                    <button
                      type="button"
                      onClick={() => setEtapa(1)}
                      className="text-xs text-[#009688] font-bold hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                  <p><strong className="text-slate-500">Nome:</strong> {form.nome || '—'}</p>
                  <p><strong className="text-slate-500">CPF:</strong> {form.cpf || '—'}</p>
                  <p><strong className="text-slate-500">Nascimento:</strong> {form.data_nascimento || '—'}</p>
                  <p><strong className="text-slate-500">WhatsApp:</strong> {form.telefone_celular || '—'}</p>
                  <p><strong className="text-slate-500">E-mail:</strong> {form.email || '—'}</p>
                </div>

                {/* Card 2: Endereço */}
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>📍</span> Endereço
                    </span>
                    <button
                      type="button"
                      onClick={() => setEtapa(2)}
                      className="text-xs text-[#009688] font-bold hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                  <p><strong className="text-slate-500">CEP:</strong> {form.cep || '—'}</p>
                  <p><strong className="text-slate-500">Logradouro:</strong> {form.endereco ? `${form.endereco}, ${form.numero || 'S/N'}` : '—'}</p>
                  <p><strong className="text-slate-500">Bairro:</strong> {form.bairro || '—'}</p>
                  <p><strong className="text-slate-500">Cidade/UF:</strong> {form.cidade ? `${form.cidade} - ${form.uf}` : '—'}</p>
                  <p><strong className="text-slate-500">Complemento:</strong> {form.complemento || '—'}</p>
                </div>

                {/* Card 3: Acadêmico */}
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>🎓</span> Acadêmico
                    </span>
                    <button
                      type="button"
                      onClick={() => setEtapa(4)}
                      className="text-xs text-[#009688] font-bold hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                  <p><strong className="text-slate-500">Unidade:</strong> {instNome}</p>
                  <p><strong className="text-slate-500">Curso:</strong> {cursoNome}</p>
                  <p><strong className="text-slate-500">Turma:</strong> {turmaNome}</p>
                  <p><strong className="text-slate-500">Ano Letivo:</strong> {form.anoLetivo || '—'}</p>
                </div>

                {/* Card 4: Responsáveis */}
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>👥</span> Responsáveis
                    </span>
                    <button
                      type="button"
                      onClick={() => setEtapa(3)}
                      className="text-xs text-[#009688] font-bold hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                  <p><strong className="text-slate-500">Resp. Legal:</strong> {form.responsavel_nome || 'O próprio aluno'}</p>
                  {form.responsavel_cpf && <p><strong className="text-slate-500">CPF Resp.:</strong> {form.responsavel_cpf}</p>}
                  <p><strong className="text-slate-500">Resp. Financeiro:</strong> {form.responsavel_financeiro_mesmo ? 'Mesmo que legal' : form.financeiro_nome || '—'}</p>
                  <p><strong className="text-slate-500">Mãe:</strong> {form.mae || '—'}</p>
                  <p><strong className="text-slate-500">Pai:</strong> {form.pai || '—'}</p>
                </div>

                {/* Card 5: Financeiro */}
                <div className="sm:col-span-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>💳</span> Condições Financeiras
                    </span>
                    <button
                      type="button"
                      onClick={() => setEtapa(6)}
                      className="text-xs text-[#009688] font-bold hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">Matrícula</span>
                      <span className="font-bold text-slate-800">
                        {form.valor_matricula ? `R$ ${Number(form.valor_matricula).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">Mensalidade</span>
                      <span className="font-bold text-slate-800">
                        {form.valor_mensalidade ? `R$ ${Number(form.valor_mensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">Parcelas</span>
                      <span className="font-bold text-slate-800">{form.qtd_parcelas || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">Vencimento</span>
                      <span className="font-bold text-slate-800">{form.diaPagamento ? `Dia ${form.diaPagamento}` : '—'}</span>
                    </div>
                  </div>
                  {form.observacoes_adicionais && (
                    <div className="mt-2 pt-2 border-t border-slate-200/50 text-xs text-slate-600">
                      <strong>Obs:</strong> {form.observacoes_adicionais}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 5. BARRA INFERIOR DE NAVEGAÇÃO ENTRE ETAPAS ──────────────────── */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={etapa > 1 ? voltar : () => router.push('/recepcao/pre-cadastros')}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-xs flex items-center gap-1.5"
            >
              <span>←</span>
              <span>{etapa > 1 ? 'Voltar' : 'Cancelar'}</span>
            </button>

            <div className="flex items-center gap-3">
              {etapa < ETAPAS.length ? (
                <button
                  type="button"
                  onClick={avancar}
                  className="px-6 py-2.5 bg-[#009688] hover:bg-[#00796B] text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Próximo Passo</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {salvando ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Salvando Aluno...</span>
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      <span>Salvar e Concluir Cadastro</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Modal de Alerta / Validação */}
        <ConfirmModal
          isOpen={modalAlerta.isOpen}
          onClose={() => setModalAlerta(prev => ({ ...prev, isOpen: false }))}
          title={modalAlerta.title}
          message={modalAlerta.message}
          type={modalAlerta.type}
        />
      </div>
    </RecepcaoLayout>
  );
}
