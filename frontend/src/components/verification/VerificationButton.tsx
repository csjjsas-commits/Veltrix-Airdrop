import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { TelegramVerification } from './TelegramVerification';
import { TwitterVerification } from './TwitterVerification';
import { verifyTask, submitTaskForReview } from '../../services/api';

interface VerificationButtonProps {
  taskId: string;
  verificationType: string;
  verificationData?: any;
  onVerificationComplete: (result: any) => void;
  disabled?: boolean;
  linkOpened?: boolean;
  hasActionUrl?: boolean;
  userHandle?: string;
}

export const VerificationButton: React.FC<VerificationButtonProps> = ({
  taskId,
  verificationType,
  verificationData,
  onVerificationComplete,
  disabled = false,
  linkOpened = true,
  hasActionUrl = false,
  userHandle
}) => {
  const { token } = useAuth();

  // Use specialized component for Telegram verification
  if (verificationType.startsWith('TELEGRAM_')) {
    return (
      <TelegramVerification
        taskId={taskId}
        verificationType={verificationType}
        verificationData={verificationData}
        onVerificationComplete={onVerificationComplete}
        disabled={disabled}
      />
    );
  }

  // Use specialized component for Twitter verification
  if (verificationType.startsWith('TWITTER_')) {
    const action = verificationType === 'TWITTER_CONNECT' ? 'connect' :
                   verificationType === 'TWITTER_FOLLOW' ? 'follow' :
                   verificationType === 'TWITTER_LIKE' ? 'like' : 'retweet';
    return (
      <TwitterVerification
        taskId={taskId}
        action={action}
        targetId={verificationData?.targetId || verificationData?.username || verificationData?.tweetId}
        targetUsername={verificationData?.username}
        tweetId={verificationData?.tweetId}
        onVerificationComplete={(success, data) => {
          onVerificationComplete({
            verified: success,
            taskCompleted: success,
            message: success ? 'Verificación exitosa' : 'Verificación fallida',
            ...data
          });
        }}
      />
    );
  }

  const [isVerifying, setIsVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleVerification = async () => {
    setIsVerifying(true);
    try {
      if (!token) {
        setLastResult({ success: false, message: 'No autenticado' });
        return;
      }

      const verificationPayload = getVerificationData();
      const result = await submitTaskForReview(token, taskId, JSON.stringify(verificationPayload), `Verificación automática para ${verificationType}`);
      const normalizedResult = {
        verified: true,
        taskCompleted: true,
        message: 'Tarea enviada para revisión por el administrador',
        ...result
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
    const baseData = {
      userHandle: userHandle || undefined,
      linkOpened: hasActionUrl ? linkOpened : undefined
    };

    switch (verificationType) {
      case 'TWITTER_FOLLOW':
        return {
          action: 'follow',
          targetId: verificationData?.targetUserId,
          username: userHandle,
          ...baseData
        };
      case 'TWITTER_LIKE':
        return {
          action: 'like',
          tweetId: verificationData?.tweetId,
          username: userHandle,
          ...baseData
        };
      case 'TWITTER_RETWEET':
        return {
          action: 'retweet',
          tweetId: verificationData?.tweetId,
          username: userHandle,
          ...baseData
        };
      case 'DISCORD_JOIN':
        return {
          action: 'join_server',
          serverId: verificationData?.serverId
        };
      case 'DISCORD_ROLE':
        return {
          action: 'has_role',
          serverId: verificationData?.serverId,
          roleId: verificationData?.roleId
        };
      case 'TELEGRAM_JOIN_CHANNEL':
        return {
          action: 'join_channel',
          chatId: verificationData?.channelId,
          userTelegramId: userHandle,
          ...baseData
        };
      case 'TELEGRAM_JOIN_GROUP':
        return {
          action: 'join_group',
          chatId: verificationData?.groupId,
          userTelegramId: userHandle,
          ...baseData
        };
      case 'TELEGRAM_BOT_VERIFY':
        return {
          action: 'bot_verify',
          userTelegramId: userHandle,
          ...baseData
        };
      case 'WALLET_CONNECT':
        return {
          action: 'connect',
          walletAddress: userHandle,
          ...baseData
        };
      case 'WALLET_HOLD_TOKEN':
        return {
          action: 'hold_token',
          contractAddress: verificationData?.contractAddress,
          amount: verificationData?.amount,
          walletAddress: userHandle,
          ...baseData
        };
      case 'WALLET_NFT_OWNERSHIP':
        return {
          action: 'nft_ownership',
          contractAddress: verificationData?.contractAddress,
          tokenId: verificationData?.tokenId,
          walletAddress: userHandle,
          ...baseData
        };
      case 'WALLET_TRANSACTION':
        return {
          action: 'transaction',
          txHash: userHandle,
          ...baseData
        };
      default:
        return baseData;
    }
  };

  const getButtonText = () => {
    if (isVerifying) return 'Enviando...';

    switch (verificationType) {
      case 'TWITTER_FOLLOW': return 'Enviar seguimiento';
      case 'TWITTER_LIKE': return 'Enviar like';
      case 'TWITTER_RETWEET': return 'Enviar retweet';
      case 'DISCORD_JOIN': return 'Enviar unión';
      case 'DISCORD_ROLE': return 'Enviar rol';
      case 'TELEGRAM_JOIN_CHANNEL': return 'Enviar canal';
      case 'TELEGRAM_JOIN_GROUP': return 'Enviar grupo';
      case 'TELEGRAM_BOT_VERIFY': return 'Enviar verificación';
      case 'WALLET_CONNECT': return 'Enviar wallet';
      case 'WALLET_HOLD_TOKEN': return 'Enviar tokens';
      case 'WALLET_NFT_OWNERSHIP': return 'Enviar NFT';
      case 'WALLET_TRANSACTION': return 'Enviar transacción';
      default: return 'Enviar para revisión';
    }
  };

  const getButtonColor = () => {
    switch (verificationType) {
      case 'TWITTER_FOLLOW':
      case 'TWITTER_LIKE':
      case 'TWITTER_RETWEET':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'DISCORD_JOIN':
      case 'DISCORD_ROLE':
        return 'bg-indigo-500 hover:bg-indigo-600';
      case 'TELEGRAM_JOIN_CHANNEL':
      case 'TELEGRAM_JOIN_GROUP':
      case 'TELEGRAM_BOT_VERIFY':
        return 'bg-cyan-500 hover:bg-cyan-600';
      case 'WALLET_CONNECT':
      case 'WALLET_HOLD_TOKEN':
      case 'WALLET_NFT_OWNERSHIP':
      case 'WALLET_TRANSACTION':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-green-500 hover:bg-green-600';
    }
  };

  const isLinkRequired = hasActionUrl && !linkOpened;
  const isHandleRequired = !userHandle?.trim();
  const isButtonDisabled = disabled || isVerifying || isLinkRequired || isHandleRequired;

  return (
    <div className="space-y-2">
      <Button
        onClick={handleVerification}
        disabled={isButtonDisabled}
        className={`${getButtonColor()} text-white px-4 py-2 rounded-lg disabled:opacity-50`}
      >
        {getButtonText()}
      </Button>

      {isLinkRequired && (
        <p className="text-sm text-yellow-300">Abre el link antes de verificar.</p>
      )}
      {!isLinkRequired && isHandleRequired && (
        <p className="text-sm text-yellow-300">Ingresa tu usuario para habilitar el botón.</p>
      )}

      {lastResult && (
        <div className={`text-sm p-2 rounded ${
          lastResult.success
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {lastResult.message}
        </div>
      )}
    </div>
  );
};