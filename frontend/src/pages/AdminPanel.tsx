import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  createAdminTask,
  getAdminConfig,
  getAdminStats,
  getAdminTasks,
  getAnalyticsMetrics,
  getLeaderboard,
  getSubmissions,
  reviewSubmission,
  updateAdminConfig,
  updateAdminTask,
  updateTaskStatus
} from '../services/api';
import { AdminConfig, AdminStats, LeaderboardEntry, SubmissionItem, TaskPayload, UserTask, AnalyticsMetrics, TaskType, VerificationMethod } from '../types';
import { SubmissionsTable } from '../components/admin/SubmissionsTable';
import { ConfigPanel } from '../components/admin/ConfigPanel';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';

// Helper: Format seconds to HH:MM:SS
const formatTimeLimit = (seconds: number | null | undefined): string => {
  if (!seconds || seconds < 0) return '';
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
};

// Helper: Normalize task form state - always provide safe defaults
const normalizeTaskForm = (task: UserTask | null) => {
  if (!task) {
    return {
      taskTitle: '',
      taskPoints: 120,
      taskDesc: '',
      actionUrl: '',
      weekNumber: '',
      startDate: '',
      endDate: '',
      timeLimitStr: '',
      referralTarget: '',
      requiredReferralActions: 0,
      taskActive: true,
      taskPlatform: 'x' as const,
      taskAction: 'seguir' as const,
      taskAccount: '',
      taskMandatory: false,
      editingTask: null
    };
  }

  return {
    taskTitle: task.title ?? '',
    taskPoints: task.points ?? 120,
    taskDesc: task.description ?? '',
    actionUrl: task.actionUrl ?? '',
    weekNumber: task.weekNumber ? String(task.weekNumber) : '',
    startDate: task.startDate ? task.startDate.split('T')[0] : '',
    endDate: task.endDate ? task.endDate.split('T')[0] : '',
    timeLimitStr: task.timeLimit ? formatTimeLimit(task.timeLimit) : '',
    referralTarget: task.referralTarget ?? '',
    requiredReferralActions: task.requiredReferralActions ?? 0,
    taskActive: Boolean(task.active),
    taskPlatform: (task.platform ?? (task.taskType === 'REFERRAL' ? 'referral' : 'x')) as 'instagram' | 'x' | 'telegram' | 'youtube' | 'referral',
    taskAction: 'seguir' as const,
    taskAccount: task.verificationData?.username ?? '',
    taskMandatory: Boolean(task.requiresProof),
    editingTask: task
  };
};

