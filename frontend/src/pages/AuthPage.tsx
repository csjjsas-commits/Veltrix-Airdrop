import { useLocation } from 'react-router-dom';
import { AuthForm } from '../components/auth/AuthForm';

export const AuthPage = () => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[#02040f]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,207,255,0.16),transparent_20%),radial-gradient(circle_at_80%_10%,rgba(120,77,255,0.14),transparent_12%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_20%_15%,rgba(255,255,255,0.06),transparent_3%),radial-gradient(circle_85%_18%,rgba(255,255,255,0.04),transparent_4%)] opacity-70" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.02),rgba(255,255,255,0.02)_1px,transparent_1px,transparent_24px),repeating-linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0.02)_1px,transparent_1px,transparent_24px)] opacity-20" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-full items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 w-full gap-6 sm:gap-8 lg:gap-12 rounded-[2.5rem] border border-cyan-400/10 bg-white/5 p-4 sm:p-6 lg:p-8 shadow-[0_30px_130px_rgba(0,207,255,0.14)] backdrop-blur-xl lg:grid-cols-[1fr_0.85fr]">
          <div className="space-y-6 sm:space-y-8 lg:space-y-10 rounded-[2rem] border border-white/10 bg-slate-950/30 p-6 sm:p-8 lg:p-10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="flex items-center justify-center">
              <img src="/branding/logo.png" alt="Veltrix Logo" className="h-14 sm:h-16 lg:h-20 w-auto" />
            </div>

            <div className="max-w-2xl">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-semibold leading-[1.02] tracking-tight text-white">
                Inicia sesión y descubre tu panel de progreso
              </h1>
              <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg leading-7 sm:leading-8 text-slate-300">
                Accede a tus misiones semanales, puntos y recompensas estimadas en una interfaz premium con looks de crypto y experiencia de piloto.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-4 sm:p-5 lg:p-6 shadow-[0_20px_80px_rgba(24,30,54,0.35)] backdrop-blur-xl">
            <AuthForm mode={isLogin ? 'login' : 'register'} />
          </div>
        </div>
      </div>
    </div>
  );
};