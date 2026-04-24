import { VerificationProvider, VerificationResult } from './types';

export class TelegramService implements VerificationProvider {
  private botToken: string;
  private apiUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async verify(
    userId: string,
    taskId: string,
    verificationData: any,
    userMetadata?: any
  ): Promise<VerificationResult> {
    const { action, chatId, userTelegramId } = verificationData;

    // If no real API keys, return unsupported so we do not fake verification.
    if (!this.botToken) {
      return {
        success: false,
        message: 'Telegram provider is not configured. Verification is unsupported.',
        unsupported: true
      };
    }

    try {
      switch (action) {
        case 'join_channel':
          return await this.verifyChannelJoin(userId, chatId, userTelegramId);
        case 'join_group':
          return await this.verifyGroupJoin(userId, chatId, userTelegramId);
        case 'bot_verify':
          return await this.verifyBotInteraction(userId, userTelegramId);
        default:
          return {
            success: false,
            message: 'Acción de Telegram no soportada'
          };
      }
    } catch (error) {
      console.error('Telegram verification error:', error);
      return {
        success: false,
        message: 'Error verificando Telegram. Intenta de nuevo.'
      };
    }
  }

  private async verifyChannelJoin(
    userId: string,
    channelId: string,
    userTelegramId?: string
  ): Promise<VerificationResult> {
    if (!userTelegramId) {
      return {
        success: false,
        message: 'Se requiere ID de usuario de Telegram'
      };
    }

    try {
      // Check if user is a member of the channel
      const response = await fetch(`${this.apiUrl}/getChatMember?chat_id=${channelId}&user_id=${userTelegramId}`);

      if (!response.ok) {
        return {
          success: false,
          message: 'Error verificando membresía del canal'
        };
      }

      const data = await response.json();

      if (!data.ok) {
        return {
          success: false,
          message: 'Error verificando membresía del canal'
        };
      }

      const member = data.result;
      const isMember = ['member', 'administrator', 'creator', 'restricted'].includes(member.status);

      if (isMember) {
        return {
          success: true,
          message: '¡Unión al canal verificada exitosamente!',
          externalId: userTelegramId,
          metadata: {
            joinedAt: new Date().toISOString(),
            channelId,
            memberStatus: member.status
          }
        };
      } else {
        return {
          success: false,
          message: 'No se detecta que eres miembro de este canal. Únete al canal y vuelve a verificar.'
        };
      }
    } catch (error) {
      console.error('Error checking channel membership:', error);
      return {
        success: false,
        message: 'Error verificando membresía del canal. Intenta de nuevo.'
      };
    }
  }

  private async verifyGroupJoin(
    userId: string,
    groupId: string,
    userTelegramId?: string
  ): Promise<VerificationResult> {
    if (!userTelegramId) {
      return {
        success: false,
        message: 'Se requiere ID de usuario de Telegram'
      };
    }

    try {
      // Check if user is a member of the group
      const response = await fetch(`${this.apiUrl}/getChatMember?chat_id=${groupId}&user_id=${userTelegramId}`);

      if (!response.ok) {
        return {
          success: false,
          message: 'Error verificando membresía del grupo'
        };
      }

      const data = await response.json();

      if (!data.ok) {
        return {
          success: false,
          message: 'Error verificando membresía del grupo'
        };
      }

      const member = data.result;
      const isMember = ['member', 'administrator', 'creator', 'restricted'].includes(member.status);

      if (isMember) {
        return {
          success: true,
          message: '¡Unión al grupo verificada exitosamente!',
          externalId: userTelegramId,
          metadata: {
            joinedAt: new Date().toISOString(),
            groupId,
            memberStatus: member.status
          }
        };
      } else {
        return {
          success: false,
          message: 'No se detecta que eres miembro de este grupo. Únete al grupo y vuelve a verificar.'
        };
      }
    } catch (error) {
      console.error('Error checking group membership:', error);
      return {
        success: false,
        message: 'Error verificando membresía del grupo. Intenta de nuevo.'
      };
    }
  }

  private async verifyBotInteraction(
    userId: string,
    userTelegramId?: string
  ): Promise<VerificationResult> {
    if (!userTelegramId) {
      return {
        success: false,
        message: 'Se requiere ID de usuario de Telegram'
      };
    }

    try {
      // Send a verification message to the user via bot
      const messageText = `🔐 Verificación de Airdrop\n\nHola! Para verificar tu cuenta, haz clic en el botón "Verificar" abajo.`;
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '✅ Verificar',
              callback_data: `verify_${userId}`
            }
          ]
        ]
      };

      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: userTelegramId,
          text: messageText,
          reply_markup: keyboard
        })
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Error enviando mensaje de verificación'
        };
      }

      const data = await response.json();

      if (data.ok) {
        return {
          success: true,
          message: 'Mensaje de verificación enviado. Revisa tu Telegram y haz clic en "Verificar".',
          externalId: userTelegramId,
          metadata: {
            messageId: data.result.message_id,
            sentAt: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          message: 'Error enviando mensaje de verificación'
        };
      }
    } catch (error) {
      console.error('Error sending verification message:', error);
      return {
        success: false,
        message: 'Error enviando mensaje de verificación. Intenta de nuevo.'
      };
    }
  }

  // Method to handle bot webhook callbacks
  async handleBotCallback(callbackQuery: any): Promise<{ success: boolean; userId?: string; message?: string }> {
    try {
      const { data, from } = callbackQuery;
      const userTelegramId = from.id.toString();

      if (data.startsWith('verify_')) {
        const userId = data.replace('verify_', '');

        // Answer the callback query
        await fetch(`${this.apiUrl}/answerCallbackQuery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: '✅ Verificación completada exitosamente!'
          })
        });

        // Send confirmation message
        await fetch(`${this.apiUrl}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: userTelegramId,
            text: '🎉 ¡Tu cuenta ha sido verificada exitosamente!\n\nPuedes volver a la aplicación y continuar con tus tareas.'
          })
        });

        return {
          success: true,
          userId,
          message: 'Bot verification completed'
        };
      }

      return {
        success: false,
        message: 'Unknown callback data'
      };
    } catch (error) {
      console.error('Error handling bot callback:', error);
      return {
        success: false,
        message: 'Error processing callback'
      };
    }
  }

  // Method to get bot info
  async getBotInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/getMe`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting bot info:', error);
      return null;
    }
  }
}