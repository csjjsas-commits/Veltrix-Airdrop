import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const TopBar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Tareas', path: '/tasks' },
    ...(user?.role === 'ADMIN' ? [{ label: 'Admin', path: '/admin' }] : [])
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-brand-graphite/60 bg-brand-blackVoid/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <NavLink to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-electricBlue shadow-brand-glow">
            <span className="text-lg font-bold text-brand-blackVoid">V</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-softGray">VELTRIX</p>
            <p className="text-sm font-semibold text-brand-pureWhite">Rewards Hub</p>
          </div>
        </NavLink>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl border border-brand-graphite/80 bg-brand-graphite/80 p-2 text-brand-softGray transition hover:border-brand-neonCyan hover:text-brand-pureWhite md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label="Abrir menú de navegación"
        >
          <span className="text-xl">☰</span>
        </button>

        <nav className={`absolute inset-x-0 top-full z-40 mx-auto w-full max-w-7xl bg-brand-deepBlue/95 px-6 py-4 shadow-2xl shadow-brand-blackVoid/40 backdrop-blur-xl transition-all duration-300 md:static md:block md:w-auto md:bg-transparent md:px-0 md:py-0 ${menuOpen ? 'block' : 'hidden'}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-graphite/80 text-brand-neonCyan border border-brand-neonCyan/20 shadow-[0_15px_35px_rgba(0,207,255,0.09)]'
                      : 'text-brand-softGray hover:bg-brand-graphite/80 hover:text-brand-pureWhite'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="flex flex-col gap-3 border-t border-brand-graphite/70 pt-4 md:flex-row md:border-none md:pt-0 md:ml-auto md:items-center">
              {user ? (
                <>
                  <div className="hidden items-center gap-3 rounded-2xl border border-brand-graphite/70 bg-brand-graphite/80 px-4 py-2 text-brand-softGray md:flex">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-neonCyan text-brand-blackVoid font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-brand-pureWhite">{user.name}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-softGray">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="rounded-2xl bg-brand-neonCyan px-4 py-2 text-sm font-semibold text-brand-blackVoid transition hover:brightness-110"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="rounded-2xl bg-brand-neonCyan px-4 py-2 text-sm font-semibold text-brand-blackVoid transition hover:brightness-110"
                >
                  Ingresar
                </NavLink>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};
