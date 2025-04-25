import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-sm btn-ghost absolute top-4 right-4 z-50"
      title="Toggle theme"
    >
      {theme === "TMPdark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
