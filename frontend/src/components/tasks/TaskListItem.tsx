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
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-graphite/50 bg-brand-graphite/20 px-4 py-3 hover:border-brand-graphite/80 transition">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-2xl flex-shrink-0">{getPlatformIcon(task.platform, task.taskType)}</div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-brand-pureWhite truncate">{task.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-brand-softGray">⭐ {task.points} pts</span>
            {task.endDate && !isCompleted && <CountdownBadge endDate={task.endDate} />}
          </div>
        </div>
      </div>

      <button
        onClick={handleAction}
        disabled={isDisabled}
        className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
          isCompleted
            ? 'bg-brand-graphite/40 text-brand-softGray cursor-not-allowed'
            : 'bg-brand-elitePurple/20 text-brand-elitePurple hover:bg-brand-elitePurple/40 disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {isProcessing ? 'Procesando...' : getButtonText()}
      </button>
    </div>
  );
};
