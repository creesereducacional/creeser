/**
 * @file utils/constantes.js
 * @description Constantes globais do sistema CREESER
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Centraliza todas as constantes do sistema em um único lugar
 * para facilitar manutenção e reutilização
 */

// ========================================
// PAPÉIS (ROLES)
// ========================================

export const PAPEIS = {
  ADMIN: 'admin',
  PROFESSOR: 'professor',
  ALUNO: 'aluno',
  RESPONSAVEL: 'responsavel',
  FUNCIONARIO: 'funcionario',
  MATRICULADOR: 'matriculador',
};

export const PAPEIS_LABELS = {
  [PAPEIS.ADMIN]: 'Administrador',
  [PAPEIS.PROFESSOR]: 'Professor',
  [PAPEIS.ALUNO]: 'Aluno',
  [PAPEIS.RESPONSAVEL]: 'Responsável',
  [PAPEIS.FUNCIONARIO]: 'Funcionário',
  [PAPEIS.MATRICULADOR]: 'Matriculador',
};

// ========================================
// STATUS DE USUÁRIO
// ========================================

export const STATUS_USUARIO = {
  ATIVO: 'ativo',
  INATIVO: 'inativo',
  BLOQUEADO: 'bloqueado',
  PENDENTE: 'pendente',
};

export const STATUS_USUARIO_LABELS = {
  [STATUS_USUARIO.ATIVO]: 'Ativo',
  [STATUS_USUARIO.INATIVO]: 'Inativo',
  [STATUS_USUARIO.BLOQUEADO]: 'Bloqueado',
  [STATUS_USUARIO.PENDENTE]: 'Pendente',
};

export const STATUS_USUARIO_CORES = {
  [STATUS_USUARIO.ATIVO]: 'green',
  [STATUS_USUARIO.INATIVO]: 'gray',
  [STATUS_USUARIO.BLOQUEADO]: 'red',
  [STATUS_USUARIO.PENDENTE]: 'yellow',
};

// ========================================
// STATUS DE MATRÍCULA
// ========================================

export const STATUS_MATRICULA = {
  ATIVA: 'ativa',
  INATIVA: 'inativa',
  TRANCADA: 'trancada',
  CANCELADA: 'cancelada',
  PENDENTE: 'pendente',
};

export const STATUS_MATRICULA_LABELS = {
  [STATUS_MATRICULA.ATIVA]: 'Ativa',
  [STATUS_MATRICULA.INATIVA]: 'Inativa',
  [STATUS_MATRICULA.TRANCADA]: 'Trancada',
  [STATUS_MATRICULA.CANCELADA]: 'Cancelada',
  [STATUS_MATRICULA.PENDENTE]: 'Pendente',
};

// ========================================
// STATUS DE AVALIAÇÃO
// ========================================

export const STATUS_AVALIACAO = {
  PLANEJADA: 'planejada',
  ABERTA: 'aberta',
  EM_CORRECAO: 'em_correcao',
  CORRIGIDA: 'corrigida',
  PUBLICADA: 'publicada',
  CANCELADA: 'cancelada',
};

export const STATUS_AVALIACAO_LABELS = {
  [STATUS_AVALIACAO.PLANEJADA]: 'Planejada',
  [STATUS_AVALIACAO.ABERTA]: 'Aberta',
  [STATUS_AVALIACAO.EM_CORRECAO]: 'Em Correção',
  [STATUS_AVALIACAO.CORRIGIDA]: 'Corrigida',
  [STATUS_AVALIACAO.PUBLICADA]: 'Publicada',
  [STATUS_AVALIACAO.CANCELADA]: 'Cancelada',
};

// ========================================
// TIPOS DE GÊNERO
// ========================================

export const GENEROS = {
  MASCULINO: 'masculino',
  FEMININO: 'feminino',
  OUTRO: 'outro',
  NAO_INFORMADO: 'nao_informado',
};

export const GENEROS_LABELS = {
  [GENEROS.MASCULINO]: 'Masculino',
  [GENEROS.FEMININO]: 'Feminino',
  [GENEROS.OUTRO]: 'Outro',
  [GENEROS.NAO_INFORMADO]: 'Não Informado',
};

// ========================================
// TIPOS DE DOCUMENTO
// ========================================

