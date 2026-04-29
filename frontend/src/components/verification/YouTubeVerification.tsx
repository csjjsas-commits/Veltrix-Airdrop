import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { ToastProvider } from '../ui/ToastProvider';
import { API_BASE, verifyTask } from '../../services/api';

interface YouTubeVerificationProps {
  taskId: string;
  onVerificationComplete?: (success: boolean, data?: any) => void;
  channelId?: string;
  channelTitle?: string;
  action: 'subscribe' | 'like';
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
      const response = await fetch(`${API_BASE}/youtube/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setIsConnected(data.connected);
      setConnectionStatus(data.connected ? `Conectado como ${data.channelTitle}` : null);
    } catch (error) {
      console.error('Error checking YouTube connection:', error);
    }
  };

  const connectYouTube = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(`${API_BASE}/youtube/auth-url`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();

      if (data.authUrl) {
        // Open OAuth URL in new window
        const authWindow = window.open(
          data.authUrl,
          'youtube-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Poll for completion
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            checkYouTubeConnection();
            setIsConnecting(false);
          }
        }, 1000);

        // Also check status periodically
        const checkStatus = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${API_BASE}/youtube/status`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const statusData = await statusResponse.json();
            if (statusData.connected) {
              clearInterval(checkStatus);
              clearInterval(checkClosed);
              setIsConnected(true);
              setConnectionStatus(`Conectado como ${statusData.channelTitle}`);
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
      }
    } catch (error) {
      console.error('Error getting auth URL:', error);
      setIsConnecting(false);
    }
  };

  const disconnectYouTube = async () => {
    try {
      await fetch(`${API_BASE}/youtube/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setIsConnected(false);
      setConnectionStatus(null);
    } catch (error) {
      console.error('Error disconnecting YouTube:', error);
    }
  };

  const verifyAction = async () => {
    if (!isConnected) return;

    setIsVerifying(true);
    setVerificationStatus(null);

    try {
      const token = localStorage.getItem('token');
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
      default:
        return 'Verificar';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Verificación de YouTube</h3>

        {/* Connection Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Estado de conexión: {isConnected ? 'Conectado' : 'No conectado'}
            </span>
            {isConnected ? (
              <Button
                onClick={disconnectYouTube}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 text-sm"
              >
                Desconectar
              </Button>
            ) : (
              <Button
                onClick={connectYouTube}
                disabled={isConnecting}
                className="px-3 py-1 text-sm"
              >
                {isConnecting ? 'Conectando...' : 'Conectar YouTube'}
              </Button>
            )}
          </div>
          {connectionStatus && (
            <p className="text-sm text-gray-600 mt-1">{connectionStatus}</p>
          )}
        </div>

        {/* Action Description */}
        <div className="mb-4">
          <p className="text-sm text-gray-700">
            Acción requerida: {getActionText()}
          </p>
          {action === 'subscribe' && channelId && (
            <p className="text-xs text-gray-500 mt-1">
              ID del canal: {channelId}
            </p>
          )}
          {action === 'like' && targetId && (
            <p className="text-xs text-gray-500 mt-1">
              ID del video: {targetId}
            </p>
          )}
        </div>

        {/* Verification Button */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={verifyAction}
            disabled={!isConnected || isVerifying}
            className="flex-1"
          >
            {isVerifying ? 'Verificando...' : getActionButtonText()}
          </Button>
        </div>

        {/* Status Messages */}
        {verificationStatus && (
          <div className={`mt-4 p-3 rounded-md text-sm ${
            verificationStatus.includes('¡') || verificationStatus.includes('exitosa')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {verificationStatus}
          </div>
        )}

        {/* Instructions */}
        {!isConnected && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-sm">
            <p className="font-medium mb-1">Instrucciones:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Haz clic en "Conectar YouTube" para autorizar el acceso</li>
              <li>Se abrirá una ventana de Google para iniciar sesión</li>
              <li>Otorga los permisos necesarios para la verificación</li>
              <li>Una vez conectado, podrás verificar tus acciones</li>
            </ol>
          </div>
        )}

        {action === 'like' && (
          <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md text-sm">
            <p className="font-medium mb-1">Nota sobre likes:</p>
            <p>La verificación de likes no está soportada por la API de YouTube. Esta función devolverá "no soportada" por ahora.</p>
          </div>
        )}
      </div>
    </div>
  );
};