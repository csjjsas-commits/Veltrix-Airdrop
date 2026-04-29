import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { verifyTask } from '../../services/api';

interface TelegramVerificationProps {
  taskId: string;
  verificationType: string;
  verificationData?: any;
  onVerificationComplete: (result: any) => void;
  disabled?: boolean;
}

export const TelegramVerification: React.FC<TelegramVerificationProps> = ({
  taskId,
  verificationType,
  verificationData,
  onVerificationComplete,
  disabled = false
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [userTelegramId, setUserTelegramId] = useState('');
  const [step, setStep] = useState<'join' | 'verify'>('join');
  const [lastResult, setLastResult] = useState<any>(null);

  const handleJoin = () => {
    const url = getTelegramUrl();
    if (url) {
      window.open(url, '_blank');
      setStep('verify');
    }
  };

  const { token } = useAuth();

  const handleVerify = async () => {
    if (!userTelegramId.trim()) {
      setLastResult({ success: false, message: 'Ingresa tu ID de usuario de Telegram' });
      return;
    }

    setIsVerifying(true);
    try {
      if (!token) {
        setLastResult({ success: false, message: 'No autenticado' });
        return;
      }

      const result = await verifyTask(token, taskId, { verificationData: getVerificationData() });
      const normalizedResult = {
        ...result,
        success: !!(result?.verified || result?.taskCompleted),
        message: result?.message || (result?.verified || result?.taskCompleted ? 'Verificación exitosa' : 'Verificación fallida')
      };

      setLastResult(normalizedResult);
      onVerificationComplete(normalizedResult);
    } catch (error: any) {
      setLastResult({
        success: false,
        message: error.message || 'Error de conexión. Intenta de nuevo.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getVerificationData = () => {
    switch (verificationType) {
      case 'TELEGRAM_JOIN_CHANNEL':
        return {
          action: 'join_channel',
          chatId: verificationData?.channelId,
          userTelegramId: userTelegramId.trim()
        };
      case 'TELEGRAM_JOIN_GROUP':
        return {
          action: 'join_group',
          chatId: verificationData?.groupId,
          userTelegramId: userTelegramId.trim()
        };
      case 'TELEGRAM_BOT_VERIFY':
        return {
          action: 'bot_verify',
          userTelegramId: userTelegramId.trim()
        };
      default:
        return {};
    }
  };

  const getTelegramUrl = () => {
    switch (verificationType) {
      case 'TELEGRAM_JOIN_CHANNEL':
        return verificationData?.channelUrl || `https://t.me/${verificationData?.channelId?.replace('@', '')}`;
      case 'TELEGRAM_JOIN_GROUP':
        return verificationData?.groupUrl || `https://t.me/${verificationData?.groupId?.replace('@', '')}`;
      case 'TELEGRAM_BOT_VERIFY':
        return verificationData?.botUrl || `https://t.me/${verificationData?.botUsername}`;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (verificationType) {
      case 'TELEGRAM_JOIN_CHANNEL':
        return 'Unirse al Canal de Telegram';
      case 'TELEGRAM_JOIN_GROUP':
        return 'Unirse al Grupo de Telegram';
      case 'TELEGRAM_BOT_VERIFY':
        return 'Verificar con Bot de Telegram';
      default:
        return 'Verificación de Telegram';
    }
  };

  const getDescription = () => {
    switch (verificationType) {
      case 'TELEGRAM_JOIN_CHANNEL':
        return 'Únete al canal de Telegram y luego verifica tu membresía.';
      case 'TELEGRAM_JOIN_GROUP':
        return 'Únete al grupo de Telegram y luego verifica tu membresía.';
      case 'TELEGRAM_BOT_VERIFY':
        return 'Inicia una conversación con el bot y sigue las instrucciones.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Description */}
      <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/95 p-5">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400 mb-3">Acción requerida</p>
        <p className="text-sm text-slate-300 mb-2">
          {getDescription()}
        </p>
      </div>

      {/* Telegram ID Input */}
      <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/95 p-5">
        <label className="block text-sm text-slate-300 mb-2">
          Tu ID de Usuario de Telegram *
        </label>
        <input
          type="text"
          value={userTelegramId}
          onChange={(e) => setUserTelegramId(e.target.value)}
          placeholder="Ej: 123456789"
          className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          disabled={disabled}
        />
        <p className="text-xs text-slate-400 mt-2">
          Para obtener tu ID: En Telegram, escribe <code className="bg-slate-800 px-1 rounded">@userinfobot</code> y envíale /start
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {step === 'join' && (
          <button
            onClick={handleJoin}
            disabled={disabled}
            className="w-full rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🔗 Unirse a {verificationType === 'TELEGRAM_JOIN_CHANNEL' ? 'Canal' : verificationType === 'TELEGRAM_JOIN_GROUP' ? 'Grupo' : 'Bot'}
          </button>
        )}

        <button
          onClick={handleVerify}
          disabled={disabled || isVerifying || !userTelegramId.trim()}
          className="w-full rounded-3xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isVerifying ? 'Verificando...' : '✅ Verificar Membresía'}
        </button>
      </div>

      {/* Result Message */}
      {lastResult && (
        <div className={`rounded-[1.75rem] border p-4 text-sm ${
          lastResult.success
            ? 'border-green-500/30 bg-green-500/10 text-green-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          {lastResult.message}
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-[1.75rem] border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-300">
        <p className="font-medium mb-2">Pasos:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Haz clic en "Unirse" para abrir Telegram</li>
          <li>Únete al {verificationType === 'TELEGRAM_JOIN_CHANNEL' ? 'canal' : verificationType === 'TELEGRAM_JOIN_GROUP' ? 'grupo' : 'bot'}</li>
          <li>Ingresa tu ID de Telegram arriba</li>
          <li>Haz clic en "Verificar Membresía"</li>
        </ol>
      </div>
    </div>
  );
};