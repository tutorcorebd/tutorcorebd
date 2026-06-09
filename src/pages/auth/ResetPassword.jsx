import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import CustomAlert from '../../components/layout/CustomAlert';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'success', title: '', message: '', onAction: null });
  const navigate = useNavigate();

  const showAlert = (type, title, message, onAction = null) => {
    setAlertConfig({ type, title, message, onAction });
    setAlertOpen(true);
  };

  useEffect(() => {
    // Listen for auth state change to verify the user is properly in a recovery session
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event == "PASSWORD_RECOVERY") {
        console.log("Password recovery event triggered");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const passwordMismatch = confirmPassword && password !== confirmPassword;

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordMismatch || password.length < 6) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
    } else {
      showAlert(
        'success',
        'Password Reset Successful!',
        'Your password has been successfully updated. You can now log in with your new password.',
        () => navigate('/login')
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Your new password must be different to previously used passwords.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="appearance-none block w-full pl-10 pr-10 px-3 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${passwordMismatch ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className={`appearance-none block w-full pl-10 pr-10 px-3 py-3 border ${passwordMismatch ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none sm:text-sm transition-colors`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordMismatch && <p className="mt-1 text-sm text-red-500">Passwords do not match.</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || passwordMismatch || password.length < 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
      <CustomAlert 
        isOpen={alertOpen} 
        onClose={() => setAlertOpen(false)} 
        type={alertConfig.type} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        onAction={alertConfig.onAction} 
      />
    </div>
  );
};

export default ResetPassword;
