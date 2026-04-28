import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  createAdminTask,
  deleteAdminTask,
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
import { FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import { SiInstagram, SiX, SiTelegram, SiYoutube } from 'react-icons/si';
import { MdGroup } from 'react-icons/md';

type TabType = 'tasks' | 'verification' | 'metrics';

// Helper: Format seconds to HH:MM:SS
const formatTimeLimit = (seconds: number | null | undefined): string => {
  if (!seconds || seconds < 0) return '';
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
};

// Helper: Get platform icon
const getPlatformIcon = (platform: string | undefined) => {
  switch (platform?.toLowerCase()) {
    case 'instagram':
      return <SiInstagram className="w-5 h-5" />;
    case 'x':
      return <SiX className="w-5 h-5" />;
    case 'telegram':
      return <SiTelegram className="w-5 h-5" />;
    case 'youtube':
      return <SiYoutube className="w-5 h-5" />;
    case 'referral':
      return <MdGroup className="w-5 h-5" />;
    default:
      return <SiX className="w-5 h-5" />;
  }
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
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
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
  const [overriddenSubmissions, setOverriddenSubmissions] = useState<Set<string>>(new Set());


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
      active: taskActive,
      platform: taskPlatform
    };
    console.log('📤 [TASK PAYLOAD]', JSON.stringify(payload, null, 2));
    return payload;
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!token) return;

    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteAdminTask(token, taskId);
      setMessage('Tarea eliminada');
      await fetchAdminData();
      window.dispatchEvent(new Event('tasksUpdated'));
    } catch (err: any) {
      const errorMsg = err?.message || 'No se pudo eliminar la tarea';
      console.error('❌ [DELETE TASK ERROR]', err);
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

  const handleForceApprove = (submissionId: string) => {
    setOverriddenSubmissions(prev => new Set(prev).add(submissionId));
    setMessage(`Aprobación manual forzada para envío ${submissionId}`);
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

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-10 rounded-[2rem] border border-gray-700/40 bg-gray-900/60 p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-purple-400">Panel admin</p>
              <h1 className="mt-4 text-5xl font-semibold text-white">Gestión del ecosistema</h1>
              <p className="mt-3 max-w-3xl text-gray-400">Administra tareas, verificaciones y análisis desde un panel centralizado.</p>
            </div>
            <button
              onClick={() => {
                resetTaskForm();
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-full bg-purple-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-600"
            >
              + Nueva Tarea
            </button>
          </div>
        </div>

        {/* Alert Message */}
        {message && (
          <div className="mb-6 rounded-2xl border border-purple-400/20 bg-purple-900/30 p-4 text-sm text-purple-200">
            {message}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="mb-8 flex gap-3 border-b border-gray-700/40">
          {(['tasks', 'verification', 'metrics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-medium transition ${
                activeTab === tab
                  ? 'border-b-2 border-purple-500 bg-gray-800/50 text-white rounded-t-2xl'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab === 'tasks' && 'Tareas Activas'}
              {tab === 'verification' && 'Historial de Verificación'}
              {tab === 'metrics' && 'Métricas y Pool'}
            </button>
          ))}
        </div>

        {/* TAB 1: Tareas Activas */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-700/40 bg-gray-900/40 p-12 text-center text-gray-500">
                <p>No hay tareas registradas. Crea la primera haciendo clic en "+ Nueva Tarea".</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 rounded-xl border border-gray-700/40 bg-gray-900/60 p-4 transition hover:bg-gray-800/60"
                  >
                    {/* Platform Icon */}
                    <div className="flex items-center justify-center rounded-lg bg-gray-800 p-3 text-purple-400">
                      {getPlatformIcon(task.platform)}
                    </div>

                    {/* Task Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{task.title}</h3>
                      <p className="text-sm text-gray-400">{task.description ?? 'Sin descripción'}</p>
                    </div>

                    {/* XP Points */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Puntos</p>
                      <p className="text-lg font-bold text-purple-400">{task.points} XP</p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          task.active
                            ? 'bg-green-900/40 text-green-300'
                            : 'bg-gray-700/40 text-gray-400'
                        }`}
                      >
                        {task.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditingTask(task)}
                        className="rounded-lg bg-gray-800 p-2 text-gray-400 transition hover:bg-gray-700 hover:text-purple-400"
                        title="Editar"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!token) return;
                          try {
                            await updateTaskStatus(token, task.id, !task.active);
                            await fetchAdminData();
                            window.dispatchEvent(new Event('tasksUpdated'));
                          } catch (err) {
                            setMessage('No se pudo actualizar el estado');
                          }
                        }}
                        className="rounded-lg bg-gray-800 p-2 text-gray-400 transition hover:bg-gray-700 hover:text-blue-400"
                        title={task.active ? 'Pausar' : 'Activar'}
                      >
                        {task.active ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="rounded-lg bg-gray-800 p-2 text-gray-400 transition hover:bg-red-900/40 hover:text-red-400"
                        title="Eliminar"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Historial de Verificación */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            {submissions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-700/40 bg-gray-900/40 p-12 text-center text-gray-500">
                <p>No hay verificaciones registradas.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-700/40 bg-gray-900/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/40 bg-gray-800/60">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Usuario
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Tarea
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Handle
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Fecha
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr
                        key={submission.id}
                        className="border-b border-gray-700/20 transition hover:bg-gray-800/30"
                      >
                        <td className="px-6 py-4 text-gray-300">{submission.user?.name || submission.user?.email || '—'}</td>
                        <td className="px-6 py-4 text-gray-300">{submission.task?.title || '—'}</td>
                        <td className="px-6 py-4 text-gray-400">@usuario</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                              submission.status === 'COMPLETED'
                                ? 'bg-green-900/40 text-green-300'
                                : submission.status === 'FAILED'
                                  ? 'bg-red-900/40 text-red-300'
                                  : 'bg-yellow-900/40 text-yellow-300'
                            }`}
                          >
                            {submission.status === 'COMPLETED'
                              ? 'Aprobado'
                              : submission.status === 'FAILED'
                                ? 'Rechazado'
                                : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {submission.completedAt
                            ? new Date(submission.completedAt).toLocaleDateString('es-ES')
                            : '—'}
                        </td>
                        <td className="px-6 py-4">
                          {submission.status === 'FAILED' && !overriddenSubmissions.has(submission.id) && (
                            <button
                              onClick={() => handleForceApprove(submission.id)}
                              className="text-xs font-semibold text-purple-400 transition hover:text-purple-300"
                            >
                              Forzar Aprobación
                            </button>
                          )}
                          {overriddenSubmissions.has(submission.id) && (
                            <span className="text-xs text-green-400">✓ Forzado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Métricas y Pool */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-700/40 bg-gray-900/60 p-6">
                <p className="text-xs uppercase tracking-wider text-gray-500">Usuarios</p>
                <p className="mt-3 text-3xl font-bold text-white">{stats?.totalUsers ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-gray-700/40 bg-gray-900/60 p-6">
                <p className="text-xs uppercase tracking-wider text-gray-500">Puntos Totales</p>
                <p className="mt-3 text-3xl font-bold text-purple-400">{stats?.totalCommunityPoints ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-gray-700/40 bg-gray-900/60 p-6">
                <p className="text-xs uppercase tracking-wider text-gray-500">Tareas Activas</p>
                <p className="mt-3 text-3xl font-bold text-green-400">{stats?.activeTasks ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-gray-700/40 bg-gray-900/60 p-6">
                <p className="text-xs uppercase tracking-wider text-gray-500">Envíos Pendientes</p>
                <p className="mt-3 text-3xl font-bold text-yellow-400">{stats?.pendingSubmissions ?? '—'}</p>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="rounded-xl border border-gray-700/40 bg-gray-900/60 p-6">
              <h3 className="text-lg font-semibold text-white">Top Usuarios</h3>
              <div className="mt-6 overflow-hidden rounded-lg">
                {leaderboard.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">Sin datos</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800/60">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Usuario
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Puntos
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((user, index) => (
                        <tr key={user.id} className="border-t border-gray-700/20 transition hover:bg-gray-800/30">
                          <td className="px-4 py-4 text-gray-300">#{index + 1}</td>
                          <td className="px-4 py-4 text-gray-300">{user.name || user.email}</td>
                          <td className="px-4 py-4 text-right font-semibold text-purple-400">{user.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Analytics Dashboard */}
            {analyticsMetrics && (
              <div className="rounded-xl border border-gray-700/40 bg-gray-900/60 p-6">
                <AnalyticsDashboard metrics={analyticsMetrics} loading={false} />
              </div>
            )}

            {/* Config Panel */}
            {config && (
              <div className="rounded-xl border border-gray-700/40 bg-gray-900/60 p-6">
                <ConfigPanel config={config} onSave={handleConfigSave} />
              </div>
            )}
          </div>
        )}

        {/* Task Creation Modal */}
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-gray-700/40 bg-gray-900/95 p-10 shadow-2xl">
              <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-widest text-purple-400">
                    {editingTask ? 'Editar tarea' : 'Nueva tarea'}
                  </p>
                  <h2 className="mt-2 text-4xl font-bold text-white">
                    {editingTask ? 'Actualizar tarea' : 'Crear nueva tarea'}
                  </h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Configura los detalles de la misión y cómo será verificada por IA
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="rounded-full border border-gray-700/40 bg-gray-800 px-4 py-3 text-2xl text-gray-400 transition hover:bg-gray-700 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="grid gap-6">
                {/* Title & Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Título de la tarea</label>
                  <input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Ej: Síguenos en X"
                    className="w-full rounded-xl border border-gray-700/40 bg-gray-800/60 px-4 py-3 text-white outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                  <textarea
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Describe brevemente la acción que deben realizar"
                    className="w-full rounded-xl border border-gray-700/40 bg-gray-800/60 px-4 py-3 text-white outline-none focus:border-purple-400"
                    rows={3}
                  />
                </div>

                {/* Platform & Action */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Plataforma</label>
                    <select
                      value={taskPlatform}
                      onChange={(e) => setTaskPlatform(e.target.value as typeof taskPlatform)}
                      className="w-full rounded-xl border border-gray-700/40 bg-gray-800/60 px-4 py-3 text-white outline-none focus:border-purple-400"
                    >
                      <option value="x">X (Twitter)</option>
                      <option value="instagram">Instagram</option>
                      <option value="telegram">Telegram</option>
                      <option value="youtube">YouTube</option>
                      <option value="referral">Sistema de Referidos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de acción</label>
                    <select
                      value={taskAction}
                      onChange={(e) => setTaskAction(e.target.value as typeof taskAction)}
                      className="w-full rounded-xl border border-gray-700/40 bg-gray-800/60 px-4 py-3 text-white outline-none focus:border-purple-400"
                    >
                      <option value="seguir">Seguir</option>
                      <option value="me gusta">Like / Me gusta</option>
                      <option value="compartir">Compartir / Retweet</option>
                      <option value="ver video">Ver video</option>
                      <option value="comentar">Comentar</option>
                      <option value="suscribirse">Suscribirse</option>
                      <option value="unirse">Unirse</option>
                    </select>
                  </div>
                </div>

                {/* Action URL & Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Enlace de acción (URL)</label>
                  <input
                    type="url"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    placeholder="https://twitter.com/veltrix"
                    className="w-full rounded-xl border border-gray-700/40 bg-gray-800/60 px-4 py-3 text-white outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Usuario / Canal objetivo</label>
                  <p className="mb-2 text-xs text-gray-500">La IA usará esto para verificar la acción automáticamente</p>
                  <input
                    value={taskAccount}
                    onChange={(e) => setTaskAccount(e.target.value)}
                    placeholder="@veltrix o nombre del canal"
                    className="w-full rounded-xl border border-gray-700/40 bg-gray-800/60 px-4 py-3 text-white outline-none focus:border-purple-400"
                  />
                </div>

                {/* Points & Mandatory */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Puntos (XP)</label>
                    <input
                      type="number"
                      min={1}
                      value={taskPoints}
                      onChange={(e) => setTaskPoints(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-700/40 bg-gray-800/60 px-4 py-3 text-white outline-none focus:border-purple-400"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex w-full items-center gap-3 rounded-xl border border-gray-700/40 bg-gray-800/60 px-4 py-3 text-sm font-medium text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taskMandatory}
                        onChange={(e) => setTaskMandatory(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-600 text-purple-500"
                      />
                      <span>Tarea obligatoria</span>
                    </label>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-3 rounded-xl border border-gray-700/40 bg-gray-800/60 px-4 py-3">
                  <label className="text-sm font-medium text-gray-300">Estado:</label>
                  <select
                    value={taskActive ? 'active' : 'inactive'}
                    onChange={(e) => setTaskActive(e.target.value === 'active')}
                    className="ml-auto rounded-lg border border-gray-700/40 bg-gray-700/40 px-3 py-1 text-sm text-white outline-none focus:border-purple-400"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveTask}
                    className="flex-1 rounded-xl bg-purple-500 px-6 py-3 font-semibold text-white transition hover:bg-purple-600"
                  >
                    {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
                  </button>
                  <button
                    onClick={closeTaskModal}
                    className="flex-1 rounded-xl border border-gray-700/40 bg-gray-800/60 px-6 py-3 font-semibold text-gray-300 transition hover:bg-gray-700/60"
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

