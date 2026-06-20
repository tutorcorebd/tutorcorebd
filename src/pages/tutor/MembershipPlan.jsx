import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { 
  ShieldCheck, Check, Sparkles, AlertCircle, Clock, Info, ShieldAlert, Award, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomAlert from '../../components/layout/CustomAlert';

const plans = [
  {
    name: 'Basic',
    price: '0 TK',
    duration: 'Forever',
    type: 'free',
    badge: 'Default Plan',
    features: [
      'Standard profile listing',
      'Apply to open tuitions manually',
      'Standard support via email',
    ],
    bgClass: 'bg-white border-slate-200',
    btnClass: 'bg-slate-100 text-slate-500 cursor-not-allowed',
    btnText: 'Current Default Plan',
    disabled: true
  },
  {
    name: 'Pro',
    price: '500 TK',
    duration: '3 Months',
    type: 'subscription',
    trial: '1 week free trial',
    badge: 'Most Popular',
    features: [
      'Highlighted profile in "Find Tutors"',
      'Guaranteed matches (at least 1 tuition assured)',
      'Premium customer support from admin panel',
      'Free trial for the first week',
    ],
    bgClass: 'bg-white border-slate-200 shadow-md relative hover:scale-[1.02]',
    btnClass: 'bg-[#86c240] hover:bg-[#6a9c31] text-white shadow-[#86c240]/15',
    btnText: 'Request Pro Plan',
    disabled: false
  },
  {
    name: 'Premium',
    price: '1000 TK',
    duration: '3 Months',
    type: 'subscription',
    trial: '1 week free trial',
    badge: 'Ultimate Value',
    features: [
      'Highlighted profile in "Find Tutors"',
      'Guaranteed matches (at least 1 tuition assured)',
      'Premium customer support from admin panel',
      'Free trial for the first week',
      'SMS alerts for matching tuitions instantly',
    ],
    bgClass: 'bg-slate-900 border-slate-800 text-white relative hover:scale-[1.02] shadow-xl',
    btnClass: 'bg-white text-slate-900 hover:bg-slate-100 shadow-white/5',
    btnText: 'Request Premium Plan',
    disabled: false
  },
  {
    name: 'Verified',
    price: '500 TK',
    duration: 'Lifetime',
    type: 'upgrade',
    badge: 'Permanent Badge',
    features: [
      'Verified green tick badge (Instagram style)',
      'Highlight as verified expert tutor',
      'SMS alerts for matching tuitions',
      'One-time payment - Lifetime Access',
    ],
    bgClass: 'bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-250 shadow-md hover:scale-[1.02]',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/15',
    btnText: 'Get Verified Permanently',
    disabled: false
  }
];

const MembershipPlan = () => {
  const { profile } = useAuthStore();
  const [activeRequest, setActiveRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingPlan, setSubmittingPlan] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentPlatform, setPaymentPlatform] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, isOpen: false });
  };

  const fetchActiveRequest = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('membership_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveRequest(data);
    } catch (err) {
      console.error('Error fetching membership request:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRequest();
  }, [profile]);

  const handleRequestPlan = (plan) => {
    if (!profile?.id) return;
    
    // Check if already has a pending request
    if (activeRequest && activeRequest.status === 'pending') {
      showAlert('info', 'Pending Request Exists', `You already have a pending request for the ${activeRequest.plan_name} plan. Please wait for administrator approval.`);
      return;
    }

    setSelectedPlan(plan);
    setPaymentPlatform('');
    setTransactionId('');
    setSenderNumber('');

    // If plan has no trial (e.g. Verified), skip to platform selection
    if (!plan.trial) {
      setModalStep(2);
    } else {
      setModalStep(1);
    }
    
    setShowModal(true);
  };

  const submitMembershipRequest = async (isTrial = false) => {
    setSubmittingPlan(selectedPlan.name);
    try {
      const payload = {
        user_id: profile.id,
        plan_name: selectedPlan.name,
        status: 'pending',
      };

      if (!isTrial) {
        payload.payment_platform = paymentPlatform;
        payload.transaction_id = transactionId;
        payload.phone_number = senderNumber;
      } else {
        payload.payment_platform = 'Free Trial';
      }

      const { data, error } = await supabase
        .from('membership_requests')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      
      setActiveRequest(data);
      showToast(`Successfully requested upgrade to ${selectedPlan.name} Plan!`);
      setShowModal(false);
    } catch (err) {
      console.error('Error upgrading plan:', err);
      showAlert('error', 'Request Failed', err.message);
    } finally {
      setSubmittingPlan(null);
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
        Loading membership dashboard...
      </div>
    );
  }

  const tutorStatus = profile?.tutor_profile?.tutor_status || 'Normal Tutor';

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans relative">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 bg-slate-900 text-white rounded-2xl shadow-xl px-5 py-4 z-[99] flex items-center gap-3 border border-slate-800"
          >
            <ShieldCheck className="w-5 h-5 text-[#86c240] shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
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

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-[#86c240]" />
          Membership Plans
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          Upgrade your plan to unlock highlighted profiles, permanent verification tags, and premium tuition matching benefits.
        </p>
      </div>

      {/* Current Membership status banner */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            tutorStatus === 'Premium Tutor' 
              ? 'bg-purple-50 text-purple-600' 
              : tutorStatus === 'Verified Tutor'
                ? 'bg-green-50 text-green-700'
                : 'bg-slate-50 text-slate-400'
          }`}>
            {tutorStatus === 'Premium Tutor' ? (
              <Sparkles className="w-6 h-6 animate-pulse" />
            ) : tutorStatus === 'Verified Tutor' ? (
              <Award className="w-6 h-6" />
            ) : (
              <Info className="w-6 h-6" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 tracking-wider">Your Current Membership</span>
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-1.5 mt-0.5">
              {tutorStatus}
              {tutorStatus !== 'Normal Tutor' && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              )}
            </h3>
          </div>
        </div>

        {activeRequest && activeRequest.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2.5 text-xs font-bold text-amber-800">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <span>Upgrade Request for "{activeRequest.plan_name}" is currently pending administrator review.</span>
          </div>
        )}
      </div>

      {/* Subscription Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {plans.map((plan, index) => {
          // Check if plan matches current status
          const isCurrentStatus = 
            (plan.name === 'Basic' && tutorStatus === 'Normal Tutor') ||
            (plan.name === 'Pro' && tutorStatus === 'Premium Tutor' && activeRequest?.plan_name === 'Pro') ||
            (plan.name === 'Premium' && tutorStatus === 'Premium Tutor' && activeRequest?.plan_name === 'Premium') ||
            (plan.name === 'Verified' && tutorStatus === 'Verified Tutor');

          const isPendingThis = activeRequest?.status === 'pending' && activeRequest?.plan_name === plan.name;

          return (
            <div 
              key={index}
              className={`border-2 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${plan.bgClass} ${
                isCurrentStatus ? 'ring-4 ring-[#86c240] ring-offset-2' : ''
              }`}
            >
              <div>
                {/* Badge header */}
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-black tracking-wider px-2.5 py-0.5 rounded-full border ${
                    plan.name === 'Premium'
                      ? 'bg-purple-900 border-purple-800 text-purple-200'
                      : plan.name === 'Verified'
                        ? 'bg-emerald-100 border-emerald-250 text-emerald-700'
                        : plan.name === 'Pro'
                          ? 'bg-[#f7fee7] border-[#86c240]/25 text-[#86c240]'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    {plan.badge}
                  </span>
                  {isCurrentStatus && (
                    <span className="text-[10px] font-black text-green-500 flex items-center gap-0.5">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </div>

                {/* Preview for Verified Badge */}
                {plan.name === 'Verified' && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white/50 w-fit px-2 py-1 rounded-lg border border-emerald-100">
                    Preview: John Doe <Award className="w-4 h-4 text-emerald-500" />
                  </div>
                )}

                {/* Price block */}
                <div className="mt-5 mb-2">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className={`text-xs ml-1 font-bold ${plan.name === 'Premium' ? 'text-slate-400' : 'text-slate-400'}`}>
                    / {plan.duration}
                  </span>
                </div>

                {plan.trial && (
                  <p className="text-xs font-bold text-[#86c240] mb-5">{plan.trial}</p>
                )}

                <h3 className="font-extrabold text-base mb-4 mt-2">Features</h3>
                
                {/* Feature details */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed font-semibold">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.name === 'Premium' ? 'text-purple-400' : 'text-[#86c240]'}`} />
                      <span className={plan.name === 'Premium' ? 'text-slate-300' : 'text-slate-600'}>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div>
                {isCurrentStatus ? (
                  <button 
                    disabled
                    className="w-full py-3 bg-green-50 text-green-600 border border-green-200 rounded-xl text-xs font-bold cursor-not-allowed"
                  >
                    Your Current Plan
                  </button>
                ) : isPendingThis ? (
                  <button 
                    disabled
                    className="w-full py-3 bg-amber-50 text-amber-600 border border-amber-250 rounded-xl text-xs font-bold cursor-not-allowed animate-pulse"
                  >
                    Pending Review
                  </button>
                ) : plan.disabled ? (
                  <button 
                    disabled
                    className={`w-full py-3 rounded-xl text-xs font-bold ${plan.btnClass}`}
                  >
                    {plan.btnText}
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestPlan(plan)}
                    disabled={submittingPlan !== null}
                    className={`w-full py-3 rounded-xl text-xs font-black tracking-wide transition-all shadow-md ${plan.btnClass}`}
                  >
                    {submittingPlan === plan.name ? 'Submitting...' : plan.btnText}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Modal */}
      <AnimatePresence>
        {showModal && selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900"
              onClick={() => setShowModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full relative shadow-2xl z-10 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800">
                  {selectedPlan.name} Plan Request
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <AlertCircle className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-500 ${modalStep === 1 ? 'w-1/3' : modalStep === 2 ? 'w-2/3' : 'w-full'} ${
                    modalStep === 3 
                      ? paymentPlatform === 'bkash' ? 'bg-[#e2136e]' : paymentPlatform === 'nagad' ? 'bg-[#f37021]' : 'bg-[#8c1584]'
                      : 'bg-[#86c240]'
                  }`}
                />
              </div>

              {/* Step 1: Trial Selection */}
              {modalStep === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#f7fee7] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-[#86c240]" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">Start your free trial?</h4>
                    <p className="text-sm font-semibold text-slate-500 mt-2 leading-relaxed">
                      This plan comes with a 1-week free trial. Do you want to claim your trial right now?
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 mt-4">
                    <button
                      onClick={() => submitMembershipRequest(true)}
                      disabled={submittingPlan !== null}
                      className="w-full py-3.5 bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold rounded-xl shadow-md transition-colors"
                    >
                      {submittingPlan ? 'Submitting...' : 'Yes, Start Free Trial'}
                    </button>
                    <button
                      onClick={() => setModalStep(2)}
                      className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                    >
                      No, Purchase Directly
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Platform Selection */}
              {modalStep === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-bold text-slate-800">Select Payment Platform</h4>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                      Choose how you want to purchase the membership.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => { setPaymentPlatform('bkash'); setModalStep(3); }}
                      className="flex flex-col items-center justify-center gap-3 p-4 border border-slate-200 hover:border-[#e2136e] hover:bg-pink-50 rounded-2xl transition-all h-32"
                    >
                      <div className="w-14 h-14 bg-[#e2136e] rounded-xl flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-sm">bKash</div>
                      <span className="font-bold text-slate-700 text-sm">bKash</span>
                    </button>
                    
                    <button 
                      onClick={() => { setPaymentPlatform('nagad'); setModalStep(3); }}
                      className="flex flex-col items-center justify-center gap-3 p-4 border border-slate-200 hover:border-[#f37021] hover:bg-orange-50 rounded-2xl transition-all h-32"
                    >
                      <div className="w-14 h-14 bg-[#f37021] rounded-xl flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-sm">Nagad</div>
                      <span className="font-bold text-slate-700 text-sm">Nagad</span>
                    </button>

                    <button 
                      onClick={() => { setPaymentPlatform('rocket'); setModalStep(3); }}
                      className="flex flex-col items-center justify-center gap-3 p-4 border border-slate-200 hover:border-[#8c1584] hover:bg-purple-50 rounded-2xl transition-all h-32"
                    >
                      <div className="w-14 h-14 bg-[#8c1584] rounded-xl flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-sm">Rocket</div>
                      <span className="font-bold text-slate-700 text-sm">Rocket</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment Instructions & Submission */}
              {modalStep === 3 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-slate-800 mb-1">Make Payment</h4>
                    <p className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      Send exactly <strong className="text-slate-800">{selectedPlan.price}</strong> to the {paymentPlatform.charAt(0).toUpperCase() + paymentPlatform.slice(1)} number below. 
                      Then submit the sender number and transaction ID.
                    </p>
                  </div>

                  <div className="flex flex-col items-center my-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                      Personal {paymentPlatform} Number
                    </span>
                    <div className={`flex items-center gap-3 text-white font-black text-2xl tracking-widest py-3 px-6 rounded-2xl shadow-inner w-full justify-center ${
                      paymentPlatform === 'bkash' ? 'bg-[#e2136e]' : paymentPlatform === 'nagad' ? 'bg-[#f37021]' : 'bg-[#8c1584]'
                    }`}>
                      <span>{(paymentPlatform === 'bkash' || paymentPlatform === 'nagad') ? '01785346691' : '01571723467'}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText((paymentPlatform === 'bkash' || paymentPlatform === 'nagad') ? '01785346691' : '01571723467');
                          showToast('Number copied to clipboard!');
                        }}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-2"
                        title="Copy Number"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${
                        paymentPlatform === 'bkash' ? 'text-[#e2136e]' : paymentPlatform === 'nagad' ? 'text-[#f37021]' : 'text-[#8c1584]'
                      }`}>Sender Number</label>
                      <input 
                        type="text" 
                        placeholder={`Your ${paymentPlatform} number`}
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 font-semibold text-sm transition-all ${
                          paymentPlatform === 'bkash' ? 'focus:border-[#e2136e] focus:ring-[#e2136e]' : paymentPlatform === 'nagad' ? 'focus:border-[#f37021] focus:ring-[#f37021]' : 'focus:border-[#8c1584] focus:ring-[#8c1584]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${
                        paymentPlatform === 'bkash' ? 'text-[#e2136e]' : paymentPlatform === 'nagad' ? 'text-[#f37021]' : 'text-[#8c1584]'
                      }`}>Transaction ID</label>
                      <input 
                        type="text" 
                        placeholder="e.g. TXN123456789"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 font-semibold text-sm transition-all uppercase ${
                          paymentPlatform === 'bkash' ? 'focus:border-[#e2136e] focus:ring-[#e2136e]' : paymentPlatform === 'nagad' ? 'focus:border-[#f37021] focus:ring-[#f37021]' : 'focus:border-[#8c1584] focus:ring-[#8c1584]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100">
                    <button
                      onClick={() => setModalStep(2)}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors text-sm"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => submitMembershipRequest(false)}
                      disabled={!transactionId || !senderNumber || submittingPlan !== null}
                      className={`flex-1 py-3 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        paymentPlatform === 'bkash' ? 'bg-[#e2136e] hover:bg-[#c90f5e]' : paymentPlatform === 'nagad' ? 'bg-[#f37021] hover:bg-[#db621a]' : 'bg-[#8c1584] hover:bg-[#740e6c]'
                      }`}
                    >
                      {submittingPlan ? 'Submitting...' : 'Confirm Request'}
                    </button>
                  </div>
                </motion.div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MembershipPlan;
