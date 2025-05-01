/**
 * Maps language display names to Monaco Editor language identifiers
 * @param {string} languageName - The display name of the language
 * @returns {string} The Monaco Editor language identifier
 */
export const getMonacoLanguage = (languageName) => {
  if (!languageName) return 'plaintext';
  
  const langLower = languageName.toLowerCase();
  
  if (langLower.includes('bash')) return 'shell';
  if (langLower.includes('basic')) return 'vb';
  if (langLower.startsWith('c (')) return 'c';
  if (langLower.includes('c++') || langLower.includes('g++')) return 'cpp';
  if (langLower.includes('c#')) return 'csharp';
  if (langLower.includes('clojure')) return 'clojure';
  if (langLower.includes('crystal')) return 'ruby'; // Using Ruby as fallback
  if (langLower.includes('elixir')) return 'elixir';
  if (langLower.includes('erlang')) return 'erlang';
  if (langLower.includes('go')) return 'go';
  if (langLower.includes('haskell')) return 'haskell';
  if (langLower.includes('insect')) return 'javascript'; // Using JS as fallback
  if (langLower.includes('java')) return 'java';
  if (langLower.includes('javascript')) return 'javascript';
  if (langLower.includes('ocaml')) return 'ocaml';
  if (langLower.includes('octave')) return 'matlab'; // Using MATLAB as fallback
  if (langLower.includes('pascal')) return 'pascal';
  if (langLower.includes('python')) return 'python';
  if (langLower.includes('ruby')) return 'ruby';
  if (langLower.includes('rust')) return 'rust';
  if (langLower.includes('text')) return 'plaintext';
  
  return 'plaintext'; // Default fallback
};

/**
 * Gets a template code snippet for a given language
 * @param {string} languageName - The display name of the language
 * @returns {string} A code template for the language
 */
export const getCodeTemplate = (languageName) => {
  if (!languageName) return '// Write your code here\n';
  
  const langLower = languageName.toLowerCase();
  
  if (langLower.includes('bash')) {
    return '#!/bin/bash\n\n# Write your Bash script here\n\necho "Hello, World!"\n';
  }
  
  if (langLower.includes('c++')) {
    return '#include <iostream>\n\nint main() {\n    // Write your C++ code here\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n';
  }
  
  if (langLower.startsWith('c (')) {
    return '#include <stdio.h>\n\nint main() {\n    // Write your C code here\n    printf("Hello, World!\\n");\n    return 0;\n}\n';
  }
  
  if (langLower.includes('c#')) {
    return 'using System;\n\npublic class Program {\n    public static void Main(string[] args) {\n        // Write your C# code here\n        Console.WriteLine("Hello, World!");\n    }\n}\n';
  }
  
  if (langLower.includes('java')) {
    return 'public class Main {\n    public static void main(String[] args) {\n        // Write your Java code here\n        System.out.println("Hello, World!");\n    }\n}\n';
  }
  
  if (langLower.includes('javascript')) {
    return '// Write your JavaScript code here\n\nconsole.log("Hello, World!");\n';
  }
  
  if (langLower.includes('python')) {
    return '# Write your Python code here\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n';
  }
  
  if (langLower.includes('ruby')) {
    return '# Write your Ruby code here\n\nputs "Hello, World!"\n';
  }
  
  if (langLower.includes('rust')) {
    return 'fn main() {\n    // Write your Rust code here\n    println!("Hello, World!");\n}\n';
  }
  
  if (langLower.includes('go')) {
    return 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your Go code here\n    fmt.Println("Hello, World!")\n}\n';
  }
  
  return '// Write your code here\n';
}; 