export const TIPOS_DOCUMENTO = {
  RG: 'rg',
  CPF: 'cpf',
  CNPJ: 'cnpj',
  CTPS: 'ctps',
  CNH: 'cnh',
  PASSAPORTE: 'passaporte',
};

export const TIPOS_DOCUMENTO_LABELS = {
  [TIPOS_DOCUMENTO.RG]: 'RG',
  [TIPOS_DOCUMENTO.CPF]: 'CPF',
  [TIPOS_DOCUMENTO.CNPJ]: 'CNPJ',
  [TIPOS_DOCUMENTO.CTPS]: 'CTPS',
  [TIPOS_DOCUMENTO.CNH]: 'CNH',
  [TIPOS_DOCUMENTO.PASSAPORTE]: 'Passaporte',
};

// ========================================
// ESTADOS CIVIS
// ========================================

export const ESTADOS_CIVIS = {
  SOLTEIRO: 'solteiro',
  CASADO: 'casado',
  DIVORCIADO: 'divorciado',
  VIUVO: 'viuvo',
  UNIAO_ESTAVEL: 'uniao_estavel',
};

export const ESTADOS_CIVIS_LABELS = {
  [ESTADOS_CIVIS.SOLTEIRO]: 'Solteiro(a)',
  [ESTADOS_CIVIS.CASADO]: 'Casado(a)',
  [ESTADOS_CIVIS.DIVORCIADO]: 'Divorciado(a)',
  [ESTADOS_CIVIS.VIUVO]: 'Viúvo(a)',
  [ESTADOS_CIVIS.UNIAO_ESTAVEL]: 'União Estável',
};

// ========================================
// TIPOS DE ENDEREÇO
// ========================================

export const TIPOS_ENDERECO = {
  RESIDENCIAL: 'residencial',
  COMERCIAL: 'comercial',
  CORRESPONDENCIA: 'correspondencia',
};

export const TIPOS_ENDERECO_LABELS = {
  [TIPOS_ENDERECO.RESIDENCIAL]: 'Residencial',
  [TIPOS_ENDERECO.COMERCIAL]: 'Comercial',
  [TIPOS_ENDERECO.CORRESPONDENCIA]: 'Correspondência',
};

// ========================================
// REGIÕES (UF)
// ========================================

export const ESTADOS = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

// ========================================
// CONFIGURAÇÕES DE PAGINAÇÃO
// ========================================

export const PAGINACAO = {
  ITENS_POR_PAGINA_PADRAO: 10,
  ITENS_POR_PAGINA_OPCOES: [5, 10, 25, 50, 100],
  PAGINA_INICIAL: 1,
};

// ========================================
// LIMITES E VALIDAÇÕES
// ========================================

export const LIMITES = {
  NOME_MINIMO: 3,
  NOME_MAXIMO: 150,
  EMAIL_MAXIMO: 255,
  SENHA_MINIMA: 8,
  SENHA_MAXIMA: 128,
  TELEFONE_MINIMO: 10,
  TELEFONE_MAXIMO: 11,
  CPF_CARACTERES: 11,
  CNPJ_CARACTERES: 14,
  DESCRICAO_MAXIMA: 1000,
  BIO_MAXIMA: 500,
};

// ========================================
// CORES (TAILWIND)
// ========================================

export const CORES = {
  PRIMARIA: 'teal',
  SECUNDARIA: 'blue',
  SUCESSO: 'green',
  AVISO: 'yellow',
  PERIGO: 'red',
  INFO: 'cyan',
};

export const CORES_VARIANTS = {
  SUCESSO: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  AVISO: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  PERIGO: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  INFO: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
};

// ========================================
// ROTAS DO SISTEMA
// ========================================

