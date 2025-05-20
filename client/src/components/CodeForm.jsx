import React, { useState, useEffect } from 'react';
import { useTheme } from "../contexts/ThemeContext";
import Editor from "@monaco-editor/react";
import languages from "../utils/languages";
import { getMonacoLanguage, getCodeTemplate } from "../utils/languageMapping";

const CodeForm = ({ initialCode, language, onSubmit, questionId, questionContent, languageId}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[28]); // JavaScript default
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const { isDark } = useTheme();
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [solved, setSolved] = useState(false); // ✅ Estado para verificar si la pregunta está resuelta

  useEffect(() => {
    const fetchSavedCode = async () => {
      if (!questionId) return;
      try {
        const response = await fetch(
          `http://localhost:5000/api/questions/submissions?questionId=${questionId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
        );
        const data = await response.json();
        setCode(data.code || getCodeTemplate(selectedLanguage.name));
        setSolved(data.status === 1); // ✅ Verificar si está resuelta
      } catch (error) {
        setCode(getCodeTemplate(selectedLanguage.name));
        setSolved(false);
      }
    };
    fetchSavedCode();
  }, [questionId]);

  // ✅ Verificar si la pregunta ya está resuelta
  const checkIfSolved = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/questions/submissions?questionId=${questionId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      const data = await response.json();
      setSolved(data.status === 1);
    } catch (error) {
      console.error('[CODE FORM] Error checking if solved:', error);
    }
  };

  useEffect(() => {
    if (questionId) checkIfSolved();
  }, [questionId]);

  // Resto de useEffects y handlers exactamente iguales al primer componente
  useEffect(() => {
    if (language) {
      const languageObj = languages.find(lang =>
        lang.name.toLowerCase().includes(language.toLowerCase())
      );
      if (languageObj) setSelectedLanguage(languageObj);
    }
  }, [language]);

  useEffect(() => {
    setEditorLanguage(getMonacoLanguage(selectedLanguage.name));
  }, [selectedLanguage]);

  useEffect(() => {
    if (initialCode) setCode(initialCode);
    else setCode(getCodeTemplate(selectedLanguage.name));
  }, [initialCode, selectedLanguage]);

  const handleLanguageChange = e => {
    const langId = parseInt(e.target.value);
    const newLanguage = languages.find(lang => lang.id === langId);
    if (newLanguage) {
      setSelectedLanguage(newLanguage);
      if (!initialCode) setCode(getCodeTemplate(newLanguage.name));
    }
  };

  const handleEditorChange = value => setCode(value || '');

  const handleEditorDidMount = editor => {
    editor.updateOptions({
      automaticLayout: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      scrollBeyondLastLine: false,
      minimap: { enabled: true },
      lineNumbers: 'on',
      folding: true,
      tabSize: 2
    });
    editor.focus();
    setIsEditorReady(true);
  };

  const handleSubmit = async e => {
    if (e) e.preventDefault();
    if (!isEditorReady || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(code, selectedLanguage.name, selectedLanguage.id);
      } else if (questionId) {
        const response = await fetch('http://localhost:5000/api/questions/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId, code, languageId: selectedLanguage.id })
        });
        const data = await response.json();
        setSolved(data.status === 1); // ✅ Actualizar estado resuelta
      }

      const AIresponse = await fetch('http://localhost:5000/api/ai/analyzeCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, questionContent })
      });
      const AIdata = await AIresponse.json();
      setAiSuggestion(AIdata.suggestion || 'No suggestion provided.');
    } catch (error) {
      console.error('[CODE FORM] Error submitting code:', error);
      alert(`Error submitting code: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* ✅ Mostrar el estado de la pregunta */}
      <div className="mb-4">
        {solved ? (
          <div className="text-green-600 font-bold">✅ ¡Pregunta resuelta!</div>
        ) : (
          <div className="text-red-600 font-bold">❌ Pregunta pendiente</div>
        )}
      </div>

      <div className="rounded-md overflow-hidden mb-4 border border-base-300">
        {/* Language Selector Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-neutral text-neutral-content">
          <span className="text-sm font-medium mr-2">Language:</span>
          <select
            value={selectedLanguage?.id || ''}
            onChange={handleLanguageChange}
            className="select select-bordered bg-base-100 text-base-content min-w-[200px] font-medium"
          >
            {languages.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </div>

        {/* Monaco Code Editor */}
        <div className="h-[450px] w-full">
          <Editor
            height="100%"
            width="100%"
            language={editorLanguage}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme={isDark ? "vs-dark" : "vs-light"}
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lineNumbers: "on",
              wordWrap: "on",
              folding: true,
              tabSize: 2,
              cursorBlinking: "smooth",
              contextmenu: true,
              scrollbar: { vertical: 'auto', horizontal: 'auto' },
              suggestOnTriggerCharacters: true,
              formatOnPaste: true,
              formatOnType: true,
            }}
            loading={<span className="loading loading-spinner loading-lg text-primary"></span>}
          />
        </div>
      </div>

      <div className="mb-2 max-w-full overflow-auto">
        <strong>AI Suggestion:</strong>
        <pre className="whitespace-pre-wrap break-words overflow-auto max-w-full">
          {aiSuggestion}
        </pre>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!isEditorReady || isSubmitting}
          className="btn btn-primary rounded-md min-w-[140px] px-6 font-normal h-10"
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </div>
  );
};

export default CodeForm;