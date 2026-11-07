import { useState, useRef } from 'react';
import ModalLayout from '@/components/ui/ModalLayout';
import RichTextEditor from '@/components/RichTextEditor';

export default function ModalCabecalhoRodape({
  open,
  onClose,
  formContrato,
  setFormContrato,
  placeholders = []
}) {
  const [activeTab, setActiveTab] = useState('cabecalho'); // 'cabecalho' | 'rodape' | 'preview'
  const [uploadando, setUploadando] = useState(false);
  const [erroUpload, setErroUpload] = useState('');
  
  const fileInputRef = useRef(null);
  const editorCabecalhoRef = useRef(null);
  const editorRodapeRef = useRef(null);

  if (!open) return null;

  const handleToggle = (field) => {
    setFormContrato((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleEditorChange = (field, html) => {
    setFormContrato((prev) => ({
      ...prev,
      [field]: html
    }));
  };

  const inserirPlaceholder = (placeholder) => {
    if (activeTab === 'cabecalho') {
      if (editorCabecalhoRef.current && typeof editorCabecalhoRef.current.insertText === 'function') {
        editorCabecalhoRef.current.insertText(placeholder);
      } else {
        const cur = formContrato.cabecalhoHtml || '';
        const sep = cur && !cur.endsWith(' ') ? ' ' : '';
        handleEditorChange('cabecalhoHtml', `${cur}${sep}${placeholder}`);
      }
    } else if (activeTab === 'rodape') {
      if (editorRodapeRef.current && typeof editorRodapeRef.current.insertText === 'function') {
        editorRodapeRef.current.insertText(placeholder);
      } else {
        const cur = formContrato.rodapeHtml || '';
        const sep = cur && !cur.endsWith(' ') ? ' ' : '';
        handleEditorChange('rodapeHtml', `${cur}${sep}${placeholder}`);
      }
    }
  };

  const handleUploadImagem = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadando(true);
    setErroUpload('');

    try {
      const formData = new FormData();
      formData.append('foto', file);

      const res = await fetch('/api/upload-foto', {
        method: 'POST',
        body: formData
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Falha ao enviar imagem');
      }

      const imgTag = `<img src="${data.url}" alt="Logo" style="max-height: 70px; max-width: 220px; object-fit: contain; display: inline-block;" />`;

      if (activeTab === 'cabecalho') {
        if (editorCabecalhoRef.current && typeof editorCabecalhoRef.current.insertText === 'function') {
          editorCabecalhoRef.current.insertText(imgTag);
        } else {
          const cur = formContrato.cabecalhoHtml || '';
          handleEditorChange('cabecalhoHtml', `${cur}<p>${imgTag}</p>`);
        }
      } else if (activeTab === 'rodape') {
        if (editorRodapeRef.current && typeof editorRodapeRef.current.insertText === 'function') {
          editorRodapeRef.current.insertText(imgTag);
        } else {
          const cur = formContrato.rodapeHtml || '';
          handleEditorChange('rodapeHtml', `${cur}<p>${imgTag}</p>`);
        }
      }
    } catch (err) {
      console.error('Erro no upload de logo:', err);
      setErroUpload(err.message || 'Erro ao fazer upload da imagem');
    } finally {
      setUploadando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Simulação de placeholders para pré-visualização A4
  const renderPreviewHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/\{\{INSTITUICAO_NOME\}\}/g, 'CREESER EDUCACIONAL')
      .replace(/\{\{INSTITUICAO_CNPJ\}\}/g, '00.000.000/0001-00')
      .replace(/\{\{ALUNO_NOME\}\}/g, 'João da Silva Santos')
      .replace(/\{\{ALUNO_CPF\}\}/g, '123.456.789-00')
      .replace(/\{\{CURSO_NOME\}\}/g, 'Técnico em Enfermagem')
      .replace(/\{\{TURMA_NOME\}\}/g, 'Turma 2026.1')
      .replace(/\{\{DATA_ASSINATURA\}\}/g, new Date().toLocaleDateString('pt-BR'));
  };

  return (
    <ModalLayout
      open={open}
      onClose={onClose}
      title="Configuração de Cabeçalho e Rodapé"
      subtitle="Defina o cabeçalho e rodapé visuais impressos nas páginas A4 deste modelo"
      icon="📑"
      size="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-gray-500">
            {formContrato.cabecalhoAtivo || formContrato.rodapeAtivo ? (
              <span className="text-teal-700 font-medium">
                ✓ {formContrato.cabecalhoAtivo ? 'Cabeçalho ativo' : ''}
                {formContrato.cabecalhoAtivo && formContrato.rodapeAtivo ? ' • ' : ''}
                {formContrato.rodapeAtivo ? 'Rodapé ativo' : ''}
              </span>
            ) : (
              <span>Cabeçalho e Rodapé desativados para este modelo</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm transition shadow-sm"
          >
            Concluir e Salvar no Modelo
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Abas Superiores */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('cabecalho')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition flex items-center justify-center gap-2 ${
              activeTab === 'cabecalho'
                ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>🏷️ Cabeçalho</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                formContrato.cabecalhoAtivo
                  ? 'bg-green-100 text-green-700 font-bold'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {formContrato.cabecalhoAtivo ? 'Ativo' : 'Desativado'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rodape')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition flex items-center justify-center gap-2 ${
              activeTab === 'rodape'
                ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>📄 Rodapé</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                formContrato.rodapeAtivo
                  ? 'bg-green-100 text-green-700 font-bold'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {formContrato.rodapeAtivo ? 'Ativo' : 'Desativado'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition flex items-center justify-center gap-2 ${
              activeTab === 'preview'
                ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>👁️ Pré-visualização A4</span>
          </button>
        </div>

        {/* CONTEÚDO DA ABA CABEÇALHO */}
        {activeTab === 'cabecalho' && (
          <div className="space-y-4">
            {/* Controles de Ativação e Paginação */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Ativar Cabeçalho</h4>
                  <p className="text-xs text-slate-500">Exibe o cabeçalho impresso no topo das páginas</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formContrato.cabecalhoAtivo}
                    onChange={() => handleToggle('cabecalhoAtivo')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {formContrato.cabecalhoAtivo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-teal-50/40 transition">
                    <input
                      type="checkbox"
                      checked={formContrato.cabecalhoPrimeiraPagina}
                      onChange={() => handleToggle('cabecalhoPrimeiraPagina')}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Exibir na primeira página</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-teal-50/40 transition">
                    <input
                      type="checkbox"
                      checked={formContrato.cabecalhoRepetirDemais}
                      onChange={() => handleToggle('cabecalhoRepetirDemais')}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Repetir nas demais páginas</span>
                  </label>
                </div>
              )}
            </div>

            {/* Barra de Ações Rápidas (Logomarca / Placeholders) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadImagem}
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadando}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Inserir logomarca ou imagem"
                >
                  🖼️ {uploadando ? 'Enviando...' : 'Inserir Logomarca'}
                </button>
                {erroUpload && <span className="text-xs text-red-600">{erroUpload}</span>}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Placeholders:</span>
                {placeholders.slice(0, 5).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => inserirPlaceholder(p)}
                    className="px-2 py-0.5 text-[11px] bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 rounded transition"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Visual do Cabeçalho */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                Conteúdo Visual do Cabeçalho
              </label>
              <RichTextEditor
                ref={editorCabecalhoRef}
                value={formContrato.cabecalhoHtml}
                onChange={(html) => handleEditorChange('cabecalhoHtml', html)}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Dica: você pode centralizar a logomarca e adicionar dados institucionais (CNPJ, endereço, etc.).
              </p>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA RODAPÉ */}
        {activeTab === 'rodape' && (
          <div className="space-y-4">
            {/* Controles de Ativação e Paginação */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Ativar Rodapé</h4>
                  <p className="text-xs text-slate-500">Exibe o rodapé impresso na base de cada página</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formContrato.rodapeAtivo}
                    onChange={() => handleToggle('rodapeAtivo')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {formContrato.rodapeAtivo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-teal-50/40 transition">
                    <input
                      type="checkbox"
                      checked={formContrato.rodapePrimeiraPagina}
                      onChange={() => handleToggle('rodapePrimeiraPagina')}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Exibir na primeira página</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-teal-50/40 transition">
                    <input
                      type="checkbox"
                      checked={formContrato.rodapeRepetirDemais}
                      onChange={() => handleToggle('rodapeRepetirDemais')}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Repetir nas demais páginas</span>
                  </label>
                </div>
              )}
            </div>

            {/* Barra de Ações Rápidas (Logomarca / Placeholders) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadImagem}
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadando}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Inserir imagem"
                >
                  🖼️ {uploadando ? 'Enviando...' : 'Inserir Imagem / Selo'}
                </button>
                {erroUpload && <span className="text-xs text-red-600">{erroUpload}</span>}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Placeholders:</span>
                {placeholders.slice(0, 5).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => inserirPlaceholder(p)}
                    className="px-2 py-0.5 text-[11px] bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 rounded transition"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Visual do Rodapé */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                Conteúdo Visual do Rodapé
              </label>
              <RichTextEditor
                ref={editorRodapeRef}
                value={formContrato.rodapeHtml}
                onChange={(html) => handleEditorChange('rodapeHtml', html)}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Dica: ideal para telefones de contato, e-mail institucional e endereço de rodapé.
              </p>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA PRÉ-VISUALIZAÇÃO A4 */}
        {activeTab === 'preview' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span>📄 Simulação da folha A4 com proporção visual, margens de 14mm e espaçamentos reais.</span>
              <span className="font-semibold text-amber-800">Dimensão A4: 210 × 297 mm</span>
            </div>

            {/* Folha A4 Simulada */}
            <div className="max-w-xl mx-auto bg-gray-200 p-4 rounded-xl shadow-inner overflow-auto max-h-[500px]">
              <div
                className="bg-white shadow-lg mx-auto flex flex-col justify-between text-slate-800"
                style={{
                  width: '100%',
                  minHeight: '620px',
                  padding: '24px 30px',
                  fontSize: '11px',
                  lineHeight: '1.5'
                }}
              >
                {/* Cabeçalho na Folha */}
                <div>
                  {formContrato.cabecalhoAtivo && formContrato.cabecalhoHtml ? (
                    <div
                      className="border-b border-gray-300 pb-3 mb-4 text-center"
                      dangerouslySetInnerHTML={{ __html: renderPreviewHtml(formContrato.cabecalhoHtml) }}
                    />
                  ) : (
                    <div className="border-b border-dashed border-gray-200 pb-2 mb-4 text-center text-gray-300 italic text-[10px]">
                      [Cabeçalho Desativado]
                    </div>
                  )}

                  {/* Corpo Simulado do Contrato */}
                  <div className="space-y-2 text-justify text-gray-600">
                    <p className="font-bold text-center text-xs text-gray-800 uppercase mb-3">
                      CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS
                    </p>
                    <p>
                      Pelo presente instrumento particular, de um lado <strong>CREESER EDUCACIONAL</strong>, e de outro lado o aluno <strong>João da Silva Santos</strong>, portador do CPF 123.456.789-00, matriculado no curso <strong>Técnico em Enfermagem</strong>...
                    </p>
                    <p>
                      <strong>CLÁUSULA PRIMEIRA:</strong> O presente contrato tem por objeto a prestação de serviços educacionais correspondentes ao período letivo regular.
                    </p>
                    <p className="text-gray-400 italic text-[10px]">
                      [... Cláusulas contratuais do modelo continuam aqui sem sobreposição ...]
                    </p>
                  </div>
                </div>

                {/* Rodapé na Folha */}
                <div className="mt-8">
                  {formContrato.rodapeAtivo && formContrato.rodapeHtml ? (
                    <div
                      className="border-t border-gray-300 pt-3 text-center text-gray-600"
                      dangerouslySetInnerHTML={{ __html: renderPreviewHtml(formContrato.rodapeHtml) }}
                    />
                  ) : (
                    <div className="border-t border-dashed border-gray-200 pt-2 text-center text-gray-300 italic text-[10px]">
                      [Rodapé Desativado]
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalLayout>
  );
}
