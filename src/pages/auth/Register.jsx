import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Users, Mail, Lock, Phone, User as UserIcon } from 'lucide-react';
import CustomAlert from '../../components/layout/CustomAlert';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('Male'); // 'Male' or 'Female'
  const searchParams = new URLSearchParams(window.location.search);
  const queryRole = searchParams.get('role') || 'parents'; // 'parents' or 'tutor'
  const redirectTo = searchParams.get('redirectTo');
  
  const [role, setRole] = useState(queryRole); // 'parents' or 'tutor'
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'success', title: '', message: '', onAction: null });
  const navigate = useNavigate();

  const showAlert = (type, title, message, onAction = null) => {
    setAlertConfig({ type, title, message, onAction });
    setAlertOpen(true);
  };

  const isValidEmail = (email) => {
    return email === '' || (email.includes('@') && email.length > 3);
  };

  const emailError = !isValidEmail(email);
  const passwordMismatch = rePassword !== '' && password !== rePassword;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (emailError || passwordMismatch) return;

    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
          role: role === 'parents' ? 'guardian' : 'tutor',
          gender: gender
        }
      }
    });
    
    if (error) {
      setError(error.message);
    } else {
      showAlert(
        'success', 
        'Registration Successful!', 
        'Your account has been created successfully.', 
        () => navigate(redirectTo || '/')
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[85vh] flex items-stretch rounded-3xl overflow-hidden shadow-2xl bg-white max-w-6xl mx-auto my-8 border border-slate-100">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex w-1/2 bg-slate-50 relative items-center justify-center p-12 overflow-hidden border-r border-slate-100">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-green-100/40 via-slate-50 to-slate-50"></div>
        <div className="relative z-10 w-full max-w-md">
          {/* A stylized placeholder for the illustration */}
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
      <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 lg:px-16 justify-center max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8 mt-4 lg:mt-0">
            <h2 className="text-3xl font-bold text-slate-900">
              Create <span className="text-[#84cc16]">an Account</span>
            </h2>
            <p className="text-slate-500 mt-2">Lets get started a new journey!!!</p>
          </div>

          {/* Role Selection Toggle */}
          <div className="flex gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRole('parents')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${role === 'parents' ? 'border-[#84cc16] bg-[#f7fee7] shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-slate-700 relative">
                <Users size={24} />
                {role === 'parents' && <div className="absolute top-0 right-0 w-3 h-3 bg-[#84cc16] rounded-full border-2 border-white"></div>}
              </div>
              <span className="font-bold text-slate-800">Parents</span>
              <span className="text-[10px] text-slate-400 mt-1 text-center">Are you looking For a tutor? Tap it!!!</span>
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
              <span className="text-[10px] text-slate-400 mt-1 text-center">Are you looking For a tuition jobs? Tap it!!!</span>
            </button>
          </div>

          {/* Form */}
          <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-100">
            {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-sm font-medium text-center">{error}</div>}
            
            <form onSubmit={handleRegister} className="space-y-5">
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  className="appearance-none block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#84cc16] focus:border-[#84cc16] sm:text-sm transition-colors"
                  placeholder="Name*"
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="tel" 
                  className="appearance-none block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#84cc16] focus:border-[#84cc16] sm:text-sm transition-colors"
                  placeholder="Phone*"
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  required 
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 ${emailError ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <input 
                    type="email" 
                    className={`appearance-none block w-full pl-11 pr-4 py-3 bg-white border ${emailError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-[#84cc16] focus:border-[#84cc16]'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none sm:text-sm transition-colors`}
                    placeholder="Email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                  {emailError && <p className="absolute -bottom-5 left-0 text-[10px] text-red-500 font-medium">Valid email required</p>}
                </div>

                <div className="flex-1">
                  <span className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Gender*</span>
                  <div className="flex items-center gap-4 px-2 py-1">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="gender" 
                        value="Male"
                        checked={gender === 'Male'}
                        onChange={() => setGender('Male')}
                        className="w-4 h-4 text-[#84cc16] bg-white border-slate-300 focus:ring-[#84cc16]" 
                      />
                      <span className="ml-2 text-sm text-slate-700">Male</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="gender" 
                        value="Female"
                        checked={gender === 'Female'}
                        onChange={() => setGender('Female')}
                        className="w-4 h-4 text-[#84cc16] bg-white border-slate-300 focus:ring-[#84cc16]" 
                      />
                      <span className="ml-2 text-sm text-slate-700">Female</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${passwordMismatch ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className={`appearance-none block w-full pl-11 pr-10 py-3 bg-white border ${passwordMismatch ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-[#84cc16]'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none sm:text-sm transition-colors`}
                    placeholder="Password*"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${passwordMismatch ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <input 
                    type={showRePassword ? 'text' : 'password'} 
                    className={`appearance-none block w-full pl-11 pr-10 py-3 bg-white border ${passwordMismatch ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-[#84cc16]'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none sm:text-sm transition-colors`}
                    placeholder="Re-Password*"
                    value={rePassword} 
                    onChange={(e) => setRePassword(e.target.value)} 
                    required 
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    onClick={() => setShowRePassword(!showRePassword)}
                  >
                    {showRePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {passwordMismatch && <p className="absolute -bottom-5 left-0 text-[10px] text-red-500 font-medium">Passwords must match</p>}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                  disabled={loading || emailError || passwordMismatch}
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                </button>
              </div>

              <div className="mt-6 text-center text-sm text-slate-600 space-y-2">
                <p>
                  By signing up, you agree to our <Link to="/terms-of-use" className="text-blue-500 hover:underline">Term of Use</Link> and <Link to="/privacy-policy" className="text-blue-500 hover:underline">Privacy Policy</Link>
                </p>
                <p>
                  Already have an account? <Link to="/login" className="text-blue-500 font-medium hover:underline">Sign In.</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
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

export default Register;
