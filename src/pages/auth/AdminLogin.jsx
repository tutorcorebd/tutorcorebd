import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, Mail, ArrowLeft, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';

const AdminLogin = () => {
  const { session, profile, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session && profile && !loading) {
      if (profile.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [session, profile, isLoading, loading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (emailError) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInError) {
        console.error('Sign in error:', signInError);
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (roleError || userData.role !== 'admin') {
          await supabase.auth.signOut();
          setError('Access denied: Only administrators can sign in here.');
          setLoading(false);
          return;
        }

        // Successfully verified as admin
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email) => email === '' || (email.includes('@') && email.length > 3);
  const emailError = !isValidEmail(email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-green-50/20 flex flex-col md:flex-row font-sans">
      
      {/* Left branding panel (hidden on mobile, warm & conversational on desktop) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-gradient-to-br from-[#86c240] to-[#6a9c31] p-12 flex-col justify-between relative overflow-hidden">
        {/* Soft atmospheric glassmorphic background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[32rem] h-[32rem] bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[32rem] h-[32rem] bg-[#588229]/20 rounded-full blur-3xl"></div>
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <Link to="/" className="flex items-center gap-2.5 text-white/95 hover:text-white transition-colors w-fit group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Back to public site</span>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative z-10 max-w-xl"
        >
          <div className="w-14 h-14 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center backdrop-blur-md mb-8">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
            TutorCore BD<br />
            <span className="text-green-100 font-medium text-3xl md:text-4xl block mt-2">
              Enterprise admin portal
            </span>
          </h1>
          <p className="text-green-50/90 text-lg leading-relaxed font-medium">
            Welcome back! This is the management workspace for TutorCore BD. Sign in here to manage tutors, process applications, and monitor platform activity.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 text-green-100/80 text-sm font-medium"
        >
          &copy; {new Date().getFullYear()} TutorCore BD. Enterprise security system.
        </motion.div>
      </div>

      {/* Right login panel (mobile optimized, responsive, and animated) */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col items-center justify-center p-6 sm:p-12 relative z-20 min-h-screen">
        
        {/* Soft header banner visible only on mobile devices */}
        <div className="md:hidden w-full max-w-md flex justify-between items-center mb-8">
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-semibold">Back to site</span>
          </Link>
          <span className="text-xs font-bold text-[#86c240]">TutorCore Admin</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50"
        >
          <div className="text-center sm:text-left mb-8">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center md:hidden mx-auto mb-5">
              <Shield className="w-6 h-6 text-[#86c240]" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin sign in</h2>
            <p className="text-slate-500 mt-2.5 text-sm font-medium leading-relaxed">
              Please enter your admin credentials to log in.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 mb-6"
              >
                <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-rose-700 text-sm font-semibold leading-relaxed">
                  {error === 'Invalid login credentials' ? "Oops! Those credentials don't match our records." : error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1">Admin email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#86c240] transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border ${emailError && email ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-100 focus:border-[#86c240] focus:ring-[#86c240]/20'} rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all sm:text-sm font-medium`}
                  placeholder="admin@tutorcorebd.com"
                />
              </div>
              {emailError && email && <p className="text-rose-500 text-xs font-bold ml-1 mt-1">Please enter a valid email address.</p>}
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#86c240] transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/20 transition-all sm:text-sm font-medium"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Action button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading || (emailError && email !== '')}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-lg shadow-[#86c240]/15 text-sm font-bold text-white bg-[#86c240] hover:bg-[#72ad30] focus:outline-none focus:ring-4 focus:ring-[#86c240]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2.5"></div>
                  Logging you in...
                </>
              ) : (
                'Sign in to dashboard'
              )}
            </motion.button>
            
          </form>

          {/* Footer note */}
          <div className="pt-6 mt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              This area is restricted to TutorCore BD administrators. If you need assistance, please contact the system administrator.
            </p>
          </div>

        </motion.div>
      </div>
      
    </div>
  );
};

export default AdminLogin;

