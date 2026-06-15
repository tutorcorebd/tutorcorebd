import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Users, Mail, Lock } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const Login = () => {
  const { session, profile, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parents'); // 'parents' or 'tutor'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectTo = searchParams.get('redirectTo');

  useEffect(() => {
    if (searchParams.get('suspended') === 'true') {
      setError('Your account has been suspended. Please contact administration.');
    }
  }, []);

  useEffect(() => {
    if (!isLoading && session && profile && !loading) {
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else if (profile.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (profile.role === 'tutor') {
        navigate('/tutor/dashboard', { replace: true });
      } else if (profile.role === 'guardian') {
        navigate('/guardian/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [session, profile, isLoading, loading, navigate, redirectTo]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (emailError) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Fetch the user role and status from public.users
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role, status')
          .eq('id', data.user.id)
          .single();

        if (roleError) {
          await supabase.auth.signOut();
          setError('Failed to retrieve user profile.');
          setLoading(false);
          return;
        }

        if (userData.status === 'suspended') {
          await supabase.auth.signOut();
          setError('Your account has been suspended. Please contact administration.');
          setLoading(false);
          return;
        }

        // Selected UI role is 'parents' (guardian) or 'tutor'
        const expectedDbRole = role === 'parents' ? 'guardian' : 'tutor';
        if (userData.role !== expectedDbRole) {
          await supabase.auth.signOut();
          if (userData.role === 'tutor') {
            setError('This email is registered as a Tutor. Please sign in as a Tutor.');
          } else if (userData.role === 'guardian') {
            setError('This email is registered as a Parent / Guardian. Please sign in as a Parent.');
          } else {
            setError('Invalid credentials for the selected role.');
          }
          setLoading(false);
          return;
        }

        if (redirectTo) {
          navigate(redirectTo, { replace: true });
        } else if (userData.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (userData.role === 'tutor') {
          navigate('/tutor/dashboard', { replace: true });
        } else if (userData.role === 'guardian') {
          navigate('/guardian/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      setError('An unexpected error occurred during login.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email) => {
    return email === '' || (email.includes('@') && email.length > 3);
  };

  const emailError = !isValidEmail(email);

  if (isLoading || loading || (session && profile)) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#84cc16]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-stretch rounded-3xl overflow-hidden shadow-2xl bg-white max-w-6xl mx-auto my-8 border border-slate-100">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex w-1/2 bg-slate-50 relative items-center justify-center p-12 overflow-hidden border-r border-slate-100">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-green-100/40 via-slate-50 to-slate-50"></div>
        <div className="relative z-10 w-full max-w-md">
          {/* A stylized placeholder for the illustration in the screenshot */}
          <svg className="w-full h-auto text-slate-300 drop-shadow-xl" viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="50" width="120" height="200" rx="4" stroke="currentColor" strokeWidth="4" fill="white"/>
            <rect x="60" y="60" width="40" height="40" rx="2" stroke="currentColor" strokeWidth="2"/>
            <rect x="120" y="60" width="40" height="40" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M250 350L150 350L150 150L250 150" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="280" cy="120" r="30" stroke="currentColor" strokeWidth="4" fill="white"/>
            <path d="M280 150 C280 200, 240 250, 240 350 L320 350 C320 250, 280 200, 280 150" stroke="currentColor" strokeWidth="4" fill="#84cc16" />
            <circle cx="180" cy="200" r="20" stroke="currentColor" strokeWidth="4" fill="white"/>
            <path d="M180 220 C180 250, 150 280, 150 350 L210 350 C210 280, 180 250, 180 220" fill="#a3e635" />
            <ellipse cx="250" cy="350" rx="150" ry="10" fill="#bef264" opacity="0.6"/>
          </svg>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 lg:p-16 justify-center">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              Welcome <span className="text-[#84cc16]">Back</span>
            </h2>
            <p className="text-slate-500 mt-2">Sign in to Continue your Journey.</p>
          </div>

          {/* Role Selection Toggle */}
          <div className="flex gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRole('parents')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${role === 'parents' ? 'border-[#84cc16] bg-[#f7fee7] shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-slate-700">
                <Users size={24} />
              </div>
              <span className="font-bold text-slate-800">Parents</span>
              <span className="text-[10px] text-slate-400 mt-1 text-center">Are you looking for a tutor? Tap it!!!</span>
            </button>
            
            <button
              type="button"
              onClick={() => setRole('tutor')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${role === 'tutor' ? 'border-[#84cc16] bg-[#f7fee7] shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-slate-700 relative">
                <User size={24} />
                {role === 'tutor' && <div className="absolute top-0 right-0 w-3 h-3 bg-[#84cc16] rounded-full border-2 border-white"></div>}
              </div>
              <span className="font-bold text-slate-800">Tutor</span>
              <span className="text-[10px] text-slate-400 mt-1 text-center">Are you looking for a tuition jobs? Tap it!!!</span>
            </button>
          </div>

          {/* Form */}
          <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-100">
            {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-sm font-medium text-center">{error}</div>}
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 ${emailError ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <input 
                    type="email" 
                    className={`appearance-none block w-full pl-11 pr-4 py-3.5 bg-white border ${emailError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-[#84cc16] focus:border-[#84cc16]'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none sm:text-sm transition-colors`}
                    placeholder="Phone/Email*"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                {emailError && <p className="mt-1.5 text-xs text-red-500 font-medium">Please enter a valid email address.</p>}
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="appearance-none block w-full pl-11 pr-11 py-3.5 bg-white border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#84cc16] focus:border-[#84cc16] sm:text-sm transition-colors"
                    placeholder="Password*"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-semibold text-slate-600 hover:text-[#84cc16] transition-colors">
                  Forget Password?
                </Link>
              </div>

              <button 
                type="submit" 
                className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#84cc16] hover:bg-[#65a30d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#84cc16] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#84cc16]/30"
                disabled={loading || emailError}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-50 text-slate-500 font-medium">Or</span>
                </div>
              </div>

              <Link 
                to="/register" 
                className="w-full flex justify-center py-3.5 px-4 border border-slate-300 text-sm font-bold rounded-xl text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all shadow-md"
              >
                Sign Up
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
