import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { 
  LayoutDashboard, 
  Search, 
  Briefcase, 
  UserCheck, 
  DollarSign, 
  Settings, 
  Video, 
  Menu, 
  X, 
  Globe, 
  ChevronDown, 
  LogOut,
  Users,
  User,
  PlusCircle,
  FileText,
  HelpCircle,
  Shield,
  Home,
  LayoutGrid,
  Archive,
  CreditCard,
  Mail,
  Share2,
  ShieldCheck,
  Award,
  CheckCircle,
  Presentation
} from 'lucide-react';

const DashboardLayout = () => {
  const { profile, signOut } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ 'My Profile': true });
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const getMenuId = () => {
    if (!profile) return 'ID: ------';
    const prefix = profile.role === 'admin' ? 'A' : profile.role === 'guardian' ? 'G' : 'T';
    const shortId = profile.id ? profile.id.substring(0, 6).toUpperCase() : '------';
    return `${profile.role === 'admin' ? 'Admin' : profile.role === 'guardian' ? 'Guardian' : 'Tutor'} ID : ${prefix}${shortId}`;
  };

  const menuItems = {
    tutor: [
      { name: 'Dashboard', path: '/tutor/dashboard', icon: Home },
      { name: 'Find Tuitions', path: '/tutor/tuitions', icon: LayoutGrid },
      { 
        name: 'My Profile', 
        path: '/tutor/profile', 
        icon: Users,
        subItems: [
          { name: 'View Profile', path: '/tutor/profile/view' },
          { name: 'Update Profile', path: '/tutor/profile/update' }
        ]
      },
      { name: 'Tutoring History', path: '/tutor/history', icon: Archive },
      { name: 'My Payment', path: '/tutor/payment', icon: CreditCard },
      { name: 'Confirmation Letter', path: '/tutor/confirmation-letter', icon: Mail },
      { name: 'Affiliate Partner', path: '/tutor/affiliate', icon: Share2 },
      { name: 'Membership Plan', path: '/tutor/membership', icon: ShieldCheck },
      { name: 'Premium Request', path: '/tutor/premium-request', icon: Award },
      { name: 'Verification Request', path: '/tutor/verification', icon: CheckCircle },
      { name: 'My Batches', path: '/tutor/batches', icon: Presentation },
      { name: 'Join Community', path: '/tutor/community', icon: Globe },
      { name: 'Settings', path: '/tutor/settings', icon: Settings },
    ],
    guardian: [
      { name: 'Dashboard', path: '/guardian/dashboard', icon: LayoutDashboard },
      { name: 'Post A Tuition', path: '/guardian/post-request', icon: PlusCircle },
      { name: 'Find Tutors', path: '/find-tutors', icon: Search },
      { name: 'My Profile', path: '/guardian/profile', icon: User },
      { name: 'Settings', path: '/guardian/settings', icon: Settings },
    ],
    admin: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Assignment Hub', path: '/admin/requests', icon: Shield },
      { name: 'Tutorial Management', path: '/admin/tutorials', icon: Video },
      { name: 'Settings', path: '/admin/settings', icon: Settings },
    ]
  };

  const role = profile?.role || 'tutor';
  const currentMenuItems = menuItems[role] || menuItems.tutor;

  // Modern default avatar placeholder with initial
  const userInitial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-100 h-16 fixed top-0 right-0 left-0 lg:left-64 z-30 flex items-center justify-between px-6 transition-all duration-300">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            System Live
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Language Selector */}
          <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#86c240] transition-colors">
            <Globe className="w-4 h-4 text-slate-400" />
            English
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#eaf4df] border border-[#86c240]/30 flex items-center justify-center text-[#86c240] font-bold text-sm">
                {userInitial}
              </div>
              <span className="text-sm font-bold text-slate-700 hidden sm:block">
                {profile?.full_name || 'User'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-40">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-xs text-slate-400 font-semibold">Logged in as</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{profile?.full_name || 'User'}</p>
                </div>
                <Link 
                  to={role === 'tutor' ? '/tutor/profile' : role === 'guardian' ? '/guardian/profile' : '/admin/settings'} 
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  My Profile
                </Link>
                <button 
                  onClick={handleSignOut} 
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 z-50 transform lg:transform-none transition-transform duration-300 flex flex-col justify-between ${sidebarOpen ? 'translate-x-0' : '-translate-x-0 lg:translate-x-0'} ${!sidebarOpen && '-translate-x-full'}`}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
          {/* Logo and Brand */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-50">
            <Link to="/" className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="bg-[#86c240] text-white p-1 rounded-lg text-sm font-black">TT</span> 
              <span>Tuition<span className="text-[#86c240]">Terminal</span></span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info Section */}
          <div className="p-6 flex flex-col items-center border-b border-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-50/20 via-transparent to-transparent">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-[#eaf4df] bg-slate-50 flex items-center justify-center text-[#86c240] text-3xl font-bold shadow-sm relative overflow-hidden">
                {userInitial}
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#86c240] rounded-full border-2 border-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </div>
            </div>
            <h3 className="mt-3 font-bold text-slate-800 text-base">{profile?.full_name || 'Tushar'}</h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{profile?.phone_number || profile?.email || 'email@example.com'}</p>
            <span className="mt-2.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold tracking-wide uppercase border border-slate-200/50">
              {getMenuId()}
            </span>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            {currentMenuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname + location.hash === item.path || (item.subItems && item.subItems.some(sub => location.pathname === sub.path));
              const isExpanded = expandedMenus[item.name];

              const toggleMenu = (e) => {
                if (item.subItems) {
                  e.preventDefault();
                  setExpandedMenus(prev => ({ ...prev, [item.name]: !prev[item.name] }));
                } else {
                  setSidebarOpen(false);
                }
              };

              return (
                <div key={idx}>
                  <Link
                    to={item.path}
                    onClick={toggleMenu}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive && !item.subItems ? 'bg-[#86c240] text-white shadow-md shadow-[#86c240]/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive && !item.subItems ? 'text-white' : 'text-slate-400'}`} />
                      {item.name}
                    </div>
                    {item.subItems && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </Link>
                  
                  {item.subItems && isExpanded && (
                    <div className="mt-1 ml-4 border-l-2 border-slate-100 pl-2 space-y-1">
                      {item.subItems.map((subItem, subIdx) => {
                        const isSubActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subIdx}
                            to={subItem.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`block px-4 py-2 text-xs font-bold rounded-lg transition-colors relative ${
                              isSubActive 
                                ? 'text-[#86c240] bg-green-50/50' 
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isSubActive && (
                              <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-1 h-4 bg-[#86c240] rounded-r-full"></div>
                            )}
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-50">
          <Link 
            to="/tutor/tutorials"
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors shadow-sm"
          >
            <Video className="w-4 h-4 text-slate-400" />
            Watch Tutorial
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:pl-64 pt-16 flex-grow flex flex-col min-h-screen transition-all duration-300">
        <div className="p-6 md:p-8 flex-grow">
          <Outlet />
        </div>
        {/* Footer inside Dashboard */}
        <footer className="bg-white border-t border-slate-100 py-4 px-8 text-center text-xs text-slate-400 font-semibold flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>&copy; {new Date().getFullYear()} TutorCore. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/terms-of-use" className="hover:text-[#86c240]">Terms of Use</Link>
            <Link to="/privacy-policy" className="hover:text-[#86c240]">Privacy Policy</Link>
          </div>
        </footer>
      </main>

    </div>
  );
};

export default DashboardLayout;
