import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  // Detect and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-base-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="text-xl font-bold text-primary">
          <Link to="/">TMP</Link>
        </div>

        {/* Desktop menu */}
        <div className="hidden md:flex space-x-4">
          <Link
            to="/home"
            className={`btn btn-ghost ${isActive("/home") ? "text-primary font-bold" : ""}`}
          >
            Home
          </Link>
          <Link
            to="/challenges"
            className={`btn btn-ghost ${isActive("/challenges") ? "text-primary font-bold" : ""}`}
          >
            Challenges
          </Link>
          <Link
            to="/leaderboard"
            className={`btn btn-ghost ${isActive("/leaderboard") ? "text-primary font-bold" : ""}`}
          >
            Leaderboard
          </Link>
          <Link
            to="/blog"
            className={`btn btn-ghost ${isActive("/blog") ? "text-primary font-bold" : ""}`}
          >
            Blog
          </Link>
          <Link
            to="/admin"
            className={`btn btn-ghost ${isActive("/admin") ? "text-primary font-bold" : ""}`}
          >
            Admin
          </Link>
        </div>

        {/* Theme toggle + hamburger */}
        <div className="flex items-center space-x-2">
          <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
          <button className="md:hidden btn btn-ghost" onClick={toggleMenu}>
            ☰
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col space-y-2">
          <Link to="/home" className="btn btn-block" onClick={toggleMenu}>
            Home
          </Link>
          <Link to="/challenges" className="btn btn-block" onClick={toggleMenu}>
            Challenges
          </Link>
          <Link to="/leaderboard" className="btn btn-block" onClick={toggleMenu}>
            Leaderboard
          </Link>
          <Link to="/blog" className="btn btn-block" onClick={toggleMenu}>
            Blog
          </Link>
          <Link to="/admin" className="btn btn-block" onClick={toggleMenu}>
            Admin
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
