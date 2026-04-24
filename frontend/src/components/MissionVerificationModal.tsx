import { useState } from 'react';
import { UserTask } from '../types';
import { useMissionAction, MissionVerificationModalProps } from '../hooks/useMissionAction';

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

  if (!isOpen || !task) return null;

  const currentState = externalState || state;

  const getModalMode = (task: UserTask) => {
    switch (task.taskType) {
      case 'MANUAL_SUBMIT':
        return 'manual';
      case 'WALLET_ACTION':
        return 'wallet';
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
    const success = await openLink(task);
    if (success) {
      // Link opened successfully
    }
  };

  const canComplete = () => {
    if (task.taskType === 'EXTERNAL_LINK' || task.taskType === 'AUTO_COMPLETE') {
      return task.actionUrl ? currentState.linkOpened : true;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="w-full max-w-2xl rounded-[2rem] border border-brand-electricBlue/20 bg-brand-deepBlue/95 p-8 shadow-2xl shadow-brand-blackVoid/70">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-brand-pureWhite">
              {modalMode === 'manual' ? 'Enviar Prueba' :
               modalMode === 'wallet' ? 'Conectar Wallet' :
               'Verificar Misión'}
            </h2>
            <p className="mt-2 text-sm text-brand-softGray">
              {modalMode === 'manual'
                ? 'Proporciona una breve prueba de tu envío.'
                : modalMode === 'wallet'
                ? 'Conecta tu wallet y completa la tarea.'
                : task.actionUrl
                ? 'Abre el enlace externo y verifica tu acción para completar la misión.'
                : 'Completa la acción requerida para finalizar la misión.'}
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

          {modalMode === 'verify' && (
            <div className="space-y-4">
              {task.actionUrl && (
                <div className="space-y-3">
                  {!currentState.linkOpened ? (
                    <div className="rounded-3xl border border-brand-electricBlue/30 bg-brand-electricBlue/10 px-4 py-3">
                      <p className="text-sm text-brand-electricBlue font-medium">
                        🔗 Debes abrir el enlace primero
                      </p>
                      <p className="text-xs text-brand-softGray mt-1">
                        Haz click en "Abrir enlace" para completar la acción requerida.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-brand-neonCyan/30 bg-brand-neonCyan/10 px-4 py-3">
                      <p className="text-sm text-brand-neonCyan font-medium">
                        ✓ Enlace abierto
                      </p>
                      <p className="text-xs text-brand-softGray mt-1">
                        Has abierto el enlace. Ahora puedes verificar y completar la tarea.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleOpenLink}
                    disabled={currentState.isLoading || currentState.linkOpened}
                    className="w-full rounded-3xl bg-brand-electricBlue px-4 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentState.isLoading ? 'Abriendo...' : currentState.linkOpened ? 'Enlace abierto' : 'Abrir enlace'}
                  </button>
                </div>
              )}
              <p className="text-sm text-brand-softGray">
                {task.actionUrl
                  ? currentState.linkOpened
                    ? 'Has abierto el enlace. Ahora puedes verificar y completar la tarea.'
                    : 'Primero abre el enlace externo, completa la acción requerida, luego regresa aquí para verificar.'
                  : 'Completa la acción requerida y presiona verificar para confirmar.'}
              </p>
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
                  onClick={handleComplete}
                  disabled={currentState.isLoading || task.status !== 'IN_PROGRESS' || !canComplete()}
                  className="rounded-3xl bg-brand-neonCyan px-5 py-3 text-sm font-semibold text-brand-blackVoid transition hover:bg-brand-electricBlue disabled:opacity-50"
                >
                  {currentState.isLoading
                    ? 'Verificando...'
                    : !canComplete()
                    ? 'Abrir enlace primero'
                    : 'Confirmar y completar misión'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};