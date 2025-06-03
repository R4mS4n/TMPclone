import React, { useState, useEffect } from 'react';
import { useTheme } from "../contexts/ThemeContext";
import Editor from "@monaco-editor/react";
import languages from "../utils/languages";
import { getMonacoLanguage, getCodeTemplate } from "../utils/languageMapping";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CodeForm = ({ initialCode, language, onSubmit, questionId, questionContent, languageId}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[28]); // JavaScript default
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const { isDark } = useTheme();
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [solved, setSolved] = useState(false); // ✅ Estado para verificar si la pregunta está resuelta
  const [isGeneratingAiSuggestion, setIsGeneratingAiSuggestion] = useState(false); // New state

  useEffect(() => {
    // Reset AI suggestion when questionId changes
    setAiSuggestion(''); 
  }, [questionId]);

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
    if (!isEditorReady || isSubmitting || isGeneratingAiSuggestion) return; // Prevent submit if AI gen is also in progress
    
    setIsSubmitting(true);
    setAiSuggestion(''); // Clear previous AI suggestion immediately
    setIsGeneratingAiSuggestion(false); // Ensure this is reset if a new submission starts

    try {
      if (onSubmit) {
        await onSubmit(code, selectedLanguage.name, selectedLanguage.id); // Judge0 review
      }
      // Assuming onSubmit handles setting its own success/error for Judge0 part.
      // The `setSolved` logic here might be redundant if `onSubmit` (which is handleCodeSubmit in ChallengeQuestion)
      // already triggers a re-render or state update that `checkIfSolved` would catch or if solved status comes from parent.
      // For now, let's assume parent `ChallengeQuestion.jsx` handles the solved status that feeds into this component.

    } catch (error) {
      console.error('[CODE FORM] Error during submission to Judge0 part:', error);
      // This error should ideally be surfaced by the onSubmit prop (handleCodeSubmit in ChallengeQuestion.jsx)
      // For example, by setting the feedback state in ChallengeQuestion.jsx
      alert(`Error during code evaluation: ${error.message}`);
    } finally {
      setIsSubmitting(false); // Judge0 part is done, button reverts to normal
    }

    // Now, handle AI suggestion separately
    try {
      setIsGeneratingAiSuggestion(true);
      const AIresponse = await fetch('http://localhost:5000/api/ai/analyzeCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, questionContent })
      });
      if (!AIresponse.ok) {
        const errData = await AIresponse.json().catch(() => null);
        throw new Error(errData?.error || `AI suggestion service failed with status: ${AIresponse.status}`);
      }
      const AIdata = await AIresponse.json();
      setAiSuggestion(AIdata.suggestion || 'No suggestion provided this time.');
    } catch (error) {
      console.error('[CODE FORM] Error fetching AI suggestion:', error);
      setAiSuggestion(`Could not load AI suggestion: ${error.message}`);
    } finally {
      setIsGeneratingAiSuggestion(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-md overflow-hidden mb-4 border border-base-300">
        {/* Language Selector Header & Submit Button */}
        <div className="flex justify-between items-center px-4 py-3 bg-neutral text-neutral-content">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">Language:</span>
            <select
              value={selectedLanguage?.id || ''}
              onChange={handleLanguageChange}
              className="select select-bordered bg-base-100 text-base-content min-w-[200px] font-medium h-10 join-item"
            >
              {languages.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isEditorReady || isSubmitting || isGeneratingAiSuggestion}
            className="btn btn-primary rounded-md min-w-[120px] px-4 font-normal h-10 join-item"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
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

      {/* AI Suggestion Section - Modified for scrollability */}
      {aiSuggestion && (
        <div className="mb-4 p-4 border border-dashed border-base-300 rounded-md bg-base-200">
          <strong className="block mb-2 text-secondary">AI Suggestion:</strong>
          <div 
            className="prose prose-sm max-w-none overflow-y-auto max-h-96 p-2 bg-base-100 rounded text-base-content"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiSuggestion}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Indicator for AI Suggestion Generation */}
      {isGeneratingAiSuggestion && (
        <div className="flex items-center justify-center my-4 p-3 bg-info text-info-content rounded-md shadow">
          <span className="loading loading-dots loading-md mr-3"></span>
          Generating AI Suggestion...
        </div>
      )}

    </div>
  );
};

export default CodeForm;