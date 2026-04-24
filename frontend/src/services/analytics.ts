import ReactGA from 'react-ga4';
import posthog from 'posthog-js';

// Analytics configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

// Initialize analytics
export const initAnalytics = () => {
  // Initialize Google Analytics 4
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log('Google Analytics 4 initialized');
  }

  // Initialize PostHog
  if (POSTHOG_API_KEY) {
    posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false, // We'll handle page tracking manually
      capture_pageleave: true,
      persistence: 'localStorage',
      loaded: (posthog) => {
        if (import.meta.env.DEV) console.log('PostHog initialized');
      }
    });
  }
};

// Page tracking
export const trackPageView = (page: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.send({ hitType: 'pageview', page });
  }

  if (POSTHOG_API_KEY) {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page
    });
  }
};

// Event tracking
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  // Google Analytics 4 event
  if (GA_MEASUREMENT_ID) {
    ReactGA.event({
      category: properties?.category || 'engagement',
      action: eventName,
      label: properties?.label,
      value: properties?.value
    });
  }

  // PostHog event
  if (POSTHOG_API_KEY) {
    posthog.capture(eventName, properties);
  }

  if (import.meta.env.DEV) {
    console.log('Analytics Event:', eventName, properties);
  }
};

// User identification
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.set({ userId });
  }

  if (POSTHOG_API_KEY) {
    posthog.identify(userId, properties);
  }
};

// User properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (POSTHOG_API_KEY) {
    posthog.people.set(properties);
  }
};

// Reset user on logout
export const resetUser = () => {
  if (POSTHOG_API_KEY) {
    posthog.reset();
  }
};

// Funnel tracking helpers
export const analytics = {
  // Traffic tracking
  trackPageView,

  // User actions
  user: {
    login: (method: string) => trackEvent('user_login', { method }),
    register: (method: string) => trackEvent('user_register', { method }),
    logout: () => trackEvent('user_logout'),
    identify: identifyUser,
    setProperties: setUserProperties,
    reset: resetUser
  },

  // Task actions
  task: {
    viewed: (taskId: string, taskTitle: string) => trackEvent('task_viewed', { taskId, taskTitle }),
    started: (taskId: string, taskTitle: string) => trackEvent('task_started', { taskId, taskTitle }),
    completed: (taskId: string, taskTitle: string, points: number) => trackEvent('task_completed', {
      taskId,
      taskTitle,
      points,
      category: 'engagement'
    }),
    failed: (taskId: string, taskTitle: string, error: string) => trackEvent('task_failed', {
      taskId,
      taskTitle,
      error,
      category: 'engagement'
    })
  },

  // Navigation
  navigation: {
    dashboardOpened: () => trackEvent('dashboard_opened'),
    tasksPageOpened: () => trackEvent('tasks_page_opened'),
    faqOpened: () => trackEvent('faq_opened'),
    adminPanelOpened: () => trackEvent('admin_panel_opened')
  },

  // Conversions
  conversion: {
    firstTaskCompleted: (taskId: string, taskTitle: string) => trackEvent('first_task_completed', {
      taskId,
      taskTitle,
      category: 'conversion'
    }),
    multipleTasksCompleted: (count: number) => trackEvent('multiple_tasks_completed', {
      taskCount: count,
      category: 'conversion'
    }),
    returnVisit: (daysSinceLastVisit: number) => trackEvent('return_visit', {
      daysSinceLastVisit,
      category: 'conversion'
    })
  },

  // Referral
  referral: {
    linkOpened: (referralCode: string) => trackEvent('referral_link_opened', { referralCode }),
    signup: (referralCode: string) => trackEvent('referral_signup', { referralCode }),
    conversion: (referralCode: string, referredUserId: string) => trackEvent('referral_conversion', {
      referralCode,
      referredUserId,
      category: 'conversion'
    })
  },

  // Custom events
  trackEvent
};

export default analytics;