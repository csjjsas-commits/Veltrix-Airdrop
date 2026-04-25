import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLDivElement, options: Record<string, unknown>) => number;
      remove: (widgetId: number) => void;
      reset: (widgetId: number) => void;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string;

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  resetTrigger?: number;
}

export const TurnstileWidget = ({ onVerify, resetTrigger }: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!SITE_KEY) {
      setStatusMessage(
        'Captcha no configurado: define VITE_TURNSTILE_SITE_KEY en frontend/.env y verifica tu configuración de Turnstile en Cloudflare.'
      );
      return;
    }

    let interval: number | null = null;

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current) {
        return;
      }

      setStatusMessage(null);

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onVerify(token),
        'expired-callback': () => onVerify(''),
        theme: 'dark'
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      interval = window.setInterval(() => {
        if (window.turnstile) {
          window.clearInterval(interval!);
          interval = null;
          renderWidget();
        }
      }, 200);

      setTimeout(() => {
        if (!window.turnstile) {
          setStatusMessage('No se pudo cargar Turnstile. Verifica la conexión y recarga la página.');
        }
      }, 5000);
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onVerify]);

  // Reset effect
  useEffect(() => {
    if (resetTrigger !== undefined && widgetIdRef.current !== null && window.turnstile) {
      onVerify(''); // Clear the token
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetTrigger, onVerify]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="turnstile-widget" />
      {statusMessage && (
        <p className="text-sm text-rose-400">{statusMessage}</p>
      )}
    </div>
  );
};
