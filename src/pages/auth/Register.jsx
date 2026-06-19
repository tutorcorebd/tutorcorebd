import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Users, Mail, Lock, Phone, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
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
        'Verify Your Email Address', 
        'A confirmation email has been sent. Please check your inbox (and spam folder) and click the link to activate your account.', 
        () => navigate(redirectTo || '/')
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[85vh] flex items-stretch rounded-3xl overflow-hidden shadow-xl bg-white max-w-6xl mx-auto my-8 border border-slate-100 font-sans">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex w-1/2 bg-slate-50/50 relative items-center justify-center p-12 overflow-hidden border-r border-slate-100">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-green-50/30 via-slate-50/30 to-white"></div>
        
        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-xs flex items-center justify-center mb-8">
            <div className="absolute w-64 h-64 rounded-full bg-primary/5 blur-2xl top-4 left-4"></div>
            <div className="absolute w-64 h-64 rounded-full bg-primary/10 blur-3xl bottom-4 right-4"></div>
            
            <svg className="w-full h-auto relative z-10" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="200" r="160" stroke="#eaf4df" strokeWidth="2" strokeDasharray="8 8" />
              <circle cx="200" cy="200" r="130" stroke="#86c240" strokeWidth="1" opacity="0.2" />
              
              <rect x="130" y="140" width="140" height="120" rx="20" fill="white" stroke="#e2e8f0" strokeWidth="2" className="shadow-lg" />
              
              <rect x="160" y="170" width="80" height="8" rx="4" fill="#86c240" opacity="0.8" />
              <rect x="160" y="190" width="85" height="8" rx="4" fill="#cbd5e1" />
              <rect x="160" y="210" width="60" height="8" rx="4" fill="#cbd5e1" />
              
              <g transform="translate(80, 110)">
                <rect width="80" height="30" rx="15" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                <text x="40" y="18" fill="#475569" fontSize="10" fontWeight="600" textAnchor="middle">Education</text>
              </g>
              <g transform="translate(240, 240)">
                <rect width="80" height="30" rx="15" fill="#86c240" />
                <text x="40" y="18" fill="white" fontSize="10" fontWeight="600" textAnchor="middle">Verified</text>
              </g>
              
              <circle cx="200" cy="80" r="6" fill="#86c240" />
              <circle cx="90" cy="260" r="4" fill="#cbd5e1" />
              <circle cx="310" cy="150" r="8" fill="#86c240" opacity="0.3" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-slate-800 text-center">Your Journey to Success Starts Here</h3>
          <p className="text-slate-500 text-sm text-center mt-2 max-w-sm font-medium">
            Connect with verified subject experts or find the best tuition jobs matching your profile.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 sm:p-12 lg:px-16 justify-center max-h-[90vh] overflow-y-auto custom-scrollbar">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full mx-auto"
        >
          <div className="mb-8 mt-4 lg:mt-0">
            <h2 className="text-2xl font-bold text-slate-800">
              Create <span className="text-primary">an Account</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">Let's start your learning journey with Tutor Core.</p>
          </div>

          {/* Role Selection Toggle */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole('parents')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${role === 'parents' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'}`}
            >
              <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-slate-700 relative border border-slate-100">
                <Users size={20} className={role === 'parents' ? 'text-primary' : 'text-slate-500'} />
                {role === 'parents' && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"></div>}
              </div>
              <span className="font-semibold text-sm text-slate-850">Parents</span>
              <span className="text-xs text-slate-500 mt-1 text-center font-medium">Hire an expert tutor for home or online study</span>
            </button>
            
            <button
              type="button"
              onClick={() => setRole('tutor')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${role === 'tutor' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'}`}
            >
              <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-slate-700 relative border border-slate-100">
                <User size={20} className={role === 'tutor' ? 'text-primary' : 'text-slate-500'} />
                {role === 'tutor' && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"></div>}
              </div>
              <span className="font-semibold text-sm text-slate-855">Tutor</span>
              <span className="text-xs text-slate-500 mt-1 text-center font-medium">Find professional tuition jobs near you</span>
            </button>
          </div>

          {/* Form */}
          <div className="bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
            {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-5 text-xs font-semibold text-center border border-red-100">{error}</div>}
            
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Full Name */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  className="appearance-none block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary sm:text-sm transition-colors font-medium text-slate-700"
                  placeholder="Full Name*"
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                />
              </div>

              {/* Phone Number */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="tel" 
                  className="appearance-none block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:border-primary sm:text-sm transition-colors font-medium text-slate-700"
                  placeholder="Phone Number*"
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  required 
                />
              </div>

              {/* Email (Spacious - Full Width) */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${emailError ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input 
                  type="email" 
                  className={`appearance-none block w-full pl-11 pr-4 py-3 bg-white border ${emailError ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-primary'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none sm:text-sm transition-colors font-medium text-slate-700`}
                  placeholder="Email Address"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
                {emailError && <p className="absolute -bottom-5 left-0 text-xs text-red-500 font-medium">Valid email required</p>}
              </div>

              {/* Gender (Spacious, clean box) */}
              <div className="bg-white p-3 py-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                <span className="text-sm font-semibold text-slate-600 ml-1">Gender</span>
                <div className="flex items-center gap-6 pr-2">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="Male"
                      checked={gender === 'Male'}
                      onChange={() => setGender('Male')}
                      className="w-4 h-4 text-primary bg-white border-slate-350 focus:ring-primary" 
                    />
                    <span className="ml-2 text-sm text-slate-700 font-medium">Male</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="Female"
                      checked={gender === 'Female'}
                      onChange={() => setGender('Female')}
                      className="w-4 h-4 text-primary bg-white border-slate-350 focus:ring-primary" 
                    />
                    <span className="ml-2 text-sm text-slate-700 font-medium">Female</span>
                  </label>
                </div>
              </div>

              {/* Password */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${passwordMismatch ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className={`appearance-none block w-full pl-11 pr-10 py-3 bg-white border ${passwordMismatch ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-primary'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none sm:text-sm transition-colors font-medium text-slate-700`}
                  placeholder="Password (Min. 6 Characters)*"
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

              {/* Confirm Password */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${passwordMismatch ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input 
                  type={showRePassword ? 'text' : 'password'} 
                  className={`appearance-none block w-full pl-11 pr-10 py-3 bg-white border ${passwordMismatch ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-primary'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none sm:text-sm transition-colors font-medium text-slate-700`}
                  placeholder="Confirm Password*"
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
                {passwordMismatch && <p className="absolute -bottom-5 left-0 text-xs text-red-500 font-medium">Passwords must match</p>}
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-slate-900 hover:bg-slate-800 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-slate-950/10"
                  disabled={loading || emailError || passwordMismatch}
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </div>

              <div className="pt-2 text-center text-sm text-slate-500 space-y-2 leading-relaxed">
                <p>
                  By signing up, you agree to our <Link to="/terms-of-use" className="text-primary font-semibold hover:underline">Terms of Use</Link> and <Link to="/privacy-policy" className="text-primary font-semibold hover:underline">Privacy Policy</Link>
                </p>
                <p className="text-slate-600 text-sm pt-1">
                  Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
                </p>
              </div>
            </form>
          </div>
        </motion.div>
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
