export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  referralCode?: string;
  walletAddress?: string;
  walletConnectedAt?: string;
}

export interface DashboardStats {
  totalPoints: number;
  completedTasks: number;
  pendingTasks: number;
  estimatedTokens: string;
  level?: number;
  progressToNextLevel?: number;
  pointsToNextLevel?: number;
  rank?: number;
  totalUsers?: number;
  percentile?: number;
}

export interface DashboardData {
  user: UserInfo;
  stats: DashboardStats;
  recentTasks: UserTask[];
  availableTasks: UserTask[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  points: number;
}

export type TaskType =
  | 'INTERNAL_ACTION'
  | 'EXTERNAL_LINK'
  | 'MANUAL_SUBMIT'
  | 'REFERRAL'
  | 'AUTO_COMPLETE'
  | 'WALLET_ACTION';

export type VerificationMethod =
  | 'SYSTEM_AUTOMATIC'
  | 'MANUAL_REVIEW'
  | 'USER_CONFIRMATION'
  | 'REFERRAL_VALIDATION';

export interface UserTask {
  id: string;
  title: string;
  description: string | null;
  points: number;
  deadline: string | null;
  taskType: TaskType;
  actionUrl: string | null;
  verificationType: string | null;
  verificationMethod: VerificationMethod;
  requiresProof: boolean;
  weekNumber: number | null;
  startDate: string | null;
  endDate: string | null;
  timeLimit: number | null;
  referralTarget: string | null;
  requiredReferralActions: number | null;
  referralRequiredTaskId: string | null;
  active: boolean;
  verificationData: any;
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | null;
  completedAt: string | null;
  pointsAwarded: number | null;
  linkOpenedAt: string | null;
  referralCount?: number;
}

export interface TaskPayload {
  title: string;
  description?: string;
  points: number;
  deadline?: string | null;
  taskType: TaskType;
  actionUrl?: string | null;
  verificationMethod: VerificationMethod;
  requiresProof: boolean;
  weekNumber?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  timeLimit?: number | null;
  referralTarget?: string | null;
  requiredReferralActions?: number | null;
  active: boolean;
}

export interface SubmissionItem {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  completedAt: string | null;
  pointsAwarded: number | null;
  user: {
    id: string;
    email: string;
    name: string;
  };
  task: {
    id: string;
    title: string;
    points: number;
  };
}

export interface AdminConfig {
  id: string;
  totalAirdropPool: string;
  currentWeek: number;
  totalCommunityPoints: number;
}

export interface AdminStats {
  totalUsers: number;
  totalCommunityPoints: number;
  totalTasks: number;
  pendingSubmissions: number;
  activeTasks: number;
}

export interface AnalyticsMetrics {
  totalUsers: number;
  totalTasksCompleted: number;
  conversionRate: number;
  topTasks: Array<{
    id: string;
    title: string;
    completions: number;
  }>;
}
