import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`fixed top-4 right-4 z-50 px-3 py-1.5 text-sm rounded-md font-medium transition-colors duration-200 ${
        theme === "TMPdark"
          ? "bg-base-100 text-base-content hover:bg-base-200"
          : "bg-white text-black hover:bg-gray-100"
      }`}
      title="Toggle theme"
    >
      {theme === "TMPdark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
