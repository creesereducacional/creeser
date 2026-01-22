/**
 * @file utils/formatadores.js
 * @description Funções comuns de formatação de dados para exibição
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Centraliza formatações repetidas no projeto para apresentação ao usuário
 */

/**
 * Formata data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
 * 
 * @param {string|Date} data - Data em formato ISO ou objeto Date
 * @param {string} formato - 'curto' (DD/MM/YY) ou 'longo' (DD/MM/YYYY)
 * @returns {string} Data formatada
 * 
 * @example
 * formatarData('2026-01-22') // '22/01/2026'
 * formatarData('2026-01-22', 'curto') // '22/01/26'
 * formatarData(new Date('2026-01-22')) // '22/01/2026'
 */
export function formatarData(data, formato = 'longo') {
  if (!data) return '';

  const dataObjeto = typeof data === 'string' ? new Date(data) : data;

  if (isNaN(dataObjeto.getTime())) return '';

  const dia = String(dataObjeto.getDate()).padStart(2, '0');
  const mes = String(dataObjeto.getMonth() + 1).padStart(2, '0');
  const ano = dataObjeto.getFullYear();

  if (formato === 'curto') {
    return `${dia}/${mes}/${String(ano).slice(-2)}`;
  }

  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata data e hora (ISO) para formato brasileiro
 * 
 * @param {string|Date} dataHora - Data e hora em formato ISO
 * @param {boolean} mostrarSegundos - Se deve mostrar segundos
 * @returns {string} Data e hora formatadas
 * 
 * @example
 * formatarDataHora('2026-01-22T14:30:45') // '22/01/2026 14:30'
 * formatarDataHora('2026-01-22T14:30:45', true) // '22/01/2026 14:30:45'
 */
export function formatarDataHora(dataHora, mostrarSegundos = false) {
  if (!dataHora) return '';

  const dataObjeto = typeof dataHora === 'string' ? new Date(dataHora) : dataHora;

  if (isNaN(dataObjeto.getTime())) return '';

  const dia = String(dataObjeto.getDate()).padStart(2, '0');
  const mes = String(dataObjeto.getMonth() + 1).padStart(2, '0');
  const ano = dataObjeto.getFullYear();
  const hora = String(dataObjeto.getHours()).padStart(2, '0');
  const minuto = String(dataObjeto.getMinutes()).padStart(2, '0');
  const segundo = String(dataObjeto.getSeconds()).padStart(2, '0');

  const dataParte = `${dia}/${mes}/${ano}`;
  const horaParte = mostrarSegundos ? `${hora}:${minuto}:${segundo}` : `${hora}:${minuto}`;

  return `${dataParte} ${horaParte}`;
}

/**
 * Formata CPF com máscara
 * 
 * @param {string} cpf - CPF sem formatação
 * @returns {string} CPF formatado como XXX.XXX.XXX-XX
 * 
 * @example
 * formatarCPF('12345678900') // '123.456.789-00'
 */
export function formatarCPF(cpf) {
  if (!cpf) return '';

  const cpfLimpo = cpf.replace(/\D/g, '');

  if (cpfLimpo.length !== 11) return cpf;

  return `${cpfLimpo.substring(0, 3)}.${cpfLimpo.substring(3, 6)}.${cpfLimpo.substring(
    6,
    9
  )}-${cpfLimpo.substring(9)}`;
}

/**
 * Formata telefone com máscara
 * 
 * @param {string} telefone - Telefone sem formatação
 * @returns {string} Telefone formatado como (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX
 * 
 * @example
 * formatarTelefone('11987654321') // '(11) 98765-4321'
 * formatarTelefone('1133334444') // '(11) 3333-4444'
 */
export function formatarTelefone(telefone) {
  if (!telefone) return '';

  const telefoneLimpo = telefone.replace(/\D/g, '');

  if (telefoneLimpo.length === 11) {
    return `(${telefoneLimpo.substring(0, 2)}) ${telefoneLimpo.substring(2, 7)}-${telefoneLimpo.substring(7)}`;
  } else if (telefoneLimpo.length === 10) {
    return `(${telefoneLimpo.substring(0, 2)}) ${telefoneLimpo.substring(2, 6)}-${telefoneLimpo.substring(6)}`;
  }

  return telefone;
}

/**
 * Formata valor como moeda brasileira (R$)
 * 
 * @param {number} valor - Valor numérico
 * @param {boolean} mostrarSimbolo - Se deve mostrar R$
 * @returns {string} Valor formatado como R$ 1.234,56
 * 
 * @example
 * formatarMoeda(1234.56) // 'R$ 1.234,56'
 * formatarMoeda(1234.56, false) // '1.234,56'
 */
export function formatarMoeda(valor, mostrarSimbolo = true) {
  if (valor === null || valor === undefined || isNaN(valor)) return 'R$ 0,00';

  const formatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);

  return mostrarSimbolo ? formatado : formatado.replace('R$ ', '');
}

