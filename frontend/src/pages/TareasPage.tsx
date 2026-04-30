import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTasks } from '../services/api';
import { UserTask } from '../types';
import { TaskListItem } from '../components/tasks/TaskListItem';
import { TareasReferralPanel } from '../components/tasks/TareasReferralPanel';
import { MissionVerificationModal } from '../components/MissionVerificationModal';
import { useMissionAction } from '../hooks/useMissionAction';
import { motion } from 'framer-motion';

export const TareasPage = () => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePlatform, setActivePlatform] = useState<'all' | 'instagram' | 'x' | 'telegram' | 'youtube'>('all');
  const [modalTask, setModalTask] = useState<UserTask | null>(null);
  const { state: missionState } = useMissionAction();

  const platformTabs = [
    { key: 'all', label: 'Todas' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'x', label: 'X' },
    { key: 'telegram', label: 'Telegram' },
    { key: 'youtube', label: 'YouTube' }
  ] as const;

  const getPlatformKey = (task: UserTask) => {
    const platform = task.platform?.toString().toLowerCase();
    if (platform === 'twitter') return 'x';
    if (platform === 'telegram') return 'telegram';
    if (platform === 'instagram') return 'instagram';
    if (platform === 'youtube') return 'youtube';
    if (platform === 'web') return 'web';
    return 'x';
  };

  const getTaskPriority = (task: UserTask) => {
    if (task.status === 'COMPLETED') return 3;
    if (task.isRequired) return 0;
    if (task.endDate) return 1;
    return 2;
  };

  const sortTasks = (tasksToSort: UserTask[]) =>
    tasksToSort.slice().sort((a, b) => {
      const aPriority = getTaskPriority(a);
      const bPriority = getTaskPriority(b);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      if (aPriority === 1 && a.endDate && b.endDate) {
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      }

      if (a.status !== b.status) {
        return a.status === 'COMPLETED' ? 1 : -1;
      }

      return b.points - a.points;
    });

  // Separate referral and regular tasks
  const referralTask = tasks.find(t => t.taskType === 'REFERRAL');
  const regularTasks = tasks.filter(t => t.taskType !== 'REFERRAL');

  // Find incomplete required tasks and keep required tasks first
  const incompleteRequiredTasks = regularTasks.filter(t => t.isRequired && t.status !== 'COMPLETED');
  const activeRequiredTask = incompleteRequiredTasks[0] || null;

  const filteredTasks = activePlatform === 'all'
    ? sortTasks(regularTasks)
    : sortTasks(regularTasks.filter(task => getPlatformKey(task) === activePlatform));

  useEffect(() => {
    const fetchTasks = async () => {
      if (!token) return;

      try {
        const fetchedTasks = await getTasks(token);
        setTasks(fetchedTasks);
      } catch (err: any) {
        setError(err?.message || 'Error al cargar tareas');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [token]);

  const handleTaskUpdate = (updatedTask: UserTask) => {
    setTasks(prev => prev.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const handleReferralAction = (task: UserTask) => {
    // Open referral modal or action
    console.log('Referral action for:', task);
  };

  const handleOpenModal = (task: UserTask) => {
    setModalTask(task);
  };

  const handleTaskComplete = (updatedTask: UserTask) => {
    handleTaskUpdate(updatedTask);
    setModalTask(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-1/4 mb-8"></div>
            <div className="grid gap-3 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="text-center">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Tareas Disponibles</h1>
          <p className="mt-2 text-slate-400">Completa tareas para ganar puntos y tokens</p>
        </div>

        {/* Layout: Main content + Sidebar */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Content - Left (2/3) */}
          <div className="md:col-span-2 space-y-6">
            {/* Platform Tabs */}
            <div className="flex flex-wrap gap-2">
              {platformTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActivePlatform(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activePlatform === tab.key
                      ? 'bg-violet-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tasks List */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {activeRequiredTask && (
                <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-4 text-amber-200 text-sm">
                  <p className="font-semibold">⚠️ Tarea obligatoria pendiente</p>
                  <p className="mt-1 text-xs">Completa la tarea "<strong>{activeRequiredTask.title}</strong>" para desbloquear las demás tareas.</p>
                </div>
              )}
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, idx) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskAction={handleReferralAction}
                    onOpenModal={handleOpenModal}
                    isBlocked={!!activeRequiredTask && !task.isRequired}
                  />
                ))
              ) : (
                <div className="text-center py-12 rounded-2xl border border-slate-800 bg-slate-900/50">
                  <p className="text-slate-400">No hay tareas disponibles en esta categoría</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar - Right (1/3) */}
          <div>
            <TareasReferralPanel referralTask={referralTask} />
          </div>
        </div>

      <MissionVerificationModal
        task={modalTask}
        isOpen={!!modalTask}
        onClose={() => setModalTask(null)}
        onTaskComplete={handleTaskComplete}
        state={missionState}
      />
      </div>
    </div>
  );
};