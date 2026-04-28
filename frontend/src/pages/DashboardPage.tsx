import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInstagram, FaTelegramPlane, FaTwitter, FaYoutube, FaTasks, FaStar, FaCheckCircle, FaClock, FaBolt, FaExternalLinkAlt } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useAnalytics } from '../hooks/useAnalytics';
import { useMissionAction } from '../hooks/useMissionAction';
import { getDashboard, getTasks } from '../services/api';
import { DashboardData, UserTask } from '../types';
import { CountdownBadge } from '../components/tasks/CountdownBadge';
import { MissionVerificationModal } from '../components/MissionVerificationModal';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { motion } from 'framer-motion';

export const DashboardPage = () => {
  const { token, user } = useAuth();
  const { navigation } = useAnalytics();
  const navigate = useNavigate();
  const { state: missionState, resetState: resetMissionState, startMission, completeMission } = useMissionAction();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [availableTasks, setAvailableTasks] = useState<UserTask[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalTask, setModalTask] = useState<UserTask | null>(null);

  const getPlatformKey = (task: UserTask) => {
    const platform = task.platform?.toString().toLowerCase();
    if (platform === 'twitter') return 'x';
    if (platform === 'youtube') return 'youtube';
    if (platform === 'telegram') return 'telegram';
    if (platform === 'instagram') return 'instagram';
    return 'x';
  };

  const getPlatformIcon = (task: UserTask) => {
    const key = getPlatformKey(task);
    switch (key) {
      case 'instagram':
        return <FaInstagram size={22} className="text-violet-300" />;
      case 'telegram':
        return <FaTelegramPlane size={22} className="text-violet-300" />;
      case 'youtube':
        return <FaYoutube size={22} className="text-violet-300" />;
      default:
        return <FaTwitter size={22} className="text-violet-300" />;
    }
  };

  const getTaskPriority = (task: UserTask) => {
    if (task.status === 'COMPLETED') return 3;
    if (task.isRequired) return 0;
    if (task.endDate) return 1;
    return 2;
  };

  const sortDashboardTasks = (tasksToSort: UserTask[]) =>
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

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const [dashboardData, tasksData] = await Promise.all([
        getDashboard(token),
        getTasks(token)
      ]);

      setDashboard(dashboardData);
      setAvailableTasks(tasksData);
      setError('');
    } catch (err) {
      setError('No se pudo cargar el panel');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    navigation.dashboardOpened();
    fetchDashboardData();

    const listener = () => {
      fetchDashboardData();
    };

    window.addEventListener('tasksUpdated', listener);
    return () => window.removeEventListener('tasksUpdated', listener);
  }, [token, navigation, fetchDashboardData]);

  const handleRefresh = async () => {
    setActionLoading(true);
    try {
      await fetchDashboardData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleTaskComplete = (updatedTask: UserTask) => {
    setAvailableTasks(prev => prev.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    ));
    setModalTask(null);
  };

  const progressValue = dashboard?.stats.progressToNextLevel ?? 0;
  const userLevel = dashboard?.stats.level ?? 1;
  const userPoints = dashboard?.stats.totalPoints ?? 0;
  const completedTasks = dashboard?.stats.completedTasks ?? 0;
  const pendingTasks = dashboard?.stats.pendingTasks ?? 0;
  const totalNetworkPoints = dashboard?.stats.totalUsers ?? 0;
  const participation = dashboard?.stats.percentile ?? 0;
  const estimatedTokens = dashboard?.stats.estimatedTokens ?? '0';

  const getMissionCategory = (task: UserTask) => {
    switch (task.taskType) {
      case 'INTERNAL_ACTION':
        return 'INTERNAL_ACTION';
      case 'EXTERNAL_LINK':
        return 'EXTERNAL_LINK';
      case 'MANUAL_SUBMIT':
        return 'MANUAL_SUBMIT';
      case 'REFERRAL':
        return 'REFERRAL';
      case 'WALLET_ACTION':
        return 'WALLET_ACTION';
      case 'AUTO_COMPLETE':
      default:
        return 'AUTO_COMPLETE';
    }
  };

  const handleMissionStart = async (task: UserTask) => {
    if (task.status === 'COMPLETED') return;
    resetMissionState();

    // For external link and auto-complete tasks, start the task and show modal
    if (task.taskType === 'EXTERNAL_LINK' || task.taskType === 'AUTO_COMPLETE') {
      const startedTask = await startMission(task);
      if (startedTask) {
        setModalTask(startedTask);
      }
      return;
    }

    // For referral tasks, start the task and show the referral modal
    if (task.taskType === 'REFERRAL') {
      const startedTask = await startMission(task);
      if (startedTask) {
        setModalTask(startedTask);
      }
      return;
    }

    // For manual submit and wallet tasks, just show the modal
    if (task.taskType === 'MANUAL_SUBMIT' || task.taskType === 'WALLET_ACTION') {
      setModalTask(task);
      return;
    }

    // For other tasks, handle directly
    const category = getMissionCategory(task);

    switch (category) {
      case 'INTERNAL_ACTION':
        if (!token) return;
        setActionLoading(true);
        try {
          // For internal actions, navigate directly
          if (task.actionUrl) {
            navigate(task.actionUrl);
          } else if (task.verificationData?.path) {
            navigate(task.verificationData.path);
          } else {
            navigate('/profile');
          }
        } catch (err) {
          setError('No se pudo iniciar la misión');
        } finally {
          setActionLoading(false);
        }
        break;
      default:
        // For auto-complete tasks without actionUrl, complete immediately
        await completeMission(task);
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-blackVoid text-brand-pureWhite">
        <main className="pt-8">
          <div className="mx-auto max-w-7xl px-6">
            <div className="space-y-8">
              <SkeletonCard />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
              <SkeletonCard />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main>
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
              Welcome back, Veltrix CEO
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Dashboard</h1>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 md:p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-400">Progress to next level</p>
                <p className="text-sm text-slate-400">{progressValue}%</p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-2xl border border-red-500/20 bg-red-900/20 p-4"
            >
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[2rem] border border-slate-800 bg-slate-950/95 p-5 shadow-2xl shadow-black/20">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Mis puntos</p>
                  <p className="mt-3 text-4xl font-semibold text-white">{userPoints.toLocaleString()}</p>
                  <p className="mt-2 text-sm text-slate-400">Total de puntos acumulados.</p>
                </div>
                <div className="rounded-[2rem] border border-slate-800 bg-slate-950/95 p-5 shadow-2xl shadow-black/20">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Tareas completadas</p>
                  <p className="mt-3 text-4xl font-semibold text-white">{completedTasks}</p>
                  <p className="mt-2 text-sm text-slate-400">Mis misiones completadas hasta ahora.</p>
                </div>
                <div className="rounded-[2rem] border border-slate-800 bg-slate-950/95 p-5 shadow-2xl shadow-black/20">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Progreso</p>
                  <p className="mt-3 text-4xl font-semibold text-white">{progressValue}%</p>
                  <p className="mt-2 text-sm text-slate-400">Avance hacia el siguiente nivel.</p>
                </div>
                <div className="rounded-[2rem] border border-slate-800 bg-slate-950/95 p-5 shadow-2xl shadow-black/20">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Usuarios totales</p>
                  <p className="mt-3 text-4xl font-semibold text-white">{dashboard?.stats.totalUsers ?? 0}</p>
                  <p className="mt-2 text-sm text-slate-400">Usuarios activos en el ranking.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Tareas Recientes</h2>
                    <p className="text-sm text-slate-400">Últimas tareas activas para completar.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/tareas')}
                    className="text-sm font-semibold text-violet-300 hover:text-violet-200"
                  >
                    {'Ver todas →'}
                  </button>
                </div>

                <div className="space-y-3">
                  {sortDashboardTasks(availableTasks).slice(0, 4).map(task => (
                    <div key={task.id} className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-5 flex items-start justify-between gap-4 hover:border-violet-500/30 transition">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 flex-shrink-0">
                          {getPlatformIcon(task)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{task.title}</p>
                          <p className="mt-1 text-xs text-slate-400 truncate">{task.description || 'Completa esta misión'}</p>
                          <span className="mt-2 inline-flex items-center rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                            +{task.points} pts
                          </span>
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
                            onClick={() => setModalTask(task)}
                            disabled={task.status === 'COMPLETED' || task.status === 'PENDING'}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition whitespace-nowrap ${
                              task.status === 'COMPLETED'
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50'
                            }`}
                          >
                            {task.status === 'COMPLETED' ? '✓ Completada' : 'Completar'}
                          </button>
                        </div>
                        {task.endDate && task.status !== 'COMPLETED' && (
                          <CountdownBadge endDate={task.endDate} className="text-slate-400" />
                        )}
                      </div>
                  </div>
                  ))}

                  {availableTasks.length === 0 && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-center text-slate-400">
                      No hay tareas disponibles
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-black/40">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-violet-400 font-semibold">Tokens estimados</p>
                    <h2 className="mt-4 text-4xl font-bold text-white">{estimatedTokens}</h2>
                    <p className="mt-2 text-sm text-violet-300 font-semibold">VELX</p>
                  </div>
                  <div className="rounded-2xl bg-violet-500/10 p-4 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-widest">Tu participación</p>
                    <p className="mt-3 text-2xl font-bold text-violet-300">{participation}%</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
                    <p className="text-xs uppercase tracking-widest text-slate-500">Tus puntos</p>
                    <p className="mt-3 text-2xl font-bold text-white">{userPoints.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
                    <p className="text-xs uppercase tracking-widest text-slate-500">Puntos totales red</p>
                    <p className="mt-3 text-2xl font-bold text-white">{totalNetworkPoints.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
                    <p className="text-xs uppercase tracking-widest text-slate-500">Usuarios registrados</p>
                    <p className="mt-3 text-2xl font-bold text-white">{dashboard?.stats.totalUsers ?? 0}</p>
                  </div>
                </div>

                <p className="mt-6 text-xs text-slate-500">Pool total: 50,000,000 VELX · Distribución proporcional a puntos acumulados</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MissionVerificationModal
        task={modalTask}
        isOpen={!!modalTask}
        onClose={() => setModalTask(null)}
        onTaskComplete={handleTaskComplete}
        state={missionState}
      />
    </div>
  );
};
