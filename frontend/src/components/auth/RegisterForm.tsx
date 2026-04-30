import { FormEvent, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
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
  const [resetCounter, setResetCounter] = useState(0);

  const handleGoogleSignUp = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google/auth-url`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'No se pudo iniciar Google Sign-In');
      }
      const payload = await response.json();
      const authUrl = payload.authUrl;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error('No se pudo obtener la URL de Google Sign-In');
      }
    } catch (err: any) {
      console.error('Google auth error', err);
      setErrorMessage(err?.message || 'Error al conectar con Google');
      showToast({
        type: 'error',
        title: 'Google Sign-In falló',
        description: err?.message || 'Intenta de nuevo más tarde.'
      });
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
      await register(name.trim(), email.trim(), password, tokenToSend, referralCode || undefined);
      user.register('email');
      showToast({
        type: 'success',
        title: 'Cuenta creada',
        description: 'Tu cuenta se creó correctamente y ya puedes acceder al panel.'
      });
      navigate('/dashboard');
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
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/90 p-6 sm:p-8 shadow-2xl shadow-slate-950/40 max-w-full w-full">
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
    </div>
  );
};
