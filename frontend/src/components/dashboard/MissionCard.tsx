import { motion } from 'framer-motion';
import { useState } from 'react';

interface MissionCardProps {
  id?: string;
  title: string;
  description: string;
  reward: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Elite';
  progress?: number;
  maxProgress?: number;
  status?: 'available' | 'in-progress' | 'completed' | 'locked';
  onClaim?: () => void;
  onStart?: () => void;
}

const difficultyStyles = {
  Easy: 'text-brand-neonCyan bg-brand-neonCyan/10 border-brand-neonCyan/20',
  Medium: 'text-brand-electricBlue bg-brand-electricBlue/10 border-brand-electricBlue/20',
  Hard: 'text-brand-elitePurple bg-brand-elitePurple/10 border-brand-elitePurple/20',
  Elite: 'text-brand-pureWhite bg-brand-elitePurple/20 border-brand-elitePurple/30'
};

const statusStyles = {
  available: 'border-brand-graphite/70 hover:border-brand-electricBlue/40',
  'in-progress': 'border-brand-neonCyan/40 hover:border-brand-neonCyan/60',
  completed: 'border-brand-neonCyan/40 bg-brand-neonCyan/10',
  locked: 'border-brand-graphite/50 opacity-60 cursor-not-allowed'
};

export const MissionCard = ({
  title,
  description,
  reward,
  difficulty = 'Medium',
  progress = 0,
  maxProgress = 1,
  status = 'available',
  onClaim,
  onStart
}: MissionCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isCompleted = status === 'completed';
  const isLocked = status === 'locked';
  const progressPercent = (progress / maxProgress) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isLocked ? { scale: 1.02 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-xl border ${statusStyles[status]} bg-brand-graphite/85 p-6 shadow-brand-soft transition-all duration-300 ${
        isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {isHovered && !isLocked && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-elitePurple/10 to-brand-neonCyan/10" />
      )}

      <div className="relative">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-brand-pureWhite mb-1">{title}</h4>
            <p className="text-sm text-brand-softGray line-clamp-2">{description}</p>
          </div>
          <div className={`ml-3 rounded-full border px-3 py-1 text-xs font-semibold ${difficultyStyles[difficulty]}`}>
            {difficulty}
          </div>
        </div>

        {maxProgress > 1 && (
          <div className="mb-4">
            <div className="mb-2 flex justify-between text-xs text-brand-softGray">
              <span>Progress</span>
              <span>{progress}/{maxProgress}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-graphite/70">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-brand-elitePurple to-brand-neonCyan transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-brand-softGray">Reward:</span>
            <span className="text-sm font-semibold text-brand-neonCyan">{reward}</span>
          </div>

          <div className="flex gap-2">
            {isCompleted ? (
              <button
                disabled
                className="rounded-lg border border-brand-neonCyan/30 bg-brand-neonCyan/10 px-4 py-2 text-sm font-semibold text-brand-neonCyan cursor-not-allowed"
              >
                Completed
              </button>
            ) : !isLocked ? (
              <button
                onClick={onStart}
                className="rounded-lg border border-brand-electricBlue/30 bg-brand-electricBlue/10 px-4 py-2 text-sm font-semibold text-brand-electricBlue transition hover:bg-brand-electricBlue/15"
              >
                {status === 'in-progress' ? 'Continue' : 'Start'}
              </button>
            ) : (
              <div className="rounded-lg border border-brand-graphite/70 bg-brand-graphite/75 px-4 py-2 text-sm font-semibold text-brand-softGray">
                Locked
              </div>
            )}
          </div>
        </div>
      </div>

      {isHovered && !isLocked && (
        <div className="absolute inset-0 rounded-xl border border-brand-electricBlue/15 pointer-events-none" />
      )}
    </motion.div>
  );
};
