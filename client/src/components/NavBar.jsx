return (
  <div className="navbar bg-primary text-white shadow-md">
    {/* Logo and mobile menu */}
    <div className="navbar-start">
      <img src={fondo} alt="Logo" className="w-36 h-auto mr-4" />

      {/* Mobile Dropdown */}
      {!isAuthPage && (
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-10 p-2 shadow bg-base-100 rounded-box w-52 text-black">
            {routes.main.map(route => (
              <li key={route.path}>
                <Link to={route.path}>{route.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

    {/* Main nav for desktop */}
    {!isAuthPage && (
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {routes.main.map(route => (
            <li key={route.path}>
              <Link
                to={route.path}
                className={`${
                  location.pathname === route.path ? "bg-white text-primary font-semibold" : "hover:text-red-400"
                }`}
              >
                {route.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Right corner: Avatar + Settings */}
    <div className="navbar-end space-x-4">
      {!isAuthPage && (
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <img
                alt="Profile"
                src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
              />
            </div>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-10 p-2 shadow bg-base-100 rounded-box w-52">
            <li onClick={() => setSettingsOpen(!settingsOpen)}>
              <a>Settings</a>
            </li>
            {settingsOpen && (
              <div className="px-2 py-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Dark Mode</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                  />
                </div>
              </div>
            )}
            <li className="text-red-500 hover:text-red-700">
              <a>Log out</a>
            </li>
          </ul>
        </div>
      )}
    </div>
  </div>
);
