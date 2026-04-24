import jwt from 'jsonwebtoken';
import prisma from '../utils/prismaClient';
import { env } from '../utils/env';
import { NotFoundError, ValidationError } from '../utils/errors';

const DISCORD_AUTHORIZE_URL = 'https://discord.com/api/oauth2/authorize';
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DISCORD_API_URL = 'https://discord.com/api';

export interface DiscordConnectStatus {
  connected: boolean;
  discordId?: string | null;
  discordUsername?: string | null;
  discordDiscriminator?: string | null;
}

export const generateDiscordState = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '10m' });
};

export const verifyDiscordState = (state: string): { userId: string } => {
  try {
    return jwt.verify(state, env.JWT_SECRET) as { userId: string };
  } catch (error) {
    throw new ValidationError('Estado de Discord inválido o expirado');
  }
};

export const getDiscordConnectUrl = (userId: string): string => {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || !env.DISCORD_REDIRECT_URI) {
    throw new ValidationError('Discord OAuth no está configurado');
  }

  const state = generateDiscordState(userId);
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds',
    state,
    prompt: 'consent'
  });

  return `${DISCORD_AUTHORIZE_URL}?${params.toString()}`;
};

export const getDiscordStatus = async (userId: string): Promise<DiscordConnectStatus> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      discordId: true,
      discordUsername: true,
      discordDiscriminator: true
    }
  });

  return {
    connected: Boolean(user?.discordId),
    discordId: user?.discordId || null,
    discordUsername: user?.discordUsername || null,
    discordDiscriminator: user?.discordDiscriminator || null
  };
};

const exchangeDiscordCode = async (code: string) => {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || !env.DISCORD_REDIRECT_URI) {
    throw new ValidationError('Discord OAuth no está configurado');
  }

  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI
  });

  const response = await fetch(DISCORD_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ValidationError(`Error intercambiando código de Discord: ${errorText}`);
  }

  return response.json() as Promise<{ access_token: string; token_type: string; expires_in: number; refresh_token: string; scope: string }>;
};

const fetchDiscordUser = async (accessToken: string) => {
  const response = await fetch(`${DISCORD_API_URL}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ValidationError(`No se pudo obtener información de Discord: ${errorText}`);
  }

  return response.json() as Promise<{ id: string; username: string; discriminator: string }>;
};

export const connectDiscordAccount = async (code: string, state: string) => {
  const payload = verifyDiscordState(state);
  const tokenData = await exchangeDiscordCode(code);
  const discordUser = await fetchDiscordUser(tokenData.access_token);

  const existingUser = await prisma.user.findUnique({
    where: { discordId: discordUser.id }
  });

  if (existingUser && existingUser.id !== payload.userId) {
    throw new ValidationError('Esta cuenta de Discord ya está vinculada a otro usuario.');
  }

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: {
      discordId: discordUser.id,
      discordUsername: discordUser.username,
      discordDiscriminator: discordUser.discriminator,
      discordConnectedAt: new Date()
    }
  });

  return {
    discordId: user.discordId,
    discordUsername: user.discordUsername,
    discordDiscriminator: user.discordDiscriminator
  };
};
