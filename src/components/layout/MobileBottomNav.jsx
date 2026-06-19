import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { 
  Home, 
  Briefcase, 
  Users, 
  LayoutGrid, 
  SquarePen, 
  User, 
  X,
  LayoutDashboard,
  LogOut,
  Settings,
  CreditCard,
  Video,
  Shield,
  Megaphone,
  CheckCircle,
  Award,
  Globe,
  Presentation,
  Archive,
  Search,
  PlusCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, profile, signOut } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Hide bottom nav when keyboard is open (to avoid covering inputs)
  useEffect(() => {
    const handleResize = () => {
      // Basic heuristic: if height shrinks significantly, keyboard might be open
      if (window.innerHeight < 500) {
        setIsKeyboardOpen(true);
      } else {
        setIsKeyboardOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    setDrawerOpen(false);
    await signOut();
  };

  const isActive = (path) => {
    // Exact match for Home, otherwise prefix match for sections
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const role = profile?.role || null;
  const isAuth = !!session;

  // Determine Tab 1 (Auth) icon and target
  let authIcon = SquarePen;
  let authTarget = '/login';
  let authLabel = 'Sign In';

  if (isAuth) {
    authIcon = User;
    if (role === 'admin') {
      authTarget = '/admin/dashboard';
      authLabel = 'Dashboard';
    } else if (role === 'tutor') {
      authTarget = '/tutor/dashboard'; // Or /tutor/profile
      authLabel = 'Dashboard';
    } else if (role === 'guardian') {
      authTarget = '/guardian/dashboard';
      authLabel = 'Dashboard';
    } else {
      authTarget = '/';
      authLabel = 'Profile';
    }
  }

  // Drawer Menu Links definitions based on role
  const getDrawerLinks = () => {
    if (!isAuth) {
      return [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Find Tuitions', path: '/job-board', icon: Briefcase },
        { name: 'Find Tutors', path: '/find-tutors', icon: Users },
        { name: 'FAQ', path: '/faq', icon: HelpCircle },
        { name: 'Log In', path: '/login', icon: SquarePen },
        { name: 'Sign Up', path: '/register', icon: User },
      ];
    }

    if (role === 'tutor') {
      return [
        { name: 'Dashboard', path: '/tutor/dashboard', icon: LayoutDashboard },
        { name: 'Find Tuitions', path: '/tutor/tuitions', icon: LayoutGrid },
        { name: 'My Profile', path: '/tutor/profile', icon: Users },
        { name: 'Tutoring History', path: '/tutor/history', icon: Archive },
        { name: 'My Payment', path: '/tutor/payment', icon: CreditCard },
        { name: 'Membership Plan', path: '/tutor/membership', icon: ShieldCheck },
        { name: 'Premium Request', path: '/tutor/premium-request', icon: Award },
        { name: 'Verification Request', path: '/tutor/verification', icon: CheckCircle },
        { name: 'My Batches', path: '/tutor/batches', icon: Presentation },
        { name: 'Join Community', path: '/tutor/community', icon: Globe },
        { name: 'Settings', path: '/tutor/settings', icon: Settings },
      ];
    }

    if (role === 'guardian') {
      return [
        { name: 'Dashboard', path: '/guardian/dashboard', icon: LayoutDashboard },
        { name: 'Post A Tuition', path: '/guardian/post-request', icon: PlusCircle },
        { name: 'Find Tutors', path: '/find-tutors', icon: Search },
        { name: 'My Profile', path: '/guardian/profile', icon: User },
        { name: 'Settings', path: '/guardian/settings', icon: Settings },
      ];
    }

    if (role === 'admin') {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Assignment Hub', path: '/admin/requests', icon: Shield },
        { name: 'User Management', path: '/admin/users', icon: Users },
        { name: 'Membership Management', path: '/admin/membership', icon: ShieldCheck },
        { name: 'Notice Board', path: '/admin/notices', icon: Megaphone },
        { name: 'Tutorial Management', path: '/admin/tutorials', icon: Video },
      ];
    }

    return [];
  };

  const drawerLinks = getDrawerLinks();

  if (isKeyboardOpen) return null;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[45] bg-white border-t border-slate-200/80 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden safe-area-bottom">
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          
          {/* Tab 1: Auth / Profile */}
          {(() => {
            const AuthIcon = authIcon;
            return (
              <Link 
                to={authTarget}
                className={`flex flex-col items-center justify-center space-y-1 ${isActive(authTarget) ? 'text-[#86c240]' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <AuthIcon className="w-6 h-6" />
                <span className="text-[10px] font-bold">{authLabel}</span>
              </Link>
            );
          })()}

          {/* Tab 2: Jobs */}
          <Link 
            to="/job-board"
            className={`flex flex-col items-center justify-center space-y-1 ${isActive('/job-board') ? 'text-[#86c240]' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Briefcase className="w-6 h-6" />
            <span className="text-[10px] font-bold">Jobs</span>
          </Link>

          {/* Tab 3: Home */}
          <Link 
            to="/"
            className={`flex flex-col items-center justify-center space-y-1 ${isActive('/') ? 'text-[#86c240]' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold">Home</span>
          </Link>

          {/* Tab 4: Tutors */}
          <Link 
            to="/find-tutors"
            className={`flex flex-col items-center justify-center space-y-1 ${isActive('/find-tutors') ? 'text-[#86c240]' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-bold">Tutors</span>
          </Link>

          {/* Tab 5: Menu */}
          <button 
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center justify-center space-y-1 focus:outline-none ${drawerOpen ? 'text-[#86c240]' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <LayoutGrid className="w-6 h-6" />
            <span className="text-[10px] font-bold">Menu</span>
          </button>

        </div>
      </nav>

      {/* Slide-up Drawer Modal */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] md:hidden transition-opacity"
            onClick={() => setDrawerOpen(false)}
          ></div>
          
          {/* Drawer Content */}
          <div className="fixed bottom-0 left-0 right-0 z-[55] bg-white rounded-t-3xl shadow-2xl md:hidden animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="text-base font-black text-slate-800">Menu</h3>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-2 pb-8">
              {isAuth && profile && (
                <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#eaf4df] text-[#86c240] flex items-center justify-center font-bold text-lg">
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{profile.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500 font-medium capitalize">{role}</p>
                  </div>
                </div>
              )}

              {drawerLinks.map((link, idx) => {
                const Icon = link.icon;
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={idx}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-[#eaf4df] text-[#86c240]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-[#86c240]' : 'text-slate-400'}`} />
                    {link.name}
                  </Link>
                );
              })}

              {isAuth && (
                <>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-5 h-5 text-red-400" />
                    Log Out
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileBottomNav;
