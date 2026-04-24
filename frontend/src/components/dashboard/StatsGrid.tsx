import { DashboardStats } from '../../types';
import { StatCard } from './StatCard';

interface Props {
  stats: DashboardStats;
}

export const StatsGrid = ({ stats }: Props) => {
  const statCards = [
    {
      title: 'Estimated Tokens',
      value: stats.estimatedTokens,
      subtitle: 'VELX ready to claim',
      icon: '💎',
      color: 'electric' as const,
      trend: { value: 12, label: 'vs last week' }
    },
    {
      title: 'Total Points',
      value: stats.totalPoints,
      subtitle: 'XP accumulated',
      icon: '⚡',
      color: 'cyan' as const,
      trend: { value: 8, label: 'vs last week' }
    },
    {
      title: 'Missions Completed',
      value: stats.completedTasks,
      subtitle: 'Objectives cleared',
      icon: '🎯',
      color: 'purple' as const,
      trend: { value: 15, label: 'vs last week' }
    },
    {
      title: 'Missions Pending',
      value: stats.pendingTasks,
      subtitle: 'Active objectives',
      icon: '⏳',
      color: 'white' as const
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
};
