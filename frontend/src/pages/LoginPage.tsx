import { LoginForm } from '../components/auth/LoginForm';

export const LoginPage = () => (
  <div className="min-h-screen bg-slate-950 text-white">
    <div className="mx-auto flex min-h-screen max-w-full items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
      <div className="w-full space-y-8">
        <div className="rounded-[2.5rem] border border-slate-800/70 bg-slate-900/90 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="mb-10 max-w-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-400">VELTRIX</p>
            <p className="text-sm font-medium text-slate-300">AirDrop Premium</p>
            <h1 className="mt-6 text-3xl sm:text-4xl font-semibold text-white">Inicia sesión y descubre tu panel de progreso.</h1>
            <p className="mt-4 text-slate-400">Accede a tus misiones semanales, puntos y recompensas estimadas en una interfaz premium.</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  </div>
);
