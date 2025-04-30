import React, { createContext, useState, useEffect, useContext } from 'react';

// Get the initial theme and set it on the document element immediately
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const theme = savedTheme || 'TMPlight';
  // Set the theme on the document element immediately
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
};

// Crear el contexto
const ThemeContext = createContext();

// Proveedor del contexto
export const ThemeProvider = ({ children }) => {
  // Estado para almacenar el tema actual, usando el tema ya establecido
  const [theme, setTheme] = useState(getInitialTheme);

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