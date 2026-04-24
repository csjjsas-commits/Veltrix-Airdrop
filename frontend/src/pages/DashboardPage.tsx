import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAnalytics } from '../hooks/useAnalytics';
import { getDashboard, getTasks, completeTask, startTask, submitTaskForReview, verifyTask } from '../services/api';
import { DashboardData, UserTask } from '../types';
import { HeroPanel } from '../components/dashboard/HeroPanel';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { MissionCard } from '../components/dashboard/MissionCard';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { motion } from 'framer-motion';

export const DashboardPage = () => {
  const { token } = useAuth();
  const { navigation } = useAnalytics();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [availableTasks, setAvailableTasks] = useState<UserTask[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalTask, setModalTask] = useState<UserTask | null>(null);
  const [modalMode, setModalMode] = useState<'manual' | 'wallet' | 'verify' | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [modalError, setModalError] = useState('');
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

  const showModal = (task: UserTask, mode: 'manual' | 'wallet' | 'verify') => {
    setModalTask(task);
    setModalMode(mode);
    setModalInput('');
    setModalError('');
  };

  const closeModal = () => {
    setModalTask(null);
    setModalMode(null);
    setModalInput('');
    setModalError('');
  };

  const completeMission = async (taskId: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      await completeTask(token, taskId);
      await fetchDashboardData();
    } catch (err) {
      setError('No se pudo completar la misión');
    } finally {
      setActionLoading(false);
    }
  };

  const submitMissionProof = async () => {
    if (!token || !modalTask) return;
    if (modalInput.trim().length < 20) {
      setModalError('La prueba debe tener al menos 20 caracteres.');
      return;
    }

    setActionLoading(true);
    try {
      await submitTaskForReview(token, modalTask.id, modalInput.trim());
      closeModal();
      await fetchDashboardData();
    } catch (err: any) {
      setModalError(err?.message || 'Error al enviar la prueba.');
    } finally {
      setActionLoading(false);
    }
  };

  const verifyMission = async (verificationData?: any) => {
    if (!token || !modalTask) return;
    setActionLoading(true);
    try {
      await verifyTask(token, modalTask.id, verificationData || {});
      closeModal();
      await fetchDashboardData();
    } catch (err: any) {
      setModalError(err?.message || 'Error al verificar la misión.');
    } finally {
      setActionLoading(false);
    }
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

    const category = getMissionCategory(task);

    switch (category) {
      case 'EXTERNAL_LINK':
      case 'REFERRAL':
        if (!token) return;
        setActionLoading(true);
        try {
          await startTask(token, task.id);
          if (task.actionUrl) {
            window.open(task.actionUrl, '_blank');
          }
          showModal(task, 'verify');
          setInProgressTasks(prev => ({ ...prev, [task.id]: true }));
        } catch (err) {
          setError('No se pudo iniciar la misión');
        } finally {
          setActionLoading(false);
        }
        break;
      case 'INTERNAL_ACTION':
        if (!token) return;
        setActionLoading(true);
        try {
          await startTask(token, task.id);
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
      case 'MANUAL_SUBMIT':
        showModal(task, 'manual');
        break;
      case 'AUTO_COMPLETE':
        await completeMission(task.id);
        break;
      case 'WALLET_ACTION':
        showModal(task, 'wallet');
        break;
      default:
        await completeMission(task.id);
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

          {modalTask && modalMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
              <div className="w-full max-w-2xl rounded-[2rem] border border-brand-electricBlue/20 bg-brand-deepBlue/95 p-8 shadow-2xl shadow-brand-blackVoid/70">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-semibold text-brand-pureWhite">{modalMode === 'manual' ? 'Submit Proof' : modalMode === 'wallet' ? 'Connect Wallet' : 'Verify Mission'}</h2>
                    <p className="mt-2 text-sm text-brand-softGray">{modalMode === 'manual'
                      ? 'Provide a short proof for your submission.'
                      : modalMode === 'wallet'
                      ? 'Connect your wallet and complete the task.'
                      : 'Open the external link and verify your action to complete the mission.'}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="rounded-full border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-2 text-sm text-brand-softGray transition hover:border-brand-electricBlue"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/75 p-5 text-brand-softGray">
                    <p className="text-sm uppercase tracking-[0.3em] text-brand-neonCyan">Mission</p>
                    <h3 className="mt-3 text-xl font-semibold text-brand-pureWhite">{modalTask.title}</h3>
                    <p className="mt-2 text-sm leading-6">{modalTask.description || 'Provide the required details to finish this mission.'}</p>
                  </div>

                  {modalMode === 'manual' && (
                    <div className="space-y-4">
                      <textarea
                        value={modalInput}
                        onChange={(e) => setModalInput(e.target.value)}
                        placeholder="Describe what you completed..."
                        className="w-full min-h-[160px] rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-4 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                      />
                      {modalError && <p className="text-sm text-red-400">{modalError}</p>}
                      <button
                        onClick={submitMissionProof}
                        disabled={actionLoading}
                        className="rounded-3xl bg-brand-neonCyan px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue disabled:opacity-50"
                      >
                        {actionLoading ? 'Enviando...' : 'Enviar prueba y completar'}
                      </button>
                    </div>
                  )}

                  {modalMode === 'wallet' && (
                    <div className="space-y-4">
                      <input
                        value={modalInput}
                        onChange={(e) => setModalInput(e.target.value)}
                        placeholder="Wallet address or connection note"
                        className="w-full rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                      />
                      {modalError && <p className="text-sm text-red-400">{modalError}</p>}
                      <button
                        onClick={() => verifyMission({ action: 'connect', walletAddress: modalInput.trim() })}
                        disabled={actionLoading}
                        className="rounded-3xl bg-brand-neonCyan px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue disabled:opacity-50"
                      >
                        {actionLoading ? 'Conectando...' : 'Completar conexión'}
                      </button>
                    </div>
                  )}

                  {modalMode === 'verify' && (
                    <div className="space-y-4">
                      {modalTask.verificationData?.url && (
                        <a
                          href={modalTask.verificationData.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-3xl bg-brand-electricBlue/10 px-4 py-3 text-sm font-semibold text-brand-electricBlue transition hover:bg-brand-electricBlue/20"
                        >
                          Abrir enlace externo
                        </a>
                      )}
                      <p className="text-sm text-brand-softGray">Once you finish the external action, press Verify to confirm and complete the task.</p>
                      {modalError && <p className="text-sm text-red-400">{modalError}</p>}
                      <button
                        onClick={() => verifyMission({ verificationType: modalTask.verificationType, verificationData: modalTask.verificationData })}
                        disabled={actionLoading}
                        className="rounded-3xl bg-brand-neonCyan px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue disabled:opacity-50"
                      >
                        {actionLoading ? 'Verificando...' : 'Verificar y completar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
