import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FaEnvelope, FaGoogle, FaLock } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useToast } from '../ui/ToastProvider';
import { TurnstileWidget } from '../captcha/TurnstileWidget';
import { getMe } from '../../services/api';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export const AuthForm = ({ mode }: AuthFormProps) => {
  const { login, register, setAuthData, user: authUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAnalytics();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const tokenFromQuery = searchParams.get('token');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  const isLogin = mode === 'login';

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

  const handleTokenSignIn = async (token: string) => {
    try {
      setLoading(true);
      const result = await getMe(token);
      if (result?.user) {
        setAuthData(result.user, token);
        showToast({
          type: 'success',
          title: 'Bienvenido',
          description: 'Has iniciado sesión con Google correctamente.'
        });
        navigate('/dashboard');
      } else {
        throw new Error('No se pudo recuperar la información de usuario.');
      }
    } catch (err: any) {
      console.error('Google token sign-in error', err);
      setErrorMessage(err?.message || 'No se pudo iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenFromQuery && !authUser && !loading) {
      handleTokenSignIn(tokenFromQuery);
    }
  }, [tokenFromQuery, authUser, loading]);

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
        showToast({
          type: 'success',
          title: 'Cuenta creada',
          description: 'Tu cuenta se creó correctamente. Ya puedes acceder al panel.'
        });
        navigate('/dashboard');
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
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.45em] text-cyan-300/80">BIENVENIDO DE NUEVO</p>
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
                  placeholder="usuario@tuemail.com"
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
                  placeholder="Contraseña"
                  required
                  className="w-full rounded-3xl border border-slate-800/80 bg-slate-900/90 px-4 py-3 pl-12 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                />
              </div>
            </label>

            {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}

            <TurnstileWidget onVerify={setCaptchaToken} resetTrigger={resetCounter} />

            <button
              type="submit"
              className="w-full rounded-3xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_60px_rgba(67,191,255,0.25)] transition duration-300 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Accediendo...' : (isLogin ? 'Acceder a mi panel' : 'Crear cuenta')}
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
    </div>
  );
};