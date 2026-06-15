import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { User, Lock, Bell, AlertTriangle, Check, Loader2, Save } from 'lucide-react';
import CustomAlert from '../../components/layout/CustomAlert';

const Settings = () => {
  const { user, profile, fetchProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Security Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Deactivation / Deletion State
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone_number || '');
      setEmailNotifications(profile.email_notifications ?? true);
      setSmsNotifications(profile.sms_notifications ?? false);
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  const showAlert = (type, title, message) => {
    setAlert({ isOpen: true, type, title, message });
  };

  const closeAlert = () => setAlert(prev => ({ ...prev, isOpen: false }));

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName, phone_number: phoneNumber })
        .eq('id', user.id);

      if (error) throw error;
      await fetchProfile(user);
      showAlert('success', 'Profile Updated', 'Your profile information has been saved successfully.');
    } catch (err) {
      console.error(err);
      showAlert('error', 'Update Failed', err.message || 'Could not update profile information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      showAlert('error', 'Password Mismatch', 'Your new passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      let emailUpdated = false;
      let passwordUpdated = false;

      if (email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        emailUpdated = true;
      }

      if (password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        passwordUpdated = true;
      }

      if (emailUpdated && passwordUpdated) {
        showAlert('success', 'Security Updated', 'Your email and password have been updated. Please check your new email to confirm the change.');
      } else if (emailUpdated) {
        showAlert('success', 'Email Updated', 'Please check your new email address for a confirmation link.');
      } else if (passwordUpdated) {
        showAlert('success', 'Password Updated', 'Your password has been changed successfully.');
      }
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      showAlert('error', 'Security Update Failed', err.message || 'Could not update security settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotification = async (type) => {
    // Only premium tutors can enable SMS
    if (type === 'sms' && profile?.tutor_profile?.tutor_status !== 'Premium Tutor' && !smsNotifications) {
      showAlert('warning', 'Premium Feature', 'SMS Notifications are only available for Premium Tutors.');
      return;
    }

    const updates = {};
    if (type === 'email') updates.email_notifications = !emailNotifications;
    if (type === 'sms') updates.sms_notifications = !smsNotifications;

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      if (type === 'email') setEmailNotifications(!emailNotifications);
      if (type === 'sms') setSmsNotifications(!smsNotifications);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Toggle Failed', 'Could not save notification preferences.');
    }
  };

  const handleAccountAction = async (action) => {
    if (!reason.trim()) {
      showAlert('warning', 'Reason Required', 'Please provide a reason for this action.');
      return;
    }

    setIsLoading(true);
    try {
      const updates = {};
      if (action === 'deactivate') {
        updates.status = 'deactivated';
        updates.deactivation_reason = reason;
      } else if (action === 'delete') {
        updates.status = 'pending_deletion';
        updates.deletion_reason = reason;
        updates.deletion_requested_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      await useAuthStore.getState().signOut();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Action Failed', `Could not ${action} account. Please try again.`);
    } finally {
      setIsLoading(false);
      setShowDeactivateModal(false);
      setShowDeleteModal(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleUpdateProfile} className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800">Profile Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-1 focus:ring-[#86c240] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-1 focus:ring-[#86c240] transition-colors"
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-3 bg-[#86c240] hover:bg-[#75ac36] text-white rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </form>
        );
      case 'security':
        return (
          <form onSubmit={handleUpdateSecurity} className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800">Account Security</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-1 focus:ring-[#86c240] transition-colors"
                  required
                />
                <p className="text-[11px] text-slate-450 mt-1 font-semibold">A confirmation link will be sent to your new email address.</p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 mb-1">New Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-1 focus:ring-[#86c240] transition-colors"
                />
              </div>
              {password && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-1 focus:ring-[#86c240] transition-colors"
                  />
                </div>
              )}
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-3 bg-[#86c240] hover:bg-[#75ac36] text-white rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Security
            </button>
          </form>
        );
      case 'notifications':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Notification Preferences</h3>
              <p className="text-sm text-slate-500 font-semibold">Manage how you receive updates and alerts.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Email Notifications</h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Receive tuition alerts and updates via email.</p>
                </div>
                <button 
                  onClick={() => handleToggleNotification('email')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${emailNotifications ? 'bg-[#86c240]' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${emailNotifications ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800">SMS Notifications</h4>
                    {profile?.tutor_profile?.tutor_status !== 'Premium Tutor' && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-black uppercase tracking-wider">Premium</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Get instant text alerts for new matched jobs.</p>
                </div>
                <button 
                  onClick={() => handleToggleNotification('sms')}
                  className={`w-12 h-6 rounded-full transition-colors relative ${smsNotifications ? 'bg-[#86c240]' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${smsNotifications ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        );
      case 'danger':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Danger Zone
              </h3>
              <p className="text-sm text-slate-500 font-semibold mt-1">Actions taken here are sensitive and will affect your account visibility.</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-5 border border-slate-200 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Deactivate Account</h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1 max-w-sm">
                    Temporarily hide your profile from parents. You can reactivate it anytime by logging back in.
                  </p>
                </div>
                <button 
                  onClick={() => setShowDeactivateModal(true)}
                  className="px-5 py-2.5 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors shrink-0"
                >
                  Deactivate Account
                </button>
              </div>

              <div className="p-5 border border-red-100 bg-red-50/50 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-red-700">Delete Account</h4>
                  <p className="text-[11px] text-red-500/80 font-semibold mt-1 max-w-sm">
                    Permanently remove your account and data. This action is delayed by 30 days and can be canceled by logging in.
                  </p>
                </div>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                >
                  Request Deletion
                </button>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <CustomAlert 
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
      />

      <div>
        <h1 className="text-2xl font-black text-slate-800">Settings</h1>
        <p className="text-slate-500 font-semibold text-sm">Manage your account preferences and security.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'profile' ? 'bg-white text-[#86c240] shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <User className="w-4 h-4" /> Profile Info
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'security' ? 'bg-white text-[#86c240] shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Lock className="w-4 h-4" /> Security
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'notifications' ? 'bg-white text-[#86c240] shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('danger')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'danger' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-red-500/70 hover:bg-red-50'}`}
          >
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          {renderTabContent()}
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Deactivate Account</h3>
              <p className="text-sm text-slate-500 font-semibold mb-4">Please tell us why you are deactivating your account. This helps us improve.</p>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for deactivation..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#86c240] text-sm font-semibold text-slate-700 min-h-[100px] resize-none"
              ></textarea>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => { setShowDeactivateModal(false); setReason(''); }}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleAccountAction('deactivate')}
                disabled={isLoading || !reason.trim()}
                className="px-4 py-2 font-bold bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Deactivate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-red-600 mb-2">Request Account Deletion</h3>
              <p className="text-sm text-slate-600 font-semibold mb-4">
                Are you sure? Your account will be deactivated for 30 days and then permanently deleted. Provide a reason to continue.
              </p>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you leaving?"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 text-sm font-semibold text-slate-700 min-h-[100px] resize-none"
              ></textarea>
            </div>
            <div className="px-6 py-4 bg-red-50/30 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => { setShowDeleteModal(false); setReason(''); }}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleAccountAction('delete')}
                disabled={isLoading || !reason.trim()}
                className="px-4 py-2 font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Request Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
