import { registrarInteracaoLead } from './interacao-service';

export async function registrarFollowUp(supabase, {
  lead_id,
  instituicao_id = null,
  usuario_id = null,
  tipo,
  assunto,
  observacao = '',
  data_agendada,
  prioridade = 'media',
  status = 'PENDENTE'
}) {
  try {
    const { data, error } = await supabase
      .from('leads_followups')
      .insert({
        lead_id,
        instituicao_id,
        usuario_id,
        tipo,
        assunto,
        observacao,
        data_agendada,
        prioridade,
        status
      })
      .select()
      .single();

    if (error) {
      console.warn('[followup-service] Tabela leads_followups ausente ou erro. Salvando no fallback...');
      await executarFallbackAgendamento(supabase, lead_id, { tipo, assunto, data_agendada, prioridade, observacao });
      return { status: 'FALLBACK', message: 'Agendado no fallback de observações.' };
    }

    return { status: 'SUCESSO', data };
  } catch (err) {
    console.error('[followup-service] Erro geral:', err.message);
    await executarFallbackAgendamento(supabase, lead_id, { tipo, assunto, data_agendada, prioridade, observacao });
    return { status: 'FALLBACK', error: err.message };
  }
}

export async function concluirFollowUp(supabase, followupId, {
  lead_id,
  instituicao_id = null,
  usuario_id = null,
  observacao_conclusao = ''
}) {
  try {
    let finalLeadId = lead_id;
    let finalInstId = instituicao_id;
    let finalUserId = usuario_id;
    let followup = null;

    if (followupId && String(followupId).length > 10) {
      const { data } = await supabase
        .from('leads_followups')
        .select('*')
        .eq('id', followupId)
        .maybeSingle();
      if (data) {
        followup = data;
        finalLeadId = data.lead_id;
        finalInstId = data.instituicao_id;
        finalUserId = data.usuario_id || usuario_id;
      }
    }

    const concluidoEm = new Date().toISOString();

    if (followupId && String(followupId).length > 10) {
      const { error } = await supabase
        .from('leads_followups')
        .update({
          status: 'CONCLUÍDO',
          concluido_em: concluidoEm,
          observacao: followup?.observacao 
            ? `${followup.observacao}\n\n[CONCLUÍDO EM ${new Date(concluidoEm).toLocaleString('pt-BR')}]: ${observacao_conclusao}`
            : `[CONCLUÍDO]: ${observacao_conclusao}`
        })
        .eq('id', followupId);

      if (error) throw error;
    } else {
      // Concluir no fallback
      await executarFallbackConclusao(supabase, finalLeadId, followupId, observacao_conclusao);
    }

    // Registrar na timeline automaticamente
    const descricaoTimeline = `Follow-up concluído com sucesso. Assunto: ${followup?.assunto || 'Contato comercial'}. ${observacao_conclusao ? `Retorno: "${observacao_conclusao}"` : ''}`;
    await registrarInteracaoLead(supabase, finalLeadId, {
      instituicao_id: finalInstId,
      usuario_id: finalUserId,
      tipo: followup?.tipo || 'observacao',
      titulo: 'Follow-up Concluído',
      descricao: descricaoTimeline
    });

    return { status: 'SUCESSO' };
  } catch (err) {
    console.error('[followup-service] Erro ao concluir:', err.message);
    return { status: 'ERRO', error: err.message };
  }
}

// Fallback de Agendamento
async function executarFallbackAgendamento(supabase, leadId, { tipo, assunto, data_agendada, prioridade, observacao }) {
  try {
    const { data: lead } = await supabase.from('leads').select('observacoes').eq('id', leadId).single();
    if (lead) {
      const obs = lead.observacoes || '';
      const agendaData = {
        id: `f_${Date.now()}`,
        tipo,
        assunto,
        data_agendada,
        prioridade,
        observacao,
        status: 'PENDENTE'
      };
      const updatedObs = `${obs}\n\n[FOLLOWUP_AGENDADO]\n${JSON.stringify(agendaData, null, 2)}`;
      await supabase.from('leads').update({ observacoes: updatedObs, updated_at: new Date().toISOString() }).eq('id', leadId);
    }
  } catch (e) {
    console.error('[followup-service-fallback] Erro:', e.message);
  }
}

// Fallback de Conclusão
async function executarFallbackConclusao(supabase, leadId, fakeId, observacao_conclusao) {
  try {
    const { data: lead } = await supabase.from('leads').select('observacoes').eq('id', leadId).single();
    if (lead && lead.observacoes) {
      let obs = lead.observacoes;
      const marker = '[FOLLOWUP_AGENDADO]';
      // Localiza o bloco de fallback correspondente e o marca como CONCLUÍDO
      if (obs.includes(fakeId)) {
        const parts = obs.split(marker);
        const updatedParts = parts.map(part => {
          if (part.includes(fakeId)) {
            return part
              .replace('"status": "PENDENTE"', '"status": "CONCLUÍDO"')
              .replace('}', `,\n  "concluido_em": "${new Date().toISOString()}",\n  "retorno": "${observacao_conclusao}"\n}`);
          }
          return part;
        });
        obs = updatedParts.join(marker);
      }
      await supabase.from('leads').update({ observacoes: obs, updated_at: new Date().toISOString() }).eq('id', leadId);
    }
  } catch (e) {
    console.error('[followup-service-fallback] Erro conclusão:', e.message);
  }
}
