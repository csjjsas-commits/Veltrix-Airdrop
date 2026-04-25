import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { API_BASE } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface ReferralStats {
  totalReferred: number;
  validReferrals: number;
  referrals: Array<{
    userId: string;
    email: string;
    name: string;
    points: number;
    joinedAt: string;
    tasksCompleted: number;
    hasCompletedTask: boolean;
    lastCompletedAt?: string;
  }>;
}

export const ReferralShare: React.FC = () => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, [token]);

  const loadReferralData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [codeRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/referral/code`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/referral/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const codeData = await codeRes.json();
      const statsData = await statsRes.json();

      if (codeData.success) {
        setReferralCode(codeData.referralCode);
        setReferralLink(codeData.referralLink);
      }

      if (statsData.success) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Referral Link Section */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Your Referral Link</h3>

        {referralLink && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Referral Code</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={referralCode || ''}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
                <Button
                  onClick={() => copyToClipboard(referralCode || '')}
                  variant="secondary"
                  size="sm"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Referral Link</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm truncate"
                />
                <Button
                  onClick={() => copyToClipboard(referralLink)}
                  variant="secondary"
                  size="sm"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-4">
          📢 Share your referral code to invite friends. Your friends will be marked as referred when they register with this link, and the referral is counted when they complete at least one task.
          Los puntos que recibe cada uno dependen de las tareas que completen: el referido gana los puntos de su propia misión, y tú ganas la recompensa configurada en la tarea de referido.
        </p>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600">Total Invited</p>
            <p className="text-3xl font-bold text-blue-700">{stats.totalReferred}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-600">Valid Referrals</p>
            <p className="text-3xl font-bold text-green-700">{stats.validReferrals}</p>
          </div>
        </div>
      )}

      {/* Referrals List */}
      {stats && stats.referrals.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="font-semibold">Your Referrals</h4>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.referrals.map((referral) => (
              <div key={referral.userId} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{referral.name}</p>
                    <p className="text-sm text-gray-500">{referral.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {referral.hasCompletedTask ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                          ✓ Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full border border-yellow-200">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-600">
                    Tasks completed: <span className="font-medium">{referral.tasksCompleted}</span>
                  </p>
                  <p className="text-gray-600">
                    Points: <span className="font-medium">{referral.points}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && stats.referrals.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            No referrals yet. Share your code to get started! 🚀
          </p>
        </div>
      )}
    </div>
  );
};
