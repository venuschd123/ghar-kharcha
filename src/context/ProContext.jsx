import { createContext, useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

const ProContext = createContext({ isPro: false, trialActive: false });

export const PRO_FEATURES = {
  MULTI_PROJECT: 'multi_project',
  OCR_SCAN: 'ocr_scan',
  EXCEL_EXPORT: 'excel_export',
  COMPARISON_CHARTS: 'comparison_charts',
  PIN_LOCK: 'pin_lock',
  ADVANCED_PDF: 'advanced_pdf',
};

export function ProProvider({ children }) {
  const proSetting = useLiveQuery(() => db.settings.get('pro_status'));
  const isPro = proSetting?.value === 'pro' || proSetting?.value === 'trial';
  const trialActive = proSetting?.value === 'trial';

  return (
    <ProContext.Provider value={{ isPro, trialActive, status: proSetting?.value || 'free' }}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  return useContext(ProContext);
}

export async function activateTrial() {
  await db.settings.put({ key: 'pro_status', value: 'trial' });
}

export async function activatePro(code) {
  // Simple honor-system validation: code must start with GK and have 8+ chars
  if (code && code.startsWith('GK') && code.length >= 8) {
    await db.settings.put({ key: 'pro_status', value: 'pro' });
    await db.settings.put({ key: 'pro_code', value: code });
    return true;
  }
  return false;
}
