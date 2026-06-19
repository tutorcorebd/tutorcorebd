import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { 
  ShieldCheck, Check, Clock, AlertTriangle, XCircle, Award, 
  Copy, ArrowRight, CheckCircle, Trash2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomAlert from '../../components/layout/CustomAlert';

const VerifiedBadge = ({ size = 16 }) => (
  <svg 
    className="inline-block text-[#86c240] fill-current shrink-0 ml-1.5 align-middle" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
  </svg>
);

const VerificationRequest = () => {
  const { profile, fetchProfile } = useAuthStore();
  const [activeRequest, setActiveRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Payment Form States
  const [paymentPlatform, setPaymentPlatform] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');

  // Custom Alert state
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, isOpen: false });
  };

  const fetchRequestStatus = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('membership_requests')
        .select('*')
        .eq('user_id', profile.id)
        .eq('plan_name', 'Verified')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveRequest(data);
    } catch (err) {
      console.error('Error fetching verification requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestStatus();
  }, [profile]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!paymentPlatform || !transactionId.trim() || !senderNumber.trim()) {
      showAlert('error', 'Missing Fields', 'Please complete all payment fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_id: profile.id,
        plan_name: 'Verified',
        status: 'pending',
        payment_platform: paymentPlatform,
        transaction_id: transactionId.trim(),
        phone_number: senderNumber.trim()
      };

      const { data, error } = await supabase
        .from('membership_requests')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setActiveRequest(data);
      showToast('Verification request submitted successfully!');
      // Reset form
      setPaymentPlatform('');
      setTransactionId('');
      setSenderNumber('');
    } catch (err) {
      console.error('Error submitting verification request:', err);
      showAlert('error', 'Submission Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!activeRequest) return;
    if (!confirm('Are you sure you want to cancel your verification request?')) return;

    setCancelling(true);
    try {
      const { error } = await supabase
        .from('membership_requests')
        .delete()
        .eq('id', activeRequest.id);

      if (error) throw error;

      setActiveRequest(null);
      showToast('Verification request cancelled.');
      
      // Refresh profile to trigger states
      await fetchProfile(profile);
    } catch (err) {
      console.error('Error cancelling request:', err);
      showAlert(
        'error', 
        'Cancellation Failed', 
        err.message.includes('row-level security') 
          ? 'Permission denied. Please ensure the DELETE policy is applied on membership_requests.'
          : err.message
      );
    } finally {
      setCancelling(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-slate-400 font-bold text-sm font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
        Loading verification panel...
      </div>
    );
  }

  // Active Profile Verification Check
  const isVerified = profile?.tutor_profile?.is_verified || 
                     profile?.tutor_profile?.tutor_status === 'Verified Tutor' ||
                     profile?.tutor_profile?.tutor_status === 'Premium Tutor';

  // Determine section visibility
  const showVerifiedView = isVerified;
  
  // Show request card logs only if user is NOT currently verified AND there is a pending or rejected request
  const showRequestLogCard = !isVerified && activeRequest && (activeRequest.status === 'pending' || activeRequest.status === 'rejected');
  
  // If not verified and no active pending/rejected request (or if past request was approved but profile got cancelled/unverified), show form
  const showRequestForm = !isVerified && (!activeRequest || activeRequest.status === 'approved');

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans relative px-4 sm:px-6">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 bg-slate-900 text-white rounded-2xl shadow-xl px-6 py-4.5 z-[99] flex items-center gap-3 border border-slate-800"
          >
            <ShieldCheck className="w-5 h-5 text-[#86c240] shrink-0" />
            <span className="text-sm font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Alert */}
      <CustomAlert 
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
      />

      {/* Page Header */}
      <div className="border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-[#86c240]" />
          Verification Center
        </h1>
        <p className="text-slate-500 text-base mt-1.5 font-medium">
          Verify your Tutor Core account to display a permanent green verification tick and get prioritized matching benefits.
        </p>
      </div>

      {/* Grid Content */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Status & Benefits Column (Spans 1 on LG) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card: Verification Status */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-700 text-base mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#86c240]" /> Badge Status
            </h3>
            
            <div className="flex flex-col items-center py-8 px-4 border border-slate-100 rounded-2xl bg-slate-50/50 relative">
              <div className={`w-18 h-18 rounded-full flex items-center justify-center shadow-inner ${
                isVerified ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {isVerified ? (
                  <ShieldCheck className="w-12 h-12" />
                ) : (
                  <ShieldAlert className="w-12 h-12" />
                )}
              </div>
              
              <h4 className="mt-4 font-extrabold text-slate-800 text-lg flex items-center gap-1.5">
                {isVerified ? (
                  <>
                    Verified Account <VerifiedBadge size={18} />
                  </>
                ) : (
                  'Unverified Profile'
                )}
              </h4>
              <p className="text-sm text-slate-500 mt-2 font-medium text-center leading-relaxed">
                {isVerified 
                  ? 'Your identity has been authenticated. The green badge will appear next to your name across the platform.' 
                  : 'You do not have a verification badge yet. Follow the steps to request activation.'}
              </p>
            </div>
          </div>

          {/* Card: Verification Benefits */}
          <div className="bg-gradient-to-br from-[#86c240] to-[#72ad30] text-white rounded-3xl p-6 shadow-md relative overflow-hidden w-full">
            {/* Decorative background circles */}
            <div className="absolute right-[-20%] top-[-20%] w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            
            <h3 className="font-extrabold text-white text-base tracking-tight mb-5">Verification Perks</h3>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-white">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white">Permanent Green Tick</h5>
                  <p className="text-xs text-green-50 mt-0.5 leading-relaxed font-medium">Displays next to your name everywhere on the platform.</p>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-white">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white">Priority Search Rankings</h5>
                  <p className="text-xs text-green-50 mt-0.5 leading-relaxed font-medium">Appears higher in the tutor directory when parents search.</p>
                </div>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-white">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white">Enhanced Job Placement</h5>
                  <p className="text-xs text-green-50 mt-0.5 leading-relaxed font-medium">Verified tutors get priority review during job matching selection.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Requests & Payment Form (Spans 2 on LG) */}
        <div className="lg:col-span-2 space-y-6">
          
          <AnimatePresence mode="wait">
            
            {/* 1. Verified View: User is verified */}
            {showVerifiedView && (
              <motion.div 
                key="verified-status-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6 text-center"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-inner border border-green-100">
                  <VerifiedBadge size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800">Your Account is Verified</h3>
                  <p className="text-base font-semibold text-slate-500 max-w-xl mx-auto leading-relaxed">
                    Congratulations! Your verification status is fully active. Your profile is boosted with priority ranking and displays the verification checkmark on all directories.
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. Request Card Logs: Pending or Rejected */}
            {showRequestLogCard && (
              <motion.div 
                key="active-request-log"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
                  <div>
                    <span className="text-xs font-black text-[#86c240] tracking-wider uppercase">Verification Request</span>
                    <h3 className="text-xl font-bold text-slate-800 mt-1">Current Request Status</h3>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border w-fit ${
                    activeRequest.status === 'pending'
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      activeRequest.status === 'pending'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-rose-500'
                    }`}></span>
                    {activeRequest.status}
                  </span>
                </div>

                {/* Info Grid */}
                <div className="grid sm:grid-cols-2 gap-6 text-sm font-semibold text-slate-650 bg-slate-50/60 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Upgrade Package</span>
                    <span className="text-slate-800 font-extrabold flex items-center gap-1">
                      Verified Tag Upgrade <VerifiedBadge size={14} />
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Payment Method</span>
                    <span className="text-slate-800 font-extrabold capitalize">{activeRequest.payment_platform}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Sender Mobile</span>
                    <span className="text-slate-850 font-bold font-mono">{activeRequest.phone_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Transaction ID</span>
                    <span className="text-slate-850 font-bold font-mono uppercase tracking-wide">{activeRequest.transaction_id || 'N/A'}</span>
                  </div>
                  <div className="sm:col-span-2 border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between gap-1 text-slate-400 text-xs">
                    <span>Submitted: {new Date(activeRequest.created_at).toLocaleString()}</span>
                    <span>Last Update: {new Date(activeRequest.updated_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                {activeRequest.status === 'pending' ? (
                  <div className="pt-4 flex flex-col md:flex-row items-center gap-5 justify-between">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-lg">
                      Our system administrators are checking your payment info. Verification requests are usually processed in 2-4 hours. You can cancel this request below if you need to submit correct transaction details.
                    </p>
                    <button
                      onClick={handleCancelRequest}
                      disabled={cancelling}
                      className="w-full md:w-auto px-6 py-3.5 border border-rose-250 hover:bg-rose-50 text-rose-600 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {cancelling ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4">
                    <div className="p-4.5 bg-rose-50 border border-rose-150 rounded-2xl flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-extrabold text-rose-800 font-sans">Payment verification rejected</h4>
                        <p className="text-xs text-rose-650 font-medium mt-1.5 leading-relaxed">
                          We were unable to confirm the transaction details you submitted. Please make sure the sender number and Transaction ID match the setup fee transaction.
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setActiveRequest(null)}
                      className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-md"
                    >
                      Create New Verification Request
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. Verification Request Form */}
            {showRequestForm && (
              <motion.div 
                key="request-form-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6"
              >
                <div className="pb-4 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Upgrade Form</span>
                  <h3 className="text-xl font-bold text-slate-800 mt-1">Verification Request Form</h3>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-650 leading-relaxed">
                  Verification tag upgrades require a one-time processing fee of <strong className="text-slate-800">500 TK</strong> for lifetime access. Send the payment to one of the numbers below, then submit your transaction details:
                </div>

                {/* Styled Payment Info Cards (bKash, Nagad, Rocket) */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="border border-pink-100 bg-pink-50/10 p-5 rounded-2xl flex flex-col items-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#e2136e]/5 rounded-bl-full flex items-center justify-center"></div>
                    <span className="text-xs font-black text-[#e2136e] tracking-wider uppercase mb-1">bKash & Nagad (Personal)</span>
                    <div className="flex items-center gap-2 font-black text-slate-800 text-lg mt-1">
                      <span>01785346691</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText('01785346691');
                          showToast('BKash number copied!');
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-150 rounded-lg shadow-sm"
                        title="Copy Number"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="border border-purple-100 bg-purple-50/10 p-5 rounded-2xl flex flex-col items-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#8c1584]/5 rounded-bl-full flex items-center justify-center"></div>
                    <span className="text-xs font-black text-[#8c1584] tracking-wider uppercase mb-1">Rocket (Personal)</span>
                    <div className="flex items-center gap-2 font-black text-slate-800 text-lg mt-1">
                      <span>01571723467</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText('01571723467');
                          showToast('Rocket number copied!');
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-150 rounded-lg shadow-sm"
                        title="Copy Number"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <form onSubmit={handleSubmitRequest} className="space-y-5 pt-3">
                  
                  {/* Select Payment Platform */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-650">Select Payment Platform</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'bkash', name: 'bKash', color: 'bg-[#e2136e] border-[#e2136e]' },
                        { id: 'nagad', name: 'Nagad', color: 'bg-[#f37021] border-[#f37021]' },
                        { id: 'rocket', name: 'Rocket', color: 'bg-[#8c1584] border-[#8c1584]' }
                      ].map(plat => (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => setPaymentPlatform(plat.id)}
                          className={`py-3.5 rounded-xl border text-sm font-bold transition-all ${
                            paymentPlatform === plat.id
                              ? `${plat.color} text-white shadow-md`
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-350'
                          }`}
                        >
                          {plat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sender phone number */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-650">Sender Mobile Number</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 017XXXXXXXX"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#86c240]/25 focus:border-[#86c240] font-semibold text-sm transition-all"
                    />
                  </div>

                  {/* Transaction ID */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-650">Transaction ID (TXN ID)</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. TRN918AJSG"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#86c240]/25 focus:border-[#86c240] font-semibold text-sm transition-all uppercase"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || !paymentPlatform || !senderNumber || !transactionId}
                    className="w-full py-3.5 bg-[#86c240] hover:bg-[#6a9c31] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-[#86c240]/10 transition-all flex items-center justify-center gap-2 mt-6 text-sm"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2.5"></div>
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        Submit Verification Details <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                </form>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

    </div>
  );
};

export default VerificationRequest;
