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

  // Set selectedLanguage if "language" prop is passed
  useEffect(() => {
    if (language) {
      const languageObj = languages.find(lang =>
        lang.name.toLowerCase().includes(language.toLowerCase())
      );
      if (languageObj) {
        setSelectedLanguage(languageObj);
      }
    }
  }, [language]);

  useEffect(() => {
    if (selectedLanguage) {
      const monacoLang = getMonacoLanguage(selectedLanguage.name);
      setEditorLanguage(monacoLang);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    } else if (selectedLanguage) {
      setCode(getCodeTemplate(selectedLanguage.name));
    }
  }, [initialCode, selectedLanguage]);

  const handleLanguageChange = (e) => {
    const langId = parseInt(e.target.value);
    const newLanguage = languages.find(lang => lang.id === langId);
    if (newLanguage) {
      setSelectedLanguage(newLanguage);
      if (!initialCode) {
        setCode(getCodeTemplate(newLanguage.name));
      }
    }
  };

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editor.updateOptions({
      automaticLayout: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      scrollBeyondLastLine: false,
      minimap: { enabled: true },
      lineNumbers: "on",
      folding: true,
      tabSize: 2
    });
    editor.focus();
    setIsEditorReady(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isEditorReady || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        // Delegate submission logic
        await onSubmit(code, selectedLanguage.name);
      } else if (questionId && languageId) {
        // Default API submission logic
        const response = await fetch('http://localhost:5000/api/questions/review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId,
            code,
            languageId,
          }),
        });

        const data = await response.json();
        console.log('[RESPONSE]', data);
        alert('Code submitted!');
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      alert('Error submitting code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-md overflow-hidden mb-4 border border-base-300">
        {/* Language Selector Header */}
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
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
              },
              suggestOnTriggerCharacters: true,
              formatOnPaste: true,
              formatOnType: true,
            }}
            loading={<span className="loading loading-spinner loading-lg text-primary"></span>}
          />
        </div>
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
