import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useToast } from '../ui/ToastProvider';
import { TurnstileWidget } from '../captcha/TurnstileWidget';

export const RegisterForm = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAnalytics();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Siempre envía un token, incluso si está vacío
      const tokenToSend = captchaToken || 'dev-mode';
      await register(name.trim(), email.trim(), password, tokenToSend);
      user.register('email');
      showToast({
        type: 'success',
        title: 'Cuenta creada',
        description: 'Bienvenido a AirDrop Studio. Tu misión premium comienza ahora.'
      });
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la cuenta. Revisa tus datos e intenta de nuevo.';
      setError(message);
      showToast({
        type: 'error',
        title: 'Registro fallido',
        description: message
      });
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/40 max-w-md w-full">
      <h2 className="text-3xl font-semibold text-white">Crea tu cuenta</h2>
      <p className="mt-3 text-slate-400">Empieza a ganar tokens completando misiones exclusivas.</p>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <TurnstileWidget onVerify={setCaptchaToken} />
        <button
          type="submit"
          className="w-full rounded-3xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-fuchsia-500/20 transition duration-300 hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Creando tu acceso...' : 'Únete ahora'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-white underline decoration-fuchsia-500 decoration-2">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
};
