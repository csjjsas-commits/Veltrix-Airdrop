import prisma from '../../utils/prismaClient.js';
import { VerificationProvider, VerificationResult } from './types.js';
import { ValidationError } from '../../utils/errors.js';

const DISCORD_API_BASE = 'https://discord.com/api';

export class DiscordService implements VerificationProvider {
  private botToken: string;

  constructor() {
    this.botToken = process.env.DISCORD_BOT_TOKEN || '';
  }

  async verify(
    userId: string,
    taskId: string,
    verificationData: any,
    userMetadata?: any
  ): Promise<VerificationResult> {
    if (!this.botToken) {
      return {
        success: false,
        message: 'Discord provider is not configured. Verification is unsupported.',
        unsupported: true
      };
    }

    const { action, serverId, roleId, userDiscordId } = verificationData || {};
    const discordId = await this.resolveUserDiscordId(userId, userDiscordId);

    if (!discordId) {
      return {
        success: false,
        message: 'Conecta tu cuenta de Discord antes de verificar esta tarea.'
      };
    }

    if (!serverId) {
      return {
        success: false,
        message: 'El servidor de Discord no está configurado para esta tarea.'
      };
    }

    try {
      switch (action) {
        case 'join_server':
          return await this.verifyServerJoin(serverId, discordId);
        case 'has_role':
          return await this.verifyRole(serverId, roleId, discordId);
        default:
          return {
            success: false,
            message: 'Acción de Discord no soportada.'
          };
      }
    } catch (error) {
      console.error('Discord verification error:', error);
      return {
        success: false,
        message: 'Error verificando Discord. Intenta de nuevo.'
      };
    }
  }

  private async resolveUserDiscordId(userId: string, explicitDiscordId?: string): Promise<string | null> {
    if (explicitDiscordId) {
      return explicitDiscordId;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true }
    });

    return user?.discordId || null;
  }

  private async getGuildMember(serverId: string, discordId: string) {
    const response = await fetch(`${DISCORD_API_BASE}/guilds/${serverId}/members/${discordId}`, {
      headers: {
        Authorization: `Bot ${this.botToken}`
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new ValidationError(`Error consultando Discord: ${body}`);
    }

    return response.json();
  }

  private async verifyServerJoin(serverId: string, discordId: string): Promise<VerificationResult> {
    const member = await this.getGuildMember(serverId, discordId);

    if (!member) {
      return {
        success: false,
        message: 'No se detecta que eres miembro de este servidor. Únete al servidor y vuelve a verificar.'
      };
    }

    return {
      success: true,
      message: '¡Unión al servidor verificada exitosamente!',
      externalId: discordId,
      metadata: {
        joinedAt: member.joined_at || new Date().toISOString(),
        serverId,
        roles: member.roles
      }
    };
  }

  private async verifyRole(serverId: string, roleId: string, discordId: string): Promise<VerificationResult> {
    if (!roleId) {
      return {
        success: false,
        message: 'El rol de Discord no está configurado para esta tarea.'
      };
    }

    const member = await this.getGuildMember(serverId, discordId);

    if (!member) {
      return {
        success: false,
        message: 'No se detecta que eres miembro de este servidor. Únete al servidor y vuelve a verificar.'
      };
    }

    const hasRole = Array.isArray(member.roles) && member.roles.includes(roleId);

    if (!hasRole) {
      return {
        success: false,
        message: 'No se detecta que tienes este rol. Asegúrate de tener el rol requerido y vuelve a verificar.'
      };
    }

    return {
      success: true,
      message: '¡Rol verificado exitosamente!',
      externalId: discordId,
      metadata: {
        roleAssignedAt: new Date().toISOString(),
        serverId,
        roleId,
        roles: member.roles
      }
    };
  }
}
