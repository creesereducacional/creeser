import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function CertificadoDocumento() {
  const router = useRouter();
  const { codigo } = router.query;

  const [certificado, setCertificado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (codigo) {
      carregarCertificado();
    }
  }, [codigo]);

  const carregarCertificado = async () => {
    setCarregando(true);
    setErro('');
    try {
      const res = await fetch(`/api/certificados?codigo=${codigo}`);
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Certificado não encontrado ou código de validação inválido.');
      } else {
        setCertificado(data);
      }
    } catch (err) {
      setErro('Erro ao carregar o certificado digital.');
    } finally {
      setCarregando(false);
    }
  };

  const handleImprimir = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-teal-400 font-semibold text-sm">Gerando Certificado Digital CREESER...</p>
        </div>
      </div>
    );
  }

  if (erro || !certificado) {
    return (
      <div className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center font-sans text-slate-100">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-700">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-bold text-white mb-2">Certificado Não Encontrado</h2>
          <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
            {erro || 'O código de autenticação informado não corresponde a nenhum certificado emitido pela plataforma.'}
          </p>
          <Link href="/validar-certificado">
            <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl transition text-xs sm:text-sm font-bold shadow-md cursor-pointer">
              ← Consultar Outro Código
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const dataFormatada = new Date(certificado.dataEmissao).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const urlValidacao = typeof window !== 'undefined'
    ? `${window.location.origin}/validar-certificado?codigo=${certificado.codigoValidacao}`
    : `https://portal.creeser.com.br/validar-certificado?codigo=${certificado.codigoValidacao}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(urlValidacao)}`;

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 print:p-0 print:bg-white flex flex-col items-center font-sans">
      
      {/* ── Barra de Ações Superior (Oculta na Impressão) ─────────────── */}
      <div className="max-w-4xl w-full flex flex-wrap justify-between items-center gap-3 mb-6 print:hidden">
        <Link href="/aluno/dashboard">
          <button className="bg-slate-900 border border-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition text-xs sm:text-sm flex items-center gap-2 shadow-sm cursor-pointer">
            <span>←</span>
            <span>Voltar ao Painel do Aluno</span>
          </button>
        </Link>

        <div className="flex items-center gap-3">
          <Link href={`/validar-certificado?codigo=${certificado.codigoValidacao}`}>
            <button className="bg-slate-800 border border-slate-700 text-teal-400 font-bold px-4 py-2.5 rounded-xl hover:bg-slate-750 transition text-xs sm:text-sm flex items-center gap-2 shadow-sm cursor-pointer">
              <span>🔍</span>
              <span>Validar Autenticidade</span>
            </button>
          </Link>
          <button
            onClick={handleImprimir}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg transition text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
          >
            <span>🖨️</span>
            <span>Imprimir / Baixar PDF</span>
          </button>
        </div>
      </div>

      {/* ── DOCUMENTO OFICIAL DO CERTIFICADO ───────────────────────────── */}
      <div className="bg-white max-w-4xl w-full p-8 md:p-14 rounded-3xl shadow-2xl border-8 border-double border-[#003B46] text-slate-900 relative overflow-hidden print:border-4 print:shadow-none print:max-w-none print:w-full print:rounded-none print:p-8">
        
        {/* Marca d'água de fundo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none select-none">
          <img src="/images/logo_creeser.png" alt="Marca D'água" className="w-[500px] h-auto object-contain" />
        </div>

        {/* Header do Certificado */}
        <div className="flex justify-between items-center border-b-2 border-teal-600/40 pb-6 mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <img src="/images/logo_creeser.png" alt="CREESER" className="h-12 sm:h-16 w-auto object-contain" />
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#003B46] tracking-tight">CREESER</h1>
              <p className="text-[11px] text-teal-800 font-extrabold uppercase tracking-widest">Grupo Educacional</p>
            </div>
          </div>

          <div className="text-right">
            <span className="bg-teal-50 border border-teal-300 text-teal-900 font-mono text-xs font-black px-3.5 py-1.5 rounded-full inline-block shadow-2xs">
              {certificado.codigoValidacao}
            </span>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Registro de Autenticidade Digital</p>
          </div>
        </div>

        {/* Título Principal */}
        <div className="text-center my-8 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#003B46] uppercase tracking-widest font-serif mb-2">
            CERTIFICADO DE CONCLUSÃO
          </h2>
          <div className="w-28 h-1 bg-gradient-to-r from-teal-500 to-[#00d09c] mx-auto rounded-full"></div>
        </div>

        {/* Corpo do Certificado */}
        <div className="text-center my-8 sm:my-12 space-y-6 text-slate-700 leading-relaxed font-sans px-2 sm:px-6 relative z-10">
          <p className="text-sm sm:text-base md:text-lg">
            Certificamos que{' '}
            <strong className="text-lg sm:text-2xl font-black text-[#003B46] block my-2 underline decoration-teal-500 underline-offset-6">
              {certificado.alunoNome}
            </strong>
            concluiu com êxito os requisitos acadêmicos e pedagógicos da disciplina de formação em
          </p>

          <div className="bg-teal-50/70 border-y-2 border-teal-700/60 py-4 sm:py-5 my-4 rounded-xl">
            <h3 className="text-lg sm:text-2xl font-black text-[#003B46]">{certificado.cursoTitulo}</h3>
            <p className="text-xs sm:text-sm text-teal-800 font-bold mt-1">
              Carga Horária Total: {certificado.cargaHoraria} Horas-Aula
            </p>
          </div>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            promovido pelo <strong>Grupo Educacional CREESER</strong>, tendo cumprido integralmente a grade de videoaulas, materiais de apoio e obtido aprovação na avaliação institucional em <strong>{dataFormatada}</strong>.
          </p>
        </div>

        {/* Assinaturas Institucionais e QR Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center mt-12 sm:mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-700 relative z-10">
          <div>
            <div className="w-40 sm:w-48 h-0.5 bg-slate-800 mx-auto mb-2"></div>
            <p className="font-extrabold text-slate-900">Coordenação Pedagógica</p>
            <p className="text-[11px] text-slate-500">CREESER Grupo Educacional</p>
          </div>

          {/* QR Code de Validação */}
          <div className="flex flex-col items-center justify-center order-first sm:order-none">
            <div className="p-2 bg-white border border-slate-300 rounded-xl shadow-xs">
              <img src={qrCodeUrl} alt="QR Code de Validação" className="w-20 h-20 sm:w-24 sm:h-24" />
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-mono">Consulte via QR Code</p>
          </div>

          <div>
            <div className="w-40 sm:w-48 h-0.5 bg-slate-800 mx-auto mb-2"></div>
            <p className="font-extrabold text-slate-900">Direção Acadêmica</p>
            <p className="text-[11px] text-slate-500">Portal Acadêmico CREESER</p>
          </div>
        </div>

        {/* Rodapé de Validação */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-[11px] text-slate-400 gap-2 relative z-10">
          <p>Documento emitido eletronicamente pela Plataforma Educacional CREESER.</p>
          <p className="font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200 font-bold">
            Código de Autenticidade: <strong>{certificado.codigoValidacao}</strong>
          </p>
        </div>

      </div>
    </div>
  );
}
