import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { TelegramVerification } from './TelegramVerification';
import { YouTubeVerification } from './YouTubeVerification';
import { TwitterVerification } from './TwitterVerification';
import { verifyTask } from '../../services/api';

interface VerificationButtonProps {
  taskId: string;
  verificationType: string;
  verificationData?: any;
  onVerificationComplete: (result: any) => void;
  disabled?: boolean;
}

export const VerificationButton: React.FC<VerificationButtonProps> = ({
  taskId,
  verificationType,
  verificationData,
  onVerificationComplete,
  disabled = false
}) => {
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

  // Use specialized component for YouTube verification
  if (verificationType.startsWith('YOUTUBE_')) {
    return (
      <YouTubeVerification
        action={verificationType === 'YOUTUBE_SUBSCRIBE' ? 'subscribe' : 'like'}
        targetId={verificationData?.targetId || verificationData?.channelId || verificationData?.videoId}
        channelId={verificationData?.channelId}
        channelTitle={verificationData?.channelTitle}
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

  // Use specialized component for Twitter verification
  if (verificationType.startsWith('TWITTER_')) {
    const action = verificationType === 'TWITTER_FOLLOW' ? 'follow' :
                   verificationType === 'TWITTER_LIKE' ? 'like' : 'retweet';
    return (
      <TwitterVerification
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
      const token = localStorage.getItem('token');
      if (!token) {
        setLastResult({ success: false, message: 'No autenticado' });
        return;
      }

      const result = await verifyTask(token, taskId, getVerificationData());

      setLastResult(result);
      onVerificationComplete(result);
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
      case 'TWITTER_FOLLOW':
        return {
          action: 'follow',
          targetId: verificationData?.targetUserId,
          username: prompt('Ingresa tu username de Twitter (sin @):')
        };
      case 'TWITTER_LIKE':
        return {
          action: 'like',
          tweetId: verificationData?.tweetId,
          username: prompt('Ingresa tu username de Twitter (sin @):')
        };
      case 'TWITTER_RETWEET':
        return {
          action: 'retweet',
          tweetId: verificationData?.tweetId,
          username: prompt('Ingresa tu username de Twitter (sin @):')
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
          userTelegramId: prompt('Ingresa tu ID de usuario de Telegram:')
        };
      case 'TELEGRAM_JOIN_GROUP':
        return {
          action: 'join_group',
          chatId: verificationData?.groupId,
          userTelegramId: prompt('Ingresa tu ID de usuario de Telegram:')
        };
      case 'TELEGRAM_BOT_VERIFY':
        return {
          action: 'bot_verify',
          userTelegramId: prompt('Ingresa tu ID de usuario de Telegram:')
        };
      case 'WALLET_CONNECT':
        return {
          action: 'connect',
          walletAddress: prompt('Ingresa tu dirección de wallet Ethereum:')
        };
      case 'WALLET_HOLD_TOKEN':
        return {
          action: 'hold_token',
          contractAddress: verificationData?.contractAddress,
          amount: verificationData?.amount,
          walletAddress: prompt('Ingresa tu dirección de wallet Ethereum:')
        };
      case 'WALLET_NFT_OWNERSHIP':
        return {
          action: 'nft_ownership',
          contractAddress: verificationData?.contractAddress,
          tokenId: verificationData?.tokenId,
          walletAddress: prompt('Ingresa tu dirección de wallet Ethereum:')
        };
      case 'WALLET_TRANSACTION':
        return {
          action: 'transaction',
          txHash: prompt('Ingresa el hash de tu transacción:'),
          walletAddress: prompt('Ingresa tu dirección de wallet Ethereum:')
        };
      default:
        return {};
    }
  };

  const getButtonText = () => {
    if (isVerifying) return 'Verificando...';

    switch (verificationType) {
      case 'TWITTER_FOLLOW': return 'Seguir en Twitter';
      case 'TWITTER_LIKE': return 'Dar Like';
      case 'TWITTER_RETWEET': return 'Retuitear';
      case 'DISCORD_JOIN': return 'Unirse a Discord';
      case 'DISCORD_ROLE': return 'Verificar Rol';
      case 'TELEGRAM_JOIN_CHANNEL': return 'Unirse al Canal';
      case 'TELEGRAM_JOIN_GROUP': return 'Unirse al Grupo';
      case 'TELEGRAM_BOT_VERIFY': return 'Verificar con Bot';
      case 'WALLET_CONNECT': return 'Conectar Wallet';
      case 'WALLET_HOLD_TOKEN': return 'Verificar Tokens';
      case 'WALLET_NFT_OWNERSHIP': return 'Verificar NFT';
      case 'WALLET_TRANSACTION': return 'Verificar Transacción';
      default: return 'Verificar';
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

  return (
    <div className="space-y-2">
      <Button
        onClick={handleVerification}
        disabled={disabled || isVerifying}
        className={`${getButtonColor()} text-white px-4 py-2 rounded-lg disabled:opacity-50`}
      >
        {getButtonText()}
      </Button>

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