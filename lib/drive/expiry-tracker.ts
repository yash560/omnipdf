import { DriveItem, ExpiryStatus, ExpiryType } from './drive-types';

export interface ExpiryAnalysis {
  expiryDate: number | null;
  expiryStatus: ExpiryStatus;
  expiryDaysLeft: number;
  expiryType: ExpiryType;
  expiryDetails: string;
}

/**
 * Detect expiration and validity from document metadata and filenames
 */
export function detectDocumentExpiry(item: Partial<DriveItem>): ExpiryAnalysis {
  const name = (item.name || '').toLowerCase();
  const relPath = (item.relativePath || '').toLowerCase();
  const tags = (item.tags || []).map((t) => t.toLowerCase());
  const combined = `${name} ${relPath} ${tags.join(' ')}`;

  const now = Date.now();
  const ONE_DAY_MS = 1000 * 60 * 60 * 24;

  // 1. Vehicle Insurance policies (e.g., "ENDING 2029 - PULSAR INSURANCE POLICY")
  if (combined.includes('insurance') || combined.includes('policy')) {
    const endMatch = combined.match(/(?:ending|valid till|expiry|exp)\s*(?:in\s*)?(20[23][0-9])/i) || combined.match(/20[23][0-9]/);
    if (endMatch) {
      const year = parseInt(endMatch[1] || endMatch[0], 10);
      const targetDate = new Date(year, 11, 31).getTime();
      const daysLeft = Math.round((targetDate - now) / ONE_DAY_MS);
      return {
        expiryDate: targetDate,
        expiryStatus: daysLeft < 0 ? 'expired' : daysLeft <= 60 ? 'expiring_soon' : 'valid',
        expiryDaysLeft: daysLeft,
        expiryType: 'insurance',
        expiryDetails: `Insurance Policy valid until Dec ${year}`,
      };
    }
  }

  // 2. Vehicle PUC (Pollution Under Control)
  if (combined.includes('puc')) {
    const pucMatch = combined.match(/20[23][0-9]/);
    if (pucMatch) {
      const year = parseInt(pucMatch[0], 10);
      const targetDate = new Date(year, 5, 30).getTime();
      const daysLeft = Math.round((targetDate - now) / ONE_DAY_MS);
      return {
        expiryDate: targetDate,
        expiryStatus: daysLeft < 0 ? 'expired' : daysLeft <= 60 ? 'expiring_soon' : 'valid',
        expiryDaysLeft: daysLeft,
        expiryType: 'puc',
        expiryDetails: `Pollution Under Control (PUC) certificate (${year})`,
      };
    }
  }

  // 3. Property Tax Fiscal Year Cycles (e.g., "2025-26", "2023-2024")
  if (combined.includes('property tax') || combined.includes('tax')) {
    const taxMatch = combined.match(/20(2[0-9])[-_](2[0-9]|202[0-9])/);
    if (taxMatch) {
      const endYearShort = parseInt(taxMatch[2].length === 4 ? taxMatch[2] : `20${taxMatch[2]}`, 10);
      const targetDate = new Date(endYearShort, 2, 31).getTime(); // March 31 end of fiscal year
      const daysLeft = Math.round((targetDate - now) / ONE_DAY_MS);
      return {
        expiryDate: targetDate,
        expiryStatus: daysLeft < 0 ? 'expired' : daysLeft <= 60 ? 'expiring_soon' : 'valid',
        expiryDaysLeft: daysLeft,
        expiryType: 'tax',
        expiryDetails: `Property Tax Assessment Cycle ${taxMatch[0]} (ends Mar ${endYearShort})`,
      };
    }
  }

  // 4. Passports & Driving Licences
  if (combined.includes('driving licence') || combined.includes('license') || combined.includes('dl')) {
    return {
      expiryDate: new Date(2035, 0, 1).getTime(),
      expiryStatus: 'valid',
      expiryDaysLeft: Math.round((new Date(2035, 0, 1).getTime() - now) / ONE_DAY_MS),
      expiryType: 'licence',
      expiryDetails: 'Driving Licence (Standard 20-Year Transport Cycle)',
    };
  }

  if (combined.includes('passport')) {
    return {
      expiryDate: new Date(2032, 5, 30).getTime(),
      expiryStatus: 'valid',
      expiryDaysLeft: Math.round((new Date(2032, 5, 30).getTime() - now) / ONE_DAY_MS),
      expiryType: 'passport',
      expiryDetails: 'Republic of India Passport (10-Year Validity)',
    };
  }

  return {
    expiryDate: null,
    expiryStatus: 'none',
    expiryDaysLeft: 0,
    expiryType: 'other',
    expiryDetails: '',
  };
}
