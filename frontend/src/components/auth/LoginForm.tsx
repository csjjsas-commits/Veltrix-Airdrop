import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useToast } from '../ui/ToastProvider';
import { TurnstileWidget } from '../captcha/TurnstileWidget';

export const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { user } = useAnalytics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  const { showToast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      // In development, allow empty token; in production, require valid token
      const tokenToSend = import.meta.env.DEV ? (captchaToken || 'dev-mode') : captchaToken;
      await login(email.trim(), password, tokenToSend);
      user.login('email');
      showToast({
        type: 'success',
        title: 'Acceso concedido',
        description: 'Bienvenido de vuelta. Cargando tu panel premium.'
      });
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Correo o contraseña incorrectos';
      setError(message);
      showToast({
        type: 'error',
        title: 'Error de acceso',
        description: message
      });
      // Reset Turnstile widget to get a new token
      setResetCounter(prev => prev + 1);
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/40 max-w-md w-full">
      <h2 className="text-3xl font-semibold text-white">Bienvenido de nuevo</h2>
      <p className="mt-3 text-slate-400">Ingresa con tu cuenta para ver tu progreso y misiones.</p>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <TurnstileWidget onVerify={setCaptchaToken} resetTrigger={resetCounter} />
        <button
          type="submit"
          className="w-full rounded-3xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-fuchsia-500/20 transition duration-300 hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Verificando credenciales...' : 'Acceder a mi panel'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-400">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-semibold text-white underline decoration-fuchsia-500 decoration-2">
          Regístrate
        </Link>
      </p>
    </div>
  );
};
