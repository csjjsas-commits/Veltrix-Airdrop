import React, { useState } from 'react';
import { Button } from '../ui/Button';
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

  const handleVerify = async () => {
    if (!userTelegramId.trim()) {
      setLastResult({ success: false, message: 'Ingresa tu ID de usuario de Telegram' });
      return;
    }

    setIsVerifying(true);
    try {
      const token = localStorage.getItem('token');
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
      <div className="text-center">
        <h3 className="text-lg font-semibold text-brand-pureWhite mb-2">
          {getTitle()}
        </h3>
        <p className="text-sm text-brand-softGray mb-4">
          {getDescription()}
        </p>
      </div>

      {/* Telegram ID Input */}
      <div className="space-y-2">
        <label className="block text-sm text-brand-softGray">
          Tu ID de Usuario de Telegram *
        </label>
        <input
          type="text"
          value={userTelegramId}
          onChange={(e) => setUserTelegramId(e.target.value)}
          placeholder="Ej: 123456789"
          className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
          disabled={disabled}
        />
        <p className="text-xs text-brand-softGray">
          Para obtener tu ID: En Telegram, escribe <code className="bg-brand-graphite/50 px-1 rounded">@userinfobot</code> y envíale /start
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {step === 'join' && (
          <Button
            onClick={handleJoin}
            disabled={disabled}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            🔗 Unirse a {verificationType === 'TELEGRAM_JOIN_CHANNEL' ? 'Canal' : verificationType === 'TELEGRAM_JOIN_GROUP' ? 'Grupo' : 'Bot'}
          </Button>
        )}

        <Button
          onClick={handleVerify}
          disabled={disabled || isVerifying || !userTelegramId.trim()}
          className="w-full"
        >
          {isVerifying ? 'Verificando...' : '✅ Verificar Membresía'}
        </Button>
      </div>

      {/* Result Message */}
      {lastResult && (
        <div className={`p-3 rounded-2xl text-sm ${
          lastResult.success
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {lastResult.message}
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-brand-softGray space-y-1">
        <p><strong>Pasos:</strong></p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Haz clic en "Unirse" para abrir Telegram</li>
          <li>Únete al {verificationType === 'TELEGRAM_JOIN_CHANNEL' ? 'canal' : verificationType === 'TELEGRAM_JOIN_GROUP' ? 'grupo' : 'bot'}</li>
          <li>Ingresa tu ID de Telegram arriba</li>
          <li>Haz clic en "Verificar Membresía"</li>
        </ol>
      </div>
    </div>
  );
};