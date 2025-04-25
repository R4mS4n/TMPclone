import React, { createContext, useState, useEffect, useContext } from 'react';

// Crear el contexto
const ThemeContext = createContext();

// Proveedor del contexto
export const ThemeProvider = ({ children }) => {
  // Estado para almacenar el tema actual
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'TMPlight');

  // Efecto para actualizar el atributo data-theme en el HTML cuando cambia el tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Función para cambiar entre temas
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'TMPlight' ? 'TMPdark' : 'TMPlight'));
  };

  // Valores a compartir con los componentes
  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'TMPdark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado para acceder al contexto
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 