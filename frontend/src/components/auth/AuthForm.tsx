import { FormEvent, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FaEnvelope, FaGoogle, FaLock, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useToast } from '../ui/ToastProvider';
import { TurnstileWidget } from '../captcha/TurnstileWidget';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export const AuthForm = ({ mode }: AuthFormProps) => {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAnalytics();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistrationSuccessful, setIsRegistrationSuccessful] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  const isLogin = mode === 'login';

  const handleGoogleSignUp = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      console.log('Iniciando flujo de Google Auth');
      // Aquí se puede agregar la integración real con Google.
    } catch (err) {
      console.error('Google auth error', err);
      setErrorMessage('Error al conectar con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const tokenToSend = import.meta.env.DEV ? (captchaToken || 'dev-mode') : captchaToken;

      if (isLogin) {
        await login(email.trim(), password, tokenToSend);
        user.login('email');
        showToast({
          type: 'success',
          title: 'Acceso concedido',
          description: 'Bienvenido de vuelta. Cargando tu panel premium.'
        });
        navigate('/dashboard');
      } else {
        await register(name.trim(), email.trim(), password, tokenToSend, referralCode || undefined);
        user.register('email');
        setIsRegistrationSuccessful(true);
        showToast({
          type: 'success',
          title: 'Cuenta creada',
          description: 'Hemos enviado un enlace de confirmación a tu correo electrónico.'
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : (isLogin ? 'Correo o contraseña incorrectos' : 'No se pudo crear la cuenta. Revisa tus datos e intenta de nuevo.');
      setErrorMessage(message);
      showToast({
        type: 'error',
        title: isLogin ? 'Error de acceso' : 'Registro fallido',
        description: message
      });
      setResetCounter(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-[2rem] border border-cyan-400/10 bg-slate-950/95 p-8 shadow-[0_20px_80px_rgba(0,207,255,0.16)] backdrop-blur-3xl">
      {!isRegistrationSuccessful ? (
        <>
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.45em] text-cyan-300/80">BIENVENIDO DE NUEVO</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Accede a tu panel premium y continúa ganando tokens.
            </h2>
            <p className="text-sm leading-6 text-slate-400">
              Ingresa con tu cuenta para ver tu progreso y misiones.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-3xl border border-white/10 bg-slate-900/95 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaGoogle className="h-5 w-5 text-cyan-300" />
              Unirse con Google
            </button>

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
              <span className="h-px flex-1 bg-slate-800/80" />
              <span>o continúa con tu email</span>
              <span className="h-px flex-1 bg-slate-800/80" />
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <label className="block text-sm text-slate-300">
                Nombre completo
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nombre completo"
                  required
                  className="mt-2 w-full rounded-3xl border border-slate-800/80 bg-slate-900/90 px-4 py-3 pl-12 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                />
              </label>
            )}

            <label className="block text-sm text-slate-300">
              Email
              <div className="relative mt-2">
                <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/80" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Juan@veltrix.com"
                  required
                  className="w-full rounded-3xl border border-slate-800/80 bg-slate-900/90 px-4 py-3 pl-12 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                />
              </div>
            </label>

            <label className="block text-sm text-slate-300">
              Contraseña
              <div className="relative mt-2">
                <FaLock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/80" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="*************"
                  required
                  className="w-full rounded-3xl border border-slate-800/80 bg-slate-900/90 px-4 py-3 pl-12 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                />
              </div>
            </label>

            {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}

            <div className="rounded-3xl border border-slate-800/80 bg-slate-900 p-4">
              <TurnstileWidget onVerify={setCaptchaToken} resetTrigger={resetCounter} />
            </div>

            <button
              type="submit"
              className="w-full rounded-3xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_60px_rgba(67,191,255,0.25)] transition duration-300 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Accediendo...' : 'Acceder a mi panel'}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-400">
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <Link
              to={isLogin ? '/register' : '/login'}
              className="font-semibold text-white underline decoration-cyan-300 decoration-2"
            >
              {isLogin ? 'Registrate' : 'Inicia sesión'}
            </Link>
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-6 text-center py-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
            <FaCheckCircle className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-white">¡Casi listo, Piloto!</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400 max-w-sm mx-auto">
              Hemos enviado un enlace de confirmación a tu correo electrónico. Por favor, verifícalo para activar tu enlace neuronal y acceder a las misiones.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Volver al inicio
            </button>
            <button
              type="button"
              onClick={() => console.log('Reenviar correo de confirmación')}
              className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300"
            >
              Reenviar correo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};