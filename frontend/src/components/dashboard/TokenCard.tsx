import { DashboardStats } from '../../types';

interface Props {
  stats: DashboardStats;
}

export const TokenCard = ({ stats }: Props) => (
  <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4 sm:p-5 lg:p-6 shadow-2xl shadow-slate-950/20">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-400">Estimated Tokens</p>
        <h3 className="mt-3 text-3xl sm:text-4xl font-semibold text-white">{stats.estimatedTokens}</h3>
      </div>
      <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-right text-sm text-slate-300">
        <p>{stats.completedTasks} completadas</p>
        <p className="mt-2 text-white">{stats.pendingTasks} pendientes</p>
      </div>
    </div>
    <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-300">
      <div className="rounded-3xl bg-slate-900/80 p-4">
        <p className="text-slate-400">Puntos totales</p>
        <p className="mt-2 text-xl font-semibold text-white">{stats.totalPoints}</p>
      </div>
      <div className="rounded-3xl bg-slate-900/80 p-4">
        <p className="text-slate-400">Tareas completadas</p>
        <p className="mt-2 text-xl font-semibold text-white">{stats.completedTasks}</p>
      </div>
    </div>
  </div>
);