/**
 * Formata número com separadores de milhares
 * 
 * @param {number} numero - Número a formatar
 * @param {number} casasDecimais - Número de casas decimais (0 se inteiro)
 * @returns {string} Número formatado
 * 
 * @example
 * formatarNumero(1234567.89) // '1.234.567,89'
 * formatarNumero(1234567, 0) // '1.234.567'
 */
export function formatarNumero(numero, casasDecimais = 2) {
  if (numero === null || numero === undefined || isNaN(numero)) return '0';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  }).format(numero);
}

/**
 * Formata percentual
 * 
 * @param {number} valor - Valor entre 0 e 100
 * @param {number} casasDecimais - Número de casas decimais
 * @returns {string} Percentual formatado como XX,XX%
 * 
 * @example
 * formatarPercentual(85.5) // '85,50%'
 * formatarPercentual(85.5, 0) // '86%'
 */
export function formatarPercentual(valor, casasDecimais = 2) {
  if (valor === null || valor === undefined || isNaN(valor)) return '0%';

  const numFormatado = formatarNumero(valor, casasDecimais);
  return `${numFormatado}%`;
}

/**
 * Trunca texto e adiciona reticências se necessário
 * 
 * @param {string} texto - Texto a truncar
 * @param {number} maxCaracteres - Número máximo de caracteres
 * @returns {string} Texto truncado
 * 
 * @example
 * truncarTexto('Texto bem longo demais...', 10) // 'Texto bem...'
 */
export function truncarTexto(texto, maxCaracteres = 50) {
  if (!texto || texto.length <= maxCaracteres) return texto;

  return `${texto.substring(0, maxCaracteres)}...`;
}

/**
 * Converte primeira letra para maiúscula
 * 
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto capitalizado
 * 
 * @example
 * capitalizarTexto('hello world') // 'Hello world'
 */
export function capitalizarTexto(texto) {
  if (!texto) return '';

  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Converte texto para maiúsculas (nome próprio)
 * 
 * @param {string} texto - Texto a converter
 * @returns {string} Texto em maiúsculas na primeira letra de cada palavra
 * 
 * @example
 * formatarNome('joão da silva') // 'João da Silva'
 */
export function formatarNome(texto) {
  if (!texto) return '';

  return texto
    .toLowerCase()
    .split(' ')
    .map((palavra) => {
      // palavras pequenas como "da", "de", "do" ficam minúsculas, exceto a primeira
      if (['da', 'de', 'do', 'e', 'a', 'o'].includes(palavra) && texto.indexOf(palavra) > 0) {
        return palavra;
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');
}

/**
 * Converte booleano para texto português
 * 
 * @param {boolean} valor - Valor booleano
 * @returns {string} 'Sim' ou 'Não'
 * 
 * @example
 * formatarBooleano(true) // 'Sim'
 * formatarBooleano(false) // 'Não'
 */
export function formatarBooleano(valor) {
  return valor ? 'Sim' : 'Não';
}

/**
 * Formata código de status para texto legível
 * 
 * @param {string} status - Status do sistema (em_progresso, concluido, cancelado, etc)
 * @returns {string} Status formatado para exibição
 * 
 * @example
 * formatarStatus('em_progresso') // 'Em Progresso'
 * formatarStatus('concluido') // 'Concluído'
 */
export function formatarStatus(status) {
  const mapa = {
    em_progresso: 'Em Progresso',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    pendente: 'Pendente',
    ativo: 'Ativo',
    inativo: 'Inativo',
    bloqueado: 'Bloqueado',
    recusado: 'Recusado',
    aprovado: 'Aprovado',
  };

  return mapa[status] || status;
}

/**
 * Remove caracteres especiais preservando acentos
 * 
 * @param {string} texto - Texto a limpar
 * @returns {string} Texto limpo
 */
export function removerCaracteresEspeciais(texto) {
  if (!texto) return '';

  return texto.replace(/[^a-zA-Z0-9áàâãéèêíïóôõöúçñ\s]/g, '');
}

export default {
  formatarData,
  formatarDataHora,
  formatarCPF,
  formatarTelefone,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  truncarTexto,
  capitalizarTexto,
  formatarNome,
  formatarBooleano,
  formatarStatus,
  removerCaracteresEspeciais,
};
