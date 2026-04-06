import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';

export default function CreateCarnePage() {
  const router = useRouter();
  const { aluno_id } = router.query;

  const [aluno, setAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    descricao: '',
    referencia: '',
    valor: '',
    percentual_desconto: '',
    quantidade_parcelas: 12,
    intervalo_dias: 30,
    data_vencimento: '',
    observacoes: ''
  });

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Carregar dados do aluno
  useEffect(() => {
    if (aluno_id) {
      carregarAluno();
    }
  }, [aluno_id]);

  const carregarAluno = async () => {
    try {
      const response = await fetch(`/api/admin-financeiro/alunos/${aluno_id}`);
      if (response.ok) {
        const data = await response.json();
        setAluno(data);
        // Preencher valores padrão
        setForm(prev => ({
          ...prev,
          valor: data.valor_mensalidade || '',
          quantidade_parcelas: data.qtd_parcelas || 12,
          intervalo_dias: 30
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar aluno:', error);
      setErro('Erro ao carregar dados do aluno');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calcularValorFinal = () => {
    const valor = Number(form.valor) || 0;
    const desconto = Number(form.percentual_desconto) || 0;
    const valorDesconto = valor * (desconto / 100);
    return valor - valorDesconto;
  };

  const calcularParcela = () => {
    const total = calcularValorFinal();
    const parcelas = Number(form.quantidade_parcelas) || 1;
    return total / parcelas;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setSucesso('');

    try {
      if (!form.descricao.trim()) {
        throw new Error('Descrição é obrigatória');
      }

      if (!form.valor || Number(form.valor) <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }

      if (!form.quantidade_parcelas || Number(form.quantidade_parcelas) < 1) {
        throw new Error('Quantidade de parcelas deve ser maior que 0');
      }

      if (!form.data_vencimento) {
        throw new Error('Data de vencimento da primeira parcela é obrigatória');
      }

      const payload = {
        aluno_id: Number(aluno_id),
        tipo: 'carne',
        descricao: form.descricao.trim(),
        referencia: form.referencia.trim() || null,
        valor_total: Number(form.valor),
        percentual_desconto: Number(form.percentual_desconto) || 0,
        valor_desconto: Number(form.valor) * ((Number(form.percentual_desconto) || 0) / 100),
        quantidade_parcelas: Number(form.quantidade_parcelas),
        intervalo_dias: Number(form.intervalo_dias) || 30,
        data_vencimento_primeira: form.data_vencimento,
        observacoes: form.observacoes.trim() || null,
        criado_por: 'financeiro'
      };

      const response = await fetch('/api/admin-financeiro/ordens/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao criar carnê');
      }

      const resultado = await response.json();
      setSucesso(`✅ Carnê criado com sucesso! ${resultado.total_parcelas} parcelas geradas.`);
      setTimeout(() => {
        router.push('/admin-financeiro/carnes');
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar carnê:', error);
      setErro(error.message || 'Erro ao criar carnê');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <AdminFinanceiroLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-gray-600">Carregando...</p>
        </div>
      </AdminFinanceiroLayout>
    );
  }

  if (!aluno) {
    return (
      <AdminFinanceiroLayout>
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-700 mb-4">Aluno não encontrado</p>
          <Link
            href="/admin-financeiro/alunos"
            className="inline-block px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Voltar para Alunos
          </Link>
        </div>
      </AdminFinanceiroLayout>
    );
  }

  const valorFinal = calcularValorFinal();
  const valorParcela = calcularParcela();

  return (
    <AdminFinanceiroLayout>
      <div className="space-y-6 max-w-2xl">
        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Criar Carnê de Pagamento</h2>
          <p className="text-gray-600">Gerar múltiplas parcelas para o aluno</p>
        </div>

        {/* INFORMAÇÕES DO ALUNO */}
        <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-cyan-700 font-semibold">Aluno</p>
              <p className="text-lg font-bold text-cyan-900">{aluno.nome}</p>
            </div>
            <div>
              <p className="text-sm text-cyan-700 font-semibold">CPF</p>
              <p className="text-lg font-bold text-cyan-900">{aluno.cpf}</p>
            </div>
            <div>
              <p className="text-sm text-cyan-700 font-semibold">Email</p>
              <p className="text-sm text-cyan-900">{aluno.email}</p>
            </div>
            <div>
              <p className="text-sm text-cyan-700 font-semibold">Telefone</p>
              <p className="text-sm text-cyan-900">{aluno.telefone_celular}</p>
            </div>
          </div>
        </div>

        {/* ALERTAS */}
        {erro && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {sucesso}
          </div>
        )}

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 rounded-xl p-6">
          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrição do Carnê *
            </label>
            <input
              type="text"
              name="descricao"
              value={form.descricao}
              onChange={handleInputChange}
              placeholder="Ex: Mensalidades - 2026"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Referência */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Referência (opcional)
            </label>
            <input
              type="text"
              name="referencia"
              value={form.referencia}
              onChange={handleInputChange}
              placeholder="Ex: Matrícula #2026"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Valor Total */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Valor Total do Carnê (R$) *
            </label>
            <input
              type="number"
              name="valor"
              value={form.valor}
              onChange={handleInputChange}
              placeholder="0,00"
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Desconto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Desconto (%) - opcional
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                name="percentual_desconto"
                value={form.percentual_desconto}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
                min="0"
                max="100"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
              />
              <div className="px-4 py-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600">Desconto:</p>
                <p className="text-lg font-bold text-gray-900">
                  R$ {(Number(form.valor) * ((Number(form.percentual_desconto) || 0) / 100)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Quantidade de Parcelas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantidade de Parcelas *
            </label>
            <input
              type="number"
              name="quantidade_parcelas"
              value={form.quantidade_parcelas}
              onChange={handleInputChange}
              placeholder="12"
              min="1"
              max="120"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Intervalo entre Parcelas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Intervalo entre Parcelas (dias)
            </label>
            <input
              type="number"
              name="intervalo_dias"
              value={form.intervalo_dias}
              onChange={handleInputChange}
              placeholder="30"
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Data Primeira Parcela */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Data de Vencimento (Primeira Parcela) *
            </label>
            <input
              type="date"
              name="data_vencimento"
              value={form.data_vencimento}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Resumo Financeiro */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-700 font-semibold">Valor Final Total</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                R$ {valorFinal.toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-4">
              <p className="text-sm text-cyan-700 font-semibold">Valor por Parcela</p>
              <p className="text-2xl font-bold text-cyan-900 mt-1">
                R$ {valorParcela.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleInputChange}
              placeholder="Anotações adicionais sobre o carnê..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 font-semibold transition"
            >
              {salvando ? 'Criando...' : '✅ Criar Carnê'}
            </button>
            <Link
              href="/admin-financeiro/alunos"
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-center transition"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </AdminFinanceiroLayout>
  );
}
