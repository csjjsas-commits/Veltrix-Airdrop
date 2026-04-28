import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTasks } from '../services/api';
import { UserTask } from '../types';
import { TaskListItem } from '../components/tasks/TaskListItem';
import { TareasReferralPanel } from '../components/tasks/TareasReferralPanel';
import { motion } from 'framer-motion';

export const TareasPage = () => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePlatform, setActivePlatform] = useState<'all' | 'instagram' | 'x' | 'telegram' | 'youtube'>('all');

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
    if (platform === 'youtube') return 'youtube';
    if (platform === 'telegram') return 'telegram';
    if (platform === 'instagram') return 'instagram';
    return 'x';
  };

  // Separate referral and regular tasks
  const referralTask = tasks.find(t => t.taskType === 'REFERRAL');
  const regularTasks = tasks.filter(t => t.taskType !== 'REFERRAL');

  const filteredTasks = activePlatform === 'all'
    ? regularTasks
    : regularTasks.filter(task => getPlatformKey(task) === activePlatform);

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
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, idx) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskAction={handleReferralAction}
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
      </div>
    </div>
  );
};