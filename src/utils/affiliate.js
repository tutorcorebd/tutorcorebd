const REF_STORAGE_KEY = 'tc_affiliate_ref';
const REF_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days attribution window

export const DEFAULT_AFFILIATE_SETTINGS = {
  global_commission_pct: 10,
  default_platform_charge_pct: 50,
  min_withdrawal_amount: 300,
  hold_days: 15,
  credit_bonus_pct: 10,
  referred_tutor_discount_pct: 10,
  payout_terms_text:
    'Confirmed commissions are held for 15 days of active tutoring before becoming withdrawable (Due). Cash payouts via bKash or Nagad are processed within 7 working days. Redeem as Tutor Core Credit anytime for +10% extra bonus value.'
};

export function saveReferralCode(code) {
  if (!code || typeof code !== 'string') return;
  const cleaned = code.trim().toUpperCase();
  if (!cleaned) return;
  try {
    localStorage.setItem(
      REF_STORAGE_KEY,
      JSON.stringify({
        code: cleaned,
        expiresAt: Date.now() + REF_TTL_MS
      })
    );
  } catch {
    // ignore storage errors
  }
}

export function getStoredReferralCode() {
  try {
    const raw = localStorage.getItem(REF_STORAGE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    if (!parsed?.code || !parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(REF_STORAGE_KEY);
      return '';
    }
    return parsed.code;
  } catch {
    return '';
  }
}

export function clearStoredReferralCode() {
  try {
    localStorage.removeItem(REF_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function generateAffiliateCode(userId = '') {
  const clean = userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
  return `TC${clean || Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function isEligibleForAffiliate(profile) {
  if (!profile) return { eligible: false, reason: 'Please log in to access the Affiliate program.' };
  if (profile.status !== 'active') {
    return { eligible: false, reason: 'Your account must be active to participate in the Affiliate program.' };
  }
  if (profile.role === 'tutor' && !profile.tutor_profile?.is_verified) {
    return {
      eligible: false,
      needsVerification: true,
      reason: 'Only Verified Tutors can participate in the Affiliate Bonus System. Verify your tutor profile to unlock your referral code and lead earnings.'
    };
  }
  return { eligible: true };
}

export function normalizePhone(phone = '') {
  return phone.replace(/[^0-9]/g, '').slice(-10);
}
