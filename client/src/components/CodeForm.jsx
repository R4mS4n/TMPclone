import React, { useState, useEffect } from 'react';
import { useTheme } from "../contexts/ThemeContext";
import Editor from "@monaco-editor/react";

// Language support map
const languageSupport = {
  'javascript': {
    id: 'javascript',
    extensions: ['.js'],
    template: '// Write your JavaScript code here\n\nfunction solution() {\n  // Your code here\n}\n'
  },
  'typescript': {
    id: 'typescript',
    extensions: ['.ts'],
    template: '// Write your TypeScript code here\n\nfunction solution(): void {\n  // Your code here\n}\n'
  },
  'python': {
    id: 'python', 
    extensions: ['.py'],
    template: '# Write your Python code here\n\ndef solution():\n    # Your code here\n    pass\n'
  },
  'java': {
    id: 'java',
    extensions: ['.java'],
    template: 'public class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}\n'
  },
  'cpp': {
    id: 'cpp',
    extensions: ['.cpp', '.cc', '.h', '.hpp'],
    template: '#include <iostream>\n\nint main() {\n    // Your code here\n    return 0;\n}\n'
  },
  'csharp': {
    id: 'csharp',
    extensions: ['.cs'],
    template: 'using System;\n\npublic class Solution {\n    public static void Main(string[] args) {\n        // Your code here\n    }\n}\n'
  },
  'ruby': {
    id: 'ruby',
    extensions: ['.rb'],
    template: '# Write your Ruby code here\n\ndef solution\n  # Your code here\nend\n'
  },
  'go': {
    id: 'go',
    extensions: ['.go'],
    template: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Your code here\n}\n'
  },
  'php': {
    id: 'php',
    extensions: ['.php'],
    template: '<?php\n\nfunction solution() {\n    // Your code here\n}\n'
  },
  'swift': {
    id: 'swift',
    extensions: ['.swift'],
    template: '// Write your Swift code here\n\nfunc solution() -> Void {\n    // Your code here\n}\n'
  },
  'rust': {
    id: 'rust',
    extensions: ['.rs'],
    template: 'fn main() {\n    // Your code here\n}\n'
  },
  'sql': {
    id: 'sql',
    extensions: ['.sql'],
    template: '-- Write your SQL query here\nSELECT * FROM table_name WHERE condition;\n'
  },
  'html': {
    id: 'html',
    extensions: ['.html', '.htm'],
    template: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Solution</title>\n</head>\n<body>\n  <!-- Your code here -->\n</body>\n</html>\n'
  },
  'css': {
    id: 'css',
    extensions: ['.css'],
    template: '/* Write your CSS code here */\nbody {\n  /* Your code here */\n}\n'
  }
};

// Function to get the Monaco language ID
const getLanguageId = (language) => {
  if (!language) return 'javascript';
  
  // Direct match with language ID
  const normalizedLang = language.toLowerCase().trim();
  if (languageSupport[normalizedLang]) {
    return languageSupport[normalizedLang].id;
  }
  
  // Look for extensions match
  for (const [langId, langData] of Object.entries(languageSupport)) {
    if (langData.extensions?.some(ext => normalizedLang.endsWith(ext))) {
      return langId;
    }
  }
  
  // Common aliases
  const aliases = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'c++': 'cpp',
    'c': 'cpp',
    'cs': 'csharp',
    'rb': 'ruby',
    'rs': 'rust'
  };
  
  if (aliases[normalizedLang]) {
    return aliases[normalizedLang];
  }
  
  // Default to JavaScript
  return 'javascript';
};

