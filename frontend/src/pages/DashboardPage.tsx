import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInstagram, FaTelegramPlane, FaTwitter, FaYoutube } from 'react-icons/fa';
import { FiArrowUpRight } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useAnalytics } from '../hooks/useAnalytics';
import { useMissionAction } from '../hooks/useMissionAction';
import { getDashboard, getTasks, completeTask } from '../services/api';
import { DashboardData, UserTask } from '../types';
import { HeroPanel } from '../components/dashboard/HeroPanel';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { WalletPanel } from '../components/dashboard/WalletPanel';
import { MissionVerificationModal } from '../components/MissionVerificationModal';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { motion } from 'framer-motion';

export const DashboardPage = () => {
  const { token } = useAuth();
  const { navigation } = useAnalytics();
  const navigate = useNavigate();
  const { state: missionState, resetState: resetMissionState, startMission, completeMission } = useMissionAction();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [availableTasks, setAvailableTasks] = useState<UserTask[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalTask, setModalTask] = useState<UserTask | null>(null);
  const [inProgressTasks, setInProgressTasks] = useState<Record<string, boolean>>({});
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

  const getPlatformLabel = (task: UserTask) => {
    const key = getPlatformKey(task);
    switch (key) {
      case 'instagram':
        return 'INSTAGRAM';
      case 'telegram':
        return 'TELEGRAM';
      case 'youtube':
        return 'YOUTUBE';
      default:
        return 'X';
    }
  };

  const getActionLabel = (task: UserTask) => {
    const key = getPlatformKey(task);
    switch (key) {
      case 'instagram':
      case 'x':
        return 'SEGUIR';
      case 'telegram':
        return 'UNIRSE';
      case 'youtube':
        return 'VER';
      default:
        return 'COMPLETAR';
    }
  };

  const filteredTasks = availableTasks.filter((task) => {
    if (activePlatform === 'all') return true;
    return getPlatformKey(task) === activePlatform;
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

  const showModal = (task: UserTask) => {
    setModalTask(task);
  };

  const closeModal = () => {
    setModalTask(null);
  };

  const handleTaskComplete = (updatedTask: UserTask) => {
    setAvailableTasks(prev => prev.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    ));
    // Update modal task if it's the same task
    if (modalTask && modalTask.id === updatedTask.id) {
      setModalTask(updatedTask);
    }
    fetchDashboardData();
  };

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
        showModal(startedTask);
      }
      return;
    }

    // For referral tasks, start the task and show the referral modal
    if (task.taskType === 'REFERRAL') {
      const startedTask = await startMission(task);
      if (startedTask) {
        showModal(startedTask);
      }
      return;
    }

    // For manual submit and wallet tasks, just show the modal
    if (task.taskType === 'MANUAL_SUBMIT' || task.taskType === 'WALLET_ACTION') {
      showModal(task);
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
          setInProgressTasks(prev => ({ ...prev, [task.id]: true }));
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
    <div className="min-h-screen bg-brand-blackVoid text-brand-pureWhite">
      <main className="pt-8">
        <div className="mx-auto max-w-7xl px-6 space-y-8">
          <HeroPanel dashboard={dashboard} loading={loading} />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-brand-electricBlue/20 bg-brand-deepBlue/80 p-4"
            >
              <p className="text-brand-neonCyan">{error}</p>
            </motion.div>
          )}

          <StatsGrid stats={dashboard?.stats ?? { totalPoints: 0, completedTasks: 0, pendingTasks: 0, estimatedTokens: '0' }} />

          <WalletPanel />

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-brand-graphite/70 bg-brand-deepBlue/80 backdrop-blur-sm p-8"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-brand-pureWhite">Weekly Missions</h2>
                <p className="mt-2 text-brand-softGray">Complete active objectives to grow your rank and earn VELX.</p>
              </div>
              <div className="inline-flex items-center gap-3 rounded-full border border-brand-electricBlue/20 bg-brand-graphite/70 px-4 py-2 text-sm text-brand-softGray">
                Week {Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % 52 + 1}
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {platformTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActivePlatform(tab.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activePlatform === tab.key
                        ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredTasks.length === 0 ? (
                <div className="rounded-2xl border border-brand-electricBlue/20 bg-brand-blackVoid/80 p-10 text-center text-brand-softGray">
                  <p className="text-xl font-semibold text-brand-pureWhite">No active missions available</p>
                  <p className="mt-3">The ecosystem is currently updating, check back soon for new objectives.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.slice(0, 6).map((task) => {
                    const platformLabel = getPlatformLabel(task);
                    const actionLabel = getActionLabel(task);
                    const isCompleted = task.status === 'COMPLETED';
                    const isInProgress = task.status === 'IN_PROGRESS' || inProgressTasks[task.id];

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/20 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-violet-300 shadow-inner shadow-black/20">
                            {getPlatformIcon(task)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                              {platformLabel} / {actionLabel}
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-white line-clamp-1">
                              {task.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-400 line-clamp-2">
                              {task.description || 'Completa esta misión para ganar puntos.'}
                            </p>
                            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-amber-300">
                              <span className="text-base">★</span>
                              +{task.points} pts
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col items-start gap-3 sm:mt-0 sm:items-end">
                          {task.actionUrl ? (
                            <a
                              href={task.actionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
                            >
                              Abrir
                              <FiArrowUpRight size={14} />
                            </a>
                          ) : (
                            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Link no disponible</div>
                          )}

                          <button
                            onClick={() => handleMissionStart(task)}
                            disabled={isCompleted}
                            className={`inline-flex min-w-[152px] items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                              isCompleted
                                ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                                : 'bg-violet-500 text-white hover:bg-violet-400'
                            }`}
                          >
                            {isCompleted ? 'Completada' : isInProgress ? 'En Revisión' : 'Completar'}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.section>

          {modalTask && (
            <MissionVerificationModal
              task={modalTask}
              isOpen={true}
              onClose={closeModal}
              onTaskComplete={handleTaskComplete}
              state={missionState}
            />
          )}
        </div>
      </main>
    </div>
  );
};
