import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { ToastProvider } from '../ui/ToastProvider';
import { API_BASE, verifyTask } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface YouTubeVerificationProps {
  taskId: string;
  onVerificationComplete?: (success: boolean, data?: any) => void;
  channelId?: string;
  channelTitle?: string;
  action: 'subscribe' | 'like' | 'connect';
  targetId: string; // channel ID for subscribe, video ID for like
}

export const YouTubeVerification: React.FC<YouTubeVerificationProps> = ({
  taskId,
  onVerificationComplete,
  channelId,
  channelTitle,
  action,
  targetId
}) => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  useEffect(() => {
    checkYouTubeConnection();
  }, []);

  const checkYouTubeConnection = async () => {
    try {
      if (!token) {
        setConnectionStatus('No autenticado. Por favor inicia sesión.');
        return;
      }

      const response = await fetch(`${API_BASE}/youtube/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setConnectionStatus('Sesión expirada. Por favor inicia sesión nuevamente.');
          return;
        }
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setIsConnected(data.connected);
      setConnectionStatus(data.connected ? `Conectado como ${data.channelTitle}` : null);
    } catch (error: any) {
      console.error('Error checking YouTube connection:', error);
      setConnectionStatus(`Error: ${error?.message || 'Error verificando conexión'}`);
    }
  };

  const connectYouTube = async () => {
    setIsConnecting(true);
    setConnectionStatus(null);
    try {
      if (!token) {
        setConnectionStatus('No autenticado. Por favor inicia sesión.');
        setIsConnecting(false);
        return;
      }

      const response = await fetch(`${API_BASE}/youtube/auth-url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.authUrl) {
        // Open OAuth URL in new window
        const authWindow = window.open(
          data.authUrl,
          'youtube-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!authWindow) {
          setConnectionStatus('Error: No se pudo abrir la ventana de autenticación. Verifica que los popups no estén bloqueados.');
          setIsConnecting(false);
          return;
        }

        // Poll for completion
        const checkClosed = setInterval(() => {
          try {
            if (authWindow?.closed) {
              clearInterval(checkClosed);
              checkYouTubeConnection();
              setIsConnecting(false);
            }
          } catch (error) {
            // Some browsers block access to cross-origin window properties when COOP is enforced.
            // In that case, rely on status polling instead of reading authWindow.closed directly.
          }
        }, 1000);

        // Also check status periodically
        const checkStatus = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${API_BASE}/youtube/status`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!statusResponse.ok) {
              if (statusResponse.status === 401) {
                setConnectionStatus('Sesión expirada. Por favor inicia sesión nuevamente.');
                clearInterval(checkStatus);
                clearInterval(checkClosed);
                setIsConnecting(false);
                try {
                  authWindow?.close();
                } catch (closeError) {
                  // ignore close restrictions
                }
                return;
              }
              return; // Continue polling on other errors
            }

            const statusData = await statusResponse.json();
            if (statusData.connected) {
              clearInterval(checkStatus);
              clearInterval(checkClosed);
              setIsConnected(true);
              setConnectionStatus(`Conectado como ${statusData.channelTitle}`);
              setIsConnecting(false);
              try {
                authWindow?.close();
              } catch (closeError) {
                // ignore close restrictions
              }
            }
          } catch (error) {
            // Continue polling
          }
        }, 2000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          clearInterval(checkStatus);
          setIsConnecting(false);
          try {
            authWindow?.close();
          } catch (closeError) {
            // ignore close restrictions
          }
        }, 300000);
      } else {
        setConnectionStatus(`Error: ${data.error || 'No se pudo obtener la URL de autenticación'}`);
        setIsConnecting(false);
      }
    } catch (error: any) {
      console.error('Error getting auth URL:', error);
      setConnectionStatus(`Error: ${error?.message || 'Error conectando con YouTube'}`);
      setIsConnecting(false);
    }
  };

  const disconnectYouTube = async () => {
    try {
      if (!token) {
        setConnectionStatus('No autenticado. Por favor inicia sesión.');
        return;
      }

      const response = await fetch(`${API_BASE}/youtube/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setConnectionStatus('Sesión expirada. Por favor inicia sesión nuevamente.');
          return;
        }
        throw new Error(`Error: ${response.statusText}`);
      }

      setIsConnected(false);
      setConnectionStatus(null);
    } catch (error: any) {
      console.error('Error disconnecting YouTube:', error);
      setConnectionStatus(`Error: ${error?.message || 'Error desconectando YouTube'}`);
    }
  };

  const verifyAction = async () => {
    // For connect action, verify immediately after OAuth
    if (action === 'connect') {
      if (!isConnected) {
        setVerificationStatus('Por favor, conecta tu cuenta de YouTube primero.');
        return;
      }
      // Proceed with verification
    } else {
      // For other actions (subscribe, like), must be connected first
      if (!isConnected) return;
    }

    setIsVerifying(true);
    setVerificationStatus(null);

    try {
      if (!token) {
        setVerificationStatus('No autenticado. Conecta tu cuenta primero.');
        onVerificationComplete?.(false, { message: 'No autenticado' });
        return;
      }

      const result = await verifyTask(token, taskId, {
        verificationData: {
          action,
          targetId
        }
      });

      if (result?.verified || result?.taskCompleted) {
        setVerificationStatus('¡Verificación exitosa!');
        onVerificationComplete?.(true, result);
      } else {
        setVerificationStatus(result?.message || 'Verificación fallida');
        onVerificationComplete?.(false, result);
      }
    } catch (error: any) {
      console.error('Error verifying:', error);
      setVerificationStatus(error?.message || 'Error durante la verificación');
      onVerificationComplete?.(false, { message: error?.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const getActionText = () => {
    switch (action) {
      case 'subscribe':
        return `Suscribirse al canal ${channelTitle || 'especificado'}`;
      case 'like':
        return 'Dar like al video especificado';
      case 'connect':
        return 'Conectar tu cuenta de YouTube';
      default:
        return 'Realizar acción en YouTube';
    }
  };

  const getActionButtonText = () => {
    switch (action) {
      case 'subscribe':
        return 'Verificar Suscripción';
      case 'like':
        return 'Verificar Like';
      case 'connect':
        return 'Verificar Conexión';
      default:
        return 'Verificar';
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/95 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-300">
            Estado de conexión: {isConnected ? 'Conectado' : 'No conectado'}
          </span>
          {isConnected ? (
            <button
              onClick={disconnectYouTube}
              className="rounded-3xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-red-400 hover:text-red-300"
            >
              Desconectar
            </button>
          ) : (
            <button
              onClick={connectYouTube}
              disabled={isConnecting}
              className="rounded-3xl bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConnecting ? 'Conectando...' : 'Conectar YouTube'}
            </button>
          )}
        </div>
        {connectionStatus && (
          <p className="text-xs text-slate-400">{connectionStatus}</p>
        )}
      </div>

      {/* Action Description */}
      <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/95 p-5">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400 mb-3">Acción requerida</p>
        <p className="text-sm text-slate-300 mb-2">
          {getActionText()}
        </p>
        {action === 'subscribe' && channelId && (
          <p className="text-xs text-slate-500">
            ID del canal: {channelId}
          </p>
        )}
        {action === 'like' && targetId && (
          <p className="text-xs text-slate-500">
            ID del video: {targetId}
          </p>
        )}
      </div>

      {/* Verification Button */}
      <button
        onClick={verifyAction}
        disabled={!isConnected || isVerifying}
        className="w-full rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isVerifying ? 'Verificando...' : getActionButtonText()}
      </button>

      {/* Status Messages */}
      {verificationStatus && (
        <div className={`rounded-[1.75rem] border p-4 text-sm ${
          verificationStatus.includes('¡') || verificationStatus.includes('exitosa')
            ? 'border-green-500/30 bg-green-500/10 text-green-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          {verificationStatus}
        </div>
      )}

      {/* Instructions */}
      {!isConnected && (
        <div className="rounded-[1.75rem] border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-300">
          <p className="font-medium mb-2">Instrucciones:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Haz clic en "Conectar YouTube" para autorizar el acceso</li>
            <li>Se abrirá una ventana de Google para iniciar sesión</li>
            <li>Otorga los permisos necesarios para la verificación</li>
            <li>Una vez conectado, podrás verificar tus acciones</li>
          </ol>
        </div>
      )}

      {/* Limitations */}
      {action === 'like' && (
        <div className="rounded-[1.75rem] border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
          <p className="font-medium mb-2">Nota sobre likes:</p>
          <p className="text-xs">La verificación de likes no está soportada por la API de YouTube. Esta función devolverá "no soportada" por ahora.</p>
        </div>
      )}
    </div>
  );
};