import { Outlet, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { LogOut, User, Menu, Send, Globe, Mail, Phone, ArrowRight, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import ScrollToTop from '../common/ScrollToTop';

const Layout = () => {
  const { session, profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleMismatchModal, setShowRoleMismatchModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleBecomeTutorClick = (e) => {
    if (!session) {
      navigate('/register?role=tutor');
    } else if (profile?.role === 'tutor') {
      navigate('/tutor/dashboard');
    } else if (profile?.role === 'guardian') {
      e.preventDefault();
      setShowRoleMismatchModal(true);
    }
  };

  const handlePostTuitionClick = (e) => {
    if (session && profile?.role === 'guardian') {
      navigate('/guardian/post-request');
    } else if (!session) {
      navigate('/register?redirectTo=/guardian/post-request');
    } else {
      navigate(profile?.role === 'admin' ? '/admin/dashboard' : '/tutor/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
                <span className="bg-primary text-white p-1 rounded-md">TC</span> TutorCore
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 items-center">
              <Link to="/" className="text-slate-600 hover:text-primary font-medium">Home</Link>
              <Link to="/job-board" className="text-slate-600 hover:text-primary font-medium">Find Tuitions</Link>
              <Link to="/find-tutors" className="text-slate-600 hover:text-primary font-medium">Find Tutors</Link>
              <Link to="/faq" className="text-slate-600 hover:text-primary font-medium">FAQ</Link>
              
              {!session ? (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-primary font-medium hover:text-primary-dark">Log in</Link>
                  <Link to="/register" className="btn-primary">Sign up</Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    to={profile?.role === 'admin' ? '/admin/dashboard' : profile?.role === 'tutor' ? '/tutor/dashboard' : '/guardian/dashboard'} 
                    className="flex items-center text-slate-700 hover:text-primary font-medium"
                  >
                    <User className="w-5 h-5 mr-1" />
                    Dashboard
                  </Link>
                  <button onClick={handleSignOut} className="text-red-500 hover:text-red-700 flex items-center">
                    <LogOut className="w-5 h-5 mr-1" />
                    Logout
                  </button>
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-600 hover:text-primary focus:outline-none"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="block px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 hover:text-primary rounded-md">Home</Link>
              <Link to="/job-board" className="block px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 hover:text-primary rounded-md">Find Tuitions</Link>
              <Link to="/find-tutors" className="block px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 hover:text-primary rounded-md">Find Tutors</Link>
              <Link to="/faq" className="block px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 hover:text-primary rounded-md">FAQ</Link>
              
              {!session ? (
                <>
                  <Link to="/login" className="block px-3 py-2 text-primary font-medium hover:bg-slate-50 rounded-md">Log in</Link>
                  <Link to="/register" className="block px-3 py-2 text-primary font-medium hover:bg-slate-50 rounded-md">Sign up</Link>
                </>
              ) : (
                <>
                  <Link 
                    to={profile?.role === 'admin' ? '/admin/dashboard' : profile?.role === 'tutor' ? '/tutor/dashboard' : '/guardian/dashboard'} 
                    className="block px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 hover:text-primary rounded-md"
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleSignOut} 
                    className="block w-full text-left px-3 py-2 text-red-500 font-medium hover:bg-slate-50 rounded-md"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet context={{ setShowRoleMismatchModal }} />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="bg-[#86c240] text-white p-1 rounded-md text-sm font-black">TC</span> TutorCore
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                TutorCore connects students with premium, verified home and online educators. Making teaching and learning highly collaborative, safe, and effective.
              </p>
              {/* Social Icons */}
              <div className="flex space-x-3 pt-2">
                {/* Facebook */}
                <a 
                  href="https://www.facebook.com/profile.php?id=61577836200027" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:border-[#86c240] hover:text-[#86c240] flex items-center justify-center transition-all hover:scale-110"
                  title="Facebook Page"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                
                {/* Whatsapp */}
                <a 
                  href="https://wa.me/+8801785346691" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:border-[#86c240] hover:text-[#86c240] flex items-center justify-center transition-all hover:scale-110"
                  title="Whatsapp Contact"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.001 4.908A11.117 11.117 0 0012 2c-6.156 0-11.16 5.004-11.164 11.168 0 1.968.514 3.89 1.493 5.589L.15 24l5.37-.1.354-.21a11.1 11.1 0 005.588 1.488h.002C17.618 25.178 22.62 20.174 22.624 14a11.085 11.085 0 00-3.623-9.092zm-7.001 17.653h-.001a9.23 9.23 0 01-4.708-1.288l-.338-.201-3.499.092.934-3.412-.22-.35a9.215 9.215 0 01-1.413-4.914c.001-5.099 4.15-9.248 9.253-9.248 2.472 0 4.795.963 6.541 2.71a9.183 9.183 0 012.706 6.548c-.003 5.1-4.152 9.249-9.255 9.249zm5.172-6.994c-.284-.142-1.678-.828-1.937-.923-.259-.095-.448-.142-.636.142-.189.284-.73.923-.895 1.112-.165.189-.33.213-.614.071-.284-.142-1.198-.442-2.285-1.412-.845-.755-1.417-1.687-1.583-1.972-.165-.284-.018-.438.124-.579.128-.127.284-.33.426-.496.142-.165.189-.284.284-.473.095-.189.047-.355-.024-.497-.071-.142-.636-1.531-.871-2.096-.229-.554-.458-.478-.63-.487-.163-.008-.351-.01-.539-.01-.189 0-.496.071-.756.355-.26.284-.993.97-1.993 2.364 0 1.394 1.017 2.742 1.159 2.93 1.159 1.547 2.012 3.037 4.846 4.258.675.29 1.202.464 1.614.594.679.216 1.297.186 1.785.114.544-.08 1.678-.686 1.914-1.348.236-.662.236-1.23.165-1.348-.071-.118-.26-.189-.544-.331z"/>
                  </svg>
                </a>

                {/* Youtube */}
                <a 
                  href="#" 
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:border-[#86c240] hover:text-[#86c240] flex items-center justify-center transition-all hover:scale-110"
                  title="Youtube Channel"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                {/* LinkedIn */}
                <a 
                  href="#" 
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:border-[#86c240] hover:text-[#86c240] flex items-center justify-center transition-all hover:scale-110"
                  title="LinkedIn Profile"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.23 0H1.77C.8 0 0 .774 0 1.729v20.542C0 23.227.8 24 1.77 24h20.46c.98 0 1.77-.773 1.77-1.729V1.73C24 .774 23.2 0 22.222 0h.008zM7.12 20.452H3.558V9H7.12v11.452zM5.339 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm15.113 13.019h-3.554V14.86c0-1.333-.027-3.045-1.855-3.045-1.857 0-2.14 1.45-2.14 2.95v5.687h-3.554V9h3.409v1.561h.049c.474-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a 
                  href="#" 
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:border-[#86c240] hover:text-[#86c240] flex items-center justify-center transition-all hover:scale-110"
                  title="Instagram Page"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204 0 3.583.07 4.849.149 3.227 1.664 4.771 4.919 4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col gap-2.5 pt-2 text-xs font-semibold text-slate-400">
                <a href="tel:+8801785346691" className="flex items-center gap-2 hover:text-[#86c240] transition-colors">
                  <Phone className="w-4 h-4 text-[#86c240]" />
                  <span>+8801785346691</span>
                </a>
              </div>
            </div>

            {/* Column 2: Tutors links */}
            <div className="space-y-4">
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">For Tutors</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <button 
                    onClick={handleBecomeTutorClick}
                    className="hover:text-[#86c240] transition-colors text-left font-medium w-full"
                  >
                    Become a Tutor
                  </button>
                </li>
                <li><Link to="/job-board" className="hover:text-[#86c240] transition-colors">Find Tuitions</Link></li>
                <li><Link to="/find-tutors" className="hover:text-[#86c240] transition-colors">Find Tutors</Link></li>
                <li><Link to="/tutor-faq" className="hover:text-[#86c240] transition-colors">Tutor FAQ</Link></li>
                <li><a href="#" className="hover:text-[#86c240] transition-colors">Guidelines</a></li>
              </ul>
            </div>

            {/* Column 3: Parents links */}
            <div className="space-y-4">
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">For Parents</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li><Link to="/find-tutors" className="hover:text-[#86c240] transition-colors">Hire a Tutor</Link></li>
                <li>
                  <button 
                    onClick={handlePostTuitionClick}
                    className="hover:text-[#86c240] transition-colors text-left font-medium w-full"
                  >
                    Post Tuition Request
                  </button>
                </li>
                <li><Link to="/parent-faq" className="hover:text-[#86c240] transition-colors">Parent FAQ</Link></li>
                <li><a href="#" className="hover:text-[#86c240] transition-colors">Safety Rules</a></li>
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div className="space-y-4">
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">Subscribe Us</h4>
              <p className="text-sm text-slate-400 font-medium">Keep up to date with new job postings and study guides.</p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Enter email"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#86c240] text-sm text-white placeholder-slate-500 font-medium"
                />
                <button type="submit" className="p-2.5 bg-[#86c240] hover:bg-[#6a9c31] text-white rounded-xl transition-colors shadow-md shadow-[#86c240]/10 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} TutorCore. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link to="/terms-of-use" className="hover:text-white transition-colors">Terms of Use</Link>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
      {/* Role Mismatch Warning Modal */}
      {showRoleMismatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Action Restricted</h3>
            <p className="text-sm font-medium text-slate-500 mb-6 px-2">
              You are currently signed in as a Parent/Guardian. To become a tutor, please log out first and register/login with a tutor account.
            </p>
            <div className="w-full space-y-3">
              <button
                onClick={async () => {
                  setShowRoleMismatchModal(false);
                  await signOut();
                  navigate('/register?role=tutor');
                }}
                className="w-full bg-[#86c240] hover:bg-[#6a9c31] text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition-colors shadow-md shadow-[#86c240]/10"
              >
                Log Out & Sign Up as Tutor
              </button>
              <button
                onClick={() => setShowRoleMismatchModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3.5 px-4 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <ScrollToTop />
    </div>
  );
};

export default Layout;
