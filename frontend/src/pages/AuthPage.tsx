import { useLocation } from 'react-router-dom';
import { AuthForm } from '../components/auth/AuthForm';

export const AuthPage = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.2),_transparent_35%),_linear-gradient(180deg,_#050816_0%,_#090b16_100%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-8 px-6 py-16 lg:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-10 rounded-[2.5rem] border border-slate-800/60 bg-slate-950/70 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-500/20 ring-1 ring-violet-400/20">
              <span className="text-2xl font-bold text-violet-300">V</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-violet-400 font-semibold">VELTRIX</p>
              <p className="text-sm text-slate-400">race. compete. earn.</p>
            </div>
          </div>
          <div className="max-w-2xl">
            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              {isLogin
                ? 'Inicia sesión y descubre tu panel de progreso'
                : 'Regístrate y comienza a ganar'
              }
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-400">
              {isLogin
                ? 'Accede a tus misiones semanales, puntos y recompensas estimadas en una interfaz premium con looks de crypto y experiencia de piloto.'
                : 'Únete a la experiencia más elegante para completar misiones y reclamar tokens.'
              }
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800/60 bg-slate-900/80 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                {isLogin ? 'Bienvenido de nuevo' : 'No tienes cuenta?'}
              </p>
              <p className="mt-4 text-sm text-slate-400">
                {isLogin
                  ? 'Ingresa con tu cuenta para ver tu progreso y misiones.'
                  : 'Regístrate para activar tu nodo y empezar a ganar tokens.'
                }
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800/60 bg-slate-900/80 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                {isLogin ? 'No tienes cuenta?' : 'Bienvenido de nuevo'}
              </p>
              <p className="mt-4 text-sm text-slate-400">
                {isLogin
                  ? 'Regístrate para activar tu nodo y empezar a ganar tokens.'
                  : 'Ingresa con tu cuenta para ver tu progreso y misiones.'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-800/70 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <AuthForm mode={isLogin ? 'login' : 'register'} />
        </div>
      </div>
    </div>
  );
};