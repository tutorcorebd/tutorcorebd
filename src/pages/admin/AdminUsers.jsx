import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, Shield, Award, Users, CheckCircle, Clock, X, 
  Mail, Phone, BookOpen, GraduationCap, FileText, UserCheck, 
  UserMinus, RefreshCw, AlertTriangle, ShieldAlert, Megaphone,
  Plus, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tutor'); // 'tutor' or 'guardian'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'active', 'suspended'
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [resettingUserId, setResettingUserId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Send Notice Modal state
  const [noticeTargetUser, setNoticeTargetUser] = useState(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeDurationDays, setNoticeDurationDays] = useState('7');
  const [sendingNotice, setSendingNotice] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fail-safe timeout to prevent infinite loading in case of RLS/DB query hangs
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    try {
      // Try querying with email column first
      let { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          phone_number,
          email,
          role,
          status,
          deactivation_reason,
          deletion_reason,
          deletion_requested_at,
          created_at,
          tutor_profiles (*),
          guardian_profiles (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback: If email column does not exist (error 42703), query without it
        if (error.code === '42703') {
          console.warn("users.email column does not exist. Retrying select without email.");
          const fallbackResult = await supabase
            .from('users')
            .select(`
              id,
              full_name,
              phone_number,
              role,
              status,
              deactivation_reason,
              deletion_reason,
              deletion_requested_at,
              created_at,
              tutor_profiles (*),
              guardian_profiles (*)
            `)
            .order('created_at', { ascending: false });
          
          if (fallbackResult.error) throw fallbackResult.error;
          data = fallbackResult.data;
        } else {
          throw error;
        }
      }
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const confirmMsg = `Are you sure you want to ${newStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} this user account?${newStatus === 'suspended' ? ' They will be signed out immediately and blocked from logging in.' : ''}`;
    
    if (!confirm(confirmMsg)) return;

    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      
      // If the selected user in drawer is updated, sync it
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }

      showToast(`User account is now ${newStatus}.`);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update user status: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteInstantly = async (userId) => {
    if (!confirm('CRITICAL ACTION: Are you sure you want to PERMANENTLY delete this user? All their data will be destroyed. This cannot be undone.')) return;
    
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.filter(u => u.id !== userId));
      setSelectedUser(null);
      showToast('User has been permanently deleted.');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSendResetPassword = async (email, userId) => {
    if (!email) {
      alert('This user does not have an email address associated with their account.');
      return;
    }

    if (!confirm(`Send password reset email to ${email}?`)) return;

    setResettingUserId(userId);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      showToast(`Password reset link sent to ${email}.`);
    } catch (err) {
      console.error('Error sending reset link:', err);
      alert('Failed to send reset link: ' + err.message);
    } finally {
      setResettingUserId(userId);
      setResettingUserId(null);
    }
  };

  const handleOpenSendNotice = (user) => {
    setNoticeTargetUser(user);
    setNoticeTitle('');
    setNoticeMessage('');
    setNoticeDurationDays('7');
  };

  const handleSendNoticeSubmit = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      alert('Please fill out all fields.');
      return;
    }
    setSendingNotice(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(noticeDurationDays, 10));

      const { error } = await supabase
        .from('notices')
        .insert([{
          title: noticeTitle.trim(),
          message: noticeMessage.trim(),
          target_audience: 'specific',
          specific_user_ids: [noticeTargetUser.id],
          expires_at: expiresAt.toISOString()
        }]);

      if (error) throw error;
      showToast(`Notice successfully sent to ${noticeTargetUser.full_name}.`);
      setNoticeTargetUser(null);
    } catch (err) {
      console.error('Error sending notice:', err);
      alert('Failed to send notice: ' + err.message);
    } finally {
      setSendingNotice(false);
    }
  };

  const handleUpdateTutorStatus = async (userId, newStatus) => {
    try {
      const isVerified = newStatus === 'Verified Tutor' || newStatus === 'Premium Tutor';
      
      const { error } = await supabase
        .from('tutor_profiles')
        .update({ 
          tutor_status: newStatus,
          is_verified: isVerified
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => {
        if (u.id === userId) {
          const updatedProfiles = Array.isArray(u.tutor_profiles)
            ? [{ ...u.tutor_profiles[0], tutor_status: newStatus, is_verified: isVerified }]
            : { ...u.tutor_profiles, tutor_status: newStatus, is_verified: isVerified };
          return { ...u, tutor_profiles: updatedProfiles };
        }
        return u;
      }));

      // Sync selected user drawer
      if (selectedUser && selectedUser.id === userId) {
        const updatedProfiles = Array.isArray(selectedUser.tutor_profiles)
          ? [{ ...selectedUser.tutor_profiles[0], tutor_status: newStatus, is_verified: isVerified }]
          : { ...selectedUser.tutor_profiles, tutor_status: newStatus, is_verified: isVerified };
        setSelectedUser({ ...selectedUser, tutor_profiles: updatedProfiles });
      }

      showToast(`Tutor status updated to ${newStatus}.`);
    } catch (err) {
      console.error('Error updating tutor status:', err);
      alert('Failed to update tutor status: ' + err.message);
    }
  };

  const showToast = (message) => {
    setActionMessage(message);
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  const displayEducation = (tutorProf) => {
    const status = tutorProf.education_status;
    const completeness = tutorProf.profile_completeness || 20;
    if (!status) return `${completeness}% of the profile has been completed`;
    try {
      const parsed = JSON.parse(status);
      if (parsed.is_hsc_student) {
        return 'Running HSC/A Level/Alim Student';
      }
      return `${parsed.department || 'N/A'} at ${parsed.university || 'N/A'}`;
    } catch (e) {
      return status;
    }
  };

  const getTutorProfile = (user) => {
    if (!user || !user.tutor_profiles) return {};
    return Array.isArray(user.tutor_profiles) ? (user.tutor_profiles[0] || {}) : user.tutor_profiles;
  };

  const getGuardianProfile = (user) => {
    if (!user || !user.guardian_profiles) return {};
    return Array.isArray(user.guardian_profiles) ? (user.guardian_profiles[0] || {}) : user.guardian_profiles;
  };

  const filteredUsers = users.filter(u => {
    if (u.role !== activeTab) return false;

    const nameMatches = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatches = u.phone_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatches = u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const searchMatch = nameMatches || phoneMatches || emailMatches;

    const userStatus = u.status || 'active';
    if (filterStatus === 'All') return searchMatch;
    return searchMatch && userStatus === filterStatus;
  });

  // Count stats
  const activeCount = users.filter(u => u.role === activeTab && (u.status || 'active') === 'active').length;
  const suspendedCount = users.filter(u => u.role === activeTab && u.status === 'suspended').length;
  const deactivatedCount = users.filter(u => u.role === activeTab && u.status === 'deactivated').length;
  const pendingDeletionCount = users.filter(u => u.role === activeTab && u.status === 'pending_deletion').length;
  const verifiedTutors = users.filter(u => u.role === 'tutor' && getTutorProfile(u).is_verified).length;
  const premiumTutors = users.filter(u => u.role === 'tutor' && getTutorProfile(u).tutor_status === 'Premium Tutor').length;

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
            <CheckCircle className="w-5 h-5 text-[#86c240] shrink-0" />
            <span className="text-xs font-bold">{actionMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">User Management</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage tutor and parent/guardian accounts, suspend access, and send password reset links.</p>
        </div>
        
        {/* Tab Selection */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex w-fit self-start sm:self-center border border-slate-200/50">
          <button
            onClick={() => { setActiveTab('tutor'); setSearchTerm(''); }}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'tutor' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Tutors
          </button>
          <button
            onClick={() => { setActiveTab('guardian'); setSearchTerm(''); }}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'guardian' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Guardians
          </button>
        </div>
      </div>

      {/* Stats Counter Row */}
      <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${activeTab === 'tutor' ? 'sm:grid-cols-3 md:grid-cols-5' : 'md:grid-cols-4'}`}>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 font-bold text-[10px] sm:text-xs tracking-wider">Total {activeTab === 'tutor' ? 'Tutors' : 'Guardians'}</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">{filteredUsers.length}</span>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-green-600 font-bold text-[10px] sm:text-xs tracking-wider">Active</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">{activeCount}</span>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-rose-500 font-bold text-[10px] sm:text-xs tracking-wider">Suspended</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">{suspendedCount}</span>
        </div>
        {activeTab === 'tutor' ? (
          <>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <span className="text-[#86c240] font-bold text-[10px] sm:text-xs tracking-wider">Verified Tutors</span>
              <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">{verifiedTutors}</span>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <span className="text-purple-650 font-bold text-[10px] sm:text-xs tracking-wider">Premium Tutors</span>
              <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">{premiumTutors}</span>
            </div>
          </>
        ) : (
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <span className="text-slate-400 font-bold text-[10px] sm:text-xs tracking-wider">Total Users</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">{users.length}</span>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm justify-between">
        <div className="relative flex-1">
          <input 
            type="text"
            placeholder={`Search by name, email, phone...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#86c240] focus:border-transparent font-medium"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#86c240] cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
          <option value="pending_deletion">Pending Deletion</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-400 font-bold text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
            Loading platform users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-slate-450 font-bold">
            No {activeTab}s found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs tracking-wider">
                  <th className="p-4 pl-6">{activeTab === 'tutor' ? 'Tutor' : 'Guardian'} Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Notice</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-650">
                {filteredUsers.map(user => {
                  const isSuspended = user.status === 'suspended';
                  const isDeactivated = user.status === 'deactivated';
                  const isPendingDeletion = user.status === 'pending_deletion';
                  const tutorProf = getTutorProfile(user);
                  const guardianProf = getGuardianProfile(user);

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Name & Badge */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedUser(user)}
                            className="font-extrabold text-slate-800 hover:text-[#86c240] hover:underline text-left outline-none transition-colors"
                          >
                            {user.full_name || 'No Name'}
                          </button>
                          {activeTab === 'tutor' && tutorProf.is_verified && (
                            <CheckCircle className="w-4 h-4 text-[#86c240] fill-current text-white shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-semibold">
                          {activeTab === 'tutor' 
                            ? displayEducation(tutorProf)
                            : (guardianProf.profession || 'Guardian')
                          }
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-4 space-y-0.5">
                        <div className="text-slate-700 font-semibold flex items-center gap-1.5 text-xs">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {user.phone_number || 'No Phone'}
                        </div>
                        {user.email && (
                          <div className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {user.email}
                          </div>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="p-4 text-xs text-slate-450 font-bold">
                        {new Date(user.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Status Tag */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                          isSuspended 
                            ? 'bg-rose-50 text-rose-600 border-rose-100' 
                            : isDeactivated
                            ? 'bg-slate-50 text-slate-600 border-slate-200'
                            : isPendingDeletion
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-green-50 text-green-700 border-green-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-rose-500' : isDeactivated ? 'bg-slate-500' : isPendingDeletion ? 'bg-red-600' : 'bg-green-500'}`}></span>
                          {isSuspended ? 'Suspended' : isDeactivated ? 'Deactivated' : isPendingDeletion ? 'Pending Deletion' : 'Active'}
                        </span>
                      </td>

                      {/* Notice Column */}
                      <td className="p-4">
                        <button
                          onClick={() => handleOpenSendNotice(user)}
                          className="px-3 py-1.5 bg-[#f7fee7] hover:bg-[#86c240] hover:text-white text-[#86c240] border border-[#86c240]/30 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          Send Notice
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
                            title="Inspect Profile"
                          >
                            Inspect
                          </button>
                          
                          <button
                            onClick={() => handleSendResetPassword(user.email, user.id)}
                            disabled={resettingUserId === user.id}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-colors disabled:opacity-50"
                            title="Send Password Reset Email"
                          >
                            <RefreshCw className={`w-4 h-4 ${resettingUserId === user.id ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(user.id, user.status)}
                            disabled={updatingUserId === user.id}
                            className={`p-2 rounded-xl transition-colors border ${
                              isSuspended 
                                ? 'border-green-200 hover:border-green-400 text-green-600 hover:bg-green-50/50' 
                                : 'border-rose-200 hover:border-rose-450 text-rose-600 hover:bg-rose-50/50'
                            } disabled:opacity-50`}
                            title={isSuspended ? 'Activate User' : 'Suspend User'}
                          >
                            {isSuspended ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sliding Drawer for User Detail view */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-slate-900 z-40"
            ></motion.div>

            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 border-l border-slate-150 flex flex-col h-screen overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">User Profile Inspector</span>
                  <h2 className="text-xl font-black text-slate-800 mt-1">{selectedUser.full_name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-550 outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Status Alert Banner if Suspended */}
                {selectedUser.status === 'suspended' && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-rose-800 text-xs font-black leading-none">Account Suspended</p>
                      <p className="text-rose-600 text-[11px] font-bold mt-1.5 leading-normal">
                        This user is currently suspended. They are logged out from all active sessions and cannot sign in.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Alert Banner if Deactivated */}
                {selectedUser.status === 'deactivated' && (
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-800 text-xs font-black leading-none">User Deactivated</p>
                        <p className="text-slate-600 text-[11px] font-bold mt-1.5 leading-normal">
                          This user deactivated their own account. It is hidden from public view. Logging back in will reactivate it.
                        </p>
                      </div>
                    </div>
                    {selectedUser.deactivation_reason && (
                      <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                        <span className="font-bold text-slate-500 block mb-1">Reason for Deactivation:</span>
                        {selectedUser.deactivation_reason}
                      </div>
                    )}
                  </div>
                )}

                {/* Status Alert Banner if Pending Deletion */}
                {selectedUser.status === 'pending_deletion' && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 text-xs font-black leading-none">Deletion Requested</p>
                        <p className="text-red-600 text-[11px] font-bold mt-1.5 leading-normal">
                          Requested on {new Date(selectedUser.deletion_requested_at).toLocaleDateString()}. Account will be automatically deleted after 30 days unless they log in.
                        </p>
                      </div>
                    </div>
                    {selectedUser.deletion_reason && (
                      <div className="mt-2 p-3 bg-white border border-red-100 rounded-xl text-xs text-red-900 font-medium">
                        <span className="font-bold text-red-700 block mb-1">Reason for Deletion:</span>
                        {selectedUser.deletion_reason}
                      </div>
                    )}
                  </div>
                )}

                {/* Tutor Status Dropdown Select Card */}
                {selectedUser.role === 'tutor' && (
                  <div className="bg-[#f7fee7] border border-[#86c240]/20 rounded-3xl p-5 space-y-3 shadow-sm">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#86c240]" /> Tutor Status Management
                    </h4>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-slate-650">Tutor Status:</span>
                      <select
                        value={getTutorProfile(selectedUser).tutor_status || 'Normal Tutor'}
                        onChange={(e) => handleUpdateTutorStatus(selectedUser.id, e.target.value)}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#86c240] cursor-pointer font-sans"
                      >
                        <option value="Normal Tutor">Normal Tutor</option>
                        <option value="Verified Tutor">Verified Tutor</option>
                        <option value="Premium Tutor">Premium Tutor</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Core Account Details Card */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#eaf4df] border-2 border-[#86c240]/20 flex items-center justify-center text-[#86c240] text-2xl font-black">
                      {selectedUser.full_name ? selectedUser.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[10px] font-black tracking-wide capitalize">
                          {selectedUser.role}
                        </span>
                        {selectedUser.role === 'tutor' && (
                          <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-black tracking-wide uppercase ${
                            getTutorProfile(selectedUser).tutor_status === 'Premium Tutor' 
                              ? 'bg-purple-50 text-purple-700 border-purple-200' 
                              : getTutorProfile(selectedUser).tutor_status === 'Verified Tutor'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {getTutorProfile(selectedUser).tutor_status || 'Normal Tutor'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-800 mt-1.5">{selectedUser.full_name}</h3>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5" /> Joined {new Date(selectedUser.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs font-bold">
                    <div>
                      <span className="text-slate-400 text-[10px] block mb-1">Phone Number</span>
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-slate-400" /> {selectedUser.phone_number || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block mb-1">Email Address</span>
                      <span className="text-slate-700 flex items-center gap-1.5 truncate">
                        <Mail className="w-4 h-4 text-slate-400" /> {selectedUser.email || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Specific Details */}
                {selectedUser.role === 'tutor' ? (
                  <div className="space-y-6">
                    {/* Tutor profile data */}
                    {(() => {
                      const tp = getTutorProfile(selectedUser);
                      return (
                        <>
                          {/* CV & Credentials - IMPORTANT FIRST */}
                          {tp.cv_url && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-[#86c240]" /> Curriculum Vitae (CV)
                              </h4>
                              <div className="border border-slate-100 rounded-2xl p-4 bg-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">Tutor CV Attachment</p>
                                    <p className="text-[10px] text-slate-400 font-bold">Uploaded document / link</p>
                                  </div>
                                </div>
                                <a 
                                  href={tp.cv_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="px-4 py-2 border border-slate-200 hover:border-[#86c240] hover:text-[#86c240] rounded-xl text-xs font-bold transition-all shadow-sm bg-white"
                                >
                                  Open Document
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Academic Status Box */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <GraduationCap className="w-4 h-4 text-[#86c240]" /> Academic Status
                            </h4>
                            <div className="border border-slate-100 rounded-2xl p-4 bg-white space-y-4 text-xs font-bold text-slate-700">
                              {/* Graduation Details */}
                              <div>
                                <span className="text-[#86c240] text-[10px] uppercase tracking-wider block mb-1.5">Graduation Details</span>
                                <div className="grid grid-cols-2 gap-3.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                  <div>
                                    <span className="text-slate-400 text-[10px] block mb-0.5">University</span>
                                    <span className="text-slate-800">{tp.university || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block mb-0.5">Department</span>
                                    <span className="text-slate-800">{tp.department || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block mb-0.5">Grad Year</span>
                                    <span className="text-slate-800">{tp.grad_year || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block mb-0.5">Grad GPA</span>
                                    <span className="text-slate-800">{tp.grad_gpa || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Post Graduation Details */}
                              {(tp.post_grad_university || tp.post_grad_department) && (
                                <div>
                                  <span className="text-[#86c240] text-[10px] uppercase tracking-wider block mb-1.5">Post Graduation Details</span>
                                  <div className="grid grid-cols-2 gap-3.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                    <div>
                                      <span className="text-slate-400 text-[10px] block mb-0.5">University</span>
                                      <span className="text-slate-800">{tp.post_grad_university || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 text-[10px] block mb-0.5">Department</span>
                                      <span className="text-slate-800">{tp.post_grad_department || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 text-[10px] block mb-0.5">Graduation Year</span>
                                      <span className="text-slate-800">{tp.post_grad_year || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 text-[10px] block mb-0.5">GPA</span>
                                      <span className="text-slate-800">{tp.post_grad_gpa || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* College Details */}
                              <div>
                                <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-1.5">HSC / College Details</span>
                                <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                  <div className="col-span-2">
                                    <span className="text-slate-400 text-[10px] block">College Name</span>
                                    <span className="text-slate-800">{tp.college_name || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">Group</span>
                                    <span className="text-slate-800">{tp.college_group || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">GPA</span>
                                    <span className="text-slate-800">{tp.college_gpa || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">Board</span>
                                    <span className="text-slate-800">{tp.college_board || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">Passing Year</span>
                                    <span className="text-slate-800">{tp.college_year || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* School Details */}
                              <div>
                                <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-1.5">SSC / School Details</span>
                                <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                  <div className="col-span-2">
                                    <span className="text-slate-400 text-[10px] block">School Name</span>
                                    <span className="text-slate-800">{tp.school_name || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">Group</span>
                                    <span className="text-slate-800">{tp.school_group || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">GPA</span>
                                    <span className="text-slate-800">{tp.school_gpa || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">Board</span>
                                    <span className="text-slate-800">{tp.school_board || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">Passing Year</span>
                                    <span className="text-slate-800">{tp.school_year || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Preferences & Availability */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-[#86c240]" /> Preferences & Availability
                            </h4>
                            <div className="border border-slate-100 rounded-2xl p-4 bg-white space-y-4 text-xs font-bold text-slate-700">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Preferred Category</span>
                                  <span className="text-slate-800">{tp.preferred_category || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Experience</span>
                                  <span className="text-slate-800">{tp.experience || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Expected Salary</span>
                                  <span className="text-[#86c240] font-black">{tp.expected_salary ? `${tp.expected_salary} TK` : 'Negotiable'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Teaching Method</span>
                                  <span className="text-slate-800">{tp.teaching_method || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Preferred Courses</span>
                                  <span className="text-slate-800">{tp.preferred_courses ? tp.preferred_courses.join(', ') : 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Available Hours</span>
                                  <span className="text-slate-800">
                                    {tp.available_from && tp.available_to ? `${tp.available_from} - ${tp.available_to}` : 'N/A'}
                                  </span>
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-slate-400 text-[10px] block mb-1.5">Available Days</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {tp.available_days && tp.available_days.length > 0 ? (
                                    tp.available_days.map((d, i) => (
                                      <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-[10px] font-black uppercase">
                                        {d}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400">N/A</span>
                                  )}
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-slate-400 text-[10px] block mb-1.5">Preferred Subjects</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {tp.preferred_subjects && tp.preferred_subjects.length > 0 ? (
                                    tp.preferred_subjects.map((s, i) => (
                                      <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-[10px] font-black">
                                        {s}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400">N/A</span>
                                  )}
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-slate-400 text-[10px] block mb-1">Biography / About</span>
                                <p className="text-slate-750 leading-relaxed font-semibold whitespace-pre-wrap">{tp.bio || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Personal Details */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <User className="w-4 h-4 text-[#86c240]" /> Personal Details
                            </h4>
                            <div className="border border-slate-100 rounded-2xl p-4 bg-white space-y-4 text-xs font-bold text-slate-700">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Gender</span>
                                  <span className="text-slate-800 capitalize">{tp.gender || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Date of Birth</span>
                                  <span className="text-slate-800">{tp.dob || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">National ID (NID)</span>
                                  <span className="text-slate-800">{tp.nid || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Emergency Contact</span>
                                  <span className="text-slate-800">{tp.emergency_contact || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Father's Name</span>
                                  <span className="text-slate-800">{tp.fathers_name || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Mother's Name</span>
                                  <span className="text-slate-800">{tp.mothers_name || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-slate-400 text-[10px] block mb-0.5">Current City</span>
                                <span className="text-slate-800">{tp.current_city || 'N/A'}</span>
                              </div>
                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-slate-400 text-[10px] block mb-0.5">Living Location</span>
                                <span className="text-slate-800">{tp.living_location || 'N/A'}</span>
                              </div>
                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-slate-400 text-[10px] block mb-0.5">Full Permanent Address</span>
                                <p className="text-slate-850 leading-relaxed font-semibold">{tp.address || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Guardian profile data */}
                    {(() => {
                      const gp = getGuardianProfile(selectedUser);
                      return (
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-[#86c240]" /> Family & Home Details
                          </h4>
                          <div className="border border-slate-150 rounded-2xl p-5 bg-white space-y-4 text-xs font-bold text-slate-700">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">Profession</span>
                                <span className="text-slate-800">{gp.profession || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">City</span>
                                <span className="text-slate-800">{gp.city || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">Number of Children</span>
                                <span className="text-slate-800">{gp.number_of_children || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">Alternative Phone</span>
                                <span className="text-slate-800">{gp.alternative_phone || 'N/A'}</span>
                              </div>
                            </div>

                            {gp.profile_photo_url && (
                              <div className="border-t border-slate-100 pt-4">
                                <span className="text-slate-400 text-[10px] block mb-2">Profile Photo</span>
                                <img src={gp.profile_photo_url} alt="Profile Photo" className="w-32 h-32 rounded-xl object-cover border border-slate-200" />
                              </div>
                            )}

                            <div className="border-t border-slate-100 pt-4">
                              <span className="text-slate-400 text-[10px] block mb-1">Detailed Address</span>
                              <span className="font-semibold leading-relaxed block text-slate-800">{gp.address || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Drawer Footer Buttons */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                {selectedUser.status === 'pending_deletion' ? (
                  <button
                    onClick={() => handleDeleteInstantly(selectedUser.id)}
                    disabled={updatingUserId === selectedUser.id}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    Delete Instantly
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleSendResetPassword(selectedUser.email, selectedUser.id)}
                      className="flex-1 py-3 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded-2xl font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" /> Send Reset Link
                    </button>

                    <button
                      onClick={() => handleToggleStatus(selectedUser.id, selectedUser.status)}
                      className={`flex-1 py-3 rounded-2xl font-bold text-xs transition-colors text-white shadow-md flex items-center justify-center gap-1.5 ${
                        selectedUser.status === 'suspended'
                          ? 'bg-green-600 hover:bg-green-700 shadow-green-650/15'
                          : 'bg-rose-600 hover:bg-rose-700 shadow-rose-650/15'
                      }`}
                    >
                      {selectedUser.status === 'suspended' ? (
                        <>
                          <UserCheck className="w-4 h-4" /> Activate Account
                        </>
                      ) : (
                        <>
                          <UserMinus className="w-4 h-4" /> Suspend Account
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick Notice Modal Popup */}
      <AnimatePresence>
        {noticeTargetUser && (
          <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setNoticeTargetUser(null)}
              className="fixed inset-0 bg-slate-900"
            />
            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-150 p-6 md:p-8 max-w-lg w-full relative shadow-2xl z-10 space-y-4 font-sans"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#86c240]" />
                  <h3 className="font-extrabold text-slate-800 text-lg">Send Notice to {noticeTargetUser.full_name}</h3>
                </div>
                <button 
                  onClick={() => setNoticeTargetUser(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendNoticeSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Notice Title</label>
                  <input
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="e.g. Action Required: Profile Review"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 rounded-xl text-slate-800 text-sm font-bold focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Message Content</label>
                  <textarea
                    required
                    value={noticeMessage}
                    onChange={(e) => setNoticeMessage(e.target.value)}
                    placeholder="Write your notice message here..."
                    rows="4"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 rounded-xl text-slate-800 text-sm font-medium focus:outline-none transition-all min-h-[100px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Expiry Timer (Duration)</label>
                  <select
                    value={noticeDurationDays}
                    onChange={(e) => setNoticeDurationDays(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 rounded-xl text-slate-800 text-sm font-bold focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="1">1 Day (24 Hours)</option>
                    <option value="3">3 Days (72 Hours)</option>
                    <option value="7">7 Days (1 Week)</option>
                    <option value="14">14 Days (2 Weeks)</option>
                    <option value="30">30 Days (1 Month)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setNoticeTargetUser(null)}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingNotice}
                    className="flex-1 py-3 bg-[#86c240] hover:bg-[#6a9c31] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#86c240]/15"
                  >
                    {sendingNotice ? 'Sending...' : 'Send Notice'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminUsers;
