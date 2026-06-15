import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, Shield, Award, Users, CheckCircle, Clock, X, 
  Mail, Phone, BookOpen, GraduationCap, FileText, UserCheck, 
  UserMinus, RefreshCw, AlertTriangle, ShieldAlert
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

  const showToast = (message) => {
    setActionMessage(message);
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  const displayEducation = (status) => {
    if (!status) return 'Profile Not Completed';
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
  const verifiedTutors = users.filter(u => u.role === 'tutor' && getTutorProfile(u).is_verified).length;

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <span className="text-[#86c240] font-bold text-[10px] sm:text-xs tracking-wider">Verified Tutors</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">{verifiedTutors}</span>
          </div>
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
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-650">
                {filteredUsers.map(user => {
                  const isSuspended = user.status === 'suspended';
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
                        <div className="text-xs text-slate-400 mt-0.5">
                          {activeTab === 'tutor' 
                            ? displayEducation(tutorProf.education_status)
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
                            : 'bg-green-50 text-green-700 border-green-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-rose-500' : 'bg-green-500'}`}></span>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
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

                {/* Core Account Details Card */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#eaf4df] border-2 border-[#86c240]/20 flex items-center justify-center text-[#86c240] text-2xl font-black">
                      {selectedUser.full_name ? selectedUser.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[10px] font-black tracking-wide capitalize">
                        {selectedUser.role}
                      </span>
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
                      let edu = {};
                      let isPlainEdu = false;
                      if (tp.education_status) {
                        try { 
                          edu = JSON.parse(tp.education_status); 
                        } catch(e) {
                          isPlainEdu = true;
                        }
                      }

                      return (
                        <>
                          {/* Education Box */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <GraduationCap className="w-4 h-4 text-[#86c240]" /> Academic Status
                            </h4>
                            <div className="border border-slate-100 rounded-2xl p-4 bg-white space-y-3 text-xs">
                              {isPlainEdu ? (
                                <div>
                                  <span className="text-slate-400 block mb-0.5">Details</span>
                                  <span className="font-bold text-slate-800">{tp.education_status}</span>
                                </div>
                              ) : edu.is_hsc_student ? (
                                <div>
                                  <span className="text-slate-400 block mb-0.5">Category</span>
                                  <span className="font-bold text-slate-800">Running HSC / A Level / Alim Student</span>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-slate-400 block mb-0.5">University</span>
                                    <span className="font-bold text-slate-850">{edu.university || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block mb-0.5">Department</span>
                                    <span className="font-bold text-slate-850">{edu.department || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block mb-0.5">Degree Type</span>
                                    <span className="font-bold text-slate-850">{edu.degree_type || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block mb-0.5">Year/Semester</span>
                                    <span className="font-bold text-slate-850">{edu.year || 'N/A'}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Subjects & Bio */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-[#86c240]" /> Tuition Preferences
                            </h4>
                            <div className="border border-slate-100 rounded-2xl p-4 bg-white space-y-3.5 text-xs">
                              <div>
                                <span className="text-slate-400 block mb-1.5">Preferred Subjects</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {tp.preferred_subjects && tp.preferred_subjects.length > 0 ? (
                                    tp.preferred_subjects.map((s, i) => (
                                      <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg font-bold text-[10px]">
                                        {s}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 font-semibold">No subjects preferred yet.</span>
                                  )}
                                </div>
                              </div>

                              <div className="border-t border-slate-50 pt-3">
                                <span className="text-slate-400 block mb-1">Biography / About</span>
                                <p className="text-slate-700 leading-relaxed font-medium">
                                  {tp.bio || 'This tutor hasn\'t added a biography yet.'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* CV & Credentials */}
                          {tp.cv_url && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-[#86c240]" /> Attachments & Credentials
                              </h4>
                              <div className="border border-slate-100 rounded-2xl p-4 bg-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">Curriculum Vitae (CV)</p>
                                    <p className="text-[10px] text-slate-400 font-bold">Uploaded PDF document</p>
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
                          <div className="border border-slate-100 rounded-2xl p-5 bg-white space-y-4 text-xs font-bold text-slate-700">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">Profession</span>
                                <span>{gp.profession || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">City</span>
                                <span>{gp.city || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">Number of Children</span>
                                <span>{gp.number_of_children || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">Alternative Phone</span>
                                <span>{gp.alternative_phone || 'N/A'}</span>
                              </div>
                            </div>

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
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminUsers;
