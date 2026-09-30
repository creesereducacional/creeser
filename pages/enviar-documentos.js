import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import PortalLayout from '@/components/portal/PortalLayout';

export default function EnviarDocumentos() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [cursoSelecionado, setCursoSelecionado] = useState('');
  const [moduloSelecionado, setModuloSelecionado] = useState('');
  const [aulaSelecionada, setAulaSelecionada] = useState('');
  const [documentoFile, setDocumentoFile] = useState(null);
  const [descricaoDocumento, setDescricaoDocumento] = useState('');
  const [enviandoDocumento, setEnviandoDocumento] = useState(false);
  const [meusDocumentos, setMeusDocumentos] = useState([]);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.usuario) {
          setUsuario(data.usuario);
          carregarMeusDocumentos(data.usuario.id);
        }
      })
      .catch(() => {});

    carregarCursos();
  }, []);

  const carregarCursos = async () => {
    try {
      const response = await fetch('/api/cursos', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCursos(Array.isArray(data) ? data.filter((c) => c.ativo) : []);
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    }
  };

  const carregarMeusDocumentos = async (alunoId) => {
    try {
      const response = await fetch('/api/documentos', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const lista = Array.isArray(data) ? data : [];
        const filtrados = alunoId ? lista.filter((d) => d.alunoId === alunoId) : lista;
        setMeusDocumentos(filtrados.sort((a, b) => new Date(b.data) - new Date(a.data)));
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  };

  const curso = cursos.find((c) => c.id === cursoSelecionado);
  const modulo = curso?.modulos?.find((m) => m.id === moduloSelecionado);

  const enviarDocumento = async () => {
    if (!documentoFile) {
      alert('Por favor, selecione um documento para enviar.');
      return;
    }

    if (!cursoSelecionado || !aulaSelecionada) {
      alert('Por favor, selecione o curso e a aula.');
      return;
    }

    setEnviandoDocumento(true);

    try {
      const aula = modulo?.aulas?.find((a) => a.id === aulaSelecionada);

      const formData = new FormData();
      formData.append('documento', documentoFile);
      formData.append('cursoId', cursoSelecionado);
      formData.append('cursoNome', curso.titulo);
      formData.append('aulaId', aulaSelecionada);
      formData.append('aulaNome', aula?.titulo || '');
      formData.append('alunoId', usuario?.id || '');
      formData.append('alunoNome', usuario?.nome || usuario?.nomeCompleto || '');
      formData.append('descricao', descricaoDocumento);

      const response = await fetch('/api/documentos', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        alert('Documento enviado com sucesso! Aguarde a análise do professor.');
        setDocumentoFile(null);
        setDescricaoDocumento('');
        setCursoSelecionado('');
        setModuloSelecionado('');
        setAulaSelecionada('');
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
        if (usuario?.id) carregarMeusDocumentos(usuario.id);
      } else {
        alert('Erro ao enviar documento. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      alert('Erro ao enviar documento. Tente novamente.');
    } finally {
      setEnviandoDocumento(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pendente: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pendente' },
      aprovado: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Aprovado' },
      reprovado: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Reprovado' },
      revisao: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Em Revisão' },
    };
    const badge = badges[status] || badges.pendente;
    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-bold`}>
        {badge.label}
      </span>
    );
  };

  return (
    <PortalLayout title="Envio de Documentos e Trabalhos" tipoRequerido="aluno">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            📤 Envio de Trabalhos e Documentos
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Submeta atividades complementares, exercícios e documentos para revisão dos professores.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Envio */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">Nova Submissão</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Curso / Disciplina *
                </label>
                <select
                  value={cursoSelecionado}
                  onChange={(e) => {
                    setCursoSelecionado(e.target.value);
                    setModuloSelecionado('');
                    setAulaSelecionada('');
                  }}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm"
                >
                  <option value="">Selecione o curso</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>{c.titulo}</option>
                  ))}
                </select>
              </div>

              {cursoSelecionado && curso?.modulos && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Módulo *
                  </label>
                  <select
                    value={moduloSelecionado}
                    onChange={(e) => {
                      setModuloSelecionado(e.target.value);
                      setAulaSelecionada('');
                    }}
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Selecione o módulo</option>
                    {curso.modulos.map((m) => (
                      <option key={m.id} value={m.id}>{m.titulo}</option>
                    ))}
                  </select>
                </div>
              )}

              {moduloSelecionado && modulo?.aulas && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Aula / Atividade *
                  </label>
                  <select
                    value={aulaSelecionada}
                    onChange={(e) => setAulaSelecionada(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Selecione a aula</option>
                    {modulo.aulas.map((a) => (
                      <option key={a.id} value={a.id}>{a.titulo}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Descrição do Documento
                </label>
                <textarea
                  value={descricaoDocumento}
                  onChange={(e) => setDescricaoDocumento(e.target.value)}
                  placeholder="Descreva brevemente o conteúdo do trabalho ou anexo..."
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Arquivo do Trabalho *
                </label>
                <input
                  id="fileInput"
                  type="file"
                  onChange={(e) => setDocumentoFile(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png"
                  className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Formatos aceitos: PDF, DOC, DOCX, ZIP, RAR, JPG, PNG (máx. 10MB)
                </p>
              </div>

              {documentoFile && (
                <div className="bg-teal-50 rounded-xl p-3 border border-teal-200 flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-gray-800 truncate">{documentoFile.name}</p>
                    <p className="text-[11px] text-gray-500">
                      {(documentoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDocumentoFile(null);
                      const f = document.getElementById('fileInput');
                      if (f) f.value = '';
                    }}
                    className="text-rose-600 hover:text-rose-700 font-bold text-sm p-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              <button
                onClick={enviarDocumento}
                disabled={!documentoFile || !cursoSelecionado || !aulaSelecionada || enviandoDocumento}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-sm ${
                  !documentoFile || !cursoSelecionado || !aulaSelecionada || enviandoDocumento
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
                }`}
              >
                {enviandoDocumento ? 'Enviando documento...' : '📤 Confirmar Envio'}
              </button>
            </div>
          </div>

          {/* Meus Documentos Enviados */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">Meus Documentos ({meusDocumentos.length})</h3>

            {meusDocumentos.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-xs">
                <div className="text-4xl mb-2 opacity-60">📄</div>
                <p>Nenhum documento enviado até o momento.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
                {meusDocumentos.map((doc) => (
                  <div key={doc.id} className="border border-gray-200/80 rounded-xl p-4 hover:shadow-sm transition bg-gray-50/50">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-gray-800 truncate">{doc.arquivoOriginal || 'Documento'}</p>
                        <p className="text-[11px] text-teal-700 font-semibold">{doc.cursoNome}</p>
                        <p className="text-[11px] text-gray-400">{doc.aulaNome}</p>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    {doc.descricao && (
                      <p className="text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-100 my-2">
                        {doc.descricao}
                      </p>
                    )}

                    {doc.comentario && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 my-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Feedback do Professor:</p>
                        <p className="text-xs text-emerald-900 mt-0.5">{doc.comentario}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                      <span>
                        {doc.data ? new Date(doc.data).toLocaleDateString('pt-BR') : '—'}
                      </span>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-700 hover:text-teal-800 font-bold"
                        >
                          Download ↓
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

