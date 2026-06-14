import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import { Lock, Mail, User, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

const Settings = () => {
  const { user, profile, fetchProfile } = useAuthStore();
  
  // States
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI States
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setLoadingName(true);

    try {
      // Assuming public.users RLS allows user to update their own full_name
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      
      await fetchProfile(user);
      showMessage('success', 'Name updated successfully.');
    } catch (error) {
      showMessage('error', error.message || 'Failed to update name.');
    } finally {
      setLoadingName(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showMessage('error', 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long.');
      return;
    }
    
    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      showMessage('success', 'Password updated successfully.');
    } catch (error) {
      showMessage('error', error.message || 'Failed to update password.');
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleSendResetLink = async () => {
    setLoadingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      showMessage('success', 'Password reset link sent to your email.');
    } catch (error) {
      showMessage('error', error.message || 'Failed to send reset link.');
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-sans">
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#86c240]" />
          Account Settings
        </h2>
        <p className="text-slate-500 text-sm mt-1">Manage your account security and basic information.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-bold mb-6 flex items-center gap-2 border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-500 border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Left Column: Basic Info & Email */}
        <div className="space-y-8">
          
          {/* Edit Name Section */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#86c240]" />
              Basic Information
            </h3>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/10 font-medium"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loadingName}
                className="bg-[#86c240] hover:bg-[#6a9c31] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
              >
                {loadingName ? 'Saving...' : 'Update Name'}
              </button>
            </form>
          </div>

          {/* Email Info Section */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Email Address
            </h3>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">Current Email</label>
              <input 
                type="email" 
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
              <p className="text-[11px] text-slate-400 font-bold mt-2">
                Email changing is disabled for security. Contact support to change your email.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Security */}
        <div className="space-y-8">
          
          {/* Change Password Section */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Change Password
            </h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">New Password</label>
                <input 
                  type="password" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 font-medium"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">Confirm Password</label>
                <input 
                  type="password" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 font-medium"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loadingPassword}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors"
              >
                {loadingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 mb-2">Forgot Password?</h4>
              <p className="text-xs text-slate-500 mb-4">Send a password reset link to your email address.</p>
              <button 
                onClick={handleSendResetLink}
                disabled={loadingReset}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors"
              >
                {loadingReset ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
