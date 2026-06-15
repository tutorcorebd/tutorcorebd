import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  ShieldCheck, Check, X, ShieldAlert, Award, Clock, Users, UserCheck, 
  UserMinus, Trash2, Mail, Phone, BookOpen, Search, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminMembership = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tutor'); // 'tutor' or 'guardian'
  const [filterStatus, setFilterStatus] = useState('pending'); // 'All', 'pending', 'approved', 'rejected'
  const [actionMessage, setActionMessage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 4000);

    try {
      const { data, error } = await supabase
        .from('membership_requests')
        .select(`
          id,
          user_id,
          plan_name,
          status,
          created_at,
          payment_platform,
          transaction_id,
          phone_number,
          users (
            id,
            full_name,
            phone_number,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching membership requests:', err);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleProcessRequest = async (request, newStatus) => {
    const confirmMsg = `Are you sure you want to ${newStatus.toUpperCase()} this upgrade request for ${request.users?.full_name || 'Tutor'} to the ${request.plan_name} plan?`;
    if (!confirm(confirmMsg)) return;

    setUpdatingId(request.id);
    try {
      // 1. Update the request status
      const { error: requestError } = await supabase
        .from('membership_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // 2. If approved, update the tutor's status and verification flag in tutor_profiles
      if (newStatus === 'approved') {
        const isVerified = request.plan_name === 'Verified' || request.plan_name === 'Pro' || request.plan_name === 'Premium';
        const profileStatus = 
          request.plan_name === 'Verified' 
            ? 'Verified Tutor' 
            : (request.plan_name === 'Pro' || request.plan_name === 'Premium' ? 'Premium Tutor' : 'Normal Tutor');

        const { error: profileError } = await supabase
          .from('tutor_profiles')
          .update({ 
            tutor_status: profileStatus,
            is_verified: isVerified
          })
          .eq('user_id', request.user_id);

        if (profileError) throw profileError;
      }

      // 3. Update local state
      setRequests(requests.map(r => r.id === request.id ? { ...r, status: newStatus } : r));
      showToast(`Upgrade request has been ${newStatus}.`);
    } catch (err) {
      console.error('Error processing membership request:', err);
      alert('Failed to update request: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const showToast = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'All') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto mt-4 relative">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 bg-slate-900 text-white rounded-2xl shadow-xl px-5 py-4 z-[99] flex items-center gap-3 border border-slate-800"
          >
            <ShieldCheck className="w-5 h-5 text-[#86c240] shrink-0" />
            <span className="text-xs font-bold">{actionMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Membership Management</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Review and process tutor and guardian membership plan upgrade requests.</p>
        </div>
        
        {/* Tab Selection */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex w-fit self-start sm:self-center border border-slate-200/50">
          <button
            onClick={() => setActiveTab('tutor')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'tutor' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Tutors
          </button>
          <button
            onClick={() => setActiveTab('guardian')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'guardian' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Guardians
          </button>
        </div>
      </div>

      {activeTab === 'guardian' ? (
        /* Guardian Coming Soon */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-[#f7fee7] text-[#86c240] rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Guardian Memberships</h3>
          <p className="text-slate-500 text-sm font-semibold leading-relaxed">
            Guardian membership plans are currently not required. All guardian features are active by default. Guardian subscription packages are coming soon!
          </p>
        </div>
      ) : (
        /* Tutor Requests View */
        <>
          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tutor Upgrade Applications</span>
            <div className="flex gap-2">
              {['pending', 'approved', 'rejected', 'All'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    filterStatus === status
                      ? 'border-[#86c240] bg-[#f7fee7] text-slate-800'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20 text-slate-400 font-bold text-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
                Loading upgrade requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-16 text-slate-450 font-bold">
                No upgrade requests found matching this status.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs tracking-wider">
                      <th className="p-4 pl-6">Tutor Info</th>
                      <th className="p-4">Requested Plan</th>
                      <th className="p-4">Request Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium text-slate-650">
                    {filteredRequests.map(req => {
                      const isPending = req.status === 'pending';
                      const isApproved = req.status === 'approved';
                      const isRejected = req.status === 'rejected';

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                          {/* Tutor details */}
                          <td className="p-4 pl-6">
                            <h4 className="font-extrabold text-slate-800 text-sm leading-none">{req.users?.full_name || 'Unknown User'}</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-slate-400 font-semibold">
                              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {req.users?.phone_number || 'N/A'}</span>
                              {req.users?.email && (
                                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {req.users?.email}</span>
                              )}
                            </div>
                          </td>

                          {/* Plan details */}
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              req.plan_name === 'Premium'
                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                : req.plan_name === 'Verified'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : req.plan_name === 'Pro'
                                    ? 'bg-green-50 text-green-700 border-green-100'
                                    : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                              {req.plan_name}
                            </span>
                            {req.payment_platform && req.payment_platform !== 'Free Trial' && (
                              <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Payment Details</div>
                                <div className="text-xs font-bold text-slate-700 capitalize flex items-center justify-between mb-0.5">
                                  <span>Method:</span> <span className={`${req.payment_platform === 'bkash' ? 'text-pink-600' : req.payment_platform === 'nagad' ? 'text-orange-500' : 'text-purple-600'}`}>{req.payment_platform}</span>
                                </div>
                                <div className="text-xs font-bold text-slate-700 flex items-center justify-between mb-0.5">
                                  <span>Sender:</span> <span>{req.phone_number}</span>
                                </div>
                                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                  <span>TrxID:</span> <span className="uppercase text-[#86c240]">{req.transaction_id}</span>
                                </div>
                              </div>
                            )}
                            {req.payment_platform === 'Free Trial' && (
                              <div className="mt-2 text-[10px] font-black text-[#86c240] uppercase bg-green-50 px-2 py-0.5 w-fit rounded border border-green-100">
                                Free Trial
                              </div>
                            )}
                          </td>

                          {/* Request Date */}
                          <td className="p-4 text-xs text-slate-450 font-bold">
                            {new Date(req.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                            <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                              {new Date(req.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                              isApproved 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : isRejected 
                                  ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                isApproved ? 'bg-green-500' : isRejected ? 'bg-rose-500' : 'bg-amber-500'
                              }`}></span>
                              {req.status}
                            </span>
                          </td>

                          {/* Action triggers */}
                          <td className="p-4 pr-6 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleProcessRequest(req, 'approved')}
                                  disabled={updatingId !== null}
                                  className="px-3 py-1.5 bg-green-50 border border-green-200 hover:border-green-400 text-green-700 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                                >
                                  <UserCheck className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleProcessRequest(req, 'rejected')}
                                  disabled={updatingId !== null}
                                  className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:border-rose-400 text-rose-600 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                                >
                                  <UserMinus className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-semibold italic">Processed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default AdminMembership;