export const ROTAS = {
  // Públicas
  HOME: '/',
  LOGIN: '/login',
  REGISTRO: '/registro',
  ESQUECEU_SENHA: '/esqueceu-senha',

  // Admin
  ADMIN: '/admin',
  ADMIN_ALUNOS: '/admin/alunos',
  ADMIN_PROFESSORES: '/admin/professores',
  ADMIN_CURSOS: '/admin/cursos',
  ADMIN_TURMAS: '/admin/turmas',
  ADMIN_AVALIACOES: '/admin/avaliacoes',
  ADMIN_USUARIOS: '/admin/usuarios',
  ADMIN_FUNCIONARIOS: '/admin/funcionarios',
  ADMIN_FINANCEIRO: '/admin/financeiro',

  // Professor
  PROFESSOR: '/professor',
  PROFESSOR_TURMAS: '/professor/turmas',
  PROFESSOR_AVALIACOES: '/professor/avaliacoes',
  PROFESSOR_FREQUENCIA: '/professor/frequencia',

  // Aluno
  ALUNO: '/aluno',
  ALUNO_NOTAS: '/aluno/notas',
  ALUNO_FALTAS: '/aluno/faltas',
  ALUNO_DOCUMENTOS: '/aluno/documentos',

  // Perfil
  PERFIL: '/perfil',
  CONFIGURACOES: '/configuracoes',
};

// ========================================
// MENSAGENS DO SISTEMA
// ========================================

export const MENSAGENS = {
  SUCESSO: 'Operação realizada com sucesso!',
  ERRO_GENERICO: 'Ocorreu um erro. Tente novamente.',
  ERRO_CONEXAO: 'Erro de conexão. Verifique sua internet.',
  ERRO_AUTENTICACAO: 'Falha na autenticação. Verifique suas credenciais.',
  ERRO_AUTORIZACAO: 'Você não tem permissão para acessar este recurso.',
  CAMPO_OBRIGATORIO: 'Este campo é obrigatório.',
  EMAIL_INVALIDO: 'Email inválido.',
  SENHA_FRACA: 'Senha muito fraca.',
  SENHAS_NAO_CONFEREM: 'As senhas não conferem.',
  USUARIO_JA_EXISTE: 'Usuário já registrado.',
  REGISTRADO_COM_SUCESSO: 'Registrado com sucesso! Verifique seu email.',
  ENVIADO_COM_SUCESSO: 'Enviado com sucesso!',
  DELETADO_COM_SUCESSO: 'Deletado com sucesso!',
  ATUALIZANDO: 'Atualizando...',
  SALVANDO: 'Salvando...',
  CARREGANDO: 'Carregando...',
  CONFIRMA_DELETAR: 'Tem certeza que deseja deletar este item?',
  CONFIRMA_ACAO: 'Confirma esta ação?',
};

// ========================================
// TIPOS DE NOTIFICAÇÃO
// ========================================

export const TIPOS_NOTIFICACAO = {
  SUCESSO: 'sucesso',
  ERRO: 'erro',
  AVISO: 'aviso',
  INFO: 'info',
};

// ========================================
// PERÍODO (ANO LETIVO)
// ========================================

export const PERIODOS = {
  PRIMEIRO_SEMESTRE: '1',
  SEGUNDO_SEMESTRE: '2',
  ANO_TODO: '0',
};

export const PERIODOS_LABELS = {
  [PERIODOS.PRIMEIRO_SEMESTRE]: '1º Semestre',
  [PERIODOS.SEGUNDO_SEMESTRE]: '2º Semestre',
  [PERIODOS.ANO_TODO]: 'Ano Todo',
};

// ========================================
// CONFIGURAÇÕES DE API
// ========================================

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 segundos
  RETRY_TENTATIVAS: 3,
  RETRY_DELAY: 1000, // 1 segundo
};

export default {
  PAPEIS,
  PAPEIS_LABELS,
  STATUS_USUARIO,
  STATUS_USUARIO_LABELS,
  STATUS_USUARIO_CORES,
  STATUS_MATRICULA,
  STATUS_MATRICULA_LABELS,
  STATUS_AVALIACAO,
  STATUS_AVALIACAO_LABELS,
  GENEROS,
  GENEROS_LABELS,
  TIPOS_DOCUMENTO,
  TIPOS_DOCUMENTO_LABELS,
  ESTADOS_CIVIS,
  ESTADOS_CIVIS_LABELS,
  TIPOS_ENDERECO,
  TIPOS_ENDERECO_LABELS,
  ESTADOS,
  PAGINACAO,
  LIMITES,
  CORES,
  CORES_VARIANTS,
  ROTAS,
  MENSAGENS,
  TIPOS_NOTIFICACAO,
  PERIODOS,
  PERIODOS_LABELS,
  API_CONFIG,
};
