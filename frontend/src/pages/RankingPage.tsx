import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getLeaderboard } from '../services/api';
import { LeaderboardEntry } from '../types';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal, FaAward } from 'react-icons/fa';

export const RankingPage = () => {
  const { token } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!token) return;

      try {
        const data = await getLeaderboard(token);
        setLeaderboard(data);
      } catch (err: any) {
        setError(err?.message || 'Error al cargar el ranking');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [token]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <FaMedal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <FaAward className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Ranking Global</h1>
            <p className="mt-2 text-slate-400">Top usuarios por puntos acumulados</p>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-slate-900 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="text-center">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Ranking Global</h1>
          <p className="mt-2 text-slate-400">Top usuarios por puntos acumulados</p>
        </div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {leaderboard.map((entry, index) => {
            const displayName = entry.name && !entry.name.includes('@') ? entry.name : entry.email.split('@')[0];
            const handle = entry.email.split('@')[0];
            return (
              <motion.div
                key={entry.id}
                className={`rounded-lg border p-4 transition ${
                  index < 3
                    ? 'bg-gradient-to-r from-violet-900/20 to-slate-900 border-violet-500/30'
                    : 'bg-slate-900 border-slate-800'
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10">
                      {getRankIcon(index + 1)}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{displayName}</p>
                      <p className="text-slate-400 text-sm">@{handle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-violet-400">{entry.points.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">puntos</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No hay datos de ranking disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
};