import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { completeTask, startTask } from '../../services/api';
import { UserTask } from '../../types';
import { useAnalytics } from '../../hooks/useAnalytics';
import { VerificationButton } from '../verification/VerificationButton';

interface Props {
  task: UserTask;
  onTaskUpdate?: (updatedTask: UserTask) => void;
}

export const TaskCard = ({ task, onTaskUpdate }: Props) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [countdown, setCountdown] = useState<string>('');
  const { task: taskAnalytics } = useAnalytics();

  const { token } = useAuth();

  useEffect(() => {
    if (task.timeLimit && task.status === 'IN_PROGRESS') {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const startTime = task.createdAt ? new Date(task.createdAt).getTime() : now;
        const elapsed = now - startTime;
        const limitMs = task.timeLimit! * 60 * 1000;
        const remaining = limitMs - elapsed;

        if (remaining <= 0) {
          setCountdown('00:00:00');
          clearInterval(interval);
        } else {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCountdown('');
    }
  }, [task.timeLimit, task.status, task.createdAt]);

  const handleComplete = async () => {
    if (!token) return;
    setIsCompleting(true);
    try {
      const completedTask = await completeTask(token, task.id);
      if (onTaskUpdate) {
        taskAnalytics.completed(task.id, task.title || 'Unknown Task', task.points);
        onTaskUpdate(completedTask);
        window.dispatchEvent(new Event('tasksUpdated'));
      }
    } catch (error) {
      taskAnalytics.failed(task.id, task.title || 'Unknown Task', 'Network error');
      console.error('Error completing task:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleStart = async (url?: string) => {
    if (!token) return;
    setIsStarting(true);
    try {
      const updatedTask = await startTask(token, task.id);
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
        window.dispatchEvent(new Event('tasksUpdated'));
      }
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error starting task:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleVerificationComplete = (result: any) => {
    if (result.verified && result.taskCompleted && onTaskUpdate) {
      taskAnalytics.completed(task.id, task.title || 'Unknown Task', task.points);
      onTaskUpdate({
        ...task,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        pointsAwarded: task.points
      });
      window.dispatchEvent(new Event('tasksUpdated'));
    } else if (!result.verified) {
      taskAnalytics.failed(task.id, task.title || 'Unknown Task', result.message || 'Verification failed');
    }
  };

  const renderActionButton = () => {
    if (task.status === 'COMPLETED') {
      return (
        <button
          disabled
          className="rounded-full bg-brand-graphite/70 px-4 py-2 text-brand-softGray cursor-not-allowed"
        >
          ✓ Completada
        </button>
      );
    }

    if (task.status === 'PENDING') {
      return (
        <button
          disabled
          className="rounded-full bg-brand-graphite/70 px-4 py-2 text-brand-softGray cursor-not-allowed"
        >
          En revisión
        </button>
      );
    }

    if (task.taskType === 'EXTERNAL_LINK' || task.taskType === 'REFERRAL') {
      return (
        <button
          onClick={() => task.actionUrl && handleStart(task.actionUrl)}
          disabled={!task.actionUrl || isStarting}
          className="rounded-full bg-brand-neonCyan/10 px-4 py-2 text-brand-neonCyan hover:bg-brand-neonCyan/20 disabled:opacity-50"
        >
          {isStarting ? 'Iniciando...' : task.status === 'IN_PROGRESS' ? 'Continuar' : task.actionUrl ? 'Abrir enlace' : 'Acción externa'}
        </button>
      );
    }

    if (task.taskType === 'WALLET_ACTION') {
      return (
        <button
          onClick={() => task.actionUrl && handleStart(task.actionUrl)}
          disabled={!task.actionUrl || isStarting}
          className="rounded-full bg-brand-amber-500/10 px-4 py-2 text-brand-amber-400 hover:bg-brand-amber-500/20 disabled:opacity-50"
        >
          {isStarting ? 'Iniciando...' : task.status === 'IN_PROGRESS' ? 'Conectar Wallet' : task.actionUrl ? 'Conectar Wallet' : 'Acción Wallet'}
        </button>
      );
    }

    if (task.taskType === 'MANUAL_SUBMIT') {
      return (
        <button
          disabled
          className="rounded-full bg-brand-graphite/70 px-4 py-2 text-brand-softGray cursor-not-allowed"
        >
          Envío manual
        </button>
      );
    }

    if (task.verificationType && task.verificationType !== 'MANUAL') {
      return (
        <VerificationButton
          taskId={task.id}
          verificationType={task.verificationType}
          verificationData={task.verificationData}
          onVerificationComplete={handleVerificationComplete}
        />
      );
    }

    return (
      <button
        onClick={handleComplete}
        disabled={isCompleting}
        className="rounded-full bg-brand-neonCyan/10 px-4 py-2 text-brand-neonCyan hover:bg-brand-neonCyan/20 disabled:opacity-50"
      >
        {isCompleting ? 'Completando...' : 'Completar'}
      </button>
    );
  };

  return (
    <article className="rounded-[2rem] border border-brand-graphite/80 bg-brand-graphite/85 p-6 shadow-brand-soft transition duration-300 ease-out hover:-translate-y-1 hover:border-brand-electricBlue/30 hover:bg-brand-graphite/95">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex-1">
          <h3 className="text-2xl font-semibold text-brand-pureWhite">{task.title}</h3>
          <p className="mt-3 text-brand-softGray leading-7">{task.description || 'Sin descripción adicional'}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-brand-softGray">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-graphite/80 bg-brand-graphite/70 px-3 py-1">
              Tipo: {task.taskType.replace('_', ' ')}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-graphite/80 bg-brand-graphite/70 px-3 py-1">
              Método: {task.verificationMethod.replace('_', ' ')}
            </span>
            {task.requiresProof && (
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-neonCyan/40 bg-brand-neonCyan/10 px-3 py-1 text-brand-neonCyan">
                Requiere prueba
              </span>
            )}
          </div>

          {task.actionUrl && (
            <div className="mt-3 text-sm text-brand-softGray">
              <a href={task.actionUrl} target="_blank" rel="noreferrer" className="underline hover:text-brand-neonCyan">
                Abrir acción externa
              </a>
            </div>
          )}
          {task.referralTarget && (
            <div className="mt-2 text-sm text-brand-softGray">Referido: {task.referralTarget}</div>
          )}
          {task.requiredReferralActions !== null && task.requiredReferralActions > 0 && (
            <div className="mt-2 text-sm text-brand-softGray">Acciones de referido requeridas: {task.requiredReferralActions}</div>
          )}
          {(task.startDate || task.endDate) && (
            <div className="mt-2 text-sm text-brand-softGray">
              {task.startDate ? `Desde: ${new Date(task.startDate).toLocaleDateString()}` : ''}
              {task.startDate && task.endDate ? ' — ' : ''}
              {task.endDate ? `Hasta: ${new Date(task.endDate).toLocaleDateString()}` : ''}
            </div>
          )}
          {task.timeLimit && (
            <div className="mt-2 text-sm text-brand-softGray">
              {countdown ? (
                <span className={`font-mono ${countdown === '00:00:00' ? 'text-red-400' : 'text-yellow-400'}`}>
                  Tiempo restante: {countdown}
                </span>
              ) : (
                `Límite: ${task.timeLimit} minutos`
              )}
            </div>
          )}
        </div>

        <div className="rounded-[1.75rem] bg-brand-blackVoid/75 px-5 py-4 text-right text-sm text-brand-softGray shadow-inner shadow-brand-blackVoid/10">
          <p className="text-brand-softGray">Puntos</p>
          <p className="mt-3 text-3xl font-semibold text-brand-pureWhite">{task.points}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className={`rounded-full px-3 py-2 font-semibold tracking-wide ${
            task.status === 'COMPLETED'
              ? 'bg-brand-neonCyan/10 text-brand-neonCyan'
              : task.status === 'FAILED'
              ? 'bg-brand-graphite/70 text-brand-softGray'
              : task.status === 'IN_PROGRESS'
              ? 'bg-brand-electricBlue/10 text-brand-electricBlue'
              : 'bg-brand-graphite/70 text-brand-softGray'
          }`}>
            {task.status === 'COMPLETED'
              ? 'COMPLETADA'
              : task.status === 'FAILED'
              ? 'FALLIDA'
              : task.status === 'IN_PROGRESS'
              ? 'EN PROGRESO'
              : task.status || 'DISPONIBLE'}
          </span>
          {task.deadline && (
            <span className="rounded-full bg-brand-graphite/70 px-3 py-2 text-brand-softGray">
              Deadline: {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
          {task.pointsAwarded !== null && (
            <span className="rounded-full bg-brand-neonCyan/10 px-3 py-2 text-brand-neonCyan">
              Premio: {task.pointsAwarded}
            </span>
          )}
        </div>

        <div>{renderActionButton()}</div>
      </div>
    </article>
  );
};
