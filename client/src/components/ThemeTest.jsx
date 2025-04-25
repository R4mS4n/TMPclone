import React from "react";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeTest() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-4 bg-base-100 text-base-content border border-primary rounded-lg m-4">
      <h3 className="text-xl font-bold text-primary mb-2">Theme Test Component</h3>
      <p className="mb-2">
        Current theme: <strong>{theme}</strong>
      </p>
      <button onClick={toggleTheme} className="btn btn-sm mb-2">
        Switch to {theme === "TMPlight" ? "Dark" : "Light"} Theme
      </button>
      
      <div className="flex flex-wrap gap-2 mt-4">
        <button className="btn btn-primary">Primary Button</button>
        <button className="btn btn-secondary">Secondary Button</button>
        <button className="btn btn-accent">Accent Button</button>
        <button className="btn btn-info">Info Button</button>
        <button className="btn btn-success">Success Button</button>
        <button className="btn btn-warning">Warning Button</button>
        <button className="btn btn-error">Error Button</button>
      </div>
    </div>
  );
} 