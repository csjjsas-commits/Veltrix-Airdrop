import { AdminConfig, AdminStats, AnalyticsMetrics, DashboardData, LeaderboardEntry, SubmissionItem, TaskPayload, UserTask, UserInfo } from '../types';

export const API_BASE = import.meta.env.VITE_API_URL;

if (!API_BASE) {
  throw new Error('VITE_API_URL is not defined. Set it in your frontend environment variables.');
}

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
  errors?: unknown;
} | T;

const request = async <T>(path: string, method = 'GET', body?: unknown, token?: string): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Only log in development, and mask sensitive data
  if (import.meta.env.DEV) {
    console.log(`📡 [${method}] ${path}`);
    if (body && typeof body === 'object') {
      const maskedBody = { ...body };
      if ('password' in maskedBody) maskedBody.password = '[REDACTED]';
      if ('captchaToken' in maskedBody) maskedBody.captchaToken = '[REDACTED]';
      if ('token' in maskedBody) maskedBody.token = '[REDACTED]';
      console.log('  Payload:', maskedBody);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({} as unknown));

  if (!response.ok) {
    console.error(`❌ [${response.status}] ${method} ${path}`, {
      status: response.status,
      payload
    });
    const errorMessage = (payload as any)?.message || (payload as any)?.error || `Error ${response.status} en ${path}`;
    throw new Error(errorMessage);
  }

  if (payload && typeof payload === 'object' && 'data' in payload && (payload as any).data !== undefined) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};

export const login = async (email: string, password: string, captchaToken: string) => {
  return request<{ user: UserInfo; token: string }>('/auth/login', 'POST', { email, password, captchaToken });
};

export const register = async (name: string, email: string, password: string, captchaToken: string, referralCode?: string) => {
  return request<{ user: UserInfo; token: string }>('/auth/register', 'POST', { name, email, password, captchaToken, referralCode });
};

export const getDashboard = async (token: string): Promise<DashboardData> => {
  return request<DashboardData>('/tasks/dashboard', 'GET', undefined, token);
};

export const getTasks = async (token: string): Promise<UserTask[]> => {
  return request<UserTask[]>('/tasks', 'GET', undefined, token);
};

export const completeTask = async (token: string, taskId: string): Promise<UserTask> => {
  return request<UserTask>(`/tasks/${taskId}/complete`, 'POST', undefined, token);
};

export const startTask = async (token: string, taskId: string): Promise<UserTask> => {
  return request<UserTask>(`/tasks/${taskId}/start`, 'POST', undefined, token);
};

export const openLink = async (token: string, taskId: string): Promise<UserTask> => {
  return request<UserTask>(`/tasks/${taskId}/open-link`, 'POST', undefined, token);
};

export const submitTaskForReview = async (token: string, taskId: string, proof: string, description?: string): Promise<UserTask> => {
  return request<UserTask>(`/tasks/${taskId}/submit`, 'POST', { proof, description }, token);
};

export const verifyTask = async (token: string, taskId: string, verificationData: any): Promise<any> => {
  return request<any>(`/tasks/${taskId}/verify`, 'POST', verificationData, token);
};

export const getAdminTasks = async (token: string): Promise<UserTask[]> => {
  return request<UserTask[]>('/admin/tasks', 'GET', undefined, token);
};

export const getSubmissions = async (token: string): Promise<SubmissionItem[]> => {
  return request<SubmissionItem[]>('/admin/submissions', 'GET', undefined, token);
};

export const getAdminConfig = async (token: string): Promise<AdminConfig> => {
  return request<AdminConfig>('/admin/config', 'GET', undefined, token);
};

export const getAdminStats = async (token: string): Promise<AdminStats> => {
  return request<AdminStats>('/admin/stats', 'GET', undefined, token);
};

export const saveWallet = async (walletAddress: string): Promise<{ user: UserInfo }> => {
  const token = localStorage.getItem('airdrop_auth') ? JSON.parse(localStorage.getItem('airdrop_auth')!).token : '';
  return request<{ user: UserInfo }>('/auth/wallet', 'POST', { walletAddress }, token);
};
export const deleteAdminTask = async (token: string, taskId: string): Promise<void> => {
  return request<void>(`/admin/tasks/${taskId}`, 'DELETE', undefined, token);
};
export const getAnalyticsMetrics = async (token: string): Promise<AnalyticsMetrics> => {
  return request<AnalyticsMetrics>('/analytics/metrics', 'GET', undefined, token);
};

export const updateAdminConfig = async (token: string, config: Partial<AdminConfig>) => {
  return request<AdminConfig>('/admin/config', 'PUT', config, token);
};

export const createAdminTask = async (token: string, task: TaskPayload) => {
  return request<UserTask>('/admin/tasks', 'POST', task, token);
};

export const updateAdminTask = async (token: string, id: string, task: Partial<TaskPayload>) => {
  return request<UserTask>(`/admin/tasks/${id}`, 'PUT', task, token);
};

export const updateTaskStatus = async (token: string, id: string, active: boolean) => {
  return request<UserTask>(`/admin/tasks/${id}/status`, 'PATCH', { active }, token);
};

export const reviewSubmission = async (token: string, id: string, action: 'approve' | 'reject') => {
  return request<SubmissionItem>(`/admin/submissions/${id}/review`, 'PATCH', { action }, token);
};

export const getDiscordConnectUrl = async (token: string): Promise<string> => {
  return request<string>('/auth/discord/connect-url', 'GET', undefined, token);
};

export const getDiscordStatus = async (token: string): Promise<{ connected: boolean; discordId?: string; discordUsername?: string; discordDiscriminator?: string }> => {
  return request('/auth/discord/status', 'GET', undefined, token);
};

export const getLeaderboard = async (token: string): Promise<LeaderboardEntry[]> => {
  return request<LeaderboardEntry[]>('/admin/leaderboard', 'GET', undefined, token);
};
