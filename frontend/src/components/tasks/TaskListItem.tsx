import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { completeTask, startTask } from '../../services/api';
import { UserTask } from '../../types';
import { CountdownBadge } from './CountdownBadge';
import { useAnalytics } from '../../hooks/useAnalytics';

interface Props {
  task: UserTask;
  onTaskUpdate?: (updatedTask: UserTask) => void;
  onTaskAction?: (task: UserTask) => void;
}

const getPlatformIcon = (platform?: string, taskType?: string) => {
  if (taskType === 'REFERRAL') return '👥';
  const p = platform?.toLowerCase();
  if (p === 'instagram') return '📷';
  if (p === 'twitter' || p === 'x') return '𝕏';
  if (p === 'youtube') return '▶️';
  if (p === 'telegram') return '✈️';
  return '⭐';
};

export const TaskListItem = ({ task, onTaskUpdate, onTaskAction }: Props) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { token } = useAuth();
  const { task: taskAnalytics } = useAnalytics();

  const handleAction = async () => {
    if (!token) return;
    setIsProcessing(true);

    try {
      if (task.taskType === 'EXTERNAL_LINK' || task.taskType === 'REFERRAL' || task.taskType === 'WALLET_ACTION') {
        const updatedTask = await startTask(token, task.id);
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask);
        }
        if (task.actionUrl && task.taskType !== 'REFERRAL') {
          window.open(task.actionUrl, '_blank');
        } else if (task.taskType === 'REFERRAL' && onTaskAction) {
          onTaskAction(task);
        }
      } else {
        const completedTask = await completeTask(token, task.id);
        if (onTaskUpdate) {
          taskAnalytics.completed(task.id, task.title || 'Unknown Task', task.points);
          onTaskUpdate(completedTask);
        }
      }
    } catch (error) {
      console.error('Error processing task:', error);
      taskAnalytics.failed(task.id, task.title || 'Unknown Task', 'Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (task.status === 'COMPLETED') return '✓ Completada';
    if (task.status === 'PENDING') return 'En revisión';
    if (task.taskType === 'REFERRAL') return task.status === 'IN_PROGRESS' ? 'Continuar' : 'Invitar';
    if (task.taskType === 'EXTERNAL_LINK') return task.status === 'IN_PROGRESS' ? 'Continuar' : 'Abrir';
    if (task.taskType === 'WALLET_ACTION') return 'Conectar';
    return 'Completar';
  };

  const isDisabled = task.status === 'COMPLETED' || task.status === 'PENDING' || isProcessing;
  const isCompleted = task.status === 'COMPLETED';

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.20)] transition hover:-translate-y-1 hover:border-violet-500/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-500/10 text-2xl text-violet-300">
            {getPlatformIcon(task.platform, task.taskType)}
          </div>
          <div className="min-w-0">
            <h4 className="text-lg font-semibold text-white truncate">{task.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400 truncate">{task.description || 'Completa esta misión para ganar puntos'}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              <span className="rounded-full border border-slate-800 bg-slate-900/80 px-3 py-2">{task.points} pts</span>
              <span className="rounded-full border border-slate-800 bg-slate-900/80 px-3 py-2">{task.taskType.replace('_', ' ')}</span>
              {task.endDate && !isCompleted && <CountdownBadge endDate={task.endDate} />}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={handleAction}
            disabled={isDisabled}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition whitespace-nowrap ${
              isCompleted
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isProcessing ? 'Procesando...' : getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};
