import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { initAnalytics, trackPageView, identifyUser, resetUser } from '../../services/analytics';

interface AnalyticsContextType {
  trackPageView: (page: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalyticsProvider = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsProvider must be used within an AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const { user, token } = useAuth();

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Track user identification when user logs in
  useEffect(() => {
    if (user && token) {
      identifyUser(user.id, {
        email: user.email,
        role: user.role
      });
    } else {
      resetUser();
    }
  }, [user, token]);

  const value = {
    trackPageView
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};