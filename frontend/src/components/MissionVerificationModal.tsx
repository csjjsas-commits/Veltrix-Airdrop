import { useState, useEffect } from 'react';
import { FaExternalLinkAlt, FaGlobe, FaYoutube } from 'react-icons/fa';
import { useMissionAction, MissionVerificationModalProps } from '../hooks/useMissionAction';
import { useAuth } from '../hooks/useAuth';
import { getDashboard, verifyTask } from '../services/api';
import { UserTask } from '../types';
import { VerificationButton } from './verification/VerificationButton';

const platformIcons: Record<string, JSX.Element> = {
  instagram: (
    <svg viewBox="0 0 24 24" className="h-12 w-12 text-white" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" className="h-12 w-12 text-white" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  youtube: (
    <FaYoutube size={44} className="text-red-500" />
  ),
  web: (
    <FaGlobe size={44} className="text-violet-300" />
  ),
  telegram: (
    <svg viewBox="0 0 24 24" className="h-12 w-12 text-white" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.75 8.05l-3.727 3.83c-.287.295-.32.295-.63.205l-1.75-.65-1.1 1.05c-.15.15-.27.31-.58.31l.21-2.98 5.43-4.91c.24-.21-.05-.33-.37-.12L7.41 11.25l-2.95-.92c-.64-.2-.65.16-.14.44l7.27 2.28 1.75 5.9c.33 1.17 1.12 1.48 2.11.92.97-.56 4.25-3.08 5.39-3.75.9-.52.52-.82-.18-.55L12.9 14.78l-1.82-1.05 4.62-4.9c.35-.36.67-.16.48.2z" />
    </svg>
  )
};

const getPlatformIcon = (platform?: string) => {
  if (!platform) return null;
  return platformIcons[platform.toLowerCase()] || (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-950">
      {platform.slice(0, 2).toUpperCase()}
    </div>
  );
};

