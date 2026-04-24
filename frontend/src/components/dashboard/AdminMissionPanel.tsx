import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserTask } from '../../types';

interface Mission {
  id?: string;
  title: string;
  description: string;
  points: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Elite';
  type: string;
  xpRequired: number;
  weekNumber: number;
  startDate?: string;
  endDate?: string;
  repeatable: boolean;
  priority: number;
  active: boolean;
}

interface AdminMissionPanelProps {
  missions: UserTask[];
  onCreateMission: (mission: Omit<Mission, 'id'>) => Promise<void>;
  onUpdateMission: (id: string, mission: Partial<Mission>) => Promise<void>;
  onDeleteMission: (id: string) => Promise<void>;
  onToggleMission: (id: string, active: boolean) => Promise<void>;
}

export const AdminMissionPanel = ({
  missions,
  onCreateMission,
  onUpdateMission,
  onDeleteMission,
  onToggleMission
}: AdminMissionPanelProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [formData, setFormData] = useState<Partial<Mission>>({
    title: '',
    description: '',
    points: 100,
    difficulty: 'Medium',
    type: 'social',
    xpRequired: 0,
    weekNumber: 1,
    repeatable: false,
    priority: 1,
    active: true
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      points: 100,
      difficulty: 'Medium',
      type: 'social',
      xpRequired: 0,
      weekNumber: 1,
      repeatable: false,
      priority: 1,
      active: true
    });
    setEditingMission(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMission) {
        await onUpdateMission(editingMission.id!, formData);
      } else {
        await onCreateMission(formData as Omit<Mission, 'id'>);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving mission:', error);
    }
  };

  const handleEdit = (mission: UserTask) => {
    setEditingMission({
      id: mission.id,
      title: mission.title,
      description: mission.description || '',
      points: mission.points,
      difficulty: 'Medium',
      type: mission.verificationType || 'social',
      xpRequired: 0,
      weekNumber: 1,
      repeatable: false,
      priority: 1,
      active: mission.active
    });
    setFormData({
      title: mission.title,
      description: mission.description || '',
      points: mission.points,
      difficulty: 'Medium',
      type: mission.verificationType || 'social',
      xpRequired: 0,
      weekNumber: 1,
      repeatable: false,
      priority: 1,
      active: mission.active
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Mission Control</h2>
          <p className="text-slate-400">Manage VELTRIX objectives and challenges</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 font-semibold hover:bg-purple-500/30 transition-colors"
        >
          + New Mission
        </button>
      </div>

      {/* Missions List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-white">{mission.title}</h3>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                  {mission.description}
                </p>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-semibold ${
                mission.active
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {mission.active ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-400 font-semibold">
                {mission.points} XP
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(mission)}
                  className="px-3 py-1 text-xs bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onToggleMission(mission.id, !mission.active)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    mission.active
                      ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                      : 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {mission.active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => onDeleteMission(mission.id)}
                  className="px-3 py-1 text-xs bg-red-500/20 border border-red-500/30 rounded text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mission Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6 w-full max-w-2xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-6">
                {editingMission ? 'Edit Mission' : 'Create New Mission'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Points Reward
                    </label>
                    <input
                      type="number"
                      value={formData.points || 0}
                      onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none h-24 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={formData.difficulty || 'Medium'}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Mission['difficulty'] })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Elite">Elite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type || 'social'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="social">Social</option>
                      <option value="technical">Technical</option>
                      <option value="creative">Creative</option>
                      <option value="community">Community</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Priority
                    </label>
                    <input
                      type="number"
                      value={formData.priority || 1}
                      onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.active || false}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                    />
                    Active Mission
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.repeatable || false}
                      onChange={(e) => setFormData({ ...formData, repeatable: e.target.checked })}
                      className="rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                    />
                    Repeatable
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 font-semibold hover:bg-purple-500/30 transition-colors"
                  >
                    {editingMission ? 'Update Mission' : 'Create Mission'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};