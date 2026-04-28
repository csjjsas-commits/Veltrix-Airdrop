import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDashboard } from '../../services/api';
import { UserTask } from '../../types';

interface Props {
  referralTask?: UserTask | null;
}

export const TareasReferralPanel = ({ referralTask }: Props) => {
  const { user, token } = useAuth();
  const [referralStats, setReferralStats] = useState({ count: 0, pointsEarned: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        const dashboard = await getDashboard(token);
        const refTask = dashboard.availableTasks?.find((t: UserTask) => t.taskType === 'REFERRAL');
        if (refTask?.referralCount !== undefined) {
          const pointsEarned = (refTask.referralCount || 0) * (referralTask?.points || 0);
          setReferralStats({ count: refTask.referralCount || 0, pointsEarned });
        }
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [token, referralTask?.points]);

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
    <div className="sticky top-24 rounded-3xl border border-brand-elitePurple/30 bg-gradient-to-br from-brand-elitePurple/10 to-brand-elitePurple/5 px-6 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-2xl font-bold text-brand-pureWhite mb-1">Referidos</h3>
          <p className="text-sm text-brand-softGray">Invita amigos y gana puntos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-brand-graphite/50 bg-brand-graphite/20 px-4 py-3 text-center">
            <div className="text-3xl font-bold text-brand-neonCyan">{referralStats.count}</div>
            <div className="text-xs text-brand-softGray mt-1">Referidos</div>
          </div>
          <div className="rounded-2xl border border-brand-graphite/50 bg-brand-graphite/20 px-4 py-3 text-center">
            <div className="text-3xl font-bold text-brand-amber-400">{referralStats.pointsEarned}</div>
            <div className="text-xs text-brand-softGray mt-1">Pts ganados</div>
          </div>
        </div>

        {/* Link Section */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3">
            <p className="text-xs text-brand-softGray break-all">{referralUrl}</p>
          </div>

          <button
            onClick={handleCopy}
            className="w-full rounded-2xl bg-brand-elitePurple px-4 py-3 text-sm font-semibold text-brand-pureWhite transition hover:bg-brand-elitePurple/80"
          >
            {copied ? '✓ ¡Copiado!' : '📋 Copiar link'}
          </button>
        </div>

        {/* Description */}
        {referralTask && (
          <div className="rounded-2xl bg-brand-graphite/20 px-4 py-3">
            <p className="text-xs text-brand-softGray">
              Gana <span className="text-brand-amber-400 font-bold">{referralTask.points} puntos</span> por cada amigo que se registre y complete al menos una tarea.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
