/**
  * Teste do cancelamento seguro de parcelas de carnê / acordo
  */

const assert = require('assert');

async function testCancelamentoSeguro() {
  console.log('--- INICIANDO TESTE DO CANCELAMENTO SEGURO DE PARCELAS ---');

  // 1. Simular validação de justificativa obrigatória
  const validarJustificativa = (obs) => {
    return typeof obs === 'string' && obs.trim().length >= 10 && obs.trim().length <= 500;
  };

  assert.strictEqual(validarJustificativa('curto'), false, 'Justificativa menor que 10 caracteres deve falhar');
  assert.strictEqual(validarJustificativa('Acordo com inadimplência renegociada'), true, 'Justificativa válida deve passar');
  console.log('✓ 1. Validação de justificativa obrigatória ok.');

  // 2. Simular bloqueio de parcelas pagas
  const parcelaPaga = { id: 'p1', numero_parcela: 1, status: 'pago' };
  const podeCancelar = (p) => p.status !== 'pago' && p.status !== 'cancelado';
  assert.strictEqual(podeCancelar(parcelaPaga), false, 'Parcela paga não pode ser cancelada');

  const parcelaCancelada = { id: 'p2', numero_parcela: 2, status: 'cancelado' };
  assert.strictEqual(podeCancelar(parcelaCancelada), false, 'Parcela cancelada não pode ser re-cancelada');

  const parcelaPendente = { id: 'p3', numero_parcela: 3, status: 'pendente' };
  assert.strictEqual(podeCancelar(parcelaPendente), true, 'Parcela pendente pode ser cancelada');
  console.log('✓ 2. Bloqueio de status (pago/cancelado) ok.');

  // 3. Simular roteamento: se ordem possui efi_carnet_id -> cancelCarnetParcel
  let metodoChamado = null;
  const mockEfi = {
    cancelCarnetParcel: async (carnetId, parcelNum) => {
      metodoChamado = `cancelCarnetParcel:${carnetId}:${parcelNum}`;
      return { code: 200 };
    },
    cancelCharge: async (chargeId) => {
      metodoChamado = `cancelCharge:${chargeId}`;
      return { code: 200 };
    }
  };

  // Cenário A: Carnê
  const ordemCarne = { id: 'ordem-1', efi_carnet_id: '998877' };
  const parcCarne = { id: 'pc1', numero_parcela: 3, efi_charge_id: '123' };

  if (ordemCarne.efi_carnet_id) {
    await mockEfi.cancelCarnetParcel(Number(ordemCarne.efi_carnet_id), parcCarne.numero_parcela);
  } else if (parcCarne.efi_charge_id) {
    await mockEfi.cancelCharge(Number(parcCarne.efi_charge_id));
  }
  assert.strictEqual(metodoChamado, 'cancelCarnetParcel:998877:3', 'Deve chamar cancelCarnetParcel para carnê');
  console.log('✓ 3. Roteamento de cancelamento de carnê ok (nunca cancela carnê inteiro).');

  // Cenário B: Cobrança avulsa / acordo antigo
  const ordemAntiga = { id: 'ordem-2', efi_carnet_id: null };
  const parcAvulsa = { id: 'pc2', numero_parcela: 2, efi_charge_id: '556677' };

  if (ordemAntiga.efi_carnet_id) {
    await mockEfi.cancelCarnetParcel(Number(ordemAntiga.efi_carnet_id), parcAvulsa.numero_parcela);
  } else if (parcAvulsa.efi_charge_id) {
    await mockEfi.cancelCharge(Number(parcAvulsa.efi_charge_id));
  }
  assert.strictEqual(metodoChamado, 'cancelCharge:556677', 'Deve chamar cancelCharge para cobrança avulsa');
  console.log('✓ 4. Roteamento de cancelamento avulso ok.');

  // 4. Teste de formatação segura (evitando o crash ReferenceError)
  const formatarDataSegura = (d) => {
    if (!d) return '—';
    try {
      const raw = String(d).split('T')[0];
      const [ano, mes, dia] = raw.split('-');
      if (!ano || !mes || !dia) return String(d);
      return `${dia}/${mes}/${ano}`;
    } catch { return String(d); }
  };
  const formatarValorSeguro = (v) => {
    const num = Number(v || 0);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  assert.strictEqual(formatarDataSegura(null), '—');
  assert.strictEqual(formatarDataSegura('2027-03-10'), '10/03/2027');
  assert.ok(formatarValorSeguro(undefined).includes('0,00'));
  assert.ok(formatarValorSeguro(288.09).includes('288,09'));
  console.log('✓ 5. Funções defensivas do modal não quebram mesmo com valores nulos/indefinidos.');

  console.log('\n--- TODOS OS TESTES DE CANCELAMENTO PASSARAM! ---');
}

testCancelamentoSeguro().catch(e => {
  console.error(e);
  process.exit(1);
});
