import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const ReferralPanel = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user?.referralCode) {
    return null;
  }

  const referralUrl = `${window.location.origin}/register?ref=${user.referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="rounded-3xl border border-brand-elitePurple/30 bg-brand-elitePurple/10 px-4 sm:px-5 lg:px-6 py-4 sm:py-5">
      <div className="flex items-start gap-3">
        <div className="text-xl sm:text-2xl">👥</div>
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-brand-pureWhite mb-2">Invita a tus amigos</h3>
          <p className="text-sm text-brand-softGray mb-4">
            Comparte tu enlace de referido y gana puntos cuando tus amigos se registren y completen tareas.
          </p>

          <div className="space-y-3">
            <div className="rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3">
              <p className="text-sm text-brand-softGray break-all">{referralUrl}</p>
            </div>

            <button
              onClick={handleCopy}
              className="w-full rounded-2xl bg-brand-elitePurple px-4 py-3 text-sm font-semibold text-brand-pureWhite transition hover:bg-brand-elitePurple/80"
            >
              {copied ? '¡Copiado!' : 'Copiar enlace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};