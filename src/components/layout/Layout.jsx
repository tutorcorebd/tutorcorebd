import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { LogOut, User, Menu, Send, Globe, Mail, Phone, ArrowRight, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';
import ScrollToTop from '../common/ScrollToTop';
import MobileBottomNav from './MobileBottomNav';

const Layout = () => {
  const { session, profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleMismatchModal, setShowRoleMismatchModal] = useState(false);

  useEffect(() => {
    const routeTitles = {
      '/': "Tutor Core | Country's #1 Tutor Matching Platform",
      '/find-tutors': "Find Best Tutors | Tutor Core",
      '/job-board': "Available Tuition Jobs | Tutor Core",
      '/categories': "Tutor Categories | Tutor Core",
      '/faq': "Frequently Asked Questions | Tutor Core",
      '/parent-faq': "Parent & Guardian FAQ | Tutor Core",
      '/tutor-faq': "Tutor FAQ & Guidelines | Tutor Core",
      '/terms-of-use': "Terms of Use | Tutor Core",
      '/privacy-policy': "Privacy Policy | Tutor Core",
      '/login': "Sign In | Tutor Core",
      '/register': "Register Account | Tutor Core",
    };

    const currentTitle = routeTitles[location.pathname] || "Tutor Core | Find Best Tutors in Bangladesh";
    document.title = currentTitle;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    
    const routeDescriptions = {
      '/': "Connect with thousands of verified experts across Bangladesh for home, online, or group tuition. Experience learning that guarantees results with Tutor Core.",
      '/find-tutors': "Search and hire verified tutors for school, college, university admission, coding, language courses, and arts. Find your perfect tutor today.",
      '/job-board': "Browse active tuition jobs and tutoring request boards across Bangladesh. Apply to become a home tutor or online instructor.",
      '/categories': "Explore diverse learning categories on Tutor Core including Bangla Medium, English Medium, Admission Test, Skill Development, and Arts.",
      '/faq': "Find answers to frequently asked questions about hiring a tutor, starting to teach, verification, fees, and safety rules on Tutor Core.",
      '/parent-faq': "Frequently asked questions for parents and guardians looking to hire a home or online tutor on Tutor Core.",
      '/tutor-faq': "Frequently asked questions for tutors, teachers, and instructors about joining Tutor Core, applying for jobs, and verification.",
      '/terms-of-use': "Read the terms of use and service agreement for using the Tutor Core platform as a tutor, parent, or guardian.",
      '/privacy-policy': "Learn about how Tutor Core collects, uses, and protects your personal information and account data.",
    };
    
    const currentDesc = routeDescriptions[location.pathname] || "Connect with thousands of verified experts across Bangladesh for home, online, or group tuition. Experience learning that guarantees results with Tutor Core.";
    metaDescription.setAttribute('content', currentDesc);

    // Update Open Graph & Twitter Titles / Descriptions
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', currentTitle);
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', currentDesc);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', currentTitle);

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', currentDesc);
  }, [location.pathname]);

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
                <span className="bg-primary text-white p-1 rounded-md">TC</span> Tutor Core
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 items-center">
              <Link to="/" className="text-slate-600 hover:text-primary font-medium">Home</Link>
              <Link to="/categories" className="text-slate-600 hover:text-primary font-medium">Categories</Link>
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
              <Link to="/categories" className="block px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 hover:text-primary rounded-md">Categories</Link>
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
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <Outlet key={location.pathname} context={{ setShowRoleMismatchModal }} />
      </main>

      {/* Footer */}
      <footer className="relative bg-slate-950 text-slate-450 pt-20 pb-10 border-t border-slate-900 overflow-hidden font-sans">
        
        {/* Glowing visual accents */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#86c240]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#86c240]/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Glowing top line border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#86c240]/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-16">
            
            {/* Column 1: Brand Info (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <Link to="/" className="text-2xl font-black text-white flex items-center gap-2 group w-fit">
                <span className="bg-[#86c240] text-white w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-lg shadow-[#86c240]/25 group-hover:scale-105 transition-transform duration-300">TC</span>
                <span className="tracking-tight text-white font-extrabold">Tutor <span className="text-[#86c240]">Core</span></span>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Tutor Core is Bangladesh's premier direct tutor matching platform. We connect student families with verified expert educators for customized home, online, and group learning environments.
              </p>
              
              {/* Contact Information */}
              <div className="space-y-3 pt-2 text-xs font-semibold text-slate-400">
                <a href="https://wa.me/8801785346691" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-[#86c240] transition-colors duration-200 group w-fit">
                  <div className="w-8 h-8 rounded-lg bg-slate-905 border border-slate-900 flex items-center justify-center group-hover:border-[#86c240] group-hover:bg-[#86c240]/5 transition-all">
                    <svg className="w-3.5 h-3.5 fill-current text-[#86c240]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.001 4.908A11.117 11.117 0 0012 2c-6.156 0-11.16 5.004-11.164 11.168 0 1.968.514 3.89 1.493 5.589L.15 24l5.37-.1.354-.21a11.1 11.1 0 005.588 1.488h.002C17.618 25.178 22.62 20.174 22.624 14a11.085 11.085 0 00-3.623-9.092zm-7.001 17.653h-.001a9.23 9.23 0 01-4.708-1.288l-.338-.201-3.499.092.934-3.412-.22-.35a9.215 9.215 0 01-1.413-4.914c.001-5.099 4.15-9.248 9.253-9.248 2.472 0 4.795.963 6.541 2.71a9.183 9.183 0 012.706 6.548c-.003 5.1-4.152 9.249-9.255 9.249zm5.172-6.994c-.284-.142-1.678-.828-1.937-.923-.259-.095-.448-.142-.636.142-.189.284-.73.923-.895 1.112-.165.189-.33.213-.614.071-.284-.142-1.198-.442-2.285-1.412-.845-.755-1.417-1.687-1.583-1.972-.165-.284-.018-.438.124-.579.128-.127.284-.33.426-.496.142-.165.189-.284.284-.473.095-.189.047-.355-.024-.497-.071-.142-.636-1.531-.871-2.096-.229-.554-.458-.478-.63-.487-.163-.008-.351-.01-.539-.01-.189 0-.496.071-.756.355-.26.284-.993.97-1.993 2.364 0 1.394 1.017 2.742 1.159 2.93 1.159 1.547 2.012 3.037 4.846 4.258.675.29 1.202.464 1.614.594.679.216 1.297.186 1.785.114.544-.08 1.678-.686 1.914-1.348.236-.662.236-1.23.165-1.348-.071-.118-.26-.189-.544-.331z"/>
                    </svg>
                  </div>
                  <span>+8801785346691</span>
                </a>
                <a href="mailto:tutorcorebd@gmail.com" className="flex items-center gap-3 hover:text-[#86c240] transition-colors duration-200 group w-fit">
                  <div className="w-8 h-8 rounded-lg bg-slate-905 border border-slate-900 flex items-center justify-center group-hover:border-[#86c240] group-hover:bg-[#86c240]/5 transition-all">
                    <Mail className="w-3.5 h-3.5 text-[#86c240]" />
                  </div>
                  <span>tutorcorebd@gmail.com</span>
                </a>
                <div className="flex items-center gap-3 group w-fit text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-slate-905 border border-slate-900 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-[#86c240]" />
                  </div>
                  <span>Dhaka, Bangladesh</span>
                </div>
              </div>
            </div>

            {/* Column 2: For Tutors (2 cols) */}
            <div className="lg:col-span-2 lg:col-start-6 space-y-5">
              <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">For Tutors</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li>
                  <button 
                    onClick={handleBecomeTutorClick}
                    className="text-slate-400 hover:text-[#86c240] hover:translate-x-1.5 transition-all duration-200 text-left font-medium w-full flex items-center gap-1.5 group"
                  >
                    <ArrowRight className="w-3 h-3 text-[#86c240] opacity-0 group-hover:opacity-100 transition-all" />
                    <span>Become a Tutor</span>
                  </button>
                </li>
                <li>
                  <Link to="/job-board" className="text-slate-400 hover:text-[#86c240] hover:translate-x-1.5 transition-all duration-200 flex items-center gap-1.5 group">
                    <ArrowRight className="w-3 h-3 text-[#86c240] opacity-0 group-hover:opacity-100 transition-all" />
                    <span>Find Tuitions</span>
                  </Link>
                </li>
                <li>
                  <Link to="/find-tutors" className="text-slate-400 hover:text-[#86c240] hover:translate-x-1.5 transition-all duration-200 flex items-center gap-1.5 group">
                    <ArrowRight className="w-3 h-3 text-[#86c240] opacity-0 group-hover:opacity-100 transition-all" />
                    <span>Browse Tutors</span>
                  </Link>
                </li>
                <li>
                  <Link to="/tutor-faq" className="text-slate-400 hover:text-[#86c240] hover:translate-x-1.5 transition-all duration-200 flex items-center gap-1.5 group">
                    <ArrowRight className="w-3 h-3 text-[#86c240] opacity-0 group-hover:opacity-100 transition-all" />
                    <span>Tutor FAQs</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: For Parents (2 cols) */}
            <div className="lg:col-span-2 space-y-5">
              <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">For Parents</h4>
              <ul className="space-y-3 text-sm font-medium">
                <li>
                  <Link to="/find-tutors" className="text-slate-400 hover:text-[#86c240] hover:translate-x-1.5 transition-all duration-200 flex items-center gap-1.5 group">
                    <ArrowRight className="w-3 h-3 text-[#86c240] opacity-0 group-hover:opacity-100 transition-all" />
                    <span>Hire a Tutor</span>
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={handlePostTuitionClick}
                    className="text-slate-400 hover:text-[#86c240] hover:translate-x-1.5 transition-all duration-200 text-left font-medium w-full flex items-center gap-1.5 group"
                  >
                    <ArrowRight className="w-3 h-3 text-[#86c240] opacity-0 group-hover:opacity-100 transition-all" />
                    <span>Post Tuition Request</span>
                  </button>
                </li>
                <li>
                  <Link to="/parent-faq" className="text-slate-400 hover:text-[#86c240] hover:translate-x-1.5 transition-all duration-200 flex items-center gap-1.5 group">
                    <ArrowRight className="w-3 h-3 text-[#86c240] opacity-0 group-hover:opacity-100 transition-all" />
                    <span>Parent FAQs</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter & Socials (3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              <div className="space-y-4">
                <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">Subscribe Us</h4>
                <p className="text-xs text-slate-405 font-medium leading-relaxed">Receive active job postings, study guides, and platform updates directly.</p>
                <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                  <input 
                    type="email" 
                    placeholder="Enter email"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-850 rounded-xl focus:outline-none focus:border-[#86c240] focus:ring-2 focus:ring-[#86c240]/10 text-xs text-white placeholder-slate-550 font-semibold transition-all"
                  />
                  <button type="submit" className="p-3 bg-[#86c240] hover:bg-[#6a9c31] text-white rounded-xl transition-colors shadow-md shadow-[#86c240]/15 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Social Channels */}
              <div className="space-y-3">
                <h5 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Connect with us</h5>
                <div className="flex space-x-3">
                  <a 
                    href="https://www.facebook.com/profile.php?id=61577836200027" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-850 hover:border-[#86c240] text-slate-400 hover:text-white flex items-center justify-center transition-all hover:scale-105 hover:bg-[#86c240]/5"
                    title="Facebook Page"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://wa.me/8801785346691" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-850 hover:border-[#86c240] text-slate-400 hover:text-white flex items-center justify-center transition-all hover:scale-105 hover:bg-[#86c240]/5"
                    title="WhatsApp"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.001 4.908A11.117 11.117 0 0012 2c-6.156 0-11.16 5.004-11.164 11.168 0 1.968.514 3.89 1.493 5.589L.15 24l5.37-.1.354-.21a11.1 11.1 0 005.588 1.488h.002C17.618 25.178 22.62 20.174 22.624 14a11.085 11.085 0 00-3.623-9.092zm-7.001 17.653h-.001a9.23 9.23 0 01-4.708-1.288l-.338-.201-3.499.092.934-3.412-.22-.35a9.215 9.215 0 01-1.413-4.914c.001-5.099 4.15-9.248 9.253-9.248 2.472 0 4.795.963 6.541 2.71a9.183 9.183 0 012.706 6.548c-.003 5.1-4.152 9.249-9.255 9.249zm5.172-6.994c-.284-.142-1.678-.828-1.937-.923-.259-.095-.448-.142-.636.142-.189.284-.73.923-.895 1.112-.165.189-.33.213-.614.071-.284-.142-1.198-.442-2.285-1.412-.845-.755-1.417-1.687-1.583-1.972-.165-.284-.018-.438.124-.579.128-.127.284-.33.426-.496.142-.165.189-.284.284-.473.095-.189.047-.355-.024-.497-.071-.142-.636-1.531-.871-2.096-.229-.554-.458-.478-.63-.487-.163-.008-.351-.01-.539-.01-.189 0-.496.071-.756.355-.26.284-.993.97-1.993 2.364 0 1.394 1.017 2.742 1.159 2.93 1.159 1.547 2.012 3.037 4.846 4.258.675.29 1.202.464 1.614.594.679.216 1.297.186 1.785.114.544-.08 1.678-.686 1.914-1.348.236-.662.236-1.23.165-1.348-.071-.118-.26-.189-.544-.331z"/>
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-850 hover:border-[#86c240] text-slate-400 hover:text-white flex items-center justify-center transition-all hover:scale-105 hover:bg-[#86c240]/5"
                    title="LinkedIn"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.23 0H1.77C.8 0 0 .774 0 1.729v20.542C0 23.227.8 24 1.77 24h20.46c.98 0 1.77-.773 1.77-1.729V1.73C24 .774 23.2 0 22.222 0h.008zM7.12 20.452H3.558V9H7.12v11.452zM5.339 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm15.113 13.019h-3.554V14.86c0-1.333-.027-3.045-1.855-3.045-1.857 0-2.14 1.45-2.14 2.95v5.687h-3.554V9h3.409v1.561h.049c.474-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286z"/>
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-850 hover:border-[#86c240] text-slate-400 hover:text-white flex items-center justify-center transition-all hover:scale-105 hover:bg-[#86c240]/5"
                    title="YouTube"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Tutor Core. All rights reserved.
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
      <MobileBottomNav />
      <ScrollToTop />
    </div>
  );
};

export default Layout;
