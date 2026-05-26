import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ComercialLayout from '@/components/ComercialLayout';

const ORIGENS = ['', 'Instagram', 'Facebook', 'WhatsApp', 'Indicação', 'Site', 'Evento', 'Outros'];

export default function NovoLead() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    whatsapp: '',
    email: '',
    curso_interesse: '',
    origem: '',
    observacoes: '',
    status: 'novo',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return; }

    setSalvando(true);
    setErro(null);

    try {
      const res = await fetch('/api/comercial/leads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro ao salvar.'); return; }
      router.push(`/comercial/leads/${data.id}`);
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ComercialLayout titulo="Novo Lead">
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/comercial/leads">
            <span className="text-gray-400 hover:text-gray-600 cursor-pointer">← Voltar</span>
          </Link>
          <h2 className="text-xl font-bold text-gray-800">Novo Lead</h2>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">{erro}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={set('nome')}
              placeholder="Nome completo do lead"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>

          {/* Telefone e WhatsApp */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={form.telefone}
                onChange={set('telefone')}
                placeholder="(XX) XXXXX-XXXX"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={set('whatsapp')}
                placeholder="(XX) XXXXX-XXXX"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="email@exemplo.com"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Curso de interesse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Curso de Interesse</label>
            <input
              type="text"
              value={form.curso_interesse}
              onChange={set('curso_interesse')}
              placeholder="Ex: Técnico em Informática"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Origem e Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
              <select
                value={form.origem}
                onChange={set('origem')}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {ORIGENS.map(o => <option key={o} value={o}>{o || 'Selecionar...'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status inicial</label>
              <select
                value={form.status}
                onChange={set('status')}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="novo">Novo</option>
                <option value="contatado">Contatado</option>
                <option value="interessado">Interessado</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={set('observacoes')}
              rows={3}
              placeholder="Anotações importantes sobre o lead..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={salvando}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {salvando ? 'Salvando...' : 'Salvar Lead'}
            </button>
            <Link href="/comercial/leads">
              <button type="button" className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-5 py-2 rounded-lg text-sm transition-colors">
                Cancelar
              </button>
            </Link>
          </div>
        </form>
      </div>
    </ComercialLayout>
  );
}
