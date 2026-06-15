import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, Mail, ArrowLeft, ShieldAlert } from 'lucide-react';
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
          setError('Access Denied: You do not have administrator privileges.');
          setLoading(false);
          return;
        }

        // Successfully verified as admin
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setError('An unexpected error occurred during authentication.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email) => email === '' || (email.includes('@') && email.length > 3);
  const emailError = !isValidEmail(email);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* Left Branding Panel (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-[#86c240] p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#6a9c31]/30 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity w-fit">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wider uppercase">Return to Public Site</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="w-16 h-16 bg-white/20 border border-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md mb-8">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-6">
            TutorCore BD<br />
            <span className="text-green-100">
              Enterprise Admin
            </span>
          </h1>
          <p className="text-green-50 text-lg font-medium leading-relaxed">
            Secure administrative portal. Access is strictly restricted to authorized system administrators. All authentication attempts are logged and monitored.
          </p>
        </div>

        <div className="relative z-10 text-green-100/70 text-sm font-semibold">
          &copy; {new Date().getFullYear()} TutorCore BD. Enterprise Security System.
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-8 bg-white shadow-2xl relative z-20 border-l border-slate-100">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center md:text-left mb-10">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center md:hidden mx-auto mb-6">
              <Shield className="w-6 h-6 text-[#86c240]" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Admin Portal</h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Enter your administrative credentials to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Administrator Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#86c240] transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-white border ${emailError && email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-[#86c240] focus:ring-[#86c240]/20'} rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all sm:text-sm font-medium`}
                  placeholder="admin@tutorcorebd.com"
                />
              </div>
              {emailError && email && <p className="text-red-500 text-xs font-bold ml-1 mt-1">Please enter a valid email.</p>}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#86c240] transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#86c240] focus:ring-4 focus:ring-[#86c240]/20 transition-all sm:text-sm font-medium"
                  placeholder="••••••••"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (emailError && email !== '')}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#86c240] hover:bg-[#6a9c31] focus:outline-none focus:ring-4 focus:ring-[#86c240]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-8"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                  Authenticating...
                </>
              ) : (
                'Secure Login'
              )}
            </button>
            
          </form>

          {/* Warning Note */}
          <div className="pt-8 mt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-bold">
              This is a restricted portal. Unauthorized access is strictly prohibited and monitored.
            </p>
          </div>

        </div>
      </div>
      
    </div>
  );
};

export default AdminLogin;