export const MissionVerificationModal = ({
  task,
  isOpen,
  onClose,
  onTaskComplete,
  state: externalState
}: MissionVerificationModalProps) => {
  const [verificationHandle, setVerificationHandle] = useState('');
  const { submitProof, connectWallet, state } = useMissionAction();
  const { user, token } = useAuth();
  const [referralStats, setReferralStats] = useState({ count: 0, pointsEarned: 0 });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [linkOpened, setLinkOpened] = useState(false);

  useEffect(() => {
    if (!isOpen || !task || task.taskType !== 'REFERRAL' || !token) return;

    const fetchStats = async () => {
      try {
        const dashboard = await getDashboard(token);
        const refTask = dashboard.availableTasks?.find((t: UserTask) => t.taskType === 'REFERRAL');
        if (refTask?.referralCount !== undefined) {
          const pointsEarned = (refTask.referralCount || 0) * (task?.points || 0);
          setReferralStats({ count: refTask.referralCount || 0, pointsEarned });
        }
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      }
    };

    fetchStats();
  }, [isOpen, task, token]);

  if (!isOpen || !task) return null;

  const currentState = externalState || state;
  const isAutoVerification = task.verificationType && task.verificationType !== 'MANUAL' && task.taskType !== 'WALLET_ACTION';
  const isWalletVerification = task.taskType === 'WALLET_ACTION';
  const requiresHandleInput = isWalletVerification || !isAutoVerification;
  
  // Para auto verificación: necesita link abierto (si hay actionUrl) y handle ingresado
  const needsLinkOpened = isAutoVerification && task.actionUrl && !linkOpened;
  const needsHandle = requiresHandleInput && verificationHandle.trim().length === 0;
  const canSubmit = !currentState.isLoading && !needsLinkOpened && !needsHandle;

  const formatPlatformText = (text?: string) => {
    if (!text) return '';
    return task.platform?.toLowerCase().includes('twitter') || task.platform?.toLowerCase() === 'x'
      ? text.replace(/Twitter/gi, 'X')
      : text;
  };

  const displayPlatform = task.platform?.toLowerCase() === 'twitter' || task.platform?.toLowerCase() === 'x'
    ? 'X'
    : task.platform || 'la plataforma';

  const displayTitle = formatPlatformText(task.title);
  const displayDescription = formatPlatformText(task.description || 'Completa el paso 1 desde el enlace y luego ingresa tu usuario para verificar la misión.');

  if (task.taskType === 'REFERRAL') {
    const referralUrl = `${window.location.origin}/register?ref=${user?.referralCode}`;

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-6">
        <div className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-slate-950/95 p-8 shadow-2xl shadow-black/80">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white">Invitá a tus amigos</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:border-violet-400 hover:text-white"
            >
              Cerrar
            </button>
          </div>

          <div className="space-y-6">

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6 text-center">
                <p className="text-xs uppercase tracking-[0.35em] font-semibold text-slate-500">Referidos</p>
                <p className="mt-4 text-4xl font-bold text-white">{referralStats.count}</p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6 text-center">
                <p className="text-xs uppercase tracking-[0.35em] font-semibold text-slate-500">Pts ganados</p>
                <p className="mt-4 text-4xl font-bold text-violet-300">{referralStats.pointsEarned}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.35em] font-semibold text-slate-500 mb-3">Tu enlace de referido</p>
              <div className="rounded-[1.75rem] bg-slate-900/90 border border-slate-800 p-4">
                <p className="text-xs text-slate-400 break-all font-mono">{referralUrl}</p>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="w-full rounded-full bg-cyan-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-cyan-400"
            >
              {copied ? '✓ Copiado' : '📋 Copiar link'}
            </button>

            <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-4 text-sm text-slate-400">
              Gana <span className="font-semibold text-violet-300">{task.points} puntos</span> por cada amigo que se registre y complete al menos una tarea.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular task verification modal
  const handleVerificationSubmit = async () => {
    if (!task) return;

    let updatedTask = null;
    const trimmedHandle = verificationHandle.trim();
    const canVerifyViaApi = task.verificationType && task.verificationType !== 'MANUAL';

    if (task.taskType === 'WALLET_ACTION') {
      updatedTask = await connectWallet(task, trimmedHandle);
    } else if (canVerifyViaApi) {
      if (!token) {
        setError('No hay token de autenticación disponible.');
        return;
      }

      const verificationPayload = {
        verificationType: task.verificationType,
        verificationData: task.verificationData,
        userHandle: trimmedHandle || undefined,
        linkOpenedAt: state.linkOpenedAt?.toISOString()
      };

      updatedTask = await verifyTask(token, task.id, verificationPayload);
    } else {
      updatedTask = await submitProof(task, trimmedHandle);
    }

    if (updatedTask) {
      onTaskComplete(updatedTask);
      setVerificationHandle('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 py-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-black/80">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-violet-500/15 text-2xl text-violet-300">
                {getPlatformIcon(task.platform) || <span className="text-xl">#</span>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-violet-300/70">TaskDrop</p>
                <h2 className="text-2xl font-semibold text-white">Verificar Tarea</h2>
              </div>
            </div>
            <p className="text-sm font-semibold text-white">{displayTitle}</p>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              {displayDescription}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition hover:border-violet-400 hover:text-white"
          >
            Cerrar
          </button>
        </div>

        <div className="space-y-4">
          {task.actionUrl && (
            <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/95 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400 mb-3">Paso 1: completá la acción</p>
              <button
                onClick={() => {
                  setLinkOpened(true);
                  if (task.actionUrl) {
                    window.open(task.actionUrl, '_blank');
                  }
                }}
                className="inline-flex w-full items-center gap-3 rounded-3xl bg-slate-950 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                <FaExternalLinkAlt className="h-4 w-4 text-violet-300" />
                <span className="truncate">Abrir acción</span>
              </button>
            </div>
          )}

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/95 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400 mb-3">Paso 2: {isAutoVerification ? 'Enviar para revisión' : `Ingresa tu ${isWalletVerification ? 'dirección de wallet' : 'usuario en ' + displayPlatform}`}</p>
            {isAutoVerification && (
              <div className="space-y-3">
                <input
                  value={verificationHandle}
                  onChange={(e) => setVerificationHandle(e.target.value)}
                  placeholder={isWalletVerification ? "0x..." : "@tuusuario"}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-4 text-white placeholder:text-slate-500 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                />
                <p className="text-sm text-slate-500">Abre el link primero, luego coloca tu usuario y haz clic en verificar.</p>
              </div>
            )}
            {isAutoVerification ? (
              <VerificationButton
                taskId={task.id}
                verificationType={task.verificationType!}
                verificationData={task.verificationData}
                linkOpened={linkOpened}
                hasActionUrl={!!task.actionUrl}
                userHandle={verificationHandle}
                onVerificationComplete={(result) => {
                  if (
                      result.verified ||
                      result.taskCompleted ||
                      result.pending
                     ) {

                    onTaskComplete({
                      ...task,
                      status: 'PENDING',
                      completedAt: new Date().toISOString(),
                      pointsAwarded: null
                    });
                    onClose();
                  } else {
                    setError(result.message || 'Error al enviar tarea');
                  }
                }}
              />
            ) : (
              <input
                value={verificationHandle}
                onChange={(e) => setVerificationHandle(e.target.value)}
                placeholder={isWalletVerification ? "0x..." : "@tuusuario"}
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-4 text-white placeholder:text-slate-500 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
              />
            )}
            {currentState.error && <p className="mt-3 text-sm text-red-400">{currentState.error}</p>}
          </div>

          {!isAutoVerification && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleVerificationSubmit}
                disabled={!canSubmit}
                className="inline-flex min-h-[56px] flex-1 items-center justify-center rounded-3xl bg-violet-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {currentState.isLoading ? 'Confirmando...' : 'Verificar automáticamente'}
              </button>
              <button
                onClick={onClose}
                className="inline-flex min-h-[56px] items-center justify-center rounded-3xl border border-slate-700 bg-slate-950 px-6 py-4 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};