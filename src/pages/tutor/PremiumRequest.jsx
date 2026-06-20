import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Clock, CheckCircle, XCircle, Sparkles, 
  ArrowRight, Coins, Calendar, HelpCircle, Activity, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PremiumRequest = () => {
  const { profile } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('membership_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching membership requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    if (!profile?.id) return;

    // Listen to real-time changes on membership_requests table for the current tutor
    const channel = supabase.channel(`premium-request-logs-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'membership_requests',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('Realtime membership_requests change received:', payload);
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const getTrialDaysLeft = (updatedAt) => {
    const start = new Date(updatedAt);
    const expiry = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-slate-400 font-bold text-sm font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
        Loading request history...
      </div>
    );
  }

  // Find the most recent active or pending trial/purchase request
  const activeRequest = requests[0]; // ordered by created_at desc

  const isTrial = activeRequest?.payment_platform === 'Free Trial';
  const isPending = activeRequest?.status === 'pending';
  const isApproved = activeRequest?.status === 'approved';
  const isRejected = activeRequest?.status === 'rejected';

  // Calculate days left if active trial is approved
  const trialDaysLeft = isTrial && isApproved ? getTrialDaysLeft(activeRequest.updated_at) : 0;
  const isTrialActive = isTrial && isApproved && trialDaysLeft > 0;
  const isTrialExpired = isTrial && isApproved && trialDaysLeft === 0;

  const tutorStatus = profile?.tutor_profile?.tutor_status || 'Normal Tutor';

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-6xl mx-auto font-sans relative pb-10"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Coins className="w-8 h-8 text-[#86c240]" />
            Premium Request Logs & Trials
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Monitor active trials, check current purchase verification progress, and view your upgrade history.
          </p>
        </div>
        
        <Link 
          to="/tutor/membership" 
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-colors text-sm flex items-center gap-2"
        >
          <span>Purchase Membership</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      {/* Overview / Current Status Banner */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
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
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Active Platform Standing</span>
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-1.5 mt-0.5">
              {tutorStatus}
              {tutorStatus !== 'Normal Tutor' && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              )}
            </h3>
          </div>
        </div>
        
        {isTrialActive && (
          <div className="bg-purple-50 border border-purple-200 text-purple-800 rounded-2xl px-4 py-2.5 text-xs font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600 animate-pulse" />
            <span>Active {activeRequest.plan_name} Trial: {trialDaysLeft} days remaining</span>
          </div>
        )}
      </motion.div>

      {/* Main Grid: Active / Pending Cards */}
      <motion.div variants={itemVariants} className="grid lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Columns: Active Request State Banner */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {!activeRequest ? (
              /* No Requests Case */
              <motion.div 
                key="no-requests"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-100 rounded-3xl p-10 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]"
              >
                <div className="w-16 h-16 bg-[#f7fee7] text-[#86c240] rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">No Premium Request Logs</h3>
                <p className="text-slate-500 text-sm max-w-sm mt-2 font-medium leading-relaxed">
                  You haven't requested any membership upgrades or free trials yet. Purchase or claim a week free trial to boost your visibility.
                </p>
                <button
                  onClick={() => navigate('/tutor/membership')}
                  className="mt-6 px-5 py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Explore Membership Plans
                </button>
              </motion.div>
            ) : isTrialActive ? (
              /* ACTIVE TRIAL CASE */
              <motion.div 
                key="active-trial"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col justify-between"
              >
                {/* Background Decoration */}
                <div className="absolute right-[-10%] top-[-20%] w-56 h-56 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <div className="absolute left-[-5%] bottom-[-10%] w-40 h-40 bg-[#86c240]/10 rounded-full blur-xl"></div>

                <div className="z-10 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-[#86c240] tracking-wider uppercase bg-[#86c240]/10 border border-[#86c240]/25 px-2.5 py-1 rounded-md">
                        Free Trial Active
                      </span>
                      <h3 className="text-2xl font-black mt-3">{activeRequest.plan_name} Package Trial</h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-black text-[#86c240]">{trialDaysLeft}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Days Left</span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-8 space-y-2">
                    <div className="flex justify-between text-xs text-slate-350 font-bold">
                      <span>Activated: {new Date(activeRequest.updated_at).toLocaleDateString()}</span>
                      <span>Expires: {new Date(new Date(activeRequest.updated_at).getTime() + 7*24*60*60*1000).toLocaleDateString()}</span>
                    </div>
                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#86c240] to-emerald-400 rounded-full transition-all duration-1000"
                        style={{ width: `${(trialDaysLeft / 7) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Opt to buy Prompt */}
                  <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                    <h4 className="text-sm font-bold text-[#86c240] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 animate-spin-slow" /> Enjoying premium matches?
                    </h4>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed font-semibold">
                      Your free trial will end in {trialDaysLeft} days. Upgrade to a paid plan today to ensure your highlighted profile, guaranteed match assurance, and instant matching alerts remain active without interruption!
                    </p>
                    <button 
                      onClick={() => navigate('/tutor/membership')}
                      className="mt-4 w-full py-3 bg-[#86c240] hover:bg-[#6a9c31] text-white text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Buy Full Subscription</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : isTrialExpired ? (
              /* TRIAL EXPIRED CASE */
              <motion.div 
                key="expired-trial"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-150 rounded-3xl p-8 shadow-sm flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0 border border-red-100">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-red-500 tracking-wider uppercase bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-md">
                      Trial Expired
                    </span>
                    <h3 className="text-xl font-bold text-slate-800 mt-2">Your {activeRequest.plan_name} trial has ended</h3>
                    <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">
                      Your 7-day complimentary trial expired on {new Date(new Date(activeRequest.updated_at).getTime() + 7*24*60*60*1000).toLocaleDateString()}.
                    </p>
                  </div>
                </div>

                <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                    Buy a paid plan package to get permanent verification badges, priority ranking in the directory, and receive immediate match recommendation alerts.
                  </p>
                  <button 
                    onClick={() => navigate('/tutor/membership')}
                    className="mt-4 w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md"
                  >
                    Select Plan & Upgrade Now
                  </button>
                </div>
              </motion.div>
            ) : (
              /* STANDARD PURCHASE OR PENDING TRIAL REQUEST CARD */
              <motion.div 
                key="request-state-log"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-100 rounded-3xl p-6.5 md:p-8 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
                  <div>
                    <span className="text-[10px] font-black text-[#86c240] tracking-wider uppercase">Active Premium Request</span>
                    <h3 className="text-xl font-bold text-slate-800 mt-1">Upgrade Request Log</h3>
                  </div>
                  
                  {/* Status Tag */}
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border w-fit ${
                    isPending
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : isApproved
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isPending ? 'bg-amber-500 animate-pulse' : isApproved ? 'bg-green-500' : 'bg-rose-500'
                    }`}></span>
                    {activeRequest.status}
                  </span>
                </div>

                {/* Log Info Grid */}
                <div className="grid sm:grid-cols-2 gap-6 text-sm font-semibold text-slate-650 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Requested Plan</span>
                    <span className="text-slate-800 font-extrabold">{activeRequest.plan_name} Upgrade</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Payment Method / Type</span>
                    <span className="text-slate-800 font-extrabold capitalize">
                      {isTrial ? 'Free 7-Day Trial' : activeRequest.payment_platform}
                    </span>
                  </div>
                  {!isTrial && (
                    <>
                      <div>
                        <span className="text-slate-400 text-xs block mb-1">Sender Number</span>
                        <span className="text-slate-800 font-bold font-mono">{activeRequest.phone_number || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block mb-1">Transaction ID</span>
                        <span className="text-slate-800 font-bold font-mono uppercase tracking-wide">{activeRequest.transaction_id || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  <div className="sm:col-span-2 border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between gap-1 text-[10px] text-slate-400 font-medium">
                    <span>Submitted On: {new Date(activeRequest.created_at).toLocaleString()}</span>
                    <span>Last Updated: {new Date(activeRequest.updated_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Explanation text based on status */}
                {isPending ? (
                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-55 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                      This request is currently under review by our administrators. {isTrial ? 'Your trial' : 'Your payment verification'} will be approved shortly, usually within 2 to 4 hours. Once verified, your status will instantly update.
                    </p>
                  </div>
                ) : isRejected ? (
                  <div className="space-y-4">
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-rose-800 leading-none">Upgrade Request Rejected</h5>
                        <p className="text-[11px] text-rose-600 font-semibold mt-1.5 leading-relaxed">
                          Our administration team was unable to verify the transaction details you submitted. Please make sure the sender number and transaction ID correspond to your payment.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/tutor/membership')}
                      className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      Submit Correct Request
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-150 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-green-800 font-semibold leading-relaxed">
                      Approved! Your membership upgrade is active. Thank you for choosing Tutor Core!
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Mini FAQ & Side Perks (Spans 1 on LG) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card: Help / FAQ */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#86c240]" /> Membership FAQ
            </h3>
            
            <div className="space-y-4">
              <div className="border-b border-slate-50 pb-3">
                <h4 className="text-xs font-bold text-slate-800">How long does a trial last?</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-normal">
                  All complimentary trials on Pro and Premium plans last exactly 7 days from the moment of admin approval.
                </p>
              </div>
              <div className="border-b border-slate-50 pb-3">
                <h4 className="text-xs font-bold text-slate-800">How are purchases approved?</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-normal">
                  Our team checks transaction logs on Bkash/Nagad/Rocket. Once matched with your sender details, it is approved instantly.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Can I request multiple trials?</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-normal">
                  No, free trials are restricted to a single claim per tutor account. Further upgrades require plan purchases.
                </p>
              </div>
            </div>
          </div>

          {/* Card: Active Verification Link */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 flex flex-col justify-between min-h-[160px] shadow-sm">
            <div>
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Activity className="w-4 h-4 text-[#86c240]" /> Verification status</h4>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                Get a permanent green tick expert badge with lifetime validation to increase parent responses.
              </p>
            </div>
            
            <Link 
              to="/tutor/verification" 
              className="mt-4 text-xs font-bold text-[#86c240] hover:text-[#6a9c31] flex items-center gap-1 focus:outline-none"
            >
              Verify Profile <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </motion.div>

      {/* Request Logs Table/History Section */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl p-6.5 shadow-sm">
        <div className="pb-4 border-b border-slate-100 mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800">All Request Logs</h3>
            <p className="text-xs text-slate-400 font-medium">History of all trial claims and platform purchases</p>
          </div>
          <span className="bg-slate-100 text-slate-500 text-[10px] px-2.5 py-1 rounded-full font-bold">
            {requests.length} records
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            No history records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 pl-6">Upgrade Plan</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Requested On</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-650">
                {requests.map((req) => {
                  const reqTrial = req.payment_platform === 'Free Trial';
                  
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 text-slate-850 font-bold">{req.plan_name} Upgrade</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[9px] rounded-md font-bold uppercase ${
                          reqTrial ? 'bg-purple-50 text-purple-650 border border-purple-100' : 'bg-blue-50 text-blue-650 border border-blue-100'
                        }`}>
                          {reqTrial ? 'Trial' : 'Purchase'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-450 font-bold">
                        {new Date(req.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                          {new Date(req.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="p-4">
                        {reqTrial ? (
                          <span className="text-slate-400 font-normal">N/A</span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 capitalize">{req.payment_platform}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">TrxID: {req.transaction_id}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          req.status === 'approved' 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : req.status === 'rejected' 
                              ? 'bg-rose-50 text-rose-600 border-rose-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            req.status === 'approved' ? 'bg-green-500' : req.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}></span>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right font-normal text-slate-450">
                        {reqTrial && req.status === 'approved' ? (
                          getTrialDaysLeft(req.updated_at) > 0 ? (
                            <span className="text-purple-650 font-bold text-[10px]">{getTrialDaysLeft(req.updated_at)} days left</span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Expired</span>
                          )
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

    </motion.div>
  );
};

export default PremiumRequest;
