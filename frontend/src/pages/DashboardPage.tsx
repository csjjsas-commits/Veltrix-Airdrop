import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAnalytics } from '../hooks/useAnalytics';
import { useMissionAction } from '../hooks/useMissionAction';
import { getDashboard, getTasks, completeTask } from '../services/api';
import { DashboardData, UserTask } from '../types';
import { HeroPanel } from '../components/dashboard/HeroPanel';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { MissionCard } from '../components/dashboard/MissionCard';
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
    resetMissionState();
  };

  const closeModal = () => {
    setModalTask(null);
  };

  const handleTaskComplete = (updatedTask: UserTask) => {
    setAvailableTasks(prev => prev.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    ));
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

    // For external link and auto-complete tasks, show modal first (link will be opened from modal)
    if (task.taskType === 'EXTERNAL_LINK' || task.taskType === 'AUTO_COMPLETE') {
      showModal(task);
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
              {availableTasks.length === 0 ? (
                <div className="rounded-2xl border border-brand-electricBlue/20 bg-brand-blackVoid/80 p-10 text-center text-brand-softGray">
                  <p className="text-xl font-semibold text-brand-pureWhite">No active missions available</p>
                  <p className="mt-3">The ecosystem is currently updating, check back soon for new objectives.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {availableTasks.slice(0, 6).map((task) => (
                    <MissionCard
                      key={task.id}
                      id={task.id}
                      title={task.title}
                      description={task.description || 'Complete this objective to earn rewards'}
                      reward={`+${task.points} XP`}
                      difficulty="Medium"
                      status={
                        task.status === 'COMPLETED'
                          ? 'completed'
                          : task.status === 'IN_PROGRESS'
                          ? 'in-progress'
                          : inProgressTasks[task.id]
                          ? 'in-progress'
                          : 'available'
                      }
                      onStart={() => handleMissionStart(task)}
                    />
                  ))}
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
