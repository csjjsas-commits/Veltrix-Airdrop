import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: 'purple' | 'cyan' | 'electric' | 'white';
  trend?: {
    value: number;
    label: string;
  };
}

const colorClasses = {
  purple: {
    bg: 'from-brand-elitePurple/20 to-brand-elitePurple/5',
    border: 'border-brand-elitePurple/20',
    text: 'text-brand-elitePurple',
    glow: 'shadow-brand-glow'
  },
  cyan: {
    bg: 'from-brand-neonCyan/20 to-brand-electricBlue/10',
    border: 'border-brand-neonCyan/20',
    text: 'text-brand-neonCyan',
    glow: 'shadow-brand-glow'
  },
  electric: {
    bg: 'from-brand-electricBlue/20 to-brand-electricBlue/10',
    border: 'border-brand-electricBlue/20',
    text: 'text-brand-electricBlue',
    glow: 'shadow-brand-glow'
  },
  white: {
    bg: 'from-brand-pureWhite/10 to-brand-pureWhite/5',
    border: 'border-brand-softGray/20',
    text: 'text-brand-pureWhite',
    glow: 'shadow-brand-soft'
  }
};

export const StatCard = ({ title, value, subtitle, icon, color, trend }: StatCardProps) => {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-4 sm:p-5 lg:p-6 shadow-lg ${colors.glow} transition-all duration-300 hover:shadow-xl`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-40`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`text-2xl ${colors.text}`}>{icon}</div>
          {trend && (
            <div className="text-right">
              <div className={`text-sm font-semibold ${colors.text}`}>+{trend.value}%</div>
              <div className="text-xs text-brand-softGray">{trend.label}</div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-brand-pureWhite">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          <p className="text-sm font-medium uppercase tracking-wider text-brand-softGray">{title}</p>
          {subtitle && <p className="text-xs text-brand-softGray">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
};