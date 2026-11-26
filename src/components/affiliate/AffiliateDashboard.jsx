import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { CITIES, getAreasForCity } from '../../data/locations';
import { useCategoriesAndCourses } from '../../data/categories';
import {
  DEFAULT_AFFILIATE_SETTINGS,
  generateAffiliateCode,
  isEligibleForAffiliate,
  normalizePhone
} from '../../utils/affiliate';
import {
  Share2, Copy, Check, Wallet, Clock, CheckCircle2, ArrowUpRight,
  Gift, Send, ShieldAlert, Sparkles, DollarSign, CreditCard, RefreshCw, X
} from 'lucide-react';
import CustomAlert from '../layout/CustomAlert';

const STATUS_BADGES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  on_hold: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  due: 'bg-lime-50 text-[#5d8f24] border-lime-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  approved: 'bg-sky-50 text-sky-700 border-sky-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200'
};

const AffiliateDashboard = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const { categories, allCourses } = useCategoriesAndCourses();

  const [settings, setSettings] = useState(DEFAULT_AFFILIATE_SETTINGS);
  const [affProfile, setAffProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Lead Submission Form
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCity, setLeadCity] = useState('');
  const [leadArea, setLeadArea] = useState('');
  const [leadCategory, setLeadCategory] = useState('Bangla Medium');
  const [leadClass, setLeadClass] = useState('');
  const [leadSalary, setLeadSalary] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);

  // Withdraw / Redeem Modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMode, setWithdrawMode] = useState('cash'); // 'cash' | 'platform_credit'
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [accountNumber, setAccountNumber] = useState(profile?.phone_number || '');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Active History Tab
  const [activeTab, setActiveTab] = useState('referrals'); // 'referrals' | 'withdrawals'

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'success', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlertConfig({ type, title, message });
    setAlertOpen(true);
  };

  const eligibility = isEligibleForAffiliate(profile);

  const loadAffiliateData = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch settings
      const { data: settingsData } = await supabase
        .from('affiliate_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (settingsData) {
        setSettings(settingsData);
      }

      if (!eligibility.eligible) {
        setLoading(false);
        return;
      }

      // 2. Fetch or create affiliate_profiles record
      let { data: apData, error: apErr } = await supabase
        .from('affiliate_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (!apData && !apErr) {
        const code = generateAffiliateCode(profile.id);
        const { data: created, error: createErr } = await supabase
          .from('affiliate_profiles')
          .insert([{ user_id: profile.id, affiliate_code: code }])
          .select()
          .single();
        if (!createErr && created) {
          apData = created;
        }
      }
      setAffProfile(apData);

      // 3. Fetch referrals & withdrawals
      const [{ data: refData }, { data: wdData }] = await Promise.all([
        supabase
          .from('affiliate_referrals')
          .select('*')
          .eq('affiliate_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('affiliate_withdrawals')
          .select('*')
          .eq('affiliate_id', profile.id)
          .order('created_at', { ascending: false })
      ]);

      setReferrals(refData || []);
      setWithdrawals(wdData || []);
    } catch (err) {
      console.error('Error loading affiliate dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, eligibility.eligible]);

  useEffect(() => {
    loadAffiliateData();
  }, [loadAffiliateData]);

  // Wallet Metrics
  const totalEarned = referrals
    .filter((r) => ['on_hold', 'due', 'paid'].includes(r.commission_status))
    .reduce((sum, r) => sum + Number(r.commission_amount || 0), 0);

  const pendingOnHoldAmount = referrals
    .filter((r) => r.commission_status === 'on_hold')
    .reduce((sum, r) => sum + Number(r.commission_amount || 0), 0);

  const grossDue = referrals
    .filter((r) => ['due', 'paid'].includes(r.commission_status))
    .reduce((sum, r) => sum + Number(r.commission_amount || 0), 0);

  const withdrawnOrPendingTotal = withdrawals
    .filter((w) => w.status !== 'rejected')
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const dueBalance = Math.max(0, grossDue - withdrawnOrPendingTotal);

  const totalCashPaid = withdrawals
    .filter((w) => w.status === 'paid' && w.request_type === 'cash')
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const creditBalance = Number(affProfile?.credit_balance || 0);

  const referralCode = affProfile?.affiliate_code || generateAffiliateCode(profile?.id);
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopy = async (text, which) => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      showAlert('error', 'Copy Failed', 'Could not copy to clipboard.');
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim() || !leadCity || !leadArea || !leadClass) {
      showAlert('error', 'Missing Information', 'Please fill out all required lead fields.');
      return;
    }

    // Strict self-referral prevention
    const myPhoneNorm = normalizePhone(profile?.phone_number || '');
    const leadPhoneNorm = normalizePhone(leadPhone);
    if (myPhoneNorm && leadPhoneNorm && myPhoneNorm === leadPhoneNorm) {
      showAlert('error', 'Self-Referral Blocked', 'You cannot submit your own phone number as an affiliate lead.');
      return;
    }
    if (leadEmail && profile?.email && leadEmail.trim().toLowerCase() === profile.email.trim().toLowerCase()) {
      showAlert('error', 'Self-Referral Blocked', 'You cannot submit your own email address as an affiliate lead.');
      return;
    }

    setSubmittingLead(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_referrals')
        .insert([
          {
            affiliate_id: profile.id,
            referral_type: 'lead_submission',
            lead_name: leadName.trim(),
            lead_phone: leadPhone.trim(),
            lead_email: leadEmail.trim() || null,
            lead_city: leadCity,
            lead_area: leadArea,
            lead_class: leadClass,
            lead_category: leadCategory,
            lead_salary: leadSalary.trim() || 'Negotiable',
            lead_notes: leadNotes.trim() || null,
            status: 'pending',
            commission_pct: Number(settings.global_commission_pct || 10),
            commission_status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setReferrals((prev) => [data, ...prev]);
      setLeadName('');
      setLeadPhone('');
      setLeadEmail('');
      setLeadCity('');
      setLeadArea('');
      setLeadClass('');
      setLeadSalary('');
      setLeadNotes('');
      showAlert(
        'success',
        'Tuition Lead Submitted!',
        'Our admin team will contact the guardian shortly. Track progress in your Referrals table below.'
      );
    } catch (err) {
      console.error('Lead submit error:', err);
      showAlert('error', 'Submission Failed', err.message || 'Could not submit lead. Ensure the affiliate SQL migration is applied.');
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      showAlert('error', 'Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (amt > dueBalance) {
      showAlert('error', 'Insufficient Balance', `You only have ${dueBalance.toFixed(0)} BDT available to withdraw.`);
      return;
    }
    if (withdrawMode === 'cash') {
      const minWd = Number(settings.min_withdrawal_amount || 300);
      if (amt < minWd) {
        showAlert('error', 'Minimum Withdrawal Not Met', `Minimum cash withdrawal is ${minWd} BDT.`);
        return;
      }
      if (!accountNumber.trim()) {
        showAlert('error', 'Missing Account Number', `Please enter your ${paymentMethod} number.`);
        return;
      }
    }

    setSubmittingWithdraw(true);
    try {
      const bonusPct = Number(settings.credit_bonus_pct || 10);
      const bonusCredit = withdrawMode === 'platform_credit' ? Number(((amt * bonusPct) / 100).toFixed(2)) : 0;
      const totalCredited = withdrawMode === 'platform_credit' ? amt + bonusCredit : amt;

      const { data: wdRow, error } = await supabase
        .from('affiliate_withdrawals')
        .insert([
          {
            affiliate_id: profile.id,
            request_type: withdrawMode,
            amount: amt,
            bonus_credit_amount: bonusCredit,
            total_credited: totalCredited,
            payment_method: withdrawMode === 'platform_credit' ? 'Platform Credit' : paymentMethod,
            account_number: withdrawMode === 'platform_credit' ? 'Tutor Core Wallet' : accountNumber.trim(),
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setWithdrawals((prev) => [wdRow, ...prev]);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      showAlert(
        'success',
        withdrawMode === 'platform_credit' ? 'Credit Redemption Requested!' : 'Withdrawal Requested!',
        withdrawMode === 'platform_credit'
          ? `Your request to convert ${amt} BDT into ${totalCredited} BDT Tutor Core Credit (+${bonusPct}% bonus) has been sent to Admin.`
          : `Your ${paymentMethod} payout request of ${amt} BDT has been submitted. Cash payouts are processed within 7 working days.`
      );
    } catch (err) {
      console.error('Withdrawal error:', err);
      showAlert('error', 'Request Failed', err.message || 'Could not submit withdrawal request.');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 font-semibold text-sm">
        <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-[#86c240] mb-3"></div>
        Loading Affiliate Portal...
      </div>
    );
  }

  if (!eligibility.eligible) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-8 sm:p-10 text-center space-y-5 mt-4">
        <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-500 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Affiliate Access Locked</h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
          {eligibility.reason}
        </p>
        {eligibility.needsVerification && (
          <button
            onClick={() => navigate('/tutor/verification')}
            className="inline-flex items-center gap-2 bg-[#86c240] hover:bg-[#72ad30] text-white font-bold px-6 py-3 rounded-xl text-sm shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> Verify Tutor Profile Now
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#86c240]/10 border border-[#86c240]/20 flex items-center justify-center text-[#86c240]">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Affiliate Partner Program</h1>
            <p className="text-sm text-slate-500 font-medium">
              Refer Guardians or Tutors, submit tuition leads, and earn {settings.global_commission_pct}% commission on confirmed platform charges.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={dueBalance <= 0}
          className="inline-flex items-center justify-center gap-2 bg-[#86c240] hover:bg-[#72ad30] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Wallet className="w-4 h-4" />
          Withdraw / Redeem ({dueBalance.toFixed(0)} BDT)
        </button>
      </div>

      {/* Wallet Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Total Earned</span>
            <DollarSign className="w-4 h-4 text-[#86c240]" />
          </div>
          <p className="text-2xl font-black text-slate-800">{totalEarned.toFixed(0)} <span className="text-xs font-bold text-slate-400">BDT</span></p>
          <p className="text-[11px] text-slate-400 mt-1">Confirmed lifetime earnings</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>On Hold ({settings.hold_days}d)</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600">{pendingOnHoldAmount.toFixed(0)} <span className="text-xs font-bold text-slate-400">BDT</span></p>
          <p className="text-[11px] text-slate-400 mt-1">Unlocks after {settings.hold_days}-day hold</p>
        </div>

        <div className="bg-[#f7fee7] p-5 rounded-2xl border border-[#86c240]/30 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[#5d8f24] uppercase tracking-wider mb-2">
            <span>Due (Withdrawable)</span>
            <Wallet className="w-4 h-4 text-[#86c240]" />
          </div>
          <p className="text-2xl font-black text-[#4d7c0f]">{dueBalance.toFixed(0)} <span className="text-xs font-bold text-[#65a30d]">BDT</span></p>
          <p className="text-[11px] text-[#5d8f24] mt-1">Min cashout: {settings.min_withdrawal_amount} BDT</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Total Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{totalCashPaid.toFixed(0)} <span className="text-xs font-bold text-slate-400">BDT</span></p>
          <p className="text-[11px] text-slate-400 mt-1">Settled via bKash / Nagad</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Platform Credit</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600">{creditBalance.toFixed(0)} <span className="text-xs font-bold text-slate-400">BDT</span></p>
          <p className="text-[11px] text-purple-500 font-semibold mt-1">+{settings.credit_bonus_pct}% bonus when redeemed</p>
        </div>
      </div>

      {/* Referral Link + Terms & Manual Lead Submission */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Share Link + Rules */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#86c240]" /> Your Referral Link & Code
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Share your link with parents or tutors (30-day attribution). Referred tutors also get{' '}
              <strong className="text-[#6a9c31]">{settings.referred_tutor_discount_pct}% off</strong> their first platform charge!
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Referral Code</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralCode}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 text-sm tracking-wider"
                />
                <button
                  onClick={() => handleCopy(referralCode, 'code')}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-[#86c240]" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Referral Link</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 truncate"
                />
                <button
                  onClick={() => handleCopy(referralLink, 'link')}
                  className="px-4 py-2.5 bg-[#86c240] hover:bg-[#72ad30] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Find verified home & online tutors on Tutor Core! Join with my link (${settings.referred_tutor_discount_pct}% off first platform fee for tutors): ${referralLink}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                Share on WhatsApp <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                Share on Facebook <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3">
            <h3 className="text-sm font-bold text-[#86c240] uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Commission & Payout Rules
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {settings.payout_terms_text}
            </p>
          </div>
        </div>

        {/* Right: Manual Lead Submission Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Send className="w-5 h-5 text-[#86c240]" /> Submit a Tuition Lead
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Know a parent looking for a tutor? Submit their tuition requirement directly. Our team will verify and confirm your commission.
            </p>
          </div>

          <form onSubmit={handleLeadSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Guardian / Parent Name *</label>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="e.g. Mrs. Farhana Rahman"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#86c240]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Guardian Phone / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#86c240]"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">District (City) *</label>
                <select
                  required
                  value={leadCity}
                  onChange={(e) => {
                    setLeadCity(e.target.value);
                    setLeadArea('');
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#86c240]"
                >
                  <option value="">Select District</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Area *</label>
                <select
                  required
                  disabled={!leadCity}
                  value={leadArea}
                  onChange={(e) => setLeadArea(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#86c240] disabled:opacity-50"
                >
                  <option value="">Select Area</option>
                  {leadCity && getAreasForCity(leadCity).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Expected Salary (BDT)</label>
                <input
                  type="text"
                  value={leadSalary}
                  onChange={(e) => setLeadSalary(e.target.value)}
                  placeholder="e.g. 6000 BDT"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#86c240]"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Category / Medium</label>
                <select
                  value={leadCategory}
                  onChange={(e) => setLeadCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#86c240]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Class / Course *</label>
                <select
                  required
                  value={leadClass}
                  onChange={(e) => setLeadClass(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#86c240]"
                >
                  <option value="">Select Class</option>
                  {allCourses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Guardian Email (Optional)</label>
                <input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="parent@email.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#86c240]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Subjects & Additional Notes</label>
              <textarea
                rows={2}
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                placeholder="Subjects needed, days/week, preferred tutor university or gender..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#86c240]"
              />
            </div>

            <button
              type="submit"
              disabled={submittingLead}
              className="w-full sm:w-auto px-6 py-3 bg-[#86c240] hover:bg-[#72ad30] text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {submittingLead ? 'Submitting Lead...' : 'Submit Tuition Lead'}
            </button>
          </form>
        </div>
      </div>

      {/* History Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('referrals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'referrals' ? 'bg-[#86c240] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Referrals & Leads ({referrals.length})
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'withdrawals' ? 'bg-[#86c240] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Withdrawals & Credit ({withdrawals.length})
            </button>
          </div>
          <button
            onClick={loadAffiliateData}
            className="text-xs font-bold text-slate-500 hover:text-[#86c240] flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {activeTab === 'referrals' ? (
          <div className="overflow-x-auto">
            {referrals.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm font-medium">
                No referrals or submitted leads yet. Share your link or submit your first tuition lead above!
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Lead / User</th>
                    <th className="px-6 py-3.5">Details</th>
                    <th className="px-6 py-3.5">Lead Status</th>
                    <th className="px-6 py-3.5">Commission</th>
                    <th className="px-6 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-xs font-bold text-slate-600 capitalize">
                        {r.referral_type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{r.lead_name}</div>
                        <div className="text-xs text-slate-400">{r.lead_phone || r.lead_email || 'Registered User'}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {r.lead_class ? `${r.lead_class} • ${r.lead_area || ''}, ${r.lead_city || ''}` : 'Signup Attribution'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${STATUS_BADGES[r.status] || STATUS_BADGES.pending}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{Number(r.commission_amount || 0).toFixed(0)} BDT</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${STATUS_BADGES[r.commission_status] || STATUS_BADGES.pending}`}>
                          {r.commission_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {withdrawals.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm font-medium">
                No withdrawal or credit redemption requests yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3.5">Method</th>
                    <th className="px-6 py-3.5">Account</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Bonus / Total</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Transaction ID</th>
                    <th className="px-6 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-800">{w.payment_method}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{w.account_number}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{Number(w.amount).toFixed(0)} BDT</td>
                      <td className="px-6 py-4 text-xs font-bold text-purple-600">
                        {w.request_type === 'platform_credit' ? `${Number(w.total_credited).toFixed(0)} BDT (+${Number(w.bonus_credit_amount).toFixed(0)})` : `${Number(w.amount).toFixed(0)} BDT`}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${STATUS_BADGES[w.status] || STATUS_BADGES.pending}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">{w.transaction_id || '—'}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Withdraw / Redeem Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Withdraw or Redeem Bonus</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setWithdrawMode('cash')}
                className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                  withdrawMode === 'cash' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                Cash (bKash / Nagad)
              </button>
              <button
                type="button"
                onClick={() => setWithdrawMode('platform_credit')}
                className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                  withdrawMode === 'platform_credit' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                Platform Credit (+{settings.credit_bonus_pct}%)
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              {withdrawMode === 'cash' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{paymentMethod} Number *</label>
                    <input
                      type="tel"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Amount (Available: {dueBalance.toFixed(0)} BDT) *
                </label>
                <input
                  type="number"
                  required
                  min={withdrawMode === 'cash' ? settings.min_withdrawal_amount : 10}
                  max={dueBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Enter amount (min ${withdrawMode === 'cash' ? settings.min_withdrawal_amount : 10} BDT)`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              {withdrawMode === 'platform_credit' && parseFloat(withdrawAmount) > 0 && (
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-800 font-semibold">
                  You will receive{' '}
                  <strong>
                    {(parseFloat(withdrawAmount) * (1 + Number(settings.credit_bonus_pct || 10) / 100)).toFixed(0)} BDT
                  </strong>{' '}
                  in Tutor Core Credit (+{settings.credit_bonus_pct}% extra bonus) for membership or platform fees!
                </div>
              )}

              <button
                type="submit"
                disabled={submittingWithdraw}
                className="w-full py-3 bg-[#86c240] hover:bg-[#72ad30] text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {submittingWithdraw ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      <CustomAlert
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  );
};

export default AffiliateDashboard;
