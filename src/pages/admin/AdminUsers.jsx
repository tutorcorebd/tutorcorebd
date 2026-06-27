import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, Shield, Award, Users, User, CheckCircle, Clock, X, 
  Mail, Phone, BookOpen, GraduationCap, FileText, UserCheck, 
  UserMinus, RefreshCw, AlertTriangle, ShieldAlert, Megaphone,
  Plus, Calendar, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VerifiedBadge from '../../components/common/VerifiedBadge';
import PremiumBadge from '../../components/common/PremiumBadge';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24
    }
  }
};

const parsePgArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const clean = val.replace(/^\{|\}$/g, '');
    if (!clean) return [];
    return clean.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
  }
  return [];
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tutor'); // 'tutor' or 'guardian'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'active', 'suspended'
  const [filterVerified, setFilterVerified] = useState('All');
  const [filterPremium, setFilterPremium] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [rlsErrorTable, setRlsErrorTable] = useState(null);

  // Document Viewer Modal state
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerTitle, setViewerTitle] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    
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
          setShowSchemaModal(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterStatus, filterVerified, filterPremium, searchTerm]);

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
      if (err.message?.toLowerCase().includes('row-level security') || err.message?.toLowerCase().includes('rls')) {
        setRlsErrorTable('users');
      } else {
        alert('Failed to update user status: ' + err.message);
      }
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
      if (err.message?.toLowerCase().includes('row-level security') || err.message?.toLowerCase().includes('rls')) {
        setRlsErrorTable('users');
      } else {
        alert('Failed to delete user: ' + err.message);
      }
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

  const handleToggleTutorStatus = async (userId, field, currentValue) => {
    try {
      const { error } = await supabase
        .from('tutor_profiles')
        .update({ [field]: !currentValue })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => {
        if (u.id === userId) {
          const updatedProfiles = Array.isArray(u.tutor_profiles)
            ? [{ ...u.tutor_profiles[0], [field]: !currentValue }]
            : { ...u.tutor_profiles, [field]: !currentValue };
          return { ...u, tutor_profiles: updatedProfiles };
        }
        return u;
      }));

      // Sync selected user drawer
      if (selectedUser && selectedUser.id === userId) {
        const updatedProfiles = Array.isArray(selectedUser.tutor_profiles)
          ? [{ ...selectedUser.tutor_profiles[0], [field]: !currentValue }]
          : { ...selectedUser.tutor_profiles, [field]: !currentValue };
        setSelectedUser({ ...selectedUser, tutor_profiles: updatedProfiles });
      }

      showToast(`Tutor status updated successfully.`);
    } catch (err) {
      console.error(`Error updating tutor status:`, err);
      if (err.message?.toLowerCase().includes('row-level security') || err.message?.toLowerCase().includes('rls')) {
        setRlsErrorTable('tutor_profiles');
      } else {
        alert('Failed to update tutor status: ' + err.message);
      }
    }
  };

  const handleUpdateTutorRating = async (userId, newRating) => {
    try {
      const { error } = await supabase
        .from('tutor_profiles')
        .upsert({ 
          user_id: userId,
          rating: newRating
        });

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => {
        if (u.id === userId) {
          const updatedProfiles = Array.isArray(u.tutor_profiles)
            ? [{ ...u.tutor_profiles[0], rating: newRating }]
            : { ...u.tutor_profiles, rating: newRating };
          return { ...u, tutor_profiles: updatedProfiles };
        }
        return u;
      }));

      // Sync selected user drawer
      if (selectedUser && selectedUser.id === userId) {
        const updatedProfiles = Array.isArray(selectedUser.tutor_profiles)
          ? [{ ...selectedUser.tutor_profiles[0], rating: newRating }]
          : { ...selectedUser.tutor_profiles, rating: newRating };
        setSelectedUser({ ...selectedUser, tutor_profiles: updatedProfiles });
      }

      showToast(`Tutor rating updated to ${newRating} Stars.`);
    } catch (err) {
      console.error('Error updating tutor rating:', err);
      if (err.message?.toLowerCase().includes('row-level security') || err.message?.toLowerCase().includes('rls')) {
        setRlsErrorTable('tutor_profiles');
      } else {
        alert('Failed to update rating: ' + err.message);
      }
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
    const statusMatch = filterStatus === 'All' || userStatus === filterStatus;

    let verifiedMatch = true;
    let premiumMatch = true;

    if (activeTab === 'tutor') {
      const tp = getTutorProfile(u);
      if (filterVerified === 'Verified') verifiedMatch = tp.is_verified;
      if (filterVerified === 'Unverified') verifiedMatch = !tp.is_verified;
      
      if (filterPremium === 'Premium') premiumMatch = tp.is_premium;
      if (filterPremium === 'Standard') premiumMatch = !tp.is_premium;
    }

    return searchMatch && statusMatch && verifiedMatch && premiumMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Count stats
  const activeCount = users.filter(u => u.role === activeTab && (u.status || 'active') === 'active').length;
  const suspendedCount = users.filter(u => u.role === activeTab && u.status === 'suspended').length;
  const deactivatedCount = users.filter(u => u.role === activeTab && u.status === 'deactivated').length;
  const pendingDeletionCount = users.filter(u => u.role === activeTab && u.status === 'pending_deletion').length;
  const verifiedTutors = users.filter(u => u.role === 'tutor' && getTutorProfile(u).is_verified).length;
  const premiumTutors = users.filter(u => u.role === 'tutor' && getTutorProfile(u).is_premium).length;

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
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm justify-between">
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
        <div className="flex flex-wrap items-center gap-3">
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
          {activeTab === 'tutor' && (
            <>
              <select
                value={filterVerified}
                onChange={(e) => setFilterVerified(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#86c240] cursor-pointer"
              >
                <option value="All">All Verification</option>
                <option value="Verified">Verified</option>
                <option value="Unverified">Unverified</option>
              </select>
              <select
                value={filterPremium}
                onChange={(e) => setFilterPremium(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#86c240] cursor-pointer"
              >
                <option value="All">All Premium</option>
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
              </select>
            </>
          )}
        </div>
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
                <AnimatePresence mode="popLayout">
                  {currentUsers.map(user => {
                    const isSuspended = user.status === 'suspended';
                    const isDeactivated = user.status === 'deactivated';
                    const isPendingDeletion = user.status === 'pending_deletion';
                    const tutorProf = getTutorProfile(user);
                    const guardianProf = getGuardianProfile(user);

                    return (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={user.id} 
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
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
                            <VerifiedBadge size={16} />
                          )}
                          {activeTab === 'tutor' && tutorProf.is_premium && (
                            <PremiumBadge size={16} position="top" />
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
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filteredUsers.length > 0 && (
          <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-semibold">
              Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="text-slate-800">{filteredUsers.length}</span> results
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                        currentPage === pageNum 
                          ? 'bg-[#86c240] text-white border border-[#75ad36]' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Next
              </button>
            </div>
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
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div>
                  <span className="text-sm font-medium text-slate-500 capitalize">{selectedUser.role} Profile Details</span>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">{selectedUser.full_name || 'No Name'}</h2>
                    {selectedUser.role === 'tutor' && getTutorProfile(selectedUser).is_verified && (
                      <VerifiedBadge size={22} position="bottom" />
                    )}
                    {selectedUser.role === 'tutor' && getTutorProfile(selectedUser).is_premium && (
                      <PremiumBadge size={22} position="bottom" />
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2.5 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600 outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                
                {/* Status Alert Banner if Suspended */}
                {selectedUser.status === 'suspended' && (
                  <motion.div variants={itemVariants} className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-rose-800 text-xs font-bold leading-none">Account suspended</p>
                      <p className="text-rose-600 text-[11px] font-medium mt-1.5 leading-normal">
                        This user is currently suspended. They are logged out from all active sessions and cannot sign in.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Status Alert Banner if Deactivated */}
                {selectedUser.status === 'deactivated' && (
                  <motion.div variants={itemVariants} className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-800 text-xs font-bold leading-none">User deactivated</p>
                        <p className="text-slate-600 text-[11px] font-medium mt-1.5 leading-normal">
                          This user deactivated their own account. It is hidden from public view. Logging back in will reactivate it.
                        </p>
                      </div>
                    </div>
                    {selectedUser.deactivation_reason && (
                      <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                        <span className="font-semibold text-slate-500 block mb-1">Reason for deactivation:</span>
                        {selectedUser.deactivation_reason}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Status Alert Banner if Pending Deletion */}
                {selectedUser.status === 'pending_deletion' && (
                  <motion.div variants={itemVariants} className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 text-xs font-bold leading-none">Deletion requested</p>
                        <p className="text-red-600 text-[11px] font-medium mt-1.5 leading-normal">
                          Requested on {new Date(selectedUser.deletion_requested_at).toLocaleDateString()}. Account will be automatically deleted after 30 days unless they log in.
                        </p>
                      </div>
                    </div>
                    {selectedUser.deletion_reason && (
                      <div className="mt-2 p-3 bg-white border border-red-100 rounded-xl text-xs text-red-900 font-medium">
                        <span className="font-semibold text-red-700 block mb-1">Reason for deletion:</span>
                        {selectedUser.deletion_reason}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Tutor Status Dropdown Select Card */}
                {selectedUser.role === 'tutor' && (
                  <motion.div variants={itemVariants} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-3 shadow-sm">
                    <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#86c240]" /> Tutor status & rating management
                    </h4>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-medium text-slate-600">Verified status:</span>
                      <button
                        onClick={() => handleToggleTutorStatus(selectedUser.id, 'is_verified', getTutorProfile(selectedUser).is_verified)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          getTutorProfile(selectedUser).is_verified 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {getTutorProfile(selectedUser).is_verified ? 'Verified' : 'Unverified'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-200/60">
                      <span className="text-xs font-medium text-slate-600">Premium status:</span>
                      <button
                        onClick={() => handleToggleTutorStatus(selectedUser.id, 'is_premium', getTutorProfile(selectedUser).is_premium)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          getTutorProfile(selectedUser).is_premium 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {getTutorProfile(selectedUser).is_premium ? 'Premium' : 'Standard'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-200/60">
                      <span className="text-xs font-medium text-slate-600">Tutor rating:</span>
                      <select
                        value={getTutorProfile(selectedUser).rating || 0}
                        onChange={(e) => handleUpdateTutorRating(selectedUser.id, parseInt(e.target.value, 10))}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-850 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-sans"
                      >
                        <option value={0}>No Rating (0 Stars)</option>
                        <option value={1}>1 Star</option>
                        <option value={2}>2 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={5}>5 Stars</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* Core Account Details Card */}
                <motion.div variants={itemVariants} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 text-2xl font-medium shadow-sm">
                      {selectedUser.full_name ? selectedUser.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium capitalize">
                          {selectedUser.role}
                        </span>
                        {selectedUser.role === 'tutor' && (
                          <>
                            {getTutorProfile(selectedUser).is_premium && (
                              <span className="px-3 py-1 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-amber-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm border border-amber-300">
                                <Sparkles className="w-3.5 h-3.5 text-amber-800 animate-pulse" />
                                Premium Member
                              </span>
                            )}
                            {getTutorProfile(selectedUser).is_verified && (
                              <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                Verified
                              </span>
                            )}
                            {!getTutorProfile(selectedUser).is_premium && !getTutorProfile(selectedUser).is_verified && (
                              <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-xs font-medium">
                                Normal Tutor
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 tracking-tight">{selectedUser.full_name}</h3>
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" /> Joined {new Date(selectedUser.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-sm font-medium">
                    <div>
                      <span className="text-slate-500 text-xs block mb-1.5">Phone number</span>
                      <span className="text-slate-800 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" /> {selectedUser.phone_number || 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-1.5">Email address</span>
                      <span className="text-slate-800 flex items-center gap-2 truncate">
                        <Mail className="w-4 h-4 text-slate-400" /> {selectedUser.email || 'Not provided'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Role Specific Details */}
                {selectedUser.role === 'tutor' ? (
                  <div className="space-y-6">
                    {/* Tutor profile data */}
                    {(() => {
                      const tp = getTutorProfile(selectedUser);
                      return (
                        <>
                          {/* Comprehensive Profile Information */}
                          <motion.div variants={itemVariants} className="space-y-3">
                            <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                              <User className="w-5 h-5 text-[#86c240]" /> Profile Information
                            </h4>
                            <div className="border border-slate-100 rounded-2xl p-4 bg-white space-y-4 shadow-sm text-sm">
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-slate-400 text-xs font-bold block mb-1">University / College</span>
                                  <span className="text-slate-800 font-semibold">{tp.university || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-xs font-bold block mb-1">Department / Background</span>
                                  <span className="text-slate-800 font-semibold">{tp.department || tp.background || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-xs font-bold block mb-1">Current City</span>
                                  <span className="text-slate-800 font-semibold">{tp.current_city || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-xs font-bold block mb-1">Preferred Locations</span>
                                  <span className="text-slate-800 font-semibold">
                                    {tp.preferred_locations?.length > 0 ? tp.preferred_locations.join(', ') : 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-xs font-bold block mb-1">Education Status</span>
                                  <span className="text-slate-800 font-semibold">{tp.education_status || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-xs font-bold block mb-1">Teaching Experience</span>
                                  <span className="text-slate-800 font-semibold">{tp.experience ? `${tp.experience} Years` : 'N/A'}</span>
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="text-slate-400 text-xs font-bold block mb-1">Social Profiles</span>
                                  <div className="flex items-center gap-4 mt-1">
                                    {tp.facebook_link ? (
                                      <a href={tp.facebook_link.startsWith('http') ? tp.facebook_link : `https://${tp.facebook_link}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-bold text-xs underline decoration-blue-300 underline-offset-2">
                                        Facebook Profile
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 text-xs font-medium line-through">No Facebook</span>
                                    )}
                                    {tp.linkedin_link ? (
                                      <a href={tp.linkedin_link.startsWith('http') ? tp.linkedin_link : `https://${tp.linkedin_link}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-bold text-xs underline decoration-blue-300 underline-offset-2">
                                        LinkedIn Profile
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 text-xs font-medium line-through">No LinkedIn</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-100">
                                <span className="text-slate-400 text-xs font-bold block mb-1">Preferred Subjects</span>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {tp.preferred_subjects?.length > 0 ? (
                                    tp.preferred_subjects.map((sub, idx) => (
                                      <span key={idx} className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-bold">
                                        {sub}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-500 font-medium">N/A</span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-100">
                                <span className="text-slate-400 text-xs font-bold block mb-1">Preferred Classes / Categories</span>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {tp.preferred_classes?.length > 0 ? (
                                    tp.preferred_classes.map((cls, idx) => (
                                      <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[11px] font-bold">
                                        {cls}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-500 font-medium">N/A</span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-100">
                                <span className="text-slate-400 text-xs font-bold block mb-1">About Yourself</span>
                                <p className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                                  {tp.about_yourself || tp.bio || 'Not provided.'}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-slate-100">
                                <span className="text-slate-400 text-xs font-bold block mb-1">Reasons for Getting Hired</span>
                                <p className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                                  {tp.reasons_for_hiring || 'Not provided.'}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-slate-100">
                                <span className="text-slate-400 text-xs font-bold block mb-1">Tuition Experiences</span>
                                <p className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                                  {tp.tuition_experience_details || 'Not provided.'}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-slate-100">
                                <span className="text-slate-400 text-xs font-bold block mb-1">Personal Motivation</span>
                                <p className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                                  {tp.personal_motivation || 'Not provided.'}
                                </p>
                              </div>

                            </div>
                          </motion.div>

                          {/* Tutor Credentials & Uploaded Documents */}
                          <motion.div variants={itemVariants} className="space-y-3">
                            <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-[#86c240]" /> Credentials & Documents
                            </h4>
                            <div className="border border-slate-100 rounded-2xl p-4 bg-white space-y-3 shadow-sm">
                              {/* CV */}
                              {tp.cv_url && (
                                <div className="border border-green-100 rounded-xl p-3.5 bg-green-50/20 flex items-center justify-between hover:bg-green-50/40 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#86c240]/10 text-[#86c240] rounded-xl flex items-center justify-center shrink-0 border border-[#86c240]/20">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-slate-800">Curriculum Vitae (CV)</p>
                                      <p className="text-[10px] text-slate-400">Main profile CV attachment</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setViewerUrl(tp.cv_url);
                                      setViewerTitle('Curriculum Vitae (CV) - ' + selectedUser.full_name);
                                    }}
                                    className="px-3.5 py-2 border border-[#86c240]/30 hover:bg-[#86c240] hover:text-white text-[#86c240] rounded-xl text-xs font-bold transition-all shadow-sm bg-white"
                                  >
                                    Open document
                                  </button>
                                </div>
                              )}

                              {/* NID Card */}
                              <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 flex items-center justify-between hover:border-green-200 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tp.nid_url ? 'bg-[#86c240]/10 text-[#86c240] border-[#86c240]/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                    <Shield className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                      National ID Card (NID)
                                      <span className="text-[9px] px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded font-bold border border-rose-100">Mandatory</span>
                                    </p>
                                    <p className="text-[10px] text-slate-400">{tp.nid_url ? 'Uploaded successfully' : 'Not uploaded yet'}</p>
                                  </div>
                                </div>
                                {tp.nid_url ? (
                                  <button 
                                    onClick={() => {
                                      setViewerUrl(tp.nid_url);
                                      setViewerTitle('National ID Card (NID) - ' + selectedUser.full_name);
                                    }}
                                    className="px-3.5 py-2 border border-[#86c240]/30 hover:bg-[#86c240] hover:text-white text-[#86c240] rounded-xl text-xs font-bold transition-all shadow-sm bg-white"
                                  >
                                    Open document
                                  </button>
                                ) : (
                                  <span className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100">
                                    Missing
                                  </span>
                                )}
                              </div>

                              {/* University ID Card */}
                              <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 flex items-center justify-between hover:border-green-200 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tp.varsity_id_url ? 'bg-[#86c240]/10 text-[#86c240] border-[#86c240]/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                    <GraduationCap className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                      University ID Card
                                      <span className="text-[9px] px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded font-bold border border-rose-100">Mandatory</span>
                                    </p>
                                    <p className="text-[10px] text-slate-400">{tp.varsity_id_url ? 'Uploaded successfully' : 'Not uploaded yet'}</p>
                                  </div>
                                </div>
                                {tp.varsity_id_url ? (
                                  <button 
                                    onClick={() => {
                                      setViewerUrl(tp.varsity_id_url);
                                      setViewerTitle('University ID Card - ' + selectedUser.full_name);
                                    }}
                                    className="px-3.5 py-2 border border-[#86c240]/30 hover:bg-[#86c240] hover:text-white text-[#86c240] rounded-xl text-xs font-bold transition-all shadow-sm bg-white"
                                  >
                                    Open document
                                  </button>
                                ) : (
                                  <span className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100">
                                    Missing
                                  </span>
                                )}
                              </div>

                              {/* HSC Certificate */}
                              {tp.hsc_cert_url && (
                                <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 flex items-center justify-between hover:border-green-200 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#86c240]/10 text-[#86c240] rounded-xl flex items-center justify-center shrink-0 border border-[#86c240]/20">
                                      <Award className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        HSC Certificate
                                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold border border-slate-200">Optional</span>
                                      </p>
                                      <p className="text-[10px] text-slate-400">PDF document attachment</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setViewerUrl(tp.hsc_cert_url);
                                      setViewerTitle('HSC Certificate - ' + selectedUser.full_name);
                                    }}
                                    className="px-3.5 py-2 border border-[#86c240]/30 hover:bg-[#86c240] hover:text-white text-[#86c240] rounded-xl text-xs font-bold transition-all shadow-sm bg-white"
                                  >
                                    Open PDF
                                  </button>
                                </div>
                              )}

                              {/* SSC Certificate */}
                              {tp.ssc_cert_url && (
                                <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 flex items-center justify-between hover:border-green-200 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#86c240]/10 text-[#86c240] rounded-xl flex items-center justify-center shrink-0 border border-[#86c240]/20">
                                      <Award className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        SSC Certificate
                                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold border border-slate-200">Optional</span>
                                      </p>
                                      <p className="text-[10px] text-slate-400">PDF document attachment</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setViewerUrl(tp.ssc_cert_url);
                                      setViewerTitle('SSC Certificate - ' + selectedUser.full_name);
                                    }}
                                    className="px-3.5 py-2 border border-[#86c240]/30 hover:bg-[#86c240] hover:text-white text-[#86c240] rounded-xl text-xs font-bold transition-all shadow-sm bg-white"
                                  >
                                    Open PDF
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>


                          {/* Academic Status Box */}
                          <motion.div variants={itemVariants} className="space-y-3">
                            <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                              <GraduationCap className="w-5 h-5 text-[#86c240]" /> Academic Status
                            </h4>
                            <div className="border border-slate-100 rounded-2xl p-5 bg-white space-y-6 text-sm font-medium text-slate-700 shadow-sm">
                              {/* Graduation Details */}
                              <div>
                                <span className="text-[#86c240] text-xs font-semibold block mb-2">Graduation details</span>
                                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                  <div>
                                    <span className="text-slate-500 text-xs block mb-1">University</span>
                                    <span className="text-slate-800">{tp.university || 'Not specified'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block mb-0.5">Department</span>
                                    <span className="text-slate-800 font-medium">{tp.department || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block mb-0.5">Grad year</span>
                                    <span className="text-slate-800 font-medium">{tp.grad_year || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block mb-0.5">Grad GPA</span>
                                    <span className="text-slate-800 font-medium">{tp.grad_gpa || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Post Graduation Details */}
                              {(tp.post_grad_university || tp.post_grad_department) && (
                                <div>
                                  <span className="text-primary text-[10px] font-semibold block mb-1.5">Post graduation details</span>
                                  <div className="grid grid-cols-2 gap-3.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                                    <div>
                                      <span className="text-slate-400 text-[10px] block mb-0.5">University</span>
                                      <span className="text-slate-800 font-medium">{tp.post_grad_university || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 text-[10px] block mb-0.5">Department</span>
                                      <span className="text-slate-800 font-medium">{tp.post_grad_department || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 text-[10px] block mb-0.5">Graduation year</span>
                                      <span className="text-slate-800 font-medium">{tp.post_grad_year || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 text-[10px] block mb-0.5">GPA</span>
                                      <span className="text-slate-800 font-medium">{tp.post_grad_gpa || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* College Details */}
                              <div>
                                <span className="text-slate-400 text-[10px] font-semibold block mb-1.5">HSC / College details</span>
                                <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                                  <div className="col-span-2">
                                    <span className="text-slate-400 text-[10px] block">College name</span>
                                    <span className="text-slate-800 font-medium">{tp.college_name || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">Group</span>
                                    <span className="text-slate-800 font-medium">{tp.college_group || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">GPA</span>
                                    <span className="text-slate-800 font-medium">{tp.college_gpa || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">Board</span>
                                    <span className="text-slate-800 font-medium">{tp.college_board || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">Passing year</span>
                                    <span className="text-slate-800 font-medium">{tp.college_year || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* School Details */}
                              <div>
                                <span className="text-slate-400 text-[10px] font-semibold block mb-1.5">SSC / School details</span>
                                <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                                  <div className="col-span-2">
                                    <span className="text-slate-400 text-[10px] block">School name</span>
                                    <span className="text-slate-800 font-medium">{tp.school_name || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">Group</span>
                                    <span className="text-slate-800 font-medium">{tp.school_group || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">GPA</span>
                                    <span className="text-slate-800 font-medium">{tp.school_gpa || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">Board</span>
                                    <span className="text-slate-800 font-medium">{tp.school_board || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[10px] block">Passing year</span>
                                    <span className="text-slate-800 font-medium">{tp.school_year || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>

                          {/* Preferences & Availability */}
                          <motion.div variants={itemVariants} className="space-y-3">
                            <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-[#86c240]" /> Preferences & availability
                            </h4>
                            <div className="border border-slate-100 rounded-2xl p-4 bg-white space-y-4 text-xs font-semibold text-slate-700">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Preferred category</span>
                                  <span className="text-slate-800 font-medium">{tp.preferred_category || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Experience</span>
                                  <span className="text-slate-800 font-medium">{tp.experience || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Expected salary</span>
                                  <span className="text-[#86c240] font-semibold">{tp.expected_salary ? `${tp.expected_salary} TK` : 'Negotiable'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Teaching method</span>
                                  <span className="text-slate-800 font-medium">{tp.teaching_method || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Preferred courses</span>
                                  <span className="text-slate-800 font-medium">{parsePgArray(tp.preferred_courses).join(', ') || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Available hours</span>
                                  <span className="text-slate-800 font-medium">
                                    {tp.available_from && tp.available_to ? `${tp.available_from} - ${tp.available_to}` : 'N/A'}
                                  </span>
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-slate-400 text-[10px] block mb-1.5">Available days</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {(() => {
                                    const days = parsePgArray(tp.available_days);
                                    return days.length > 0 ? (
                                      days.map((d, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-[10px] font-semibold capitalize">
                                          {d}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 font-medium">N/A</span>
                                    );
                                  })()}
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-slate-400 text-[10px] block mb-1.5">Preferred subjects</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {(() => {
                                    const subs = parsePgArray(tp.preferred_subjects);
                                    return subs.length > 0 ? (
                                      subs.map((s, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-[10px] font-semibold">
                                          {s}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 font-medium">N/A</span>
                                    );
                                  })()}
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-slate-400 text-[10px] block mb-1">Biography / About</span>
                                <p className="text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">{tp.bio || 'N/A'}</p>
                              </div>
                            </div>
                          </motion.div>

                          {/* Personal Details */}
                          <motion.div variants={itemVariants} className="space-y-3">
                            <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                              <User className="w-4 h-4 text-[#86c240]" /> Personal details
                            </h4>
                            <div className="border border-slate-100 rounded-2xl p-4 bg-white space-y-4 text-xs font-semibold text-slate-700">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Gender</span>
                                  <span className="text-slate-800 capitalize font-medium">{tp.gender || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Date of birth</span>
                                  <span className="text-slate-800 font-medium">{tp.dob || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">National ID (NID)</span>
                                  <span className="text-slate-800 font-medium">{tp.nid || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Emergency contact</span>
                                  <span className="text-slate-800 font-medium">{tp.emergency_contact || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Father's name</span>
                                  <span className="text-slate-800 font-medium">{tp.fathers_name || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Mother's name</span>
                                  <span className="text-slate-800 font-medium">{tp.mothers_name || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Blood Group</span>
                                  <span className="text-rose-600 font-bold">{tp.blood_group || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block mb-0.5">Religion</span>
                                  <span className="text-slate-800 font-medium">{tp.religion || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-slate-400 text-[10px] block mb-0.5">Current city</span>
                                <span className="text-slate-800 font-medium">{tp.current_city || 'N/A'}</span>
                              </div>
                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-slate-400 text-[10px] block mb-0.5">Living location</span>
                                <span className="text-slate-800 font-medium">{tp.living_location || 'N/A'}</span>
                              </div>
                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-slate-400 text-[10px] block mb-0.5">Full permanent address</span>
                                <p className="text-slate-800 leading-relaxed font-normal">{tp.address || 'N/A'}</p>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <motion.div variants={itemVariants} className="space-y-6">
                    {/* Guardian profile data */}
                    {(() => {
                      const gp = getGuardianProfile(selectedUser);
                      return (
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-[#86c240]" /> Family & home details
                          </h4>
                          <div className="border border-slate-150 rounded-2xl p-5 bg-white space-y-4 text-xs font-semibold text-slate-700">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">Profession</span>
                                <span className="text-slate-800 font-medium">{gp.profession || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">City</span>
                                <span className="text-slate-800 font-medium">{gp.city || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">Number of children</span>
                                <span className="text-slate-800 font-medium">{gp.number_of_children || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block mb-1">Alternative phone</span>
                                <span className="text-slate-800 font-medium">{gp.alternative_phone || 'N/A'}</span>
                              </div>
                            </div>

                            {gp.profile_photo_url && (
                              <div className="border-t border-slate-100 pt-4">
                                <span className="text-slate-400 text-[10px] block mb-2">Profile photo</span>
                                <img src={gp.profile_photo_url} alt="Profile photo" className="w-32 h-32 rounded-xl object-cover border border-slate-200" />
                              </div>
                            )}

                            <div className="border-t border-slate-100 pt-4">
                              <span className="text-slate-400 text-[10px] block mb-1">Detailed address</span>
                              <span className="font-normal leading-relaxed block text-slate-800">{gp.address || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </motion.div>

              {/* Drawer Footer Buttons */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                {selectedUser.status === 'pending_deletion' ? (
                  <button
                    onClick={() => handleDeleteInstantly(selectedUser.id)}
                    disabled={updatingUserId === selectedUser.id}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    Delete Instantly
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleSendResetPassword(selectedUser.email, selectedUser.id)}
                      className="flex-1 py-3 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded-2xl font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" /> Send Reset Link
                    </button>

                    <button
                      onClick={() => handleToggleStatus(selectedUser.id, selectedUser.status)}
                      className={`flex-1 py-3 rounded-2xl font-semibold text-xs transition-colors text-white shadow-md flex items-center justify-center gap-1.5 ${
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

      {/* Database Schema Mismatch Modal */}
      <AnimatePresence>
        {showSchemaModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSchemaModal(false)}
              className="fixed inset-0 bg-slate-900"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-xl w-full relative shadow-2xl z-[101] space-y-4 font-sans text-left"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Database schema sync required</h3>
                  <p className="text-xs text-slate-400 font-medium">Missing columns detected in public.users</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
                <p>
                  The admin panel detected that the <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono font-semibold">email</code> column is missing from the <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono font-semibold">public.users</code> table.
                </p>
                <p>
                  To sync user emails and enable proper membership modifications, please run the following SQL script in your **Supabase SQL Editor**:
                </p>
              </div>

              {/* SQL Script Container */}
              <div className="relative bg-slate-900 rounded-xl overflow-hidden p-4 font-mono text-[10px] text-slate-350 max-h-48 overflow-y-auto border border-slate-800">
                <pre className="whitespace-pre">{`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;

UPDATE public.users u
SET email = a.email
FROM auth.users a
WHERE u.id = a.id AND u.email IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, phone_number, email, role, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    new.raw_user_meta_data->>'phone_number',
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::text, 'tutor')::user_role,
    'active'
  );

  -- Automatically insert corresponding empty profiles
  IF COALESCE((new.raw_user_meta_data->>'role')::text, 'tutor') = 'tutor' THEN
    INSERT INTO public.tutor_profiles (user_id) VALUES (new.id);
  ELSIF COALESCE((new.raw_user_meta_data->>'role')::text, 'tutor') = 'guardian' THEN
    INSERT INTO public.guardian_profiles (user_id) VALUES (new.id);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`}</pre>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    const sql = `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;\n\nUPDATE public.users u\nSET email = a.email\nFROM auth.users a\nWHERE u.id = a.id AND u.email IS NULL;\n\nCREATE OR REPLACE FUNCTION public.handle_new_user()\nRETURNS trigger AS $$\nBEGIN\n  INSERT INTO public.users (id, full_name, phone_number, email, role, status)\n  VALUES (\n    new.id,\n    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),\n    new.raw_user_meta_data->>'phone_number',\n    new.email,\n    COALESCE((new.raw_user_meta_data->>'role')::text, 'tutor')::user_role,\n    'active'\n  );\n\n  -- Automatically insert corresponding empty profiles\n  IF COALESCE((new.raw_user_meta_data->>'role')::text, 'tutor') = 'tutor' THEN\n    INSERT INTO public.tutor_profiles (user_id) VALUES (new.id);\n  ELSIF COALESCE((new.raw_user_meta_data->>'role')::text, 'tutor') = 'guardian' THEN\n    INSERT INTO public.guardian_profiles (user_id) VALUES (new.id);\n  END IF;\n\n  RETURN new;\nEND;\n$$ LANGUAGE plpgsql SECURITY DEFINER;\n\nDROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;\nCREATE TRIGGER on_auth_user_created\n  AFTER INSERT ON auth.users\n  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;
                    navigator.clipboard.writeText(sql);
                    alert("SQL script copied to clipboard!");
                  }}
                  className="flex-grow py-3 bg-[#86c240] hover:bg-[#6a9c31] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#86c240]/15 flex items-center justify-center gap-1.5"
                >
                  Copy SQL Script
                </button>
                <button
                  onClick={() => setShowSchemaModal(false)}
                  className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-bold transition-all"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Row-Level Security Error Modal */}
      <AnimatePresence>
        {rlsErrorTable && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setRlsErrorTable(null)}
              className="fixed inset-0 bg-slate-900"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-xl w-full relative shadow-2xl z-[101] space-y-4 font-sans text-left"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Row-level security policy violation</h3>
                  <p className="text-xs text-rose-550 font-medium">Missing database permissions on public.{rlsErrorTable}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
                <p>
                  The admin panel failed to update the <code className="bg-slate-100 text-slate-850 px-1 py-0.5 rounded font-mono font-semibold">public.{rlsErrorTable}</code> table because the database's Row-Level Security (RLS) policies restrict this action to the profile owners.
                </p>
                <p>
                  Please copy and run the SQL command below in your **Supabase SQL Editor** to grant administrators write access to the platform profiles and user tables:
                </p>
              </div>

              {/* SQL Script Container */}
              <div className="relative bg-slate-900 rounded-xl overflow-hidden p-4 font-mono text-[10px] text-slate-350 max-h-48 overflow-y-auto border border-slate-800">
                <pre className="whitespace-pre">{`CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Admins can do everything on ${rlsErrorTable}" ON public.${rlsErrorTable};
CREATE POLICY "Admins can do everything on ${rlsErrorTable}" 
ON public.${rlsErrorTable} 
FOR ALL 
TO authenticated 
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );`}</pre>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    const sql = `CREATE OR REPLACE FUNCTION public.is_admin()\nRETURNS boolean AS $$\nBEGIN\n  RETURN EXISTS (\n    SELECT 1 FROM public.users \n    WHERE users.id = auth.uid() AND users.role = 'admin'\n  );\nEND;\n$$ LANGUAGE plpgsql SECURITY DEFINER;\n\nDROP POLICY IF EXISTS "Admins can do everything on users" ON public.users;\nCREATE POLICY "Admins can do everything on users" ON public.users FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());\n\nDROP POLICY IF EXISTS "Admins can do everything on tutor_profiles" ON public.tutor_profiles;\nCREATE POLICY "Admins can do everything on tutor_profiles" ON public.tutor_profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());\n\nDROP POLICY IF EXISTS "Admins can do everything on guardian_profiles" ON public.guardian_profiles;\nCREATE POLICY "Admins can do everything on guardian_profiles" ON public.guardian_profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());\n\nDROP POLICY IF EXISTS "Admins can do everything on membership_requests" ON public.membership_requests;\nCREATE POLICY "Admins can do everything on membership_requests" ON public.membership_requests FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());\n\nDROP POLICY IF EXISTS "Allow users to read their own profile" ON public.users;\nCREATE POLICY "Allow users to read their own profile" ON public.users FOR SELECT TO authenticated USING (id = auth.uid());`;
                    navigator.clipboard.writeText(sql);
                    alert("Admin RLS policies copied to clipboard!");
                  }}
                  className="flex-grow py-3 bg-[#86c240] hover:bg-[#6a9c31] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#86c240]/15 flex items-center justify-center gap-1.5"
                >
                  Copy Admin RLS Commands
                </button>
                <button
                  onClick={() => setRlsErrorTable(null)}
                  className="px-6 py-3 border border-slate-205 hover:bg-slate-50 text-slate-655 rounded-xl text-xs font-bold transition-all"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {viewerUrl && (
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setViewerUrl(null);
                setViewerTitle('');
              }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-150 p-6 max-w-4xl w-full h-[85vh] relative shadow-2xl z-10 flex flex-col font-sans text-left"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#86c240]" />
                  <h3 className="font-extrabold text-slate-800 text-base">{viewerTitle || 'View Document'}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <a 
                    href={viewerUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    Open in New Tab
                  </a>
                  <button 
                    onClick={() => {
                      setViewerUrl(null);
                      setViewerTitle('');
                    }}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-150 relative">
                {(() => {
                  const isPdf = viewerUrl.toLowerCase().split('?')[0].endsWith('.pdf');
                  const isGoogleDrive = viewerUrl.includes('drive.google.com') || viewerUrl.includes('docs.google.com');

                  if (isGoogleDrive) {
                    return (
                      <div className="text-center p-6 space-y-4">
                        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-800">Google Drive Document</h4>
                        <p className="text-xs text-slate-500 max-w-md">
                          Google Drive documents cannot be embedded directly due to security restrictions. Please click the button below to view it.
                        </p>
                        <a 
                          href={viewerUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex px-5 py-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white font-bold rounded-xl text-xs shadow-md transition-all"
                        >
                          Open in Google Drive
                        </a>
                      </div>
                    );
                  }

                  if (isPdf) {
                    return (
                      <iframe 
                        src={viewerUrl} 
                        className="w-full h-full rounded-2xl border-0" 
                        title={viewerTitle}
                      />
                    );
                  }

                  // Otherwise render as image
                  return (
                    <img 
                      src={viewerUrl} 
                      alt={viewerTitle} 
                      className="max-w-full max-h-full object-contain rounded-2xl p-2 select-none"
                    />
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminUsers;
