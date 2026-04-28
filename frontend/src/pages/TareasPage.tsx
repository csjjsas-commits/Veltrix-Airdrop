import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTasks } from '../services/api';
import { UserTask } from '../types';
import { TaskCard } from '../components/tasks/TaskCard';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { motion } from 'framer-motion';

export const TareasPage = () => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePlatform, setActivePlatform] = useState<'all' | 'instagram' | 'x' | 'telegram' | 'youtube' | 'referral'>('all');

  const platformTabs = [
    { key: 'all', label: 'Todas' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'x', label: 'X' },
    { key: 'telegram', label: 'Telegram' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'referral', label: 'Referidos' }
  ] as const;

  const getPlatformKey = (task: UserTask) => {
    const platform = task.platform?.toString().toLowerCase();
    if (platform === 'twitter') return 'x';
    if (platform === 'youtube') return 'youtube';
    if (platform === 'telegram') return 'telegram';
    if (platform === 'instagram') return 'instagram';
    if (task.taskType === 'REFERRAL') return 'referral';
    return 'x';
  };

  const filteredTasks = activePlatform === 'all'
    ? tasks
    : tasks.filter(task => getPlatformKey(task) === activePlatform);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Tareas Disponibles</h1>
            <p className="mt-2 text-slate-400">Completa tareas para ganar puntos</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Tareas Disponibles</h1>
          <p className="mt-2 text-slate-400">Completa tareas para ganar puntos</p>
        </div>

        {/* Platform Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
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

        {/* Tasks Grid */}
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onTaskUpdate={handleTaskUpdate}
            />
          ))}
        </motion.div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No hay tareas disponibles en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
};