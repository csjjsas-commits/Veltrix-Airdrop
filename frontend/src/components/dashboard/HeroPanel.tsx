import { DashboardData } from '../../types';

interface HeroPanelProps {
  dashboard: DashboardData | null;
  loading: boolean;
}

export const HeroPanel = ({ dashboard, loading }: HeroPanelProps) => {
  const user = dashboard?.user;
  const stats = dashboard?.stats;

  const level = stats?.level ?? 1;
  const rank = stats?.rank ?? 0;
  const totalUsers = stats?.totalUsers ?? 0;
  const percentile = stats?.percentile ?? 0;
  const progressToNextLevel = stats?.progressToNextLevel ?? 0;
  const pointsToNextLevel = stats?.pointsToNextLevel ?? 500;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-graphite/70 bg-brand-deepBlue/85 p-4 sm:p-6 lg:p-8 shadow-brand-soft">
      <div className="absolute inset-0 bg-brand-fog opacity-80" />
      <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-brand-neonCyan/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-brand-elitePurple/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="rounded-full border border-brand-electricBlue/20 bg-brand-electricBlue/10 px-3 py-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-neonCyan">
                  Command Center
                </span>
              </div>
              <div className="rounded-full border border-brand-neonCyan/20 bg-brand-neonCyan/10 px-3 py-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-electricBlue">
                  Level {level}
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-brand-pureWhite mb-3">
              Welcome back, {loading ? 'Loading...' : user?.name?.split(' ')[0] || 'Pilot'}
            </h1>

            <p className="text-lg text-brand-softGray max-w-2xl">
              Your neural link is active. {stats?.completedTasks || 0} missions completed,
              {stats?.pendingTasks || 0} objectives remaining. The VELTRIX ecosystem is standing by.
            </p>

            <div className="mt-6 flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-brand-neonCyan animate-pulse" />
                <span className="text-sm text-brand-softGray">Neural Link: Active</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-brand-electricBlue" />
                <span className="text-sm text-brand-softGray">Premium Status: Enabled</span>
              </div>
            </div>
            <div className="mt-8 max-w-xl">
              <div className="mb-3 flex items-center justify-between text-sm text-brand-softGray">
                <span>Progress to next level</span>
                <span>{progressToNextLevel}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-brand-graphite/70">
                <div className="h-full rounded-full bg-brand-neonCyan transition-all" style={{ width: `${progressToNextLevel}%` }} />
              </div>
              <p className="mt-3 text-sm text-brand-softGray">Need {pointsToNextLevel} XP for Level {level + 1}</p>
            </div>
          </div>

          <div className="relative flex-shrink-0">
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 lg:h-36 lg:w-36 rounded-3xl border border-brand-electricBlue/20 bg-brand-graphite/90 p-5 shadow-brand-glow">
              <div className="text-center">
                <div className="mb-2 text-3xl">🏆</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-neonCyan">
                  Rank #{rank}
                </div>
                <div className="mt-2 text-sm text-brand-softGray">Top {percentile}% of {totalUsers}</div>
              </div>
            </div>
            <div className="absolute -inset-1 rounded-3xl bg-brand-electricBlue/10 blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </div>
  );
};