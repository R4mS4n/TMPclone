// This file is needed to properly set up web workers for Monaco Editor

// You can import the required workers here
// Example:
// import 'monaco-editor/esm/vs/language/typescript/ts.worker';
// import 'monaco-editor/esm/vs/language/css/css.worker';
// import 'monaco-editor/esm/vs/language/json/json.worker';

self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === 'json') {
      return './json.worker.js';
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return './css.worker.js';
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return './html.worker.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return './ts.worker.js';
    }
    return './editor.worker.js';
  }
}; 