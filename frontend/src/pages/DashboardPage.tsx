import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInstagram, FaTelegramPlane, FaTwitter, FaYoutube, FaTrophy, FaTasks, FaStar } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useAnalytics } from '../hooks/useAnalytics';
import { useMissionAction } from '../hooks/useMissionAction';
import { getDashboard, getTasks, getLeaderboard } from '../services/api';
import { DashboardData, UserTask, LeaderboardEntry } from '../types';
import { HeroPanel } from '../components/dashboard/HeroPanel';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { WalletPanel } from '../components/dashboard/WalletPanel';
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
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

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const [dashboardData, tasksData, leaderboardData] = await Promise.all([
        getDashboard(token),
        getTasks(token),
        getLeaderboard(token)
      ]);

      setDashboard(dashboardData);
      setAvailableTasks(tasksData);
      setLeaderboard(leaderboardData);
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
      <main className="pt-8">
        <div className="mx-auto max-w-7xl px-6">
          <HeroPanel dashboard={dashboard} loading={loading} />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-xl border border-red-500/20 bg-red-900/20 p-4"
            >
              <p className="text-red-400">{error}</p>
            </motion.div>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Stats */}
            <div className="space-y-6">
              <StatsGrid stats={dashboard?.stats ?? { totalPoints: 0, completedTasks: 0, pendingTasks: 0, estimatedTokens: '0' }} />

              {/* User Position */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                    <FaStar size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Tu Posición</p>
                    <p className="text-2xl font-bold text-white">
                    #{leaderboard.findIndex(entry => entry.id === user?.id) + 1 || 'N/A'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Recent Tasks & Leaderboard */}
            <div className="space-y-6">
              {/* Recent Tasks */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FaTasks className="text-violet-300" size={20} />
                  <h3 className="text-lg font-semibold text-white">Tareas Recientes</h3>
                </div>
                <div className="space-y-3">
                  {availableTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-violet-300">
                          {getPlatformIcon(task)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{task.title}</p>
                          <p className="text-xs text-slate-400">+{task.points} pts</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                        task.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {task.status === 'COMPLETED' ? 'Completada' :
                         task.status === 'IN_PROGRESS' ? 'En Progreso' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                  {availableTasks.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No hay tareas disponibles</p>
                  )}
                </div>
                <button
                  onClick={() => navigate('/tareas')}
                  className="mt-4 w-full rounded-lg bg-violet-500 py-2 text-sm font-medium text-white hover:bg-violet-400 transition"
                >
                  Ver Todas las Tareas
                </button>
              </motion.div>

              {/* Top 5 Leaderboard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FaTrophy className="text-yellow-500" size={20} />
                  <h3 className="text-lg font-semibold text-white">Top 5</h3>
                </div>
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">{entry.name}</p>
                          <p className="text-xs text-slate-400">@{entry.email}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-violet-400">
                        {entry.points.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No hay datos disponibles</p>
                  )}
                </div>
                <button
                  onClick={() => navigate('/ranking')}
                  className="mt-4 w-full rounded-lg bg-slate-700 py-2 text-sm font-medium text-white hover:bg-slate-600 transition"
                >
                  Ver Ranking Completo
                </button>
              </motion.div>
            </div>
          </div>

          <WalletPanel />
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
