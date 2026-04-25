import { useState } from 'react';
import { UserTask } from '../types';
import { useMissionAction, MissionVerificationModalProps } from '../hooks/useMissionAction';
import { useAuth } from '../hooks/useAuth';

export const MissionVerificationModal = ({
  task,
  isOpen,
  onClose,
  onTaskComplete,
  state: externalState
}: MissionVerificationModalProps) => {
  const [proof, setProof] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const { startMission, openLink, completeMission, submitProof, connectWallet, state } = useMissionAction();
  const { user } = useAuth();

  const copyReferralLink = async () => {
    if (!user?.referralCode) return;
    const referralUrl = `${window.location.origin}/register?ref=${user.referralCode}`;
    try {
      await navigator.clipboard.writeText(referralUrl);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen || !task) return null;

  const currentState = externalState || state;

  const getModalMode = (task: UserTask) => {
    switch (task.taskType) {
      case 'MANUAL_SUBMIT':
        return 'manual';
      case 'WALLET_ACTION':
        return 'wallet';
      case 'REFERRAL':
        return 'referral';
      case 'EXTERNAL_LINK':
      case 'AUTO_COMPLETE':
        return 'verify';
      default:
        return 'verify';
    }
  };

  const modalMode = getModalMode(task);

  const handleStart = async () => {
    const updatedTask = await startMission(task);
    if (updatedTask) {
      onTaskComplete(updatedTask);
    }
  };

  const handleComplete = async () => {
    const updatedTask = await completeMission(task);
    if (updatedTask) {
      onTaskComplete(updatedTask);
      onClose();
    }
  };

  const handleSubmitProof = async () => {
    const updatedTask = await submitProof(task, proof);
    if (updatedTask) {
      onTaskComplete(updatedTask);
      onClose();
    }
  };

  const handleConnectWallet = async () => {
    const updatedTask = await connectWallet(task, walletAddress);
    if (updatedTask) {
      onTaskComplete(updatedTask);
      onClose();
    }
  };

  const handleOpenLink = async () => {
    const updatedTask = await openLink(task);
    if (updatedTask) {
      // Update the task in parent component
      onTaskComplete(updatedTask);
    }
  };

  const canComplete = () => {
    if (task.taskType === 'EXTERNAL_LINK' || task.taskType === 'AUTO_COMPLETE') {
      // Check both local state and task data
      return task.actionUrl ? (currentState.linkOpened || !!task.linkOpenedAt) : true;
    }
    return true;
  };

  const getModalTitle = (task: UserTask) => {
    switch (task.taskType) {
      case 'MANUAL_SUBMIT':
        return 'Enviar Prueba';
      case 'WALLET_ACTION':
        return 'Conectar Wallet';
      case 'REFERRAL':
        return 'Invitar Amigos';
      case 'EXTERNAL_LINK':
      case 'AUTO_COMPLETE':
        return 'Verificar Misión';
      default:
        return 'Verificar Misión';
    }
  };

  const getModalDescription = (task: UserTask) => {
    switch (task.taskType) {
      case 'MANUAL_SUBMIT':
        return 'Proporciona una breve prueba de tu envío.';
      case 'WALLET_ACTION':
        return 'Conecta tu wallet y completa la tarea.';
      case 'REFERRAL':
        return 'Comparte tu enlace de referido con amigos. La tarea se completará automáticamente cuando invites a suficientes personas.';
      case 'EXTERNAL_LINK':
      case 'AUTO_COMPLETE':
        return 'Abre el enlace externo y verifica tu acción para completar la misión.';
      default:
        return 'Completa la acción requerida para finalizar la misión.';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="w-full max-w-2xl rounded-[2rem] border border-brand-electricBlue/20 bg-brand-deepBlue/95 p-8 shadow-2xl shadow-brand-blackVoid/70">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-brand-pureWhite">
              {getModalTitle(task)}
            </h2>
            <p className="mt-2 text-sm text-brand-softGray">
              {getModalDescription(task)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-2 text-sm text-brand-softGray transition hover:border-brand-electricBlue"
          >
            Cerrar
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/75 p-5 text-brand-softGray">
            <p className="text-sm uppercase tracking-[0.3em] text-brand-neonCyan">Misión</p>
            <h3 className="mt-3 text-xl font-semibold text-brand-pureWhite">{task.title}</h3>
            <p className="mt-2 text-sm leading-6">{task.description || 'Proporciona los detalles requeridos para finalizar esta misión.'}</p>
            {task.points && (
              <p className="mt-3 text-sm text-brand-neonCyan font-semibold">
                Recompensa: +{task.points} puntos
              </p>
            )}
          </div>

          {modalMode === 'manual' && (
            <div className="space-y-4">
              <textarea
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="Describe lo que completaste..."
                className="w-full min-h-[160px] rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-4 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
              />
              {currentState.error && <p className="text-sm text-red-400">{currentState.error}</p>}
              <div className="flex gap-3">
                {task.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={handleStart}
                    disabled={currentState.isLoading}
                    className="rounded-3xl bg-brand-electricBlue px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue/80 disabled:opacity-50"
                  >
                    {currentState.isLoading ? 'Iniciando...' : 'Iniciar'}
                  </button>
                )}
                <button
                  onClick={handleSubmitProof}
                  disabled={currentState.isLoading || task.status !== 'IN_PROGRESS'}
                  className="rounded-3xl bg-brand-neonCyan px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue disabled:opacity-50"
                >
                  {currentState.isLoading ? 'Enviando...' : 'Enviar prueba y completar'}
                </button>
              </div>
            </div>
          )}

          {modalMode === 'wallet' && (
            <div className="space-y-4">
              <input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Dirección de wallet o nota de conexión"
                className="w-full rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/80 px-4 py-3 text-brand-pureWhite outline-none focus:border-brand-neonCyan"
              />
              {currentState.error && <p className="text-sm text-red-400">{currentState.error}</p>}
              <div className="flex gap-3">
                {task.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={handleStart}
                    disabled={currentState.isLoading}
                    className="rounded-3xl bg-brand-electricBlue px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue/80 disabled:opacity-50"
                  >
                    {currentState.isLoading ? 'Iniciando...' : 'Iniciar'}
                  </button>
                )}
                <button
                  onClick={handleConnectWallet}
                  disabled={currentState.isLoading || task.status !== 'IN_PROGRESS'}
                  className="rounded-3xl bg-brand-neonCyan px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue disabled:opacity-50"
                >
                  {currentState.isLoading ? 'Conectando...' : 'Completar conexión'}
                </button>
              </div>
            </div>
          )}

          {modalMode === 'referral' && (
            <div className="space-y-4">
              {user?.referralCode && (
                <div className="rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/75 p-5">
                  <p className="text-sm uppercase tracking-[0.3em] text-brand-neonCyan mb-3">Tu Código de Referido</p>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 rounded-xl bg-brand-deepBlue px-4 py-3 text-center font-mono text-lg text-brand-pureWhite">
                      {user.referralCode}
                    </code>
                    <button
                      onClick={copyReferralLink}
                      className="rounded-xl bg-brand-electricBlue px-4 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue/80"
                    >
                      Copiar Enlace
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-brand-softGray">
                    Comparte este enlace con tus amigos. Se registrarán automáticamente con tu referido.
                  </p>
                </div>
              )}
              
              {task.requiredReferralActions && (
                <div className="rounded-3xl border border-brand-graphite/70 bg-brand-blackVoid/75 p-5">
                  <p className="text-sm uppercase tracking-[0.3em] text-brand-neonCyan mb-3">Progreso</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-softGray">
                      Referidos: {task.referralCount || 0} / {task.requiredReferralActions}
                    </span>
                    <span className="text-sm font-semibold text-brand-pureWhite">
                      {Math.min(((task.referralCount || 0) / task.requiredReferralActions) * 100, 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-brand-graphite/50">
                    <div
                      className="h-full rounded-full bg-brand-neonCyan transition-all duration-300"
                      style={{ width: `${Math.min(((task.referralCount || 0) / task.requiredReferralActions) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              
              {task.referralRequiredTaskId && (
                <div className="rounded-3xl border border-brand-electricBlue/30 bg-brand-electricBlue/10 p-5">
                  <p className="text-sm uppercase tracking-[0.3em] text-brand-electricBlue mb-3">Requisito Adicional</p>
                  <p className="text-sm text-brand-softGray">
                    Los referidos deben completar una tarea específica para contar como referidos válidos.
                  </p>
                </div>
              )}
              
              {currentState.error && <p className="text-sm text-red-400">{currentState.error}</p>}
              
              <div className="flex gap-3">
                {task.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={handleStart}
                    disabled={currentState.isLoading}
                    className="rounded-3xl bg-brand-electricBlue px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue/80 disabled:opacity-50"
                  >
                    {currentState.isLoading ? 'Iniciando...' : 'Iniciar Invitaciones'}
                  </button>
                )}
                <button
                  onClick={handleComplete}
                  disabled={currentState.isLoading || task.status !== 'IN_PROGRESS' || (task.referralCount || 0) < (task.requiredReferralActions || 0)}
                  className="rounded-3xl bg-brand-neonCyan px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue disabled:opacity-50"
                >
                  {currentState.isLoading ? 'Completando...' : 'Completar Misión'}
                </button>
              </div>
            </div>
          )}

          {modalMode === 'verify' && (
            <div className="space-y-4">
              {task.actionUrl && (
                <div className="space-y-3">
                  {!currentState.linkOpened && !task.linkOpenedAt ? (
                    <div className="rounded-3xl border border-brand-electricBlue/30 bg-brand-electricBlue/10 px-4 py-3">
                      <p className="text-sm text-brand-electricBlue font-medium">
                        🔗 Debes abrir el enlace para completar la misión
                      </p>
                      <p className="text-xs text-brand-softGray mt-1">
                        Haz click en el botón para abrir el enlace y completar la acción requerida.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-brand-neonCyan/30 bg-brand-neonCyan/10 px-4 py-3">
                      <p className="text-sm text-brand-neonCyan font-medium">
                        ✓ Enlace abierto - Listo para confirmar
                      </p>
                      <p className="text-xs text-brand-softGray mt-1">
                        Has completado la acción. Confirma para finalizar la misión.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                {!currentState.linkOpened && !task.linkOpenedAt ? (
                  <button
                    onClick={handleOpenLink}
                    disabled={currentState.isLoading}
                    className="w-full rounded-3xl bg-brand-electricBlue px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue/80 disabled:opacity-50"
                  >
                    {currentState.isLoading ? 'Abriendo enlace...' : 'Abrir enlace'}
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={currentState.isLoading}
                    className="w-full rounded-3xl bg-brand-neonCyan px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue disabled:opacity-50"
                  >
                    {currentState.isLoading ? 'Confirmando...' : 'Confirma y completar'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};