import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useAnalytics } from './useAnalytics';
import { startTask, completeTask, submitTaskForReview, verifyTask, openLink as apiOpenLink } from '../services/api';
import { UserTask } from '../types';

export interface MissionActionState {
  isLoading: boolean;
  error: string;
  linkOpened: boolean;
  linkOpenedAt: Date | null;
}

export interface MissionVerificationModalProps {
  task: UserTask | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskComplete: (task: UserTask) => void;
  state: MissionActionState;
}

export const useMissionAction = () => {
  const { token } = useAuth();
  const { task: taskAnalytics } = useAnalytics();

  const [state, setState] = useState<MissionActionState>({
    isLoading: false,
    error: '',
    linkOpened: false,
    linkOpenedAt: null
  });

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      error: '',
      linkOpened: false,
      linkOpenedAt: null
    });
  }, []);

  const startMission = useCallback(async (task: UserTask): Promise<UserTask | null> => {
    if (!token) return null;

    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const updatedTask = await startTask(token, task.id);

      // For tasks with actionUrl, automatically open link and track it
      if (task.actionUrl && (task.taskType === 'EXTERNAL_LINK' || task.taskType === 'AUTO_COMPLETE')) {
        await apiOpenLink(token, task.id);
        
        // Open link with fallback for mobile devices
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = task.actionUrl;
        } else {
          const opened = window.open(task.actionUrl, '_blank');
          if (!opened) {
            window.location.href = task.actionUrl;
          }
        }
        
        setState(prev => ({
          ...prev,
          linkOpened: true,
          linkOpenedAt: new Date()
        }));
      } else if (task.actionUrl) {
        // For other task types, open link immediately
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = task.actionUrl;
        } else {
          const opened = window.open(task.actionUrl, '_blank');
          if (!opened) {
            window.location.href = task.actionUrl;
          }
        }
      }

      taskAnalytics.started(task.id, task.title || 'Unknown Task');
      return updatedTask;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error?.message || 'Error al iniciar la misión' }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [token, taskAnalytics]);

  const openLink = useCallback(async (task: UserTask): Promise<UserTask | null> => {
    if (!token || !task.actionUrl) return null;

    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const updatedTask = await apiOpenLink(token, task.id);
      
      // Open link with fallback for mobile devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // On mobile, use location.href for better compatibility
        window.location.href = task.actionUrl;
      } else {
        // On desktop, try window.open with fallback
        const opened = window.open(task.actionUrl, '_blank');
        if (!opened) {
          // If popup was blocked, use location.href
          window.location.href = task.actionUrl;
        }
      }
      
      setState(prev => ({
        ...prev,
        linkOpened: true,
        linkOpenedAt: new Date()
      }));
      return updatedTask;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error?.message || 'Error al abrir el enlace' }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [token]);

  const completeMission = useCallback(async (task: UserTask): Promise<UserTask | null> => {
    if (!token) return null;

    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      let updatedTask: UserTask;

      if (task.taskType === 'AUTO_COMPLETE' || task.taskType === 'INTERNAL_ACTION') {
        updatedTask = await completeTask(token, task.id);
      } else {
        // For other task types, use verification
        updatedTask = await verifyTask(token, task.id, {
          verificationType: task.verificationType,
          verificationData: task.verificationData,
          linkOpenedAt: state.linkOpenedAt?.toISOString()
        });
      }

      taskAnalytics.completed(task.id, task.title || 'Unknown Task', task.points);
      return updatedTask;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error?.message || 'Error al completar la misión' }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [token, state.linkOpenedAt, taskAnalytics]);

  const submitProof = useCallback(async (task: UserTask, proof: string): Promise<UserTask | null> => {
    if (!token) return null;

    if (proof.trim().length < 20) {
      setState(prev => ({ ...prev, error: 'La prueba debe tener al menos 20 caracteres' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const updatedTask = await submitTaskForReview(token, task.id, proof.trim());
      taskAnalytics.completed(task.id, task.title || 'Unknown Task', task.points);
      return updatedTask;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error?.message || 'Error al enviar la prueba' }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [token, taskAnalytics]);

  const connectWallet = useCallback(async (task: UserTask, walletAddress: string): Promise<UserTask | null> => {
    if (!token) return null;

    if (!walletAddress.trim()) {
      setState(prev => ({ ...prev, error: 'La dirección de wallet es requerida' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const updatedTask = await verifyTask(token, task.id, {
        action: 'connect',
        walletAddress: walletAddress.trim()
      });
      taskAnalytics.completed(task.id, task.title || 'Unknown Task', task.points);
      return updatedTask;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error?.message || 'Error al conectar wallet' }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [token, taskAnalytics]);

  return {
    state,
    resetState,
    startMission,
    openLink,
    completeMission,
    submitProof,
    connectWallet
  };
};