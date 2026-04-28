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
    <div className="sticky top-24 rounded-[2rem] border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-black/40">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-violet-300">Referidos</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Invitá a tus amigos</h3>
            <p className="mt-2 text-sm text-slate-400">Comparte tu enlace para ganar puntos cuando tus amigos completen tareas.</p>
          </div>
          <div className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200">
            Premio por referido: {referralTask?.points ?? 0} pts
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-4 text-center">
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Referidos</p>
            <p className="mt-4 text-4xl font-bold text-white">{referralStats.count}</p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-4 text-center">
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Pts ganados</p>
            <p className="mt-4 text-4xl font-bold text-violet-300">{referralStats.pointsEarned}</p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Tu enlace</p>
              <p className="mt-2 text-sm text-slate-400 break-all">Comparte este enlace con tus amigos</p>
            </div>
            <button
              onClick={handleCopy}
              className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              {copied ? '✓ Copiado' : 'Copiar link'}
            </button>
          </div>
          <div className="mt-4 rounded-[1.5rem] bg-slate-950/90 p-4 border border-slate-800 text-sm text-slate-300 break-all">
            {referralUrl}
          </div>
        </div>

        {referralTask && (
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-4 text-sm text-slate-400">
            Gana <span className="font-semibold text-violet-300">{referralTask.points} puntos</span> por cada amigo que se registre y complete al menos una tarea.
          </div>
        )}
      </div>
    </div>
  );
};
