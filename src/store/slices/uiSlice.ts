import type { UIState, UIActions, SliceCreator } from '../types';
import type { Alert } from '../../types';

export const createUISlice: SliceCreator<UIState & UIActions> = (set) => ({
  // Initial state
  currentTab: 'dashboard',
  isLoading: false,
  error: null,
  alerts: [],

  // Actions
  setCurrentTab: (tab: string) => set((state) => ({ ...state, currentTab: tab })),
  
  setLoading: (loading: boolean) => set((state) => ({ ...state, isLoading: loading })),
  
  setError: (error: string | null) => set((state) => ({ ...state, error })),
  
  setAlerts: (alerts: Alert[]) => set((state) => ({ ...state, alerts })),

  addAlert: (alert: Alert) =>
    set((state) => ({
      ...state,
      alerts: [...state.alerts, alert]
    })),

  removeAlert: (index: number) =>
    set((state) => ({
      ...state,
      alerts: state.alerts.filter((_, i) => i !== index)
    })),

  dismissMonthlyResetAlert: () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    localStorage.setItem(`monthly_alert_dismissed_${currentMonth}`, 'true');
  },
});
