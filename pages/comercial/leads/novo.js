import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ComercialLayout from '@/components/ComercialLayout';

const ORIGENS = ['', 'Instagram', 'Facebook', 'WhatsApp', 'Indicação', 'Site', 'Evento', 'Outros'];

// Máscara (99) 99999-9999
function maskPhone(value) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2)  return d.replace(/^(\d{0,2})/, '($1');
  if (d.length <= 7)  return d.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

function emailValido(v) {
  return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function NovoLead() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    whatsapp: '',
    email: '',
    curso_interesse: '',
    curso_id: '',
    origem: '',
    observacoes: '',
    status: 'novo',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [emailTocado, setEmailTocado] = useState(false);
  const [cursos, setCursos] = useState([]);

  useEffect(() => {
    fetch('/api/comercial/cursos', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCursos(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  const setPhone = (campo) => (e) => {
    setForm(f => ({ ...f, [campo]: maskPhone(e.target.value) }));
  };

  const setCurso = (e) => {
    const id = e.target.value;
    const c = cursos.find(c => String(c.id) === id);
    setForm(f => ({ ...f, curso_id: id, curso_interesse: c ? c.nome : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return; }
    if (!emailValido(form.email)) { setErro('E-mail inválido.'); setEmailTocado(true); return; }

    setSalvando(true);
    setErro(null);

    try {
      const res = await fetch('/api/comercial/leads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:            form.nome,
          telefone:        form.telefone,
          whatsapp:        form.whatsapp,
          email:           form.email,
          curso_interesse: form.curso_interesse,
          origem:          form.origem,
          observacoes:     form.observacoes,
          status:          form.status,
        }),
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

  const emailInvalido = emailTocado && !emailValido(form.email);
  const inputBase = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300';

  return (
    <ComercialLayout titulo="Novo Lead">
      <div className="max-w-xl w-full mx-auto">
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
              className={inputBase}
              required
            />
          </div>

          {/* Telefone e WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={form.telefone}
                onChange={setPhone('telefone')}
                placeholder="(99) 99999-9999"
                maxLength={15}
                className={inputBase}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={setPhone('whatsapp')}
                placeholder="(99) 99999-9999"
                maxLength={15}
                className={inputBase}
                inputMode="numeric"
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
              onBlur={() => setEmailTocado(true)}
              placeholder="email@exemplo.com"
              className={`${inputBase} ${emailInvalido ? 'border-red-400 focus:ring-red-300' : ''}`}
              inputMode="email"
            />
            {emailInvalido && (
              <p className="text-xs text-red-500 mt-1">Digite um e-mail válido.</p>
            )}
          </div>

          {/* Curso de Interesse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Curso de Interesse</label>
            {cursos.length > 0 ? (
              <select
                value={form.curso_id}
                onChange={setCurso}
                className={inputBase}
              >
                <option value="">Selecione o curso de interesse</option>
                {cursos.map(c => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nome}{c.nivelensino ? ` — ${c.nivelensino}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.curso_interesse}
                onChange={set('curso_interesse')}
                placeholder="Carregando cursos..."
                className={inputBase}
                readOnly={cursos.length === 0}
              />
            )}
          </div>

          {/* Origem e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
              <select
                value={form.origem}
                onChange={set('origem')}
                className={inputBase}
              >
                {ORIGENS.map(o => <option key={o} value={o}>{o || 'Selecionar...'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status inicial</label>
              <select
                value={form.status}
                onChange={set('status')}
                className={inputBase}
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
              className={`${inputBase} resize-none`}
            />
          </div>

          {/* Botões */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={salvando}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
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

