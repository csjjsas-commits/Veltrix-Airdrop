import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAnalytics } from '../hooks/useAnalytics';
import { useMissionAction } from '../hooks/useMissionAction';
import { getTasks } from '../services/api';
import { UserTask } from '../types';
import { TaskList } from '../components/tasks/TaskList';
import { MissionVerificationModal } from '../components/MissionVerificationModal';
import { SkeletonCard } from '../components/ui/SkeletonCard';

export const TasksPage = () => {
  const { token } = useAuth();
  const { navigation } = useAnalytics();
  const { state: missionState, resetState: resetMissionState } = useMissionAction();
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalTask, setModalTask] = useState<UserTask | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await getTasks(token);
      setTasks(result);
      setError('');
    } catch (err) {
      setError('No se pudo cargar las tareas');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    navigation.tasksPageOpened();
    fetchTasks();

    const listener = () => {
      fetchTasks();
    };

    window.addEventListener('tasksUpdated', listener);
    return () => window.removeEventListener('tasksUpdated', listener);
  }, [token, navigation, fetchTasks]);

  const handleTaskUpdate = (taskId: string, updatedTask: UserTask) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? updatedTask : task)));
  };

  const handleTaskAction = (task: UserTask) => {
    // For tasks that need verification, show modal
    if (task.taskType === 'EXTERNAL_LINK' || task.taskType === 'AUTO_COMPLETE' ||
        task.taskType === 'MANUAL_SUBMIT' || task.taskType === 'WALLET_ACTION') {
      setModalTask(task);
      resetMissionState();
      return;
    }

    // For other tasks, handle through TaskCard component
    // The TaskCard will handle the logic for these task types
  };

  const handleTaskComplete = (updatedTask: UserTask) => {
    setTasks((prevTasks) => prevTasks.map((task) =>
      task.id === updatedTask.id ? updatedTask : task
    ));
    setModalTask(null);
  };

  const closeModal = () => {
    setModalTask(null);
  };

  return (
    <main className="min-h-screen bg-brand-blackVoid text-brand-pureWhite">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-brand-neonCyan">Tareas</p>
            <h1 className="mt-3 text-4xl font-semibold text-brand-pureWhite">Lista de misiones</h1>
            <p className="mt-2 text-brand-softGray">Revisa tareas activas, estados y recompensas para avanzar cada semana.</p>
          </div>
          <div className="rounded-3xl border border-brand-graphite/70 bg-brand-graphite/80 px-5 py-4 text-brand-softGray">
            <p className="text-sm uppercase tracking-[0.2em] text-brand-softGray">Total</p>
            <p className="mt-2 text-2xl font-semibold text-brand-pureWhite">{tasks.length}</p>
          </div>
        </div>

        {error && <p className="mb-6 rounded-3xl border border-brand-electricBlue/20 bg-brand-deepBlue/85 px-4 py-3 text-sm text-brand-neonCyan">{error}</p>}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <TaskList tasks={tasks} onTaskUpdate={handleTaskUpdate} onTaskAction={handleTaskAction} />
        )}

        {modalTask && (
          <MissionVerificationModal
            task={modalTask}
            isOpen={true}
            onClose={closeModal}
            onTaskComplete={handleTaskComplete}
            state={missionState}
          />
        )}
      </section>
    </main>
  );
};
