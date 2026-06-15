import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Megaphone, Calendar, Users, Trash2, Plus, X, Search, Check, 
  Clock, AlertCircle, Info, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all'); // 'all', 'tutor', 'guardian', 'specific'
  const [durationDays, setDurationDays] = useState('7'); // '1', '3', '7', '14', '30'
  const [specificUsers, setSpecificUsers] = useState([]); // Array of selected user objects
  
  // Specific user search
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchNotices = async () => {
    setLoadingNotices(true);
    
    // Fail-safe timeout to prevent infinite loading in case of RLS/DB query hangs
    const timeout = setTimeout(() => {
      setLoadingNotices(false);
    }, 4000);

    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out stale notices client-side if any, but show all in admin
      setNotices(data || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      clearTimeout(timeout);
      setLoadingNotices(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Search users for specific target audience
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!userSearchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      setSearchingUsers(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email, phone_number, role')
          .or(`full_name.ilike.%${userSearchTerm}%,email.ilike.%${userSearchTerm}%,phone_number.ilike.%${userSearchTerm}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [userSearchTerm]);

  const handleAddSpecificUser = (user) => {
    if (specificUsers.some(u => u.id === user.id)) return;
    setSpecificUsers([...specificUsers, user]);
    setUserSearchTerm('');
    setShowSearchDropdown(false);
  };

  const handleRemoveSpecificUser = (userId) => {
    setSpecificUsers(specificUsers.filter(u => u.id !== userId));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please fill out the title and message fields.');
      return;
    }

    if (targetAudience === 'specific' && specificUsers.length === 0) {
      alert('Please select at least one specific user to target.');
      return;
    }

    setSaving(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays, 10));

      const { data, error } = await supabase
        .from('notices')
        .insert([{
          title: title.trim(),
          message: message.trim(),
          target_audience: targetAudience,
          specific_user_ids: targetAudience === 'specific' ? specificUsers.map(u => u.id) : [],
          expires_at: expiresAt.toISOString()
        }]);

      if (error) throw error;

      showToast('Notice created successfully.');
      setTitle('');
      setMessage('');
      setTargetAudience('all');
      setSpecificUsers([]);
      setDurationDays('7');
      fetchNotices();
    } catch (err) {
      console.error('Error creating notice:', err);
      alert('Failed to publish notice: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!confirm('Are you sure you want to delete this notice? It will disappear from all user dashboards immediately.')) return;

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Notice deleted successfully.');
      setNotices(notices.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notice:', err);
      alert('Failed to delete notice: ' + err.message);
    }
  };

  const formatRemainingTime = (expiryStr) => {
    const expiry = new Date(expiryStr);
    const now = new Date();
    const diffMs = expiry - now;
    if (diffMs <= 0) return 'Expired';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays}d remaining`;

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) return `${diffHours}h remaining`;

    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}m remaining`;
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto mt-4 relative">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 bg-slate-900 text-white rounded-2xl shadow-xl px-5 py-4 z-[99] flex items-center gap-3 border border-slate-800"
          >
            <CheckCircle className="w-5 h-5 text-[#86c240] shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Notice Board Management</h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">Broadcast announcements to parents, tutors, or specific users with auto-expiry timers.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Notice Creation Form */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
            <Plus className="w-5 h-5 text-[#86c240]" /> Create New Notice
          </h2>

          <form onSubmit={handleCreateNotice} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-600 ml-1">Notice Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Server Maintenance Notice"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm font-bold"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-600 ml-1">Notice Message</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the message content here..."
                rows="4"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm font-medium min-h-[100px]"
              ></textarea>
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-600 ml-1">Target Audience</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: 'All Users' },
                  { value: 'tutor', label: 'Tutors Only' },
                  { value: 'guardian', label: 'Guardians Only' },
                  { value: 'specific', label: 'Specific Users' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTargetAudience(opt.value)}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all outline-none ${
                      targetAudience === opt.value
                        ? 'border-[#86c240] bg-[#f7fee7] text-slate-850'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific User selection dropdown */}
            {targetAudience === 'specific' && (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <label className="text-sm font-bold text-slate-600 ml-1">Lookup & Select Users</label>
                <div className="relative">
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => { setUserSearchTerm(e.target.value); setShowSearchDropdown(true); }}
                    onFocus={() => setShowSearchDropdown(true)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm font-bold"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  
                  {showSearchDropdown && userSearchTerm.trim() && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-48 overflow-y-auto z-10 divide-y divide-slate-50">
                      {searchingUsers ? (
                        <div className="p-3 text-center text-slate-400 text-xs font-bold">Searching...</div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-3 text-center text-slate-400 text-xs font-bold">No users found</div>
                      ) : (
                        searchResults.map(user => (
                          <div 
                            key={user.id}
                            onClick={() => handleAddSpecificUser(user)}
                            className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-sm font-bold"
                          >
                            <div>
                              <p className="text-slate-800">{user.full_name}</p>
                              <p className="text-xs text-slate-400 font-medium">{user.email || user.phone_number} ({user.role})</p>
                            </div>
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">{user.role}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Users list tags */}
                {specificUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto border border-slate-50 bg-slate-50/50 p-2 rounded-xl">
                    {specificUsers.map(u => (
                      <span key={u.id} className="inline-flex items-center gap-1 bg-white border border-slate-150 text-slate-700 px-2 py-0.5 rounded-lg text-xs font-black">
                        {u.full_name}
                        <button type="button" onClick={() => handleRemoveSpecificUser(u.id)} className="text-slate-450 hover:text-slate-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Duration / Timer */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <label className="text-sm font-bold text-slate-600 ml-1">Expiry Timer (Duration)</label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 rounded-2xl text-slate-800 focus:outline-none transition-all text-sm font-bold cursor-pointer"
              >
                <option value="1">1 Day (24 Hours)</option>
                <option value="3">3 Days (72 Hours)</option>
                <option value="7">7 Days (1 Week)</option>
                <option value="14">14 Days (2 Weeks)</option>
                <option value="30">30 Days (1 Month)</option>
              </select>
            </div>

            {/* Action button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-lg shadow-[#86c240]/15 text-sm font-black tracking-wide uppercase text-white bg-[#86c240] hover:bg-[#72ad30] focus:outline-none focus:ring-4 focus:ring-[#86c240]/30 disabled:opacity-50 transition-all mt-4"
            >
              {saving ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </form>
        </div>

        {/* Notices Board List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Megaphone className="w-5 h-5 text-[#86c240]" /> Active Notice Board ({notices.length})
            </h2>

            {loadingNotices ? (
              <div className="flex justify-center items-center py-20 text-slate-400 font-bold text-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#86c240] mr-3"></div>
                Loading announcements...
              </div>
            ) : notices.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl p-6 bg-slate-50/50">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
                <p className="text-slate-500 font-bold text-base">No notices are currently published.</p>
                <p className="text-slate-400 text-sm mt-1">Publish an announcement using the left form to show it on dashboards.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {notices.map(notice => {
                  const isExpired = new Date(notice.expires_at) < new Date();
                  const timeTag = formatRemainingTime(notice.expires_at);

                  return (
                    <div 
                      key={notice.id} 
                      className={`border rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between md:flex-row gap-4 items-start transition-all hover:shadow-md ${
                        isExpired ? 'border-slate-100 bg-slate-50/50 opacity-60' : 'border-slate-150'
                      }`}
                    >
                      <div className="space-y-2.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-base text-slate-800">{notice.title}</h3>
                          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            notice.target_audience === 'all'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : notice.target_audience === 'tutor'
                                ? 'bg-green-50 text-green-700 border-green-100'
                                : notice.target_audience === 'guardian'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-purple-50 text-purple-700 border-purple-100'
                          }`}>
                            Audience: {notice.target_audience} 
                            {notice.target_audience === 'specific' && ` (${notice.specific_user_ids?.length || 0})`}
                          </span>

                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            isExpired 
                              ? 'bg-rose-50 text-rose-600 border-rose-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {timeTag}
                          </span>
                        </div>
                        <p className="text-sm text-slate-650 leading-relaxed whitespace-pre-wrap font-medium">{notice.message}</p>
                        <div className="text-xs font-bold text-slate-400">
                          Published: {new Date(notice.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="p-2.5 bg-rose-50 border border-rose-100 hover:border-rose-300 text-rose-600 hover:bg-rose-100/50 rounded-xl transition-all self-end md:self-center shrink-0"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminNotices;
