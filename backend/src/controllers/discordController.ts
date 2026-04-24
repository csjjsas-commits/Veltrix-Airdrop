import { Request, Response } from 'express';
import { getDiscordConnectUrl, connectDiscordAccount, getDiscordStatus } from '../services/discordOAuthService';
import { ValidationError } from '../utils/errors';
import { env } from '../utils/env';

export const getDiscordConnectUrlController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const url = getDiscordConnectUrl(userId);
    res.json({ success: true, data: { url } });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    console.error('Error obteniendo URL de Discord:', error);
    res.status(500).json({ success: false, message: 'Error interno al obtener URL de Discord' });
  }
};

export const getDiscordStatusController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const status = await getDiscordStatus(userId);
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Error obteniendo estado de Discord:', error);
    res.status(500).json({ success: false, message: 'Error interno al obtener estado de Discord' });
  }
};

export const discordCallbackController = async (req: Request, res: Response): Promise<void> => {
  const code = String(req.query.code || '');
  const state = String(req.query.state || '');

  if (!code || !state) {
    res.status(400).send('<h1>Error en callback de Discord</h1><p>Faltan parámetros requeridos.</p>');
    return;
  }

  try {
    await connectDiscordAccount(code, state);

    const redirectUrl = env.DISCORD_CALLBACK_REDIRECT || '/';
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Discord conectado</title></head><body style="background:#0b1220;color:#f8fafc;font-family:Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;"><div style="max-width:520px;padding:24px;border-radius:24px;background:rgba(15,23,42,0.95);box-shadow:0 20px 60px rgba(0,0,0,0.35);text-align:center;"><h1 style="margin-bottom:16px;color:#7dd3fc;">Discord conectado</h1><p style="margin-bottom:24px;color:#cbd5e1;">Tu cuenta de Discord se vinculó correctamente. Puedes cerrar esta ventana o volver a la aplicación.</p><a href="${redirectUrl}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#38bdf8;color:#0f172a;text-decoration:none;font-weight:600;">Volver a la aplicación</a></div><script>if(window.opener){window.opener.postMessage({type:'DISCORD_CONNECTED'}, '*');}</script></body></html>`);
  } catch (error) {
    console.error('Error en callback de Discord:', error);
    res.status(500).send('<h1>Error conectando Discord</h1><p>Revisa la configuración del servidor o vuelve a intentarlo.</p>');
  }
};
