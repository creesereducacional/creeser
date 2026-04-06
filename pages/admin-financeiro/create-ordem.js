import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';

export default function CreateOrdenPage() {
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
        // Preencher valor padrão com a mensalidade
        setForm(prev => ({
          ...prev,
          valor: data.valor_mensalidade || ''
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

      const payload = {
        aluno_id: Number(aluno_id),
        tipo: 'ordem_simples',
        descricao: form.descricao.trim(),
        referencia: form.referencia.trim() || null,
        valor_total: Number(form.valor),
        percentual_desconto: Number(form.percentual_desconto) || 0,
        valor_desconto: Number(form.valor) * ((Number(form.percentual_desconto) || 0) / 100),
        quantidade_parcelas: 1,
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
        throw new Error(data.message || 'Erro ao criar ordem');
      }

      setSucesso('✅ Ordem criada com sucesso!');
      setTimeout(() => {
        router.push('/admin-financeiro/ordens');
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar ordem:', error);
      setErro(error.message || 'Erro ao criar ordem');
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

  return (
    <AdminFinanceiroLayout>
      <div className="space-y-6 max-w-2xl">
        {/* HEADER */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Criar Ordem de Pagamento</h2>
          <p className="text-gray-600">Lançar uma ordem simples (1 boleto) para o aluno</p>
        </div>

        {/* INFORMAÇÕES DO ALUNO */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-teal-700 font-semibold">Aluno</p>
              <p className="text-lg font-bold text-teal-900">{aluno.nome}</p>
            </div>
            <div>
              <p className="text-sm text-teal-700 font-semibold">CPF</p>
              <p className="text-lg font-bold text-teal-900">{aluno.cpf}</p>
            </div>
            <div>
              <p className="text-sm text-teal-700 font-semibold">Email</p>
              <p className="text-sm text-teal-900">{aluno.email}</p>
            </div>
            <div>
              <p className="text-sm text-teal-700 font-semibold">Telefone</p>
              <p className="text-sm text-teal-900">{aluno.telefone_celular}</p>
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
              Descrição da Ordem *
            </label>
            <input
              type="text"
              name="descricao"
              value={form.descricao}
              onChange={handleInputChange}
              placeholder="Ex: Mensalidade - Abril/2026"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
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
              placeholder="Ex: Fatura #2026-001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Valor da Ordem (R$) *
            </label>
            <input
              type="number"
              name="valor"
              value={form.valor}
              onChange={handleInputChange}
              placeholder="0,00"
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
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
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
              />
              <div className="px-4 py-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600">Desconto:</p>
                <p className="text-lg font-bold text-gray-900">
                  R$ {(Number(form.valor) * ((Number(form.percentual_desconto) || 0) / 100)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Valor Final */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm text-emerald-700 font-semibold">Valor Final a Cobrar</p>
            <p className="text-3xl font-bold text-emerald-900 mt-1">
              R$ {valorFinal.toFixed(2)}
            </p>
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
              placeholder="Anotações adicionais sobre a ordem..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 font-semibold transition"
            >
              {salvando ? 'Criando...' : '✅ Criar Ordem'}
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
