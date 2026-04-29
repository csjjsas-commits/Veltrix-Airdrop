import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { ToastProvider } from '../ui/ToastProvider';
import { API_BASE, verifyTask } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface TwitterVerificationProps {
  taskId: string;
  onVerificationComplete?: (success: boolean, data?: any) => void;
  targetUsername?: string;
  tweetId?: string;
  action: 'follow' | 'like' | 'retweet' | 'connect';
  targetId: string; // username for follow, tweet ID for like/retweet
}

export const TwitterVerification: React.FC<TwitterVerificationProps> = ({
  taskId,
  onVerificationComplete,
  targetUsername,
  tweetId,
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
    checkTwitterConnection();
  }, []);

  const checkTwitterConnection = async () => {
    try {
      if (!token) {
        setConnectionStatus('No autenticado. Por favor inicia sesión.');
        return;
      }

      const response = await fetch(`${API_BASE}/twitter/status`, {
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
      setConnectionStatus(data.connected ? `Conectado como @${data.username}` : null);
    } catch (error: any) {
      console.error('Error checking Twitter connection:', error);
      setConnectionStatus(`Error: ${error?.message || 'Error verificando conexión'}`);
    }
  };

  const connectTwitter = async () => {
    setIsConnecting(true);
    setConnectionStatus(null);
    try {
      if (!token) {
        setConnectionStatus('No autenticado. Por favor inicia sesión.');
        setIsConnecting(false);
        return;
      }

      const response = await fetch(`${API_BASE}/twitter/auth-url`, {
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
          'twitter-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!authWindow) {
          setConnectionStatus('Error: No se pudo abrir la ventana de autenticación. Verifica que los popups no estén bloqueados.');
          setIsConnecting(false);
          return;
        }

        // Poll for completion
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            checkTwitterConnection();
            setIsConnecting(false);
          }
        }, 1000);

        // Also check status periodically
        const checkStatus = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${API_BASE}/twitter/status`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!statusResponse.ok) {
              if (statusResponse.status === 401) {
                setConnectionStatus('Sesión expirada. Por favor inicia sesión nuevamente.');
                clearInterval(checkStatus);
                clearInterval(checkClosed);
                setIsConnecting(false);
                authWindow?.close();
                return;
              }
              return; // Continue polling on other errors
            }

            const statusData = await statusResponse.json();
            if (statusData.connected) {
              clearInterval(checkStatus);
              clearInterval(checkClosed);
              setIsConnected(true);
              setConnectionStatus(`Conectado como @${statusData.username}`);
              setIsConnecting(false);
              authWindow?.close();
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
          authWindow?.close();
        }, 300000);
      } else {
        setConnectionStatus(`Error: ${data.error || 'No se pudo obtener la URL de autenticación'}`);
        setIsConnecting(false);
      }
    } catch (error: any) {
      console.error('Error getting auth URL:', error);
      setConnectionStatus(`Error: ${error?.message || 'Error conectando con Twitter'}`);
      setIsConnecting(false);
    }
  };

  const disconnectTwitter = async () => {
    try {
      if (!token) {
        setConnectionStatus('No autenticado. Por favor inicia sesión.');
        return;
      }

      const response = await fetch(`${API_BASE}/twitter/disconnect`, {
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
      console.error('Error disconnecting Twitter:', error);
      setConnectionStatus(`Error: ${error?.message || 'Error desconectando Twitter'}`);
    }
  };

  const verifyAction = async () => {
    // For connect action, verify immediately after OAuth
    if (action === 'connect') {
      if (!isConnected) {
        setVerificationStatus('Por favor, conecta tu cuenta de X (Twitter) primero.');
        return;
      }
      // Proceed with verification
    } else {
      // For other actions (follow, like, retweet), must be connected first
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
      case 'follow':
        return `Seguir a @${targetUsername || targetId}`;
      case 'like':
        return 'Dar like al tweet especificado';
      case 'retweet':
        return 'Retuitear el tweet especificado';
      case 'connect':
        return 'Conectar tu cuenta de X (Twitter)';
      default:
        return 'Realizar acción en Twitter';
    }
  };

  const getActionButtonText = () => {
    switch (action) {
      case 'follow':
        return 'Verificar Seguimiento';
      case 'like':
        return 'Verificar Like';
      case 'retweet':
        return 'Verificar Retweet';
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
              onClick={disconnectTwitter}
              className="rounded-3xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-red-400 hover:text-red-300"
            >
              Desconectar
            </button>
          ) : (
            <button
              onClick={connectTwitter}
              disabled={isConnecting}
              className="rounded-3xl bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConnecting ? 'Conectando...' : 'Conectar X (Twitter)'}
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
        {action === 'follow' && targetUsername && (
          <p className="text-xs text-slate-500">
            Usuario: @{targetUsername}
          </p>
        )}
        {(action === 'like' || action === 'retweet') && tweetId && (
          <p className="text-xs text-slate-500">
            ID del tweet: {tweetId}
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
            <li>Haz clic en "Conectar X (Twitter)" para autorizar el acceso</li>
            <li>Se abrirá una ventana de X para iniciar sesión</li>
            <li>Otorga los permisos necesarios para la verificación</li>
            <li>Una vez conectado, podrás verificar tus acciones</li>
          </ol>
        </div>
      )}

      {/* Limitations */}
      {action === 'retweet' && (
        <div className="rounded-[1.75rem] border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
          <p className="font-medium mb-2">Nota sobre retweets:</p>
          <p className="text-xs">La verificación de retweets no está soportada por la API de X (Twitter) v2. Esta función devolverá "no soportada" por ahora.</p>
        </div>
      )}
    </div>
  );
};