import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { DEFAULT_AFFILIATE_SETTINGS } from '../../utils/affiliate';
import {
  Share2, Download, Check, X, Settings, Users, Wallet, Send, RefreshCw, ExternalLink
} from 'lucide-react';
import CustomAlert from '../../components/layout/CustomAlert';

const AdminAffiliates = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('referrals'); // 'referrals' | 'withdrawals' | 'partners' | 'settings'
  const [referrals, setReferrals] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [partners, setPartners] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_AFFILIATE_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Selected referral for confirmation/commission modal
  const [editingRef, setEditingRef] = useState(null);
  const [refStatus, setRefStatus] = useState('pending');
  const [platformCharge, setPlatformCharge] = useState('');
  const [commissionPct, setCommissionPct] = useState('10');
  const [commissionStatus, setCommissionStatus] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');

  // Selected withdrawal for payout processing
  const [editingWd, setEditingWd] = useState(null);
  const [wdStatus, setWdStatus] = useState('paid');
  const [txId, setTxId] = useState('');
  const [wdNote, setWdNote] = useState('');

  const [savingSettings, setSavingSettings] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'success', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlertConfig({ type, title, message });
    setAlertOpen(true);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: settingsData },
        { data: refData },
        { data: wdData },
        { data: partnerData }
      ] = await Promise.all([
        supabase.from('affiliate_settings').select('*').limit(1).maybeSingle(),
        supabase.from('affiliate_referrals').select('*, affiliate:users!affiliate_referrals_affiliate_id_fkey(full_name, phone_number, role)').order('created_at', { ascending: false }),
        supabase.from('affiliate_withdrawals').select('*, affiliate:users!affiliate_withdrawals_affiliate_id_fkey(full_name, phone_number, role)').order('created_at', { ascending: false }),
        supabase.from('affiliate_profiles').select('*, user:users(full_name, phone_number, email, role)').order('created_at', { ascending: false })
      ]);

      if (settingsData) setSettings(settingsData);
      setReferrals(refData || []);
      setWithdrawals(wdData || []);
      setPartners(partnerData || []);
    } catch (err) {
      console.error('Error loading admin affiliates:', err);
      showAlert('error', 'Load Failed', 'Make sure supabase_affiliate.sql has been executed in Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openEditReferral = (r) => {
    setEditingRef(r);
    setRefStatus(r.status || 'pending');
    setPlatformCharge(r.platform_charge_amount?.toString() || '');
    setCommissionPct(r.commission_pct?.toString() || settings.global_commission_pct.toString());
    setCommissionStatus(r.commission_status || 'pending');
    setRejectionReason(r.rejection_reason || '');
  };

  const handleSaveReferral = async (e) => {
    e.preventDefault();
    if (!editingRef) return;

    const chargeNum = parseFloat(platformCharge) || 0;
    const pctNum = parseFloat(commissionPct) || Number(settings.global_commission_pct || 10);
    const calcCommission = Number(((chargeNum * pctNum) / 100).toFixed(2));

    let nextCommStatus = commissionStatus;
    let confirmedAt = editingRef.confirmed_at;
    let holdUntil = editingRef.hold_until;

    if (refStatus === 'confirmed' && editingRef.status !== 'confirmed') {
      confirmedAt = new Date().toISOString();
      const holdMs = Number(settings.hold_days || 15) * 24 * 60 * 60 * 1000;
      holdUntil = new Date(Date.now() + holdMs).toISOString();
      if (nextCommStatus === 'pending') {
        nextCommStatus = 'on_hold';
      }
    } else if (refStatus === 'rejected') {
      nextCommStatus = 'cancelled';
    }

    try {
      const { error } = await supabase
        .from('affiliate_referrals')
        .update({
          status: refStatus,
          platform_charge_amount: chargeNum,
          commission_pct: pctNum,
          commission_amount: calcCommission,
          commission_status: nextCommStatus,
          rejection_reason: refStatus === 'rejected' ? rejectionReason : null,
          confirmed_at: confirmedAt,
          hold_until: holdUntil,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRef.id);

      if (error) throw error;
      setEditingRef(null);
      await fetchAll();
      showAlert('success', 'Referral Updated', 'Lead status and commission updated successfully.');
    } catch (err) {
      showAlert('error', 'Update Failed', err.message || 'Could not update referral.');
    }
  };

  const handleQuickReleaseDue = async (r) => {
    try {
      const { error } = await supabase
        .from('affiliate_referrals')
        .update({ commission_status: 'due', updated_at: new Date().toISOString() })
        .eq('id', r.id);
      if (error) throw error;
      await fetchAll();
      showAlert('success', 'Released to Due', `${r.commission_amount} BDT is now withdrawable by the affiliate.`);
    } catch (err) {
      showAlert('error', 'Failed', err.message);
    }
  };

  const openEditWithdrawal = (w) => {
    setEditingWd(w);
    setWdStatus(w.status === 'pending' ? 'paid' : w.status);
    setTxId(w.transaction_id || '');
    setWdNote(w.admin_note || '');
  };

  const handleSaveWithdrawal = async (e) => {
    e.preventDefault();
    if (!editingWd) return;

    try {
      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({
          status: wdStatus,
          transaction_id: txId.trim() || null,
          admin_note: wdNote.trim() || null,
          processed_at: ['paid', 'rejected'].includes(wdStatus) ? new Date().toISOString() : null
        })
        .eq('id', editingWd.id);

      if (error) throw error;

      // If converting to platform_credit and marked paid for the first time, add to credit_balance
      if (
        editingWd.request_type === 'platform_credit' &&
        wdStatus === 'paid' &&
        editingWd.status !== 'paid'
      ) {
        const partner = partners.find((p) => p.user_id === editingWd.affiliate_id);
        const currentCredit = Number(partner?.credit_balance || 0);
        const added = Number(editingWd.total_credited || editingWd.amount || 0);
        await supabase
          .from('affiliate_profiles')
          .update({ credit_balance: currentCredit + added, updated_at: new Date().toISOString() })
          .eq('user_id', editingWd.affiliate_id);
      }

      setEditingWd(null);
      await fetchAll();
      showAlert('success', 'Payout Updated', 'Withdrawal request status updated.');
    } catch (err) {
      showAlert('error', 'Update Failed', err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Affiliate', 'Phone', 'Type', 'Method', 'Account', 'Amount (BDT)', 'Bonus Credit', 'Total Credited', 'Status', 'Transaction ID'];
    const rows = withdrawals.map((w) => [
      new Date(w.created_at).toISOString().split('T')[0],
      `"${(w.affiliate?.full_name || '').replace(/"/g, '""')}"`,
      w.affiliate?.phone_number || '',
      w.request_type,
      w.payment_method,
      w.account_number || '',
      w.amount,
      w.bonus_credit_amount || 0,
      w.total_credited || w.amount,
      w.status,
      w.transaction_id || ''
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tutorcore-affiliate-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('affiliate_settings')
        .upsert([
          {
            id: settings.id || '00000000-0000-0000-0000-000000000001',
            global_commission_pct: Number(settings.global_commission_pct),
            default_platform_charge_pct: Number(settings.default_platform_charge_pct),
            min_withdrawal_amount: Number(settings.min_withdrawal_amount),
            hold_days: parseInt(settings.hold_days, 10),
            credit_bonus_pct: Number(settings.credit_bonus_pct),
            referred_tutor_discount_pct: Number(settings.referred_tutor_discount_pct),
            payout_terms_text: settings.payout_terms_text,
            updated_at: new Date().toISOString()
          }
        ]);
      if (error) throw error;
      showAlert('success', 'Settings Saved', 'Global affiliate rules and rates updated.');
    } catch (err) {
      showAlert('error', 'Save Failed', err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 font-bold text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
        Loading Affiliate Management...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-[#86c240]" /> Affiliate Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verify tuition leads, override commission percentages, process 7-day bKash/Nagad payouts, and configure global rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export Payouts CSV
          </button>
          <button
            onClick={fetchAll}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'referrals', label: `Leads & Referrals (${referrals.length})`, icon: Send },
          { id: 'withdrawals', label: `Payout Queue (${withdrawals.length})`, icon: Wallet },
          { id: 'partners', label: `Affiliates (${partners.length})`, icon: Users },
          { id: 'settings', label: 'Global Rules & Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                activeTab === tab.id ? 'bg-[#86c240] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Referrals */}
      {activeTab === 'referrals' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Affiliate</th>
                <th className="px-5 py-3.5">Type & Lead</th>
                <th className="px-5 py-3.5">Location / Class</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Platform Charge / Comm.</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{r.affiliate?.full_name || 'User'}</div>
                    <div className="text-xs text-slate-400">{r.affiliate?.phone_number} ({r.affiliate?.role})</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{r.lead_name}</div>
                    <div className="text-xs text-slate-500">{r.lead_phone || r.lead_email} • {r.referral_type.replace('_', ' ')}</div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {r.lead_class ? `${r.lead_class} (${r.lead_category || ''})` : 'Signup'}
                    {r.lead_city && <div className="text-slate-400">{r.lead_area}, {r.lead_city} • {r.lead_salary}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 capitalize">{r.status}</span>
                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Comm: {r.commission_status.replace('_', ' ')}</div>
                  </td>
                  <td className="px-5 py-4 text-xs">
                    <div className="font-bold text-slate-800">{Number(r.commission_amount || 0).toFixed(0)} BDT ({r.commission_pct}%)</div>
                    <div className="text-slate-400">Fee: {Number(r.platform_charge_amount || 0).toFixed(0)} BDT</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => openEditReferral(r)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                      >
                        Manage
                      </button>
                      {r.commission_status === 'on_hold' && (
                        <button
                          onClick={() => handleQuickReleaseDue(r)}
                          className="px-2.5 py-1.5 bg-[#86c240] hover:bg-[#72ad30] text-white rounded-lg text-xs font-bold"
                        >
                          Release Due
                        </button>
                      )}
                      {r.referral_type === 'lead_submission' && (
                        <button
                          onClick={() => navigate('/guardian/post-request')}
                          title="Post Tuition Request"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Post
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Withdrawals */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Affiliate</th>
                <th className="px-5 py-3.5">Method & Account</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Transaction ID</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{w.affiliate?.full_name || 'User'}</div>
                    <div className="text-xs text-slate-400">{new Date(w.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{w.payment_method}</div>
                    <div className="text-xs text-slate-500">{w.account_number}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{Number(w.amount).toFixed(0)} BDT</div>
                    {w.request_type === 'platform_credit' && (
                      <div className="text-xs font-bold text-purple-600">Credit: {Number(w.total_credited).toFixed(0)} BDT</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 capitalize">{w.status}</span>
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-slate-500">{w.transaction_id || '—'}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => openEditWithdrawal(w)}
                      className="px-3 py-1.5 bg-[#86c240] hover:bg-[#72ad30] text-white rounded-lg text-xs font-bold"
                    >
                      Process Payout
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Partners */}
      {activeTab === 'partners' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Partner</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Platform Credit</th>
                <th className="px-5 py-3.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partners.map((p) => (
                <tr key={p.user_id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{p.user?.full_name || 'User'}</div>
                    <div className="text-xs text-slate-400">{p.user?.phone_number || p.user?.email}</div>
                  </td>
                  <td className="px-5 py-4 text-xs font-bold uppercase text-slate-600">{p.user?.role}</td>
                  <td className="px-5 py-4 font-mono font-bold text-[#6a9c31]">{p.affiliate_code}</td>
                  <td className="px-5 py-4 font-bold text-purple-600">{Number(p.credit_balance || 0).toFixed(0)} BDT</td>
                  <td className="px-5 py-4 text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5 max-w-2xl">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Global Commission (% of Platform Fee)</label>
              <input
                type="number"
                step="0.5"
                value={settings.global_commission_pct}
                onChange={(e) => setSettings({ ...settings, global_commission_pct: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Minimum Withdrawal (BDT)</label>
              <input
                type="number"
                value={settings.min_withdrawal_amount}
                onChange={(e) => setSettings({ ...settings, min_withdrawal_amount: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Hold Period Before Withdrawable (Days)</label>
              <input
                type="number"
                value={settings.hold_days}
                onChange={(e) => setSettings({ ...settings, hold_days: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Platform Credit Redemption Extra Bonus (%)</label>
              <input
                type="number"
                step="0.5"
                value={settings.credit_bonus_pct}
                onChange={(e) => setSettings({ ...settings, credit_bonus_pct: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Referred Tutor Welcome Discount (%)</label>
              <input
                type="number"
                step="0.5"
                value={settings.referred_tutor_discount_pct}
                onChange={(e) => setSettings({ ...settings, referred_tutor_discount_pct: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Payout Rules & Timeline Text (Displayed to Affiliates)</label>
            <textarea
              rows={4}
              value={settings.payout_terms_text}
              onChange={(e) => setSettings({ ...settings, payout_terms_text: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="px-6 py-3 bg-[#86c240] hover:bg-[#72ad30] text-white font-bold rounded-xl text-sm"
          >
            {savingSettings ? 'Saving...' : 'Save Affiliate Settings'}
          </button>
        </form>
      )}

      {/* Edit Referral Modal */}
      {editingRef && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Manage Lead / Referral</h3>
              <button onClick={() => setEditingRef(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveReferral} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Lead Status</label>
                <select value={refStatus} onChange={(e) => setRefStatus(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold">
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Platform Charge (BDT)</label>
                  <input type="number" value={platformCharge} onChange={(e) => setPlatformCharge(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Commission % (Override)</label>
                  <input type="number" step="0.5" value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-600">
                Calculated Bonus: <span className="text-[#6a9c31]">{(((parseFloat(platformCharge) || 0) * (parseFloat(commissionPct) || 0)) / 100).toFixed(0)} BDT</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Commission Lifecycle</label>
                <select value={commissionStatus} onChange={(e) => setCommissionStatus(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold">
                  <option value="pending">Pending</option>
                  <option value="on_hold">On Hold (15-Day Period)</option>
                  <option value="due">Due (Withdrawable)</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {refStatus === 'rejected' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Rejection Reason</label>
                  <input type="text" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
              )}
              <button type="submit" className="w-full py-3 bg-[#86c240] hover:bg-[#72ad30] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Withdrawal Modal */}
      {editingWd && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Process Payout Request</h3>
              <button onClick={() => setEditingWd(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveWithdrawal} className="space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div><strong>Method:</strong> {editingWd.payment_method} ({editingWd.account_number})</div>
                <div><strong>Amount:</strong> {editingWd.amount} BDT</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                <select value={wdStatus} onChange={(e) => setWdStatus(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid / Settled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Transaction ID / Reference</label>
                <input type="text" value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="e.g. TXN8829103" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Admin Note</label>
                <input type="text" value={wdNote} onChange={(e) => setWdNote(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <button type="submit" className="w-full py-3 bg-[#86c240] hover:bg-[#72ad30] text-white font-bold rounded-xl text-sm">
                Save Payout Status
              </button>
            </form>
          </div>
        </div>
      )}

      <CustomAlert isOpen={alertOpen} onClose={() => setAlertOpen(false)} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} />
    </div>
  );
};

export default AdminAffiliates;