export const AdminPanel = () => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetrics | null>(null);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskPoints, setTaskPoints] = useState<number>(120);
  const [taskDesc, setTaskDesc] = useState<string>('');
  const [actionUrl, setActionUrl] = useState<string>('');
  const [weekNumber, setWeekNumber] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [timeLimitStr, setTimeLimitStr] = useState<string>('');
  const [referralTarget, setReferralTarget] = useState<string>('');
  const [requiredReferralActions, setRequiredReferralActions] = useState<number>(0);
  const [taskActive, setTaskActive] = useState<boolean>(true);
  const [taskPlatform, setTaskPlatform] = useState<'instagram' | 'x' | 'telegram' | 'youtube' | 'referral'>('x');
  const [taskAction, setTaskAction] = useState<'seguir' | 'me gusta' | 'compartir' | 'ver video' | 'comentar' | 'suscribirse' | 'unirse'>('seguir');
  const [taskAccount, setTaskAccount] = useState<string>('');
  const [taskMandatory, setTaskMandatory] = useState<boolean>(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<UserTask | null>(null);
  const [message, setMessage] = useState('');

  const fetchAdminData = async () => {
    if (!token) return;

    const [taskList, submissionList, configData, statsData, leaderboardData, analyticsData] = await Promise.all([
      getAdminTasks(token),
      getSubmissions(token),
      getAdminConfig(token),
      getAdminStats(token),
      getLeaderboard(token),
      getAnalyticsMetrics(token)
    ]);

    setTasks(taskList);
    setSubmissions(submissionList);
    setConfig(configData);
    setStats(statsData);
    setLeaderboard(leaderboardData);
    setAnalyticsMetrics(analyticsData);
  };

  useEffect(() => {
    fetchAdminData().catch(() => setMessage('No se pudo cargar datos admin'));
  }, [token]);

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    if (!token) return;
    try {
      await reviewSubmission(token, id, action);
      setMessage(`Submission ${action}ed`);
      await fetchAdminData();
      window.dispatchEvent(new Event('tasksUpdated'));
    } catch (err) {
      setMessage('Error al revisar la submission');
    }
  };

  const handleConfigSave = async (data: Partial<AdminConfig>) => {
    if (!token) return;
    try {
      const updated = await updateAdminConfig(token, data);
      setConfig(updated);
      setMessage('Configuración actualizada');
    } catch (err) {
      setMessage('No se pudo actualizar la configuración');
    }
  };

  const parseTimeLimit = (value: string): number | null => {
    if (!value) return null;
    const parts = value.split(':').map(Number);
    if (parts.length !== 3 || parts.some((p) => Number.isNaN(p) || p < 0)) return null;
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  };

  const formatTimeLimit = (seconds: number | null | undefined): string => {
    if (!seconds || seconds < 0) return '';
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const resetTaskForm = () => {
    const normalized = normalizeTaskForm(null);
    setTaskTitle(normalized.taskTitle);
    setTaskPoints(normalized.taskPoints);
    setTaskDesc(normalized.taskDesc);
    setActionUrl(normalized.actionUrl);
    setWeekNumber(normalized.weekNumber);
    setStartDate(normalized.startDate);
    setEndDate(normalized.endDate);
    setTimeLimitStr(normalized.timeLimitStr);
    setReferralTarget(normalized.referralTarget);
    setRequiredReferralActions(normalized.requiredReferralActions);
    setTaskActive(normalized.taskActive);
    setTaskPlatform(normalized.taskPlatform);
    setTaskAction(normalized.taskAction);
    setTaskAccount(normalized.taskAccount);
    setTaskMandatory(normalized.taskMandatory);
    setEditingTask(null);
    setMessage('');
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    resetTaskForm();
  };

  const getTaskPayload = (): TaskPayload => {
    // Convert weekNumber from string to number or null
    const parsedWeekNumber = weekNumber ? parseInt(weekNumber, 10) : null;
    
    // Validate parsed week number
    const validWeekNumber = parsedWeekNumber && !isNaN(parsedWeekNumber) ? parsedWeekNumber : null;
    const isReferral = taskPlatform === 'referral';

    const payload = {
      title: taskTitle,
      description: taskDesc || undefined,
      points: taskPoints,
      deadline: null,
      taskType: isReferral ? ('REFERRAL' as TaskType) : ('AUTO_COMPLETE' as TaskType),
      actionUrl: actionUrl || null,
      verificationMethod: isReferral ? ('REFERRAL_VALIDATION' as VerificationMethod) : ('SYSTEM_AUTOMATIC' as VerificationMethod),
      requiresProof: taskMandatory,
      weekNumber: validWeekNumber,
      startDate: startDate || null,
      endDate: endDate || null,
      timeLimit: parseTimeLimit(timeLimitStr),
      referralTarget: isReferral ? referralTarget || null : null,
      requiredReferralActions: isReferral && requiredReferralActions > 0 ? requiredReferralActions : null,
      active: taskActive
    };
    console.log('📤 [TASK PAYLOAD]', JSON.stringify(payload, null, 2));
    return payload;
  };

  const handleSaveTask = async () => {
    if (!token) return;

    try {
      const taskData = getTaskPayload();

      if (editingTask) {
        console.log('🔄 Updating task:', editingTask.id);
        await updateAdminTask(token, editingTask.id, taskData);
        setMessage('Tarea actualizada');
      } else {
        console.log('➕ Creating new task');
        await createAdminTask(token, taskData);
        setMessage('Tarea creada');
      }

      resetTaskForm();
      setIsTaskModalOpen(false);
      await fetchAdminData();
      window.dispatchEvent(new Event('tasksUpdated'));
    } catch (err: any) {
      const errorMsg = err?.message || (editingTask ? 'No se pudo actualizar la tarea' : 'No se pudo crear la tarea');
      console.error('❌ [SAVE TASK ERROR]', err);
      setMessage(errorMsg);
    }
  };

  const startEditingTask = (task: UserTask) => {
    const normalized = normalizeTaskForm(task);
    setEditingTask(normalized.editingTask);
    setTaskTitle(normalized.taskTitle);
    setTaskDesc(normalized.taskDesc);
    setTaskPoints(normalized.taskPoints);
    setActionUrl(normalized.actionUrl);
    setWeekNumber(normalized.weekNumber);
    setStartDate(normalized.startDate);
    setEndDate(normalized.endDate);
    setTimeLimitStr(normalized.timeLimitStr);
    setReferralTarget(normalized.referralTarget);
    setRequiredReferralActions(normalized.requiredReferralActions);
    setTaskActive(normalized.taskActive);
    setTaskPlatform(normalized.taskPlatform);
    setTaskAction(normalized.taskAction);
    setTaskAccount(normalized.taskAccount);
    setTaskMandatory(normalized.taskMandatory);
    setIsTaskModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-brand-blackVoid text-brand-pureWhite">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 rounded-[2rem] border border-brand-graphite/70 bg-brand-deepBlue/90 p-10 shadow-brand-soft">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-brand-neonCyan">Panel admin</p>
              <h1 className="mt-4 text-5xl font-semibold text-brand-pureWhite">Gestión del ecosistema</h1>
              <p className="mt-3 max-w-3xl text-brand-softGray">Administra tareas, envíos y la configuración de token pool desde un panel limpio y sofisticado.</p>
            </div>
            <button
              onClick={() => {
                resetTaskForm();
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-3xl bg-brand-neonCyan px-6 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue"
            >
              + Nueva tarea
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-3xl border border-brand-neonCyan/20 bg-brand-deepBlue/85 p-4 text-sm text-brand-neonCyan">
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-brand-graphite/70 bg-brand-graphite/80 p-6 shadow-xl shadow-brand-blackVoid/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-brand-pureWhite">Gestión de tareas</h2>
                  <p className="mt-2 text-sm text-brand-softGray">Crea, edita y administra tareas desde un modal centralizado.</p>
                </div>
                <button
                  onClick={() => {
                    resetTaskForm();
                    setIsTaskModalOpen(true);
                  }}
                  className="rounded-3xl bg-brand-neonCyan px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue"
                >
                  + Nueva tarea
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-brand-graphite/70 bg-brand-graphite/80 p-6 shadow-xl shadow-brand-blackVoid/20">
              <h2 className="text-2xl font-semibold text-brand-pureWhite">Submissions pendientes</h2>
              <div className="mt-6">
                <SubmissionsTable submissions={submissions} onReview={handleReview} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-brand-graphite/70 bg-brand-graphite/80 p-6 shadow-xl shadow-brand-blackVoid/20">
              <h2 className="text-2xl font-semibold text-brand-pureWhite">Métricas</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-brand-blackVoid/70 p-5 text-brand-pureWhite">
                  <p className="text-sm uppercase tracking-[0.25em] text-brand-softGray">Usuarios</p>
                  <p className="mt-4 text-3xl font-semibold">{stats?.totalUsers ?? '—'}</p>
                </div>
                <div className="rounded-3xl bg-brand-blackVoid/70 p-5 text-brand-pureWhite">
                  <p className="text-sm uppercase tracking-[0.25em] text-brand-softGray">Puntos totales</p>
                  <p className="mt-4 text-3xl font-semibold">{stats?.totalCommunityPoints ?? '—'}</p>
                </div>
                <div className="rounded-3xl bg-brand-blackVoid/70 p-5 text-brand-pureWhite">
                  <p className="text-sm uppercase tracking-[0.25em] text-brand-softGray">Tareas activas</p>
                  <p className="mt-4 text-3xl font-semibold">{stats?.activeTasks ?? '—'}</p>
                </div>
                <div className="rounded-3xl bg-brand-blackVoid/70 p-5 text-brand-pureWhite">
                  <p className="text-sm uppercase tracking-[0.25em] text-brand-softGray">Submissions</p>
                  <p className="mt-4 text-3xl font-semibold">{stats?.pendingSubmissions ?? '—'}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-brand-graphite/70 bg-brand-graphite/80 p-6 shadow-xl shadow-brand-blackVoid/20">
              <h2 className="text-2xl font-semibold text-brand-pureWhite">Top usuarios</h2>
              <div className="mt-6 overflow-hidden rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80">
                {leaderboard.length === 0 ? (
                  <div className="p-6 text-brand-softGray">No hay usuarios en el leaderboard.</div>
                ) : (
                  <table className="w-full text-left text-sm text-brand-softGray">
                    <thead className="bg-brand-graphite/90 text-xs uppercase tracking-[0.2em] text-brand-neonCyan">
                      <tr>
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Usuario</th>
                        <th className="px-4 py-3">Puntos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((user, index) => (
                        <tr key={user.id} className="border-t border-brand-graphite/60">
                          <td className="px-4 py-4 text-brand-pureWhite">#{index + 1}</td>
                          <td className="px-4 py-4 text-brand-pureWhite">{user.name || user.email}</td>
                          <td className="px-4 py-4 text-brand-neonCyan font-semibold">{user.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-brand-graphite/70 bg-brand-graphite/80 p-6 shadow-xl shadow-brand-blackVoid/20">
              <h2 className="text-2xl font-semibold text-brand-pureWhite">Tareas publicadas</h2>
              <div className="mt-6 space-y-4">
                {tasks.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-brand-graphite/70 bg-brand-blackVoid/70 p-6 text-brand-softGray">No hay tareas registradas.</div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="rounded-3xl bg-brand-blackVoid/75 p-4 text-brand-softGray">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-brand-pureWhite">{task.title}</h3>
                          <p className="text-sm text-brand-softGray">{task.description ?? 'Sin descripción'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-brand-softGray">Puntos</p>
                          <p className="text-lg font-semibold text-brand-pureWhite">{task.points}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-brand-softGray">
                        <span className="rounded-full bg-brand-graphite/75 px-3 py-2">{task.active ? 'Activo' : 'Desactivado'}</span>
                        <button
                          onClick={() => startEditingTask(task)}
                          className="rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-3 py-2 text-xs font-semibold text-brand-softGray transition hover:border-brand-neonCyan"
                        >
                          Editar
                        </button>
                        <button
                          onClick={async () => {
                            if (!token) return;
                            try {
                              await updateTaskStatus(token, task.id, !task.active);
                              await fetchAdminData();
                              window.dispatchEvent(new Event('tasksUpdated'));
                            } catch (err) {
                              setMessage('No se pudo actualizar el estado de la tarea');
                            }
                          }}
                          className="rounded-2xl bg-brand-neonCyan px-3 py-2 text-xs font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue"
                        >
                          {task.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            {config && <ConfigPanel config={config} onSave={handleConfigSave} />}
            <AnalyticsDashboard metrics={analyticsMetrics} loading={!analyticsMetrics} />
          </div>
        </div>

        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
            <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-brand-graphite/80 bg-brand-deepBlue/95 p-8 shadow-2xl shadow-brand-blackVoid/80">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-neonCyan">{editingTask ? 'Editar tarea' : 'Nueva tarea'}</p>
                  <h2 className="mt-2 text-3xl font-semibold text-brand-pureWhite">{editingTask ? 'Actualizar tarea' : 'Crear nueva tarea'}</h2>
                </div>
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="rounded-full border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-2xl text-brand-softGray transition hover:text-brand-pureWhite"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Título de la tarea"
                  className="w-full rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-4 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                />
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Descripción breve"
                  className="w-full rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-4 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                  rows={4}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="block text-sm text-brand-softGray">Plataforma</label>
                    <select
                      value={taskPlatform}
                      onChange={(e) => setTaskPlatform(e.target.value as typeof taskPlatform)}
                      className="w-full rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-4 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="x">X</option>
                      <option value="telegram">Telegram</option>
                      <option value="youtube">YouTube</option>
                      <option value="referral">Referidos</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm text-brand-softGray">Acción</label>
                    <select
                      value={taskAction}
                      onChange={(e) => setTaskAction(e.target.value as typeof taskAction)}
                      className="w-full rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-4 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                    >
                      <option value="seguir">Seguir</option>
                      <option value="me gusta">Me gusta</option>
                      <option value="compartir">Compartir</option>
                      <option value="ver video">Ver video</option>
                      <option value="comentar">Comentar</option>
                      <option value="suscribirse">Suscribirse</option>
                      <option value="unirse">Unirse</option>
                    </select>
                  </div>
                </div>
                <input
                  type="url"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="Enlace de acción (opcional)"
                  className="w-full rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-4 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                />
                <input
                  value={taskAccount}
                  onChange={(e) => setTaskAccount(e.target.value)}
                  placeholder="Usuario / canal (ej. @usuario)"
                  className="w-full rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-4 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                />
                <div className="grid gap-4 md:grid-cols-2 items-end">
                  <div className="space-y-3">
                    <label className="block text-sm text-brand-softGray">Puntos</label>
                    <input
                      type="number"
                      min={1}
                      value={taskPoints}
                      onChange={(e) => setTaskPoints(Number(e.target.value))}
                      className="w-full rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-4 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                    />
                  </div>
                  <label className="flex items-center justify-between rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-4 text-sm text-brand-softGray">
                    <span>Tarea obligatoria</span>
                    <input
                      type="checkbox"
                      checked={taskMandatory}
                      onChange={(e) => setTaskMandatory(e.target.checked)}
                      className="h-5 w-5 rounded border-brand-graphite/70 bg-brand-blackVoid/80 text-brand-neonCyan"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={handleSaveTask}
                    className="rounded-3xl bg-brand-neonCyan px-6 py-4 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue"
                  >
                    {editingTask ? 'Guardar cambios' : 'Crear tarea'}
                  </button>
                  <button
                    onClick={closeTaskModal}
                    className="rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-6 py-4 text-sm font-semibold text-brand-softGray transition hover:border-brand-neonCyan"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
