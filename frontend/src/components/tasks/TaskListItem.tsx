import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { completeTask, startTask } from '../../services/api';
import { UserTask } from '../../types';
import { CountdownBadge } from './CountdownBadge';
import { useAnalytics } from '../../hooks/useAnalytics';
import { FaInstagram, FaTelegramPlane, FaTwitter, FaYoutube, FaUsers, FaExternalLinkAlt } from 'react-icons/fa';

interface Props {
  task: UserTask;
  onTaskUpdate?: (updatedTask: UserTask) => void;
  onTaskAction?: (task: UserTask) => void;
  onOpenModal?: (task: UserTask) => void;
}

const getPlatformIcon = (platform?: string, taskType?: string) => {
  if (taskType === 'REFERRAL') return <FaUsers size={20} className="text-violet-300" />;
  const p = platform?.toLowerCase();
  if (p === 'instagram') return <FaInstagram size={20} className="text-violet-300" />;
  if (p === 'twitter' || p === 'x') return <FaTwitter size={20} className="text-violet-300" />;
  if (p === 'youtube') return <FaYoutube size={20} className="text-violet-300" />;
  if (p === 'telegram') return <FaTelegramPlane size={20} className="text-violet-300" />;
  return <FaTwitter size={20} className="text-violet-300" />;
};

export const TaskListItem = ({ task, onTaskUpdate, onTaskAction, onOpenModal }: Props) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const { token } = useAuth();
  const { task: taskAnalytics } = useAnalytics();

  useEffect(() => {
    if (task.timeLimit && task.status === 'IN_PROGRESS' && task.createdAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const startTime = new Date(task.createdAt!).getTime();
        const elapsed = now - startTime;
        const limitMs = task.timeLimit! * 60 * 1000;
        const remaining = limitMs - elapsed;

        if (remaining <= 0) {
          setTimeRemaining('00:00:00');
          clearInterval(interval);
        } else {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [task.timeLimit, task.status, task.createdAt]);

  const handleAction = async () => {
    if (!token) return;
    setIsProcessing(true);

    try {
      if (task.taskType === 'EXTERNAL_LINK' || task.taskType === 'WALLET_ACTION') {
        const updatedTask = await startTask(token, task.id);
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask);
        }
        if (task.taskType === 'EXTERNAL_LINK' && task.actionUrl) {
          window.open(task.actionUrl, '_blank');
        }
        if (onOpenModal && updatedTask) {
          onOpenModal(updatedTask);
        }
        return;
      }

      if (task.taskType === 'REFERRAL') {
        const updatedTask = await startTask(token, task.id);
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask);
        }
        if (onTaskAction) {
          onTaskAction(task);
        }
        return;
      }

      if (task.taskType === 'MANUAL_SUBMIT') {
        if (onOpenModal) {
          onOpenModal(task);
        }
        return;
      }

      if (onOpenModal) {
        onOpenModal(task);
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
    if (task.taskType === 'EXTERNAL_LINK') return task.status === 'IN_PROGRESS' ? 'Continuar' : 'Completar';
    if (task.taskType === 'WALLET_ACTION') return 'Conectar';
    return 'Completar';
  };

  const isDisabled = task.status === 'COMPLETED' || task.status === 'PENDING' || isProcessing;
  const isCompleted = task.status === 'COMPLETED';

  return (
    <div className={`rounded-[2rem] border p-5 shadow-[0_20px_40px_rgba(0,0,0,0.20)] transition ${
      isCompleted
        ? 'border-slate-700 bg-slate-900/90 text-slate-400'
        : 'border-slate-800 bg-slate-950/90 hover:-translate-y-1 hover:border-violet-500/30'
    }`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-500/10 flex-shrink-0">
            {getPlatformIcon(task.platform, task.taskType)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-lg font-semibold text-white truncate">{task.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400 truncate">{task.description || 'Completa esta misión para ganar puntos'}</p>
            <div className="mt-3">
              <span className="rounded-full border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{task.points} pts</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {task.actionUrl && (
              <a
                href={task.actionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/95 px-3 py-2 text-xs font-semibold text-violet-300 transition hover:bg-slate-900 hover:text-violet-200"
              >
                <FaExternalLinkAlt className="h-3 w-3" />
                Abrir
              </a>
            )}
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
          {timeRemaining && (
            <span className="text-xs font-mono text-yellow-400">{timeRemaining}</span>
          )}
          {task.endDate && !isCompleted && (
            <CountdownBadge endDate={task.endDate} className="text-slate-400" />
          )}
        </div>
      </div>
    </div>
  );
};
