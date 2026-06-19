import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import useAuthStore from './store/useAuthStore';
import Layout from './components/layout/Layout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Placeholder Pages (To be implemented)
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminLogin from './pages/auth/AdminLogin';
import TermsOfUse from './pages/public/TermsOfUse';
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import FAQ from './pages/public/FAQ';
import ParentFAQ from './pages/public/ParentFAQ';
import TutorFAQ from './pages/public/TutorFAQ';
import JobBoard from './pages/public/JobBoard';
import FindTutors from './pages/public/FindTutors';
import PublicTutorProfile from './pages/public/PublicTutorProfile';
import TuitionDetails from './pages/public/TuitionDetails';

// Tutor Pages
import TutorDashboard from './pages/tutor/TutorDashboard';
import TutorProfileForm from './pages/tutor/TutorProfileForm';
import TutorProfileView from './pages/tutor/TutorProfileView';
import TutorTuitions from './pages/tutor/TutorTuitions';
import TutorialVideos from './pages/tutor/TutorialVideos';
import TutoringHistory from './pages/tutor/TutoringHistory';
import MyPayment from './pages/tutor/MyPayment';
import ConfirmationLetter from './pages/tutor/ConfirmationLetter';
import AffiliatePartner from './pages/tutor/AffiliatePartner';
import MembershipPlan from './pages/tutor/MembershipPlan';
import PremiumRequest from './pages/tutor/PremiumRequest';
import VerificationRequest from './pages/tutor/VerificationRequest';
import MyBatches from './pages/tutor/MyBatches';
import JoinCommunity from './pages/tutor/JoinCommunity';
import HelpSupport from './pages/tutor/HelpSupport';
import Settings from './pages/tutor/Settings';

// Guardian Pages
import GuardianDashboard from './pages/guardian/GuardianDashboard';
import PostRequest from './pages/guardian/PostRequest';
import EditRequest from './pages/guardian/EditRequest';
import GuardianProfileForm from './pages/guardian/GuardianProfileForm';
import GuardianSettings from './pages/guardian/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAssignmentHub from './pages/admin/AdminAssignmentHub';
import AdminTutorials from './pages/admin/AdminTutorials';
import AdminUsers from './pages/admin/AdminUsers';
import AdminNotices from './pages/admin/AdminNotices';
import AdminMembership from './pages/admin/AdminMembership';
import AdminSupport from './pages/admin/AdminSupport';

function SessionRefresher() {
  const location = useLocation();

  useEffect(() => {
    // Refresh Supabase session on navigation to prevent RLS query drops
    const refreshSession = async () => {
      try {
        await supabase.auth.getSession();
      } catch (err) {
        console.error('Session refresh error on navigation:', err);
      }
    };
    refreshSession();
  }, [location.pathname]);

  return null;
}

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <SessionRefresher />
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

          {/* Guardian Routes */}
          <Route element={<ProtectedRoute allowedRoles={['guardian']} />}>
            <Route path="/guardian/dashboard" element={<GuardianDashboard />} />
            <Route path="/guardian/post-request" element={<PostRequest />} />
            <Route path="/guardian/edit-request/:id" element={<EditRequest />} />
            <Route path="/guardian/profile" element={<GuardianProfileForm />} />
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
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
