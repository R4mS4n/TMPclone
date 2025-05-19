import React, { useState, useEffect } from 'react';
import { useTheme } from "../contexts/ThemeContext";
import Editor from "@monaco-editor/react";
import languages from "../utils/languages";
import { getMonacoLanguage, getCodeTemplate } from "../utils/languageMapping";

const CodeForm = ({ initialCode, language, onSubmit, questionId, languageId }) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[28]); // JavaScript default
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const { isDark } = useTheme();
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [solved, setSolved] = useState(false); // Estado para saber si está resuelta

  useEffect(() => {
    fetchSavedCode();
    checkSolvedStatus();
  }, [questionId]);

  // Verificar si la pregunta ya está resuelta
  const checkSolvedStatus = async () => {
    if (!questionId) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/questions/check-status?questionId=${questionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check question status');
      }

      const data = await response.json();
      setSolved(data.solved);
    } catch (error) {
      console.error('[CODE FORM] Error checking question status:', error);
    }
  };

  // Obtener código guardado (si existe)
  const fetchSavedCode = async () => {
    if (!questionId) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/questions/submissions?questionId=${questionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch saved code');
      }

      const data = await response.json();
      if (data.code) {
        setCode(data.code);
      } else {
        setCode(getCodeTemplate(selectedLanguage.name));
      }
    } catch (error) {
      console.error('[CODE FORM] Error fetching saved code:', error);
      setCode(getCodeTemplate(selectedLanguage.name));
    }
  };

  // Manejar cambio de código en el editor
  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  // Enviar código para revisión
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditorReady || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/questions/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          questionId,
          code,
          languageId: selectedLanguage.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit code');
      }

      const data = await response.json();
      console.log('[CODE FORM] Response from API:', data);

      // Verificar si la respuesta fue aceptada (resuelta correctamente)
      if (data.status?.description === "Accepted") {
        setSolved(true);
        alert('✅ ¡Pregunta resuelta correctamente!');
      } else {
        setSolved(false);
        alert(`❌ Error: ${data.status?.description || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[CODE FORM] Error submitting code:', error);
      alert(`❌ Error al enviar el código: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar cambio de lenguaje
  const handleLanguageChange = (e) => {
    const langId = parseInt(e.target.value);
    const newLanguage = languages.find(lang => lang.id === langId);
    if (newLanguage) {
      setSelectedLanguage(newLanguage);
      setEditorLanguage(getMonacoLanguage(newLanguage.name));
      setCode(getCodeTemplate(newLanguage.name));
    }
  };

  return (
    <div className="w-full">
      {/* Mostrar el estado de la pregunta */}
      <div className="mb-4">
        {solved ? (
          <div className="text-green-600 font-bold">✅ ¡Pregunta resuelta!</div>
        ) : (
          <div className="text-red-600 font-bold">❌ Pregunta pendiente</div>
        )}
      </div>

      <div className="rounded-md overflow-hidden mb-4 border border-base-300">
        <div className="flex justify-between items-center px-4 py-3 bg-neutral text-neutral-content">
          <div className="flex items-center">
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
        </div>

        <div className="h-[450px] w-full">
          <Editor
            height="100%"
            width="100%"
            language={editorLanguage}
            value={code}
            onChange={handleEditorChange}
            onMount={() => setIsEditorReady(true)}
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
            }}
            loading={<span className="loading loading-spinner loading-lg text-primary"></span>}
          />
        </div>
      </div>

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
