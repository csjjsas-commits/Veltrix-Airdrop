import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface TelegramTaskData {
  channelId?: string;
  channelUrl?: string;
  groupId?: string;
  groupUrl?: string;
  botUsername?: string;
  botUrl?: string;
}

interface YouTubeTaskData {
  channelId?: string;
  channelTitle?: string;
  videoId?: string;
  videoTitle?: string;
}

interface AdminTaskFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export const AdminTaskForm: React.FC<AdminTaskFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    points: initialData?.points || 100,
    verificationType: initialData?.verificationType || 'TELEGRAM_JOIN_CHANNEL',
    // Telegram fields
    channelId: initialData?.verificationData?.channelId || '',
    channelUrl: initialData?.verificationData?.channelUrl || '',
    groupId: initialData?.verificationData?.groupId || '',
    groupUrl: initialData?.verificationData?.groupUrl || '',
    botUsername: initialData?.verificationData?.botUsername || '',
    botUrl: initialData?.verificationData?.botUrl || '',
    // YouTube fields
    youtubeChannelId: initialData?.verificationData?.channelId || '',
    youtubeChannelTitle: initialData?.verificationData?.channelTitle || '',
    youtubeVideoId: initialData?.verificationData?.videoId || '',
    youtubeVideoTitle: initialData?.verificationData?.videoTitle || '',
    // Twitter fields
    twitterUsername: initialData?.verificationData?.username || '',
    twitterTweetId: initialData?.verificationData?.tweetId || '',
    // Wallet fields
    walletContractAddress: initialData?.verificationData?.contractAddress || '',
    walletTokenAmount: initialData?.verificationData?.amount || '',
    walletTokenId: initialData?.verificationData?.tokenId || '',
    // Referral fields
    referralTarget: initialData?.referralTarget || '5',
    active: initialData?.active ?? true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let verificationData = {};

      switch (formData.verificationType) {
        case 'TELEGRAM_JOIN_CHANNEL':
          verificationData = {
            channelId: formData.channelId,
            channelUrl: formData.channelUrl
          };
          break;
        case 'TELEGRAM_JOIN_GROUP':
          verificationData = {
            groupId: formData.groupId,
            groupUrl: formData.groupUrl
          };
          break;
        case 'TELEGRAM_BOT_VERIFY':
          verificationData = {
            botUsername: formData.botUsername,
            botUrl: formData.botUrl
          };
          break;
        case 'YOUTUBE_SUBSCRIBE':
          verificationData = {
            action: 'subscribe',
            targetId: formData.youtubeChannelId,
            channelId: formData.youtubeChannelId,
            channelTitle: formData.youtubeChannelTitle
          };
          break;
        case 'YOUTUBE_LIKE':
          verificationData = {
            action: 'like',
            targetId: formData.youtubeVideoId,
            videoId: formData.youtubeVideoId,
            videoTitle: formData.youtubeVideoTitle
          };
          break;
        case 'TWITTER_FOLLOW':
          verificationData = {
            action: 'follow',
            targetId: formData.twitterUsername,
            username: formData.twitterUsername
          };
          break;
        case 'TWITTER_LIKE':
          verificationData = {
            action: 'like',
            targetId: formData.twitterTweetId,
            tweetId: formData.twitterTweetId
          };
          break;
        case 'TWITTER_RETWEET':
          verificationData = {
            action: 'retweet',
            targetId: formData.twitterTweetId,
            tweetId: formData.twitterTweetId
          };
          break;
        case 'WALLET_CONNECT':
          verificationData = {
            action: 'connect'
          };
          break;
        case 'WALLET_HOLD_TOKEN':
          verificationData = {
            action: 'hold_token',
            contractAddress: formData.walletContractAddress,
            amount: formData.walletTokenAmount
          };
          break;
        case 'WALLET_NFT_OWNERSHIP':
          verificationData = {
            action: 'nft_ownership',
            contractAddress: formData.walletContractAddress,
            tokenId: formData.walletTokenId
          };
          break;
        case 'WALLET_TRANSACTION':
          verificationData = {
            action: 'transaction'
          };
          break;
        case 'REFERRAL_INVITE':
          verificationData = {};
          break;
      }

      const taskData = {
        title: formData.title,
        description: formData.description,
        points: formData.points,
        verificationType: formData.verificationType,
        verificationData,
        ...(formData.verificationType === 'REFERRAL_INVITE' && { referralTarget: formData.referralTarget }),
        taskType: 'AUTO_COMPLETE',
        verificationMethod: 'SYSTEM_AUTOMATIC',
        platform: formData.verificationType.startsWith('YOUTUBE_') ? 'youtube' :
                 formData.verificationType.startsWith('TWITTER_') ? 'twitter' :
                 formData.verificationType.startsWith('WALLET_') ? 'wallet' :
                 formData.verificationType === 'REFERRAL_INVITE' ? 'referral' : 'telegram',
        active: formData.active
      };

      await onSubmit(taskData);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-brand-graphite/95 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-brand-pureWhite mb-6">
          {initialData ? 'Editar Tarea' : 'Crear Tarea'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-brand-softGray mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-brand-softGray mb-2">
                Puntos *
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => updateFormData('points', Number(e.target.value))}
                min={1}
                className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-brand-softGray mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
            />
          </div>

          {/* Verification Type */}
          <div>
            <label className="block text-sm text-brand-softGray mb-2">
              Tipo de Verificación *
            </label>
            <select
              value={formData.verificationType}
              onChange={(e) => updateFormData('verificationType', e.target.value)}
              className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
            >
              <optgroup label="Telegram">
                <option value="TELEGRAM_JOIN_CHANNEL">Unirse a Canal</option>
                <option value="TELEGRAM_JOIN_GROUP">Unirse a Grupo</option>
                <option value="TELEGRAM_BOT_VERIFY">Verificar con Bot</option>
              </optgroup>
              <optgroup label="YouTube">
                <option value="YOUTUBE_SUBSCRIBE">Suscribirse a Canal</option>
                <option value="YOUTUBE_LIKE">Dar Like a Video</option>
              </optgroup>
              <optgroup label="X (Twitter)">
                <option value="TWITTER_FOLLOW">Seguir Cuenta</option>
                <option value="TWITTER_LIKE">Dar Like a Post</option>
                <option value="TWITTER_RETWEET">Retuitear Post</option>
              </optgroup>
              <optgroup label="Wallet">
                <option value="WALLET_CONNECT">Conectar Wallet</option>
                <option value="WALLET_HOLD_TOKEN">Mantener Token</option>
                <option value="WALLET_NFT_OWNERSHIP">Poseer NFT</option>
                <option value="WALLET_TRANSACTION">Realizar Transacción</option>
              </optgroup>
              <optgroup label="Referral">
                <option value="REFERRAL_INVITE">Invitar Amigos</option>
              </optgroup>
            </select>
          </div>

          {/* Telegram Configuration */}
          {formData.verificationType === 'TELEGRAM_JOIN_CHANNEL' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-brand-pureWhite">Configuración del Canal</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    ID del Canal *
                  </label>
                  <input
                    type="text"
                    value={formData.channelId}
                    onChange={(e) => updateFormData('channelId', e.target.value)}
                    placeholder="@channelname o -1001234567890"
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    URL del Canal
                  </label>
                  <input
                    type="url"
                    value={formData.channelUrl}
                    onChange={(e) => updateFormData('channelUrl', e.target.value)}
                    placeholder="https://t.me/channelname"
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.verificationType === 'TELEGRAM_JOIN_GROUP' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-brand-pureWhite">Configuración del Grupo</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    ID del Grupo *
                  </label>
                  <input
                    type="text"
                    value={formData.groupId}
                    onChange={(e) => updateFormData('groupId', e.target.value)}
                    placeholder="@groupname o -1001234567890"
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    URL del Grupo
                  </label>
                  <input
                    type="url"
                    value={formData.groupUrl}
                    onChange={(e) => updateFormData('groupUrl', e.target.value)}
                    placeholder="https://t.me/groupname"
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.verificationType === 'TELEGRAM_BOT_VERIFY' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-brand-pureWhite">Configuración del Bot</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    Username del Bot *
                  </label>
                  <input
                    type="text"
                    value={formData.botUsername}
                    onChange={(e) => updateFormData('botUsername', e.target.value)}
                    placeholder="botusername"
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    URL del Bot
                  </label>
                  <input
                    type="url"
                    value={formData.botUrl}
                    onChange={(e) => updateFormData('botUrl', e.target.value)}
                    placeholder="https://t.me/botusername"
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                  />
                </div>
              </div>
            </div>
          )}

          {/* YouTube Configuration */}
          {formData.verificationType === 'YOUTUBE_SUBSCRIBE' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-brand-pureWhite">Configuración del Canal de YouTube</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    ID del Canal *
                  </label>
                  <input
                    type="text"
                    value={formData.youtubeChannelId}
                    onChange={(e) => updateFormData('youtubeChannelId', e.target.value)}
                    placeholder="UC1234567890abcdef"
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    Título del Canal
                  </label>
                  <input
                    type="text"
                    value={formData.youtubeChannelTitle}
                    onChange={(e) => updateFormData('youtubeChannelTitle', e.target.value)}
                    placeholder="Nombre del Canal"
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.verificationType === 'YOUTUBE_LIKE' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-brand-pureWhite">Configuración del Video de YouTube</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    ID del Video *
                  </label>
                  <input
                    type="text"
                    value={formData.youtubeVideoId}
                    onChange={(e) => updateFormData('youtubeVideoId', e.target.value)}
                    placeholder="dQw4w9WgXcQ"
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    Título del Video
                  </label>
                  <input
                    type="text"
                    value={formData.youtubeVideoTitle}
                    onChange={(e) => updateFormData('youtubeVideoTitle', e.target.value)}
                    placeholder="Título del Video"
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                  />
                </div>
              </div>
              <div className="p-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md text-sm">
                <p className="font-medium mb-1">Nota:</p>
                <p>La verificación de likes de YouTube no está soportada por la API de YouTube. Los usuarios recibirán un mensaje indicando que esta función no está disponible.</p>
              </div>
            </div>
          )}

          {/* Twitter Configuration */}
          {formData.verificationType === 'TWITTER_FOLLOW' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-brand-pureWhite">Configuración de Cuenta de X (Twitter)</h3>
              <div>
                <label className="block text-sm text-brand-softGray mb-2">
                  Username de la cuenta *
                </label>
                <input
                  type="text"
                  value={formData.twitterUsername}
                  onChange={(e) => updateFormData('twitterUsername', e.target.value)}
                  placeholder="elonmusk (sin @)"
                  className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                  required
                />
              </div>
            </div>
          )}

          {(formData.verificationType === 'TWITTER_LIKE' || formData.verificationType === 'TWITTER_RETWEET') && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-brand-pureWhite">Configuración del Post de X (Twitter)</h3>
              <div>
                <label className="block text-sm text-brand-softGray mb-2">
                  ID del Tweet *
                </label>
                <input
                  type="text"
                  value={formData.twitterTweetId}
                  onChange={(e) => updateFormData('twitterTweetId', e.target.value)}
                  placeholder="1234567890123456789"
                  className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                  required
                />
                <p className="text-xs text-brand-softGray mt-1">
                  Puedes obtener el ID del tweet desde la URL: https://twitter.com/username/status/<strong>ID_DEL_TWEET</strong>
                </p>
              </div>
              {formData.verificationType === 'TWITTER_RETWEET' && (
                <div className="p-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md text-sm">
                  <p className="font-medium mb-1">Nota sobre retweets:</p>
                  <p>La verificación de retweets no está soportada por la API de X (Twitter) v2. Los usuarios recibirán un mensaje indicando que esta función no está disponible.</p>
                </div>
              )}
            </div>
          )}

          {formData.verificationType === 'WALLET_CONNECT' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-brand-pureWhite">Configuración de Wallet</h3>
              <p className="text-sm text-brand-softGray">
                Los usuarios deben conectar una wallet Ethereum y firmar un mensaje para verificar propiedad.
              </p>
            </div>
          )}

          {formData.verificationType === 'WALLET_HOLD_TOKEN' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-brand-pureWhite">Verificación de Token ERC20</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    Dirección del Contrato *
                  </label>
                  <input
                    type="text"
                    value={formData.walletContractAddress}
                    onChange={(e) => updateFormData('walletContractAddress', e.target.value)}
                    placeholder="0x..."
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    Cantidad Requerida *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.walletTokenAmount}
                    onChange={(e) => updateFormData('walletTokenAmount', e.target.value)}
                    placeholder="100"
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {formData.verificationType === 'WALLET_NFT_OWNERSHIP' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-brand-pureWhite">Verificación de NFT ERC721</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    Dirección del Contrato *
                  </label>
                  <input
                    type="text"
                    value={formData.walletContractAddress}
                    onChange={(e) => updateFormData('walletContractAddress', e.target.value)}
                    placeholder="0x..."
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-brand-softGray mb-2">
                    Token ID *
                  </label>
                  <input
                    type="text"
                    value={formData.walletTokenId}
                    onChange={(e) => updateFormData('walletTokenId', e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {formData.verificationType === 'WALLET_TRANSACTION' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-brand-pureWhite">Verificación de Transacción</h3>
              <p className="text-sm text-brand-softGray">
                Los usuarios deben proporcionar el hash de una transacción en la que sean el remitente o destinatario.
              </p>
            </div>
          )}

          {formData.verificationType === 'REFERRAL_INVITE' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-brand-pureWhite">Configuración de Referral</h3>
              <div>
                <label className="block text-sm text-brand-softGray mb-2">
                  Referrals Requeridos *
                </label>
                <input
                  type="number"
                  value={formData.referralTarget}
                  onChange={(e) => updateFormData('referralTarget', e.target.value)}
                  min={1}
                  placeholder="5"
                  className="w-full rounded-2xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
                  required
                />
                <p className="text-xs text-brand-softGray mt-2">
                  El usuario debe invitar a este número de personas que completen al menos 1 tarea cada una. La tarea se completará automáticamente cuando se alcance el número requerido.
                </p>
              </div>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => updateFormData('active', e.target.checked)}
              className="rounded border-brand-graphite/70 bg-brand-blackVoid/80 text-brand-neonCyan focus:ring-brand-neonCyan"
            />
            <label htmlFor="active" className="text-sm text-brand-softGray">
              Tarea activa
            </label>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear Tarea')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};