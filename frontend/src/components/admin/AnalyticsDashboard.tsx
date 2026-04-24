import React from 'react';

interface AnalyticsMetrics {
  totalUsers: number;
  totalTasksCompleted: number;
  conversionRate: number;
  topTasks: Array<{
    id: string;
    title: string;
    completions: number;
  }>;
}

interface AnalyticsDashboardProps {
  metrics: AnalyticsMetrics | null;
  loading: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  metrics,
  loading
}) => {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/90 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Analytics Dashboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-slate-800 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/90 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Analytics Dashboard</h3>
        <p className="text-slate-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-slate-900/90 p-6">
      <h3 className="text-xl font-semibold text-white mb-6">Analytics Dashboard</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl bg-slate-800/50 p-4">
          <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
            Total Users
          </h4>
          <p className="text-3xl font-bold text-white mt-2">
            {metrics.totalUsers.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-800/50 p-4">
          <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
            Tasks Completed
          </h4>
          <p className="text-3xl font-bold text-white mt-2">
            {metrics.totalTasksCompleted.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-800/50 p-4">
          <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
            Conversion Rate
          </h4>
          <p className="text-3xl font-bold text-white mt-2">
            {(metrics.conversionRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-4">Top Tasks</h4>
        <div className="space-y-3">
          {metrics.topTasks.map((task, index) => (
            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-400 w-6">
                  #{index + 1}
                </span>
                <span className="text-white font-medium">{task.title}</span>
              </div>
              <span className="text-fuchsia-400 font-semibold">
                {task.completions} completions
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-800/50">
        <p className="text-xs text-slate-500">
          Data from Google Analytics & PostHog. Updated in real-time.
        </p>
      </div>
    </div>
  );
};