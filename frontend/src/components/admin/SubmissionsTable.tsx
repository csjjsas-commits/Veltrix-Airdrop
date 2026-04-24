import { SubmissionItem } from '../../types';

interface Props {
  submissions: SubmissionItem[];
  onReview: (id: string, action: 'approve' | 'reject') => void;
}

export const SubmissionsTable = ({ submissions, onReview }: Props) => (
  <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10 overflow-x-auto">
    <table className="min-w-full text-left text-sm text-slate-300">
      <thead>
        <tr className="border-b border-slate-800/70 text-slate-400">
          <th className="px-4 py-3">Usuario</th>
          <th className="px-4 py-3">Tarea</th>
          <th className="px-4 py-3">Estado</th>
          <th className="px-4 py-3">Puntos</th>
          <th className="px-4 py-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {submissions.map(item => (
          <tr key={item.id} className="border-b border-slate-800/70 hover:bg-slate-900/80">
            <td className="px-4 py-4">
              <div className="font-semibold text-white">{item.user.name}</div>
              <div className="text-slate-500">{item.user.email}</div>
            </td>
            <td className="px-4 py-4">{item.task.title}</td>
            <td className="px-4 py-4">{item.status}</td>
            <td className="px-4 py-4">{item.pointsAwarded ?? item.task.points}</td>
            <td className="px-4 py-4 space-x-2">
              <button
                className="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
                onClick={() => onReview(item.id, 'approve')}
              >
                Aprobar
              </button>
              <button
                className="rounded-2xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-400"
                onClick={() => onReview(item.id, 'reject')}
              >
                Rechazar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
