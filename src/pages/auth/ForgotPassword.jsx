import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const isValidEmail = (email) => {
    return email.includes('@') && email.length > 3;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset link sent! Please check your email.');
    }
    setLoading(false);
  };

  const emailError = email && !isValidEmail(email);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Forgot Password?
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm font-medium text-center">
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className={`h-5 w-5 ${emailError ? 'text-red-400' : 'text-slate-400'}`} />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none block w-full pl-10 px-3 py-3 border ${emailError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-primary focus:border-primary'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none sm:text-sm transition-colors`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {emailError && <p className="mt-1 text-sm text-red-500">Please enter a valid email address.</p>}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !email || emailError}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
              {loading ? 'Sending link...' : 'Reset Password'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link to="/login" className="font-medium text-slate-600 hover:text-primary transition-colors flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
