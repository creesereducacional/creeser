/**
 * @file utils/validacoes.js
 * @description Funções comuns de validação de dados
 * @author CREESER Development
 * @date 2026-01-22
 * 
 * Centraliza validações repetidas no projeto
 */

/**
 * Valida se email está em formato correto
 * 
 * @param {string} email - Email a validar
 * @returns {boolean} True se válido, False caso contrário
 * 
 * @example
 * validarEmail('usuario@email.com') // true
 * validarEmail('email-invalido') // false
 */
export function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida se CPF está em formato correto
 * 
 * @param {string} cpf - CPF a validar (com ou sem máscara)
 * @returns {boolean} True se válido, False caso contrário
 * 
 * @example
 * validarCPF('123.456.789-00') // verifica se válido
 * validarCPF('12345678900') // também aceita sem máscara
 */
export function validarCPF(cpf) {
  // remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');

  // verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) return false;

  // verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  // validação do primeiro dígito verificador
  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

  // validação do segundo dígito verificador
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

  return true;
}

/**
 * Valida se telefone está em formato correto
 * 
 * @param {string} telefone - Telefone a validar
 * @returns {boolean} True se válido, False caso contrário
 * 
 * @example
 * validarTelefone('(11) 98765-4321') // true
 * validarTelefone('11987654321') // true
 */
export function validarTelefone(telefone) {
  // remove caracteres não numéricos
  const telefoneLimpo = telefone.replace(/\D/g, '');

  // verifica se tem 10 ou 11 dígitos
  return telefoneLimpo.length === 10 || telefoneLimpo.length === 11;
}

/**
 * Valida se senha atende aos critérios de segurança
 * 
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * 
 * @param {string} senha - Senha a validar
 * @returns {Object} { valida: boolean, mensagens: Array }
 * 
 * @example
 * validarSenha('Abc1234!') // { valida: true, mensagens: [] }
 * validarSenha('abc') // { valida: false, mensagens: [...] }
 */
export function validarSenha(senha) {
  const mensagens = [];

  if (senha.length < 8) {
    mensagens.push('Mínimo 8 caracteres');
  }

  if (!/[A-Z]/.test(senha)) {
    mensagens.push('Pelo menos uma letra maiúscula');
  }

  if (!/[a-z]/.test(senha)) {
    mensagens.push('Pelo menos uma letra minúscula');
  }

  if (!/[0-9]/.test(senha)) {
    mensagens.push('Pelo menos um número');
  }

  return {
    valida: mensagens.length === 0,
    mensagens,
  };
}

/**
 * Valida se campo não está vazio
 * 
 * @param {string} valor - Valor a validar
 * @returns {boolean} True se não vazio, False caso contrário
 */
export function validarRequerido(valor) {
  return valor && valor.toString().trim() !== '';
}

/**
 * Valida comprimento mínimo de string
 * 
 * @param {string} valor - Valor a validar
 * @param {number} minimo - Comprimento mínimo
 * @returns {boolean} True se atende, False caso contrário
 */
export function validarComprimentoMinimo(valor, minimo = 3) {
  return valor && valor.toString().trim().length >= minimo;
}

/**
 * Valida comprimento máximo de string
 * 
 * @param {string} valor - Valor a validar
 * @param {number} maximo - Comprimento máximo
 * @returns {boolean} True se atende, False caso contrário
 */
export function validarComprimentoMaximo(valor, maximo = 255) {
  return !valor || valor.toString().trim().length <= maximo;
}

/**
 * Valida se valor é número
 * 
 * @param {any} valor - Valor a validar
 * @returns {boolean} True se é número, False caso contrário
 */
export function validarNumero(valor) {
  return !isNaN(parseFloat(valor)) && isFinite(valor);
}

/**
 * Valida se data está em formato válido
 * 
 * @param {string} data - Data no formato YYYY-MM-DD
 * @returns {boolean} True se válida, False caso contrário
 * 
 * @example
 * validarData('2026-01-22') // true
 * validarData('2026-13-32') // false
 */
export function validarData(data) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(data)) return false;

  const dataObjeto = new Date(data);
  return dataObjeto instanceof Date && !isNaN(dataObjeto);
}

/**
 * Valida se URL é válida
 * 
 * @param {string} url - URL a validar
 * @returns {boolean} True se válida, False caso contrário
 */
export function validarURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default {
  validarEmail,
  validarCPF,
  validarTelefone,
  validarSenha,
  validarRequerido,
  validarComprimentoMinimo,
  validarComprimentoMaximo,
  validarNumero,
  validarData,
  validarURL,
};
