import { useEffect, useMemo, useState } from 'react';
import AdminFinanceiroLayout from '@/components/AdminFinanceiro/Layout';

const initialForm = {
  nome: '',
  percentual: '',
  instituicaoId: '',
  cnpj: '',
  observacoes: '',
};

const formatPercentual = (value) => {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return '0,00%';
  return `${number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
};

const formatCnpj = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 14);
  if (!digits) return '';

  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export default function ConveniosFinanceiroPage() {
  const [convenios, setConvenios] = useState([]);
  const [instituicoes, setInstituicoes] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingInstituicoes, setLoadingInstituicoes] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState('');
  const [edicaoAtual, setEdicaoAtual] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const carregarConvenios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin-financeiro/convenios');
      if (!response.ok) {
        throw new Error('Falha ao carregar convênios');
      }
      const data = await response.json();
      setConvenios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert('Nao foi possivel carregar a lista de convênios.');
    } finally {
      setLoading(false);
    }
  };

  const carregarInstituicoes = async () => {
    try {
      setLoadingInstituicoes(true);
      const response = await fetch('/api/instituicoes');
      if (!response.ok) {
        throw new Error('Falha ao carregar instituicoes');
      }
      const data = await response.json();
      setInstituicoes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert('Nao foi possivel carregar instituicoes.');
    } finally {
      setLoadingInstituicoes(false);
    }
  };

  useEffect(() => {
    carregarConvenios();
    carregarInstituicoes();
  }, []);

  const conveniosFiltrados = useMemo(() => {
    const termo = filtro.trim().toLowerCase();
    if (!termo) return convenios;

    return convenios.filter((item) => {
      const nome = String(item.nome || '').toLowerCase();
      const cnpj = String(item.cnpj || '').toLowerCase();
      const instituicao = String(item.instituicaoNome || item.instituicaonome || '').toLowerCase();
      return nome.includes(termo) || cnpj.includes(termo) || instituicao.includes(termo);
    });
  }, [convenios, filtro]);

  const resumo = useMemo(() => {
    const total = convenios.length;
    const mediaPercentual =
      total === 0
        ? 0
        : convenios.reduce((acc, item) => acc + Number(item.percentual || 0), 0) / total;
    const totalInstituicoes = new Set(
      convenios
        .map((item) => item.instituicaoId || item.instituicaoid)
        .filter(Boolean)
    ).size;

    return { total, mediaPercentual, totalInstituicoes };
  }, [convenios]);

  const abrirNovo = () => {
    setEdicaoAtual(null);
    setFormData(initialForm);
    setModalAberto(true);
  };

  const abrirEdicao = (item) => {
    setEdicaoAtual(item);
    setFormData({
      nome: item.nome || '',
      percentual:
        item.percentual !== null && item.percentual !== undefined
          ? String(item.percentual).replace(',', '.')
          : '',
      instituicaoId: item.instituicaoId || item.instituicaoid || '',
      cnpj: item.cnpj || '',
      observacoes: item.observacoes || '',
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalAberto(false);
    setEdicaoAtual(null);
    setFormData(initialForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'cnpj' ? formatCnpj(value) : value,
    }));
  };

  const salvarConvenio = async (event) => {
    event.preventDefault();

    if (!formData.nome.trim()) {
      alert('Informe o nome do convênio.');
      return;
    }

    const percentual = Number(String(formData.percentual || '').replace(',', '.'));
    if (Number.isNaN(percentual) || percentual < 0 || percentual > 100) {
      alert('Informe um percentual valido entre 0 e 100.');
      return;
    }

    if (!formData.instituicaoId) {
      alert('Selecione uma instituicao.');
      return;
    }

    try {
      setSalvando(true);
      const endpoint = edicaoAtual
        ? `/api/admin-financeiro/convenios/${edicaoAtual.id}`
        : '/api/admin-financeiro/convenios';

      const response = await fetch(endpoint, {
        method: edicaoAtual ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          percentual,
          instituicaoId: formData.instituicaoId,
          cnpj: formData.cnpj,
          observacoes: formData.observacoes,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Falha ao salvar convênio');
      }

      fecharModal();
      await carregarConvenios();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Nao foi possivel salvar o convênio.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirConvenio = async (item) => {
    const confirmou = window.confirm(`Deseja excluir o convênio "${item.nome}"?`);
    if (!confirmou) return;

    try {
      setExcluindoId(item.id);
      const response = await fetch(`/api/admin-financeiro/convenios/${item.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || 'Falha ao excluir convênio');
      }

      await carregarConvenios();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Nao foi possivel excluir o convênio.');
    } finally {
      setExcluindoId('');
    }
  };

  return (
    <AdminFinanceiroLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Convênios</h2>
            <p className="text-gray-600">Cadastro e gestão de convênios financeiros</p>
          </div>
          <button
            onClick={abrirNovo}
            className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
          >
            ➕ Novo Convênio
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <input
            type="text"
            value={filtro}
            onChange={(event) => setFiltro(event.target.value)}
            placeholder="🔎 Buscar por nome, instituicao ou CNPJ..."
            className="w-full px-4 py-3 bg-white border border-teal-300 text-gray-800 rounded-lg placeholder-gray-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-teal-50 border-b border-teal-100">
                <th className="text-left px-6 py-4 text-sm font-semibold text-teal-800">Nome</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-teal-800">Percentual</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-teal-800">Instituição</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-teal-800">CNPJ</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-teal-800">Observações</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-teal-800">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                    Carregando convênios...
                  </td>
                </tr>
              ) : conveniosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                    Nenhum convênio encontrado.
                  </td>
                </tr>
              ) : (
                conveniosFiltrados.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-teal-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{item.nome}</td>
                    <td className="px-6 py-4 text-sm text-emerald-700 font-semibold">
                      {formatPercentual(item.percentual)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.instituicaoNome || item.instituicaonome || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.cnpj || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-sm truncate" title={item.observacoes || ''}>
                      {item.observacoes || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirEdicao(item)}
                          className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => excluirConvenio(item)}
                          disabled={excluindoId === item.id}
                          className="px-3 py-2 bg-gray-600 hover:bg-red-600 disabled:opacity-60 text-white rounded-md text-sm font-medium transition"
                        >
                          {excluindoId === item.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-gray-600 text-sm">Total de Convênios</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{resumo.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-gray-600 text-sm">Média de Percentual</p>
            <p className="text-2xl font-bold text-emerald-700 mt-2">{formatPercentual(resumo.mediaPercentual)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-gray-600 text-sm">Instituições com Convênio</p>
            <p className="text-2xl font-bold text-teal-700 mt-2">{resumo.totalInstituicoes}</p>
          </div>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45">
          <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {edicaoAtual ? 'Editar Convênio' : 'Novo Convênio'}
              </h3>
              <button
                onClick={fecharModal}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                aria-label="Fechar modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={salvarConvenio} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1 block">
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    maxLength={120}
                    required
                    className="w-full px-3 py-2 bg-white border border-teal-300 rounded-md text-gray-800 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1 block">
                    Percentual *
                  </label>
                  <input
                    type="number"
                    name="percentual"
                    value={formData.percentual}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 bg-white border border-teal-300 rounded-md text-gray-800 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1 block">
                    Instituição *
                  </label>
                  <select
                    name="instituicaoId"
                    value={formData.instituicaoId}
                    onChange={handleChange}
                    required
                    disabled={loadingInstituicoes}
                    className="w-full px-3 py-2 bg-white border border-teal-300 rounded-md text-gray-800 focus:outline-none focus:border-teal-500 disabled:opacity-60"
                  >
                    <option value="">
                      {loadingInstituicoes ? 'Carregando instituições...' : 'Selecione uma instituição'}
                    </option>
                    {instituicoes.map((instituicao) => (
                      <option key={instituicao.id} value={instituicao.id}>
                        {instituicao.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1 block">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 bg-white border border-teal-300 rounded-md text-gray-800 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1 block">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 bg-white border border-teal-300 rounded-md text-gray-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={salvando}
                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-60 text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold"
                >
                  {salvando ? 'Salvando...' : edicaoAtual ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminFinanceiroLayout>
  );
}
