import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { getDiscordConnectUrl, getDiscordStatus } from '../../services/api';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '⚡' },
  { name: 'Missions', href: '/tasks', icon: '🎯' },
  { name: 'Rewards', href: '/rewards', icon: '🏆' },
  { name: 'Admin', href: '/admin', icon: '⚙️', adminOnly: true },
  { name: 'Settings', href: '/settings', icon: '🔧' },
];

export const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [discordStatus, setDiscordStatus] = useState<{ connected: boolean; discordUsername?: string }>({ connected: false });
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (user) {
      loadDiscordStatus();
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DISCORD_CONNECTED') {
        loadDiscordStatus();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  const loadDiscordStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const status = await getDiscordStatus(token);
        setDiscordStatus({
          connected: status.connected,
          discordUsername: status.discordUsername
        });
      }
    } catch (error) {
      console.error('Error loading Discord status:', error);
    }
  };

  const handleDiscordConnect = async () => {
    setIsConnecting(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const connectUrl = await getDiscordConnectUrl(token);
        window.location.href = connectUrl;
      }
    } catch (error) {
      console.error('Error getting Discord connect URL:', error);
      setIsConnecting(false);
    }
  };

  return (
    <header className="border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold text-sm">
                  V
                </div>
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 blur-sm -z-10"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                  VELTRIX
                </h1>
                <p className="text-xs text-slate-400 -mt-1">AirDrop Studio</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              if (item.adminOnly && user?.role !== 'ADMIN') return null;

              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-slate-950 font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-400">{user?.role}</p>
                  {discordStatus.connected ? (
                    <div className="flex items-center gap-1 text-xs text-indigo-400">
                      <span>🔗</span>
                      <span>{discordStatus.discordUsername}</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleDiscordConnect}
                      disabled={isConnecting}
                      className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                    >
                      {isConnecting ? 'Conectando...' : 'Conectar Discord'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};