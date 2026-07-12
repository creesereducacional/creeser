// Helper de Cálculos de Avaliações e Notas do CREESER ERP
// Local: c:\PROJETOS\creeser\lib\notas-calculo.js

export async function calcularNotasAluno(supabase, instituicaoId, cursoId, notasLancadas, frequencia) {
  // 1. Buscar a configuração aplicável (Curso -> Instituição -> Fallback Padrão)
  let config = null;
  let estrutura = [];

  // Tentar por Curso
  if (cursoId) {
    const { data, error } = await supabase
      .from('configuracoes_avaliacao')
      .select('*, avaliacoes_estrutura(*)')
      .eq('instituicao_id', instituicaoId)
      .eq('curso_id', cursoId)
      .maybeSingle();
    if (data && !error) {
      config = data;
      estrutura = data.avaliacoes_estrutura || [];
    }
  }

  // Tentar por Instituição (geral, onde curso_id é nulo)
  if (!config) {
    const { data, error } = await supabase
      .from('configuracoes_avaliacao')
      .select('*, avaliacoes_estrutura(*)')
      .eq('instituicao_id', instituicaoId)
      .is('curso_id', null)
      .maybeSingle();
    if (data && !error) {
      config = data;
      estrutura = data.avaliacoes_estrutura || [];
    }
  }

  // Se não encontrar nenhuma configuração, usar o Fallback Padrão: AP1, AP2, AP3 (pesos iguais)
  if (!config) {
    config = {
      media_minima_aprovacao: 6.00,
      media_minima_exame: 4.00,
      criterio_aprovacao: 'AMBOS',
      frequencia_minima_aprovacao: 75.00
    };
    estrutura = [
      { sigla: 'AP1', nome: 'AP1', peso: 0.3333, eh_recuperacao: false, eh_exame_final: false },
      { sigla: 'AP2', nome: 'AP2', peso: 0.3333, eh_recuperacao: false, eh_exame_final: false },
      { sigla: 'AP3', nome: 'AP3', peso: 0.3333, eh_recuperacao: false, eh_exame_final: false }
    ];
  }

  // Ordenar estrutura
  estrutura.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  // 2. Extrair notas do objeto notasLancadas
  const mapNotas = new Map();
  Object.entries(notasLancadas || {}).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') {
      mapNotas.set(k, parseFloat(v));
    }
  });

  // Calcular média parcial das avaliações normais (que não são recuperação nem exame final)
  let somaPesos = 0;
  let somaNotasPonderadas = 0;
  let temNotaNormal = false;

  const normais = estrutura.filter(e => !e.eh_recuperacao && !e.eh_exame_final);
  normais.forEach(e => {
    const n = mapNotas.get(e.sigla);
    if (n !== undefined) {
      const p = parseFloat(e.peso) || 0;
      somaPesos += p;
      somaNotasPonderadas += n * p;
      temNotaNormal = true;
    }
  });

  // Se não lançou nenhuma nota normal, situação continua CURSANDO
  if (!temNotaNormal) {
    return {
      ap1: mapNotas.get('AP1') ?? null,
      ap2: mapNotas.get('AP2') ?? null,
      ap3: mapNotas.get('AP3') ?? null,
      mediaProva: null,
      mediaFinal: null,
      situacao: 'CURSANDO',
      detalhes: Object.fromEntries(mapNotas)
    };
  }

  // Média prova/parcial
  let mediaProva = somaPesos > 0 ? parseFloat((somaNotasPonderadas / somaPesos).toFixed(2)) : 0;

  // Substituir pela recuperação se houver e for maior que a média anterior
  const recs = estrutura.filter(e => e.eh_recuperacao);
  recs.forEach(r => {
    const nRec = mapNotas.get(r.sigla);
    if (nRec !== undefined && nRec > mediaProva) {
      mediaProva = nRec; // A nota da recuperação passa a ser a média prova
    }
  });

  // Verificar limites de aprovação/exame/frequência
  const mediaMinAprov = parseFloat(config.media_minima_aprovacao);
  const mediaMinExame = parseFloat(config.media_minima_exame);
  const freqMin = parseFloat(config.frequencia_minima_aprovacao);

  let mediaFinal = mediaProva;
  let situacao = 'CURSANDO';

  // Verificar frequência do aluno
  const freqAluno = (frequencia !== null && frequencia !== undefined) ? parseFloat(frequencia) : 100.00;
  const reprovadoPorFalta = (config.criterio_aprovacao === 'FREQUENCIA' || config.criterio_aprovacao === 'AMBOS') && freqAluno < freqMin;

  if (reprovadoPorFalta) {
    situacao = 'REPROVADO';
  } else {
    if (config.criterio_aprovacao === 'FREQUENCIA') {
      situacao = 'APROVADO';
    } else {
      // Critério NOTA ou AMBOS
      if (mediaProva >= mediaMinAprov) {
        situacao = 'APROVADO';
      } else if (mediaProva < mediaMinExame) {
        situacao = 'REPROVADO';
      } else {
        // Situação: Exame Final
        situacao = 'EXAME_FINAL';
        const exame = estrutura.find(e => e.eh_exame_final);
        if (exame) {
          const nExame = mapNotas.get(exame.sigla);
          if (nExame !== undefined) {
            mediaFinal = parseFloat(((mediaProva + nExame) / 2).toFixed(2));
            if (mediaFinal >= mediaMinAprov) {
              situacao = 'APROVADO';
            } else {
              situacao = 'REPROVADO';
            }
          }
        }
      }
    }
  }

  // Sincronizar compatibilidade legada com colunas AP1, AP2, AP3
  const ap1 = mapNotas.get('AP1') ?? null;
  const ap2 = mapNotas.get('AP2') ?? null;
  const ap3 = mapNotas.get('AP3') ?? null;

  return {
    ap1,
    ap2,
    ap3,
    mediaProva,
    mediaFinal,
    situacao,
    detalhes: Object.fromEntries(mapNotas)
  };
}
