import { FormEvent, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FaGoogle, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useToast } from '../ui/ToastProvider';
import { TurnstileWidget } from '../captcha/TurnstileWidget';

export const RegisterForm = () => {
  const { register } = useAuth();
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

  const handleGoogleSignUp = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      console.log('Iniciando flujo de Google Auth');
      // Aquí debería ir la llamada real al proveedor de Google Auth,
      // por ejemplo signInWithPopup de Firebase o la redirección de Supabase.
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
      // In development, allow empty token; in production, require valid token
      const tokenToSend = import.meta.env.DEV ? (captchaToken || 'dev-mode') : captchaToken;
      await register(name.trim(), email.trim(), password, tokenToSend, referralCode || undefined);
      user.register('email');
      setIsRegistrationSuccessful(true);
      showToast({
        type: 'success',
        title: 'Cuenta creada',
        description: 'Hemos enviado un enlace de confirmación a tu correo electrónico.'
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la cuenta. Revisa tus datos e intenta de nuevo.';
      setErrorMessage(message);
      showToast({
        type: 'error',
        title: 'Registro fallido',
        description: message
      });
      setResetCounter(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/40 max-w-md w-full">
      {!isRegistrationSuccessful ? (
        <>
          <h2 className="text-3xl font-semibold text-white">Crea tu cuenta</h2>
          <p className="mt-3 text-slate-400">Empieza a ganar tokens completando misiones exclusivas.</p>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-violet-500/60 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaGoogle className="h-5 w-5 text-violet-400" />
              Continuar con Google
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-slate-800" />
              <span>o regístrate con tu email</span>
              <span className="h-px flex-1 bg-slate-800" />
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <label className="block text-sm text-slate-300">
                Nombre completo
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-fuchsia-500"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-fuchsia-500"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Contraseña
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-fuchsia-500"
                />
              </label>

              {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}
              <TurnstileWidget onVerify={setCaptchaToken} resetTrigger={resetCounter} />

              <button
                type="submit"
                className="w-full rounded-3xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-fuchsia-500/20 transition duration-300 hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Creando tu acceso...' : 'Únete ahora'}
              </button>
            </form>

            <p className="text-sm text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold text-white underline decoration-fuchsia-500 decoration-2">
                Inicia sesión
              </Link>
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-6 text-center py-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/10 text-violet-300">
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
              className="w-full rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Volver al inicio
            </button>
            <button
              type="button"
              onClick={() => console.log('Reenviar correo de confirmación')}
              className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-500"
            >
              Reenviar correo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
