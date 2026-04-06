import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const RichTextEditor = forwardRef(function RichTextEditor({ value, onChange }, ref) {
  const editorRef = useRef(null);
  const selectionRangeRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const nextValue = value || '';
    if (editorRef.current.innerHTML !== nextValue) {
      editorRef.current.innerHTML = nextValue;
      normalizeListStyles();
    }
  }, [value]);

  const normalizeListStyles = () => {
    if (!editorRef.current) return;

    const unorderedLists = editorRef.current.querySelectorAll('ul');
    unorderedLists.forEach((ul) => {
      ul.style.listStyleType = 'disc';
      ul.style.paddingLeft = '1.5rem';
      ul.style.margin = '0.5rem 0';
    });

    const orderedLists = editorRef.current.querySelectorAll('ol');
    orderedLists.forEach((ol) => {
      ol.style.listStyleType = 'decimal';
      ol.style.paddingLeft = '1.5rem';
      ol.style.margin = '0.5rem 0';
    });
  };

  const saveSelection = () => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    const anchorInside = anchorNode && editorRef.current.contains(anchorNode);
    const focusInside = focusNode && editorRef.current.contains(focusNode);

    if (anchorInside && focusInside) {
      selectionRangeRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    if (!editorRef.current || !selectionRangeRef.current) return;

    try {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (!selection) return;

      selection.removeAllRanges();
      selection.addRange(selectionRangeRef.current);
    } catch {
      selectionRangeRef.current = null;
    }
  };

  const ensureSelectionInEditor = () => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    const anchorNode = selection.anchorNode;
    const insideEditor = Boolean(anchorNode && editorRef.current.contains(anchorNode));
    if (selection.rangeCount > 0 && insideEditor) return;

    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);
    selectionRangeRef.current = range.cloneRange();
  };

  const execCommand = (command, value = null) => {
    restoreSelection();
    ensureSelectionInEditor();
    document.execCommand(command, false, value);
    saveSelection();
    updateContent();
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      saveSelection();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const updateContent = () => {
    if (editorRef.current) {
      normalizeListStyles();
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e) => {
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode || null;
    const anchorElement = anchorNode && anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode;
    const insideListItem = Boolean(anchorElement?.closest && anchorElement.closest('li'));

    if (insideListItem) {
      return;
    }

    // Ao pressionar Enter, inserir <br> ao invés de criar novo parágrafo
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br><br>');
      updateContent();
    }
  };

  const insertText = (text) => {
    if (!editorRef.current) return;

    restoreSelection();
    editorRef.current.focus();

    const selection = window.getSelection();
    const hasRange = Boolean(selection && selection.rangeCount > 0);
    const anchorNode = selection?.anchorNode || null;
    const selectionInsideEditor = Boolean(anchorNode && editorRef.current.contains(anchorNode));

    if (hasRange && selectionInsideEditor) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);
      selectionRangeRef.current = range.cloneRange();
    } else {
      const current = editorRef.current.innerHTML || '';
      const separator = current && !current.endsWith(' ') ? ' ' : '';
      editorRef.current.innerHTML = `${current}${separator}${text}`;
    }

    updateContent();
  };

  useImperativeHandle(ref, () => ({
    insertText,
    focus: () => editorRef.current?.focus()
  }));

  const buttonClass = 'w-8 h-8 text-sm bg-white border border-slate-400 rounded hover:bg-slate-100 transition flex items-center justify-center';
  const handleToolbarMouseDown = (e) => {
    if (e.target.closest('button')) {
      e.preventDefault();
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-200 border-b p-2" onMouseDown={handleToolbarMouseDown}>
        <div className="flex flex-wrap items-center gap-1">
          <select
            onChange={(e) => execCommand('fontName', e.target.value)}
            className="h-8 px-2 text-sm bg-white border border-slate-400 rounded min-w-[120px]"
            defaultValue="Calibri"
            title="Fonte"
          >
            <option value="Calibri">Calibri</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Verdana">Verdana</option>
            <option value="Tahoma">Tahoma</option>
          </select>

          <select
            onChange={(e) => execCommand('fontSize', e.target.value)}
            className="h-8 px-2 text-sm bg-white border border-slate-400 rounded w-[60px]"
            defaultValue="3"
            title="Tamanho"
          >
            <option value="1">8</option>
            <option value="2">10</option>
            <option value="3">11</option>
            <option value="4">14</option>
            <option value="5">18</option>
            <option value="6">24</option>
            <option value="7">36</option>
          </select>

          <div className="h-6 w-px bg-slate-500 mx-1" />

          <button type="button" onClick={() => execCommand('bold')} className={buttonClass} title="Negrito"><strong>N</strong></button>
          <button type="button" onClick={() => execCommand('italic')} className={buttonClass} title="Itálico"><em>I</em></button>
          <button type="button" onClick={() => execCommand('underline')} className={buttonClass} title="Sublinhado"><u>S</u></button>

          <input
            type="color"
            onChange={(e) => execCommand('foreColor', e.target.value)}
            defaultValue="#000000"
            className="w-8 h-8 p-0 border border-slate-400 rounded bg-white cursor-pointer"
            title="Cor do texto"
          />

          <div className="h-6 w-px bg-slate-500 mx-1" />

          <button type="button" onClick={() => execCommand('justifyLeft')} className={buttonClass} title="Alinhar à esquerda" aria-label="Alinhar à esquerda">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 3.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M2 6.5H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M2 9.5H13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M2 12.5H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
          <button type="button" onClick={() => execCommand('justifyCenter')} className={buttonClass} title="Centralizar" aria-label="Centralizar">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 3.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M4 6.5H12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M3 9.5H13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M5 12.5H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
          <button type="button" onClick={() => execCommand('justifyRight')} className={buttonClass} title="Alinhar à direita" aria-label="Alinhar à direita">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 3.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M5 6.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M3 9.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M6 12.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
          <button type="button" onClick={() => execCommand('justifyFull')} className={buttonClass} title="Justificar" aria-label="Justificar">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 3.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M2 9.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M2 12.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[300px] p-4 focus:outline-none bg-white"
        onInput={updateContent}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onFocus={saveSelection}
        onBlur={updateContent}
        onKeyDown={handleKeyDown}
        style={{ maxHeight: '500px', overflowY: 'auto' }}
      />
    </div>
  );
});

export default RichTextEditor;
