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
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950/95 p-4 sm:p-5 lg:p-6 shadow-2xl shadow-black/40 md:sticky md:top-24">
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500 font-semibold">Referidos</p>
          <h3 className="mt-3 text-xl sm:text-2xl font-bold text-white">Invitá a tus amigos</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-4 sm:p-5 text-center">
            <p className="text-xs uppercase tracking-widest text-slate-500">Referidos</p>
            <p className="mt-4 text-3xl sm:text-4xl font-bold text-white">{referralStats.count}</p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-4 sm:p-5 text-center">
            <p className="text-xs uppercase tracking-widest text-slate-500">Pts ganados</p>
            <p className="mt-4 text-3xl sm:text-4xl font-bold text-violet-300">{referralStats.pointsEarned}</p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Tu enlace</p>
          <div className="rounded-[1.75rem] bg-slate-900/90 border border-slate-800 p-4">
            <p className="text-sm text-slate-300 break-all font-mono">{referralUrl}</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="w-full rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
        >
          {copied ? '✓ Copiado' : '📋 Copiar link'}
        </button>

        {referralTask && (
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-4 text-sm text-slate-400">
            Gana <span className="font-semibold text-violet-300">{referralTask.points} puntos</span> por cada amigo que se registre y complete al menos una tarea.
          </div>
        )}
      </div>
    </div>
  );
};
