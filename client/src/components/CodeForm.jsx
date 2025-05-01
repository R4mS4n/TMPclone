import React, { useState, useEffect } from 'react';
import { useTheme } from "../contexts/ThemeContext";
import Editor from "@monaco-editor/react";
import languages from "../utils/languages";
import { getMonacoLanguage, getCodeTemplate } from "../utils/languageMapping";

const CodeForm = ({ initialCode, language, onSubmit }) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[28]); // Default to JavaScript
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const { isDark } = useTheme();
  const [isEditorReady, setIsEditorReady] = useState(false);
  
  // Set initial language if provided
  useEffect(() => {
    if (language) {
      // Find the matching language from the languages array
      const languageObj = languages.find(lang => 
        lang.name.toLowerCase().includes(language.toLowerCase())
      );
      
      if (languageObj) {
        setSelectedLanguage(languageObj);
      }
    }
  }, [language]);
  
  // Update Monaco editor language when selected language changes
  useEffect(() => {
    if (selectedLanguage) {
      const monacoLang = getMonacoLanguage(selectedLanguage.name);
      setEditorLanguage(monacoLang);
    }
  }, [selectedLanguage]);
  
  // Set initial code template based on language or use provided code
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
      
      // If there's no initial code, set a template for the new language
      if (!initialCode) {
        setCode(getCodeTemplate(newLanguage.name));
      }
    }
  };
  
  const handleEditorChange = (value) => {
    setCode(value || '');
  };
  
  const handleEditorDidMount = (editor, monaco) => {
    // Set editor options
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
    
    // Focus the editor
    editor.focus();
    
    // Set editor as ready
    setIsEditorReady(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isEditorReady) return;
    
    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit(code, selectedLanguage.name);
      }
    } catch (error) {
      console.error("Error submitting code:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-md overflow-hidden mb-4 border border-base-300">
        {/* Editor header with language selector */}
        <div className="flex justify-between items-center px-4 py-3 bg-neutral text-neutral-content">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">Language:</span>
            <select 
              value={selectedLanguage?.id || ''} 
              onChange={handleLanguageChange}
              className="select select-bordered bg-base-100 text-base-content min-w-[200px] font-medium"
            >
              {languages.map(lang => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Monaco Editor */}
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