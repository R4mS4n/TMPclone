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
      console.log('[CODE FORM] Setting language from prop:', language);
      const languageObj = languages.find(lang =>
        lang.name.toLowerCase().includes(language.toLowerCase())
      );
      if (languageObj) {
        console.log('[CODE FORM] Found matching language:', languageObj.name, '(ID:', languageObj.id, ')');
        setSelectedLanguage(languageObj);
      } else {
        console.warn('[CODE FORM] No matching language found for:', language);
      }
    }
  }, [language]);

  useEffect(() => {
    if (selectedLanguage) {
      console.log('[CODE FORM] Updating Monaco editor language to:', selectedLanguage.name);
      const monacoLang = getMonacoLanguage(selectedLanguage.name);
      setEditorLanguage(monacoLang);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (initialCode) {
      console.log('[CODE FORM] Using initial code template (length:', initialCode.length, 'chars)');
      setCode(initialCode);
    } else if (selectedLanguage) {
      console.log('[CODE FORM] No initial code provided, using template for:', selectedLanguage.name);
      setCode(getCodeTemplate(selectedLanguage.name));
    }
  }, [initialCode, selectedLanguage]);

  const handleLanguageChange = (e) => {
    const langId = parseInt(e.target.value);
    console.log('[CODE FORM] Language changed to ID:', langId);
    const newLanguage = languages.find(lang => lang.id === langId);
    if (newLanguage) {
      console.log('[CODE FORM] Setting language to:', newLanguage.name);
      setSelectedLanguage(newLanguage);
      if (!initialCode) {
        const template = getCodeTemplate(newLanguage.name);
        console.log('[CODE FORM] Setting new template for language (length:', template.length, 'chars)');
        setCode(template);
      }
    }
  };

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    console.log('[CODE FORM] Monaco editor mounted');
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
    console.log('[CODE FORM] Editor ready for use');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isEditorReady || isSubmitting) return;

    console.log('[CODE FORM] Submitting code, language:', selectedLanguage.name, 'ID:', selectedLanguage.id);
    console.log('[CODE FORM] Code length:', code.length, 'characters');
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        // Delegate submission logic to parent component
        console.log('[CODE FORM] Using parent component submission handler');
        await onSubmit(code, selectedLanguage.name, selectedLanguage.id);
      } else if (questionId) {
        // Default API submission logic
        console.log('[CODE FORM] Using default API submission logic');
        console.log('[CODE FORM] Submitting to /api/questions/review with questionId:', questionId);
        
        const response = await fetch('http://localhost:5000/api/questions/review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId,
            code,
            languageId: selectedLanguage.id,
          }),
        });

        if (!response.ok) {
          console.error('[CODE FORM] API error:', response.status, response.statusText);
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('[CODE FORM] Response from API:', data);
        
        // Show appropriate message based on Judge0 response
        if (data.status && data.status.id === 3) {
          console.log('[CODE FORM] Code submission successful!');
          alert('Code submitted successfully! All tests passed.');
        } else {
          console.warn('[CODE FORM] Code submission error:', data.status?.description || 'Unknown error');
          alert(`Code submission error: ${data.status?.description || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('[CODE FORM] Error submitting code:', error);
      alert(`Error submitting code: ${error.message}`);
    } finally {
      console.log('[CODE FORM] Submission process completed');
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
