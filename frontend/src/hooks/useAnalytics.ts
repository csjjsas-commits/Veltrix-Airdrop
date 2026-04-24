import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalyticsProvider } from '../components/analytics/AnalyticsProvider';
import { analytics } from '../services/analytics';

export const usePageTracking = () => {
  const location = useLocation();
  const { trackPageView } = useAnalyticsProvider();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname, trackPageView]);
};

export const useAnalytics = () => {
  return analytics;
};