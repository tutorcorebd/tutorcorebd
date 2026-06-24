import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import useAuthStore from './store/useAuthStore';
import Layout from './components/layout/Layout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public Pages (Asynchronously Loaded)
const Home = lazy(() => import('./pages/public/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));
const TermsOfUse = lazy(() => import('./pages/public/TermsOfUse'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const FAQ = lazy(() => import('./pages/public/FAQ'));
const ParentFAQ = lazy(() => import('./pages/public/ParentFAQ'));
const TutorFAQ = lazy(() => import('./pages/public/TutorFAQ'));
const JobBoard = lazy(() => import('./pages/public/JobBoard'));
const FindTutors = lazy(() => import('./pages/public/FindTutors'));
const PublicTutorProfile = lazy(() => import('./pages/public/PublicTutorProfile'));
const TuitionDetails = lazy(() => import('./pages/public/TuitionDetails'));
const Categories = lazy(() => import('./pages/public/Categories'));

// Tutor Pages (Asynchronously Loaded)
const TutorDashboard = lazy(() => import('./pages/tutor/TutorDashboard'));
const TutorProfileForm = lazy(() => import('./pages/tutor/TutorProfileForm'));
const TutorProfileView = lazy(() => import('./pages/tutor/TutorProfileView'));
const TutorTuitions = lazy(() => import('./pages/tutor/TutorTuitions'));
const TutorialVideos = lazy(() => import('./pages/tutor/TutorialVideos'));
const TutoringHistory = lazy(() => import('./pages/tutor/TutoringHistory'));
const MyPayment = lazy(() => import('./pages/tutor/MyPayment'));
const ConfirmationLetter = lazy(() => import('./pages/tutor/ConfirmationLetter'));
const AffiliatePartner = lazy(() => import('./pages/tutor/AffiliatePartner'));
const MembershipPlan = lazy(() => import('./pages/tutor/MembershipPlan'));
const PremiumRequest = lazy(() => import('./pages/tutor/PremiumRequest'));
const VerificationRequest = lazy(() => import('./pages/tutor/VerificationRequest'));
const MyBatches = lazy(() => import('./pages/tutor/MyBatches'));
const JoinCommunity = lazy(() => import('./pages/tutor/JoinCommunity'));
const HelpSupport = lazy(() => import('./pages/tutor/HelpSupport'));
const Settings = lazy(() => import('./pages/tutor/Settings'));

// Guardian Pages (Asynchronously Loaded)
const GuardianDashboard = lazy(() => import('./pages/guardian/GuardianDashboard'));
const PostRequest = lazy(() => import('./pages/guardian/PostRequest'));
const EditRequest = lazy(() => import('./pages/guardian/EditRequest'));
const GuardianProfileForm = lazy(() => import('./pages/guardian/GuardianProfileForm'));
const GuardianSettings = lazy(() => import('./pages/guardian/Settings'));
const GuardianFeedback = lazy(() => import('./pages/guardian/GuardianFeedback'));

// Admin Pages (Asynchronously Loaded)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAssignmentHub = lazy(() => import('./pages/admin/AdminAssignmentHub'));
const AdminTutorials = lazy(() => import('./pages/admin/AdminTutorials'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminNotices = lazy(() => import('./pages/admin/AdminNotices'));
const AdminMembership = lazy(() => import('./pages/admin/AdminMembership'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminInstitutions = lazy(() => import('./pages/admin/AdminInstitutions'));
const AdminFeedbacks = lazy(() => import('./pages/admin/AdminFeedbacks'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));

let isCheckingSession = false;
let lastSessionCheckTime = 0;

const checkAndRefreshSessionSafe = async () => {
  const now = Date.now();
  // Throttle to at most once every 5 seconds to avoid network spam and race conditions
  if (now - lastSessionCheckTime < 5000) {
    return;
  }
  
  if (isCheckingSession) return;
  isCheckingSession = true;
  lastSessionCheckTime = now;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const expiresAt = session.expires_at; // unix timestamp in seconds
      const nowSecs = Math.floor(now / 1000);
      if (expiresAt - nowSecs < 600) { // less than 10 minutes remaining
        console.log('Session close to expiry or expired, refreshing safely...');
        await supabase.auth.refreshSession();
      }
    }
  } catch (err) {
    console.error('Safe session check/refresh error:', err);
  } finally {
    isCheckingSession = false;
  }
};

function SessionRefresher() {
  const location = useLocation();

  useEffect(() => {
    // Refresh Supabase session on navigation to prevent RLS query drops
    checkAndRefreshSessionSafe();
  }, [location.pathname]);

  return null;
}

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();

    // Check and refresh session when tab becomes visible or goes back online
    const verifyAndRecoverSession = async () => {
      if (document.visibilityState === 'visible') {
        console.log('App state focus/visibility recovery check...');
        await checkAndRefreshSessionSafe();
      }
    };

    document.addEventListener('visibilitychange', verifyAndRecoverSession);
    window.addEventListener('online', verifyAndRecoverSession);

    return () => {
      document.removeEventListener('visibilitychange', verifyAndRecoverSession);
      window.removeEventListener('online', verifyAndRecoverSession);
    };
  }, [initialize]);

  return (
    <Router>
      <SessionRefresher />
      <Suspense fallback={
        <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 text-slate-400 font-bold text-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#86c240] mb-3"></div>
          Loading page...
        </div>
      }>
        <Routes>
          {/* Public Routes with standard Header/Footer Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms-of-use" element={<TermsOfUse />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/parent-faq" element={<ParentFAQ />} />
            <Route path="/tutor-faq" element={<TutorFAQ />} />
            <Route path="/job-board" element={<JobBoard />} />
            <Route path="/find-tutors" element={<FindTutors />} />
            <Route path="/tutor/:id" element={<PublicTutorProfile />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/tuition/:id" element={<TuitionDetails />} />
          </Route>

          {/* Standalone Admin Login Route (No Header/Footer) */}
          <Route path="/admin" element={<AdminLogin />} />

          {/* Dashboard Layout Routes */}
          <Route element={<DashboardLayout />}>
            {/* Tutor Routes */}
            <Route element={<ProtectedRoute allowedRoles={['tutor']} />}>
              <Route path="/tutor/dashboard" element={<TutorDashboard />} />
              <Route path="/tutor/tuitions" element={<TutorTuitions />} />
              <Route path="/tutor/tutorials" element={<TutorialVideos />} />
              <Route path="/tutor/profile" element={<TutorProfileView />} />
              <Route path="/tutor/profile/view" element={<TutorProfileView />} />
              <Route path="/tutor/profile/update" element={<TutorProfileForm />} />
              <Route path="/tutor/history" element={<TutoringHistory />} />
              <Route path="/tutor/payment" element={<MyPayment />} />
              <Route path="/tutor/confirmation-letter" element={<ConfirmationLetter />} />
              <Route path="/tutor/affiliate" element={<AffiliatePartner />} />
              <Route path="/tutor/membership" element={<MembershipPlan />} />
              <Route path="/tutor/premium-request" element={<PremiumRequest />} />
              <Route path="/tutor/verification" element={<VerificationRequest />} />
              <Route path="/tutor/batches" element={<MyBatches />} />
              <Route path="/tutor/community" element={<JoinCommunity />} />
              <Route path="/tutor/support" element={<HelpSupport />} />
              <Route path="/tutor/settings" element={<Settings />} />
            </Route>

            {/* Guardian & Admin Shared Posting Routes */}
            <Route element={<ProtectedRoute allowedRoles={['guardian', 'admin']} />}>
              <Route path="/guardian/post-request" element={<PostRequest />} />
              <Route path="/guardian/edit-request/:id" element={<EditRequest />} />
            </Route>

            {/* Guardian Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['guardian']} />}>
              <Route path="/guardian/dashboard" element={<GuardianDashboard />} />
              <Route path="/guardian/feedback" element={<GuardianFeedback />} />
              <Route path="/guardian/profile" element={<GuardianProfileForm />} />
              <Route path="/guardian/support" element={<HelpSupport />} />
              <Route path="/guardian/settings" element={<GuardianSettings />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/requests" element={<AdminAssignmentHub />} />
              <Route path="/admin/tutorials" element={<AdminTutorials />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/membership" element={<AdminMembership />} />
              <Route path="/admin/notices" element={<AdminNotices />} />
              <Route path="/admin/support" element={<AdminSupport />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/institutions" element={<AdminInstitutions />} />
              <Route path="/admin/feedbacks" element={<AdminFeedbacks />} />
              <Route path="/admin/reports" element={<AdminReports />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
