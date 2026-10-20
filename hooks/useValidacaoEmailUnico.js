import { useState, useEffect, useRef, useCallback } from 'react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Hook reutilizável para validação imediata de e-mail único.
 *
 * @param {object} params
 * @param {string} params.initialEmail - E-mail inicial (ex: na edição)
 * @param {number|string|null} [params.alunoId] - ID do aluno atual para ignorar o próprio registro na edição
 * @param {number|string|null} [params.usuarioId] - ID do usuário vinculado se houver
 * @param {number} [params.debounceMs] - Tempo de debounce em ms (padrão 500ms, dentro de 400-600ms)
 * @param {function} [params.onEmailChange] - Callback opcional disparado quando o e-mail mudar
 */
export function useValidacaoEmailUnico({
  initialEmail = '',
  alunoId = null,
  usuarioId = null,
  debounceMs = 500,
  onEmailChange = null
} = {}) {
  const [email, setEmail] = useState(initialEmail || '');
  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'duplicate' | 'invalid' | 'error'
  const [mensagemErro, setMensagemErro] = useState('');
  const [emailVerificado, setEmailVerificado] = useState(null);

  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const ultimoValorVerificadoRef = useRef(null);

  // Manter refs de ids para evitar recriação desnecessária de callbacks
  const alunoIdRef = useRef(alunoId);
  const usuarioIdRef = useRef(usuarioId);

  useEffect(() => {
    alunoIdRef.current = alunoId;
    usuarioIdRef.current = usuarioId;
  }, [alunoId, usuarioId]);

  // Atualizar e-mail inicial quando mudar externamente (ex: carregamento assíncrono do aluno)
  useEffect(() => {
    if (initialEmail && initialEmail !== email && status === 'idle') {
      setEmail(initialEmail);
      ultimoValorVerificadoRef.current = initialEmail.trim().toLowerCase();
      setEmailVerificado(initialEmail.trim().toLowerCase());
      setStatus('available');
    }
  }, [initialEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const executarValidacao = useCallback(async (valorBruto) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const valorTratado = String(valorBruto || '').trim();
    const emailNormalizado = valorTratado.toLowerCase();

    // Campo vazio: não gera erro de duplicidade
    if (!valorTratado) {
      setStatus('idle');
      setMensagemErro('');
      setEmailVerificado(null);
      ultimoValorVerificadoRef.current = null;
      return;
    }

    // Formato inválido básico: não dispara request para o backend
    if (!EMAIL_REGEX.test(valorTratado)) {
      setStatus('invalid');
      setMensagemErro('Informe um formato de e-mail válido (ex: email@exemplo.com).');
      setEmailVerificado(null);
      return;
    }

    // Se já foi verificado e não mudou
    if (emailNormalizado === ultimoValorVerificadoRef.current && status !== 'error') {
      return;
    }

    setStatus('checking');
    setMensagemErro('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const params = new URLSearchParams({ email: valorTratado });
      if (alunoIdRef.current && alunoIdRef.current !== 'novo') {
        params.append('aluno_id', String(alunoIdRef.current));
      }
      if (usuarioIdRef.current) {
        params.append('usuario_id', String(usuarioIdRef.current));
      }

      const res = await fetch(`/api/recepcao/pre-cadastros/verificar-email?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMensagemErro(data.error || 'Não foi possível verificar o e-mail no momento. Tente novamente.');
        setEmailVerificado(null);
        return;
      }

      if (data.exists || !data.available) {
        setStatus('duplicate');
        setMensagemErro('Este e-mail já está cadastrado. Informe outro e-mail.');
        setEmailVerificado(null);
        ultimoValorVerificadoRef.current = emailNormalizado;
      } else {
        setStatus('available');
        setMensagemErro('');
        setEmailVerificado(emailNormalizado);
        ultimoValorVerificadoRef.current = emailNormalizado;
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[useValidacaoEmailUnico] Erro:', err);
      setStatus('error');
      setMensagemErro('Não foi possível verificar o e-mail no momento. Verifique sua conexão.');
      setEmailVerificado(null);
    }
  }, [status]);

  const agendarValidacao = useCallback((novoValor) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const valorTratado = String(novoValor || '').trim();

    if (!valorTratado) {
      setStatus('idle');
      setMensagemErro('');
      setEmailVerificado(null);
      ultimoValorVerificadoRef.current = null;
      return;
    }

    if (!EMAIL_REGEX.test(valorTratado)) {
      setStatus('invalid');
      setMensagemErro('Informe um formato de e-mail válido (ex: email@exemplo.com).');
      setEmailVerificado(null);
      return;
    }

    // Sinaliza verificação imediata para feedback visual fluido
    setStatus('checking');
    setMensagemErro('');

    debounceTimerRef.current = setTimeout(() => {
      executarValidacao(novoValor);
    }, debounceMs);
  }, [debounceMs, executarValidacao]);

  const handleChange = useCallback((e) => {
    const valor = typeof e === 'string' ? e : e?.target?.value ?? '';
    setEmail(valor);
    if (onEmailChange) onEmailChange(valor);
    agendarValidacao(valor);
  }, [agendarValidacao, onEmailChange]);

  const handleBlur = useCallback(() => {
    // Ao sair do campo (blur), executa imediatamente cancelando o debounce pendente
    executarValidacao(email);
  }, [email, executarValidacao]);

  const resetar = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setEmail('');
    setStatus('idle');
    setMensagemErro('');
    setEmailVerificado(null);
    ultimoValorVerificadoRef.current = null;
  }, []);

  // Determina se há impedimento para avançar/salvar:
  // - Está duplicado
  // - Está em verificação (não permite falso positivo)
  // - Houve erro na consulta
  // - Formato inválido se preenchido
  const temErro = status === 'duplicate' || status === 'error' || status === 'invalid';
  const estaVerificando = status === 'checking';
  const estaDisponivel = status === 'available';
  const bloqueiaAvanco = Boolean(email && email.trim() && (status === 'duplicate' || status === 'checking' || status === 'error' || status === 'invalid'));

  return {
    email,
    setEmail,
    status,
    mensagemErro,
    temErro,
    estaVerificando,
    estaDisponivel,
    bloqueiaAvanco,
    emailVerificado,
    handleChange,
    handleBlur,
    validarAgora: () => executarValidacao(email),
    resetar
  };
}
