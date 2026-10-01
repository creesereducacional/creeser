import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ValidarCertificado() {
  const router = useRouter();
  const { codigo: codigoQuery } = router.query;

  const [codigoInput, setCodigoInput] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (codigoQuery) {
      setCodigoInput(codigoQuery);
      consultarCertificado(codigoQuery);
    }
  }, [codigoQuery]);

  const consultarCertificado = async (cod) => {
    if (!cod) return;
    setCarregando(true);
    setErro('');
    setResultado(null);

    try {
      const res = await fetch(`/api/certificados?codigo=${encodeURIComponent(cod.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Certificado não encontrado. Verifique o código digitado.');
      } else {
        setResultado(data);
      }
    } catch (err) {
      setErro('Erro ao conectar ao serviço de validação. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleValidar = (e) => {
    e.preventDefault();
    if (!codigoInput.trim()) return;
    consultarCertificado(codigoInput);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      {/* ── Header Institucional CREESER ───────────────────────────────── */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 py-4 px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <img src="/images/logo_creeser.png" alt="CREESER" className="h-8 sm:h-9 w-auto object-contain brightness-110" />
            </Link>
            <div className="hidden sm:block border-l border-slate-800 pl-3">
              <h1 className="text-xs font-bold uppercase tracking-wider text-teal-400">Validação Pública</h1>
              <p className="text-[11px] text-slate-400">Autenticidade de Certificados Digitais</p>
            </div>
          </div>

          <Link href="/">
            <button className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700/60 transition cursor-pointer">
              ← Voltar ao Início
            </button>
          </Link>
        </div>
      </header>

      {/* ── Conteúdo Central ───────────────────────────────────────────── */}
      <main className="max-w-xl mx-auto w-full p-4 sm:p-6 lg:p-8 my-auto space-y-6">
        <div className="bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-800">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-3xl mx-auto mb-3 border border-teal-500/30">
              🔍
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Validar Certificado Digital</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Informe o Código de Autenticidade para verificar a validade oficial do certificado emitido pelo Grupo Educacional CREESER.
            </p>
          </div>

          <form onSubmit={handleValidar} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">
                Código de Autenticidade
              </label>
              <input
                type="text"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                placeholder="EX: CREESER-2026-A8B9C0"
                className="w-full px-4 py-3.5 bg-slate-950 border-2 border-slate-700 rounded-2xl text-center font-mono font-black text-sm sm:text-base tracking-widest text-white uppercase focus:border-teal-500 focus:outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-gradient-to-r from-teal-500 to-[#00d09c] hover:opacity-95 text-slate-950 font-black py-3.5 rounded-2xl shadow-lg transition text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {carregando ? 'Consultando Base Oficial CREESER...' : 'Verificar Autenticidade'}
            </button>
          </form>

          {/* Mensagem de Erro */}
          {erro && (
            <div className="bg-rose-950/50 border-l-4 border-rose-500 p-4 rounded-r-xl text-xs sm:text-sm text-rose-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-rose-300">❌ Certificado Inválido ou Não Encontrado</p>
              <p className="text-slate-300 text-xs">{erro}</p>
            </div>
          )}

          {/* Resultado Positivo */}
          {resultado && (
            <div className="bg-emerald-950/40 border-2 border-emerald-500/80 rounded-2xl p-5 sm:p-6 text-emerald-100 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 border-b border-emerald-500/30 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl flex-shrink-0">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Certificado VÁLIDO e Autêntico</h3>
                  <p className="text-xs text-emerald-400">Emitido pelo Grupo Educacional CREESER</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Aluno(a) Certificado(a):</span>
                  <span className="text-sm font-black text-white">{resultado.alunoNome}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Curso / Disciplina:</span>
                  <span className="font-bold text-teal-300">{resultado.cursoTitulo}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Carga Horária:</span>
                    <span className="font-bold text-white">{resultado.cargaHoraria} Horas</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Data de Emissão:</span>
                    <span className="font-bold text-white">{new Date(resultado.dataEmissao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-500/20">
                  <span className="text-slate-400 block text-[11px] mb-1">Registro de Autenticidade:</span>
                  <span className="font-mono bg-slate-900 text-teal-300 px-3 py-1 rounded-lg border border-teal-500/40 font-bold inline-block">
                    {resultado.codigoValidacao}
                  </span>
                </div>
              </div>

              <Link href={`/certificado/${resultado.codigoValidacao}`}>
                <button className="w-full mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2 cursor-pointer">
                  <span>📜</span>
                  <span>Visualizar Documento Oficial Completo</span>
                </button>
              </Link>
            </div>
          )}

        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Grupo Educacional CREESER. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