// Function to detect language from code content
const detectLanguageFromContent = (code) => {
  if (!code) return null;
  
  // Check for common language patterns
  
  // C/C++
  if (code.includes('#include <iostream>') || 
      code.includes('#include <') || 
      /\bint\s+main\s*\(\s*\)/.test(code) && (code.includes('std::') || code.includes('return 0;') || code.includes('cout')) ||
      /\bvoid\s+main\s*\(\s*\)/.test(code) ||
      /\bprintf\s*\(/.test(code) && code.includes('#include <stdio.h>')) {
    return 'cpp';
  }
  
  // Java
  if (code.includes('import java.') || 
      code.includes('public class') || 
      code.includes('public static void main') ||
      /class\s+\w+\s*\{/.test(code) && code.includes('public static')) {
    return 'java';
  }
  
  // C#
  if (code.includes('using System;') || 
      (code.includes('namespace') && code.includes('class')) ||
      code.includes('Console.WriteLine') ||
      /\[.+\]/.test(code) && code.includes('public class')) {
    return 'csharp';
  }
  
  // PHP
  if (code.startsWith('<?php') || 
      code.includes('<?php') ||
      code.includes('echo ') && code.includes('$')) {
    return 'php';
  }
  
  // Go
  if (code.includes('package main') || 
      code.includes('import "fmt"') || 
      code.includes('func main()') ||
      code.includes('fmt.Println')) {
    return 'go';
  }
  
  // Python
  if (code.includes('def ') || 
      code.includes('print(') || 
      code.includes('if __name__ == "__main__":') ||
      code.includes('import ') && !code.includes(';') ||
      code.includes('#') && code.includes(':') && !code.includes(';')) {
    return 'python';
  }
  
  // Rust
  if (code.includes('fn main()') || 
      code.includes('pub fn') || 
      code.includes('impl ') ||
      code.includes('let mut ') ||
      /let\s+\w+\s*:\s*\w+/.test(code)) {
    return 'rust';
  }
  
  // JavaScript
  if ((code.includes('function') && (code.includes('console.log') || code.includes('return '))) ||
      code.includes('const ') || 
      code.includes('let ') ||
      code.includes('document.getElementById') ||
      code.includes('addEventListener') ||
      /\(\s*\)\s*=>/.test(code)) {
    return 'javascript';
  }
  
  // TypeScript
  if (code.includes('interface ') || 
      code.includes('export') || 
      code.includes(': string') || 
      code.includes(': number') ||
      code.includes(': boolean') ||
      /\w+<\w+>/.test(code)) {
    return 'typescript';
  }
  
  // HTML
  if (code.includes('<!DOCTYPE html>') ||
      code.includes('<html>') ||
      (code.includes('<div>') && code.includes('</div>')) ||
      (code.includes('<head>') && code.includes('<body>'))) {
    return 'html';
  }
  
  // CSS
  if (code.includes('{') && code.includes('}') && 
     (code.includes('margin:') || code.includes('padding:') || 
      code.includes('color:') || code.includes('font-size:'))) {
    return 'css';
  }
  
  // SQL
  if (code.toUpperCase().includes('SELECT ') && 
     (code.toUpperCase().includes(' FROM ') || 
      code.toUpperCase().includes('WHERE ') ||
      code.toUpperCase().includes('INSERT INTO ') ||
      code.toUpperCase().includes('CREATE TABLE '))) {
    return 'sql';
  }
  
  // Ruby
  if (code.includes('def ') && code.includes('end') ||
      code.includes('puts ') ||
      code.includes('require ')) {
    return 'ruby';
  }
  
  // If no patterns match, try a heuristic approach
  const lines = code.split('\n');
  let lineCount = lines.length;
  
  // Count language-specific indicators
  let jsScore = 0, pyScore = 0, cppScore = 0, javaScore = 0;
  
  for (const line of lines) {
    if (line.includes(';')) jsScore += 0.2;
    if (line.includes('var ') || line.includes('let ') || line.includes('const ')) jsScore += 1;
    if (line.includes('function ')) jsScore += 1;
    
    if (line.includes('    ') && !line.includes(';')) pyScore += 0.5;
    if (line.includes('def ') || line.includes('class ') && !line.includes(';')) pyScore += 1;
    if (line.includes(':') && !line.includes(';')) pyScore += 0.5;
    
    if (line.includes('{') || line.includes('}')) cppScore += 0.2;
    if (line.includes('int ') || line.includes('void ') || line.includes('char ')) cppScore += 0.5;
    
    if (line.includes('public ') || line.includes('private ')) javaScore += 0.5;
    if (line.includes('class ') && line.includes('{')) javaScore += 1;
  }
  
  // Determine highest score
  const scores = [
    { lang: 'javascript', score: jsScore },
    { lang: 'python', score: pyScore },
    { lang: 'cpp', score: cppScore },
    { lang: 'java', score: javaScore },
  ];
  
  scores.sort((a, b) => b.score - a.score);
  
  // Only use heuristic if score is significant
  if (scores[0].score > 2) {
    return scores[0].lang;
  }
  
  return null;
};

// Function to get the code template for a language
const getCodeTemplate = (language) => {
  const langId = getLanguageId(language);
  return languageSupport[langId]?.template || languageSupport['javascript'].template;
};

const CodeForm = ({ initialCode, language, onSubmit }) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const { isDark } = useTheme();
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [languageJustChanged, setLanguageJustChanged] = useState(false);
  
  // Set language when component mounts or language changes
  useEffect(() => {
    // First try to use the provided language prop
    if (language) {
      const langId = getLanguageId(language);
      setEditorLanguage(langId);
      return;
    }
    
    // If no language prop or it wasn't recognized, try to detect from the code
    if (initialCode) {
      const detectedLang = detectLanguageFromContent(initialCode);
      if (detectedLang) {
        setEditorLanguage(detectedLang);
        return;
      }
    }
    
    // Default fallback
    setEditorLanguage('javascript');
  }, [language, initialCode]);

  // Create an effect for language changes to show animation
  useEffect(() => {
    if (isEditorReady) {
      setLanguageJustChanged(true);
      const timer = setTimeout(() => setLanguageJustChanged(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [editorLanguage, isEditorReady]);
  
  // Set initial code template based on language or use provided code
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    } else {
      setCode(getCodeTemplate(language));
    }
  }, [initialCode, language]);

  const handleEditorChange = (value) => {
    setCode(value || '');
    
    // Auto-detect language as user types - now works even if a language was initially provided
    if (value) {
      const detectedLang = detectLanguageFromContent(value);
      if (detectedLang && detectedLang !== editorLanguage) {
        setEditorLanguage(detectedLang);
      }
    }
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
        await onSubmit(code);
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
        {/* Editor header with controls */}
        <div className="flex justify-between items-center px-4 py-2 bg-neutral text-neutral-content">
          <div className={`badge ${languageJustChanged ? 'badge-accent animate-pulse' : 'badge-neutral'} font-mono transition-all duration-300`}>
            <span className="mr-1">Auto:</span>
            {editorLanguage}
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

