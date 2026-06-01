import { createContext, useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { validateProCode } from '../utils/proCode';

const ProContext = createContext({ isPro: false, trialActive: false });

export const PRO_FEATURES = {
  MULTI_PROJECT:     'multi_project',
  OCR_SCAN:          'ocr_scan',
  EXCEL_EXPORT:      'excel_export',
  COMPARISON_CHARTS: 'comparison_charts',
  // PIN_LOCK is FREE — security should not be paywalled
  ADVANCED_PDF:      'advanced_pdf',
};

const TRIAL_DAYS = 30;

export function ProProvider({ children }) {
  const proSetting  = useLiveQuery(() => db.settings.get('pro_status'));
  const trialDateRec = useLiveQuery(() => db.settings.get('pro_trial_activated_at'));

  const status = proSetting?.value || 'free';

  const trialExpired = (() => {
    if (status !== 'trial' || !trialDateRec?.value) return false;
    const ms = Date.now() - new Date(trialDateRec.value).getTime();
    return ms > TRIAL_DAYS * 24 * 60 * 60 * 1000;
  })();

  const isPro       = status === 'pro' || (status === 'trial' && !trialExpired);
  const trialActive = status === 'trial' && !trialExpired;

  return (
    <ProContext.Provider value={{ isPro, trialActive, trialExpired, status }}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  return useContext(ProContext);
}

export async function activateTrial() {
  await db.settings.put({ key: 'pro_status', value: 'trial' });
  await db.settings.put({ key: 'pro_trial_activated_at', value: new Date().toISOString() });
}

/**
 * Validate and activate pro with a purchase code.
 * Returns { ok, locked, attemptsLeft, error }
 */
export async function activatePro(code) {
  if (!code || !code.trim()) return { ok: false, error: 'Please enter a code.' };

  const result = await validateProCode(code.trim(), db);

  if (result.locked) {
    return {
      ok: false,
      locked: true,
      error: `Too many incorrect attempts. Try again in 24 hours, or contact support@gharkharcha.app`,
    };
  }

  if (!result.valid) {
    const msg = result.attemptsLeft > 0
      ? `Invalid code. ${result.attemptsLeft} attempt${result.attemptsLeft !== 1 ? 's' : ''} remaining.`
      : 'Too many incorrect attempts. Contact support@gharkharcha.app';
    return { ok: false, attemptsLeft: result.attemptsLeft, error: msg };
  }

  await db.settings.put({ key: 'pro_status', value: 'pro' });
  await db.settings.put({ key: 'pro_code', value: code.trim().toUpperCase() });
  return { ok: true };
}
